/**
 * ProtectedRoute.jsx — Route guard for authenticated and role-restricted pages.
 *
 * Behaviour:
 *   1. Not logged in           → redirect to /login (destination saved in state)
 *   2. Logged in, wrong role   → render an inline "Access Denied" screen
 *   3. Logged in, correct role → render children normally
 *
 * Usage — authentication only (any logged-in role may enter):
 *   <ProtectedRoute>
 *     <Dashboard />
 *   </ProtectedRoute>
 *
 * Usage — restrict to specific roles:
 *   <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
 *     <AdminPanel />
 *   </ProtectedRoute>
 *
 *   <ProtectedRoute allowedRoles={[ROLES.HOST, ROLES.ADMIN]}>
 *     <ManageListings />
 *   </ProtectedRoute>
 */

import { Navigate, useLocation } from "react-router-dom";

import { useAuth }   from "../context/AuthContext";
import { hasRole }   from "../lib/auth";

import "../stylesheets/AccessDenied.css";


// ─── Component ────────────────────────────────────────────────────────────────

/**
 * @param {{ children: React.ReactNode, allowedRoles?: string[] }} props
 */
export default function ProtectedRoute({ children, allowedRoles }) {
  const { user } = useAuth();
  const location = useLocation();

  // 1. Not authenticated — redirect to /login, preserving the intended path
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 2. Authenticated but role not permitted
  if (allowedRoles && !hasRole(user, ...allowedRoles)) {
    return <AccessDenied userRole={user.role} allowedRoles={allowedRoles} />;
  }

  // 3. All checks passed
  return children;
}


// ─── Access Denied screen ─────────────────────────────────────────────────────

/**
 * Shown when the user is logged in but their role is not in allowedRoles.
 * Rendered inline so no extra route or page file is needed.
 */
function AccessDenied({ userRole, allowedRoles }) {
  return (
    <div className="access-denied-page">
      <div className="access-denied-card">
        <span className="access-denied-icon">🚫</span>
        <h1 className="access-denied-title">Access Denied</h1>
        <p className="access-denied-message">
          Your account role (<strong>{userRole}</strong>) does not have permission
          to view this page.
        </p>
        <p className="access-denied-hint">
          Required role{allowedRoles.length > 1 ? "s" : ""}:{" "}
          <strong>{allowedRoles.join(", ")}</strong>
        </p>
        <a href="/" className="access-denied-link">← Back to home</a>
      </div>
    </div>
  );
}
