// components/Seats.jsx
// Pine draws a space's day as a row of cinema seats: one seat per half hour,
// 08:00 to 20:00. The booked slots come from the API; nothing here is made up.
//
//  <SeatRow>    a whole day on one line (lists, boards, tickets)
//  <SeatRuler>  hour numbers under a SeatRow
//  <SeatLegend> what each seat style means
//  <SeatMap>    the large map on the booking page. Click the start seat, then
//               the end seat, or drag across seats. Arrow keys move between
//               seats; Enter or Space picks.

import { useEffect, useRef, useState } from "react";
import { CLOSE_TIME, OPEN_TIME, nowTimeString, todayString } from "../utils/format";
import { describeSlots, nowSeat, plusMinutes, seatHours, seatState, seatTimes } from "../utils/seats";

const STATE_TEXT = {
  free: "free",
  taken: "taken",
  mine: "your booking",
  past: "already passed",
};

const clockNow = () => ({ today: todayString(), now: nowTimeString() });

/**
 * One day on a single line.
 * only="mine" shows just the given (own) slots and leaves other seats blank,
 * for places where we don't know about other people's bookings.
 */
export function SeatRow({ slots = [], date, size = "sm", only, label, className = "" }) {
  const clock = clockNow();
  const now = nowSeat(date, clock);
  const text = label || `${describeSlots(slots)}. Open ${OPEN_TIME} to ${CLOSE_TIME}.`;

  return (
    <div className={`seat-row seat-row--${size} ${className}`} role="img" aria-label={text}>
      {seatHours().map(({ hour, seats }) => (
        <span key={hour} className="seat-row__hour">
          {seats.map((t) => {
            let state = seatState(t, slots, date, clock);
            if (only === "mine" && state !== "mine") state = "blank";
            return (
              <i
                key={t}
                className={`seat seat--${state}${t === now && only !== "mine" ? " seat--now" : ""}`}
                title={`${t} ${STATE_TEXT[state] || ""}`}
              />
            );
          })}
        </span>
      ))}
    </div>
  );
}

export function SeatRuler({ className = "" }) {
  return (
    <div className={`seat-ruler ${className}`} aria-hidden="true">
      {seatHours().map(({ hour }) => (
        <span key={hour}>{hour}</span>
      ))}
    </div>
  );
}

const LEGEND = {
  free: "Free",
  taken: "Taken",
  mine: "Yours",
  chosen: "Your choice",
  past: "Passed",
  now: "Now",
};

export function SeatLegend({ items = ["free", "taken", "past", "now"], className = "" }) {
  return (
    <ul className={`seat-legend ${className}`} aria-label="Seat key">
      {items.map((key) => (
        <li key={key}>
          <i className={`seat seat--${key}`} aria-hidden="true" />
          {LEGEND[key]}
        </li>
      ))}
    </ul>
  );
}

// Group the day's seats into rows of eight (four hours each)
function buildRows(times) {
  const rows = [];
  for (let i = 0; i < times.length; i += 8) {
    const seats = times.slice(i, i + 8).map((t, k) => ({ t, i: i + k }));
    const hour = Number(seats[0].t.slice(0, 2));
    const name = hour < 12 ? "Morning" : hour < 16 ? "Afternoon" : "Evening";
    const hours = [];
    for (let k = 0; k < seats.length; k += 2) hours.push(seats.slice(k, k + 2));
    rows.push({ name, from: seats[0].t, to: plusMinutes(seats[seats.length - 1].t, 30), hours });
  }
  return rows;
}

const TIMES = seatTimes();
const ROWS = buildRows(TIMES);

