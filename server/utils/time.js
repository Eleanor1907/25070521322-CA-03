// utils/time.js
// Small helpers for working with "YYYY-MM-DD" dates and "HH:MM" times.

const OPEN_TIME = "08:00"; // Pine opens at 8 am
const CLOSE_TIME = "20:00"; // and closes at 8 pm

const pad = (n) => String(n).padStart(2, "0");

// Today's date in the server's local time zone, e.g. "2026-10-24"
function todayString(now = new Date()) {
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

// Current time, e.g. "14:05"
function nowTimeString(now = new Date()) {
  return `${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

// "09:30" -> 570 minutes after midnight
function toMinutes(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

// Length of a booking in hours, e.g. 09:00-11:30 -> 2.5
function durationHours(start, end) {
  return (toMinutes(end) - toMinutes(start)) / 60;
}

// Is "2026-02-30" a real calendar date?
function isRealDate(dateStr) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d;
}

// Two ranges overlap when each one starts before the other ends.
// Strings work here because "HH:MM" sorts alphabetically in time order.
function rangesOverlap(aStart, aEnd, bStart, bEnd) {
  return aStart < bEnd && bStart < aEnd;
}

module.exports = {
  OPEN_TIME,
  CLOSE_TIME,
  todayString,
  nowTimeString,
  toMinutes,
  durationHours,
  isRealDate,
  rangesOverlap,
};
