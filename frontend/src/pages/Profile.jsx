import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import {
  deleteAccount,
  getAccount,
  getAccountWithPassword,
  persistAccountsToJson,
  updateAccount,
} from "../lib/api";

import "../stylesheets/Profile.css";

const SECURITY_QUESTIONS = [
  "What is your mother's maiden name?",
  "What was the name of your first pet?",
  "What was the name of your first school?",
  "What city were you born in?",
  "What is your favorite childhood nickname?",
];

export default function Profile() {
  const { user, logout, refresh } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    securityQuestion: "",
    securityAnswer: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!user?.id) return;

    const account = getAccountWithPassword(user.id);
    setForm({
      name: account.name ?? "",
      email: account.email ?? "",
      phone: account.phone ?? "",
      password: account.password ?? "",
      securityQuestion: account.securityQuestion ?? "",
      securityAnswer: account.securityAnswer ?? "",
    });
  }, [user?.id]);

  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    try {
      const trimmedQuestion = form.securityQuestion.trim();
      const trimmedAnswer = form.securityAnswer.trim();
      if ((trimmedQuestion && !trimmedAnswer) || (!trimmedQuestion && trimmedAnswer)) {
        throw new Error("Please choose a security question and provide an answer.");
      }

      const updated = updateAccount(user.id, {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        ...(form.password.trim() ? { password: form.password } : {}),
        securityQuestion: trimmedQuestion,
        securityAnswer: trimmedAnswer,
      });

      await persistAccountsToJson();

      refresh();
      const freshAccount = getAccountWithPassword(user.id);
      setForm({
        name: updated.name ?? freshAccount.name ?? "",
        email: updated.email ?? freshAccount.email ?? "",
        phone: updated.phone ?? freshAccount.phone ?? "",
        password: freshAccount.password ?? "",
        securityQuestion: freshAccount.securityQuestion ?? "",
        securityAnswer: freshAccount.securityAnswer ?? "",
      });
      setSuccess("Profile details updated.");
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDeleteAccount() {
    setError("");
    setSuccess("");

    const confirmed = window.confirm(
      "Warning: this will permanently delete your account. This action cannot be undone."
    );

    if (!confirmed) return;

    try {
      deleteAccount(user.id);
      await persistAccountsToJson();
      logout();
      navigate("/register", { replace: true });
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <main className="profile-page">
      <h1>My Profile</h1>
      <p className="profile-subtitle">Update your personal and profile details.</p>

      {error && <p className="profile-alert profile-alert--error">{error}</p>}
      {success && <p className="profile-alert profile-alert--success">{success}</p>}

      <form className="profile-form" onSubmit={handleSubmit}>
        <label className="profile-field">
          Full Name
          <input
            type="text"
            value={form.name}
            onChange={(e) => handleChange("name", e.target.value)}
            required
          />
        </label>

        <label className="profile-field">
          Email
          <input
            type="email"
            value={form.email}
            onChange={(e) => handleChange("email", e.target.value)}
            required
          />
        </label>

        <label className="profile-field">
          Contact Number
          <input
            type="text"
            value={form.phone}
            onChange={(e) => handleChange("phone", e.target.value)}
            placeholder="Optional"
          />
        </label>

        <label className="profile-field">
          Password
          <input
            type="text"
            value={form.password}
            onChange={(e) => handleChange("password", e.target.value)}
            minLength={6}
            placeholder="Leave blank to keep current password"
          />
        </label>

        <label className="profile-field">
          Security Question
          <select
            value={form.securityQuestion}
            onChange={(e) => handleChange("securityQuestion", e.target.value)}
          >
            <option value="">Select a security question</option>
            {SECURITY_QUESTIONS.map((question) => (
              <option key={question} value={question}>
                {question}
              </option>
            ))}
          </select>
        </label>

        <label className="profile-field">
          Security Answer
          <input
            type="text"
            value={form.securityAnswer}
            onChange={(e) => handleChange("securityAnswer", e.target.value)}
            placeholder="Enter your answer"
          />
        </label>

        <button className="profile-save" type="submit">Save Changes</button>
      </form>

      <section className="profile-danger-zone">
        <h2 className="profile-danger-title">Warning</h2>
        <p className="profile-danger-copy">
          Deleting your account is permanent and cannot be undone.
        </p>
        <button className="profile-delete" type="button" onClick={handleDeleteAccount}>
          Delete Account
        </button>
      </section>
    </main>
  );
}
