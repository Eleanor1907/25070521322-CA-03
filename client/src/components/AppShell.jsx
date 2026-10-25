// components/AppShell.jsx
// Layout for logged-in pages: a sidebar "building directory" on desktop,
// a top bar with a slide-out menu on phones, and the page in <Outlet />.

import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { Building2, CalendarCheck2, LayoutGrid, ListChecks, LogOut, Menu, Search, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../hooks/useToast";
import Wordmark from "./Wordmark";

const MEMBER_LINKS = [
  { to: "/app", label: "Overview", icon: LayoutGrid, end: true },
  { to: "/app/spaces", label: "Find a space", icon: Search },
  { to: "/app/bookings", label: "My bookings", icon: CalendarCheck2 },
];

const ADMIN_LINKS = [
  { to: "/app/admin/spaces", label: "Manage spaces", icon: Building2 },
  { to: "/app/admin/bookings", label: "All bookings", icon: ListChecks },
];

export default function AppShell() {
  const { user, isAdmin, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
    toast.success("You're logged out.");
  };

  const renderLinks = (links) =>
    links.map(({ to, label, icon: Icon, end }) => (
      <NavLink
        key={to}
        to={to}
        end={end}
        onClick={closeMenu}
        className={({ isActive }) => `nav-link ${isActive ? "is-active" : ""}`}
      >
        <Icon size={18} aria-hidden />
        {label}
      </NavLink>
    ));

  return (
    <div className="shell">
      <header className="topbar">
        <Wordmark to="/app" />
        <button
          type="button"
          className="icon-btn"
          onClick={() => setMenuOpen((o) => !o)}
          aria-expanded={menuOpen}
          aria-controls="sidebar"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </header>

      <aside id="sidebar" className={`sidebar ${menuOpen ? "is-open" : ""}`}>
        <div className="sidebar__brand">
          <Wordmark to="/app" onClick={closeMenu} />
        </div>

        <nav className="sidebar__nav" aria-label="Main">
          {renderLinks(MEMBER_LINKS)}
          {isAdmin && (
            <>
              <p className="sidebar__group">Admin</p>
              {renderLinks(ADMIN_LINKS)}
            </>
          )}
        </nav>

        <div className="sidebar__user">
          <div className="avatar" aria-hidden="true">
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div className="sidebar__who">
            <strong>{user?.name}</strong>
            <span>{isAdmin ? "Admin" : "Member"}</span>
          </div>
          <button type="button" className="icon-btn" onClick={handleLogout} aria-label="Log out" title="Log out">
            <LogOut size={18} />
          </button>
        </div>
      </aside>

      {menuOpen && <div className="scrim" onClick={closeMenu} aria-hidden="true" />}

      <main className="main" id="main">
        <Outlet />
      </main>
    </div>
  );
}
