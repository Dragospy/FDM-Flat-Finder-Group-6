/**
 * Register.jsx — New account registration page.
 *
 * Validates passwords client-side before calling register(), then redirects
 * the newly created user to the dashboard (they are logged in immediately).
 */

import { useState }              from "react";
import { Link, useNavigate }     from "react-router-dom";

import { useAuth } from "../context/AuthContext";

import "../stylesheets/Register.css";


// ─── Component ────────────────────────────────────────────────────────────────

export default function Register() {
  const { register } = useAuth();
  const navigate     = useNavigate();

  const [form, setForm] = useState({
    name:            "",
    email:           "",
    password:        "",
    confirmPassword: "",
    role:            "rentee",
  });
  const [error,   setError]   = useState("");
  const [loading, setLoading] = useState(false);


  // ── Handlers ────────────────────────────────────────────────────────────────

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    try {
      register({
        name:     form.name,
        email:    form.email,
        password: form.password,
        role:     form.role,
      });
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }


  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="register-page">
      <div className="register-card">

        <h1 className="register-title">Create an account</h1>
        <p className="register-subtitle">Find your next home.</p>

        {error && <p className="register-error">{error}</p>}

        <form onSubmit={handleSubmit} className="register-form">
          <label className="register-label">
            Full name
            <input
              className="register-input"
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Jane Doe"
              autoComplete="name"
              required
            />
          </label>

          <label className="register-label">
            Email
            <input
              className="register-input"
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </label>

          <label className="register-label">
            Password
            <input
              className="register-input"
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Min. 6 characters"
              autoComplete="new-password"
              required
            />
          </label>

          <label className="register-label">
            Confirm password
            <input
              className="register-input"
              type="password"
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={handleChange}
              placeholder="Repeat your password"
              autoComplete="new-password"
              required
            />
          </label>

          <fieldset className="register-fieldset">
            <legend className="register-legend">I am a…</legend>
            <div className="register-radio-group">
              <label className="register-radio-label">
                <input
                  type="radio"
                  name="role"
                  value="rentee"
                  checked={form.role === "rentee"}
                  onChange={handleChange}
                />
                Rentee
              </label>
              <label className="register-radio-label">
                <input
                  type="radio"
                  name="role"
                  value="host"
                  checked={form.role === "host"}
                  onChange={handleChange}
                />
                Host / Landlord
              </label>
            </div>
          </fieldset>

          <button className="register-button" type="submit" disabled={loading}>
            {loading ? "Creating account…" : "Create account"}
          </button>
        </form>

        <p className="register-footer">
          Already have an account?{" "}
          <Link to="/login" className="register-link">Sign in</Link>
        </p>

      </div>
    </div>
  );
}
