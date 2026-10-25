// components/DayStrip.jsx
// FLEXI's signature element: one day (08:00-20:00) drawn as a horizontal strip.
//  - hatched blocks  = booked by someone else
//  - coloured blocks = your own bookings
//  - amber block     = the time you are choosing right now
//  - dark line       = the current time (only on today's strip)
//
// size="sm" is used in lists, size="lg" on the booking page, where each
// half hour is also a button that sets the start time.

import { CLOSE_TIME, OPEN_TIME, nowTimeString, todayString, toMinutes } from "../utils/format";

export default function DayStrip({
  slots = [],
  date,
  open = OPEN_TIME,
  close = CLOSE_TIME,
  selection = null,
  conflict = false,
  zone = "meeting-room",
  size = "sm",
  onPickStart,
}) {
  const start = toMinutes(open);
  const end = toMinutes(close);
  const span = end - start;
  const pct = (time) => ((Math.min(Math.max(toMinutes(time), start), end) - start) / span) * 100;

  const today = todayString();
  const isPastDay = date && date < today;
  const isToday = date === today;
  const now = nowTimeString();
  const nowVisible = isToday && now > open && now < close;

  // Hour marks: every hour on the large strip, every 2 hours on the small one
  const hours = [];
  for (let m = start; m <= end; m += 60) hours.push(m / 60);
  const labelEvery = size === "lg" ? 1 : 2;

  const summary = slots.length
    ? `Booked ${slots.map((s) => `${s.startTime} to ${s.endTime}`).join(", ")}`
    : "Free all day";

  // Half-hour buttons for the large strip
  const halfHours = [];
  if (onPickStart) {
    for (let m = start; m < end; m += 30) {
      const t = `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
      const taken = slots.some((s) => s.startTime <= t && t < s.endTime);
      const past = isPastDay || (isToday && t <= now);
      halfHours.push({ t, disabled: taken || past });
    }
  }

  return (
    <div className={`strip strip--${size} zone-${zone}`}>
      <div className="strip__track" role="img" aria-label={`${open} to ${close}. ${summary}.`}>
        {hours.map((h) => (
          <span key={h} className="strip__tick" style={{ left: `${((h * 60 - start) / span) * 100}%` }} />
        ))}

        {(isPastDay || nowVisible) && (
          <span className="strip__past" style={{ width: isPastDay ? "100%" : `${pct(now)}%` }} />
        )}

        {slots.map((s) => (
          <span
            key={`${s.startTime}-${s.endTime}`}
            className={`strip__block ${s.mine ? "strip__block--mine" : ""}`}
            style={{ left: `${pct(s.startTime)}%`, width: `${pct(s.endTime) - pct(s.startTime)}%` }}
            title={`${s.mine ? "Your booking" : "Booked"} ${s.startTime}–${s.endTime}`}
          />
        ))}

        {selection?.startTime && selection?.endTime && selection.endTime > selection.startTime && (
          <span
            className={`strip__selection ${conflict ? "strip__selection--conflict" : ""}`}
            style={{
              left: `${pct(selection.startTime)}%`,
              width: `${pct(selection.endTime) - pct(selection.startTime)}%`,
            }}
          />
        )}

        {nowVisible && <span className="strip__now" style={{ left: `${pct(now)}%` }} />}

        {onPickStart && (
          <div className="strip__picker">
            {halfHours.map(({ t, disabled }) => (
              <button
                key={t}
                type="button"
                className="strip__half"
                disabled={disabled}
                onClick={() => onPickStart(t)}
                aria-label={`Start at ${t}`}
                title={disabled ? undefined : `Start at ${t}`}
              />
            ))}
          </div>
        )}
      </div>

      <div className="strip__labels" aria-hidden="true">
        {hours.map((h, i) =>
          i % labelEvery === 0 ? (
            <span key={h} style={{ left: `${((h * 60 - start) / span) * 100}%` }}>
              {h}
            </span>
          ) : null
        )}
      </div>
    </div>
  );
}
