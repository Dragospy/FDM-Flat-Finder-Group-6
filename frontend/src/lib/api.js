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

// ─── Applications ──────────────────────────────────────────────────────────────

export const APPLICATION_STATUS = Object.freeze({
  SUBMITTED: "submitted",
  ACCEPTED: "accepted",
  REJECTED: "rejected",
  WITHDRAWN: "withdrawn",
});

function isFinalStatus(status) {
  return status === APPLICATION_STATUS.ACCEPTED
    || status === APPLICATION_STATUS.REJECTED
    || status === APPLICATION_STATUS.WITHDRAWN;
}

/**
 * Create a new application for a listing.
 * Throws if required fields are missing or an active application already exists.
 *
 * @param {{
 *   listingId: string,
 *   consultantId: string,
 *   lengthOfStayMonths: number,
 *   moveInDate: string,
 *   occupants: number,
 *   employmentStatus: string,
 *   monthlyIncome: number,
 *   notes?: string
 * }} data
 * @returns {object}
 */
export function applyForListing({
  listingId,
  consultantId,
  lengthOfStayMonths,
  moveInDate,
  occupants,
  employmentStatus,
  monthlyIncome,
  notes = "",
}) {
  if (!listingId) throw new Error("listingId is required to apply.");
  if (!consultantId) throw new Error("consultantId is required to apply.");
  if (!lengthOfStayMonths || lengthOfStayMonths < 1) {
    throw new Error("Length of stay must be at least 1 month.");
  }
  if (!moveInDate) throw new Error("Move-in date is required.");
  if (!occupants || occupants < 1) throw new Error("At least 1 occupant is required.");
  if (!employmentStatus?.trim()) throw new Error("Employment status is required.");
  const normalizedIncome = Number(monthlyIncome);
  if (Number.isNaN(normalizedIncome) || normalizedIncome < 0) {
    throw new Error("Monthly income must be 0 or higher.");
  }

  const listing = db.getById("listings", listingId);
  if (!listing) throw new Error("Listing not found.");
  if (!listing.available) throw new Error("This listing is not currently available.");

  const hasAcceptedApplication = db.findOne(
    "applications",
    (a) => a.consultantId === consultantId && a.status === APPLICATION_STATUS.ACCEPTED
  );
  if (hasAcceptedApplication) {
    throw new Error("You already have an accepted application and cannot apply to additional properties.");
  }

  const existing = db.findOne(
    "applications",
    (a) =>
      a.listingId === listingId
      && a.consultantId === consultantId
      && !isFinalStatus(a.status)
  );

  if (existing) {
    throw new Error("You already have an active application for this property.");
  }

  return db.insert("applications", {
    listingId,
    consultantId,
    hostId: listing.hostId,
    details: {
      lengthOfStayMonths: Number(lengthOfStayMonths),
      moveInDate,
      occupants: Number(occupants),
      employmentStatus: employmentStatus.trim(),
      monthlyIncome: normalizedIncome,
      notes: notes.trim(),
    },
    status: APPLICATION_STATUS.SUBMITTED,
    updatedAt: new Date().toISOString(),
  });
}

/**
 * Return all applications submitted by a consultant.
 *
 * @param {string} consultantId
 * @returns {Array}
 */
