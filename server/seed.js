// seed.js
// Fills an empty database with demo spaces, an admin, a member and a few bookings.
//
//   npm run seed            -> adds anything missing; never deletes your data
//   npm run seed -- --reset -> DELETES all FLEXI users, spaces and bookings first

require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/User");
const Space = require("./models/Space");
const Booking = require("./models/Booking");
const { todayString, durationHours } = require("./utils/time");

const USERS = [
  { name: "Arjun Mehta", email: "admin@flexi.com", password: "Admin@123", role: "admin" },
  { name: "Riya Deshmukh", email: "riya@flexi.com", password: "Member@123", role: "member" },
];

const SPACES = [
  {
    name: "Window Desk 01",
    type: "hot-desk",
    capacity: 1,
    floor: "Level 1, open floor",
    hourlyRate: 120,
    amenities: ["Wi-Fi", "Power outlets", "Natural light"],
    description: "Quiet desk by the east windows. Good morning light.",
  },
  {
    name: "Window Desk 02",
    type: "hot-desk",
    capacity: 1,
    floor: "Level 1, open floor",
    hourlyRate: 120,
    amenities: ["Wi-Fi", "Power outlets", "Natural light"],
    description: "Next to Desk 01, facing the courtyard.",
  },
  {
    name: "Standing Desk 07",
    type: "hot-desk",
    capacity: 1,
    floor: "Level 1, open floor",
    hourlyRate: 150,
    amenities: ["Wi-Fi", "Power outlets", "Standing desk"],
    description: "Height-adjustable desk near the pantry.",
  },
  {
    name: "Neem",
    type: "meeting-room",
    capacity: 4,
    floor: "Level 2",
    hourlyRate: 450,
    amenities: ["Wi-Fi", "Whiteboard", "TV screen", "Air conditioning"],
    description: "Small room for stand-ups and interviews.",
  },
  {
    name: "Banyan",
    type: "meeting-room",
    capacity: 8,
    floor: "Level 2",
    hourlyRate: 700,
    amenities: ["Wi-Fi", "Whiteboard", "TV screen", "Video conferencing", "Air conditioning"],
    description: "Main meeting room with a 65-inch screen and a conference camera.",
  },
  {
    name: "Peepal Boardroom",
    type: "meeting-room",
    capacity: 14,
    floor: "Level 3",
    hourlyRate: 1200,
    amenities: ["Wi-Fi", "Video conferencing", "TV screen", "Whiteboard", "Air conditioning", "Natural light"],
    description: "Long table for workshops, reviews and client presentations.",
  },
  {
    name: "Cabin A",
    type: "private-cabin",
    capacity: 2,
    floor: "Level 3",
    hourlyRate: 350,
    amenities: ["Wi-Fi", "Power outlets", "Lockable door", "Air conditioning"],
    description: "Closed cabin for calls or focused work.",
  },
  {
    name: "Cabin B",
    type: "private-cabin",
    capacity: 3,
    floor: "Level 3",
    hourlyRate: 400,
    amenities: ["Wi-Fi", "Power outlets", "Lockable door", "Whiteboard"],
    description: "Cabin with a small whiteboard wall.",
  },
];

function addDays(dateStr, days) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(y, m - 1, d + days);
  const pad = (n) => String(n).padStart(2, "0");
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`;
}

async function run() {
  const reset = process.argv.includes("--reset");
  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
  console.log(`Connected to ${mongoose.connection.name}`);

  if (reset) {
    await Promise.all([Booking.deleteMany({}), Space.deleteMany({}), User.deleteMany({})]);
    console.log("Reset: removed all users, spaces and bookings.");
  }

  // Users: create only the ones that don't exist yet
  const users = {};
  for (const u of USERS) {
    let user = await User.findOne({ email: u.email });
    if (!user) {
      user = await User.create(u); // password is hashed by the pre-save hook
      console.log(`Created ${u.role}: ${u.email} / ${u.password}`);
    }
    users[u.email] = user;
  }

  // Spaces: create only the ones that don't exist yet (matched by name)
  const spaces = {};
  for (const s of SPACES) {
    let space = await Space.findOne({ name: s.name });
    if (!space) {
      space = await Space.create(s);
      console.log(`Created space: ${s.name}`);
    }
    spaces[s.name] = space;
  }

  // A few sample bookings, only if there are none yet
  if ((await Booking.countDocuments()) === 0) {
    const today = todayString();
    const riya = users["riya@flexi.com"];
    const admin = users["admin@flexi.com"];
    const samples = [
      // Today (so the home-page board has something to show)
      { user: admin, space: "Banyan", date: today, startTime: "09:00", endTime: "11:00", attendees: 6, purpose: "Design sync" },
      { user: riya, space: "Peepal Boardroom", date: today, startTime: "10:00", endTime: "12:30", attendees: 8, purpose: "Partner workshop" },
      { user: riya, space: "Window Desk 02", date: today, startTime: "13:00", endTime: "17:00", attendees: 1, purpose: "Report writing" },
      { user: admin, space: "Cabin B", date: today, startTime: "16:30", endTime: "18:00", attendees: 2, purpose: "Vendor call" },
      { user: admin, space: "Standing Desk 07", date: today, startTime: "08:00", endTime: "10:30", attendees: 1, purpose: "Inbox zero" },
      // Upcoming, past and cancelled examples
      { user: riya, space: "Banyan", date: addDays(today, 1), startTime: "10:00", endTime: "11:30", attendees: 5, purpose: "Sprint planning" },
      { user: riya, space: "Window Desk 01", date: addDays(today, 2), startTime: "09:00", endTime: "13:00", attendees: 1, purpose: "Focused writing" },
      { user: riya, space: "Cabin A", date: addDays(today, -3), startTime: "15:00", endTime: "16:00", attendees: 2, purpose: "Client call" },
      { user: admin, space: "Peepal Boardroom", date: addDays(today, 1), startTime: "14:00", endTime: "17:00", attendees: 10, purpose: "Quarterly review" },
      { user: admin, space: "Neem", date: addDays(today, 3), startTime: "11:00", endTime: "12:00", attendees: 3, purpose: "Interview panel" },
      { user: riya, space: "Neem", date: addDays(today, 4), startTime: "16:00", endTime: "17:00", attendees: 2, purpose: "Design review", status: "cancelled" },
    ];

    for (const b of samples) {
      const space = spaces[b.space];
      await Booking.create({
        ...b,
        user: b.user._id,
        space: space._id,
        totalCost: Math.round(durationHours(b.startTime, b.endTime) * space.hourlyRate),
      });
    }
    console.log(`Created ${samples.length} sample bookings.`);
  }

  console.log("\nSeed finished. Log in with:");
  console.log("  Admin  -> admin@flexi.com / Admin@123");
  console.log("  Member -> riya@flexi.com  / Member@123");
  await mongoose.disconnect();
}

run().catch(async (err) => {
  console.error("Seed failed:", err.message);
  await mongoose.disconnect();
  process.exit(1);
});
