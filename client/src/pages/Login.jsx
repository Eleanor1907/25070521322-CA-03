// pages/Login.jsx

import { useState } from "react";
import { Link } from "react-router-dom";
import Wordmark from "../components/Wordmark";
import Field from "../components/Field";
import PasswordInput from "../components/PasswordInput";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../hooks/useToast";
import { parseApiError } from "../services/api";

export default function Login() {
  const { login, sessionExpired } = useAuth();
  const toast = useToast();

  const [values, setValues] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);

  const set = (key) => (e) => {
    setValues((v) => ({ ...v, [key]: e.target.value }));
    setErrors((er) => ({ ...er, [key]: undefined }));
    setFormError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const found = {};
    if (!values.email.trim()) found.email = "Enter your email.";
    if (!values.password) found.password = "Enter your password.";
    setErrors(found);
    if (Object.keys(found).length) return;

    setBusy(true);
    try {
      // On success the AuthContext stores the user, and <GuestRoute> sends us
      // to the page we originally wanted (or /app).
      const res = await login({ email: values.email.trim(), password: values.password });
      toast.success(res.message);
    } catch (err) {
      const { message, fieldErrors } = parseApiError(err);
      setErrors(fieldErrors);
      setFormError(message);
      setBusy(false);
    }
  };

  return (
    <div className="auth">
      <div className="auth__panel">
        <Wordmark />
        <h1>Log in</h1>
        <p className="auth__sub">Welcome back. Your bookings are where you left them.</p>

        {sessionExpired && !formError && (
          <p className="notice">Your session ended. Log in again to continue.</p>
        )}
        {formError && (
          <p className="notice notice--error" role="alert">
            {formError}
          </p>
        )}

        <form className="form" onSubmit={handleSubmit} noValidate>
          <Field id="email" label="Email" error={errors.email}>
            <input type="email" autoComplete="email" value={values.email} onChange={set("email")} autoFocus />
          </Field>
          <Field id="password" label="Password" error={errors.password}>
            <PasswordInput autoComplete="current-password" value={values.password} onChange={set("password")} />
          </Field>
          <button type="submit" className="btn btn--primary btn--block" disabled={busy}>
            {busy ? "Logging in…" : "Log in"}
          </button>
        </form>

        <p className="auth__switch">
          New to FLEXI? <Link to="/register">Create an account</Link>
        </p>

        <details className="demo-accounts">
          <summary>Demo accounts (after running the seed script)</summary>
          <dl>
            <dt>Admin</dt>
            <dd>admin@flexi.com / Admin@123</dd>
            <dt>Member</dt>
            <dd>riya@flexi.com / Member@123</dd>
          </dl>
        </details>
      </div>
    </div>
  );
}
