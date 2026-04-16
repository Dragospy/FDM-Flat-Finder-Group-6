/**
 * usageLog.js — Lightweight event log used to power the admin System Usage Report.
 *
 * Events are stored in the `usageLogs` collection in the local DB. Each entry:
 *   { id, createdAt, type, userId?, userRole?, meta? }
 */

import { db } from "./db";

export const USAGE_EVENTS = Object.freeze({
  LOGIN:               "login",
  LOGIN_FAILED:        "login_failed",
  LOGOUT:              "logout",
  REGISTER:            "register",
  LISTING_CREATED:     "listing_created",
  LISTING_DELETED:     "listing_deleted",
  LISTING_APPROVED:    "listing_approved",
  LISTING_REJECTED:    "listing_rejected",
  APPLICATION_SUBMITTED: "application_submitted",
  ACCOUNT_DEACTIVATED: "account_deactivated",
  ACCOUNT_ACTIVATED:   "account_activated",
});

/**
 * Record a usage event. Never throws — logging must never break the caller.
 *
 * @param {string} type   one of USAGE_EVENTS
 * @param {{ userId?: string, userRole?: string, meta?: object }} [ctx]
 */
export function logEvent(type, ctx = {}) {
  try {
    db.insert("usageLogs", {
      type,
      userId:   ctx.userId   ?? null,
      userRole: ctx.userRole ?? null,
      meta:     ctx.meta     ?? null,
    });
  } catch {
    // swallow — logging must be best-effort
  }
}

export function getUsageLogs() {
  return db.getAll("usageLogs");
}
