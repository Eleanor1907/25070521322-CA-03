// components/Ticket.jsx
// A booking drawn as a ticket: the stub holds the date, the body holds the
// time, space and purpose, and the side holds the status, cost and actions.

import { MapPin, Users } from "lucide-react";
import StatusBadge from "./StatusBadge";
import TypeTag from "./TypeTag";
import { SeatRow } from "./Seats";
import { dayParts, formatDate, formatDuration, formatMoney, hoursBetween, relativeDay } from "../utils/format";

export default function Ticket({ booking: b, size, heading: Heading = "h2", showSeats = false, actions }) {
  const d = dayParts(b.date);
  const state = b.status === "cancelled" ? "cancelled" : b.isUpcoming ? "upcoming" : "done";
  const rel = relativeDay(b.date);
  const soon = state === "upcoming" && (rel === "Today" || rel === "Tomorrow");
  const fullDate = formatDate(b.date, { weekday: "long", day: "numeric", month: "long" });

  return (
    <article className={`ticket ${size === "lg" ? "ticket--lg" : ""} is-${state}`}>
      <div className="ticket__stub">
        <span aria-hidden="true">{d.weekday}</span>
        <strong aria-hidden="true">{d.day}</strong>
        <span aria-hidden="true">{d.month}</span>
        <span className="sr-only">{fullDate}</span>
        {soon && <em>{rel}</em>}
      </div>

      <div className="ticket__body">
        <p className="ticket__time">
          <span>
            <time>{b.startTime}</time>–<time>{b.endTime}</time>
          </span>
          <small>{formatDuration(hoursBetween(b.startTime, b.endTime))}</small>
        </p>
        <Heading className="ticket__space">{b.space?.name || "Deleted space"}</Heading>
        <p className="meta">
          {b.space && <TypeTag type={b.space.type} />}
          {b.space?.floor && (
            <span>
              <MapPin size={14} aria-hidden /> {b.space.floor}
            </span>
          )}
          <span>
            <Users size={14} aria-hidden /> {b.attendees} {b.attendees === 1 ? "person" : "people"}
          </span>
        </p>
        <p className="ticket__purpose">{b.purpose}</p>
        {showSeats && (
          <SeatRow
            className="ticket__seats"
            date={b.date}
            only="mine"
            slots={[{ startTime: b.startTime, endTime: b.endTime, mine: true }]}
            label={`Your seats: ${b.startTime} to ${b.endTime}`}
          />
        )}
      </div>

      <div className="ticket__side">
        <StatusBadge booking={b} />
        <span className="price">{formatMoney(b.totalCost)}</span>
        {actions && <div className="ticket__actions">{actions}</div>}
      </div>
    </article>
  );
}
