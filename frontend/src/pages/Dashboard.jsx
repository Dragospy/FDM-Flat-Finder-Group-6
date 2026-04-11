/**
 * Dashboard.jsx — Authenticated landing page (any role).
 */

import { Link } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { ROLES } from "../lib/auth";

import "../stylesheets/Dashboard.css";

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <main className="dashboard-page">
      <h1 className="dashboard-title">Dashboard</h1>
      <p className="dashboard-subtitle">
        Welcome, <strong>{user?.name}</strong> ({user?.role})
      </p>

      <section className="dashboard-links">
        {user?.role !== ROLES.ADMIN && (
          <Link className="dashboard-link-card" to="/profile">
            My Profile
          </Link>
        )}

        {user?.role === ROLES.RENTEE && (
          <Link className="dashboard-link-card" to="/my-bookings">
            My Bookings
          </Link>
        )}

        {user?.role === ROLES.HOST && (
          <>
            <Link className="dashboard-link-card" to="/my-listings">
              My Listings
            </Link>
            <Link className="dashboard-link-card" to="/moderation">
              Moderation
            </Link>
          </>
        )}

        {user?.role === ROLES.ADMIN && (
          <>
            <Link className="dashboard-link-card" to="/admin">
              Admin
            </Link>
            <Link className="dashboard-link-card" to="/moderation">
              Moderation
            </Link>
          </>
        )}
      </section>
    </main>
  );
}
