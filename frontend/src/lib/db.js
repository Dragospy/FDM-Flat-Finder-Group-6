/**
 * db.js — Fake in-browser database backed by localStorage.
 *
 * On first load the two collections are seeded from the JSON files in
 * src/data/. All subsequent reads and writes use localStorage so changes
 * persist across page refreshes during development.
 *
 * Available collections: "accounts" | "listings" | "applications"
 */

import initialAccounts from "../data/accounts.json";
import initialListings  from "../data/listings.json";
import initialApplications from "../data/applications.json";


// ─── Storage keys ─────────────────────────────────────────────────────────────

const KEYS = {
  accounts: "fdm_db_accounts",
  listings: "fdm_db_listings",
  applications: "fdm_db_applications",
};


// ─── Seeding ──────────────────────────────────────────────────────────────────

/**
 * Populate localStorage from the JSON seed files on first visit.
 * Skips any collection that already has data so existing records are
 * never overwritten by a page refresh.
 */
function seed() {
  if (!localStorage.getItem(KEYS.accounts)) {
    localStorage.setItem(KEYS.accounts, JSON.stringify(initialAccounts));
  }

  if (!localStorage.getItem(KEYS.listings)) {
    localStorage.setItem(KEYS.listings, JSON.stringify(initialListings));
  }

  if (!localStorage.getItem(KEYS.applications)) {
    localStorage.setItem(KEYS.applications, JSON.stringify(initialApplications));
  }
}

seed();


// ─── Read helpers ─────────────────────────────────────────────────────────────

/**
 * Return every document in a collection.
 *
 * @param {"accounts"|"listings"|"applications"} collection
 * @returns {Array}
 */
function getAll(collection) {
  const raw = localStorage.getItem(KEYS[collection]);
  return raw ? JSON.parse(raw) : [];
}

/**
 * Return a single document by id, or null if not found.
 *
 * @param {"accounts"|"listings"|"applications"} collection
 * @param {string} id
 * @returns {object|null}
 */
function getById(collection, id) {
  return getAll(collection).find((doc) => doc.id === id) ?? null;
}

/**
 * Return all documents that satisfy a predicate function.
 *
 * @param {"accounts"|"listings"|"applications"} collection
 * @param {(doc: object) => boolean} predicate
 * @returns {Array}
 */
function find(collection, predicate) {
  return getAll(collection).filter(predicate);
}

/**
 * Return the first document that satisfies a predicate function,
 * or null if none match.
 *
 * @param {"accounts"|"listings"|"applications"} collection
 * @param {(doc: object) => boolean} predicate
 * @returns {object|null}
 */
function findOne(collection, predicate) {
  return getAll(collection).find(predicate) ?? null;
}


// ─── Write helpers ────────────────────────────────────────────────────────────

/**
 * Insert a new document into a collection.
 * A random UUID is generated for `id` and a `createdAt` timestamp is added
 * automatically — both are overridden if the caller supplies them in `doc`.
 *
 * @param {"accounts"|"listings"} collection
 * @param {object} doc
 * @returns {object} the inserted document
 */
function insert(collection, doc) {
  const docs   = getAll(collection);
  const newDoc = {
    id:        crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    ...doc,
  };

  docs.push(newDoc);
  localStorage.setItem(KEYS[collection], JSON.stringify(docs));
  return newDoc;
}

/**
 * Merge `data` into an existing document, identified by `id`.
 *
 * @param {"accounts"|"listings"|"applications"} collection
 * @param {string} id
 * @param {object} data  partial fields to merge
 * @returns {object|null} the updated document, or null if not found
 */
function update(collection, id, data) {
  const docs  = getAll(collection);
  const index = docs.findIndex((doc) => doc.id === id);

  if (index === -1) return null;

  docs[index] = { ...docs[index], ...data, id };
  localStorage.setItem(KEYS[collection], JSON.stringify(docs));
  return docs[index];
}

/**
 * Remove a document from a collection by id.
 *
 * @param {"accounts"|"listings"|"applications"} collection
 * @param {string} id
 * @returns {boolean} true if a document was removed, false if not found
 */
function remove(collection, id) {
  const docs     = getAll(collection);
  const filtered = docs.filter((doc) => doc.id !== id);

  if (filtered.length === docs.length) return false;

  localStorage.setItem(KEYS[collection], JSON.stringify(filtered));
  return true;
}


// ─── Dev utilities ────────────────────────────────────────────────────────────

/**
 * Wipe all collections from localStorage and re-seed from the JSON files.
 * Useful during development to reset the app to its initial state.
 */
function reset() {
  localStorage.removeItem(KEYS.accounts);
  localStorage.removeItem(KEYS.listings);
  localStorage.removeItem(KEYS.applications);
  seed();
}


// ─── Exports ──────────────────────────────────────────────────────────────────

export const db = { getAll, getById, find, findOne, insert, update, remove, reset };
