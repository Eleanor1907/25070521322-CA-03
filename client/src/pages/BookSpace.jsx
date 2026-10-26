// pages/BookSpace.jsx
// One page for both:
//   /app/spaces/:spaceId/book       -> make a new booking   (POST /api/bookings)
//   /app/bookings/:bookingId/edit   -> reschedule a booking (PUT  /api/bookings/:id)
//
// The seat map shows the chosen day, one seat per half hour. Pick seats on the
// map (or with the From / To boxes); clashes are shown before you submit, and
// the server checks every rule again when you do.

import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { AlertTriangle, ArrowLeft, MapPin, Users } from "lucide-react";
import DatePicker from "../components/DatePicker";
import Field from "../components/Field";
import TypeTag from "../components/TypeTag";
import { SeatLegend, SeatMap } from "../components/Seats";
import { ErrorState, Loader } from "../components/Feedback";
import { useToast } from "../hooks/useToast";
import { getSpace } from "../services/spaceService";
import { createBooking, getBooking, updateBooking } from "../services/bookingService";
import { parseApiError } from "../services/api";
import { plusMinutes } from "../utils/seats";
import {
  CLOSE_TIME,
  OPEN_TIME,
  formatDuration,
  formatMoney,
  hoursBetween,
  nowTimeString,
  rangesOverlap,
  relativeDay,
  timeOptions,
  toMinutes,
  todayString,
} from "../utils/format";

