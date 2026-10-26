// utils/seats.js
// Pine shows a space's day like a cinema seat map: every half hour is a "seat".
// These helpers turn the API's booked slots into a list of seats with a state.

import { CLOSE_TIME, OPEN_TIME, nowTimeString, todayString, toMinutes } from "./format";

const pad = (n) => String(n).padStart(2, "0");

export const fromMinutes = (m) => `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
export const plusMinutes = (time, mins) =>
  fromMinutes(Math.min(toMinutes(time) + mins, toMinutes(CLOSE_TIME)));

// ["08:00", "08:30", ..., "19:30"]: the start time of every seat
export function seatTimes(open = OPEN_TIME, close = CLOSE_TIME) {
  const out = [];
  for (let m = toMinutes(open); m < toMinutes(close); m += 30) out.push(fromMinutes(m));
  return out;
}

// Group seats by hour: [{ hour: 8, seats: ["08:00", "08:30"] }, ...]
export function seatHours(open = OPEN_TIME, close = CLOSE_TIME) {
  const hours = [];
  for (const t of seatTimes(open, close)) {
    const hour = Number(t.slice(0, 2));
    const last = hours[hours.length - 1];
    if (last && last.hour === hour) last.seats.push(t);
    else hours.push({ hour, seats: [t] });
  }
  return hours;
}

/**
 * State of one seat:
 *  "mine"  - inside one of your own bookings
 *  "taken" - inside someone else's booking
 *  "past"  - already started (can't be booked any more)
 *  "free"  - can be booked
 */
export function seatState(time, slots, date, clock = { today: todayString(), now: nowTimeString() }) {
  const booking = slots.find((s) => s.startTime <= time && time < s.endTime);
  if (booking) return booking.mine ? "mine" : "taken";
  if (date < clock.today || (date === clock.today && time <= clock.now)) return "past";
  return "free";
}

// The seat that contains the current time (only on today's map)
export function nowSeat(date, clock = { today: todayString(), now: nowTimeString() }) {
  if (date !== clock.today) return null;
  const m = toMinutes(clock.now);
  if (m < toMinutes(OPEN_TIME) || m >= toMinutes(CLOSE_TIME)) return null;
  return fromMinutes(m - (m % 30));
}

// Short description for screen readers: "Booked 10:00 to 11:30, 14:00 to 15:00"
export function describeSlots(slots) {
  if (!slots.length) return "Free all day";
  return `Booked ${slots.map((s) => `${s.startTime} to ${s.endTime}`).join(", ")}`;
}

// Share of seats taken on a day, 0..1 (used for the admin "house" view)
export function takenShare(slots, open = OPEN_TIME, close = CLOSE_TIME) {
  const total = toMinutes(close) - toMinutes(open);
  const booked = slots.reduce((sum, s) => sum + (toMinutes(s.endTime) - toMinutes(s.startTime)), 0);
  return total ? booked / total : 0;
}
