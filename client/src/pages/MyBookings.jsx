// pages/MyBookings.jsx
// The logged-in member's bookings as tickets, split into Upcoming / Past / Cancelled.
// Upcoming tickets can be rescheduled or cancelled; past and cancelled ones can be deleted.

import { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CalendarClock, Search, Trash2, XCircle } from "lucide-react";
import PageHeader from "../components/PageHeader";
import Ticket from "../components/Ticket";
import Pagination from "../components/Pagination";
import ConfirmDialog from "../components/ConfirmDialog";
import { EmptyState, ErrorState, SkeletonList } from "../components/Feedback";
import useDebounce from "../hooks/useDebounce";
import { useToast } from "../hooks/useToast";
import { cancelBooking, deleteBooking, getBookings } from "../services/bookingService";
import { parseApiError } from "../services/api";
import { relativeDay } from "../utils/format";

const TABS = [
  { value: "upcoming", label: "Upcoming" },
  { value: "past", label: "Past" },
  { value: "cancelled", label: "Cancelled" },
  { value: "all", label: "All" },
];

const EMPTY_TEXT = {
  upcoming: ["No upcoming bookings", "When you book seats, your ticket will appear here."],
  past: ["No past bookings yet", "Tickets move here once their time is over."],
  cancelled: ["Nothing cancelled", "Bookings you cancel are kept here until you delete them."],
  all: ["No bookings yet", "Find a space and book your first seats."],
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
        subtitle="Every booking is a ticket. Change or cancel upcoming ones any time before they start."
        actions={
          <Link className="btn btn--primary" to="/app/spaces">
            Book a space
          </Link>
        }
      />

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

      <div className="filters">
        <div className="search filters__grow">
          <Search size={18} aria-hidden />
          <label htmlFor="booking-search" className="sr-only">
            Search bookings
          </label>
          <input
            id="booking-search"
            className="input"
            type="search"
            placeholder="Search by space or purpose"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              if (page > 1) setParam({ page: "" });
            }}
          />
        </div>

        <label className="select-inline" style={{ "--label-w": "2.4em" }}>
          <span>Sort</span>
          <select className="select" value={sort} onChange={(e) => setParam({ sort: e.target.value })}>
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
      {loading && !result && !error && <SkeletonList kind="tickets" count={3} label="Loading bookings" />}

      {result && !error && (
        <div className={loading ? "is-refreshing" : ""} aria-busy={loading}>
          {result.data.length === 0 ? (
            <div className="panel">
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
            </div>
          ) : (
            <ul className="ticket-list">
              {result.data.map((b) => (
                <li key={b._id} className="ticket-wrap">
                  <Ticket
                    booking={b}
                    actions={
                      b.isUpcoming ? (
                        <>
                          <Link
                            className="btn btn--secondary btn--sm"
                            to={`/app/bookings/${b._id}/edit`}
                            aria-label={`Reschedule ${b.space?.name || "booking"}, ${relativeDay(b.date)} ${b.startTime}`}
                          >
                            <CalendarClock size={15} aria-hidden /> Reschedule
                          </Link>
                          <button
                            type="button"
                            className="btn btn--danger-quiet btn--sm"
                            onClick={() => setConfirm({ action: "cancel", booking: b })}
                          >
                            <XCircle size={15} aria-hidden /> Cancel
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          className="btn btn--danger-quiet btn--sm"
                          onClick={() => setConfirm({ action: "delete", booking: b })}
                        >
                          <Trash2 size={15} aria-hidden /> Delete
                        </button>
                      )
                    }
                  />
                </li>
              ))}
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
            ? `${confirm.booking.space?.name}, ${relativeDay(confirm.booking.date)} ${confirm.booking.startTime}–${confirm.booking.endTime}. The seats open up for others straight away.`
            : `This removes the booking from your history for good.`)
        }
        confirmLabel={confirm?.action === "cancel" ? "Cancel booking" : "Delete booking"}
        onConfirm={runConfirmed}
        onClose={() => setConfirm(null)}
      />
    </>
  );
}
