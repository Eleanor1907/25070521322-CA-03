// App.jsx
// All pages and who may open them. Each page is loaded only when it is first
// opened, so the first visit downloads less.

import { Suspense, lazy } from "react";
import { Route, Routes } from "react-router-dom";
import AppShell from "./components/AppShell";
import { AdminRoute, GuestRoute, ProtectedRoute } from "./components/RouteGuards";
import { Loader } from "./components/Feedback";

const Landing = lazy(() => import("./pages/Landing"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const Overview = lazy(() => import("./pages/Overview"));
const Spaces = lazy(() => import("./pages/Spaces"));
const BookSpace = lazy(() => import("./pages/BookSpace"));
const MyBookings = lazy(() => import("./pages/MyBookings"));
const AdminSpaces = lazy(() => import("./pages/AdminSpaces"));
const AdminBookings = lazy(() => import("./pages/AdminBookings"));
const NotFound = lazy(() => import("./pages/NotFound"));

export default function App() {
  return (
    <Suspense fallback={<Loader label="Loading…" />}>
      <Routes>
        <Route path="/" element={<Landing />} />

        {/* Only for visitors who are not logged in */}
        <Route element={<GuestRoute />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>

        {/* Logged-in area */}
        <Route element={<ProtectedRoute />}>
          <Route path="/app" element={<AppShell />}>
            <Route index element={<Overview />} />
            <Route path="spaces" element={<Spaces />} />
            <Route path="spaces/:spaceId/book" element={<BookSpace />} />
            <Route path="bookings" element={<MyBookings />} />
            <Route path="bookings/:bookingId/edit" element={<BookSpace />} />

            {/* Admins only */}
            <Route element={<AdminRoute />}>
              <Route path="admin/spaces" element={<AdminSpaces />} />
              <Route path="admin/bookings" element={<AdminBookings />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}
