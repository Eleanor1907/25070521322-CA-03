// pages/Overview.jsx
// First page after login: your next booking as a ticket and your numbers.
// Admins also see every open space's seats for today.

import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarClock } from "lucide-react";
import PageHeader from "../components/PageHeader";
import Ticket from "../components/Ticket";
import TypeTag from "../components/TypeTag";
import { SeatLegend, SeatRow, SeatRuler } from "../components/Seats";
import { EmptyState, ErrorState, SkeletonList } from "../components/Feedback";
import { useAuth } from "../context/AuthContext";
import { getSummary } from "../services/bookingService";
import { getBoard } from "../services/spaceService";
import { parseApiError } from "../services/api";
import { describeSlots } from "../utils/seats";
import { firstName, formatDate, formatDuration, formatMoney, todayString, typeLabel } from "../utils/format";

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function ByType({ rows }) {
  const max = Math.max(...rows.map((t) => t.bookings));
  return (
    <div className="by-type">
      <h3>
        <CalendarClock size={16} aria-hidden /> This month by space type
      </h3>
      {rows.map((t) => (
        <div key={t._id} className="by-type__row">
          <span>{typeLabel(t._id)}</span>
          <span className="by-type__bar" aria-hidden="true">
            <i style={{ width: `${(t.bookings / max) * 100}%` }} />
          </span>
          <span className="by-type__num">
            {t.bookings} {t.bookings === 1 ? "booking" : "bookings"}, {formatMoney(t.revenue)}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function Overview() {
  const { user, isAdmin } = useAuth();
  const [summary, setSummary] = useState(null);
  const [board, setBoard] = useState(null);
  const [error, setError] = useState("");
  const today = todayString();

  const load = useCallback(() => {
    setError("");
    setSummary(null);
    Promise.all([getSummary(), isAdmin ? getBoard(today) : Promise.resolve(null)])
      .then(([s, b]) => {
        setSummary(s.data);
        setBoard(b?.data || null);
      })
      .catch((err) => setError(parseApiError(err).message));
  }, [isAdmin, today]);

  useEffect(load, [load]);

  const next = summary?.nextBooking;
  const admin = summary?.admin;

  return (
    <>
      <PageHeader
        title={`${greeting()}, ${firstName(user?.name)}`}
        subtitle={formatDate(today, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        actions={
          <Link className="btn btn--primary" to="/app/spaces">
            Book a space
          </Link>
        }
      />

      {error && <ErrorState message={error} onRetry={load} />}
      {!summary && !error && <SkeletonList kind="tickets" count={1} label="Loading your overview" />}

      {summary && (
        <div className="overview">
          <section aria-labelledby="next-title">
            <div className="section-title">
              <h2 id="next-title">Your next booking</h2>
              {summary.upcomingCount > 1 && (
                <Link className="text-link" to="/app/bookings">
                  See all {summary.upcomingCount} upcoming
                </Link>
              )}
            </div>

            {next ? (
              <>
                <div className="ticket-wrap">
                  <Ticket booking={{ ...next, isUpcoming: true }} size="lg" heading="h3" showSeats />
                </div>
                <div className="next__actions">
                  <Link className="btn btn--secondary btn--sm" to={`/app/bookings/${next._id}/edit`}>
                    Reschedule
                  </Link>
                  <Link className="btn btn--quiet btn--sm" to="/app/bookings">
                    All my bookings
                  </Link>
                </div>
              </>
            ) : (
              <div className="panel">
                <EmptyState
                  title="Nothing booked yet"
                  text="Find a free desk, room or cabin and your ticket will show up here."
                  action={
                    <Link className="btn btn--primary" to="/app/spaces">
                      Find a space
                    </Link>
                  }
                />
              </div>
            )}
          </section>

          <section className="panel" aria-labelledby="numbers-title">
            <div className="panel__head">
              <h2 id="numbers-title">Your numbers</h2>
            </div>
            <div className="panel__body">
              <dl className="ledger">
                <div>
                  <dt>Upcoming bookings</dt>
                  <dd>{summary.upcomingCount}</dd>
                </div>
                <div>
                  <dt>Booked this month</dt>
                  <dd>{formatDuration(summary.hoursThisMonth || 0)}</dd>
                </div>
                <div>
                  <dt>Cancelled, all time</dt>
                  <dd>{summary.cancelledCount}</dd>
                </div>
                <div className="ledger__total">
                  <dt>Spent this month</dt>
                  <dd>{formatMoney(summary.spentThisMonth)}</dd>
                </div>
              </dl>
            </div>
          </section>

          {isAdmin && admin && (
            <section className="panel today-panel" aria-labelledby="today-title">
              <div className="panel__head">
                <div>
                  <h2 id="today-title">The building today</h2>
                  <p>Every open space, seat by seat.</p>
                </div>
                <Link to="/app/admin/bookings" className="text-link">
                  All bookings
                </Link>
              </div>
              <div className="panel__body">
                <p className="today-facts">
                  <span>
                    <strong>{admin.occupancyToday}%</strong> of open hours booked
                  </span>
                  <span>
                    <strong>{admin.bookingsToday}</strong> {admin.bookingsToday === 1 ? "booking" : "bookings"} today
                  </span>
                  <span>
                    <strong>
                      {admin.activeSpaces} of {admin.totalSpaces}
                    </strong>{" "}
                    spaces open
                  </span>
                  <span>
                    <strong>{admin.members}</strong> {admin.members === 1 ? "member" : "members"}
                  </span>
                </p>

                {board && board.length > 0 && (
                  <>
                    <ul className="house-rows">
                      {board.map((s) => (
                        <li key={s._id} className="house-row">
                          <div className="house-row__name">
                            <strong>{s.name}</strong>
                            <TypeTag type={s.type} />
                          </div>
                          <SeatRow slots={s.bookedSlots} date={today} label={`${s.name}: ${describeSlots(s.bookedSlots)}`} />
                        </li>
                      ))}
                    </ul>
                    <div className="house-ruler">
                      <span />
                      <SeatRuler />
                    </div>
                    <SeatLegend />
                  </>
                )}

                {admin.byType.length > 0 && <ByType rows={admin.byType} />}
              </div>
            </section>
          )}
        </div>
      )}
    </>
  );
}
