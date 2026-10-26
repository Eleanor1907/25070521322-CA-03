// components/ConfirmDialog.jsx
// "Are you sure?" dialog used before cancelling or deleting something.
// The safe button gets the focus, so pressing Enter by accident keeps things.

import { AlertTriangle } from "lucide-react";
import Modal from "./Modal";

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel = "Keep it",
  danger = true,
  busy = false,
  onConfirm,
  onClose,
}) {
  return (
    <Modal
      open={open}
      title={title}
      description={message}
      icon={danger ? <AlertTriangle size={20} /> : null}
      onClose={busy ? () => {} : onClose}
      width={460}
    >
      <div className="form-actions">
        <button type="button" className="btn btn--secondary" onClick={onClose} disabled={busy} data-autofocus>
          {cancelLabel}
        </button>
        <button
          type="button"
          className={`btn ${danger ? "btn--danger" : "btn--primary"}`}
          onClick={onConfirm}
          disabled={busy}
        >
          {busy && <span className="btn__spinner" aria-hidden="true" />}
          {busy ? "Working…" : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
