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
            <Link to="/listings" className="dashboard-card">
              <h2>Apply for accommodation</h2>
              <p>Browse properties and submit an application.</p>
            </Link>
            <Link to="/applications" className="dashboard-card">
              <h2>Manage applications</h2>
              <p>Track status and withdraw submitted applications.</p>
            </Link>
          </>
        )}

        {user?.role === ROLES.HOST && (
          <>
            <Link to="/applications/manage" className="dashboard-card">
              <h2>Process applications</h2>
              <p>Accept or reject accommodation applications.</p>
            </Link>
          </>
        )}

        {user?.role === ROLES.ADMIN && (
          <>
            <Link to="/admin" className="dashboard-card">
              <h2>Admin</h2>
              <p>Administrative tools.</p>
            </Link>
          </>
        )}
      </section>
    </main>
  );
}
