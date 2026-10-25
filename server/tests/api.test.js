// tests/api.test.js
// End-to-end API tests. They talk to the REAL running server and MongoDB.
//
// 1. Start MongoDB, run "npm run seed" once, start the API ("npm run dev")
// 2. In a second terminal (inside /server):  npm run test:api
//
// The tests create their own users, space and bookings with unique names
// and delete them again at the end, so your demo data is left alone.

const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");

const API = process.env.API_URL || "http://localhost:5000/api";
const RUN = Date.now().toString(36); // makes names unique per run

async function call(method, path, { token, body, raw } = {}) {
  const res = await fetch(API + path, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: raw ?? (body ? JSON.stringify(body) : undefined),
  });
  let json = null;
  try {
    json = await res.json();
  } catch {
    /* empty body */
  }
  return { status: res.status, body: json };
}

function addDays(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

const state = {};

before(async () => {
  const health = await call("GET", "/health");
  assert.equal(health.status, 200, "API is not running. Start it with npm run dev");
  assert.equal(health.body.database, "connected", "MongoDB is not connected");

  const admin = await call("POST", "/auth/login", { body: { email: "admin@flexi.com", password: "Admin@123" } });
  assert.equal(admin.status, 200, "Seed admin missing. Run npm run seed first");
  state.adminToken = admin.body.token;
});

after(async () => {
  // Clean up everything this run created
  if (state.spaceId) {
    const list = await call("GET", `/bookings?all=true&scope=all&space=${state.spaceId}&limit=50`, { token: state.adminToken });
    for (const b of list.body?.data || []) await call("DELETE", `/bookings/${b._id}`, { token: state.adminToken });
    await call("DELETE", `/spaces/${state.spaceId}`, { token: state.adminToken });
  }
  if (state.otherBookingId) await call("DELETE", `/bookings/${state.otherBookingId}`, { token: state.adminToken });

  // There is no "delete user" API, so remove the two test users straight from MongoDB
  require("dotenv").config();
  const mongoose = require("mongoose");
  const User = require("../models/User");
  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
  await User.deleteMany({ email: { $in: [`member.${RUN}@test.flexi`, `sneaky.${RUN}@test.flexi`] } });
  await mongoose.disconnect();
});

// ---------------- Auth ----------------

test("register rejects missing fields with per-field errors", async () => {
  const r = await call("POST", "/auth/register", { body: { name: "", email: "", password: "123" } });
  assert.equal(r.status, 400);
  assert.ok(r.body.errors.name && r.body.errors.email && r.body.errors.password);
});

test("register creates a member and returns a token", async () => {
  const r = await call("POST", "/auth/register", {
    body: { name: "Test Member", email: `member.${RUN}@test.flexi`, password: "secret123" },
  });
  assert.equal(r.status, 201);
  assert.ok(r.body.token);
  assert.equal(r.body.user.role, "member");
  assert.equal(r.body.user.password, undefined, "password hash must never be returned");
  state.memberToken = r.body.token;
});

test("register ignores a role sent by the client", async () => {
  const r = await call("POST", "/auth/register", {
    body: { name: "Sneaky", email: `sneaky.${RUN}@test.flexi`, password: "secret123", role: "admin" },
  });
  assert.equal(r.status, 201);
  assert.equal(r.body.user.role, "member");
  state.otherToken = r.body.token;
});

test("register rejects a duplicate email with 409", async () => {
  const r = await call("POST", "/auth/register", {
    body: { name: "Again", email: `MEMBER.${RUN}@test.flexi`, password: "secret123" },
  });
  assert.equal(r.status, 409);
  assert.ok(r.body.errors.email);
});

test("login fails with a wrong password and succeeds with the right one", async () => {
  const bad = await call("POST", "/auth/login", { body: { email: `member.${RUN}@test.flexi`, password: "nope" } });
  assert.equal(bad.status, 401);
  const ok = await call("POST", "/auth/login", { body: { email: `member.${RUN}@test.flexi`, password: "secret123" } });
  assert.equal(ok.status, 200);
  assert.ok(ok.body.token);
});

test("protected routes need a valid token", async () => {
  assert.equal((await call("GET", "/auth/me")).status, 401);
  assert.equal((await call("GET", "/auth/me", { token: "not-a-real-token" })).status, 401);
  const me = await call("GET", "/auth/me", { token: state.memberToken });
  assert.equal(me.status, 200);
  assert.equal(me.body.user.email, `member.${RUN}@test.flexi`);
});

// ---------------- Spaces ----------------

test("members cannot create spaces (403)", async () => {
  const r = await call("POST", "/spaces", { token: state.memberToken, body: { name: "Nope" } });
  assert.equal(r.status, 403);
});

test("admin space form is validated", async () => {
  const r = await call("POST", "/spaces", {
    token: state.adminToken,
    body: { name: "", type: "garage", capacity: 0, floor: "", hourlyRate: -5 },
  });
  assert.equal(r.status, 400);
  for (const f of ["name", "type", "capacity", "floor", "hourlyRate"]) assert.ok(r.body.errors[f], `missing error for ${f}`);
});

test("admin creates, reads and updates a space", async () => {
  const created = await call("POST", "/spaces", {
    token: state.adminToken,
    body: {
      name: `Test Room ${RUN}`,
      type: "meeting-room",
      capacity: 4,
      floor: "Test floor",
      hourlyRate: 400,
      amenities: ["Wi-Fi", "Whiteboard"],
    },
  });
  assert.equal(created.status, 201);
  state.spaceId = created.body.data._id;

  const dup = await call("POST", "/spaces", {
    token: state.adminToken,
    body: { name: `Test Room ${RUN}`, type: "hot-desk", capacity: 1, floor: "x", hourlyRate: 1 },
  });
  assert.equal(dup.status, 409, "duplicate space names are rejected");

  const updated = await call("PUT", `/spaces/${state.spaceId}`, { token: state.adminToken, body: { hourlyRate: 500 } });
  assert.equal(updated.status, 200);
  assert.equal(updated.body.data.hourlyRate, 500);

  const read = await call("GET", `/spaces/${state.spaceId}`, { token: state.memberToken });
  assert.equal(read.status, 200);
  assert.equal(read.body.data.hourlyRate, 500, "the update was saved in MongoDB");
});

test("space list supports search, type filter, sort and pagination", async () => {
  const desks = await call("GET", "/spaces?type=hot-desk&limit=50", { token: state.memberToken });
  assert.ok(desks.body.data.length > 0);
  assert.ok(desks.body.data.every((s) => s.type === "hot-desk"));

  const search = await call("GET", `/spaces?search=${RUN}`, { token: state.memberToken });
  assert.equal(search.body.data.length, 1);

  const sorted = await call("GET", "/spaces?sort=price-desc&limit=50", { token: state.memberToken });
  const rates = sorted.body.data.map((s) => s.hourlyRate);
  assert.deepEqual(rates, [...rates].sort((a, b) => b - a));

  const page = await call("GET", "/spaces?limit=2&page=1", { token: state.memberToken });
  assert.equal(page.body.data.length, 2);
  assert.ok(page.body.pagination.pages >= 2);
});

test("bad ids return 400, unknown ids return 404", async () => {
  assert.equal((await call("GET", "/spaces/123", { token: state.memberToken })).status, 400);
  assert.equal((await call("GET", "/spaces/64b000000000000000000000", { token: state.memberToken })).status, 404);
});

// ---------------- Bookings ----------------

const TOMORROW = addDays(1);

test("a valid booking is saved with the right cost", async () => {
  const r = await call("POST", "/bookings", {
    token: state.memberToken,
    body: { space: state.spaceId, date: TOMORROW, startTime: "10:00", endTime: "11:30", attendees: 3, purpose: "API test" },
  });
  assert.equal(r.status, 201, JSON.stringify(r.body));
  assert.equal(r.body.data.totalCost, 750); // 1.5 h x 500
  assert.equal(r.body.data.status, "confirmed");
  state.bookingId = r.body.data._id;
});

test("booking rules reject bad input", async () => {
  const base = { space: state.spaceId, date: TOMORROW, startTime: "14:00", endTime: "15:00", attendees: 2, purpose: "Rules" };
  const cases = [
    [{ ...base, date: addDays(-1) }, 400, "date"],
    [{ ...base, endTime: "13:00" }, 400, "endTime"],
    [{ ...base, startTime: "07:00" }, 400, "startTime"],
    [{ ...base, endTime: "21:00" }, 400, "startTime"],
    [{ ...base, startTime: "14:15" }, 400, "startTime"],
    [{ ...base, attendees: 9 }, 400, "attendees"],
    [{ ...base, purpose: "" }, 400, "purpose"],
    [{ ...base, space: "abc" }, 400, "space"],
  ];
  for (const [body, status, field] of cases) {
    const r = await call("POST", "/bookings", { token: state.memberToken, body });
    assert.equal(r.status, status, `${JSON.stringify(body)} -> ${JSON.stringify(r.body)}`);
    assert.ok(r.body.errors?.[field], `expected an error on "${field}" for ${JSON.stringify(body)}`);
  }
});

test("overlapping bookings are refused with 409", async () => {
  const r = await call("POST", "/bookings", {
    token: state.otherToken,
    body: { space: state.spaceId, date: TOMORROW, startTime: "11:00", endTime: "12:00", attendees: 1, purpose: "Clash" },
  });
  assert.equal(r.status, 409);
});

test("back-to-back bookings are allowed", async () => {
  const r = await call("POST", "/bookings", {
    token: state.otherToken,
    body: { space: state.spaceId, date: TOMORROW, startTime: "11:30", endTime: "12:00", attendees: 1, purpose: "Right after" },
  });
  assert.equal(r.status, 201);
  state.otherBookingId = r.body.data._id;
});

test("a member can't hold two spaces at the same time", async () => {
  const spaces = await call("GET", "/spaces?type=hot-desk", { token: state.memberToken });
  const desk = spaces.body.data[0];
  const r = await call("POST", "/bookings", {
    token: state.memberToken,
    body: { space: desk._id, date: TOMORROW, startTime: "11:00", endTime: "12:00", attendees: 1, purpose: "Double" },
  });
  assert.equal(r.status, 409);
});

test("bookings persist and are listed as upcoming", async () => {
  const one = await call("GET", `/bookings/${state.bookingId}`, { token: state.memberToken });
  assert.equal(one.status, 200);
  assert.equal(one.body.data.space.name, `Test Room ${RUN}`, "space is populated");

  const list = await call("GET", "/bookings?scope=upcoming", { token: state.memberToken });
  assert.ok(list.body.data.some((b) => b._id === state.bookingId));
});

test("other members can't see or change your booking", async () => {
  assert.equal((await call("GET", `/bookings/${state.bookingId}`, { token: state.otherToken })).status, 404);
  assert.equal((await call("DELETE", `/bookings/${state.bookingId}`, { token: state.otherToken })).status, 404);
});

test("rescheduling re-checks clashes and recalculates cost", async () => {
  const clash = await call("PUT", `/bookings/${state.bookingId}`, {
    token: state.memberToken,
    body: { startTime: "11:00", endTime: "12:00" },
  });
  assert.equal(clash.status, 409, "moving onto someone else's slot is refused");

  const ok = await call("PUT", `/bookings/${state.bookingId}`, {
    token: state.memberToken,
    body: { startTime: "09:00", endTime: "11:00", purpose: "API test (moved)" },
  });
  assert.equal(ok.status, 200, JSON.stringify(ok.body));
  assert.equal(ok.body.data.totalCost, 1000);
  assert.equal(ok.body.data.purpose, "API test (moved)");
});

test("admin can't delete a space that has upcoming bookings", async () => {
  const r = await call("DELETE", `/spaces/${state.spaceId}`, { token: state.adminToken });
  assert.equal(r.status, 409);
});

test("cancelling frees the slot", async () => {
  const c = await call("PATCH", `/bookings/${state.bookingId}/cancel`, { token: state.memberToken });
  assert.equal(c.status, 200);
  assert.equal(c.body.data.status, "cancelled");

  const again = await call("PATCH", `/bookings/${state.bookingId}/cancel`, { token: state.memberToken });
  assert.equal(again.status, 400, "can't cancel twice");

  const cancelled = await call("GET", "/bookings?scope=cancelled", { token: state.memberToken });
  assert.ok(cancelled.body.data.some((b) => b._id === state.bookingId));

  const takeSlot = await call("POST", "/bookings", {
    token: state.otherToken,
    body: { space: state.spaceId, date: TOMORROW, startTime: "09:00", endTime: "10:00", attendees: 1, purpose: "Freed slot" },
  });
  assert.equal(takeSlot.status, 201);
});

test("deleting removes the booking from MongoDB", async () => {
  const del = await call("DELETE", `/bookings/${state.bookingId}`, { token: state.memberToken });
  assert.equal(del.status, 200);
  assert.equal((await call("GET", `/bookings/${state.bookingId}`, { token: state.memberToken })).status, 404);
});

test("admins can list everyone's bookings, members only their own", async () => {
  const adminList = await call("GET", `/bookings?all=true&scope=all&space=${state.spaceId}`, { token: state.adminToken });
  assert.ok(adminList.body.data.length >= 2);
  const memberList = await call("GET", "/bookings?all=true&scope=all", { token: state.otherToken });
  assert.ok(memberList.body.data.every((b) => b.user.email === `sneaky.${RUN}@test.flexi`));
});

test("dashboard summary works for members and admins", async () => {
  const m = await call("GET", "/bookings/summary", { token: state.otherToken });
  assert.equal(m.status, 200);
  assert.equal(m.body.data.upcomingCount, 2);
  assert.equal(m.body.data.admin, undefined);

  const a = await call("GET", "/bookings/summary", { token: state.adminToken });
  assert.ok(a.body.data.admin.totalSpaces >= 1);
  assert.ok(Array.isArray(a.body.data.admin.byType));
});

test("public board shows spaces without personal details", async () => {
  const r = await call("GET", `/spaces/board?date=${TOMORROW}`);
  assert.equal(r.status, 200);
  const room = r.body.data.find((s) => s._id === state.spaceId);
  assert.ok(room.bookedSlots.length >= 1);
  assert.equal(room.bookedSlots[0].mine, undefined);
});

test("unknown routes and broken JSON get clear errors", async () => {
  assert.equal((await call("GET", "/nothing-here")).status, 404);
  const broken = await call("POST", "/auth/login", { raw: "{not json" });
  assert.equal(broken.status, 400);
});
