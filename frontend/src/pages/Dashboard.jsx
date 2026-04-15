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
      <header className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Dashboard</h1>
          <p className="dashboard-subtitle">
            Signed in as <strong>{user?.name}</strong> ({user?.role})
          </p>
        </div>
      </header>

      <section className="dashboard-cards">
        {user?.role === ROLES.RENTEE && (
          <>
            <Link to="/applications" className="dashboard-card">
              <h2>Manage applications</h2>
              <p>Track status and withdraw submitted applications.</p>
            </Link>
            <Link to="/my-bookings" className="dashboard-card">
              <h2>My bookings</h2>
              <p>See confirmed accommodation bookings.</p>
            </Link>
            <Link to="/profile" className="dashboard-card">
              <h2>Profile</h2>
              <p>Update your contact details and account information.</p>
            </Link>
            <Link to="/search" className="dashboard-card">
              <h2>Search</h2>
              <p>Search accommodation listings.</p>
            </Link>
          </>
        )}

        {user?.role === ROLES.HOST && (
          <>
            <Link to="/applications/manage" className="dashboard-card">
              <h2>Process applications</h2>
              <p>Accept or reject accommodation applications.</p>
            </Link>
            <Link to="/my-listings" className="dashboard-card">
              <h2>My listings</h2>
              <p>Create, edit, and archive your properties.</p>
            </Link>
            <Link to="/moderation" className="dashboard-card">
              <h2>Moderation</h2>
              <p>Review listing reports and moderation queue items.</p>
            </Link>
            <Link to="/profile" className="dashboard-card">
              <h2>Profile</h2>
              <p>Update your contact details and account information.</p>
            </Link>
            <Link to="/search" className="dashboard-card">
              <h2>Search</h2>
              <p>Search accommodation listings.</p>
            </Link>
          </>
        )}

        {user?.role === ROLES.ADMIN && (
          <>
            <Link to="/profile" className="dashboard-card">
              <h2>Profile</h2>
              <p>Update your contact details and account information.</p>
            </Link>
            <Link to="/moderate-listings" className="dashboard-card">
              <h2>Moderate Listings</h2>
              <p>Approve or reject accommodation listings</p>
            </Link>
            <Link to="/manage-accounts" className="dashboard-card">
              <h2>Manage Accounts</h2>
              <p>Deactivate and reactivate accounts.</p>
            </Link>
            <Link to="/moderation" className="dashboard-card">
              <h2>Moderation</h2>
              <p>Review reports and moderation queue items.</p>
            </Link>
            <Link to="/search" className="dashboard-card">
              <h2>Search</h2>
              <p>Search accommodation listings.</p>
            </Link>
          </>
        )}
      </section>
    </main>
  );
}
