/**
 * api.js — Pre-made API functions for listings and accounts.
 *
 * All functions are synchronous and return plain objects or arrays directly;
 * no Promise wrapping is needed because data lives in localStorage.
 *
 * Each function throws an Error with a user-facing message when an operation
 * cannot be completed (e.g. record not found, missing required field).
 */

import { db } from "./db";


// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Return a copy of an account with the password field removed.
 * Always call this before returning account data to the UI.
 *
 * @param {object|null} account
 * @returns {object|null}
 */
function sanitizeAccount(account) {
  if (!account) return null;
  // eslint-disable-next-line no-unused-vars
  const { password, ...safe } = account;
  return safe;
}


// ─── Listings ─────────────────────────────────────────────────────────────────

/**
 * Return all listings, optionally narrowed by one or more filters.
 *
 * @param {{
 *   city?:      string,
 *   minPrice?:  number,
 *   maxPrice?:  number,
 *   bedrooms?:  number,
 *   available?: boolean
 * }} filters
 * @returns {Array}
 */
export function getListings(filters = {}) {
  let listings = db.getAll("listings");

  if (filters.city !== undefined) {
    const city = filters.city.toLowerCase();
    listings = listings.filter((l) => l.location.city.toLowerCase().includes(city));
  }

  if (filters.minPrice !== undefined) {
    listings = listings.filter((l) => l.price >= filters.minPrice);
  }

  if (filters.maxPrice !== undefined) {
    listings = listings.filter((l) => l.price <= filters.maxPrice);
  }

  if (filters.bedrooms !== undefined) {
    listings = listings.filter((l) => l.bedrooms === filters.bedrooms);
  }

  if (filters.available !== undefined) {
    listings = listings.filter((l) => l.available === filters.available);
  }

  return listings;
}

/**
 * Return a single listing by id.
 * Throws if the listing does not exist.
 *
 * @param {string} id
 * @returns {object}
 */
export function getListing(id) {
  const listing = db.getById("listings", id);
  if (!listing) throw new Error(`Listing "${id}" not found.`);
  return listing;
}

/**
 * Return all listings that belong to a specific host account.
 *
 * @param {string} hostId
 * @returns {Array}
 */
export function getListingsByHost(hostId) {
  return db.find("listings", (l) => l.hostId === hostId);
}

/**
 * Create a new listing. Sensible defaults are applied for optional fields.
 * Throws if any required field is missing.
 *
 * @param {object} data  hostId, title, and price are required
 * @returns {object} the created listing
 */
export function createListing(data) {
  if (!data.hostId) throw new Error("hostId is required to create a listing.");
  if (!data.title)  throw new Error("title is required.");
  if (!data.price)  throw new Error("price is required.");

  return db.insert("listings", {
    available:   true,
    rating:      0,
    reviewCount: 0,
    images:      [],
    amenities:   [],
    ...data,
  });
}

/**
 * Apply a partial update to an existing listing.
 * Throws if the listing does not exist.
 *
 * @param {string} id
 * @param {object} data  partial fields to update
 * @returns {object} the updated listing
 */
export function updateListing(id, data) {
  const updated = db.update("listings", id, data);
  if (!updated) throw new Error(`Listing "${id}" not found.`);
  return updated;
}

/**
 * Permanently delete a listing.
 * Throws if the listing does not exist.
 *
 * @param {string} id
 * @returns {true}
 */
export function deleteListing(id) {
  const removed = db.remove("listings", id);
  if (!removed) throw new Error(`Listing "${id}" not found.`);
  return true;
}


// ─── Accounts ─────────────────────────────────────────────────────────────────

/**
 * Return all accounts with passwords stripped.
 *
 * @returns {Array}
 */
export function getAccounts() {
  return db.getAll("accounts").map(sanitizeAccount);
}

/**
 * Return a single account by id with the password stripped.
 * Throws if the account does not exist.
 *
 * @param {string} id
 * @returns {object}
 */
export function getAccount(id) {
  const account = db.getById("accounts", id);
  if (!account) throw new Error(`Account "${id}" not found.`);
  return sanitizeAccount(account);
}

/**
 * Return a single account by id including password.
 * Intended only for local profile editing in this coursework app.
 *
 * @param {string} id
 * @returns {object}
 */
