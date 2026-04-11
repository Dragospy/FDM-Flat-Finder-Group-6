import { useEffect, useState } from "react";

import { useAuth } from "../context/AuthContext";
import { getAccount, persistAccountsToJson, updateAccount } from "../lib/api";

import "../stylesheets/Profile.css";

export default function Profile() {
  const { user, refresh } = useAuth();

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
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
      const updated = updateAccount(user.id, {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
      });

      await persistAccountsToJson();

      refresh();
      setForm({
        name: updated.name ?? "",
        email: updated.email ?? "",
        phone: updated.phone ?? "",
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

        <button className="profile-save" type="submit">Save Changes</button>
      </form>
    </main>
  );
}
