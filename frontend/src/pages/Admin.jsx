/**
 * Admin.jsx — Admin-only management panel.
 */

import { approveListing, getListing, getListings, rejectListing } from "../lib/api";
import "../stylesheets/Admin.css";
import { db } from "../lib/db";

export default function Admin() {
  // db.reset();
  // console.log(getListings());
  return (
    <main>
      <h1>Admin Panel</h1>
    </main>
  );
}
