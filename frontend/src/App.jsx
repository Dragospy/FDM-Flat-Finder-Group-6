/**
 * App.jsx — Root component and client-side route definitions.
 *
 * <AuthProvider> wraps the entire tree so every page can access auth state
 * via useAuth(). Add new routes here as the application grows.
 *
 * Route access levels
 * ───────────────────
 *   Public              — visible to everyone, no login required
 *   Any authenticated   — requires a valid session (any role)
 *   Role-restricted     — pass allowedRoles={[ROLES.X, ...]} to ProtectedRoute
 */

import { Routes, Route } from "react-router-dom";

import { AuthProvider }  from "./context/AuthContext";
import { ROLES }         from "./lib/auth";
import ProtectedLayout   from "./components/ProtectedLayout";

import Home        from "./pages/Home";
import Login       from "./pages/Login";
import Register    from "./pages/Register";
import Dashboard   from "./pages/Dashboard";
import Profile     from "./pages/Profile";
import MyBookings  from "./pages/MyBookings";
import MyListings  from "./pages/MyListings";
import Admin       from "./pages/Admin";
import Moderation  from "./pages/Moderation";
import PublicOnlyRoute from "./components/PublicOnlyRoute";


export default function App() {
  return (
    <AuthProvider>
      <Routes>

        {/* ── Public ─────────────────────────────────────────────────────── */}
        <Route 
          path="/"         
          element={
            <PublicOnlyRoute>
              <Home />
            </PublicOnlyRoute>
          }    
        />
        <Route 
          path="/login"         
          element={
            <PublicOnlyRoute>
              <Login />
            </PublicOnlyRoute>
          }    
        />
        <Route 
          path="/register"         
          element={
            <PublicOnlyRoute>
              <Register />
            </PublicOnlyRoute>
          }    
        />

        {/* ── Any authenticated user ─────────────────────────────────────── */}
        <Route
          path="/dashboard"
          element={
            <ProtectedLayout>
              <Dashboard />
            </ProtectedLayout>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedLayout allowedRoles={[ROLES.HOST, ROLES.RENTEE]}>
              <Profile />
            </ProtectedLayout>
          }
        />


        {/* ── Rentee only ────────────────────────────────────────────────── */}
        <Route
          path="/my-bookings"
          element={
            <ProtectedLayout allowedRoles={[ROLES.RENTEE]}>
              <MyBookings />
            </ProtectedLayout>
          }
        />


        {/* ── Host only ──────────────────────────────────────────────────── */}
        <Route
          path="/my-listings"
          element={
            <ProtectedLayout allowedRoles={[ROLES.HOST]}>
              <MyListings />
            </ProtectedLayout>
          }
        />


        {/* ── Admin only ─────────────────────────────────────────────────── */}
        <Route
          path="/admin"
          element={
            <ProtectedLayout allowedRoles={[ROLES.ADMIN]}>
              <Admin />
            </ProtectedLayout>
          }
        />


        {/* ── Admin + Host ───────────────────────────────────────────────── */}
        <Route
          path="/moderation"
          element={
            <ProtectedLayout allowedRoles={[ROLES.ADMIN, ROLES.HOST]}>
              <Moderation />
            </ProtectedLayout>
          }
        />

      </Routes>
    </AuthProvider>
  );
}
