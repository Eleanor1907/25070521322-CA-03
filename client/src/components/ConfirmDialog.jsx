// components/ConfirmDialog.jsx
// "Are you sure?" dialog used before cancelling or deleting something.

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
    <Modal open={open} title={title} onClose={busy ? () => {} : onClose} width={440}>
      <p className="confirm__message">{message}</p>
      <div className="form-actions">
        <button type="button" className="btn btn--ghost" onClick={onClose} disabled={busy}>
          {cancelLabel}
        </button>
        <button
          type="button"
          className={`btn ${danger ? "btn--danger" : "btn--primary"}`}
          onClick={onConfirm}
          disabled={busy}
        >
          {busy ? "Working…" : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
