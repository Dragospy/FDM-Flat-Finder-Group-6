import {
  ACCEPTED_APPLICATION_STEPS,
  getAccount,
  getApplicationsByConsultant,
  getApplicationsByHost,
  getBookingsByConsultant,
  getListing,
  getListings,
  getListingsByHost,
} from "./api";
import { ROLES } from "./auth";
import { getThreadsForUser } from "./enquiries";

export const SECURITY_QUESTIONS = [
  "What is your mother's maiden name?",
  "What was the name of your first pet?",
  "What was the name of your first school?",
  "What city were you born in?",
  "What is your favorite childhood nickname?",
];

export function formatDateTime(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return "—";
  }
}

export function formatDateOnly(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString();
  } catch {
    return "—";
  }
}

export function accountDisplayName(userId) {
  if (!userId) return "—";
  try {
    const a = getAccount(userId);
    const name = a.name?.trim() || "User";
    const email = a.email?.trim();
    return email ? `${name} · ${email}` : name;
  } catch {
    return userId;
  }
}

export function acceptedStepLabel(stepId) {
  if (!stepId) return "—";
  const step = ACCEPTED_APPLICATION_STEPS.find((s) => s.id === stepId);
  return step?.label ?? stepId;
}

export function safeListing(listingId) {
  try {
    return getListing(listingId);
  } catch {
    return null;
  }
}

export function listingTitleForId(listingId) {
  const l = safeListing(listingId);
  return l?.title ?? listingId;
}

