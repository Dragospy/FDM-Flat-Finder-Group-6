/**
 * Login.jsx — Sign-in page.
 *
 * After a successful login the user is sent back to wherever they came from
 * (preserved in location state by ProtectedRoute), or to "/dashboard" by default.
 */

import { useState }                          from "react";
import { Link, useNavigate, useLocation }    from "react-router-dom";

import { useAuth } from "../context/AuthContext";

import "../stylesheets/Login.css";


// ─── Component ────────────────────────────────────────────────────────────────

export default function Login() {
  const { login }  = useAuth();
  const navigate   = useNavigate();
  const location   = useLocation();

  const redirectTo = location.state?.from?.pathname ?? "/dashboard";

  const [form,    setForm]    = useState({ email: "", password: "" });
  const [error,   setError]   = useState("");
  const [loading, setLoading] = useState(false);


  // ── Handlers ────────────────────────────────────────────────────────────────

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      login(form.email, form.password);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }


  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="login-page">
      <div className="login-card">

        <h1 className="login-title">Sign in</h1>
        <p className="login-subtitle">Welcome back. Enter your credentials to continue.</p>

        {error && <p className="login-error">{error}</p>}

        <form onSubmit={handleSubmit} className="login-form">
          <label className="login-label">
            Email
            <input
              className="login-input"
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </label>

          <label className="login-label">
            Password
            <input
              className="login-input"
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
          </label>

          <button className="login-button" type="submit" disabled={loading}>
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="login-footer">
          Don&apos;t have an account?{" "}
          <Link to="/register" className="login-link">Register</Link>
        </p>

        <p className="login-hint">
          Demo: <strong>alice@example.com</strong> / <strong>password123</strong>
        </p>

      </div>
    </div>
  );
}
