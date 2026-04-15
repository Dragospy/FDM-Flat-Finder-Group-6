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
import Admin       from "./pages/ModerateListings";
import Enquiries   from "./pages/Enquiries";
import PublicOnlyRoute from "./components/PublicOnlyRoute";
import BrowseListings from "./pages/BrowseListings";
import MyApplications from "./pages/MyApplications";
import HostApplications from "./pages/HostApplications";
import Search  from "./pages/Search";
import ApplyForListing from "./pages/ApplyForListing";
import AccountManagement from "./pages/ManageAccounts";
import ModerateListings from "./pages/ModerateListings";

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
        <Route 
          path="/search"         
          element={
            <ProtectedLayout>
              <Search />
            </ProtectedLayout>
          }    
        />

        {/* ── Rentee (Consultant) applications ─────────────────────────────── */}
        <Route
          path="/listings"
          element={
            <ProtectedLayout allowedRoles={[ROLES.RENTEE]}>
              <BrowseListings />
            </ProtectedLayout>
          }
        />
        <Route
          path="/applications"
          element={
            <ProtectedLayout allowedRoles={[ROLES.RENTEE]}>
              <MyApplications />
            </ProtectedLayout>
          }
        />
        <Route
          path="/apply/:listingId"
          element={
            <ProtectedLayout allowedRoles={[ROLES.RENTEE]}>
              <ApplyForListing />
            </ProtectedLayout>
          }
        />

        {/* ── Host (Landlord) processing ──────────────────────────────────── */}
        <Route
          path="/applications/manage"
          element={
            <ProtectedLayout allowedRoles={[ROLES.HOST]}>
              <HostApplications />
            </ProtectedLayout>
          }
        />


        {/* ── Host + Rentee ──────────────────────────────────────────────── */}
        <Route
          path="/enquiries"
          element={
            <ProtectedLayout allowedRoles={[ROLES.HOST, ROLES.RENTEE]}>
              <Enquiries />
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
          path="/moderate-listings"
          element={
            <ProtectedLayout allowedRoles={[ROLES.ADMIN]}>
              <ModerateListings />
            </ProtectedLayout>
          }
        />

        <Route
          path="/manage-accounts"
          element={
            <ProtectedLayout allowedRoles={[ROLES.ADMIN]}>
              <AccountManagement />
            </ProtectedLayout>
          }
        />

      </Routes>
    </AuthProvider>
  );
}
