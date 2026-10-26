// controllers/bookingController.js
// Create, list, reschedule, cancel and delete bookings.
// Members only see and change their own bookings; admins see and manage all of them.

const mongoose = require("mongoose");
const Booking = require("../models/Booking");
const Space = require("../models/Space");
const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");
const httpError = require("../utils/httpError");
const { escapeRegex, getPagination, paginationInfo } = require("../utils/query");
const {
  OPEN_TIME,
  CLOSE_TIME,
  todayString,
  nowTimeString,
  durationHours,
  isRealDate,
  rangesOverlap,
} = require("../utils/time");

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):(00|30)$/;
const POPULATE_SPACE = { path: "space", select: "name type floor capacity hourlyRate isActive" };
const POPULATE_USER = { path: "user", select: "name email role" };

// ---------------------------------------------------------------------------
// Business rules shared by "create" and "reschedule"
// Throws 400 (bad input), 404 (no space) or 409 (time clash) with field messages.
// ---------------------------------------------------------------------------
async function checkBookingRules(input, { userId, excludeId } = {}) {
  const { space: spaceId, date, startTime, endTime } = input;
  const attendees = Number(input.attendees);
  const errors = {};

  if (!spaceId || !mongoose.isValidObjectId(spaceId)) errors.space = "Choose a space.";
  if (!date || !DATE_RE.test(date) || !isRealDate(date)) errors.date = "Pick a valid date.";
  if (!startTime || !TIME_RE.test(startTime)) errors.startTime = "Pick a start time.";
  if (!endTime || !TIME_RE.test(endTime)) errors.endTime = "Pick an end time.";
  if (!Number.isInteger(attendees) || attendees < 1) errors.attendees = "Enter how many people (1 or more).";
  if (Object.keys(errors).length) throw httpError(400, "Please fix the highlighted fields.", errors);

  // Time rules
  const today = todayString();
  if (date < today) errors.date = "This date has already passed.";
  else if (date === today && startTime <= nowTimeString()) errors.startTime = "This time has already passed today.";
  if (startTime < OPEN_TIME || endTime > CLOSE_TIME) {
    errors.startTime = errors.startTime || `Pine is open ${OPEN_TIME}–${CLOSE_TIME}.`;
  }
  if (endTime <= startTime) errors.endTime = "End time must be after the start time.";
  if (Object.keys(errors).length) throw httpError(400, "Please fix the highlighted fields.", errors);

  // The space must exist, be open for booking and be big enough
  const space = await Space.findById(spaceId);
  if (!space) throw httpError(404, "That space no longer exists.");
  if (!space.isActive) throw httpError(400, `${space.name} is not taking bookings right now.`, { space: "Unavailable." });
  if (attendees > space.capacity) {
    throw httpError(400, `${space.name} fits up to ${space.capacity} ${space.capacity === 1 ? "person" : "people"}.`, {
      attendees: `Maximum ${space.capacity} for this space.`,
    });
  }

  // 1) The space must be free for the whole time range
  const sameDay = await Booking.find({
    space: space._id,
    date,
    status: "confirmed",
    ...(excludeId ? { _id: { $ne: excludeId } } : {}),
  }).lean();
  const clash = sameDay.find((b) => rangesOverlap(startTime, endTime, b.startTime, b.endTime));
  if (clash) {
    throw httpError(409, `${space.name} is already booked from ${clash.startTime} to ${clash.endTime}.`, {
      startTime: `Overlaps ${clash.startTime}–${clash.endTime}.`,
    });
  }

  // 2) The same person can't hold two spaces at the same time
  if (userId) {
    const mine = await Booking.find({
      user: userId,
      date,
      status: "confirmed",
      space: { $ne: space._id },
      ...(excludeId ? { _id: { $ne: excludeId } } : {}),
    })
      .populate("space", "name")
      .lean();
    const own = mine.find((b) => rangesOverlap(startTime, endTime, b.startTime, b.endTime));
    if (own) {
      throw httpError(
        409,
        `You already have ${own.space?.name || "another space"} booked from ${own.startTime} to ${own.endTime}.`,
        { startTime: "You have another booking at this time." }
      );
    }
  }

  const hours = durationHours(startTime, endTime);
  return { space, attendees, hours, totalCost: Math.round(hours * space.hourlyRate) };
}

// Load a booking and make sure the current user may touch it
async function findOwnBooking(req) {
  const booking = await Booking.findById(req.params.id);
  if (!booking) throw httpError(404, "Booking not found.");
  const isOwner = String(booking.user) === String(req.user._id);
  if (!isOwner && req.user.role !== "admin") throw httpError(404, "Booking not found."); // don't reveal others' bookings
  return booking;
}

