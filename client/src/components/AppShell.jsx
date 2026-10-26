// components/AppShell.jsx
// Layout for logged-in pages: an aubergine top bar with the main links and
// the user, a menu panel on small screens, and the page in <Outlet />.

import { Suspense, useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { Building2, CalendarCheck2, LayoutGrid, ListChecks, LogOut, Menu, Search, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../hooks/useToast";
import Wordmark from "./Wordmark";
import { Loader } from "./Feedback";

const MEMBER_LINKS = [
  { to: "/app", label: "Overview", icon: LayoutGrid, end: true },
  { to: "/app/spaces", label: "Find a space", icon: Search },
  { to: "/app/bookings", label: "My bookings", icon: CalendarCheck2 },
];

const ADMIN_LINKS = [
  { to: "/app/admin/spaces", label: "Manage spaces", icon: Building2 },
  { to: "/app/admin/bookings", label: "All bookings", icon: ListChecks },
];

function NavLinks({ links, onNavigate }) {
  return links.map(({ to, label, icon: Icon, end }) => (
    <NavLink
      key={to}
      to={to}
      end={end}
      onClick={onNavigate}
      className={({ isActive }) => `nav-link ${isActive ? "is-active" : ""}`}
    >
      <Icon size={17} aria-hidden />
      {label}
    </NavLink>
  ));
}

export default function AppShell() {
  const { user, isAdmin, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);

  // Esc closes the phone menu
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e) => e.key === "Escape" && setMenuOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  const handleLogout = () => {
    setMenuOpen(false);
    logout();
    navigate("/login", { replace: true });
    toast.success("You're logged out.");
  };

  const who = (
    <>
      <span className="avatar" aria-hidden="true">
        {user?.name?.[0]?.toUpperCase()}
      </span>
      <span className="bar__who">
        <strong>{user?.name}</strong>
        <span>{isAdmin ? "Admin" : "Member"}</span>
      </span>
    </>
  );

  const logoutButton = (
    <button type="button" className="bar__logout" onClick={handleLogout}>
      <LogOut size={16} aria-hidden /> Log out
    </button>
  );

  return (
    <div className="shell">
      <a href="#main" className="skip-link">
        Skip to content
      </a>

      <header className="bar">
        <div className="bar__inner">
          <Wordmark to="/app" tone="dark" onClick={closeMenu} />

          <nav className="bar__nav" aria-label="Main">
            <NavLinks links={MEMBER_LINKS} />
            {isAdmin && (
              <>
                <span className="bar__divider" aria-hidden="true" />
                <NavLinks links={ADMIN_LINKS} />
              </>
            )}
          </nav>

          <div className="bar__user">
            {who}
            {logoutButton}
          </div>

          <button
            type="button"
            className="bar__menu-btn"
            onClick={() => setMenuOpen((o) => !o)}
            aria-expanded={menuOpen}
            aria-controls="menu-panel"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </header>

      {menuOpen && (
        <>
          <div className="scrim" onClick={closeMenu} aria-hidden="true" />
          <div id="menu-panel" className="menu-panel">
            <nav aria-label="Main">
              <NavLinks links={MEMBER_LINKS} onNavigate={closeMenu} />
              {isAdmin && (
                <>
                  <p className="menu-panel__group">Admin</p>
                  <NavLinks links={ADMIN_LINKS} onNavigate={closeMenu} />
                </>
              )}
            </nav>
            <div className="menu-panel__user">
              {who}
              {logoutButton}
            </div>
          </div>
        </>
      )}

      <main className="main" id="main" tabIndex={-1}>
        <Suspense fallback={<Loader label="Loading page…" />}>
          <Outlet />
        </Suspense>
      </main>
    </div>
  );
}
