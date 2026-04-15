/**
 * MyBookings.jsx — Rentee-only page.
 */

import { useMemo } from "react";
import { Link } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { getBookingsByConsultant, getListings } from "../lib/api";

import "../stylesheets/MyBookings.css";

export default function MyBookings() {
  const { user } = useAuth();

  const listingsById = useMemo(() => {
    const all = getListings();
    return Object.fromEntries(all.map((l) => [l.id, l]));
  }, []);

  const bookings = useMemo(() => {
    return getBookingsByConsultant(user.id);
  }, [user.id]);

  return (
    <main className="my-bookings-page">
      <div className="my-bookings-shell">
        <header className="my-bookings-header">
          <div>
            <p className="my-bookings-eyebrow">Consultant Area</p>
            <h1>My Bookings</h1>
            <p className="my-bookings-copy">
              Confirmed bookings appear here once an accepted application reaches the booked stage.
            </p>
          </div>
          <div className="my-bookings-actions">
            <span className="my-bookings-count">{bookings.length} Bookings</span>
          </div>
        </header>

        <section className="my-bookings-list">
          {bookings.map((booking) => {
            const listing = listingsById[booking.listingId];
            return (
              <article key={booking.id} className="my-bookings-item">
                <h2 className="my-bookings-title">
                  {listing ? listing.title : "Unknown listing"}
                </h2>
                <p className="my-bookings-meta">
                  {listing
                    ? `${listing.location.address}, ${listing.location.city} ${listing.location.postcode}`
                    : booking.listingId}
                </p>
                {booking.details && (
                  <ul className="my-bookings-facts">
                    <li>Move-in: {booking.details.moveInDate}</li>
                    <li>Stay: {booking.details.lengthOfStayMonths} month(s)</li>
                    <li>Occupants: {booking.details.occupants}</li>
                  </ul>
                )}
                <p className="my-bookings-meta">
                  Booking confirmed: {new Date(booking.updatedAt ?? booking.createdAt).toLocaleString()}
                </p>
              </article>
            );
          })}

          {bookings.length === 0 && (
            <div className="my-bookings-empty">
              <h2>No bookings yet</h2>
              <p>
                You do not have a confirmed booking yet. Continue from{" "}
                <Link to="/search" className="my-bookings-link">Search</Link>.
              </p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
