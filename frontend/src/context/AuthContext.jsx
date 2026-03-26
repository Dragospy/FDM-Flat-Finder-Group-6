/**
 * AuthContext.jsx — Global authentication state for the application.
 *
 * Wrap the component tree with <AuthProvider> once (in App.jsx) and then
 * access the current user plus auth actions from any component via useAuth().
 *
 * The session is initialised from localStorage so the user stays logged in
 * across page refreshes.
 */

import { createContext, useContext, useState, useCallback } from "react";

import {
  login         as authLogin,
  register      as authRegister,
  logout        as authLogout,
  getCurrentUser,
  refreshSession,
} from "../lib/auth";


// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext(null);


// ─── Provider ─────────────────────────────────────────────────────────────────

/**
 * Provides auth state and actions to the component tree.
 * Place this at the root of the app, inside <BrowserRouter>.
 *
 * @param {{ children: React.ReactNode }} props
 */
export function AuthProvider({ children }) {
  // Initialise from localStorage so the session survives a page refresh
  const [user, setUser] = useState(() => getCurrentUser());

  /** Log in with email + password. Throws on failure. */
  const login = useCallback((email, password) => {
    const loggedIn = authLogin(email, password);
    setUser(loggedIn);
    return loggedIn;
  }, []);

  /** Register a new account and log in immediately. Throws on failure. */
  const register = useCallback((data) => {
    const created = authRegister(data);
    setUser(created);
    return created;
  }, []);

  /** Clear the session and reset user state to null. */
  const logout = useCallback(() => {
    authLogout();
    setUser(null);
  }, []);

  /** Re-read the user from the accounts collection (e.g. after a profile update). */
  const refresh = useCallback(() => {
    const updated = refreshSession();
    setUser(updated);
    return updated;
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, register, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}


// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Access the current auth state and actions from any component.
 *
 * @returns {{
 *   user:     object|null,
 *   login:    (email: string, password: string) => object,
 *   register: (data: object) => object,
 *   logout:   () => void,
 *   refresh:  () => object|null
 * }}
 *
 * @example
 * const { user, login, logout } = useAuth();
 */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>.");
  return ctx;
}
