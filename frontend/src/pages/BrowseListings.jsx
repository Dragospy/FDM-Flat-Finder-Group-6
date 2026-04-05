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

  const listings = useMemo(() => {
    return getListings({ city: city.trim() ? city.trim() : undefined });
  }, [city]);

  function handleApply(listingId) {
    setError("");
    setSuccess("");

    try {
      applyForListing({ listingId, consultantId: user.id });
      setSuccess("Application submitted.");
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <main className="browse-listings-page">
      <header className="browse-listings-header">
        <div>
          <h1>Browse properties</h1>
          <p className="browse-listings-subtitle">
            Apply directly to a property, then track it in{" "}
            <Link to="/applications" className="browse-listings-link">My applications</Link>.
          </p>
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
                onClick={() => handleApply(l.id)}
                disabled={!l.available}
                title={!l.available ? "Not available" : "Submit an application"}
              >
                {l.available ? "Apply" : "Unavailable"}
              </button>
            </div>
          </article>
        ))}

        {listings.length === 0 && (
          <div className="browse-listings-empty">
            No properties match your filters.
          </div>
        )}
      </section>
    </main>
  );
}

