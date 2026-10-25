// pages/AdminSpaces.jsx
// Admins add, edit and delete spaces (POST / PUT / DELETE /api/spaces).

import { useCallback, useEffect, useState } from "react";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import PageHeader from "../components/PageHeader";
import ZoneTag from "../components/ZoneTag";
import Modal from "../components/Modal";
import SpaceForm from "../components/SpaceForm";
import ConfirmDialog from "../components/ConfirmDialog";
import Pagination from "../components/Pagination";
import { EmptyState, ErrorState, Loader } from "../components/Feedback";
import useDebounce from "../hooks/useDebounce";
import { useToast } from "../hooks/useToast";
import { createSpace, deleteSpace, getSpaces, updateSpace } from "../services/spaceService";
import { parseApiError } from "../services/api";
import { SPACE_TYPES, formatDate, formatMoney } from "../utils/format";

export default function AdminSpaces() {
  const toast = useToast();
  const [search, setSearch] = useState("");
  const debounced = useDebounce(search);
  const [type, setType] = useState("");
  const [sort, setSort] = useState("name");
  const [page, setPage] = useState(1);

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [editing, setEditing] = useState(null); // null = closed, {} = new, space = edit
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError("");
    getSpaces({ search: debounced, type, sort, page, limit: 10, includeInactive: true })
      .then(setResult)
      .catch((err) => setError(parseApiError(err).message))
      .finally(() => setLoading(false));
  }, [debounced, type, sort, page]);

  useEffect(load, [load]);

  const openForm = (space) => {
    setFormErrors({});
    setEditing(space || {});
  };

  const save = async (values) => {
    setSaving(true);
    setFormErrors({});
    try {
      const res = editing._id ? await updateSpace(editing._id, values) : await createSpace(values);
      toast.success(res.message);
      setEditing(null);
      load();
    } catch (err) {
      const { message, fieldErrors } = parseApiError(err);
      setFormErrors(fieldErrors);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    setDeleting(true);
    try {
      const res = await deleteSpace(toDelete._id);
      toast.success(res.message);
      setToDelete(null);
      if (result.data.length === 1 && page > 1) setPage(page - 1);
      else load();
    } catch (err) {
      toast.error(parseApiError(err).message);
      setToDelete(null);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Manage spaces"
        subtitle="Add new spaces, change prices and seats, or close a space for booking."
        actions={
          <button type="button" className="btn btn--primary" onClick={() => openForm(null)}>
            <Plus size={18} aria-hidden /> Add space
          </button>
        }
      />

      <div className="toolbar">
        <div className="search">
          <Search size={18} aria-hidden />
          <label htmlFor="admin-space-search" className="sr-only">
            Search spaces
          </label>
          <input
            id="admin-space-search"
            type="search"
            placeholder="Search by name, floor or description"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <label className="select-inline">
          <span>Type</span>
          <select
            value={type}
            onChange={(e) => {
              setType(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All types</option>
            {SPACE_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.plural}
              </option>
            ))}
          </select>
        </label>
        <label className="select-inline">
          <span>Sort</span>
          <select
            value={sort}
            onChange={(e) => {
              setSort(e.target.value);
              setPage(1);
            }}
          >
            <option value="name">Name</option>
            <option value="newest">Newest</option>
            <option value="price-desc">Highest rate</option>
            <option value="capacity-desc">Most seats</option>
          </select>
        </label>
      </div>

      {error && <ErrorState message={error} onRetry={load} />}
      {loading && !result && <Loader label="Loading spaces…" />}

      {result && !error && (
        <div className={loading ? "is-refreshing" : ""}>
          {result.data.length === 0 ? (
            <EmptyState
              title={debounced || type ? "No spaces match" : "No spaces yet"}
              text={debounced || type ? "Try a different search or type." : "Add the first desk, room or cabin."}
              action={
                !(debounced || type) && (
                  <button type="button" className="btn btn--primary" onClick={() => openForm(null)}>
                    Add space
                  </button>
                )
              }
            />
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th scope="col">Space</th>
                    <th scope="col">Type</th>
                    <th scope="col" className="num">Seats</th>
                    <th scope="col" className="num">Rate / hour</th>
                    <th scope="col">Status</th>
                    <th scope="col">Updated</th>
                    <th scope="col"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody>
                  {result.data.map((s) => (
                    <tr key={s._id} className={s.isActive ? "" : "is-muted"}>
                      <td data-label="Space">
                        <strong>{s.name}</strong>
                        <span className="cell-sub">{s.floor}</span>
                      </td>
                      <td data-label="Type">
                        <ZoneTag type={s.type} />
                      </td>
                      <td data-label="Seats" className="num">{s.capacity}</td>
                      <td data-label="Rate / hour" className="num">{formatMoney(s.hourlyRate)}</td>
                      <td data-label="Status">
                        <span className={`badge ${s.isActive ? "badge--confirmed" : "badge--cancelled"}`}>
                          {s.isActive ? "Open" : "Closed"}
                        </span>
                      </td>
                      <td data-label="Updated">{formatDate(s.updatedAt.slice(0, 10), { day: "numeric", month: "short" })}</td>
                      <td className="row-actions">
                        <button type="button" className="icon-btn" onClick={() => openForm(s)} aria-label={`Edit ${s.name}`}>
                          <Pencil size={17} />
                        </button>
                        <button
                          type="button"
                          className="icon-btn icon-btn--danger"
                          onClick={() => setToDelete(s)}
                          aria-label={`Delete ${s.name}`}
                        >
                          <Trash2 size={17} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <Pagination pagination={result.pagination} noun="spaces" onPage={setPage} />
        </div>
      )}

      <Modal open={Boolean(editing)} title={editing?._id ? `Edit ${editing.name}` : "Add a space"} onClose={() => !saving && setEditing(null)}>
        {editing && (
          <SpaceForm
            key={editing._id || "new"}
            initial={editing}
            onSubmit={save}
            onCancel={() => setEditing(null)}
            serverErrors={formErrors}
            busy={saving}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(toDelete)}
        busy={deleting}
        title={`Delete ${toDelete?.name}?`}
        message="The space and its past or cancelled bookings will be removed. Spaces with upcoming bookings can't be deleted; close them for booking instead."
        confirmLabel="Delete space"
        onConfirm={remove}
        onClose={() => setToDelete(null)}
      />
    </>
  );
}
