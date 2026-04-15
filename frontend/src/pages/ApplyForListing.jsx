import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { applyForListing, getApplicationsByConsultant, getListing, APPLICATION_STATUS } from "../lib/api";

import "../stylesheets/BrowseListings.css";

function formatPrice(listing) {
  const unit = listing.priceUnit ? `/${listing.priceUnit}` : "";
  return `£${listing.price.toLocaleString()}${unit}`;
}

export default function ApplyForListing() {
  const { user } = useAuth();
  const { listingId = "" } = useParams();
  const normalizedListingId = decodeURIComponent(listingId).trim();

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState({
    lengthOfStayMonths: "",
    moveInDate: "",
    occupants: 1,
    employmentStatus: "",
    monthlyIncome: "",
    notes: "",
  });

  const hasAcceptedApplication = useMemo(() => {
    return getApplicationsByConsultant(user.id).some((a) => a.status === APPLICATION_STATUS.ACCEPTED);
  }, [user.id]);

  let listing = null;
  try {
    listing = getListing(normalizedListingId);
  } catch {
    listing = null;
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleApply(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!listing) {
      setError("The selected property could not be found.");
      return;
    }

    if (!listing.available) {
      setError("This property is currently unavailable.");
      return;
    }

    if (hasAcceptedApplication) {
      setError("You already have an accepted application. The host will contact you with the next steps.");
      return;
    }

    try {
      applyForListing({
        listingId: listing.id,
        consultantId: user.id,
        lengthOfStayMonths: Number(form.lengthOfStayMonths),
        moveInDate: form.moveInDate,
        occupants: Number(form.occupants),
        employmentStatus: form.employmentStatus,
        monthlyIncome: Number(form.monthlyIncome),
        notes: form.notes,
      });
      setSuccess("Application submitted.");
      setForm({
        lengthOfStayMonths: "",
        moveInDate: "",
        occupants: 1,
        employmentStatus: "",
        monthlyIncome: "",
        notes: "",
      });
    } catch (err) {
      setError(err.message);
    }
  }

  if (!listing) {
    return (
      <main className="browse-listings-page">
        <div className="browse-listings-shell">
          <header className="browse-listings-header">
            <div>
              <p className="browse-listings-eyebrow">Consultant Area</p>
              <h1>Property not found</h1>
              <p className="browse-listings-copy">
                We could not find this listing. Go back to <Link to="/search" className="browse-listings-link">Search</Link> and pick a property to apply.
              </p>
            </div>
          </header>
        </div>
      </main>
    );
  }

  return (
    <main className="browse-listings-page">
      <div className="browse-listings-shell">
        <header className="browse-listings-header">
          <div>
            <p className="browse-listings-eyebrow">Consultant Area</p>
            <h1>Apply for {listing.title}</h1>
            <p className="browse-listings-copy">
              Complete your application details below. You can review status in{" "}
              <Link to="/applications" className="browse-listings-link">My applications</Link>.
            </p>
          </div>
        </header>

        <section className="browse-listings-grid">
          <article className="browse-listings-card">
            <div className="browse-listings-card-top">
              <div>
                <h2 className="browse-listings-title">{listing.title}</h2>
                <p className="browse-listings-meta">
                  {listing.type} · {listing.bedrooms} bed · {listing.location.city} · {listing.location.postcode}
                </p>
              </div>
              <div className="browse-listings-price">{formatPrice(listing)}</div>
            </div>
            <p className="browse-listings-desc">{listing.description}</p>

            {!listing.available && (
              <p className="browse-listings-alert browse-listings-alert--error">
                This property is currently unavailable.
              </p>
            )}
            {hasAcceptedApplication && (
              <p className="browse-listings-alert browse-listings-alert--success">
                You already have an accepted application. New applications are disabled.
              </p>
            )}
            {error && <p className="browse-listings-alert browse-listings-alert--error">{error}</p>}
            {success && <p className="browse-listings-alert browse-listings-alert--success">{success}</p>}

            <form className="browse-listings-form" onSubmit={handleApply}>
              <label className="browse-listings-label">
                Length of stay (months)
                <input
                  className="browse-listings-input"
                  type="number"
                  min="1"
                  name="lengthOfStayMonths"
                  value={form.lengthOfStayMonths}
                  onChange={handleChange}
                  required
                />
              </label>

              <label className="browse-listings-label">
                Move-in date
                <input
                  className="browse-listings-input"
                  type="date"
                  name="moveInDate"
                  value={form.moveInDate}
                  onChange={handleChange}
                  required
                />
              </label>

              <label className="browse-listings-label">
                Number of occupants
                <input
                  className="browse-listings-input"
                  type="number"
                  min="1"
                  name="occupants"
                  value={form.occupants}
                  onChange={handleChange}
                  required
                />
              </label>

              <label className="browse-listings-label">
                Employment status
                <input
                  className="browse-listings-input"
                  type="text"
                  name="employmentStatus"
                  placeholder="e.g. Full-time employed"
                  value={form.employmentStatus}
                  onChange={handleChange}
                  required
                />
              </label>

              <label className="browse-listings-label">
                Monthly income (GBP)
                <input
                  className="browse-listings-input"
                  type="number"
                  name="monthlyIncome"
                  placeholder="e.g. 1200"
                  value={form.monthlyIncome}
                  onChange={handleChange}
                  required
                />
              </label>

              <label className="browse-listings-label">
                Relevant details
                <textarea
                  className="browse-listings-input browse-listings-textarea"
                  name="notes"
                  placeholder="Share any useful info for the landlord..."
                  value={form.notes}
                  onChange={handleChange}
                  rows={3}
                />
              </label>

              <button
                className="browse-listings-button"
                type="submit"
                disabled={!listing.available || hasAcceptedApplication}
              >
                Submit application
              </button>
            </form>
          </article>
        </section>
      </div>
    </main>
  );
}
