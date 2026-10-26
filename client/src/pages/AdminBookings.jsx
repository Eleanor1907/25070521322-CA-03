// pages/AdminBookings.jsx
// Admins see every member's bookings, can filter them, and cancel or delete any of them.

import { useCallback, useEffect, useState } from "react";
import { Search, X } from "lucide-react";
import PageHeader from "../components/PageHeader";
import StatusBadge from "../components/StatusBadge";
import Pagination from "../components/Pagination";
import ConfirmDialog from "../components/ConfirmDialog";
import { EmptyState, ErrorState, SkeletonList } from "../components/Feedback";
import useDebounce from "../hooks/useDebounce";
import { useToast } from "../hooks/useToast";
import { cancelBooking, deleteBooking, getBookings } from "../services/bookingService";
import { parseApiError } from "../services/api";
import { formatDate, formatMoney, typeLabel } from "../utils/format";

const TABS = [
  { value: "upcoming", label: "Upcoming" },
  { value: "past", label: "Past" },
  { value: "cancelled", label: "Cancelled" },
  { value: "all", label: "All" },
];

export default function AdminBookings() {
  const toast = useToast();
  const [scope, setScope] = useState("upcoming");
  const [search, setSearch] = useState("");
  const debounced = useDebounce(search);
  const [date, setDate] = useState("");
  const [page, setPage] = useState(1);

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [confirm, setConfirm] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError("");
    getBookings({ all: true, scope, search: debounced, date: date || undefined, page, limit: 10 })
      .then(setResult)
      .catch((err) => setError(parseApiError(err).message))
      .finally(() => setLoading(false));
  }, [scope, debounced, date, page]);

  useEffect(load, [load]);

  // Any filter change starts again from page 1
  const changeScope = (value) => {
    setScope(value);
    setPage(1);
  };

  const runConfirmed = async () => {
    const { action, booking } = confirm;
    setBusy(true);
    try {
      const res = action === "cancel" ? await cancelBooking(booking._id) : await deleteBooking(booking._id);
      toast.success(res.message);
      setConfirm(null);
      if (result.data.length === 1 && page > 1) setPage(page - 1);
      else load();
    } catch (err) {
      toast.error(parseApiError(err).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader title="All bookings" subtitle="Every member's bookings across the building." />

      <div className="tabs" role="tablist" aria-label="Booking status">
        {TABS.map((t) => (
          <button
            key={t.value}
            type="button"
            role="tab"
            aria-selected={scope === t.value}
            className={scope === t.value ? "is-on" : ""}
            onClick={() => changeScope(t.value)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="filters">
        <div className="search filters__grow">
          <Search size={18} aria-hidden />
          <label htmlFor="admin-booking-search" className="sr-only">
            Search bookings
          </label>
          <input
            id="admin-booking-search"
            className="input"
            type="search"
            placeholder="Member, email, space or purpose"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <div className="date-filter">
          <label htmlFor="admin-booking-day" className="sr-only">
            Show one day
          </label>
          <input
            id="admin-booking-day"
            className="input"
            type="date"
            value={date}
            onChange={(e) => {
              setDate(e.target.value);
              setPage(1);
            }}
          />
          {date && (
            <button
              type="button"
              className="icon-btn"
              onClick={() => {
                setDate("");
                setPage(1);
              }}
              aria-label="Clear day filter"
              title="Clear day"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {error && <ErrorState message={error} onRetry={load} />}
      {loading && !result && !error && <SkeletonList count={4} label="Loading bookings" />}

      {result && !error && (
        <div className={loading ? "is-refreshing" : ""} aria-busy={loading}>
          {result.data.length === 0 ? (
            <div className="panel">
              <EmptyState title="No bookings here" text="Change the tab, search or day to see more." />
            </div>
          ) : (
            <div className="panel panel--table">
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th scope="col">When</th>
                      <th scope="col">Space</th>
                      <th scope="col">Member</th>
                      <th scope="col">Purpose</th>
                      <th scope="col" className="num">
                        People
                      </th>
                      <th scope="col" className="num">
                        Cost
                      </th>
                      <th scope="col">Status</th>
                      <th scope="col">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.data.map((b) => (
                      <tr key={b._id} className={b.status === "cancelled" ? "is-muted" : ""}>
                        <td data-label="When">
                          <span className="cell-main">{formatDate(b.date)}</span>
                          <span className="cell-sub tabular">
                            {b.startTime}–{b.endTime}
                          </span>
                        </td>
                        <td data-label="Space">
                          <span className="cell-main">{b.space?.name || "Deleted space"}</span>
                          <span className="cell-sub">{b.space ? typeLabel(b.space.type) : ""}</span>
                        </td>
                        <td data-label="Member">
                          <span className="cell-main">{b.user?.name || "Deleted user"}</span>
                          <span className="cell-sub">{b.user?.email}</span>
                        </td>
                        <td data-label="Purpose">{b.purpose}</td>
                        <td data-label="People" className="num">
                          {b.attendees}
                        </td>
                        <td data-label="Cost" className="num">
                          {formatMoney(b.totalCost)}
                        </td>
                        <td data-label="Status">
                          <StatusBadge booking={b} />
                        </td>
                        <td className="row-actions">
                          {b.isUpcoming && (
                            <button
                              type="button"
                              className="btn btn--secondary btn--sm"
                              onClick={() => setConfirm({ action: "cancel", booking: b })}
                            >
                              Cancel
                            </button>
                          )}
                          <button
                            type="button"
                            className="btn btn--danger-quiet btn--sm"
                            onClick={() => setConfirm({ action: "delete", booking: b })}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          <Pagination pagination={result.pagination} noun="bookings" onPage={setPage} />
        </div>
      )}

      <ConfirmDialog
        open={Boolean(confirm)}
        busy={busy}
        title={confirm?.action === "cancel" ? "Cancel this booking?" : "Delete this booking?"}
        message={
          confirm &&
          `${confirm.booking.user?.name}: ${confirm.booking.space?.name}, ${formatDate(confirm.booking.date)} ${confirm.booking.startTime}–${confirm.booking.endTime}. ${
            confirm.action === "cancel" ? "The member will see it as cancelled." : "It will be removed from the database."
          }`
        }
        confirmLabel={confirm?.action === "cancel" ? "Cancel booking" : "Delete booking"}
        onConfirm={runConfirmed}
        onClose={() => setConfirm(null)}
      />
    </>
  );
}
