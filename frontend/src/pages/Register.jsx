/**
 * Register.jsx — New account registration page.
 *
 * Validates passwords client-side before calling register(), then redirects
 * the newly created user to the home page.
 */

import { useState }              from "react";
import { Link, useNavigate }     from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { persistAccountsToJson } from "../lib/api";

import "../stylesheets/Register.css";

const SECURITY_QUESTIONS = [
  "What is your mother's maiden name?",
  "What was the name of your first pet?",
  "What was the name of your first school?",
  "What city were you born in?",
  "What is your favorite childhood nickname?",
];


// ─── Component ────────────────────────────────────────────────────────────────

export default function Register() {
  const { register } = useAuth();
  const navigate     = useNavigate();

  const [form, setForm] = useState({
    name:            "",
    email:           "",
    phone:           "",
    securityQuestion:"",
    securityAnswer:  "",
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

  async function handleSubmit(e) {
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

    if (!form.phone.trim()) {
      setError("Contact number is required.");
      return;
    }

    if (!form.securityQuestion.trim()) {
      setError("Please select a security question.");
      return;
    }

    if (!form.securityAnswer.trim()) {
      setError("Please provide a security answer.");
      return;
    }

    setLoading(true);

    try {
      register({
        name:             form.name,
        email:            form.email,
        phone:            form.phone,
        securityQuestion: form.securityQuestion,
        securityAnswer:   form.securityAnswer,
        password:         form.password,
        role:             form.role,
      });
      await persistAccountsToJson();
      navigate("/", { replace: true });
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
            Contact number
            <input
              className="register-input"
              type="text"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="07xxxxxxxxx"
              autoComplete="tel"
              required
            />
          </label>

          <label className="register-label">
            Security question
            <select
              className="register-input"
              name="securityQuestion"
              value={form.securityQuestion}
              onChange={handleChange}
              required
            >
              <option value="">Select a security question</option>
              {SECURITY_QUESTIONS.map((question) => (
                <option key={question} value={question}>
                  {question}
                </option>
              ))}
            </select>
          </label>

          <label className="register-label">
            Security answer
            <input
              className="register-input"
              type="text"
              name="securityAnswer"
              value={form.securityAnswer}
              onChange={handleChange}
              placeholder="Your answer"
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
