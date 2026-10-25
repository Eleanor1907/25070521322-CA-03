// components/DateStepper.jsx
// Date input with previous/next day buttons.

import { ChevronLeft, ChevronRight } from "lucide-react";
import { addDays, relativeDay, todayString } from "../utils/format";

export default function DateStepper({ id = "date", value, onChange, allowPast = false }) {
  const today = todayString();
  const canGoBack = allowPast || value > today;

  return (
    <div className="date-stepper">
      <button
        type="button"
        className="icon-btn"
        onClick={() => onChange(addDays(value, -1))}
        disabled={!canGoBack}
        aria-label="Previous day"
      >
        <ChevronLeft size={18} />
      </button>
      <label className="date-stepper__label" htmlFor={id}>
        <span className="date-stepper__day">{relativeDay(value)}</span>
        <input
          id={id}
          type="date"
          value={value}
          min={allowPast ? undefined : today}
          onChange={(e) => e.target.value && onChange(e.target.value)}
        />
      </label>
      <button type="button" className="icon-btn" onClick={() => onChange(addDays(value, 1))} aria-label="Next day">
        <ChevronRight size={18} />
      </button>
    </div>
  );
}
