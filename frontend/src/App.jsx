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
import ProtectedRoute    from "./components/ProtectedRoute";

import Home        from "./pages/Home";
import Login       from "./pages/Login";
import Register    from "./pages/Register";
import Dashboard   from "./pages/Dashboard";
import MyBookings  from "./pages/MyBookings";
import MyListings  from "./pages/MyListings";
import Admin       from "./pages/Admin";
import Moderation  from "./pages/Moderation";
import PublicOnlyRoute from "./components/PublicOnlyRoute";
import Search  from "./pages/Search";

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
        <Route 
          path="/search"         
          element={
            <PublicOnlyRoute>
              <Search />
            </PublicOnlyRoute>
          }    
        />

        {/* ── Any authenticated user ─────────────────────────────────────── */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />


        {/* ── Rentee only ────────────────────────────────────────────────── */}
        <Route
          path="/my-bookings"
          element={
            <ProtectedRoute allowedRoles={[ROLES.RENTEE]}>
              <MyBookings />
            </ProtectedRoute>
          }
        />


        {/* ── Host only ──────────────────────────────────────────────────── */}
        <Route
          path="/my-listings"
          element={
            <ProtectedRoute allowedRoles={[ROLES.HOST]}>
              <MyListings />
            </ProtectedRoute>
          }
        />


        {/* ── Admin only ─────────────────────────────────────────────────── */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
              <Admin />
            </ProtectedRoute>
          }
        />


        {/* ── Admin + Host ───────────────────────────────────────────────── */}
        <Route
          path="/moderation"
          element={
            <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.HOST]}>
              <Moderation />
            </ProtectedRoute>
          }
        />

      </Routes>
    </AuthProvider>
  );
}
