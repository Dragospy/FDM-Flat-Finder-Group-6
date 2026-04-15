import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import {
  getListings,
  getApplicationsByConsultant,
  withdrawApplication,
  ACCEPTED_APPLICATION_STEPS,
} from "../lib/api";

import "../stylesheets/MyApplications.css";

function statusBadgeClass(status) {
  if (status === "accepted") return "status-badge status-badge--accepted";
  if (status === "rejected") return "status-badge status-badge--rejected";
  if (status === "withdrawn") return "status-badge status-badge--withdrawn";
  return "status-badge status-badge--submitted";
}

function statusExplanation(status) {
  if (status === "accepted") {
    return "Accepted: this property has been reserved for you. The host will contact you with the next steps.";
  }
  if (status === "rejected") {
    return "Rejected: the host selected another application for this property.";
  }
  if (status === "withdrawn") {
    return "Withdrawn: you cancelled this application.";
  }
  return "Submitted: your application is under review by the host.";
}

function getAcceptedStep(stepId) {
  return ACCEPTED_APPLICATION_STEPS.find((step) => step.id === stepId) ?? ACCEPTED_APPLICATION_STEPS[0];
}

export default function MyApplications() {
  const { user } = useAuth();

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const listingsById = useMemo(() => {
    const all = getListings();
    return Object.fromEntries(all.map((l) => [l.id, l]));
  }, []);

  const applications = useMemo(() => {
    return getApplicationsByConsultant(user.id);
  }, [user.id, refreshKey]);

  function handleWithdraw(applicationId) {
    const confirmed = window.confirm(
      "Are you sure you want to withdraw this application?"
    );
    if (!confirmed) return;

    setError("");
    setSuccess("");
    try {
      withdrawApplication({ applicationId, consultantId: user.id });
      setSuccess("Application withdrawn.");
      setRefreshKey((k) => k + 1);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <main className="my-applications-page">
      <div className="my-applications-shell">
        <header className="my-applications-header">
          <div>
            <p className="my-applications-eyebrow">Consultant Area</p>
            <h1>My Applications</h1>
            <p className="my-applications-copy">
              Track statuses and withdraw submitted applications, or{" "}
              <Link to="/search" className="my-applications-link">apply to another property</Link>.
            </p>
          </div>
          <div className="my-applications-actions">
            <span className="my-applications-count">{applications.length} Applications</span>
          </div>
        </header>

        {error && <p className="my-applications-alert my-applications-alert--error">{error}</p>}
        {success && <p className="my-applications-alert my-applications-alert--success">{success}</p>}

        <section className="my-applications-list">
          {applications.map((a) => {
          const listing = listingsById[a.listingId];
          const acceptedStep = getAcceptedStep(a.postAcceptanceProgress?.step);
          const acceptedStepIndex = ACCEPTED_APPLICATION_STEPS.findIndex(
            (step) => step.id === acceptedStep.id
          );

          return (
            <article key={a.id} className="my-applications-item">
              <div className="my-applications-item-top">
                <div>
                  <h2 className="my-applications-title">
                    {listing ? (
                      <Link to={`/apply/${encodeURIComponent(String(listing.id).trim())}`} className="my-applications-link">
                        {listing.title}
                      </Link>
                    ) : "Unknown listing"}
                  </h2>
                  <p className="my-applications-meta">
                    {listing
                      ? `${listing.location.city} · ${listing.location.postcode}`
                      : a.listingId}
                  </p>
                </div>

                <span className={statusBadgeClass(a.status)}>
                  {a.status}
                </span>
              </div>
              <p className="my-applications-meta">{statusExplanation(a.status)}</p>

              <div className="my-applications-item-bottom">
                <div className="my-applications-details">
                  <div className="my-applications-dates">
                    <span>Submitted: {new Date(a.createdAt).toLocaleString()}</span>
                    {" · "}
                    <span>Updated: {new Date(a.updatedAt ?? a.createdAt).toLocaleString()}</span>
                  </div>
                  {a.details && (
                    <ul className="my-applications-facts">
                      <li>Stay: {a.details.lengthOfStayMonths} month(s)</li>
                      <li>Move-in: {a.details.moveInDate}</li>
                      <li>Occupants: {a.details.occupants}</li>
                      <li>Employment: {a.details.employmentStatus}</li>
                      <li>Income: GBP {Number(a.details.monthlyIncome).toLocaleString()}</li>
                      {a.details.notes && <li>Details: {a.details.notes}</li>}
                    </ul>
                  )}
                  {a.status === "accepted" && (
                    <div className="my-applications-next-steps">
                      <p className="my-applications-meta">
                        Next steps (current: {acceptedStep.label})
                      </p>
                      <ul className="my-applications-facts">
                        {ACCEPTED_APPLICATION_STEPS.map((step, index) => {
                          const done = index <= acceptedStepIndex;
                          return (
                            <li key={step.id}>
                              {done ? "✓" : "○"} {step.label}
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="my-applications-actions">
                  <button
                    className="my-applications-button"
                    onClick={() => handleWithdraw(a.id)}
                    disabled={a.status !== "submitted"}
                    title={a.status !== "submitted" ? "Only submitted applications can be withdrawn." : "Withdraw application"}
                  >
                    Withdraw
                  </button>
                </div>
              </div>
            </article>
          );
          })}

          {applications.length === 0 && (
            <div className="my-applications-empty">
              <h2>No applications yet</h2>
              <p>
                You haven&apos;t applied to any properties yet.{" "}
                <Link to="/search" className="my-applications-link">Browse listings</Link>.
              </p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

