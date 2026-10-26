// components/Feedback.jsx
// Loading, empty and error states shown in place of content.

import { AlertTriangle, RotateCw } from "lucide-react";

export function Loader({ label = "Loading…" }) {
  return (
    <div className="page-loader" role="status">
      <span className="btn__spinner" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}

export function Skeleton({ w = "100%", h = 14, r }) {
  return <span className="skeleton" style={{ width: w, height: h, borderRadius: r }} aria-hidden="true" />;
}

// Placeholder rows shaped like the content that is about to arrive
export function SkeletonList({ kind = "rows", count = 3, label = "Loading…" }) {
  const items = Array.from({ length: count }, (_, i) => i);
  return (
    <div role="status" aria-label={label}>
      {kind === "tickets" ? (
        <div className="ticket-list">
          {items.map((i) => (
            <div key={i} className="ticket-skeleton">
              <Skeleton h="100%" r={0} />
              <div className="ticket-skeleton__lines">
                <Skeleton w="34%" h={20} />
                <Skeleton w="52%" />
                <Skeleton w="70%" h={12} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="panel">
          {items.map((i) => (
            <div key={i} className="space-row space-row--skeleton">
              <div className="ticket-skeleton__lines">
                <Skeleton w="60%" h={20} />
                <Skeleton w="80%" h={12} />
              </div>
              <div className="ticket-skeleton__lines">
                <Skeleton w="30%" h={10} />
                <Skeleton h={16} />
              </div>
              <Skeleton w={84} h={34} r={8} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function EmptyState({ title, text, action }) {
  return (
    <div className="empty">
      <div className="empty__seats" aria-hidden="true">
        {Array.from({ length: 12 }, (_, i) => (
          <i key={i} />
        ))}
      </div>
      <h3>{title}</h3>
      {text && <p>{text}</p>}
      {action}
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="error-state" role="alert">
      <AlertTriangle size={20} aria-hidden />
      <p>{message}</p>
      {onRetry && (
        <button type="button" className="btn btn--secondary btn--sm" onClick={onRetry}>
          <RotateCw size={15} aria-hidden /> Try again
        </button>
      )}
    </div>
  );
}
