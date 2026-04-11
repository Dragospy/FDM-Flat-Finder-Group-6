import { Link, NavLink, useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { ROLES } from "../lib/auth";

import "../stylesheets/AuthShell.css";

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
        <div className="auth-shell-left">
          <Link to="/dashboard" className="auth-shell-logo">
            Flat Finder
          </Link>
          <span className="auth-shell-user">
            {user?.name} ({user?.role})
          </span>
        </div>

        <nav className="auth-shell-nav" aria-label="Main">
          <NavLink to="/dashboard" end className={navClassName}>
            Dashboard
          </NavLink>
          <NavLink to="/profile" className={navClassName}>
            Profile
          </NavLink>

          {user?.role === ROLES.RENTEE && (
            <NavLink to="/my-bookings" className={navClassName}>
              My Bookings
            </NavLink>
          )}

          {user?.role === ROLES.HOST && (
            <>
              <NavLink to="/my-listings" className={navClassName}>
                My Listings
              </NavLink>
              <NavLink to="/moderation" className={navClassName}>
                Moderation
              </NavLink>
            </>
          )}

          {user?.role === ROLES.ADMIN && (
            <>
              <NavLink to="/admin" className={navClassName}>
                Admin
              </NavLink>
              <NavLink to="/moderation" className={navClassName}>
                Moderation
              </NavLink>
            </>
          )}
        </nav>

        <button type="button" className="auth-shell-logout" onClick={handleLogout}>
          Log out
        </button>
      </header>

      <div className="auth-shell-body">{children}</div>
    </div>
  );
}

function navClassName({ isActive }) {
  return isActive ? "auth-shell-link auth-shell-link--active" : "auth-shell-link";
}