export function getApplicationsByConsultant(consultantId) {
  if (!consultantId) return [];
  return db
    .find("applications", (a) => a.consultantId === consultantId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

/**
 * Return all applications for listings owned by a host.
 *
 * @param {string} hostId
 * @returns {Array}
 */
export function getApplicationsByHost(hostId) {
  if (!hostId) return [];
  return db
    .find("applications", (a) => a.hostId === hostId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

/**
 * Withdraw an application (consultant).
 * Only allowed while status is "submitted".
 *
 * @param {{ applicationId: string, consultantId: string }} data
 * @returns {object}
 */
export function withdrawApplication({ applicationId, consultantId }) {
  if (!applicationId) throw new Error("applicationId is required.");
  if (!consultantId) throw new Error("consultantId is required.");

  const app = db.getById("applications", applicationId);
  if (!app) throw new Error("Application not found.");
  if (app.consultantId !== consultantId) throw new Error("You do not own this application.");
  if (app.status !== APPLICATION_STATUS.SUBMITTED) {
    throw new Error("Only submitted applications can be withdrawn.");
  }

  return db.update("applications", applicationId, {
    status: APPLICATION_STATUS.WITHDRAWN,
    updatedAt: new Date().toISOString(),
  });
}

/**
 * Accept or reject an application (host).
 * Only allowed while status is "submitted".
 *
 * @param {{ applicationId: string, hostId: string, decision: "accepted"|"rejected" }} data
 * @returns {object}
 */
export function decideApplication({ applicationId, hostId, decision }) {
  if (!applicationId) throw new Error("applicationId is required.");
  if (!hostId) throw new Error("hostId is required.");
  if (decision !== APPLICATION_STATUS.ACCEPTED && decision !== APPLICATION_STATUS.REJECTED) {
    throw new Error("Decision must be 'accepted' or 'rejected'.");
  }

  const app = db.getById("applications", applicationId);
  if (!app) throw new Error("Application not found.");
  if (app.hostId !== hostId) throw new Error("You do not own this application.");
  if (app.status !== APPLICATION_STATUS.SUBMITTED) {
    throw new Error("Only submitted applications can be processed.");
  }

  if (decision === APPLICATION_STATUS.ACCEPTED) {
    const listing = db.getById("listings", app.listingId);
    if (!listing) throw new Error("Listing not found for this application.");

    if (listing.available === false) {
      throw new Error("This listing is no longer available.");
    }
  }

  const decidedApplication = db.update("applications", applicationId, {
    status: decision,
    updatedAt: new Date().toISOString(),
  });

  if (decision === APPLICATION_STATUS.ACCEPTED) {
    db.update("listings", app.listingId, { available: false });

    const competingSubmittedApplications = db.find(
      "applications",
      (candidate) =>
        candidate.listingId === app.listingId
        && candidate.id !== applicationId
        && candidate.status === APPLICATION_STATUS.SUBMITTED
    );

    competingSubmittedApplications.forEach((candidate) => {
      db.update("applications", candidate.id, {
        status: APPLICATION_STATUS.REJECTED,
        updatedAt: new Date().toISOString(),
      });
    });
  }

  return decidedApplication;
}


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
    reports:     [],
    status:      APPLICATION_STATUS.SUBMITTED,
    priceUnit:    "month",
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
  const approved = updateListing(id,  {status: APPLICATION_STATUS.ACCEPTED});
  return approved;
}

/**
 * Sets a listing's status to "rejected"
 * 
 * @param {string} id 
 * @returns the approved listing
 */
export function rejectListing(id) {
  const rejected = updateListing(id,  {status: APPLICATION_STATUS.REJECTED});
  return rejected;
}

/**
 * Reverts a listing's status to pending
 * 
 * @param {string} id 
 * @returns the pending listing
 */
export function revertListingToPending(id) {
  const pending = updateListing(id, {status: APPLICATION_STATUS.SUBMITTED});
  return pending;
}

/**
 * Add a report to a listing.
 * Throws if the listing does not exist or the reason is empty.
 *
 * @param {string} id        listing id
 * @param {string} userId    id of the reporting user
 * @param {string} reason    reason text from the user
 * @returns {object} the updated listing
 */
export function reportListing(id, userId, reason) {
  const trimmed = (reason ?? "").trim();
  if (!trimmed) throw new Error("A reason is required to report a listing.");

  const listing = getListing(id);
  const reports = [
    ...(listing.reports ?? []),
    { userId, reason: trimmed, createdAt: new Date().toISOString() },
  ];
  return updateListing(id, { reports });
}

/**
 * Remove all reports from a listing (admin dismisses the report as wrongful).
 *
 * @param {string} id  listing id
 * @returns {object} the updated listing
 */
export function dismissReports(id) {
  return updateListing(id, { reports: [] });
}

/**
 * Return all listings that currently have at least one report.
 *
 * @returns {Array}
 */
export function getReportedListings() {
  return db.find("listings", (l) => Array.isArray(l.reports) && l.reports.length > 0);
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

/**
 * Deactivate an account, preventing the user from logging in.
 * Throws if the account does not exist.
 *
 * @param {string} id
 * @returns {object} the updated account (password stripped)
 */
export function deactivateAccount(id) {
  const updated = db.update("accounts", id, { active: false });
  if (!updated) throw new Error(`Account "${id}" not found.`);
  return sanitizeAccount(updated);
}

/**
 * Reactivate a previously deactivated account.
 * Throws if the account does not exist.
 *
 * @param {string} id
 * @returns {object} the updated account (password stripped)
 */
export function activateAccount(id) {
  const updated = db.update("accounts", id, { active: true });
  if (!updated) throw new Error(`Account "${id}" not found.`);
  return sanitizeAccount(updated);
}
