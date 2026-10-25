// utils/query.js
// Helpers for search and pagination query-string parameters.

// Escape characters that have special meaning in regular expressions,
// so a search for "Room (A)" doesn't break the query.
function escapeRegex(text) {
  return String(text).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Read ?page= and ?limit= safely (defaults: page 1, 9 per page, max 50)
function getPagination(query, defaultLimit = 9) {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || defaultLimit, 1), 50);
  return { page, limit, skip: (page - 1) * limit };
}

function paginationInfo(page, limit, total) {
  return { page, limit, total, pages: Math.max(Math.ceil(total / limit), 1) };
}

module.exports = { escapeRegex, getPagination, paginationInfo };
