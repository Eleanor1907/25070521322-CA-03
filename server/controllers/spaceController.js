// controllers/spaceController.js
// Browse spaces (members) and manage them (admins).

const mongoose = require("mongoose");
const Space = require("../models/Space");
const Booking = require("../models/Booking");
const asyncHandler = require("../utils/asyncHandler");
const httpError = require("../utils/httpError");
const { escapeRegex, getPagination, paginationInfo } = require("../utils/query");
const { todayString, nowTimeString, isRealDate, OPEN_TIME, CLOSE_TIME } = require("../utils/time");

const SORTS = {
  name: { name: 1 },
  "price-asc": { hourlyRate: 1, name: 1 },
  "price-desc": { hourlyRate: -1, name: 1 },
  "capacity-desc": { capacity: -1, name: 1 },
  newest: { createdAt: -1 },
};

// Only these fields may be set from a request body (prevents unexpected fields)
const EDITABLE = ["name", "type", "capacity", "floor", "hourlyRate", "amenities", "description", "isActive"];
function pickEditable(body) {
  const data = {};
  for (const key of EDITABLE) if (body[key] !== undefined) data[key] = body[key];
  return data;
}

function readDate(value) {
  const date = value || todayString();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !isRealDate(date)) {
    throw httpError(400, "Date must be a real date in the format YYYY-MM-DD.");
  }
  return date;
}

// Booked time slots for a list of spaces on one day -> { spaceId: [{startTime, endTime, ...}] }
async function bookedSlotsFor(spaceIds, date, { viewerId, excludeBooking } = {}) {
  const filter = { space: { $in: spaceIds }, date, status: "confirmed" };
  if (excludeBooking && mongoose.isValidObjectId(excludeBooking)) filter._id = { $ne: excludeBooking };

  const bookings = await Booking.find(filter).select("space startTime endTime user").sort({ startTime: 1 }).lean();
  const map = {};
  for (const b of bookings) {
    const key = String(b.space);
    (map[key] ||= []).push({
      startTime: b.startTime,
      endTime: b.endTime,
      mine: viewerId ? String(b.user) === String(viewerId) : false,
    });
  }
  return map;
}

// GET /api/spaces?search=&type=&minCapacity=&sort=&page=&limit=&date=
const listSpaces = asyncHandler(async (req, res) => {
  const { search, type, minCapacity, sort = "name", includeInactive } = req.query;
  const date = readDate(req.query.date);
  const { page, limit, skip } = getPagination(req.query, 9);

  const filter = {};
  // Members only see active spaces; admins can ask for inactive ones too
  if (!(includeInactive === "true" && req.user.role === "admin")) filter.isActive = true;
  if (type) filter.type = type;
  if (minCapacity) filter.capacity = { $gte: Number(minCapacity) || 1 };
  if (search && search.trim()) {
    const rx = new RegExp(escapeRegex(search.trim()), "i");
    filter.$or = [{ name: rx }, { floor: rx }, { description: rx }];
  }

  const [spaces, total] = await Promise.all([
    Space.find(filter).sort(SORTS[sort] || SORTS.name).skip(skip).limit(limit),
    Space.countDocuments(filter),
  ]);

  const slots = await bookedSlotsFor(spaces.map((s) => s._id), date, { viewerId: req.user._id });

  res.json({
    success: true,
    date,
    hours: { open: OPEN_TIME, close: CLOSE_TIME },
    data: spaces.map((s) => ({ ...s.toJSON(), bookedSlots: slots[String(s._id)] || [] })),
    pagination: paginationInfo(page, limit, total),
  });
});

// GET /api/spaces/board?date=   (public: powers the "today at FLEXI" board on the home page)
const spaceBoard = asyncHandler(async (req, res) => {
  const date = readDate(req.query.date);
  const spaces = await Space.find({ isActive: true }).sort({ type: 1, name: 1 }).limit(12);
  const slots = await bookedSlotsFor(spaces.map((s) => s._id), date);

  res.json({
    success: true,
    date,
    now: nowTimeString(),
    hours: { open: OPEN_TIME, close: CLOSE_TIME },
    data: spaces.map((s) => ({
      _id: s._id,
      name: s.name,
      type: s.type,
      floor: s.floor,
      capacity: s.capacity,
      // no user information on the public board, only when each space is taken
      bookedSlots: (slots[String(s._id)] || []).map(({ startTime, endTime }) => ({ startTime, endTime })),
    })),
  });
});

// GET /api/spaces/:id?date=
const getSpace = asyncHandler(async (req, res) => {
  const space = await Space.findById(req.params.id);
  if (!space || (!space.isActive && req.user.role !== "admin")) throw httpError(404, "Space not found.");

  const date = readDate(req.query.date);
  const slots = await bookedSlotsFor([space._id], date, {
    viewerId: req.user._id,
    excludeBooking: req.query.excludeBooking,
  });

  res.json({
    success: true,
    date,
    hours: { open: OPEN_TIME, close: CLOSE_TIME },
    data: { ...space.toJSON(), bookedSlots: slots[String(space._id)] || [] },
  });
});

// POST /api/spaces  (admin)
const createSpace = asyncHandler(async (req, res) => {
  const space = await Space.create(pickEditable(req.body));
  res.status(201).json({ success: true, message: `${space.name} was added.`, data: space });
});

// PUT /api/spaces/:id  (admin)
const updateSpace = asyncHandler(async (req, res) => {
  const space = await Space.findById(req.params.id);
  if (!space) throw httpError(404, "Space not found.");

  // If capacity shrinks, upcoming bookings must still fit
  const data = pickEditable(req.body);
  if (data.capacity !== undefined && Number(data.capacity) < space.capacity) {
    const tooBig = await Booking.countDocuments({
      space: space._id,
      status: "confirmed",
      date: { $gte: todayString() },
      attendees: { $gt: Number(data.capacity) },
    });
    if (tooBig) {
      throw httpError(409, `${tooBig} upcoming booking(s) have more people than the new capacity.`, {
        capacity: "Lower than an existing upcoming booking.",
      });
    }
  }

  Object.assign(space, data);
  await space.save(); // runs schema validation
  res.json({ success: true, message: `${space.name} was updated.`, data: space });
});

// DELETE /api/spaces/:id  (admin)
const deleteSpace = asyncHandler(async (req, res) => {
  const space = await Space.findById(req.params.id);
  if (!space) throw httpError(404, "Space not found.");

  const upcoming = await Booking.countDocuments({
    space: space._id,
    status: "confirmed",
    date: { $gte: todayString() },
  });
  if (upcoming) {
    throw httpError(
      409,
      `${space.name} has ${upcoming} upcoming booking(s). Cancel them or mark the space inactive instead.`
    );
  }

  // No upcoming bookings: remove the space and its old (past or cancelled) bookings
  const { deletedCount } = await Booking.deleteMany({ space: space._id });
  await space.deleteOne();

  res.json({
    success: true,
    message: `${space.name} was deleted${deletedCount ? ` along with ${deletedCount} old booking(s)` : ""}.`,
    data: { _id: space._id },
  });
});

// GET /api/spaces/meta  -> lists used by the forms (types and amenities)
const spaceMeta = (req, res) => {
  res.json({
    success: true,
    data: { types: Space.SPACE_TYPES, amenities: Space.AMENITIES, hours: { open: OPEN_TIME, close: CLOSE_TIME } },
  });
};

module.exports = { listSpaces, spaceBoard, getSpace, createSpace, updateSpace, deleteSpace, spaceMeta };
