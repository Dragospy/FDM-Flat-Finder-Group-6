/**
 * Login.jsx — Sign-in page.
 *
 * After a successful login the user is sent back to wherever they came from
 * (preserved in location state by ProtectedRoute), or to "/dashboard" by default.
 */

import { useState }                          from "react";
import { Link, useNavigate, useLocation }    from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import {
  getSecurityQuestionByEmailAndPhone,
  persistAccountsToJson,
  resetPasswordByEmailAndPhone,
  verifyResetSecurityAnswer,
} from "../lib/api";

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
  const [showReset, setShowReset] = useState(false);
  const [resetMessage, setResetMessage] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [securityQuestion, setSecurityQuestion] = useState("");
  const [verifiedName, setVerifiedName] = useState("");
  const [resetStep, setResetStep] = useState("identity");
  const [resetForm, setResetForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    securityAnswer: "",
    newPassword: "",
    confirmNewPassword: "",
  });


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

  function handleResetChange(e) {
    setResetForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleResetSubmit(e) {
    e.preventDefault();
    setError("");
    setResetMessage("");

    if (resetStep === "identity") {
      try {
        const { securityQuestion: question, name } = getSecurityQuestionByEmailAndPhone({
          fullName: resetForm.fullName,
          email: resetForm.email,
          phone: resetForm.phone,
        });
        setSecurityQuestion(question);
        setVerifiedName(name);
        setResetStep("security");
      } catch (err) {
        setError(err.message);
      }
      return;
    }

    if (resetStep === "security") {
      try {
        verifyResetSecurityAnswer({
          fullName: resetForm.fullName,
          email: resetForm.email,
          phone: resetForm.phone,
          securityAnswer: resetForm.securityAnswer,
        });
        setResetStep("password");
      } catch (err) {
        setError(err.message);
      }
      return;
    }

    if (resetForm.newPassword !== resetForm.confirmNewPassword) {
      setError("Reset passwords do not match.");
      return;
    }

    setResetLoading(true);

    try {
      resetPasswordByEmailAndPhone({
        fullName: resetForm.fullName,
        email: resetForm.email,
        phone: resetForm.phone,
        securityAnswer: resetForm.securityAnswer,
        newPassword: resetForm.newPassword,
      });
      await persistAccountsToJson();
      setResetMessage("Password reset successfully. You can now sign in.");
      setSecurityQuestion("");
      setVerifiedName("");
      setResetStep("identity");
      setResetForm({
        fullName: "",
        email: "",
        phone: "",
        securityAnswer: "",
        newPassword: "",
        confirmNewPassword: "",
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setResetLoading(false);
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

        <button
          type="button"
          className="login-reset-toggle"
          onClick={() => {
            setError("");
            setResetMessage("");
            setSecurityQuestion("");
            setVerifiedName("");
            setResetStep("identity");
            setShowReset((prev) => !prev);
          }}
        >
          {showReset ? "Hide reset password" : "Forgot password? Reset it"}
        </button>

        {showReset && (
          <form onSubmit={handleResetSubmit} className="login-reset-form">
            {resetStep === "identity" && (
              <>
                <label className="login-label">
                  Full Name
                  <input
                    className="login-input"
                    type="text"
                    name="fullName"
                    value={resetForm.fullName}
                    onChange={handleResetChange}
                    required
                  />
                </label>

                <label className="login-label">
                  Email
                  <input
                    className="login-input"
                    type="email"
                    name="email"
                    value={resetForm.email}
                    onChange={handleResetChange}
                    required
                  />
                </label>

                <label className="login-label">
                  Phone Number
                  <input
                    className="login-input"
                    type="tel"
                    name="phone"
                    value={resetForm.phone}
                    onChange={(e) => handleResetChange({
                      target: { name: "phone", value: e.target.value.replace(/\D/g, "") },
                    })}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    required
                  />
                </label>

                <button className="login-button" type="submit" disabled={resetLoading}>
                  Verify Account
                </button>
              </>
            )}

            {(resetStep === "security" || resetStep === "password") && (
              <>
                <label className="login-label">
                  Name
                  <input className="login-input" type="text" value={verifiedName} readOnly />
                </label>

                <label className="login-label">
                  Security Question
                  <input
                    className="login-input"
                    type="text"
                    value={securityQuestion}
                    readOnly
                  />
                </label>

                <label className="login-label">
                  Security Answer
                  <input
                    className="login-input"
                    type="text"
                    name="securityAnswer"
                    value={resetForm.securityAnswer}
                    onChange={handleResetChange}
                    required
                    readOnly={resetStep === "password"}
                  />
                </label>
              </>
            )}

            {resetStep === "security" && (
              <button className="login-button" type="submit" disabled={resetLoading}>
                Verify Security Answer
              </button>
            )}

            {resetStep === "password" && (
              <>
                <label className="login-label">
                  New Password
                  <input
                    className="login-input"
                    type="password"
                    name="newPassword"
                    value={resetForm.newPassword}
                    onChange={handleResetChange}
                    minLength={6}
                    required
                  />
                </label>

                <label className="login-label">
                  Confirm New Password
                  <input
                    className="login-input"
                    type="password"
                    name="confirmNewPassword"
                    value={resetForm.confirmNewPassword}
                    onChange={handleResetChange}
                    minLength={6}
                    required
                  />
                </label>

                <button className="login-button" type="submit" disabled={resetLoading}>
                  {resetLoading ? "Resetting…" : "Reset Password"}
                </button>
              </>
            )}
          </form>
        )}

        {resetMessage && <p className="login-success">{resetMessage}</p>}

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