export function humanApplicationStatus(status) {
  if (!status) return "—";
  return status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function getStoredSectionState(userId) {
  try {
    const key = `profile_sections_${userId ?? "anon"}`;
    const raw = sessionStorage.getItem(key);
    if (!raw) return { account: false, profile: false, requestInfo: false };
    const parsed = JSON.parse(raw);
    return {
      account: Boolean(parsed?.account),
      profile: Boolean(parsed?.profile),
      requestInfo: Boolean(parsed?.requestInfo),
    };
  } catch {
    return { account: false, profile: false, requestInfo: false };
  }
}

function matchDateTimeLocalParts(valueStr) {
  const s = String(valueStr ?? "").trim();
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?/.exec(s);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  const h = Number(m[4]);
  const mi = Number(m[5]);
  const sec = m[6] != null ? Number(m[6]) : null;
  if ([y, mo, d, h, mi, sec].some((n) => n != null && Number.isNaN(n))) return null;
  return { y, mo, d, h, mi, sec };
}

function parseRequestInfoRangeStartMs(valueStr) {
  const p = matchDateTimeLocalParts(valueStr);
  if (!p) return null;
  const t = new Date(p.y, p.mo - 1, p.d, p.h, p.mi, 0, 0).getTime();
  return Number.isNaN(t) ? null : t;
}

function parseRequestInfoRangeEndMs(valueStr) {
  const p = matchDateTimeLocalParts(valueStr);
  if (!p) return null;
  let t;
  if (p.sec == null) {
    t = new Date(p.y, p.mo - 1, p.d, p.h, p.mi, 59, 999).getTime();
  } else {
    t = new Date(p.y, p.mo - 1, p.d, p.h, p.mi, p.sec, 999).getTime();
  }
  return Number.isNaN(t) ? null : t;
}

function formatRequestInfoRangeInputForLabel(valueStr, endBound) {
  if (!valueStr?.trim()) return "";
  const ms = endBound ? parseRequestInfoRangeEndMs(valueStr) : parseRequestInfoRangeStartMs(valueStr);
  if (ms == null) return String(valueStr).trim();
  return new Date(ms).toLocaleString();
}

function resolveRequestInfoDateBounds(dateFromStr, dateToStr) {
  const fromTrim = (dateFromStr ?? "").trim();
  const toTrim = (dateToStr ?? "").trim();
  if (!fromTrim && !toTrim) {
    return { active: false, startMs: null, endMs: null, label: "All dates" };
  }
  const startMs = fromTrim ? parseRequestInfoRangeStartMs(fromTrim) : null;
  const endMs = toTrim ? parseRequestInfoRangeEndMs(toTrim) : null;
  if (fromTrim && startMs == null) throw new Error("Invalid start date and time.");
  if (toTrim && endMs == null) throw new Error("Invalid end date and time.");
  if (startMs != null && endMs != null && startMs > endMs) {
    throw new Error("Start must be on or before the end (same minute is allowed).");
  }
  let label = "All dates";
  if (fromTrim && toTrim) {
    label = `${formatRequestInfoRangeInputForLabel(fromTrim, false)} → ${formatRequestInfoRangeInputForLabel(toTrim, true)} (local; end includes whole minute)`;
  } else if (fromTrim) {
    label = `From ${formatRequestInfoRangeInputForLabel(fromTrim, false)} (local)`;
  } else if (toTrim) {
    label = `Up to ${formatRequestInfoRangeInputForLabel(toTrim, true)} (local; end includes whole minute)`;
  }
  return { active: true, startMs, endMs, label };
}

function timestampInRequestInfoBounds(iso, bounds) {
  if (!bounds.active) return true;
  if (!iso) return false;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return false;
  if (bounds.startMs != null && t < bounds.startMs) return false;
  if (bounds.endMs != null && t > bounds.endMs) return false;
  return true;
}

function applicationMatchesRequestInfoBounds(app, bounds) {
  if (!bounds.active) return true;
  return (
    timestampInRequestInfoBounds(app.createdAt, bounds)
    || timestampInRequestInfoBounds(app.updatedAt, bounds)
    || timestampInRequestInfoBounds(app.postAcceptanceProgress?.updatedAt, bounds)
  );
}

function listingMatchesRequestInfoBounds(listing, bounds) {
  if (!bounds.active) return true;
  return timestampInRequestInfoBounds(listing.createdAt, bounds);
}

function enquiryThreadMatchesRequestInfoBounds(thread, bounds) {
  if (!bounds.active) return true;
  if (timestampInRequestInfoBounds(thread.createdAt, bounds)) return true;
  return (thread.messages ?? []).some((m) => timestampInRequestInfoBounds(m.createdAt, bounds));
}

function cloneEnquiryThreadsForSnapshot(rawThreads, bounds) {
  if (!bounds.active) {
    return rawThreads.map((t) => ({ ...t, messages: [...(t.messages ?? [])] }));
  }
  return rawThreads
    .filter((t) => enquiryThreadMatchesRequestInfoBounds(t, bounds))
    .map((t) => ({
      ...t,
      messages: (t.messages ?? []).filter((m) => timestampInRequestInfoBounds(m.createdAt, bounds)),
    }));
}

function buildMessagesSentForSnapshot(rawThreads, userId, bounds) {
  const flat = rawThreads.flatMap((thread) =>
    (thread.messages ?? [])
      .filter((message) => message.senderId === userId)
      .map((message) => ({
        ...message,
        threadId: thread.id,
        listingId: thread.listingId,
      }))
  );
  if (!bounds.active) return flat;
  return flat.filter((m) => timestampInRequestInfoBounds(m.createdAt, bounds));
}

/**
 * @param {{ userId: string, role: string, dateFromStr: string, dateToStr: string }} params
 */
export function buildRequestInfoSnapshot({ userId, role, dateFromStr, dateToStr }) {
  const bounds = resolveRequestInfoDateBounds(dateFromStr, dateToStr);

  const allListings = getListings();
  const rawThreads = getThreadsForUser(userId);

  const ownedListingsRaw = role === ROLES.HOST ? getListingsByHost(userId) : [];
  const ownedListings = bounds.active
    ? ownedListingsRaw.filter((l) => listingMatchesRequestInfoBounds(l, bounds))
    : ownedListingsRaw;

  const applicationsAsRenteeRaw = role === ROLES.RENTEE ? getApplicationsByConsultant(userId) : [];
  const applicationsAsRentee = bounds.active
    ? applicationsAsRenteeRaw.filter((a) => applicationMatchesRequestInfoBounds(a, bounds))
    : applicationsAsRenteeRaw;

  const bookingsAsRenteeRaw = role === ROLES.RENTEE ? getBookingsByConsultant(userId) : [];
  const bookingsAsRentee = bounds.active
    ? bookingsAsRenteeRaw.filter((a) => applicationMatchesRequestInfoBounds(a, bounds))
    : bookingsAsRenteeRaw;

  const applicationsAsHostRaw = role === ROLES.HOST ? getApplicationsByHost(userId) : [];
  const applicationsAsHost = bounds.active
    ? applicationsAsHostRaw.filter((a) => applicationMatchesRequestInfoBounds(a, bounds))
    : applicationsAsHostRaw;

  const enquiryThreads = cloneEnquiryThreadsForSnapshot(rawThreads, bounds);
  const messagesSent = buildMessagesSentForSnapshot(rawThreads, userId, bounds);

  const reportsFiled = allListings
    .filter((listing) => Array.isArray(listing.reports))
    .flatMap((listing) =>
      listing.reports
        .filter((report) => report.userId === userId)
        .map((report) => ({
          listingId: listing.id,
          listingTitle: listing.title,
          reason: report.reason,
          createdAt: report.createdAt,
        }))
    )
    .filter((row) => timestampInRequestInfoBounds(row.createdAt, bounds));

  return {
    generatedAt: new Date().toISOString(),
    dateRange: {
      active: bounds.active,
      from: (dateFromStr ?? "").trim(),
      to: (dateToStr ?? "").trim(),
      label: bounds.label,
    },
    ownedListings,
    applicationsAsRentee,
    bookingsAsRentee,
    applicationsAsHost,
    enquiryThreads,
    messagesSent,
    reportsFiled,
  };
}
