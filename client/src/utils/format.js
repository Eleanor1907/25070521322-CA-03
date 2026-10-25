// utils/format.js
// Formatting helpers shared by many components.

export const OPEN_TIME = "08:00";
export const CLOSE_TIME = "20:00";

export const SPACE_TYPES = [
  { value: "hot-desk", label: "Hot desk", plural: "Hot desks" },
  { value: "meeting-room", label: "Meeting room", plural: "Meeting rooms" },
  { value: "private-cabin", label: "Private cabin", plural: "Private cabins" },
];

export const AMENITIES = [
  "Wi-Fi",
  "Power outlets",
  "Whiteboard",
  "TV screen",
  "Video conferencing",
  "Standing desk",
  "Natural light",
  "Air conditioning",
  "Lockable door",
];

export function typeLabel(type) {
  return SPACE_TYPES.find((t) => t.value === type)?.label || type;
}

const pad = (n) => String(n).padStart(2, "0");

// "YYYY-MM-DD" for a JS Date, using the browser's local time zone
export function toDateString(d = new Date()) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function todayString() {
  return toDateString(new Date());
}

export function nowTimeString() {
  const d = new Date();
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function addDays(dateStr, days) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return toDateString(new Date(y, m - 1, d + days));
}

function parseDate(dateStr) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}

// "2026-10-25" -> "Sun 25 Oct"
export function formatDate(dateStr, opts = { weekday: "short", day: "numeric", month: "short" }) {
  if (!dateStr) return "";
  return parseDate(dateStr).toLocaleDateString("en-IN", opts);
}

// "Today", "Tomorrow" or "Sun 25 Oct"
export function relativeDay(dateStr) {
  const today = todayString();
  if (dateStr === today) return "Today";
  if (dateStr === addDays(today, 1)) return "Tomorrow";
  if (dateStr === addDays(today, -1)) return "Yesterday";
  return formatDate(dateStr);
}

export function dayParts(dateStr) {
  const d = parseDate(dateStr);
  return {
    day: d.getDate(),
    month: d.toLocaleDateString("en-IN", { month: "short" }),
    weekday: d.toLocaleDateString("en-IN", { weekday: "short" }),
  };
}

export function toMinutes(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

export function hoursBetween(start, end) {
  return (toMinutes(end) - toMinutes(start)) / 60;
}

// 1.5 -> "1 h 30 min", 2 -> "2 h"
export function formatDuration(hours) {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (!h) return `${m} min`;
  return m ? `${h} h ${m} min` : `${h} h`;
}

const money = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
export function formatMoney(amount) {
  return money.format(amount || 0);
}

// ["08:00", "08:30", ..., "20:00"]
export function timeOptions(from = OPEN_TIME, to = CLOSE_TIME) {
  const list = [];
  for (let t = toMinutes(from); t <= toMinutes(to); t += 30) {
    list.push(`${pad(Math.floor(t / 60))}:${pad(t % 60)}`);
  }
  return list;
}

export function rangesOverlap(aStart, aEnd, bStart, bEnd) {
  return aStart < bEnd && bStart < aEnd;
}

export function firstName(name = "") {
  return name.trim().split(/\s+/)[0] || "there";
}
