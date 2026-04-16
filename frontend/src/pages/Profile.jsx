import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { ROLES } from "../lib/auth";
import {
  deleteAccount,
  getAccountDeletionBlockers,
  getAccountWithPassword,
  persistAccountsToJson,
  updateAccount,
} from "../lib/api";
import {
  SECURITY_QUESTIONS,
  acceptedStepLabel,
  accountDisplayName,
  buildRequestInfoSnapshot,
  formatDateOnly,
  formatDateTime,
  getStoredSectionState,
  humanApplicationStatus,
  listingTitleForId,
  safeListing,
} from "../lib/profile";

import "../stylesheets/Profile.css";

function RequestDetailDl({ children }) {
  return <dl className="profile-request-dl">{children}</dl>;
}

function RequestDetailField({ label, children }) {
  if (children === null || children === undefined || children === "") return null;
  return (
    <>
      <dt>{label}</dt>
      <dd>{children}</dd>
    </>
  );
}

function ApplicationStatusBadge({ status }) {
  if (!status) return null;
  const safe = String(status).toLowerCase().replace(/\s+/g, "-");
  return (
    <span className={`profile-request-status profile-request-status--${safe}`}>
      {humanApplicationStatus(status)}
    </span>
  );
}

function ProfileRequestInfoDetails({ snapshot, detailKey, user }) {
  if (!snapshot || !detailKey) return null;

  const snap = snapshot;
  const key = detailKey;

  if (key === "ownedListings") {
    if (!snap.ownedListings.length) {
      return <p className="profile-request-detail-empty">No listings found.</p>;
    }
    return (
      <ul className="profile-request-detail-list">
        {snap.ownedListings.map((listing) => {
          const loc = listing.location ?? {};
          const reportCount = Array.isArray(listing.reports) ? listing.reports.length : 0;
          return (
            <li key={listing.id} className="profile-request-detail-item">
              <article className="profile-request-record">
                <div className="profile-request-record-head">
                  <h4 className="profile-request-record-title">{listing.title}</h4>
                  {listing.status && (
                    <span className="profile-request-pill">{String(listing.status)}</span>
                  )}
                </div>
                <RequestDetailDl>
                  <RequestDetailField label="Listing ID">{listing.id}</RequestDetailField>
                  <RequestDetailField label="Type">{listing.type}</RequestDetailField>
                  <RequestDetailField label="Price">
                    £{listing.price ?? "—"} / {listing.priceUnit ?? "month"}
                  </RequestDetailField>
                  <RequestDetailField label="Availability">
                    {listing.available ? "Available" : "Unavailable"}
                  </RequestDetailField>
                  <RequestDetailField label="Bedrooms">{listing.bedrooms}</RequestDetailField>
                  <RequestDetailField label="Bathrooms">{listing.bathrooms}</RequestDetailField>
                  <RequestDetailField label="Max guests">{listing.maxGuests}</RequestDetailField>
                  <RequestDetailField label="Address">{loc.address}</RequestDetailField>
                  <RequestDetailField label="City">{loc.city}</RequestDetailField>
                  <RequestDetailField label="Postcode">{loc.postcode}</RequestDetailField>
                  <RequestDetailField label="Country">{loc.country}</RequestDetailField>
                  <RequestDetailField label="Coordinates">
                    {loc.latitude != null && loc.longitude != null
                      ? `${loc.latitude}, ${loc.longitude}`
                      : null}
                  </RequestDetailField>
                  <RequestDetailField label="Listed on">{formatDateTime(listing.createdAt)}</RequestDetailField>
                  <RequestDetailField label="Rating">
                    {listing.rating != null
                      ? `${listing.rating}${listing.reviewCount != null ? ` (${listing.reviewCount} reviews)` : ""}`
                      : null}
                  </RequestDetailField>
                  <RequestDetailField label="Amenities">
                    {Array.isArray(listing.amenities) && listing.amenities.length
                      ? listing.amenities.join(", ")
                      : null}
                  </RequestDetailField>
                  <RequestDetailField label="Images">{listing.images?.length ?? 0} file(s)</RequestDetailField>
                  <RequestDetailField label="Open reports on listing">{reportCount}</RequestDetailField>
                  <RequestDetailField label="Description">{listing.description}</RequestDetailField>
                </RequestDetailDl>
              </article>
            </li>
          );
        })}
      </ul>
    );
  }

  if (key === "applicationsAsHost" || key === "applicationsAsRentee") {
    const apps = key === "applicationsAsHost" ? snap.applicationsAsHost : snap.applicationsAsRentee;
    if (!apps.length) {
      return <p className="profile-request-detail-empty">No applications found.</p>;
    }
    return (
      <ul className="profile-request-detail-list">
        {apps.map((app) => {
          const d = app.details ?? {};
          const listing = safeListing(app.listingId);
          return (
            <li key={app.id} className="profile-request-detail-item">
              <article className="profile-request-record">
                <div className="profile-request-record-head">
                  <h4 className="profile-request-record-title">
                    {listingTitleForId(app.listingId)}
                  </h4>
                  <ApplicationStatusBadge status={app.status} />
                </div>
                <RequestDetailDl>
                  <RequestDetailField label="Application ID">{app.id}</RequestDetailField>
                  <RequestDetailField label="Listing ID">{app.listingId}</RequestDetailField>
                  {listing && (
                    <RequestDetailField label="Listing price">
                      £{listing.price} / {listing.priceUnit ?? "month"} · {listing.location?.city ?? "—"}
                    </RequestDetailField>
                  )}
                  {key === "applicationsAsHost" && (
                    <RequestDetailField label="Applicant (consultant)">
                      {accountDisplayName(app.consultantId)}
                    </RequestDetailField>
                  )}
                  {key === "applicationsAsRentee" && (
                    <RequestDetailField label="Host">{accountDisplayName(app.hostId)}</RequestDetailField>
                  )}
                  <RequestDetailField label="Submitted">{formatDateTime(app.createdAt)}</RequestDetailField>
                  <RequestDetailField label="Last updated">{formatDateTime(app.updatedAt)}</RequestDetailField>
                  <RequestDetailField label="Length of stay">{d.lengthOfStayMonths} month(s)</RequestDetailField>
                  <RequestDetailField label="Move-in date">{formatDateOnly(d.moveInDate)}</RequestDetailField>
                  <RequestDetailField label="Occupants">{d.occupants}</RequestDetailField>
                  <RequestDetailField label="Employment">{d.employmentStatus}</RequestDetailField>
                  <RequestDetailField label="Monthly income (GBP)">{d.monthlyIncome}</RequestDetailField>
                  <RequestDetailField label="Applicant notes">{d.notes}</RequestDetailField>
                  {app.autoWithdrawnReason && (
                    <RequestDetailField label="System note">{app.autoWithdrawnReason}</RequestDetailField>
                  )}
                  {app.status === "accepted" && app.postAcceptanceProgress && (
                    <>
                      <RequestDetailField label="Onboarding step">
                        {acceptedStepLabel(app.postAcceptanceProgress.step)}
                      </RequestDetailField>
                      <RequestDetailField label="Step last changed">
                        {formatDateTime(app.postAcceptanceProgress.updatedAt)}
                      </RequestDetailField>
                    </>
                  )}
                </RequestDetailDl>
              </article>
            </li>
          );
        })}
      </ul>
    );
  }

  if (key === "bookingsAsRentee") {
    if (!snap.bookingsAsRentee.length) {
      return <p className="profile-request-detail-empty">No bookings found.</p>;
    }
    return (
      <ul className="profile-request-detail-list">
        {snap.bookingsAsRentee.map((app) => {
          const d = app.details ?? {};
          const listing = safeListing(app.listingId);
          return (
            <li key={app.id} className="profile-request-detail-item">
              <article className="profile-request-record">
                <div className="profile-request-record-head">
                  <h4 className="profile-request-record-title">
                    {listingTitleForId(app.listingId)}
                  </h4>
                  <span className="profile-request-pill profile-request-pill--accent">Booked</span>
                </div>
                <RequestDetailDl>
                  <RequestDetailField label="Application ID">{app.id}</RequestDetailField>
                  <RequestDetailField label="Listing ID">{app.listingId}</RequestDetailField>
                  {listing && (
                    <RequestDetailField label="Listing address">
                      {[listing.location?.address, listing.location?.postcode, listing.location?.city]
                        .filter(Boolean)
                        .join(", ") || null}
                    </RequestDetailField>
                  )}
                  <RequestDetailField label="Host">{accountDisplayName(app.hostId)}</RequestDetailField>
                  <RequestDetailField label="Application status">{humanApplicationStatus(app.status)}</RequestDetailField>
                  <RequestDetailField label="Workflow step">
                    {acceptedStepLabel(app.postAcceptanceProgress?.step)}
                  </RequestDetailField>
                  <RequestDetailField label="Step last changed">
                    {formatDateTime(app.postAcceptanceProgress?.updatedAt)}
                  </RequestDetailField>
                  <RequestDetailField label="Submitted">{formatDateTime(app.createdAt)}</RequestDetailField>
                  <RequestDetailField label="Last updated">{formatDateTime(app.updatedAt)}</RequestDetailField>
                  <RequestDetailField label="Length of stay">{d.lengthOfStayMonths} month(s)</RequestDetailField>
                  <RequestDetailField label="Move-in date">{formatDateOnly(d.moveInDate)}</RequestDetailField>
                  <RequestDetailField label="Occupants">{d.occupants}</RequestDetailField>
                  <RequestDetailField label="Employment">{d.employmentStatus}</RequestDetailField>
                  <RequestDetailField label="Monthly income (GBP)">{d.monthlyIncome}</RequestDetailField>
                  <RequestDetailField label="Your notes to host">{d.notes}</RequestDetailField>
                </RequestDetailDl>
              </article>
            </li>
          );
        })}
      </ul>
    );
  }

  if (key === "enquiryThreads") {
    if (!snap.enquiryThreads.length) {
      return <p className="profile-request-detail-empty">No enquiry threads found.</p>;
    }
    return (
      <ul className="profile-request-detail-list">
        {snap.enquiryThreads.map((thread) => {
          const listing = safeListing(thread.listingId);
          const isHost = user?.id === thread.hostId;
          const otherId = isHost ? thread.renteeId : thread.hostId;
          const otherRole = isHost ? "Rentee" : "Host";
          const messages = thread.messages ?? [];
          const lastMsg = messages[messages.length - 1];
          return (
            <li key={thread.id} className="profile-request-detail-item">
              <article className="profile-request-record">
                <div className="profile-request-record-head">
                  <h4 className="profile-request-record-title">
                    {listing?.title ?? `Listing ${thread.listingId}`}
                  </h4>
                  <span className="profile-request-pill">{isHost ? "You are host" : "You are rentee"}</span>
                </div>
                <RequestDetailDl>
                  <RequestDetailField label="Thread ID">{thread.id}</RequestDetailField>
                  <RequestDetailField label="Listing ID">{thread.listingId}</RequestDetailField>
                  <RequestDetailField label={`${otherRole} (other party)`}>{accountDisplayName(otherId)}</RequestDetailField>
                  <RequestDetailField label="Thread started">{formatDateTime(thread.createdAt)}</RequestDetailField>
                  <RequestDetailField label="Last message at">{formatDateTime(lastMsg?.createdAt)}</RequestDetailField>
                  <RequestDetailField label={snap.dateRange?.active ? "Messages (in range)" : "Total messages"}>
                    {messages.length}
                  </RequestDetailField>
                </RequestDetailDl>
                {messages.length > 0 ? (
                  <div className="profile-request-thread-block">
                    <p className="profile-request-subheading">
                      {snap.dateRange?.active ? "Conversation (messages in date range)" : "Conversation"}
                    </p>
                    <ol className="profile-request-msg-list">
                      {messages.map((m, i) => {
                        const fromYou = m.senderId === user?.id;
                        return (
                          <li key={`${m.createdAt}-${i}`} className="profile-request-msg">
                            <div className="profile-request-msg-meta">
                              <span className="profile-request-msg-from">
                                {fromYou ? "You" : accountDisplayName(m.senderId)}
                              </span>
                              <span className="profile-request-msg-time">{formatDateTime(m.createdAt)}</span>
                              {m.read !== undefined && (
                                <span className="profile-request-msg-read">
                                  {m.read ? "Read" : "Unread"}
                                </span>
                              )}
                            </div>
                            <p className="profile-request-msg-text">{m.text}</p>
                          </li>
                        );
                      })}
                    </ol>
                  </div>
                ) : (
                  snap.dateRange?.active && (
                    <p className="profile-request-detail-empty profile-request-detail-empty--tight">
                      No messages fall in the selected date range for this thread (it may appear because the
                      thread started in range).
                    </p>
                  )
                )}
              </article>
            </li>
          );
        })}
      </ul>
    );
  }

  if (key === "messagesSent") {
    if (!snap.messagesSent.length) {
      return <p className="profile-request-detail-empty">No messages found.</p>;
    }
    return (
      <ul className="profile-request-detail-list">
        {snap.messagesSent.map((message, index) => {
          const listing = safeListing(message.listingId);
          const thread = snap.enquiryThreads.find((t) => t.id === message.threadId);
          const recipientId =
            user?.id === thread?.hostId ? thread?.renteeId : thread?.hostId;
          return (
            <li
              key={`${message.threadId}-${message.createdAt}-${index}`}
              className="profile-request-detail-item"
            >
              <article className="profile-request-record">
                <p className="profile-request-detail-text profile-request-detail-text--lead">{message.text}</p>
                <RequestDetailDl>
                  <RequestDetailField label="Sent">{formatDateTime(message.createdAt)}</RequestDetailField>
                  <RequestDetailField label="Thread ID">{message.threadId}</RequestDetailField>
                  <RequestDetailField label="Listing">{listing?.title ?? message.listingId}</RequestDetailField>
                  <RequestDetailField label="Listing ID">{message.listingId}</RequestDetailField>
                  <RequestDetailField label="To (other party)">
                    {recipientId ? accountDisplayName(recipientId) : "—"}
                  </RequestDetailField>
                  <RequestDetailField label="Recipient read">
                    {message.read === undefined ? null : message.read ? "Yes" : "No"}
                  </RequestDetailField>
                </RequestDetailDl>
              </article>
            </li>
          );
        })}
      </ul>
    );
  }

  if (key === "reportsFiled") {
    if (!snap.reportsFiled.length) {
      return <p className="profile-request-detail-empty">No reports filed.</p>;
    }
    return (
      <ul className="profile-request-detail-list">
        {snap.reportsFiled.map((report, index) => {
          const listing = safeListing(report.listingId);
          return (
            <li key={`${report.listingId}-${report.createdAt}-${index}`} className="profile-request-detail-item">
              <article className="profile-request-record">
                <div className="profile-request-record-head">
                  <h4 className="profile-request-record-title">{report.listingTitle}</h4>
                  <span className="profile-request-pill">Report</span>
                </div>
                <RequestDetailDl>
                  <RequestDetailField label="Listing ID">{report.listingId}</RequestDetailField>
                  <RequestDetailField label="Filed at">{formatDateTime(report.createdAt)}</RequestDetailField>
                  {listing && (
                    <>
                      <RequestDetailField label="Listing host">{accountDisplayName(listing.hostId)}</RequestDetailField>
                      <RequestDetailField label="Listing city">{listing.location?.city}</RequestDetailField>
                      <RequestDetailField label="Listing status">{listing.status}</RequestDetailField>
                      <RequestDetailField label="Currently available">
                        {listing.available ? "Yes" : "No"}
                      </RequestDetailField>
                    </>
                  )}
                </RequestDetailDl>
                <p className="profile-request-subheading">Reason you gave</p>
                <p className="profile-request-detail-text">{report.reason}</p>
              </article>
            </li>
          );
        })}
      </ul>
    );
  }

  return null;
}

