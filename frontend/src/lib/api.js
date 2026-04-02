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
import { LISTING_STATUS } from "../constants/listingStatus";

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

/**
 * Sets a listing's status to "approved"
 * 
 * @param {string} id 
 * @returns the approved listing
 */
export function approveListing(id) {
  const status = LISTING_STATUS.APPROVED;
  const approved = updateListing(id,  {status});
  return approved;
}

/**
 * Sets a listing's status to "rejected"
 * 
 * @param {string} id 
 * @returns the approved listing
 */
export function rejectListing(id) {
  const rejected = updateListing(id,  {status: LISTING_STATUS.REJECTED});
  return rejected;
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
 * Update an account's public profile fields.
 * The password field is intentionally blocked here — use changePassword() instead.
 * Throws if the account does not exist.
 *
 * @param {string} id
 * @param {{ name?: string, avatar?: string }} data
 * @returns {object} the updated account (password stripped)
 */
export function updateAccount(id, data) {
  // Prevent accidental password changes through this function
  const { password: _ignored, ...safeData } = data;

  const updated = db.update("accounts", id, safeData);
  if (!updated) throw new Error(`Account "${id}" not found.`);
  return sanitizeAccount(updated);
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
 * Permanently delete an account.
 * Throws if the account does not exist.
 *
 * @param {string} id
 * @returns {true}
 */
export function deleteAccount(id) {
  const removed = db.remove("accounts", id);
  if (!removed) throw new Error(`Account "${id}" not found.`);
  return true;
}
