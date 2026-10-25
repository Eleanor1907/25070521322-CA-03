// components/SpaceForm.jsx
// Admin form to add or edit a space. Used inside a Modal.

import { useState } from "react";
import Field from "./Field";
import { AMENITIES, SPACE_TYPES } from "../utils/format";

const EMPTY = {
  name: "",
  type: "meeting-room",
  capacity: 4,
  floor: "",
  hourlyRate: 400,
  amenities: ["Wi-Fi"],
  description: "",
  isActive: true,
};

// Same rules as the Mongoose schema, checked in the browser first for quick feedback
function validate(v) {
  const e = {};
  if (!v.name.trim()) e.name = "Space name is required.";
  if (!v.floor.trim()) e.floor = "Floor or location is required.";
  const cap = Number(v.capacity);
  if (!Number.isInteger(cap) || cap < 1 || cap > 50) e.capacity = "Enter a whole number from 1 to 50.";
  const rate = Number(v.hourlyRate);
  if (v.hourlyRate === "" || Number.isNaN(rate) || rate < 0 || rate > 10000) e.hourlyRate = "Enter a rate from ₹0 to ₹10,000.";
  if (v.description.length > 300) e.description = "Keep the description under 300 characters.";
  return e;
}

export default function SpaceForm({ initial, onSubmit, onCancel, serverErrors = {}, busy }) {
  const [values, setValues] = useState(() => ({ ...EMPTY, ...initial }));
  const [errors, setErrors] = useState({});
  const allErrors = { ...serverErrors, ...errors };

  const set = (key) => (e) => {
    const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setValues((v) => ({ ...v, [key]: value }));
    setErrors((er) => ({ ...er, [key]: undefined }));
  };

  const toggleAmenity = (a) =>
    setValues((v) => ({
      ...v,
      amenities: v.amenities.includes(a) ? v.amenities.filter((x) => x !== a) : [...v.amenities, a],
    }));

  const handleSubmit = (e) => {
    e.preventDefault();
    const found = validate(values);
    setErrors(found);
    if (Object.keys(found).length) return;
    onSubmit({
      ...values,
      name: values.name.trim(),
      floor: values.floor.trim(),
      capacity: Number(values.capacity),
      hourlyRate: Number(values.hourlyRate),
    });
  };

  return (
    <form className="form" onSubmit={handleSubmit} noValidate>
      <Field id="space-name" label="Name" error={allErrors.name}>
        <input value={values.name} onChange={set("name")} maxLength={60} placeholder="e.g. Banyan" autoFocus />
      </Field>

      <div className="form-row">
        <Field id="space-type" label="Type" error={allErrors.type}>
          <select value={values.type} onChange={set("type")}>
            {SPACE_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </Field>
        <Field id="space-floor" label="Floor or location" error={allErrors.floor}>
          <input value={values.floor} onChange={set("floor")} maxLength={30} placeholder="e.g. Level 2" />
        </Field>
      </div>

      <div className="form-row">
        <Field id="space-capacity" label="Seats" error={allErrors.capacity}>
          <input type="number" min="1" max="50" step="1" value={values.capacity} onChange={set("capacity")} />
        </Field>
        <Field id="space-rate" label="Rate per hour (₹)" error={allErrors.hourlyRate}>
          <input type="number" min="0" max="10000" step="10" value={values.hourlyRate} onChange={set("hourlyRate")} />
        </Field>
      </div>

      <fieldset className="field">
        <legend className="field__label">Amenities</legend>
        <div className="chips">
          {AMENITIES.map((a) => (
            <label key={a} className={`chip ${values.amenities.includes(a) ? "is-on" : ""}`}>
              <input type="checkbox" checked={values.amenities.includes(a)} onChange={() => toggleAmenity(a)} />
              {a}
            </label>
          ))}
        </div>
      </fieldset>

      <Field
        id="space-description"
        label="Description"
        error={allErrors.description}
        hint={`${values.description.length}/300 characters`}
      >
        <textarea rows={3} value={values.description} onChange={set("description")} maxLength={300} />
      </Field>

      <label className="switch">
        <input type="checkbox" checked={values.isActive} onChange={set("isActive")} />
        <span>Open for booking</span>
      </label>

      <div className="form-actions">
        <button type="button" className="btn btn--ghost" onClick={onCancel} disabled={busy}>
          Cancel
        </button>
        <button type="submit" className="btn btn--primary" disabled={busy}>
          {busy ? "Saving…" : initial?._id ? "Save changes" : "Add space"}
        </button>
      </div>
    </form>
  );
}
