// App.jsx
// All pages and who may open them.

import { Route, Routes } from "react-router-dom";
import AppShell from "./components/AppShell";
import { AdminRoute, GuestRoute, ProtectedRoute } from "./components/RouteGuards";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Overview from "./pages/Overview";
import Spaces from "./pages/Spaces";
import BookSpace from "./pages/BookSpace";
import MyBookings from "./pages/MyBookings";
import AdminSpaces from "./pages/AdminSpaces";
import AdminBookings from "./pages/AdminBookings";
import NotFound from "./pages/NotFound";

export default function App() {
  return (
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
  );
}