function isUpcoming(booking) {
  const today = todayString();
  return booking.date > today || (booking.date === today && booking.endTime > nowTimeString());
}

// ---------------------------------------------------------------------------
// GET /api/bookings?scope=upcoming|past|cancelled|all&search=&sort=&page=&limit=&space=&date=
// ---------------------------------------------------------------------------
const listBookings = asyncHandler(async (req, res) => {
  const { scope = "upcoming", search, sort, space, date } = req.query;
  const { page, limit, skip } = getPagination(req.query, 8);
  const isAdmin = req.user.role === "admin";
  const today = todayString();
  const now = nowTimeString();

  const filter = {};
  // Admins see everyone's bookings only when they ask for ?all=true (the admin page does)
  if (!(isAdmin && req.query.all === "true")) filter.user = req.user._id;

  if (scope === "upcoming") {
    filter.status = "confirmed";
    filter.$or = [{ date: { $gt: today } }, { date: today, endTime: { $gt: now } }];
  } else if (scope === "past") {
    filter.status = "confirmed";
    filter.$or = [{ date: { $lt: today } }, { date: today, endTime: { $lte: now } }];
  } else if (scope === "cancelled") {
    filter.status = "cancelled";
  }

  if (space && mongoose.isValidObjectId(space)) filter.space = space;
  if (date && DATE_RE.test(date)) filter.date = date;

  // Search matches the purpose, the space name, or (for admins) the member's name/email
  if (search && search.trim()) {
    const rx = new RegExp(escapeRegex(search.trim()), "i");
    const or = [{ purpose: rx }];
    const spaceIds = await Space.find({ name: rx }).distinct("_id");
    if (spaceIds.length) or.push({ space: { $in: spaceIds } });
    if (filter.user === undefined) {
      const userIds = await User.find({ $or: [{ name: rx }, { email: rx }] }).distinct("_id");
      if (userIds.length) or.push({ user: { $in: userIds } });
    }
    filter.$and = [{ $or: or }];
  }

  const defaultSort = scope === "upcoming" ? "date-asc" : "date-desc";
  const sorts = {
    "date-asc": { date: 1, startTime: 1 },
    "date-desc": { date: -1, startTime: -1 },
    newest: { createdAt: -1 },
    "cost-desc": { totalCost: -1, date: 1 },
  };

  const [bookings, total] = await Promise.all([
    Booking.find(filter)
      .sort(sorts[sort] || sorts[defaultSort])
      .skip(skip)
      .limit(limit)
      .populate(POPULATE_SPACE)
      .populate(POPULATE_USER),
    Booking.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: bookings.map((b) => ({ ...b.toJSON(), isUpcoming: b.status === "confirmed" && isUpcoming(b) })),
    pagination: paginationInfo(page, limit, total),
  });
});

// GET /api/bookings/:id
const getBooking = asyncHandler(async (req, res) => {
  const booking = await findOwnBooking(req);
  await booking.populate([POPULATE_SPACE, POPULATE_USER]);
  res.json({ success: true, data: { ...booking.toJSON(), isUpcoming: booking.status === "confirmed" && isUpcoming(booking) } });
});

// POST /api/bookings
const createBooking = asyncHandler(async (req, res) => {
  const { space, date, startTime, endTime, purpose } = req.body;
  const checked = await checkBookingRules(req.body, { userId: req.user._id });

  const booking = await Booking.create({
    user: req.user._id,
    space,
    date,
    startTime,
    endTime,
    attendees: checked.attendees,
    purpose,
    totalCost: checked.totalCost,
  });
  await booking.populate([POPULATE_SPACE, POPULATE_USER]);

  res.status(201).json({
    success: true,
    message: `Booked ${checked.space.name} on ${date}, ${startTime}–${endTime}.`,
    data: { ...booking.toJSON(), isUpcoming: true },
  });
});

