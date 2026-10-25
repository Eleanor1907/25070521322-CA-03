// pages/Overview.jsx
// First page after login: your next booking and this month's numbers.
// Admins also see how busy the building is today.

import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarClock, MapPin, Users } from "lucide-react";
import PageHeader from "../components/PageHeader";
import DayStrip from "../components/DayStrip";
import ZoneTag from "../components/ZoneTag";
import { EmptyState, ErrorState, Loader } from "../components/Feedback";
import { useAuth } from "../context/AuthContext";
import { getSummary } from "../services/bookingService";
import { getBoard } from "../services/spaceService";
import { parseApiError } from "../services/api";
import {
  firstName,
  formatDate,
  formatDuration,
  formatMoney,
  hoursBetween,
  relativeDay,
  todayString,
  typeLabel,
} from "../utils/format";

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default function Overview() {
  const { user, isAdmin } = useAuth();
  const [summary, setSummary] = useState(null);
  const [board, setBoard] = useState(null);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    setError("");
    setSummary(null);
    Promise.all([getSummary(), isAdmin ? getBoard(todayString()) : Promise.resolve(null)])
      .then(([s, b]) => {
        setSummary(s.data);
        setBoard(b?.data || null);
      })
      .catch((err) => setError(parseApiError(err).message));
  }, [isAdmin]);

  useEffect(load, [load]);

  const next = summary?.nextBooking;

  return (
    <>
      <PageHeader
        title={`${greeting()}, ${firstName(user?.name)}`}
        subtitle={formatDate(todayString(), { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        actions={
          <Link className="btn btn--primary" to="/app/spaces">
            Book a space
          </Link>
        }
      />

      {error && <ErrorState message={error} onRetry={load} />}
      {!summary && !error && <Loader label="Loading your overview…" />}

      {summary && (
        <>
          <section className="panel next" aria-labelledby="next-title">
            <h2 id="next-title" className="panel__title">
              Your next booking
            </h2>
            {next ? (
              <div className={`next__body zone-${next.space?.type}`}>
                <div className="next__when">
                  <span className="next__day">{relativeDay(next.date)}</span>
                  <span className="next__time">
                    {next.startTime}–{next.endTime}
                  </span>
                </div>
                <div className="next__what">
                  <h3>{next.space?.name}</h3>
                  <p className="meta-line">
                    <ZoneTag type={next.space?.type} />
                    <span>
                      <MapPin size={14} aria-hidden /> {next.space?.floor}
                    </span>
                    <span>
                      <Users size={14} aria-hidden /> {next.attendees}
                    </span>
                  </p>
                  <p className="next__purpose">
                    {next.purpose}. {formatDuration(hoursBetween(next.startTime, next.endTime))},{" "}
                    {formatMoney(next.totalCost)}.
                  </p>
                </div>
                <div className="next__strip">
                  <DayStrip
                    size="lg"
                    date={next.date}
                    zone={next.space?.type}
                    slots={[{ startTime: next.startTime, endTime: next.endTime, mine: true }]}
                  />
                </div>
                <div className="next__actions">
                  <Link className="btn btn--ghost btn--sm" to={`/app/bookings/${next._id}/edit`}>
                    Reschedule
                  </Link>
                  <Link className="btn btn--ghost btn--sm" to="/app/bookings">
                    All my bookings
                  </Link>
                </div>
              </div>
            ) : (
              <EmptyState
                title="Nothing booked yet"
                text="Find a free desk, room or cabin and it will show up here."
                action={
                  <Link className="btn btn--primary" to="/app/spaces">
                    Find a space
                  </Link>
                }
              />
            )}
          </section>

          <section className="figures" aria-label="Your numbers">
            <div className="figure">
              <span className="figure__value">{summary.upcomingCount}</span>
              <span className="figure__label">Upcoming bookings</span>
            </div>
            <div className="figure">
              <span className="figure__value">{formatDuration(summary.hoursThisMonth || 0)}</span>
              <span className="figure__label">Booked this month</span>
            </div>
            <div className="figure">
              <span className="figure__value">{formatMoney(summary.spentThisMonth)}</span>
              <span className="figure__label">Spent this month</span>
            </div>
            <div className="figure">
              <span className="figure__value">{summary.cancelledCount}</span>
              <span className="figure__label">Cancelled</span>
            </div>
          </section>

          {isAdmin && summary.admin && (
            <section className="panel" aria-labelledby="building-title">
              <div className="panel__headline">
                <h2 id="building-title" className="panel__title">
                  The building today
                </h2>
                <Link to="/app/admin/bookings" className="text-link">
                  All bookings
                </Link>
              </div>

              <div className="figures figures--inline">
                <div className="figure">
                  <span className="figure__value">{summary.admin.occupancyToday}%</span>
                  <span className="figure__label">Of open hours booked</span>
                </div>
                <div className="figure">
                  <span className="figure__value">{summary.admin.bookingsToday}</span>
                  <span className="figure__label">Bookings today</span>
                </div>
                <div className="figure">
                  <span className="figure__value">
                    {summary.admin.activeSpaces}/{summary.admin.totalSpaces}
                  </span>
                  <span className="figure__label">Spaces open</span>
                </div>
                <div className="figure">
                  <span className="figure__value">{summary.admin.members}</span>
                  <span className="figure__label">Members</span>
                </div>
              </div>

              {board && board.length > 0 && (
                <ul className="board__rows board__rows--panel">
                  {board.map((s) => (
                    <li key={s._id} className="board__row">
                      <div className="board__name">
                        <strong>{s.name}</strong>
                        <ZoneTag type={s.type} />
                      </div>
                      <DayStrip slots={s.bookedSlots} date={todayString()} zone={s.type} />
                    </li>
                  ))}
                </ul>
              )}

              {summary.admin.byType.length > 0 && (
                <div className="by-type">
                  <h3>
                    <CalendarClock size={16} aria-hidden /> This month by space type
                  </h3>
                  {(() => {
                    const max = Math.max(...summary.admin.byType.map((t) => t.bookings));
                    return summary.admin.byType.map((t) => (
                      <div key={t._id} className={`by-type__row zone-${t._id}`}>
                        <span className="by-type__name">{typeLabel(t._id)}</span>
                        <span className="by-type__bar">
                          <i style={{ width: `${(t.bookings / max) * 100}%` }} />
                        </span>
                        <span className="by-type__num">
                          {t.bookings} {t.bookings === 1 ? "booking" : "bookings"}, {formatMoney(t.revenue)}
                        </span>
                      </div>
                    ));
                  })()}
                </div>
              )}
            </section>
          )}
        </>
      )}
    </>
  );
}
