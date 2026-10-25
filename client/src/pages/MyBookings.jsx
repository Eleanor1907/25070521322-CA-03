// pages/MyBookings.jsx
// The logged-in member's bookings, split into Upcoming / Past / Cancelled.
// Upcoming bookings can be rescheduled or cancelled; past and cancelled ones can be deleted.

import { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Search, Users } from "lucide-react";
import PageHeader from "../components/PageHeader";
import ZoneTag from "../components/ZoneTag";
import StatusBadge from "../components/StatusBadge";
import Pagination from "../components/Pagination";
import ConfirmDialog from "../components/ConfirmDialog";
import { EmptyState, ErrorState, Loader } from "../components/Feedback";
import useDebounce from "../hooks/useDebounce";
import { useToast } from "../hooks/useToast";
import { cancelBooking, deleteBooking, getBookings } from "../services/bookingService";
import { parseApiError } from "../services/api";
import { dayParts, formatDuration, formatMoney, hoursBetween, relativeDay } from "../utils/format";

const TABS = [
  { value: "upcoming", label: "Upcoming" },
  { value: "past", label: "Past" },
  { value: "cancelled", label: "Cancelled" },
  { value: "all", label: "All" },
];

const EMPTY_TEXT = {
  upcoming: ["No upcoming bookings", "When you book a space it will appear here."],
  past: ["No past bookings yet", "Bookings move here once their time is over."],
  cancelled: ["Nothing cancelled", "Bookings you cancel are kept here until you delete them."],
  all: ["No bookings yet", "Find a space and make your first booking."],
};

export default function MyBookings() {
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const scope = TABS.some((t) => t.value === params.get("tab")) ? params.get("tab") : "upcoming";
  const page = Number(params.get("page")) || 1;
  const sort = params.get("sort") || "";

  const [search, setSearch] = useState("");
  const debounced = useDebounce(search);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [confirm, setConfirm] = useState(null); // { action: "cancel"|"delete", booking }
  const [busy, setBusy] = useState(false);

  const setParam = (changes) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        Object.entries(changes).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
        if (!("page" in changes)) next.delete("page");
        return next;
      },
      { replace: true }
    );

  const load = useCallback(() => {
    setLoading(true);
    setError("");
    getBookings({ scope, page, limit: 8, search: debounced, sort: sort || undefined })
      .then(setResult)
      .catch((err) => setError(parseApiError(err).message))
      .finally(() => setLoading(false));
  }, [scope, page, debounced, sort]);

  useEffect(load, [load]);

  const runConfirmed = async () => {
    const { action, booking } = confirm;
    setBusy(true);
    try {
      const res = action === "cancel" ? await cancelBooking(booking._id) : await deleteBooking(booking._id);
      toast.success(res.message);
      setConfirm(null);
      // If we removed the last item on a page, step back one page
      if (result.data.length === 1 && page > 1) setParam({ page: String(page - 1) });
      else load();
    } catch (err) {
      toast.error(parseApiError(err).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader
        title="My bookings"
        actions={
          <Link className="btn btn--primary" to="/app/spaces">
            Book a space
          </Link>
        }
      />

      <div className="toolbar">
        <div className="tabs" role="tablist" aria-label="Booking status">
          {TABS.map((t) => (
            <button
              key={t.value}
              type="button"
              role="tab"
              aria-selected={scope === t.value}
              className={scope === t.value ? "is-on" : ""}
              onClick={() => setParam({ tab: t.value === "upcoming" ? "" : t.value })}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="search">
          <Search size={18} aria-hidden />
          <label htmlFor="booking-search" className="sr-only">
            Search bookings
          </label>
          <input
            id="booking-search"
            type="search"
            placeholder="Search by space or purpose"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              if (page > 1) setParam({ page: "" });
            }}
          />
        </div>

        <label className="select-inline">
          <span>Sort</span>
          <select value={sort} onChange={(e) => setParam({ sort: e.target.value })}>
            <option value="">{scope === "upcoming" ? "Soonest first" : "Latest first"}</option>
            <option value={scope === "upcoming" ? "date-desc" : "date-asc"}>
              {scope === "upcoming" ? "Latest first" : "Oldest first"}
            </option>
            <option value="newest">Recently booked</option>
            <option value="cost-desc">Highest cost</option>
          </select>
        </label>
      </div>

      {error && <ErrorState message={error} onRetry={load} />}
      {loading && !result && <Loader label="Loading bookings…" />}

      {result && !error && (
        <div className={loading ? "is-refreshing" : ""}>
          {result.data.length === 0 ? (
            <EmptyState
              title={debounced ? "No bookings match your search" : EMPTY_TEXT[scope][0]}
              text={debounced ? "Try a different space name or purpose." : EMPTY_TEXT[scope][1]}
              action={
                !debounced &&
                (scope === "upcoming" || scope === "all") && (
                  <Link className="btn btn--primary" to="/app/spaces">
                    Find a space
                  </Link>
                )
              }
            />
          ) : (
            <ul className="ticket-list">
              {result.data.map((b) => {
                const d = dayParts(b.date);
                return (
                  <li key={b._id} className={`ticket zone-${b.space?.type} ${b.status === "cancelled" ? "is-cancelled" : ""}`}>
                    <div className="ticket__date" aria-label={relativeDay(b.date)}>
                      <span>{d.weekday}</span>
                      <strong>{d.day}</strong>
                      <span>{d.month}</span>
                    </div>

                    <div className="ticket__main">
                      <p className="ticket__time">
                        {b.startTime}–{b.endTime}
                        <span>{formatDuration(hoursBetween(b.startTime, b.endTime))}</span>
                      </p>
                      <h2>{b.space?.name || "Deleted space"}</h2>
                      <p className="meta-line">
                        {b.space && <ZoneTag type={b.space.type} />}
                        <span>
                          <Users size={14} aria-hidden /> {b.attendees}
                        </span>
                        <span>{b.purpose}</span>
                      </p>
                    </div>

                    <div className="ticket__side">
                      <StatusBadge booking={b} />
                      <span className="price">{formatMoney(b.totalCost)}</span>
                      <div className="ticket__actions">
                        {b.isUpcoming ? (
                          <>
                            <Link className="btn btn--ghost btn--sm" to={`/app/bookings/${b._id}/edit`}>
                              Reschedule
                            </Link>
                            <button
                              type="button"
                              className="btn btn--quiet-danger btn--sm"
                              onClick={() => setConfirm({ action: "cancel", booking: b })}
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            className="btn btn--quiet-danger btn--sm"
                            onClick={() => setConfirm({ action: "delete", booking: b })}
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          <Pagination pagination={result.pagination} noun="bookings" onPage={(p) => setParam({ page: String(p) })} />
        </div>
      )}

      <ConfirmDialog
        open={Boolean(confirm)}
        busy={busy}
        title={confirm?.action === "cancel" ? "Cancel this booking?" : "Delete this booking?"}
        message={
          confirm &&
          (confirm.action === "cancel"
            ? `${confirm.booking.space?.name}, ${relativeDay(confirm.booking.date)} ${confirm.booking.startTime}–${confirm.booking.endTime}. The slot opens up for others straight away.`
            : `This removes the booking from your history for good.`)
        }
        confirmLabel={confirm?.action === "cancel" ? "Cancel booking" : "Delete booking"}
        onConfirm={runConfirmed}
        onClose={() => setConfirm(null)}
      />
    </>
  );
}
