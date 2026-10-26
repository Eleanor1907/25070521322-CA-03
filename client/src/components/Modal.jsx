// components/Modal.jsx
// Accessible dialog built on the native <dialog> element
// (Esc closes it, focus stays inside, the page behind is inert).
// An element marked data-autofocus inside gets the focus when it opens.

import { useEffect, useId, useRef } from "react";
import { X } from "lucide-react";

export default function Modal({ open, title, description, icon, onClose, children, width = 560 }) {
  const ref = useRef(null);
  const titleId = useId();
  const descId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      dialog.querySelector("[data-autofocus]")?.focus();
    }
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
      aria-labelledby={titleId}
      aria-describedby={description ? descId : undefined}
    >
      {open && (
        <div className="modal__body">
          <header className="modal__head">
            <div className="modal__title">
              {icon && (
                <span className="confirm__icon" aria-hidden="true">
                  {icon}
                </span>
              )}
              <div>
                <h2 id={titleId}>{title}</h2>
                {description && <p id={descId}>{description}</p>}
              </div>
            </div>
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
