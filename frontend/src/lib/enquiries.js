/**
 * enquiries.js — Helpers for the rentee ↔ host messaging feature.
 *
 * An enquiry is a thread tied to a specific listing between one rentee and the
 * listing's host. Messages live inline on the thread document.
 *
 * Shape:
 *   {
 *     id, listingId, hostId, renteeId, createdAt,
 *     messages: [{ senderId, text, createdAt, read }]
 *   }
 */

import { db } from "./db";

/** Find an existing thread for (listing, rentee) or null. */
export function findThread(listingId, renteeId) {
  return db.findOne(
    "enquiries",
    (t) => t.listingId === listingId && t.renteeId === renteeId
  );
}

/**
 * Start a new thread on a listing, or append to an existing one if the rentee
 * has already enquired about it. Returns the thread.
 */
export function createEnquiry(listingId, renteeId, text) {
  const trimmed = text.trim();
  if (!trimmed) throw new Error("Message cannot be empty.");

  const listing = db.getById("listings", listingId);
  if (!listing) throw new Error("Listing not found.");

  const existing = findThread(listingId, renteeId);
  if (existing) {
    return appendMessage(existing.id, renteeId, trimmed);
  }

  return db.insert("enquiries", {
    listingId,
    hostId:   listing.hostId,
    renteeId,
    messages: [{ senderId: renteeId, text: trimmed, createdAt: new Date().toISOString(), read: false }],
  });
}

/** Append a message to an existing thread. Returns the updated thread. */
export function appendMessage(threadId, senderId, text) {
  const trimmed = text.trim();
  if (!trimmed) throw new Error("Message cannot be empty.");

  const thread = db.getById("enquiries", threadId);
  if (!thread) throw new Error("Enquiry thread not found.");

  const messages = [
    ...thread.messages,
    { senderId, text: trimmed, createdAt: new Date().toISOString(), read: false },
  ];
  return db.update("enquiries", threadId, { messages });
}

/** All threads where the given user is a participant (host or rentee). */
export function getThreadsForUser(userId) {
  return db
    .find("enquiries", (t) => t.hostId === userId || t.renteeId === userId)
    .sort((a, b) => lastMessageTime(b) - lastMessageTime(a));
}

/** Mark every message in the thread sent by *someone other than* `viewerId` as read. */
export function markThreadRead(threadId, viewerId) {
  const thread = db.getById("enquiries", threadId);
  if (!thread) return null;

  const messages = thread.messages.map((m) =>
    m.senderId === viewerId || m.read ? m : { ...m, read: true }
  );
  return db.update("enquiries", threadId, { messages });
}

/** Count of threads that have at least one unread message addressed to `userId`. */
export function unreadCountForUser(userId) {
  return getThreadsForUser(userId).filter((t) => threadHasUnreadFor(t, userId)).length;
}

export function threadHasUnreadFor(thread, userId) {
  return thread.messages.some((m) => m.senderId !== userId && !m.read);
}

function lastMessageTime(thread) {
  const last = thread.messages[thread.messages.length - 1];
  return last ? new Date(last.createdAt).getTime() : 0;
}
