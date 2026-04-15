import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { getListings, getApplicationsByConsultant, applyForListing, APPLICATION_STATUS } from "../lib/api";

import "../stylesheets/BrowseListings.css";

function formatPrice(listing) {
  const unit = listing.priceUnit ? `/${listing.priceUnit}` : "";
  return `£${listing.price.toLocaleString()}${unit}`;
}

export default function BrowseListings() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();

  const [city, setCity] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [openFormFor, setOpenFormFor] = useState(null);
  const [form, setForm] = useState({
    lengthOfStayMonths: "",
    moveInDate: "",
    occupants: 1,
    employmentStatus: "",
    monthlyIncome: "",
    notes: "",
  });

  const listings = useMemo(() => {
    return getListings({status: APPLICATION_STATUS.ACCEPTED, city: city.trim() ? city.trim() : undefined });
  }, [city]);

  const hasAcceptedApplication = useMemo(() => {
    return getApplicationsByConsultant(user.id).some((a) => a.status === "accepted");
  }, [user.id]);

  useEffect(() => {
    const rawListingIdParam = searchParams.get("listingId");
    const listingIdParam = rawListingIdParam ? decodeURIComponent(rawListingIdParam).trim() : "";
    if (!listingIdParam) return;

    const targetListing = listings.find(
      (listing) => String(listing.id).trim() === listingIdParam
    );
    if (!targetListing) {
      setError("The selected property could not be found.");
      return;
    }

    if (!targetListing.available) {
      setError("The selected property is currently unavailable.");
      return;
    }

    if (hasAcceptedApplication) {
      setError("You already have an accepted application. New applications are disabled.");
      return;
    }

    setError("");
    setSuccess("Continue below to complete your application.");
    setOpenFormFor(targetListing.id);

    requestAnimationFrame(() => {
      document.getElementById(`listing-${targetListing.id}`)?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }, [searchParams, listings, hasAcceptedApplication]);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleApply(e, listingId) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (hasAcceptedApplication) {
      setError("You already have an accepted application. The host will contact you with the next steps.");
      return;
    }

    try {
      applyForListing({
        listingId,
        consultantId: user.id,
        lengthOfStayMonths: Number(form.lengthOfStayMonths),
        moveInDate: form.moveInDate,
        occupants: Number(form.occupants),
        employmentStatus: form.employmentStatus,
        monthlyIncome: Number(form.monthlyIncome),
        notes: form.notes,
      });
      setSuccess("Application submitted.");
      setOpenFormFor(null);
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

  return (
    <main className="browse-listings-page">
      <div className="browse-listings-shell">
        <header className="browse-listings-header">
          <div>
            <p className="browse-listings-eyebrow">Consultant Area</p>
            <h1>Apply for Accommodation</h1>
            <p className="browse-listings-copy">
              Submit complete applications with your stay details and profile, then track progress in{" "}
              <Link to="/applications" className="browse-listings-link">My applications</Link>.
            </p>
          </div>
          <div className="browse-listings-actions">
            <span className="browse-listings-count">{listings.length} Properties</span>
          </div>
        </header>

        <section className="browse-listings-controls">
          <label className="browse-listings-label">
            City
            <input
              className="browse-listings-input"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="e.g. London"
            />
          </label>
        </section>

        {hasAcceptedApplication && (
          <p className="browse-listings-alert browse-listings-alert--success">
            You already have an accepted application. New applications are disabled until your current booking is resolved.
          </p>
        )}

        {error && <p className="browse-listings-alert browse-listings-alert--error">{error}</p>}
        {success && <p className="browse-listings-alert browse-listings-alert--success">{success}</p>}

        <section className="browse-listings-grid">
          {listings.map((l) => (
            <article id={`listing-${l.id}`} key={l.id} className="browse-listings-card">
            <div className="browse-listings-card-top">
              <div>
                <h2 className="browse-listings-title">{l.title}</h2>
                <p className="browse-listings-meta">
                  {l.type} · {l.bedrooms} bed · {l.location.city} · {l.location.postcode}
                </p>
              </div>
              <div className="browse-listings-price">{formatPrice(l)}</div>
            </div>

            <p className="browse-listings-desc">{l.description}</p>

            <div className="browse-listings-actions">
              <button
                className="browse-listings-button"
                onClick={() => setOpenFormFor((curr) => (curr === l.id ? null : l.id))}
                disabled={!l.available || hasAcceptedApplication}
                title={
                  hasAcceptedApplication
                    ? "You already have an accepted application."
                    : (!l.available ? "Not available" : "Submit an application")
                }
              >
                {hasAcceptedApplication
                  ? "Application locked"
                  : (l.available ? (openFormFor === l.id ? "Close form" : "Apply") : "Unavailable")}
              </button>
            </div>

            {openFormFor === l.id && (
              <form className="browse-listings-form" onSubmit={(e) => handleApply(e, l.id)}>
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

                <button className="browse-listings-button" type="submit">
                  Submit application
                </button>
              </form>
            )}
            </article>
          ))}

          {listings.length === 0 && (
            <div className="browse-listings-empty">
              No properties match your filters.
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

