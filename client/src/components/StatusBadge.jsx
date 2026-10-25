// components/StatusBadge.jsx

export default function StatusBadge({ booking }) {
  if (booking.status === "cancelled") return <span className="badge badge--cancelled">Cancelled</span>;
  if (booking.isUpcoming) return <span className="badge badge--confirmed">Confirmed</span>;
  return <span className="badge badge--done">Completed</span>;
}