// PUT /api/bookings/:id   (reschedule or change details)
const updateBooking = asyncHandler(async (req, res) => {
  const booking = await findOwnBooking(req);
  if (booking.status === "cancelled") throw httpError(400, "Cancelled bookings can't be changed. Make a new booking.");
  if (!isUpcoming(booking)) throw httpError(400, "This booking has already ended, so it can't be changed.");

  // Start from the current values and apply whatever the form sent
  const next = {
    space: req.body.space ?? String(booking.space),
    date: req.body.date ?? booking.date,
    startTime: req.body.startTime ?? booking.startTime,
    endTime: req.body.endTime ?? booking.endTime,
    attendees: req.body.attendees ?? booking.attendees,
    purpose: req.body.purpose ?? booking.purpose,
  };

  // The booking owner (not the admin) is the person who must be free
  const checked = await checkBookingRules(next, { userId: booking.user, excludeId: booking._id });

  Object.assign(booking, {
    space: next.space,
    date: next.date,
    startTime: next.startTime,
    endTime: next.endTime,
    attendees: checked.attendees,
    purpose: next.purpose,
    totalCost: checked.totalCost,
  });
  await booking.save();
  await booking.populate([POPULATE_SPACE, POPULATE_USER]);

  res.json({
    success: true,
    message: `Booking updated: ${checked.space.name}, ${next.date} ${next.startTime}–${next.endTime}.`,
    data: { ...booking.toJSON(), isUpcoming: true },
  });
});

// PATCH /api/bookings/:id/cancel
const cancelBooking = asyncHandler(async (req, res) => {
  const booking = await findOwnBooking(req);
  if (booking.status === "cancelled") throw httpError(400, "This booking is already cancelled.");
  if (!isUpcoming(booking)) throw httpError(400, "This booking has already ended, so it can't be cancelled.");

  booking.status = "cancelled";
  await booking.save();
  await booking.populate([POPULATE_SPACE, POPULATE_USER]);

  res.json({ success: true, message: "Booking cancelled. The slot is free for others now.", data: booking });
});

// DELETE /api/bookings/:id
const deleteBooking = asyncHandler(async (req, res) => {
  const booking = await findOwnBooking(req);
  await booking.deleteOne();
  res.json({ success: true, message: "Booking deleted.", data: { _id: booking._id } });
});

// GET /api/bookings/summary  -> numbers for the dashboard
const bookingSummary = asyncHandler(async (req, res) => {
  const today = todayString();
  const now = nowTimeString();
  const monthPrefix = today.slice(0, 7); // "2026-10"
  const isAdmin = req.user.role === "admin";

  const upcomingFilter = {
    user: req.user._id,
    status: "confirmed",
    $or: [{ date: { $gt: today } }, { date: today, endTime: { $gt: now } }],
  };

  const [upcomingCount, nextBooking, monthBookings, cancelledCount] = await Promise.all([
    Booking.countDocuments(upcomingFilter),
    Booking.findOne(upcomingFilter).sort({ date: 1, startTime: 1 }).populate(POPULATE_SPACE),
    Booking.find({ user: req.user._id, status: "confirmed", date: { $regex: `^${monthPrefix}` } }).lean(),
    Booking.countDocuments({ user: req.user._id, status: "cancelled" }),
  ]);

  const summary = {
    upcomingCount,
    cancelledCount,
    nextBooking,
    hoursThisMonth: monthBookings.reduce((sum, b) => sum + durationHours(b.startTime, b.endTime), 0),
    spentThisMonth: monthBookings.reduce((sum, b) => sum + (b.totalCost || 0), 0),
  };

  if (isAdmin) {
    const [totalSpaces, activeSpaces, members, todaysBookings, byType] = await Promise.all([
      Space.countDocuments(),
      Space.countDocuments({ isActive: true }),
      User.countDocuments({ role: "member" }),
      Booking.find({ date: today, status: "confirmed" }).lean(),
      // Aggregation pipeline: confirmed bookings this month grouped by space type
      Booking.aggregate([
        { $match: { status: "confirmed", date: { $regex: `^${monthPrefix}` } } },
        { $lookup: { from: "spaces", localField: "space", foreignField: "_id", as: "space" } },
        { $unwind: "$space" },
        { $group: { _id: "$space.type", bookings: { $sum: 1 }, revenue: { $sum: "$totalCost" } } },
        { $sort: { bookings: -1 } },
      ]),
    ]);

    const openHours = durationHours(OPEN_TIME, CLOSE_TIME);
    const bookedHoursToday = todaysBookings.reduce((sum, b) => sum + durationHours(b.startTime, b.endTime), 0);

    summary.admin = {
      totalSpaces,
      activeSpaces,
      members,
      bookingsToday: todaysBookings.length,
      occupancyToday: activeSpaces ? Math.round((bookedHoursToday / (activeSpaces * openHours)) * 100) : 0,
      byType,
    };
  }

  res.json({ success: true, data: summary });
});

module.exports = {
  listBookings,
  getBooking,
  createBooking,
  updateBooking,
  cancelBooking,
  deleteBooking,
  bookingSummary,
};