export default function Profile() {
  const { user, logout, refresh } = useAuth();
  const navigate = useNavigate();
  const canDeleteAccount = user?.role !== ROLES.ADMIN;
  const canManageProfile = user?.role === ROLES.RENTEE || user?.role === ROLES.HOST;

  const requestInfoSectionSubtitle =
    user?.role === ROLES.HOST
      ? "See listings you host, applications on those listings, enquiry threads, and reports—read-only, from data stored in this app."
      : user?.role === ROLES.RENTEE
        ? "See your applications, bookings, enquiry threads, and reports—read-only, from data stored in this app."
        : "See enquiry threads, messages you sent, and reports you filed—read-only, from data stored in this app.";

  const requestInfoEmptyBlurb =
    user?.role === ROLES.HOST
      ? "Generate a snapshot to see listings you own, applications on those listings, enquiry activity, and any reports you filed."
      : user?.role === ROLES.RENTEE
        ? "Generate a snapshot to see your applications, bookings, enquiry activity, and any reports you filed."
        : "Generate a snapshot to see enquiry activity and any reports you filed.";

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
  const [requestInfoError, setRequestInfoError] = useState("");
  const [requestInfoDateFrom, setRequestInfoDateFrom] = useState("");
  const [requestInfoDateTo, setRequestInfoDateTo] = useState("");
  const [requestInfoSnapshot, setRequestInfoSnapshot] = useState(null);
  /** @type {null | "ownedListings" | "applicationsAsHost" | "applicationsAsRentee" | "bookingsAsRentee" | "enquiryThreads" | "messagesSent" | "reportsFiled"} */
  const [requestInfoDetailKey, setRequestInfoDetailKey] = useState(null);
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
    setRequestInfoSnapshot(null);
    setRequestInfoError("");
    setRequestInfoDetailKey(null);
    setRequestInfoDateFrom("");
    setRequestInfoDateTo("");
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

    const blockers = getAccountDeletionBlockers(user.id, user.role);
    if (blockers.length) {
      setError(blockers.join(" "));
      return;
    }

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

  function handleBuildRequestInfo() {
    setRequestInfoError("");
    setRequestInfoDetailKey(null);

    try {
      setRequestInfoSnapshot(
        buildRequestInfoSnapshot({
          userId: user.id,
          role: user.role,
          dateFromStr: requestInfoDateFrom,
          dateToStr: requestInfoDateTo,
        })
      );
    } catch (err) {
      setRequestInfoError(err.message || "Unable to build request information.");
    }
  }

  function toggleSection(section) {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  }

  function toggleRequestInfoDetail(key) {
    setRequestInfoDetailKey((prev) => (prev === key ? null : key));
  }

  return (
    <main className="profile-page">
      <div className="profile-shell">
        <header className="profile-header">
          <div>
            <p className="profile-eyebrow">Your account</p>
            <h1 className="profile-title">My Profile</h1>
            <p className="profile-subtitle">Update your account details and profile preferences.</p>
          </div>
        </header>

        <section className="profile-card">
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

        <section className="profile-section-card">
          <button
            type="button"
            className="profile-section-toggle"
            onClick={() => toggleSection("requestInfo")}
            aria-expanded={openSections.requestInfo}
          >
            <span className="profile-section-heading-wrap">
              <span className="profile-section-title">Request Information</span>
              <span className="profile-section-subtitle">{requestInfoSectionSubtitle}</span>
            </span>
            <span className="profile-section-icon">{openSections.requestInfo ? "−" : "+"}</span>
          </button>

          {openSections.requestInfo && (
            <section className="profile-request">
              <div className="profile-request-filters">
                <p className="profile-request-copy profile-request-copy--tight">
                  Optional local date and time filter. Leave From and To empty for all activity; one range applies to
                  every metric. The end time includes the full minute you select.
                </p>
                <div className="profile-request-date-row">
                  <label className="profile-request-date-field">
                    From
                    <input
                      type="datetime-local"
                      value={requestInfoDateFrom}
                      onChange={(e) => setRequestInfoDateFrom(e.target.value)}
                    />
                  </label>
                  <label className="profile-request-date-field">
                    To
                    <input
                      type="datetime-local"
                      value={requestInfoDateTo}
                      onChange={(e) => setRequestInfoDateTo(e.target.value)}
                    />
                  </label>
                  {(requestInfoDateFrom || requestInfoDateTo) && (
                    <button
                      type="button"
                      className="profile-request-date-clear"
                      onClick={() => {
                        setRequestInfoDateFrom("");
                        setRequestInfoDateTo("");
                      }}
                    >
                      Clear range
                    </button>
                  )}
                </div>
                <ul className="profile-request-date-legend">
                  {user?.role === ROLES.HOST && (
                    <li>
                      <strong>Listings you own</strong> — included if the listing was created (listed on) in range.
                    </li>
                  )}
                  {user?.role === ROLES.HOST && (
                    <li>
                      <strong>Applications for your listings</strong> — included if submitted, last updated, or
                      onboarding step changed in range.
                    </li>
                  )}
                  {user?.role === ROLES.RENTEE && (
                    <li>
                      <strong>Your applications</strong> — included if submitted, last updated, or onboarding step
                      changed in range.
                    </li>
                  )}
                  {user?.role === ROLES.RENTEE && (
                    <li>
                      <strong>Your bookings</strong> — confirmed bookings only; same time fields as applications.
                    </li>
                  )}
                  <li>
                    <strong>Enquiry threads</strong> — included if the thread started in range or any message was sent
                    in range; conversation shows only messages in range.
                  </li>
                  <li>
                    <strong>Messages sent</strong> — each message counted if sent in range.
                  </li>
                  <li>
                    <strong>Reports filed</strong> — included if filed in range.
                  </li>
                </ul>
              </div>

              <button type="button" className="profile-save" onClick={handleBuildRequestInfo}>
                Generate My Information Snapshot
              </button>

              {requestInfoError && <p className="profile-alert profile-alert--error">{requestInfoError}</p>}

              {!requestInfoSnapshot && (
                <p className="profile-request-copy">{requestInfoEmptyBlurb}</p>
              )}

              {requestInfoSnapshot && (
                <>
                  <p className="profile-request-copy">
                    Generated at {new Date(requestInfoSnapshot.generatedAt).toLocaleString()}
                    {requestInfoSnapshot.dateRange && (
                      <>
                        {" "}
                        · Date filter:{" "}
                        <strong>{requestInfoSnapshot.dateRange.label}</strong>
                      </>
                    )}
                  </p>
                  <div className="profile-request-grid">
                    {user?.role === ROLES.HOST && (
                      <>
                        <button
                          type="button"
                          className={`profile-request-card${requestInfoDetailKey === "ownedListings" ? " profile-request-card--active" : ""}`}
                          onClick={() => toggleRequestInfoDetail("ownedListings")}
                          aria-expanded={requestInfoDetailKey === "ownedListings"}
                        >
                          <h3>Listings You Own</h3>
                          <p className="profile-request-count">{requestInfoSnapshot.ownedListings.length}</p>
                          <span className="profile-request-card-hint">
                            {requestInfoDetailKey === "ownedListings" ? "Hide details" : "Show details"}
                          </span>
                        </button>
                        <button
                          type="button"
                          className={`profile-request-card${requestInfoDetailKey === "applicationsAsHost" ? " profile-request-card--active" : ""}`}
                          onClick={() => toggleRequestInfoDetail("applicationsAsHost")}
                          aria-expanded={requestInfoDetailKey === "applicationsAsHost"}
                        >
                          <h3>Applications For Your Listings</h3>
                          <p className="profile-request-count">{requestInfoSnapshot.applicationsAsHost.length}</p>
                          <span className="profile-request-card-hint">
                            {requestInfoDetailKey === "applicationsAsHost" ? "Hide details" : "Show details"}
                          </span>
                        </button>
                      </>
                    )}

                    {user?.role === ROLES.RENTEE && (
                      <>
                        <button
                          type="button"
                          className={`profile-request-card${requestInfoDetailKey === "applicationsAsRentee" ? " profile-request-card--active" : ""}`}
                          onClick={() => toggleRequestInfoDetail("applicationsAsRentee")}
                          aria-expanded={requestInfoDetailKey === "applicationsAsRentee"}
                        >
                          <h3>Your Applications</h3>
                          <p className="profile-request-count">{requestInfoSnapshot.applicationsAsRentee.length}</p>
                          <span className="profile-request-card-hint">
                            {requestInfoDetailKey === "applicationsAsRentee" ? "Hide details" : "Show details"}
                          </span>
                        </button>
                        <button
                          type="button"
                          className={`profile-request-card${requestInfoDetailKey === "bookingsAsRentee" ? " profile-request-card--active" : ""}`}
                          onClick={() => toggleRequestInfoDetail("bookingsAsRentee")}
                          aria-expanded={requestInfoDetailKey === "bookingsAsRentee"}
                        >
                          <h3>Your Bookings</h3>
                          <p className="profile-request-count">{requestInfoSnapshot.bookingsAsRentee.length}</p>
                          <span className="profile-request-card-hint">
                            {requestInfoDetailKey === "bookingsAsRentee" ? "Hide details" : "Show details"}
                          </span>
                        </button>
                      </>
                    )}

                    <button
                      type="button"
                      className={`profile-request-card${requestInfoDetailKey === "enquiryThreads" ? " profile-request-card--active" : ""}`}
                      onClick={() => toggleRequestInfoDetail("enquiryThreads")}
                      aria-expanded={requestInfoDetailKey === "enquiryThreads"}
                    >
                      <h3>Enquiry Threads</h3>
                      <p className="profile-request-count">{requestInfoSnapshot.enquiryThreads.length}</p>
                      <span className="profile-request-card-hint">
                        {requestInfoDetailKey === "enquiryThreads" ? "Hide details" : "Show details"}
                      </span>
                    </button>
                    <button
                      type="button"
                      className={`profile-request-card${requestInfoDetailKey === "messagesSent" ? " profile-request-card--active" : ""}`}
                      onClick={() => toggleRequestInfoDetail("messagesSent")}
                      aria-expanded={requestInfoDetailKey === "messagesSent"}
                    >
                      <h3>Messages Sent</h3>
                      <p className="profile-request-count">{requestInfoSnapshot.messagesSent.length}</p>
                      <span className="profile-request-card-hint">
                        {requestInfoDetailKey === "messagesSent" ? "Hide details" : "Show details"}
                      </span>
                    </button>
                    <button
                      type="button"
                      className={`profile-request-card${requestInfoDetailKey === "reportsFiled" ? " profile-request-card--active" : ""}`}
                      onClick={() => toggleRequestInfoDetail("reportsFiled")}
                      aria-expanded={requestInfoDetailKey === "reportsFiled"}
                    >
                      <h3>Reports Filed</h3>
                      <p className="profile-request-count">{requestInfoSnapshot.reportsFiled.length}</p>
                      <span className="profile-request-card-hint">
                        {requestInfoDetailKey === "reportsFiled" ? "Hide details" : "Show details"}
                      </span>
                    </button>
                  </div>

                  {requestInfoDetailKey && (
                    <div className="profile-request-detail" role="region" aria-label="Snapshot details">
                      <div className="profile-request-detail-head">
                        <h3 className="profile-request-detail-title">
                          {requestInfoDetailKey === "ownedListings" && "Listings you own"}
                          {requestInfoDetailKey === "applicationsAsHost" && "Applications for your listings"}
                          {requestInfoDetailKey === "applicationsAsRentee" && "Your applications"}
                          {requestInfoDetailKey === "bookingsAsRentee" && "Your bookings"}
                          {requestInfoDetailKey === "enquiryThreads" && "Enquiry threads"}
                          {requestInfoDetailKey === "messagesSent" && "Messages you sent"}
                          {requestInfoDetailKey === "reportsFiled" && "Reports you filed"}
                        </h3>
                        <button
                          type="button"
                          className="profile-request-detail-close"
                          onClick={() => setRequestInfoDetailKey(null)}
                        >
                          Close
                        </button>
                      </div>
                      <ProfileRequestInfoDetails
                        snapshot={requestInfoSnapshot}
                        detailKey={requestInfoDetailKey}
                        user={user}
                      />
                    </div>
                  )}
                </>
              )}
            </section>
          )}
        </section>
        </section>
      </div>
    </main>
  );
}
