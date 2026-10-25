// components/Pagination.jsx

import { ChevronLeft, ChevronRight } from "lucide-react";

export default function Pagination({ pagination, onPage, noun = "results" }) {
  if (!pagination || pagination.total === 0) return null;
  const { page, pages, total, limit } = pagination;
  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  return (
    <nav className="pagination" aria-label="Pages">
      <span className="pagination__info">
        {from}–{to} of {total} {noun}
      </span>
      {pages > 1 && (
        <div className="pagination__buttons">
          <button type="button" className="btn btn--ghost btn--sm" onClick={() => onPage(page - 1)} disabled={page <= 1}>
            <ChevronLeft size={16} aria-hidden /> Previous
          </button>
          <span className="pagination__page">
            Page {page} of {pages}
          </span>
          <button type="button" className="btn btn--ghost btn--sm" onClick={() => onPage(page + 1)} disabled={page >= pages}>
            Next <ChevronRight size={16} aria-hidden />
          </button>
        </div>
      )}
    </nav>
  );
}