export default function BookSpace() {
  const { spaceId: spaceParam, bookingId } = useParams();
  const isEdit = Boolean(bookingId);
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();

  const initialDate = params.get("date") && params.get("date") >= todayString() ? params.get("date") : todayString();
  const [spaceId, setSpaceId] = useState(spaceParam || null);
  const [date, setDate] = useState(initialDate);
  const [form, setForm] = useState({ startTime: "", endTime: "", attendees: 1, purpose: "" });
  const [space, setSpace] = useState(null);
  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);

  // Edit mode: load the booking first, then its space
  useEffect(() => {
    if (!isEdit) return;
    getBooking(bookingId)
      .then((res) => {
        const b = res.data;
        if (!b.isUpcoming) {
          setLoadError("This booking has ended or was cancelled, so it can't be changed.");
          return;
        }
        setSpaceId(b.space._id);
        setDate(b.date);
        setForm({ startTime: b.startTime, endTime: b.endTime, attendees: b.attendees, purpose: b.purpose });
      })
      .catch((err) => setLoadError(parseApiError(err).message));
  }, [isEdit, bookingId]);

  // Load the space and its bookings for the chosen day (our own booking is excluded when editing)
  const loadSpace = useCallback(() => {
    if (!spaceId) return;
    setLoadingSlots(true);
    getSpace(spaceId, { date, excludeBooking: bookingId })
      .then((res) => {
        const booked = res.data.bookedSlots;
        setSpace(res.data);
        setSlots(booked);

        // New booking with no time chosen yet: suggest the first free hour of the day
        if (!bookingId) {
          const isTodayNow = date === todayString();
          const nowNow = nowTimeString();
          const first = timeOptions(OPEN_TIME, "19:00").find(
            (t) =>
              (!isTodayNow || t > nowNow) &&
              !booked.some((s) => rangesOverlap(t, plusMinutes(t, 60), s.startTime, s.endTime))
          );
          setForm((f) => (f.startTime || !first ? f : { ...f, startTime: first, endTime: plusMinutes(first, 60) }));
        }
      })
      .catch((err) => setLoadError(parseApiError(err).message))
      .finally(() => setLoadingSlots(false));
  }, [spaceId, date, bookingId]);

  useEffect(loadSpace, [loadSpace]);

  const isToday = date === todayString();
  const now = nowTimeString();
  const isFree = useCallback(
    (start, end) => !slots.some((s) => rangesOverlap(start, end, s.startTime, s.endTime)),
    [slots]
  );

  // The latest end time possible without running into the next booking
  const nextBlockStart = useMemo(() => {
    if (!form.startTime) return CLOSE_TIME;
    const later = slots.map((s) => s.startTime).filter((t) => t >= plusMinutes(form.startTime, 30));
    return later.length ? later.sort()[0] : CLOSE_TIME;
  }, [slots, form.startTime]);

  const startChoices = timeOptions(OPEN_TIME, plusMinutes(CLOSE_TIME, -30)).map((t) => ({
    t,
    disabled: (isToday && t <= now) || !isFree(t, plusMinutes(t, 30)),
  }));
  const endChoices = form.startTime
    ? timeOptions(plusMinutes(form.startTime, 30), CLOSE_TIME).map((t) => ({ t, disabled: t > nextBlockStart }))
    : [];

  const hasRange = form.startTime && form.endTime && form.endTime > form.startTime;
  const conflict = hasRange && !isFree(form.startTime, form.endTime);
  const startPassed = isToday && form.startTime && form.startTime <= now;
  const hours = hasRange ? hoursBetween(form.startTime, form.endTime) : 0;
  const cost = space ? Math.round(hours * space.hourlyRate) : 0;
  const whenText = hasRange ? `${relativeDay(date)}, ${form.startTime}–${form.endTime}` : "Choose your seats";

  const clearMessages = () => {
    setErrors({});
    setFormError("");
  };

  const set = (key) => (e) => {
    const value = e.target.value;
    setForm((f) => {
      const next = { ...f, [key]: value };
      // Moving the start keeps the same length if possible
      if (key === "startTime" && value) {
        const length = f.startTime && f.endTime ? toMinutes(f.endTime) - toMinutes(f.startTime) : 60;
        next.endTime = plusMinutes(value, Math.max(length, 30));
      }
      return next;
    });
    setErrors((er) => ({ ...er, [key]: undefined }));
    setFormError("");
  };

  // From the seat map
  const pickSeats = (startTime, endTime) => {
    setForm((f) => ({ ...f, startTime, endTime }));
    clearMessages();
  };

  const clearSeats = () => {
    setForm((f) => ({ ...f, startTime: "", endTime: "" }));
    clearMessages();
  };

  const changeDate = (d) => {
    setDate(d);
    clearMessages();
  };

  function validate() {
    const e = {};
    if (!form.startTime) e.startTime = "Pick a start time.";
    else if (startPassed) e.startTime = "This time has already passed today.";
    if (!form.endTime) e.endTime = "Pick an end time.";
    else if (form.startTime && form.endTime <= form.startTime) e.endTime = "End time must be after the start time.";
    if (conflict) e.startTime = "This overlaps another booking. Pick free seats.";
    const people = Number(form.attendees);
    if (!Number.isInteger(people) || people < 1) e.attendees = "Enter how many people (1 or more).";
    else if (space && people > space.capacity) e.attendees = `${space.name} fits up to ${space.capacity}.`;
    const purpose = form.purpose.trim();
    if (purpose.length < 3) e.purpose = "Add a short purpose (at least 3 characters).";
    return e;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length) return;

    const payload = {
      space: spaceId,
      date,
      startTime: form.startTime,
      endTime: form.endTime,
      attendees: Number(form.attendees),
      purpose: form.purpose.trim(),
    };

    setBusy(true);
    try {
      const res = isEdit ? await updateBooking(bookingId, payload) : await createBooking(payload);
      toast.success(res.message);
      navigate("/app/bookings");
    } catch (err) {
      const { status, message, fieldErrors } = parseApiError(err);
      setErrors(fieldErrors);
      setFormError(message);
      if (status === 409) loadSpace(); // someone else just took the seats: refresh the map
    } finally {
      setBusy(false);
    }
  };

  if (loadError) {
    return (
      <>
        <Link to={isEdit ? "/app/bookings" : "/app/spaces"} className="back-link">
          <ArrowLeft size={16} aria-hidden /> Back
        </Link>
        <ErrorState message={loadError} />
      </>
    );
  }

  if (!space) return <Loader label="Loading space…" />;

  const submitLabel = busy ? "Saving…" : isEdit ? "Save new time" : "Confirm booking";

  return (
    <div className="book-page">
      <Link to={isEdit ? "/app/bookings" : `/app/spaces?date=${date}`} className="back-link">
        <ArrowLeft size={16} aria-hidden /> {isEdit ? "Back to my bookings" : "Back to spaces"}
      </Link>

      <header className="book-head">
        <h1>{isEdit ? `Reschedule: ${space.name}` : space.name}</h1>
        <p className="meta">
          <TypeTag type={space.type} />
          <span>
            <MapPin size={14} aria-hidden /> {space.floor}
          </span>
          <span>
            <Users size={14} aria-hidden /> Up to {space.capacity}
          </span>
          <span className="tabular">{formatMoney(space.hourlyRate)} / hour</span>
        </p>
        {space.description && <p className="book-head__desc">{space.description}</p>}
        {space.amenities.length > 0 && (
          <ul className="tags" aria-label="Amenities">
            {space.amenities.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
        )}
      </header>

      <div className="book-grid">
        <section className="panel book-map" aria-labelledby="map-title">
          <div className="panel__head">
            <div>
              <h2 id="map-title">Pick your seats</h2>
              <p>Each seat is half an hour, from {OPEN_TIME} to {CLOSE_TIME}.</p>
            </div>
            <DatePicker id="book-date" value={date} onChange={changeDate} />
          </div>
          <div className="panel__body">
            <SeatMap
              slots={slots}
              date={date}
              start={form.startTime}
              end={form.endTime}
              conflict={conflict}
              loading={loadingSlots}
              onChange={pickSeats}
              describedBy="map-hint"
            />
            <div className="book-map__foot">
              <SeatLegend items={["free", "chosen", "taken", "mine", "past"]} />
              <p className="hint" id="map-hint">
                Click a start seat, then an end seat, or drag across.
                <span className="sr-only">
                  {" "}
                  Arrow keys move between seats and Enter picks one. You can also set the From and To boxes.
                </span>
              </p>
              {hasRange && (
                <button type="button" className="btn btn--quiet btn--sm" onClick={clearSeats}>
                  Clear my choice
                </button>
              )}
            </div>
          </div>
        </section>

        <aside className="book-aside">
          <section className="panel" aria-labelledby="form-title">
            <div className="panel__head">
              <h2 id="form-title">{isEdit ? "New time and details" : "Your ticket"}</h2>
            </div>
            <div className="panel__body">
              {formError && (
                <p className="notice notice--error" role="alert">
                  <AlertTriangle size={18} aria-hidden /> {formError}
                </p>
              )}

              <form id="book-form" className="form" onSubmit={handleSubmit} noValidate>
                <div className="form-row">
                  <Field id="startTime" label="From" error={errors.startTime}>
                    <select value={form.startTime} onChange={set("startTime")}>
                      <option value="">Choose</option>
                      {startChoices.map(({ t, disabled }) => (
                        <option key={t} value={t} disabled={disabled}>
                          {t}
                          {disabled ? " (not free)" : ""}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field id="endTime" label="To" error={errors.endTime}>
                    <select value={form.endTime} onChange={set("endTime")} disabled={!form.startTime}>
                      <option value="">Choose</option>
                      {endChoices.map(({ t, disabled }) => (
                        <option key={t} value={t} disabled={disabled}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>

                {conflict && !errors.startTime && (
                  <p className="notice notice--warn">
                    <AlertTriangle size={18} aria-hidden /> This time overlaps another booking. Pick free seats on the
                    map.
                  </p>
                )}

                <Field
                  id="attendees"
                  label="People"
                  error={errors.attendees}
                  hint={`This space fits up to ${space.capacity}.`}
                >
                  <input
                    type="number"
                    min="1"
                    max={space.capacity}
                    step="1"
                    value={form.attendees}
                    onChange={set("attendees")}
                  />
                </Field>

                <Field id="purpose" label="Purpose" error={errors.purpose} hint="Shown on your ticket, e.g. Client call.">
                  <input value={form.purpose} onChange={set("purpose")} maxLength={120} placeholder="e.g. Team stand-up" />
                </Field>

                <dl className="ledger receipt" aria-live="polite">
                  <div>
                    <dt>When</dt>
                    <dd>{whenText}</dd>
                  </div>
                  <div>
                    <dt>Length</dt>
                    <dd>{hasRange ? formatDuration(hours) : "–"}</dd>
                  </div>
                  <div>
                    <dt>Rate</dt>
                    <dd>{formatMoney(space.hourlyRate)} / hour</dd>
                  </div>
                  <div className="ledger__total">
                    <dt>Total</dt>
                    <dd>{formatMoney(cost)}</dd>
                  </div>
                </dl>

                <button
                  type="submit"
                  className="btn btn--primary btn--lg btn--block book-submit"
                  disabled={busy || conflict}
                >
                  {busy && <span className="btn__spinner" aria-hidden="true" />}
                  {submitLabel}
                </button>
              </form>
            </div>
          </section>
        </aside>
      </div>

      {/* Phones: the total and the confirm button stay at the bottom of the screen */}
      <div className="book-cta">
        <div className="book-cta__sum">
          <strong className="tabular">{formatMoney(cost)}</strong>
          <span>{whenText}</span>
        </div>
        <button type="submit" form="book-form" className="btn btn--primary" disabled={busy || conflict}>
          {busy && <span className="btn__spinner" aria-hidden="true" />}
          {submitLabel}
        </button>
      </div>
    </div>
  );
}
