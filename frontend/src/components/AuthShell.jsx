import { Link, NavLink, useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { ROLES } from "../lib/auth";

import "../stylesheets/AuthShell.css";

/**
 * Wraps authenticated page content with a consistent header so users can move
 * between areas without relying only on the dashboard cards.
 */
export default function AuthShell({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="auth-shell">
      <header className="auth-shell-header">
        <div className="auth-shell-brand">
          <Link to="/dashboard" className="auth-shell-logo">
            Flat Finder
          </Link>
          <span className="auth-shell-user">
            {user?.name} <span className="auth-shell-role">({user?.role})</span>
          </span>
        </div>

        <nav className="auth-shell-nav" aria-label="Main">
          <NavLink to="/dashboard" className={navClass} end>
            Dashboard
          </NavLink>

          {user?.role !== ROLES.ADMIN && (
            <NavLink to="/profile" className={navClass}>
              Profile
            </NavLink>
          )}

          {user?.role === ROLES.RENTEE && (
            <>
              <NavLink to="/applications" className={navClass}>My applications</NavLink>
              <NavLink to="/my-bookings" className={navClass}>My bookings</NavLink>
              <NavLink to="/enquiries" className={navClass}>Enquiries</NavLink>
            </>
          )}

          {user?.role === ROLES.HOST && (
            <>
              <NavLink to="/applications/manage" className={navClass}>Process applications</NavLink>
              <NavLink to="/my-listings" className={navClass}>My listings</NavLink>
              <NavLink to="/enquiries" className={navClass}>Enquiries</NavLink>
            </>
          )}

          {user?.role === ROLES.ADMIN && (
            <>
              <NavLink to="/moderate-listings" className={navClass}>Moderate Listings</NavLink>
              <NavLink to="/manage-accounts" className={navClass}>Manage Accounts</NavLink>
            </>
          )}
          <NavLink to="/search" className={navClass} end>
            Search
          </NavLink>
        </nav>

        <button type="button" className="auth-shell-logout" onClick={handleLogout}>
          Log out
        </button>
      </header>

      <div className="auth-shell-body">{children}</div>
    </div>
  );
}

/** @param {{ isActive: boolean }} props */
function navClass({ isActive }) {
  return isActive ? "auth-shell-link auth-shell-link--active" : "auth-shell-link";
}
