// components/Field.jsx
// Label + input + error message, so every form looks and behaves the same.
// Pass the input as a child; the id links the label and the error for screen readers.

import { cloneElement } from "react";

export default function Field({ id, label, error, hint, children, className = "" }) {
  const describedBy = [error ? `${id}-error` : null, hint ? `${id}-hint` : null].filter(Boolean).join(" ");

  return (
    <div className={`field ${error ? "field--error" : ""} ${className}`}>
      <label htmlFor={id} className="field__label">
        {label}
      </label>
      {cloneElement(children, {
        id,
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
          {error}
        </p>
      )}
    </div>
  );
}
