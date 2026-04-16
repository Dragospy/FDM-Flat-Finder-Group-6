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
import { logEvent, USAGE_EVENTS } from "./usageLog";

// ─── Applications ──────────────────────────────────────────────────────────────

export const APPLICATION_STATUS = Object.freeze({
  SUBMITTED: "submitted",
  ACCEPTED: "accepted",
  REJECTED: "rejected",
  WITHDRAWN: "withdrawn",
});

export const ACCEPTED_APPLICATION_STEPS = Object.freeze([
  { id: "offer_sent", label: "Offer sent" },
  { id: "docs_submitted", label: "Documents submitted" },
  { id: "contract_signed", label: "Contract signed" },
  { id: "booked", label: "Booked" },
]);

function normalizeAcceptedStep(stepId) {
  if (ACCEPTED_APPLICATION_STEPS.some((step) => step.id === stepId)) {
    return stepId;
  }
  return ACCEPTED_APPLICATION_STEPS[0].id;
}

function getNextAcceptedStep(stepId) {
  const safeStep = normalizeAcceptedStep(stepId);
  const currentIndex = ACCEPTED_APPLICATION_STEPS.findIndex((step) => step.id === safeStep);
  if (currentIndex < 0 || currentIndex >= ACCEPTED_APPLICATION_STEPS.length - 1) {
    return safeStep;
  }
  return ACCEPTED_APPLICATION_STEPS[currentIndex + 1].id;
}

function initialAcceptedProgress() {
  return {
    step: ACCEPTED_APPLICATION_STEPS[0].id,
    updatedAt: new Date().toISOString(),
  };
}

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

  const created = db.insert("applications", {
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
  logEvent(USAGE_EVENTS.APPLICATION_SUBMITTED, {
    userId: consultantId,
    userRole: "rentee",
    meta: { applicationId: created.id, listingId },
  });
  return created;
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
 * Return confirmed bookings for a consultant.
 * A booking is an accepted application that reached the "booked" step.
 *
 * @param {string} consultantId
 * @returns {Array}
 */
export function getBookingsByConsultant(consultantId) {
  if (!consultantId) return [];
  return db
    .find(
      "applications",
      (a) =>
        a.consultantId === consultantId
        && a.status === APPLICATION_STATUS.ACCEPTED
        && normalizeAcceptedStep(a.postAcceptanceProgress?.step) === "booked"
    )
    .sort((a, b) => new Date(b.updatedAt ?? b.createdAt) - new Date(a.updatedAt ?? a.createdAt));
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

  const updatePayload = {
    status: decision,
    updatedAt: new Date().toISOString(),
  };
  if (decision === APPLICATION_STATUS.ACCEPTED) {
    updatePayload.postAcceptanceProgress = initialAcceptedProgress();
  }

  const decidedApplication = db.update("applications", applicationId, updatePayload);

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

    const otherSubmittedByConsultant = db.find(
      "applications",
      (candidate) =>
        candidate.consultantId === app.consultantId
        && candidate.id !== applicationId
        && candidate.status === APPLICATION_STATUS.SUBMITTED
    );

    otherSubmittedByConsultant.forEach((candidate) => {
      db.update("applications", candidate.id, {
        status: APPLICATION_STATUS.WITHDRAWN,
        autoWithdrawnReason: "Another application was accepted.",
        updatedAt: new Date().toISOString(),
      });
    });
  }

  return decidedApplication;
}

/**
 * Advance an accepted application through the post-acceptance process.
 *
 * @param {{ applicationId: string, hostId: string }} data
 * @returns {object}
 */
export function advanceAcceptedApplicationStep({ applicationId, hostId }) {
  if (!applicationId) throw new Error("applicationId is required.");
  if (!hostId) throw new Error("hostId is required.");

  const app = db.getById("applications", applicationId);
  if (!app) throw new Error("Application not found.");
  if (app.hostId !== hostId) throw new Error("You do not own this application.");
  if (app.status !== APPLICATION_STATUS.ACCEPTED) {
    throw new Error("Only accepted applications can be advanced.");
  }

  const currentStep = normalizeAcceptedStep(app.postAcceptanceProgress?.step);
  const nextStep = getNextAcceptedStep(currentStep);
  if (nextStep === currentStep) {
    throw new Error("This application is already fully booked.");
  }

  return db.update("applications", applicationId, {
    postAcceptanceProgress: {
      step: nextStep,
      updatedAt: new Date().toISOString(),
    },
    updatedAt: new Date().toISOString(),
  });
}

/**
 * Revert an accepted application back to submitted (host).
 * This also re-opens the listing for applications.
 *
 * @param {{ applicationId: string, hostId: string }} data
 * @returns {object}
 */
export function unacceptApplication({ applicationId, hostId }) {
  if (!applicationId) throw new Error("applicationId is required.");
  if (!hostId) throw new Error("hostId is required.");

  const app = db.getById("applications", applicationId);
  if (!app) throw new Error("Application not found.");
  if (app.hostId !== hostId) throw new Error("You do not own this application.");
  if (app.status !== APPLICATION_STATUS.ACCEPTED) {
    throw new Error("Only accepted applications can be unaccepted.");
  }

  const listing = db.getById("listings", app.listingId);
  if (!listing) throw new Error("Listing not found for this application.");

  db.update("listings", app.listingId, { available: true });

  return db.update("applications", applicationId, {
    status: APPLICATION_STATUS.SUBMITTED,
    postAcceptanceProgress: null,
    updatedAt: new Date().toISOString(),
  });
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
  const { password, securityAnswer, ...safe } = account;
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
 *   available?: boolean,
 *   type?: string,
 *   maxGuests?: number,
 * }} filters
 * @returns {Array}
 */
