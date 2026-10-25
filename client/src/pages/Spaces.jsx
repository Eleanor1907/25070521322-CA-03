// pages/Spaces.jsx
// Browse spaces for a chosen day. Filters live in the URL (?date=&type=...)
// so refreshing the page or sharing the link keeps them.

import { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { MapPin, Search, Users } from "lucide-react";
import PageHeader from "../components/PageHeader";
import DateStepper from "../components/DateStepper";
import DayStrip from "../components/DayStrip";
import ZoneTag from "../components/ZoneTag";
import Pagination from "../components/Pagination";
import { EmptyState, ErrorState, Loader } from "../components/Feedback";
import useDebounce from "../hooks/useDebounce";
import { getSpaces } from "../services/spaceService";
import { parseApiError } from "../services/api";
import { SPACE_TYPES, formatMoney, todayString } from "../utils/format";

const SORTS = [
  { value: "name", label: "Name" },
  { value: "price-asc", label: "Price, low to high" },
  { value: "price-desc", label: "Price, high to low" },
  { value: "capacity-desc", label: "Most seats" },
];

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
      <PageHeader title="Find a space" subtitle="Pick a day, then choose any space with a free gap." />

      <div className="toolbar">
        <DateStepper value={date} onChange={(d) => update({ date: d })} />

        <div className="search">
          <Search size={18} aria-hidden />
          <label htmlFor="space-search" className="sr-only">
            Search spaces
          </label>
          <input
            id="space-search"
            type="search"
            placeholder="Search by name or floor"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

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

        <div className="toolbar__selects">
          <label className="select-inline">
            <span>People</span>
            <select value={minCapacity} onChange={(e) => update({ people: e.target.value })}>
              <option value="">Any</option>
              <option value="2">2 or more</option>
              <option value="4">4 or more</option>
              <option value="8">8 or more</option>
            </select>
          </label>
          <label className="select-inline">
            <span>Sort</span>
            <select value={sort} onChange={(e) => update({ sort: e.target.value })}>
              {SORTS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {error && <ErrorState message={error} onRetry={load} />}
      {loading && !result && <Loader label="Finding spaces…" />}

      {result && !error && (
        <div className={loading ? "is-refreshing" : ""}>
          {result.data.length === 0 ? (
            <EmptyState
              title="No spaces match"
              text="Try another type, fewer people or a different search."
              action={
                hasFilters && (
                  <button
                    type="button"
                    className="btn btn--ghost"
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
          ) : (
            <ul className="space-list">
              {result.data.map((s) => (
                <li key={s._id} className={`space-row zone-${s.type}`}>
                  <div className="space-row__info">
                    <h2>{s.name}</h2>
                    <p className="meta-line">
                      <ZoneTag type={s.type} />
                      <span>
                        <MapPin size={14} aria-hidden /> {s.floor}
                      </span>
                      <span>
                        <Users size={14} aria-hidden /> {s.capacity} {s.capacity === 1 ? "seat" : "seats"}
                      </span>
                    </p>
                    {s.amenities.length > 0 && <p className="space-row__amenities">{s.amenities.join(", ")}</p>}
                  </div>

                  <div className="space-row__strip">
                    <DayStrip slots={s.bookedSlots} date={date} zone={s.type} />
                  </div>

                  <div className="space-row__book">
                    <span className="price">
                      {formatMoney(s.hourlyRate)}
                      <small> / hour</small>
                    </span>
                    <Link className="btn btn--primary btn--sm" to={`/app/spaces/${s._id}/book?date=${date}`}>
                      Book
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <Pagination pagination={result.pagination} noun="spaces" onPage={(p) => update({ page: String(p) })} />
        </div>
      )}
    </>
  );
}
