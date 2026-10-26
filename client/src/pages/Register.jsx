// pages/Register.jsx

import { useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle } from "lucide-react";
import AuthLayout from "../components/AuthLayout";
import Field from "../components/Field";
import PasswordInput from "../components/PasswordInput";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../hooks/useToast";
import { parseApiError } from "../services/api";

function validate(v) {
  const e = {};
  if (v.name.trim().length < 2) e.name = "Enter your name (at least 2 characters).";
  if (!/^\S+@\S+\.\S+$/.test(v.email.trim())) e.email = "Enter a valid email address.";
  if (v.password.length < 6) e.password = "Use at least 6 characters.";
  if (v.confirm !== v.password) e.confirm = "The two passwords don't match.";
  return e;
}

export default function Register() {
  const { register } = useAuth();
  const toast = useToast();

  const [values, setValues] = useState({ name: "", email: "", password: "", confirm: "" });
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
    const found = validate(values);
    setErrors(found);
    if (Object.keys(found).length) return;

    setBusy(true);
    try {
      // On success the new user is logged in and <GuestRoute> opens the app
      const res = await register({
        name: values.name.trim(),
        email: values.email.trim(),
        password: values.password,
      });
      toast.success(res.message);
    } catch (err) {
      const { message, fieldErrors } = parseApiError(err);
      setErrors(fieldErrors);
      setFormError(message);
      setBusy(false);
    }
  };

  return (
    <AuthLayout
      headline="Book your first seat in a minute."
      lead="Create an account, then book any free desk, room or cabin by the half hour."
    >
      <h1>Create your account</h1>
      <p className="auth__sub">It takes a minute. Then you can book any free seat.</p>

      {formError && (
        <p className="notice notice--error" role="alert">
          <AlertTriangle size={18} aria-hidden /> {formError}
        </p>
      )}

      <form className="form" onSubmit={handleSubmit} noValidate>
        <Field id="name" label="Full name" error={errors.name}>
          <input autoComplete="name" value={values.name} onChange={set("name")} maxLength={60} autoFocus />
        </Field>
        <Field id="email" label="Email" error={errors.email}>
          <input type="email" autoComplete="email" value={values.email} onChange={set("email")} />
        </Field>
        <Field id="password" label="Password" error={errors.password} hint="At least 6 characters.">
          <PasswordInput autoComplete="new-password" value={values.password} onChange={set("password")} />
        </Field>
        <Field id="confirm" label="Confirm password" error={errors.confirm}>
          <PasswordInput autoComplete="new-password" value={values.confirm} onChange={set("confirm")} />
        </Field>
        <button type="submit" className="btn btn--primary btn--lg btn--block" disabled={busy}>
          {busy && <span className="btn__spinner" aria-hidden="true" />}
          {busy ? "Creating account…" : "Create account"}
        </button>
      </form>

      <p className="auth__switch">
        Already have an account?{" "}
        <Link className="text-link" to="/login">
          Log in
        </Link>
      </p>
    </AuthLayout>
  );
}