export function getAccountWithPassword(id) {
  const account = db.getById("accounts", id);
  if (!account) throw new Error(`Account "${id}" not found.`);
  return account;
}

/**
 * Update an account's profile fields.
 * Throws if the account does not exist.
 *
 * @param {string} id
 * @param {{
 *   name?: string,
 *   email?: string,
 *   avatar?: string,
 *   phone?: string
 * }} data
 * @returns {object} the updated account (password stripped)
 */
export function updateAccount(id, data) {
  const safeData = { ...data };

  if (safeData.name !== undefined && !safeData.name.trim()) {
    throw new Error("Name cannot be empty.");
  }

  if (safeData.email !== undefined) {
    const nextEmail = safeData.email.trim().toLowerCase();
    if (!nextEmail) throw new Error("Email cannot be empty.");

    const duplicate = db.findOne(
      "accounts",
      (a) => a.email.toLowerCase() === nextEmail && a.id !== id
    );

    if (duplicate) {
      throw new Error("An account with this email already exists.");
    }

    safeData.email = nextEmail;
  }

  if (safeData.password !== undefined && safeData.password !== "") {
    if (safeData.password.length < 6) {
      throw new Error("Password must be at least 6 characters.");
    }
  }

  if (safeData.password === "") {
    delete safeData.password;
  }

  const updated = db.update("accounts", id, safeData);
  if (!updated) throw new Error(`Account "${id}" not found.`);
  return sanitizeAccount(updated);
}

/**
 * Dev-only helper to persist current account records back into src/data/accounts.json.
 * This only works while running the Vite dev server.
 *
 * @returns {Promise<void>}
 */
export async function persistAccountsToJson() {
  const accounts = db.getAll("accounts");
  if (accounts.length === 0) {
    throw new Error("Refusing to persist: account list is empty.");
  }

  const response = await fetch("/__dev/write-accounts-json", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ accounts }),
  });

  if (!response.ok) {
    throw new Error("Failed to persist account data to accounts.json.");
  }
}

/**
 * Change an account password after verifying the current one.
 * Throws if the account is not found, the current password is wrong,
 * or the new password is too short.
 *
 * @param {string} id
 * @param {string} currentPassword
 * @param {string} newPassword
 * @returns {true}
 */
export function changePassword(id, currentPassword, newPassword) {
  const account = db.getById("accounts", id);

  if (!account) throw new Error("Account not found.");
  if (account.password !== currentPassword) throw new Error("Current password is incorrect.");
  if (!newPassword || newPassword.length < 6) {
    throw new Error("New password must be at least 6 characters.");
  }

  db.update("accounts", id, { password: newPassword });
  return true;
}

/**
 * Reset a password by matching email + phone number.
 *
 * @param {{ email: string, phone: string, newPassword: string }} data
 * @returns {true}
 */
export function resetPasswordByEmailAndPhone({ email, phone, newPassword }) {
  const normalizedEmail = (email ?? "").trim().toLowerCase();
  const normalizedPhone = (phone ?? "").trim();

  if (!normalizedEmail || !normalizedPhone) {
    throw new Error("Email and phone number are required.");
  }

  if (!newPassword || newPassword.length < 6) {
    throw new Error("New password must be at least 6 characters.");
  }

  const matches = db.find(
    "accounts",
    (a) =>
      a.email?.trim().toLowerCase() === normalizedEmail
      && (a.phone ?? "").trim() === normalizedPhone
  );

  if (matches.length === 0) {
    throw new Error("No account matched that email and phone number.");
  }

  if (matches.length > 1) {
    throw new Error("Multiple accounts matched. Contact support.");
  }

  db.update("accounts", matches[0].id, { password: newPassword });
  return true;
}

/**
 * Permanently delete an account.
 * Throws if the account does not exist.
 *
 * @param {string} id
 * @returns {true}
 */
export function deleteAccount(id) {
  const accounts = db.getAll("accounts");
  if (accounts.length <= 1) {
    throw new Error("Cannot delete the final account.");
  }

  const removed = db.remove("accounts", id);
  if (!removed) throw new Error(`Account "${id}" not found.`);
  return true;
}
