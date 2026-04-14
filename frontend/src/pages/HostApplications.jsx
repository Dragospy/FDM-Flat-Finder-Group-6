import { useMemo, useState } from "react";

import { useAuth } from "../context/AuthContext";
import { getListingsByHost, getApplicationsByHost, decideApplication } from "../lib/api";

import "../stylesheets/HostApplications.css";

function statusBadgeClass(status) {
  if (status === "accepted") return "status-badge status-badge--accepted";
  if (status === "rejected") return "status-badge status-badge--rejected";
  if (status === "withdrawn") return "status-badge status-badge--withdrawn";
  return "status-badge status-badge--submitted";
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
      setSuccess(`Application ${decision}.`);
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

