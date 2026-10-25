// components/Feedback.jsx
// Loading, empty and error states shown in place of content.

import { AlertTriangle } from "lucide-react";

export function Loader({ label = "Loading…" }) {
  return (
    <div className="loader" role="status">
      <span className="loader__bar" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}

export function EmptyState({ title, text, action }) {
  return (
    <div className="empty">
      <div className="empty__strip" aria-hidden="true">
        <i />
        <i />
        <i />
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
        <button type="button" className="btn btn--ghost btn--sm" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}
