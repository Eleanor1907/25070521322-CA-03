// services/authService.js
// Calls to /api/auth. Each function returns the JSON body from the server.

import api from "./api";

export const register = (data) => api.post("/auth/register", data).then((r) => r.data);
export const login = (data) => api.post("/auth/login", data).then((r) => r.data);
export const getMe = () => api.get("/auth/me").then((r) => r.data);
