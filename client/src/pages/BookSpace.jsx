// pages/BookSpace.jsx
// One page for both:
//   /app/spaces/:spaceId/book       -> make a new booking   (POST /api/bookings)
//   /app/bookings/:bookingId/edit   -> reschedule a booking (PUT  /api/bookings/:id)
//
// The large strip shows the chosen day. Clicking a free half hour on it
// sets the start time; the form below shows clashes before you submit.

import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, MapPin, Users } from "lucide-react";
import DayStrip from "../components/DayStrip";
import DateStepper from "../components/DateStepper";
import Field from "../components/Field";
import ZoneTag from "../components/ZoneTag";
import { ErrorState, Loader } from "../components/Feedback";
import { useToast } from "../hooks/useToast";
import { getSpace } from "../services/spaceService";
import { createBooking, getBooking, updateBooking } from "../services/bookingService";
import { parseApiError } from "../services/api";
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

const pad = (n) => String(n).padStart(2, "0");
const plusMinutes = (t, mins) => {
  const m = Math.min(toMinutes(t) + mins, toMinutes(CLOSE_TIME));
  return `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
};

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

  const pickStart = (t) => {
    setForm((f) => ({ ...f, startTime: t, endTime: plusMinutes(t, 60) }));
    setErrors({});
    setFormError("");
  };

  const changeDate = (d) => {
    setDate(d);
    setErrors({});
    setFormError("");
  };

  function validate() {
    const e = {};
    if (!form.startTime) e.startTime = "Pick a start time.";
    else if (startPassed) e.startTime = "This time has already passed today.";
    if (!form.endTime) e.endTime = "Pick an end time.";
    else if (form.startTime && form.endTime <= form.startTime) e.endTime = "End time must be after the start time.";
    if (conflict) e.startTime = "This overlaps another booking. Pick a free gap.";
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
      if (status === 409) loadSpace(); // someone else just took the slot: refresh the strip
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

  return (
    <>
      <Link to={isEdit ? "/app/bookings" : `/app/spaces?date=${date}`} className="back-link">
        <ArrowLeft size={16} aria-hidden /> {isEdit ? "Back to my bookings" : "Back to spaces"}
      </Link>

      <div className={`book zone-${space.type}`}>
        <section className="book__space" aria-labelledby="space-title">
          <h1 id="space-title">{isEdit ? `Reschedule: ${space.name}` : space.name}</h1>
          <p className="meta-line">
            <ZoneTag type={space.type} />
            <span>
              <MapPin size={14} aria-hidden /> {space.floor}
            </span>
            <span>
              <Users size={14} aria-hidden /> Up to {space.capacity}
            </span>
            <span>{formatMoney(space.hourlyRate)} / hour</span>
          </p>
          {space.description && <p className="book__desc">{space.description}</p>}
          {space.amenities.length > 0 && (
            <ul className="amenities">
              {space.amenities.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ul>
          )}

          <div className="book__day">
            <div className="book__day-head">
              <h2>Pick a time</h2>
              <DateStepper id="book-date" value={date} onChange={changeDate} />
            </div>
            <div className={loadingSlots ? "is-refreshing" : ""}>
              <DayStrip
                size="lg"
                date={date}
                zone={space.type}
                slots={slots}
                selection={hasRange ? { startTime: form.startTime, endTime: form.endTime } : null}
                conflict={conflict}
                onPickStart={pickStart}
              />
            </div>
            <div className="legend">
              <span><i className="legend__booked" /> Booked</span>
              <span><i className="legend__mine" /> Yours</span>
              <span><i className="legend__selected" /> Your choice</span>
            </div>
            <p className="hint">Click a free half hour on the strip to start there.</p>
          </div>
        </section>

        <section className="book__form panel" aria-labelledby="form-title">
          <h2 id="form-title" className="panel__title">
            {isEdit ? "New time and details" : "Your booking"}
          </h2>

          {formError && (
            <p className="notice notice--error" role="alert">
              {formError}
            </p>
          )}

          <form className="form" onSubmit={handleSubmit} noValidate>
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
              <p className="notice notice--warn">This time overlaps another booking. Pick a free gap on the strip.</p>
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

            <Field id="purpose" label="Purpose" error={errors.purpose} hint="Shown on your booking, e.g. Client call.">
              <input value={form.purpose} onChange={set("purpose")} maxLength={120} placeholder="e.g. Team stand-up" />
            </Field>

            <dl className="receipt">
              <div>
                <dt>When</dt>
                <dd>{hasRange ? `${relativeDay(date)}, ${form.startTime}–${form.endTime}` : "Choose a time"}</dd>
              </div>
              <div>
                <dt>Length</dt>
                <dd>{hasRange ? formatDuration(hours) : "–"}</dd>
              </div>
              <div className="receipt__total">
                <dt>Total</dt>
                <dd>{formatMoney(cost)}</dd>
              </div>
            </dl>

            <button type="submit" className="btn btn--primary btn--block" disabled={busy || conflict}>
              {busy ? "Saving…" : isEdit ? "Save new time" : "Confirm booking"}
            </button>
          </form>
        </section>
      </div>
    </>
  );
}
