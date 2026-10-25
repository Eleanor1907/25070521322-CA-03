// services/spaceService.js
// Calls to /api/spaces.

import api from "./api";

// params: { search, type, minCapacity, sort, page, limit, date, includeInactive }
export const getSpaces = (params) => api.get("/spaces", { params }).then((r) => r.data);

// params: { date, excludeBooking }
export const getSpace = (id, params) => api.get(`/spaces/${id}`, { params }).then((r) => r.data);

export const getBoard = (date) => api.get("/spaces/board", { params: { date } }).then((r) => r.data);

export const createSpace = (data) => api.post("/spaces", data).then((r) => r.data);
export const updateSpace = (id, data) => api.put(`/spaces/${id}`, data).then((r) => r.data);
export const deleteSpace = (id) => api.delete(`/spaces/${id}`).then((r) => r.data);
