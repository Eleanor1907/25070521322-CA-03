// components/RouteGuards.jsx
// Wrappers that decide who may open a page.

import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Loader } from "./Feedback";

// Logged-in users only; others are sent to /login and come back afterwards.
// (After pressing "Log out" we don't remember the page, so whoever logs in
// next starts at the overview instead of the previous person's page.)
export function ProtectedRoute() {
  const { user, checking, loggedOutOnPurpose } = useAuth();
  const location = useLocation();

  if (checking) return <Loader label="Checking your session…" />;
  if (!user) {
    const state = loggedOutOnPurpose ? undefined : { from: location.pathname + location.search };
    return <Navigate to="/login" replace state={state} />;
  }
  return <Outlet />;
}

// Admins only
export function AdminRoute() {
  const { isAdmin } = useAuth();
  if (!isAdmin) return <Navigate to="/app" replace />;
  return <Outlet />;
}

// Login/register pages: once a user exists (already logged in, or just logged in
// through the form) send them on. This is the ONLY place that redirects after
// login, so there is never a race between two navigations.
export function GuestRoute() {
  const { user, checking } = useAuth();
  const location = useLocation();
  if (checking) return <Loader label="Checking your session…" />;
  if (user) return <Navigate to={location.state?.from || "/app"} replace />;
  return <Outlet />;
}
