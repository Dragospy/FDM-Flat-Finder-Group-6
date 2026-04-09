import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function PublicOnlyRoute({ children }) {
  const { user } = useAuth();

  if (user) return <Navigate to="/dashboard" replace />;

  return <div className="publicRouteLayout">{children}</div>;
}
