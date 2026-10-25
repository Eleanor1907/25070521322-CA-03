// services/bookingService.js
// Calls to /api/bookings.

import api from "./api";

// params: { scope, search, sort, page, limit, all, space, date }
export const getBookings = (params) => api.get("/bookings", { params }).then((r) => r.data);
export const getBooking = (id) => api.get(`/bookings/${id}`).then((r) => r.data);
export const getSummary = () => api.get("/bookings/summary").then((r) => r.data);

export const createBooking = (data) => api.post("/bookings", data).then((r) => r.data);
export const updateBooking = (id, data) => api.put(`/bookings/${id}`, data).then((r) => r.data);
export const cancelBooking = (id) => api.patch(`/bookings/${id}/cancel`).then((r) => r.data);
export const deleteBooking = (id) => api.delete(`/bookings/${id}`).then((r) => r.data);
