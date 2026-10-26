// services/api.js
// One shared Axios instance for every request to the Express backend.
//
// During development (npm run dev) the app calls "/api" on its own address and
// Vite forwards it to the backend (see vite.config.js). For a production build,
// VITE_API_URL in client/.env can point to wherever the API is hosted.

import axios from "axios";

export const TOKEN_KEY = "flexi_token";

const baseURL = import.meta.env.DEV ? "/api" : import.meta.env.VITE_API_URL || "/api";

const api = axios.create({
  baseURL,
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
});

// Before every request: attach the login token if we have one
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// After every response: if the server says our token is no longer valid,
// forget it and tell the AuthContext to log out.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isLoginCall = error.config?.url?.startsWith("/auth/");
    if (error.response?.status === 401 && !isLoginCall && localStorage.getItem(TOKEN_KEY)) {
      localStorage.removeItem(TOKEN_KEY);
      window.dispatchEvent(new Event("flexi:session-expired"));
    }
    return Promise.reject(error);
  }
);

// Turn any Axios error into a simple object the UI can show:
// { message: "text for a toast", fieldErrors: { email: "..." } }
export function parseApiError(error) {
  const { response, request } = error;
  const data = response?.data;
  const fromFlexi = data && typeof data === "object" && "success" in data;

  // A normal Pine error answer: show its message and field errors
  if (response && fromFlexi) {
    return {
      status: response.status,
      message: data.message || `Request failed (${response.status}).`,
      fieldErrors: data.errors || {},
    };
  }

  // No answer at all, or the Vite dev proxy answering 5xx because the backend isn't running
  if (request && (!response || response.status >= 500)) {
    return {
      status: 0,
      message: "Can't reach the Pine server. Check that the backend window is open and running on port 5000.",
      fieldErrors: {},
    };
  }

  if (response) return { status: response.status, message: `Request failed (${response.status}).`, fieldErrors: {} };
  return { status: 0, message: error.message, fieldErrors: {} };
}

export default api;
