import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { ROLES } from "../lib/auth";
import {
  deleteAccount,
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

function getStoredSectionState(userId) {
  try {
    const key = `profile_sections_${userId ?? "anon"}`;
    const raw = sessionStorage.getItem(key);
    if (!raw) return { account: false, profile: false };
    const parsed = JSON.parse(raw);
    return {
      account: Boolean(parsed?.account),
      profile: Boolean(parsed?.profile),
    };
  } catch {
    return { account: false, profile: false };
  }
}

export default function Profile() {
  const { user, logout, refresh } = useAuth();
  const navigate = useNavigate();
  const canDeleteAccount = user?.role !== ROLES.ADMIN;
  const canManageProfile = user?.role === ROLES.RENTEE || user?.role === ROLES.HOST;

  const [accountForm, setAccountForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    securityQuestion: "",
    securityAnswer: "",
  });
  const [profileForm, setProfileForm] = useState({
    preferredCity: "",
    preferredType: "",
    budgetMin: "",
    budgetMax: "",
    preferredMoveInDate: "",
    preferredStayLengthMonths: "",
    relevantDetailsForHost: "",
    defaultListingCity: "",
    defaultListingCountry: "",
    defaultListingPriceUnit: "month",
  });
  const [error, setError] = useState("");
  const [accountSuccess, setAccountSuccess] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");
  const [openSections, setOpenSections] = useState(() => getStoredSectionState(user?.id));

  useEffect(() => {
    if (!user?.id) return;

    const account = getAccountWithPassword(user.id);
    setAccountForm({
      name: account.name ?? "",
      email: account.email ?? "",
      phone: account.phone ?? "",
      password: account.password ?? "",
      securityQuestion: account.securityQuestion ?? "",
      securityAnswer: account.securityAnswer ?? "",
    });
    setProfileForm({
      preferredCity: account.preferredCity ?? account.preferredLocation ?? "",
      preferredType: account.preferredType ?? "",
      budgetMin: account.budgetMin ?? "",
      budgetMax: account.budgetMax ?? "",
      preferredMoveInDate: account.preferredMoveInDate ?? "",
      preferredStayLengthMonths: account.preferredStayLengthMonths ?? "",
      relevantDetailsForHost: account.relevantDetailsForHost ?? account.hostRelevantDetails ?? "",
      defaultListingCity: account.defaultListingCity ?? "",
      defaultListingCountry: account.defaultListingCountry ?? "",
      defaultListingPriceUnit: account.defaultListingPriceUnit ?? "month",
    });
    setOpenSections(getStoredSectionState(user.id));
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    const key = `profile_sections_${user.id}`;
    sessionStorage.setItem(key, JSON.stringify(openSections));
  }, [openSections, user?.id]);

  function handleAccountChange(field, value) {
    setAccountForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleProfileChange(field, value) {
    setProfileForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleAccountSubmit(event) {
    event.preventDefault();
    setError("");
    setAccountSuccess("");
    setProfileSuccess("");

    try {
      const trimmedQuestion = accountForm.securityQuestion.trim();
      const trimmedAnswer = accountForm.securityAnswer.trim();
      if ((trimmedQuestion && !trimmedAnswer) || (!trimmedQuestion && trimmedAnswer)) {
        throw new Error("Please choose a security question and provide an answer.");
      }

      const updated = updateAccount(user.id, {
        name: accountForm.name.trim(),
        email: accountForm.email.trim(),
        phone: accountForm.phone.trim(),
        ...(accountForm.password.trim() ? { password: accountForm.password } : {}),
        securityQuestion: trimmedQuestion,
        securityAnswer: trimmedAnswer,
      });

      await persistAccountsToJson();

      refresh();
      const freshAccount = getAccountWithPassword(user.id);
      setAccountForm({
        name: updated.name ?? freshAccount.name ?? "",
        email: updated.email ?? freshAccount.email ?? "",
        phone: updated.phone ?? freshAccount.phone ?? "",
        password: freshAccount.password ?? "",
        securityQuestion: freshAccount.securityQuestion ?? "",
        securityAnswer: freshAccount.securityAnswer ?? "",
      });
      setOpenSections((prev) => ({ ...prev, account: false }));
      setAccountSuccess("Account details updated.");
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleProfileSubmit(event) {
    event.preventDefault();
    setError("");
    setAccountSuccess("");
    setProfileSuccess("");

    try {
      const parsedMinimumPrice = profileForm.budgetMin === "" ? "" : Number(profileForm.budgetMin);
      const parsedMaximumPrice = profileForm.budgetMax === "" ? "" : Number(profileForm.budgetMax);
      const parsedStayMonths = profileForm.preferredStayLengthMonths === ""
        ? ""
        : Number(profileForm.preferredStayLengthMonths);

      if (parsedMinimumPrice !== "" && Number.isNaN(parsedMinimumPrice)) {
        throw new Error("Minimum price must be a number.");
      }
      if (parsedMaximumPrice !== "" && Number.isNaN(parsedMaximumPrice)) {
        throw new Error("Maximum price must be a number.");
      }
      if (parsedMinimumPrice !== "" && parsedMaximumPrice !== "" && parsedMinimumPrice > parsedMaximumPrice) {
        throw new Error("Minimum price cannot be higher than maximum price.");
      }
      if (parsedStayMonths !== "" && (Number.isNaN(parsedStayMonths) || parsedStayMonths < 1)) {
        throw new Error("Preferred stay length must be at least 1 month.");
      }

      updateAccount(user.id, {
        preferredCity: profileForm.preferredCity.trim(),
        preferredType: profileForm.preferredType,
        budgetMin: parsedMinimumPrice,
        budgetMax: parsedMaximumPrice,
        preferredMoveInDate: profileForm.preferredMoveInDate || "",
        preferredStayLengthMonths: parsedStayMonths,
        relevantDetailsForHost: profileForm.relevantDetailsForHost.trim(),
        defaultListingCity: profileForm.defaultListingCity.trim(),
        defaultListingCountry: profileForm.defaultListingCountry.trim(),
        defaultListingPriceUnit: profileForm.defaultListingPriceUnit,
      });

      await persistAccountsToJson();
      refresh();
      setOpenSections((prev) => ({ ...prev, profile: false }));
      setProfileSuccess("Profile preferences updated.");
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDeleteAccount() {
    setError("");
    setAccountSuccess("");
    setProfileSuccess("");

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

  function toggleSection(section) {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  }

  return (
    <main className="profile-page">
      <section className="profile-card">
        <h1 className="profile-title">My Profile</h1>
        <p className="profile-subtitle">Update your account details and profile preferences.</p>

        {error && <p className="profile-alert profile-alert--error">{error}</p>}
        {accountSuccess && <p className="profile-alert profile-alert--success">{accountSuccess}</p>}
        {profileSuccess && <p className="profile-alert profile-alert--success">{profileSuccess}</p>}

        <section className="profile-section-card">
          <button
            type="button"
            className="profile-section-toggle"
            onClick={() => toggleSection("account")}
            aria-expanded={openSections.account}
          >
            <span className="profile-section-heading-wrap">
              <span className="profile-section-title">Manage Account</span>
              <span className="profile-section-subtitle">
                Update account and security details.
              </span>
            </span>
            <span className="profile-section-icon">{openSections.account ? "−" : "+"}</span>
          </button>

          {openSections.account && (
            <>
              <form className="profile-form" onSubmit={handleAccountSubmit}>
          <label className="profile-field">
            Full Name
            <input
              type="text"
              value={accountForm.name}
              onChange={(e) => handleAccountChange("name", e.target.value)}
              required
            />
          </label>

          <label className="profile-field">
            Email
            <input
              type="email"
              value={accountForm.email}
              onChange={(e) => handleAccountChange("email", e.target.value)}
              placeholder="Please enter your email"
              required
            />
          </label>

          <label className="profile-field">
            Contact Number
            <input
              type="tel"
              value={accountForm.phone}
              onChange={(e) => handleAccountChange("phone", e.target.value.replace(/\D/g, ""))}
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="Please enter your new phone number"
              required
            />
          </label>

          <label className="profile-field">
            Password
            <input
              type="text"
              value={accountForm.password}
              onChange={(e) => handleAccountChange("password", e.target.value)}
              minLength={6}
              placeholder="Please enter a password"
              required
            />
          </label>

          <label className="profile-field">
            Security Question
            <select
              value={accountForm.securityQuestion}
              onChange={(e) => handleAccountChange("securityQuestion", e.target.value)}
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
              value={accountForm.securityAnswer}
              onChange={(e) => handleAccountChange("securityAnswer", e.target.value)}
              placeholder="Please enter your security answer"
            />
          </label>

                <button className="profile-save" type="submit">Save Account Changes</button>
              </form>

              {canDeleteAccount && (
                <section className="profile-danger-zone">
                  <h2 className="profile-danger-title">Warning</h2>
                  <p className="profile-danger-copy">
                    Deleting your account is permanent and cannot be undone.
                  </p>
                  <button className="profile-delete" type="button" onClick={handleDeleteAccount}>
                    Delete Account
                  </button>
                </section>
              )}
            </>
          )}
        </section>

        {canManageProfile && (
          <section className="profile-section-card">
            <button
              type="button"
              className="profile-section-toggle"
              onClick={() => toggleSection("profile")}
              aria-expanded={openSections.profile}
            >
              <span className="profile-section-heading-wrap">
                <span className="profile-section-title">Manage Profile</span>
                <span className="profile-section-subtitle">
                  These optional preferences are used to prefill your forms.
                </span>
              </span>
              <span className="profile-section-icon">{openSections.profile ? "−" : "+"}</span>
            </button>

            {openSections.profile && (
              <form className="profile-form" onSubmit={handleProfileSubmit}>
              {user?.role === ROLES.RENTEE && (
                <>
                  <label className="profile-field">
                    City
                    <input
                      type="text"
                      value={profileForm.preferredCity}
                      onChange={(e) => handleProfileChange("preferredCity", e.target.value)}
                      placeholder="e.g. Manchester"
                    />
                  </label>

                  <label className="profile-field">
                    Type
                    <select
                      value={profileForm.preferredType}
                      onChange={(e) => handleProfileChange("preferredType", e.target.value)}
                    >
                      <option value="">Any type</option>
                      <option value="studio">Studio</option>
                      <option value="apartment">Apartment</option>
                      <option value="house">House</option>
                    </select>
                  </label>

                  <label className="profile-field">
                    Minimum Price (monthly GBP)
                    <input
                      type="number"
                      min="0"
                      value={profileForm.budgetMin}
                      onChange={(e) => handleProfileChange("budgetMin", e.target.value)}
                      placeholder="Optional"
                    />
                  </label>

                  <label className="profile-field">
                    Maximum Price (monthly GBP)
                    <input
                      type="number"
                      min="0"
                      value={profileForm.budgetMax}
                      onChange={(e) => handleProfileChange("budgetMax", e.target.value)}
                      placeholder="Optional"
                    />
                  </label>

                  <label className="profile-field">
                    Preferred Move-in Date
                    <input
                      type="date"
                      value={profileForm.preferredMoveInDate}
                      onChange={(e) => handleProfileChange("preferredMoveInDate", e.target.value)}
                    />
                  </label>

                  <label className="profile-field">
                    Preferred Stay Length (months)
                    <input
                      type="number"
                      min="1"
                      value={profileForm.preferredStayLengthMonths}
                      onChange={(e) => handleProfileChange("preferredStayLengthMonths", e.target.value)}
                      placeholder="Optional"
                    />
                  </label>

                  <label className="profile-field">
                    Relevant Details for Host
                    <textarea
                      value={profileForm.relevantDetailsForHost}
                      onChange={(e) => handleProfileChange("relevantDetailsForHost", e.target.value)}
                      placeholder="Optional notes for applications, e.g. wheelchair access needed or parking required."
                      rows={3}
                    />
                  </label>

                </>
              )}

              {user?.role === ROLES.HOST && (
                <>
                  <label className="profile-field">
                    Default Listing City
                    <input
                      type="text"
                      value={profileForm.defaultListingCity}
                      onChange={(e) => handleProfileChange("defaultListingCity", e.target.value)}
                      placeholder="Optional"
                    />
                  </label>

                  <label className="profile-field">
                    Default Listing Country
                    <input
                      type="text"
                      value={profileForm.defaultListingCountry}
                      onChange={(e) => handleProfileChange("defaultListingCountry", e.target.value)}
                      placeholder="Optional"
                    />
                  </label>

                  <label className="profile-field">
                    Default Listing Price Unit
                    <select
                      value={profileForm.defaultListingPriceUnit}
                      onChange={(e) => handleProfileChange("defaultListingPriceUnit", e.target.value)}
                    >
                      <option value="month">Month</option>
                      <option value="week">Week</option>
                      <option value="night">Night</option>
                    </select>
                  </label>

                </>
              )}

                <button className="profile-save" type="submit">Save Profile Preferences</button>
              </form>
            )}
          </section>
        )}
      </section>
    </main>
  );
}
