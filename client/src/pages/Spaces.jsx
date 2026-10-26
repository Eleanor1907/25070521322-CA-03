// pages/Spaces.jsx
// Browse spaces for a chosen day. Each space is a row of half-hour seats.
// Filters live in the URL (?date=&type=...) so refreshing or sharing the link keeps them.

import { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { MapPin, Search, Users } from "lucide-react";
import PageHeader from "../components/PageHeader";
import DatePicker from "../components/DatePicker";
import TypeTag from "../components/TypeTag";
import Pagination from "../components/Pagination";
import { SeatLegend, SeatRow, SeatRuler } from "../components/Seats";
import { EmptyState, ErrorState, SkeletonList } from "../components/Feedback";
import useDebounce from "../hooks/useDebounce";
import { getSpaces } from "../services/spaceService";
import { parseApiError } from "../services/api";
import { describeSlots, seatState, seatTimes } from "../utils/seats";
import { SPACE_TYPES, formatMoney, nowTimeString, relativeDay, todayString } from "../utils/format";

const SORTS = [
  { value: "name", label: "Name" },
  { value: "price-asc", label: "Price, low to high" },
  { value: "price-desc", label: "Price, high to low" },
  { value: "capacity-desc", label: "Most seats" },
];

const TIMES = seatTimes();

function freeSeats(slots, date) {
  const clock = { today: todayString(), now: nowTimeString() };
  return TIMES.filter((t) => seatState(t, slots, date, clock) === "free").length;
}

function freeText(n) {
  if (n === 0) return "No free seats left";
  const hours = n / 2;
  return `${n} free ${n === 1 ? "seat" : "seats"} (${hours} ${hours === 1 ? "hour" : "hours"})`;
}

export default function Spaces() {
  const [params, setParams] = useSearchParams();
  const date = params.get("date") && params.get("date") >= todayString() ? params.get("date") : todayString();
  const type = params.get("type") || "";
  const minCapacity = params.get("people") || "";
  const sort = params.get("sort") || "name";
  const page = Number(params.get("page")) || 1;

  const [search, setSearch] = useState(params.get("q") || "");
  const debouncedSearch = useDebounce(search);

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Update one or more URL params; any filter change goes back to page 1
  const update = useCallback(
    (changes) => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          for (const [k, v] of Object.entries(changes)) {
            if (v === "" || v === null || v === undefined) next.delete(k);
            else next.set(k, v);
          }
          if (!("page" in changes)) next.delete("page");
          return next;
        },
        { replace: true }
      );
    },
    [setParams]
  );

  // Keep the search box and the URL in sync (after the user stops typing)
  useEffect(() => {
    if ((params.get("q") || "") !== debouncedSearch) update({ q: debouncedSearch });
  }, [debouncedSearch, params, update]);

  const load = useCallback(() => {
    setLoading(true);
    setError("");
    getSpaces({ date, type, minCapacity, sort, page, limit: 6, search: params.get("q") || "" })
      .then((res) => setResult(res))
      .catch((err) => setError(parseApiError(err).message))
      .finally(() => setLoading(false));
  }, [date, type, minCapacity, sort, page, params]);

  useEffect(load, [load]);

  const hasFilters = type || minCapacity || params.get("q");

  return (
    <>
      <PageHeader title="Find a space" subtitle="Pick a day. Green seats are free half hours; book any run of them." />

      <div className="filters">
        <DatePicker id="spaces-date" value={date} onChange={(d) => update({ date: d })} />

        <div className="search filters__grow">
          <Search size={18} aria-hidden />
          <label htmlFor="space-search" className="sr-only">
            Search spaces
          </label>
          <input
            id="space-search"
            className="input"
            type="search"
            placeholder="Search by name or floor"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <label className="select-inline" style={{ "--label-w": "3.6em" }}>
          <span>People</span>
          <select className="select" value={minCapacity} onChange={(e) => update({ people: e.target.value })}>
            <option value="">Any</option>
            <option value="2">2 or more</option>
            <option value="4">4 or more</option>
            <option value="8">8 or more</option>
          </select>
        </label>
        <label className="select-inline" style={{ "--label-w": "2.4em" }}>
          <span>Sort</span>
          <select className="select" value={sort} onChange={(e) => update({ sort: e.target.value })}>
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="list-head">
        <div className="segmented" role="group" aria-label="Space type">
          <button type="button" className={!type ? "is-on" : ""} aria-pressed={!type} onClick={() => update({ type: "" })}>
            All
          </button>
          {SPACE_TYPES.map((t) => (
            <button
              key={t.value}
              type="button"
              className={type === t.value ? "is-on" : ""}
              aria-pressed={type === t.value}
              onClick={() => update({ type: t.value })}
            >
              {t.plural}
            </button>
          ))}
        </div>
        <SeatLegend />
      </div>

      {error && <ErrorState message={error} onRetry={load} />}
      {loading && !result && !error && <SkeletonList count={3} label="Finding spaces" />}

      {result && !error && (
        <div className={loading ? "is-refreshing" : ""} aria-busy={loading}>
          {result.data.length === 0 ? (
            <div className="panel">
              <EmptyState
                title="No spaces match"
                text="Try another type, fewer people or a different search."
                action={
                  hasFilters && (
                    <button
                      type="button"
                      className="btn btn--secondary"
                      onClick={() => {
                        setSearch("");
                        update({ type: "", people: "", q: "" });
                      }}
                    >
                      Clear filters
                    </button>
                  )
                }
              />
            </div>
          ) : (
            <ul className="panel space-list" aria-label={`Spaces for ${relativeDay(date)}`}>
              {result.data.map((s) => {
                const free = freeSeats(s.bookedSlots, date);
                const bookUrl = `/app/spaces/${s._id}/book?date=${date}`;
                return (
                  <li key={s._id} className="space-row">
                    <div className="space-row__info">
                      <h2>
                        <Link to={bookUrl}>{s.name}</Link>
                      </h2>
                      <p className="meta">
                        <TypeTag type={s.type} />
                        <span>
                          <MapPin size={14} aria-hidden /> {s.floor}
                        </span>
                        <span>
                          <Users size={14} aria-hidden /> {s.capacity} {s.capacity === 1 ? "seat" : "seats"}
                        </span>
                      </p>
                      {s.amenities.length > 0 && <p className="space-row__amenities">{s.amenities.join(" · ")}</p>}
                    </div>

                    <div className="space-row__day">
                      <span className={`space-row__free ${free === 0 ? "is-none" : ""}`}>{freeText(free)}</span>
                      <SeatRow slots={s.bookedSlots} date={date} label={`${s.name}: ${describeSlots(s.bookedSlots)}`} />
                      <SeatRuler />
                    </div>

                    <div className="space-row__book">
                      <span className="price">
                        {formatMoney(s.hourlyRate)}
                        <small> / hour</small>
                      </span>
                      <span className="space-row__price-inline">{formatMoney(s.hourlyRate)} / hour</span>
                      {free > 0 ? (
                        <Link className="btn btn--primary btn--sm" to={bookUrl} aria-label={`Book ${s.name}`}>
                          Book
                        </Link>
                      ) : (
                        <Link className="btn btn--secondary btn--sm" to={bookUrl} aria-label={`See ${s.name}`}>
                          See day
                        </Link>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          <Pagination pagination={result.pagination} noun="spaces" onPage={(p) => update({ page: String(p) })} />
        </div>
      )}
    </>
  );
}
