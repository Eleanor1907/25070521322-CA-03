// components/Modal.jsx
// Accessible dialog built on the native <dialog> element
// (Esc closes it, focus stays inside, the page behind is inert).

import { useEffect, useRef } from "react";
import { X } from "lucide-react";

export default function Modal({ open, title, onClose, children, width = 560 }) {
  const ref = useRef(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className="modal"
      style={{ maxWidth: width }}
      onCancel={(e) => {
        e.preventDefault(); // let React state decide when to close
        onClose();
      }}
      onClick={(e) => {
        if (e.target === ref.current) onClose(); // click on the backdrop
      }}
      aria-labelledby="modal-title"
    >
      {open && (
        <div className="modal__body">
          <header className="modal__head">
            <h2 id="modal-title">{title}</h2>
            <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
              <X size={20} />
            </button>
          </header>
          {children}
        </div>
      )}
    </dialog>
  );
}
