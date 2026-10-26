// components/Field.jsx
// Label + input + hint or error, so every form looks and behaves the same.
// Pass the input as a child; the id links the label and the messages for
// screen readers, and the right style class (input / select / textarea) is added.

import { cloneElement } from "react";
import { AlertCircle } from "lucide-react";

const CONTROL_CLASS = { select: "select", textarea: "textarea" };

export default function Field({ id, label, error, hint, children, className = "" }) {
  const describedBy = [error ? `${id}-error` : null, hint ? `${id}-hint` : null].filter(Boolean).join(" ");
  const base = typeof children.type === "string" ? CONTROL_CLASS[children.type] || "input" : "input";

  return (
    <div className={`field ${error ? "field--error" : ""} ${className}`}>
      <label htmlFor={id} className="field__label">
        {label}
      </label>
      {cloneElement(children, {
        id,
        className: [base, children.props.className].filter(Boolean).join(" "),
        "aria-invalid": error ? "true" : undefined,
        "aria-describedby": describedBy || undefined,
      })}
      {hint && !error && (
        <p id={`${id}-hint`} className="field__hint">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="field__error">
          <AlertCircle size={15} aria-hidden style={{ marginTop: 2 }} />
          {error}
        </p>
      )}
    </div>
  );
}
