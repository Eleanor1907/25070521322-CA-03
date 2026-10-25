// context/AuthContext.jsx
// Keeps track of who is logged in and shares it with every page.
//
// The login token (JWT) is kept in localStorage only so you stay logged in
// after a refresh. All real data (users, spaces, bookings) lives in MongoDB.

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import * as authService from "../services/authService";
import { TOKEN_KEY } from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // true while we verify a saved token (only needed if there is one)
  const [checking, setChecking] = useState(() => Boolean(localStorage.getItem(TOKEN_KEY)));
  const [sessionExpired, setSessionExpired] = useState(false);
  const [loggedOutOnPurpose, setLoggedOutOnPurpose] = useState(false);

  // On first load: if a token is saved, ask the server who it belongs to
  useEffect(() => {
    if (!localStorage.getItem(TOKEN_KEY)) return;
    authService
      .getMe()
      .then((res) => setUser(res.user))
      .catch(() => localStorage.removeItem(TOKEN_KEY))
      .finally(() => setChecking(false));
  }, []);

  // The Axios interceptor fires this event when the server rejects our token
  useEffect(() => {
    const onExpired = () => {
      setUser(null);
      setSessionExpired(true);
    };
    window.addEventListener("flexi:session-expired", onExpired);
    return () => window.removeEventListener("flexi:session-expired", onExpired);
  }, []);

  const saveSession = useCallback((res) => {
    localStorage.setItem(TOKEN_KEY, res.token);
    setUser(res.user);
    setSessionExpired(false);
    setLoggedOutOnPurpose(false);
    return res;
  }, []);

  const login = useCallback((data) => authService.login(data).then(saveSession), [saveSession]);
  const register = useCallback((data) => authService.register(data).then(saveSession), [saveSession]);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setLoggedOutOnPurpose(true); // so the next login starts fresh at /app
    setSessionExpired(false);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAdmin: user?.role === "admin",
      checking,
      sessionExpired,
      loggedOutOnPurpose,
      login,
      register,
      logout,
    }),
    [user, checking, sessionExpired, loggedOutOnPurpose, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
