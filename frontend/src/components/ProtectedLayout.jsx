import ProtectedRoute from "./ProtectedRoute";
import AuthShell from "./AuthShell";

/**
 * Authenticated route with role guard (optional) and shared navigation shell.
 *
 * @param {{ children: React.ReactNode, allowedRoles?: string[] }} props
 */
export default function ProtectedLayout({ children, allowedRoles }) {
  return (
    <ProtectedRoute allowedRoles={allowedRoles}>
      <AuthShell>{children}</AuthShell>
    </ProtectedRoute>
  );
}
