import { useEffect, useState } from "react";

import { useAuth } from "../context/AuthContext";
import { getAccount, updateAccount } from "../lib/api";

import "../stylesheets/Profile.css";

export default function Profile() {
  const { user, refresh } = useAuth();

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    preferredLocation: "",
    budget: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!user?.id) return;

    const account = getAccount(user.id);
    setForm({
      name: account.name ?? "",
      email: account.email ?? "",
      phone: account.phone ?? "",
      preferredLocation: account.preferredLocation ?? "",
      budget: account.budget === undefined || account.budget === null ? "" : String(account.budget),
    });
  }, [user?.id]);

  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    try {
      const nextBudget = form.budget.trim() === "" ? null : Number(form.budget);

      if (nextBudget !== null && (Number.isNaN(nextBudget) || nextBudget < 0)) {
        throw new Error("Budget must be a positive number or blank.");
      }

      const updated = updateAccount(user.id, {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        preferredLocation: form.preferredLocation.trim(),
        budget: nextBudget,
      });

      refresh();
      setForm({
        name: updated.name ?? "",
        email: updated.email ?? "",
        phone: updated.phone ?? "",
        preferredLocation: updated.preferredLocation ?? "",
        budget: updated.budget === undefined || updated.budget === null ? "" : String(updated.budget),
      });
      setSuccess("Profile details updated.");
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
          Preferred Location
          <input
            type="text"
            value={form.preferredLocation}
            onChange={(e) => handleChange("preferredLocation", e.target.value)}
            placeholder="Optional"
          />
        </label>

        <label className="profile-field">
          Budget (GBP)
          <input
            type="number"
            min="0"
            step="1"
            value={form.budget}
            onChange={(e) => handleChange("budget", e.target.value)}
            placeholder="Optional"
          />
        </label>

        <button className="profile-save" type="submit">Save Changes</button>
      </form>
    </main>
  );
}
