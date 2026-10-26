// components/DatePicker.jsx
// Previous day / chosen day / next day. Pressing the day opens the browser's
// own calendar (a hidden <input type="date">), so any date can be picked.

import { useRef } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { addDays, formatDate, relativeDay, todayString } from "../utils/format";

export default function DatePicker({ id = "date", value, onChange, min = todayString() }) {
  const input = useRef(null);
  const rel = relativeDay(value);
  const named = rel === "Today" || rel === "Tomorrow" || rel === "Yesterday";
  const long = formatDate(value, { weekday: "long", day: "numeric", month: "long" });

  const openCalendar = () => {
    const el = input.current;
    if (!el) return;
    try {
      el.showPicker();
    } catch {
      el.focus();
      el.click();
    }
  };

  return (
    <div className="datepicker" role="group" aria-label="Day">
      <button
        type="button"
        className="icon-btn"
        onClick={() => onChange(addDays(value, -1))}
        disabled={Boolean(min) && value <= min}
        aria-label="Previous day"
      >
        <ChevronLeft size={18} />
      </button>

      <span style={{ position: "relative" }}>
        <button type="button" className="datepicker__day" onClick={openCalendar} aria-label={`${long}. Choose another day`}>
          <CalendarDays size={16} aria-hidden />
          <span>{named ? rel : formatDate(value)}</span>
          {named && <small>{formatDate(value, { day: "numeric", month: "short" })}</small>}
        </button>
        <input
          ref={input}
          id={id}
          type="date"
          className="datepicker__native"
          value={value}
          min={min || undefined}
          onChange={(e) => e.target.value && onChange(e.target.value < min ? min : e.target.value)}
          tabIndex={-1}
          aria-hidden="true"
        />
      </span>

      <button type="button" className="icon-btn" onClick={() => onChange(addDays(value, 1))} aria-label="Next day">
        <ChevronRight size={18} />
      </button>
    </div>
  );
}
