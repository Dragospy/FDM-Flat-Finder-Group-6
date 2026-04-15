import { useMemo, useState } from "react";

import { useAuth } from "../context/AuthContext";
import {
  getListingsByHost,
  getApplicationsByHost,
  decideApplication,
  advanceAcceptedApplicationStep,
  ACCEPTED_APPLICATION_STEPS,
  getAccount,
} from "../lib/api";

import "../stylesheets/HostApplications.css";

function statusBadgeClass(status) {
  if (status === "accepted") return "status-badge status-badge--accepted";
  if (status === "rejected") return "status-badge status-badge--rejected";
  if (status === "withdrawn") return "status-badge status-badge--withdrawn";
  return "status-badge status-badge--submitted";
}

function getAcceptedStep(stepId) {
  return ACCEPTED_APPLICATION_STEPS.find((step) => step.id === stepId) ?? ACCEPTED_APPLICATION_STEPS[0];
}

function getNextAcceptedStep(stepId) {
  const safeStep = getAcceptedStep(stepId).id;
  const currentIndex = ACCEPTED_APPLICATION_STEPS.findIndex((step) => step.id === safeStep);
  if (currentIndex < 0 || currentIndex >= ACCEPTED_APPLICATION_STEPS.length - 1) return null;
  return ACCEPTED_APPLICATION_STEPS[currentIndex + 1];
}

export default function HostApplications() {
  const { user } = useAuth();

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const listingsById = useMemo(() => {
    const mine = getListingsByHost(user.id);
    return Object.fromEntries(mine.map((l) => [l.id, l]));
  }, [user.id]);

  const applications = useMemo(() => {
    return getApplicationsByHost(user.id);
  }, [user.id, refreshKey]);

  function handleDecision(applicationId, decision) {
    setError("");
    setSuccess("");
    try {
      decideApplication({ applicationId, hostId: user.id, decision });
      if (decision === "accepted") {
        setSuccess(
          "Application accepted. The listing is now unavailable and other submitted applications were automatically rejected."
        );
      } else {
        setSuccess("Application rejected.");
      }
      setRefreshKey((k) => k + 1);
    } catch (err) {
      setError(err.message);
    }
  }

  function handleAdvance(applicationId) {
    setError("");
    setSuccess("");
    try {
      const updated = advanceAcceptedApplicationStep({ applicationId, hostId: user.id });
      const step = getAcceptedStep(updated.postAcceptanceProgress?.step);
      setSuccess(`Accepted application progressed to: ${step.label}.`);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <main className="host-applications-page">
      <div className="host-applications-shell">
        <header className="host-applications-header">
          <div>
            <p className="host-applications-eyebrow">Landlord Area</p>
            <h1>Process Applications</h1>
            <p className="host-applications-copy">
              Review consultant details and decide whether to accept or reject each accommodation request.
            </p>
          </div>
          <div className="host-applications-actions-top">
            <span className="host-applications-count">{applications.length} Applications</span>
          </div>
        </header>

        {error && <p className="host-applications-alert host-applications-alert--error">{error}</p>}
        {success && <p className="host-applications-alert host-applications-alert--success">{success}</p>}

        <section className="host-applications-list">
          {applications.map((a) => {
          const listing = listingsById[a.listingId];
          const consultant = getAccount(a.consultantId);
          const acceptedStep = getAcceptedStep(a.postAcceptanceProgress?.step);
          const nextAcceptedStep = getNextAcceptedStep(acceptedStep.id);
          return (
            <article key={a.id} className="host-applications-item">
              <div className="host-applications-item-top">
                <div>
                  <h2 className="host-applications-title">
                    {listing ? listing.title : "Unknown listing"}
                  </h2>
                  <p className="host-applications-meta">
                    Listing: {a.listingId} · Consultant: {a.consultantId}
                  </p>
                </div>
                <span className={statusBadgeClass(a.status)}>{a.status}</span>
              </div>

              <div className="host-applications-item-bottom">
                <div className="host-applications-details">
                  <div className="host-applications-dates">
                    <span>Submitted: {new Date(a.createdAt).toLocaleString()}</span>
                    {" · "}
                    <span>Updated: {new Date(a.updatedAt ?? a.createdAt).toLocaleString()}</span>
                  </div>
                  {a.details && (
                    <ul className="host-applications-facts">
                      <li>Stay: {a.details.lengthOfStayMonths} month(s)</li>
                      <li>Move-in: {a.details.moveInDate}</li>
                      <li>Occupants: {a.details.occupants}</li>
                      <li>Employment: {a.details.employmentStatus}</li>
                      <li>Income: GBP {Number(a.details.monthlyIncome).toLocaleString()}</li>
                      {a.details.notes && <li>Details: {a.details.notes}</li>}
                    </ul>
                  )}
                  <div className="host-applications-contact">
                    <p className="host-applications-meta">
                      Contact rentee: {consultant?.name ?? a.consultantId}
                    </p>
                    <p className="host-applications-meta">
                      Email: {consultant?.email ?? "Not available"}
                    </p>
                    <p className="host-applications-meta">
                      Phone: {consultant?.phone ?? "Not provided"}
                    </p>
                  </div>
                  {a.status === "accepted" && (
                    <p className="host-applications-meta">
                      Post-acceptance step: {acceptedStep.label}
                    </p>
                  )}
                </div>

                <div className="host-applications-actions">
                  <button
                    className="host-applications-button"
                    onClick={() => handleDecision(a.id, "accepted")}
                    disabled={a.status !== "submitted"}
                    title={a.status !== "submitted" ? "Only submitted applications can be processed." : "Accept"}
                  >
                    Accept
                  </button>
                  <button
                    className="host-applications-button host-applications-button--secondary"
                    onClick={() => handleDecision(a.id, "rejected")}
                    disabled={a.status !== "submitted"}
                    title={a.status !== "submitted" ? "Only submitted applications can be processed." : "Reject"}
                  >
                    Reject
                  </button>
                  {a.status === "accepted" && (
                    <button
                      className="host-applications-button"
                      onClick={() => handleAdvance(a.id)}
                      disabled={!nextAcceptedStep}
                      title={nextAcceptedStep ? `Move to ${nextAcceptedStep.label}` : "Already at final booking step"}
                    >
                      {nextAcceptedStep ? `Advance to ${nextAcceptedStep.label}` : "Booking complete"}
                    </button>
                  )}
                </div>
              </div>
            </article>
          );
          })}

          {applications.length === 0 && (
            <div className="host-applications-empty">
              <h2>No applications yet</h2>
              <p>Applications from consultants will appear here.</p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