export function SeatMap({ slots = [], date, start, end, conflict = false, loading = false, onChange, describedBy }) {
  const clock = clockNow();
  const states = TIMES.map((t) => seatState(t, slots, date, clock));
  const now = nowSeat(date, clock);

  // Selected seats: start .. the seat before end
  const startIdx = start ? TIMES.indexOf(start) : -1;
  const endIdx = end ? TIMES.indexOf(plusMinutes(end, -30)) : -1;
  const hasSel = startIdx >= 0 && endIdx >= startIdx;

  const isFree = (i) => states[i] === "free";
  const emit = (lo, hi) => onChange(TIMES[lo], plusMinutes(TIMES[hi], 30));

  // The run of free seats from `anchor` toward `target`, stopping before the first unavailable one
  const runFrom = (anchor, target) => {
    const step = target >= anchor ? 1 : -1;
    let last = anchor;
    for (let i = anchor + step; step > 0 ? i <= target : i >= target; i += step) {
      if (!isFree(i)) break;
      last = i;
    }
    return step > 0 ? [anchor, last] : [last, anchor];
  };

  // Click (mouse, touch, Enter or Space), like a date-range picker:
  // the first click picks the start seat, the second click picks the end seat.
  // A choice that is already complete (or suggested) starts again on the next click.
  const [anchor, setAnchor] = useState(null);
  const awaitingEnd = anchor !== null && startIdx === anchor && endIdx === anchor;

  const pick = (i) => {
    if (!isFree(i)) return;
    if (awaitingEnd && i === anchor) return setAnchor(null); // same seat twice: a 30-minute booking
    if (awaitingEnd && i > anchor) {
      const [, hi] = runFrom(anchor, i);
      if (hi === i) {
        setAnchor(null);
        return emit(anchor, i);
      }
    }
    setAnchor(i);
    emit(i, i);
  };

  // Drag across seats
  const drag = useRef(null);
  useEffect(() => {
    const finish = () => {
      const d = drag.current;
      drag.current = null;
      if (d && !d.moved) d.pick(d.anchor);
    };
    const cancel = () => (drag.current = null);
    window.addEventListener("pointerup", finish);
    window.addEventListener("pointercancel", cancel);
    return () => {
      window.removeEventListener("pointerup", finish);
      window.removeEventListener("pointercancel", cancel);
    };
  }, []);

  const onPointerDown = (e, i) => {
    if (e.button !== 0 || !isFree(i)) return;
    e.currentTarget.releasePointerCapture?.(e.pointerId); // lets touch drags reach other seats
    drag.current = { anchor: i, last: i, moved: false, pick };
  };
  const onPointerMove = (e) => {
    const d = drag.current;
    if (!d) return;
    const el = document.elementFromPoint(e.clientX, e.clientY)?.closest("[data-seat]");
    if (!el) return;
    const i = Number(el.dataset.seat);
    if (i === d.last) return;
    d.last = i;
    d.moved = true;
    setAnchor(null);
    const [lo, hi] = runFrom(d.anchor, i);
    emit(lo, hi);
  };

  // Keyboard: one tab stop, arrows move between seats
  const refs = useRef([]);
  const [focusIdx, setFocusIdx] = useState(null);
  const firstFree = states.indexOf("free");
  const tabStop = focusIdx ?? (hasSel ? startIdx : firstFree >= 0 ? firstFree : 0);

  const onKeyDown = (e) => {
    const from = focusIdx ?? tabStop;
    const moves = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: 8, ArrowUp: -8 };
    let to = null;
    if (e.key in moves) to = from + moves[e.key];
    if (e.key === "Home") to = 0;
    if (e.key === "End") to = TIMES.length - 1;
    if (to === null) return;
    e.preventDefault();
    to = Math.max(0, Math.min(TIMES.length - 1, to));
    setFocusIdx(to);
    refs.current[to]?.focus();
  };

  return (
    <div
      className={`seat-map ${loading ? "is-loading" : ""}`}
      role="group"
      aria-label="Seats, one per half hour"
      aria-describedby={describedBy}
      onPointerMove={onPointerMove}
      onKeyDown={onKeyDown}
    >
      {ROWS.map((row) => (
        <div key={row.name} className="seat-map__row">
          <span className="seat-map__label">
            {row.name}
            <small>
              {row.from}–{row.to}
            </small>
          </span>
          <div className="seat-map__seats">
            {row.hours.map((pair) => (
              <div key={pair[0].t} className="seat-map__hour">
                <div className="seat-map__pair">
                  {pair.map(({ t, i }) => {
                    const state = states[i];
                    const chosen = hasSel && i >= startIdx && i <= endIdx;
                    let cls = `seat-btn seat--${state}`;
                    if (chosen) cls += state === "free" && !conflict ? " seat--chosen" : " seat--clash";
                    if (t === now) cls += " seat--now";
                    const free = state === "free";
                    return (
                      <button
                        key={t}
                        ref={(el) => (refs.current[i] = el)}
                        type="button"
                        data-seat={i}
                        className={cls}
                        tabIndex={i === tabStop ? 0 : -1}
                        aria-pressed={free ? chosen : undefined}
                        aria-disabled={free ? undefined : "true"}
                        aria-label={`${t} to ${plusMinutes(t, 30)}, ${chosen && free ? "chosen" : STATE_TEXT[state]}`}
                        title={`${t}–${plusMinutes(t, 30)}`}
                        onPointerDown={(e) => onPointerDown(e, i)}
                        onClick={(e) => e.detail === 0 && pick(i)} // keyboard and screen readers; pointers use the handlers above
                        onFocus={() => setFocusIdx(i)}
                      >
                        <span className="seat-btn__time" aria-hidden="true">
                          {t}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <span className="seat-map__hourlabel" aria-hidden="true">
                  {pair[0].t}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