export function getListings(filters = {}) {
  let listings = db.getAll("listings");

  if (filters.city !== undefined) {
    const city = filters.city.toLowerCase();
    listings = listings.filter((l) => l.location.city.toLowerCase().includes(city));
  }

  if (filters.type !== undefined) {
    const type = filters.type.toLowerCase();
    listings = listings.filter((l) => l.type.toLowerCase() == type);
  }  

  // Price filter
  if (filters.minPrice !== undefined) {
    listings = listings.filter((l) => l.price >= filters.minPrice);
  }

  if (filters.maxPrice !== undefined) {
    listings = listings.filter((l) => l.price <= filters.maxPrice);
  }

  // Guest filter
  if (filters.maxGuests !== undefined) {
    listings = listings.filter((l) => l.maxGuests == filters.maxGuests);
  }  


  if (filters.bedrooms !== undefined) {
    listings = listings.filter((l) => l.bedrooms === filters.bedrooms);
  }

  if (filters.available !== undefined) {
    listings = listings.filter((l) => l.available === filters.available);
  }

  if (filters.status !== undefined) {
    listings = listings.filter((l) => l.status === filters.status);
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

  const created = db.insert("listings", {
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
  logEvent(USAGE_EVENTS.LISTING_CREATED, {
    userId: data.hostId,
    userRole: "host",
    meta: { listingId: created.id, title: created.title },
  });
  return created;
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
  logEvent(USAGE_EVENTS.LISTING_DELETED, { meta: { listingId: id } });
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
  logEvent(USAGE_EVENTS.LISTING_APPROVED, { userRole: "admin", meta: { listingId: id } });
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
  logEvent(USAGE_EVENTS.LISTING_REJECTED, { userRole: "admin", meta: { listingId: id } });
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
  const existing = listing.reports ?? [];
  if (existing.some((r) => r.userId === userId)) {
    throw new Error("You have already reported this listing.");
  }
  const reports = [
    ...existing,
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

  if (safeData.securityQuestion !== undefined) {
    safeData.securityQuestion = safeData.securityQuestion.trim();
  }

  if (safeData.securityAnswer !== undefined) {
    const answer = safeData.securityAnswer.trim();
    if (answer.length === 0) {
      throw new Error("Security answer cannot be empty.");
    }
    safeData.securityAnswer = answer;
  }

  if (
    safeData.securityQuestion !== undefined
    && safeData.securityQuestion.length > 0
    && safeData.securityAnswer === undefined
  ) {
    throw new Error("Please provide an answer for your security question.");
  }

  if (safeData.preferredLocation !== undefined) {
    safeData.preferredLocation = String(safeData.preferredLocation).trim();
  }

  if (safeData.preferredCity !== undefined) {
    safeData.preferredCity = String(safeData.preferredCity).trim();
  }

  if (safeData.preferredType !== undefined) {
    const preferredType = String(safeData.preferredType).trim().toLowerCase();
    const validTypes = ["", "studio", "apartment", "house"];
    if (!validTypes.includes(preferredType)) {
      throw new Error("Type must be studio, apartment, house, or empty.");
    }
    safeData.preferredType = preferredType;
  }

  if (safeData.defaultListingCity !== undefined) {
    safeData.defaultListingCity = String(safeData.defaultListingCity).trim();
  }

  if (safeData.defaultListingCountry !== undefined) {
    safeData.defaultListingCountry = String(safeData.defaultListingCountry).trim();
  }

  if (safeData.defaultListingPriceUnit !== undefined) {
    const defaultListingPriceUnit = String(safeData.defaultListingPriceUnit).trim().toLowerCase();
    const validPriceUnits = ["month", "week", "night"];
    if (!validPriceUnits.includes(defaultListingPriceUnit)) {
      throw new Error("Default listing price unit must be month, week, or night.");
    }
    safeData.defaultListingPriceUnit = defaultListingPriceUnit;
  }

  if (safeData.relevantDetailsForHost !== undefined) {
    safeData.relevantDetailsForHost = String(safeData.relevantDetailsForHost).trim();
  }

  if (safeData.hostRelevantDetails !== undefined) {
    safeData.hostRelevantDetails = String(safeData.hostRelevantDetails).trim();
  }

  if (safeData.preferredMoveInDate !== undefined) {
    safeData.preferredMoveInDate = String(safeData.preferredMoveInDate).trim();
  }

  if (safeData.preferredAmenities !== undefined) {
    if (!Array.isArray(safeData.preferredAmenities)) {
      throw new Error("Preferred amenities must be a list.");
    }
    safeData.preferredAmenities = safeData.preferredAmenities
      .map((item) => String(item).trim())
      .filter(Boolean);
  }

  if (safeData.budgetMin !== undefined && safeData.budgetMin !== "") {
    const budgetMin = Number(safeData.budgetMin);
    if (Number.isNaN(budgetMin) || budgetMin < 0) {
      throw new Error("Minimum price must be a positive number.");
    }
    safeData.budgetMin = budgetMin;
  }

  if (safeData.budgetMax !== undefined && safeData.budgetMax !== "") {
    const budgetMax = Number(safeData.budgetMax);
    if (Number.isNaN(budgetMax) || budgetMax < 0) {
      throw new Error("Maximum price must be a positive number.");
    }
    safeData.budgetMax = budgetMax;
  }

  if (
    safeData.budgetMin !== undefined
    && safeData.budgetMin !== ""
    && safeData.budgetMax !== undefined
    && safeData.budgetMax !== ""
    && safeData.budgetMin > safeData.budgetMax
  ) {
    throw new Error("Minimum price cannot be greater than maximum price.");
  }

  if (safeData.preferredStayLengthMonths !== undefined && safeData.preferredStayLengthMonths !== "") {
    const stayLength = Number(safeData.preferredStayLengthMonths);
    if (Number.isNaN(stayLength) || stayLength < 1) {
      throw new Error("Preferred stay length must be at least 1 month.");
    }
    safeData.preferredStayLengthMonths = stayLength;
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
 * Look up reset details by matching full name + email + phone number.
 *
 * @param {{ fullName: string, email: string, phone: string }} data
 * @returns {{ securityQuestion: string, name: string }}
 */
export function getSecurityQuestionByEmailAndPhone({ fullName, email, phone }) {
  const normalizedName = (fullName ?? "").trim().toLowerCase();
  const normalizedEmail = (email ?? "").trim().toLowerCase();
  const normalizedPhone = (phone ?? "").trim();

  if (!normalizedName || !normalizedEmail || !normalizedPhone) {
    throw new Error("Full name, email and phone number are required.");
  }

  const matches = db.find(
    "accounts",
    (a) =>
      a.name?.trim().toLowerCase() === normalizedName
      && a.email?.trim().toLowerCase() === normalizedEmail
      && (a.phone ?? "").trim() === normalizedPhone
  );

  if (matches.length === 0) {
    throw new Error("No account matched that name, email and phone number.");
  }

  if (matches.length > 1) {
    throw new Error("Multiple accounts matched. Contact support.");
  }

  const account = matches[0];
  if (!account.securityQuestion || !account.securityAnswer) {
    throw new Error("No security question is set for this account. Please update your profile first.");
  }

  return {
    securityQuestion: account.securityQuestion,
    name: account.name,
  };
}

/**
 * Verify security answer for a reset flow using full name + email + phone.
 *
 * @param {{ fullName: string, email: string, phone: string, securityAnswer: string }} data
 * @returns {true}
 */
export function verifyResetSecurityAnswer({ fullName, email, phone, securityAnswer }) {
  const normalizedName = (fullName ?? "").trim().toLowerCase();
  const normalizedEmail = (email ?? "").trim().toLowerCase();
  const normalizedPhone = (phone ?? "").trim();
  const normalizedAnswer = (securityAnswer ?? "").trim().toLowerCase();

  if (!normalizedAnswer) {
    throw new Error("Security answer is required.");
  }

  const account = db.findOne(
    "accounts",
    (a) =>
      a.name?.trim().toLowerCase() === normalizedName
      && a.email?.trim().toLowerCase() === normalizedEmail
      && (a.phone ?? "").trim() === normalizedPhone
  );

  if (!account) {
    throw new Error("Unable to verify account details.");
  }

  const savedAnswer = (account.securityAnswer ?? "").trim().toLowerCase();
  if (savedAnswer !== normalizedAnswer) {
    throw new Error("Security answer did not match.");
  }

  return true;
}

/**
 * Reset a password by matching full name + email + phone + security answer.
 *
 * @param {{
 *   fullName: string,
 *   email: string,
 *   phone: string,
 *   securityAnswer: string,
 *   newPassword: string
 * }} data
 * @returns {true}
 */
export function resetPasswordByEmailAndPhone({
  fullName,
  email,
  phone,
  securityAnswer,
  newPassword,
}) {
  verifyResetSecurityAnswer({ fullName, email, phone, securityAnswer });

  if (!newPassword || newPassword.length < 6) {
    throw new Error("New password must be at least 6 characters.");
  }

  const normalizedName = (fullName ?? "").trim().toLowerCase();
  const normalizedEmail = (email ?? "").trim().toLowerCase();
  const normalizedPhone = (phone ?? "").trim();

  const account = db.findOne(
    "accounts",
    (a) =>
      a.name?.trim().toLowerCase() === normalizedName
      && a.email?.trim().toLowerCase() === normalizedEmail
      && (a.phone ?? "").trim() === normalizedPhone
  );

  if (!account) {
    throw new Error("Unable to verify account details.");
  }

  db.update("accounts", account.id, { password: newPassword });
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
  logEvent(USAGE_EVENTS.ACCOUNT_DEACTIVATED, { userRole: "admin", meta: { targetAccountId: id } });
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
  logEvent(USAGE_EVENTS.ACCOUNT_ACTIVATED, { userRole: "admin", meta: { targetAccountId: id } });
  return sanitizeAccount(updated);
}
