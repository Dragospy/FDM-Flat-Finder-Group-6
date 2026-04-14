import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { getListings, applyForListing } from "../lib/api";

import "../stylesheets/BrowseListings.css";

function formatPrice(listing) {
  const unit = listing.priceUnit ? `/${listing.priceUnit}` : "";
  return `£${listing.price.toLocaleString()}${unit}`;
}

export default function BrowseListings() {
  const { user } = useAuth();

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
    return getListings({ city: city.trim() ? city.trim() : undefined });
  }, [city]);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleApply(e, listingId) {
    e.preventDefault();
    setError("");
    setSuccess("");

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

        {error && <p className="browse-listings-alert browse-listings-alert--error">{error}</p>}
        {success && <p className="browse-listings-alert browse-listings-alert--success">{success}</p>}

        <section className="browse-listings-grid">
          {listings.map((l) => (
            <article key={l.id} className="browse-listings-card">
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
                disabled={!l.available}
                title={!l.available ? "Not available" : "Submit an application"}
              >
                {l.available ? (openFormFor === l.id ? "Close form" : "Apply") : "Unavailable"}
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

