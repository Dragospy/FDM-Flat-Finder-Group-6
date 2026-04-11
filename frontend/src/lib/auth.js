/**
 * auth.js — Fake authentication handler.
 *
 * Credentials are validated against the "accounts" localStorage collection.
 * The active session is stored in localStorage under SESSION_KEY as a
 * password-stripped user object so sensitive data is never held in React state.
 *
 * NOTE: This is for development only — no real security is applied.
 */

import { db } from "./db";


// ─── Constants ────────────────────────────────────────────────────────────────

const SESSION_KEY = "fdm_session";

/**
 * Canonical role identifiers used throughout the application.
 * Import this object anywhere you need to reference a role so that
 * string literals are never scattered across the codebase.
 *
 * @example
 * import { ROLES } from "../lib/auth";
 * // ROLES.ADMIN   → "admin"
 * // ROLES.HOST    → "host"
 * // ROLES.RENTEE  → "rentee"
 */
export const ROLES = Object.freeze({
  ADMIN:  "admin",
  HOST:   "host",
  RENTEE: "rentee",
});


// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Return a copy of an account object with the password field removed.
 * Used before storing or returning user data.
 *
 * @param {object} account
 * @returns {object}
 */
function sanitize(account) {
  // eslint-disable-next-line no-unused-vars
  const { password, ...safe } = account;
  return safe;
}


// ─── Auth actions ─────────────────────────────────────────────────────────────

/**
 * Attempt to log in with an email and password.
 * On success, the sanitized user is persisted to localStorage and returned.
 * Throws an Error with a user-facing message on failure.
 *
 * @param {string} email
 * @param {string} password
 * @returns {object} the logged-in user (without password)
 */
export function login(email, password) {
  if (!email || !password) {
    throw new Error("Email and password are required.");
  }

  const account = db.findOne(
    "accounts",
    (a) => a.email.toLowerCase() === email.toLowerCase() && a.password === password
  );

  if (!account) {
    throw new Error("Invalid email or password.");
  }

  const user = sanitize(account);
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  return user;
}

/**
 * Register a new account and immediately log in as that user.
 * Throws an Error with a user-facing message if validation fails or the
 * email address is already in use.
 *
 * @param {{ name: string, email: string, password: string, role?: "admin"|"host"|"rentee" }} data
 * @returns {object} the newly created user (without password)
 */
export function register({ name, email, password, role = ROLES.RENTEE }) {
  if (!name || !email || !password) {
    throw new Error("Name, email and password are required.");
  }

  const exists = db.findOne(
    "accounts",
    (a) => a.email.toLowerCase() === email.toLowerCase()
  );

  if (exists) {
    throw new Error("An account with this email already exists.");
  }

  const newAccount = db.insert("accounts", {
    name,
    email,
    password,
    role,
    avatar: "",
    phone: "",
  });
  const user       = sanitize(newAccount);

  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  return user;
}

/**
 * Clear the active session, effectively logging the user out.
 */
export function logout() {
  localStorage.removeItem(SESSION_KEY);
}


// ─── Session helpers ──────────────────────────────────────────────────────────

/**
 * Return the currently logged-in user object, or null if no session exists.
 *
 * @returns {object|null}
 */
export function getCurrentUser() {
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Return true if an active session exists.
 *
 * @returns {boolean}
 */
export function isAuthenticated() {
  return getCurrentUser() !== null;
}

/**
 * Re-read the current user from the accounts collection and update the stored
 * session. Useful after a profile update to keep session data in sync.
 *
 * @returns {object|null} the refreshed user, or null if not logged in
 */
export function refreshSession() {
  const current = getCurrentUser();
  if (!current) return null;

  const account = db.getById("accounts", current.id);
  if (!account) return null;

  const user = sanitize(account);
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  return user;
}

/**
 * Return true if `user` has at least one of the supplied roles.
 * Pass a single role string or spread multiple roles.
 *
 * @param {object|null} user
 * @param {...string}   roles  one or more values from ROLES
 * @returns {boolean}
 *
 * @example
 * hasRole(user, ROLES.ADMIN)               // admin only
 * hasRole(user, ROLES.ADMIN, ROLES.HOST)   // admin or host
 */
export function hasRole(user, ...roles) {
  if (!user) return false;
  return roles.includes(user.role);
}
