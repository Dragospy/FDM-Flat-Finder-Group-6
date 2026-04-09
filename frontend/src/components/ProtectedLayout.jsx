import ProtectedRoute from "./ProtectedRoute";
import AuthShell from "./AuthShell";

/**
 * Authenticated route with optional role guard and shared page shell.
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
