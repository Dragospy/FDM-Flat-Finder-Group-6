/**
 * Dashboard.jsx — Authenticated landing page (any role).
 */

import "../stylesheets/Dashboard.css";

import {SearchListings} from  "../components/SearchListing.jsx";

export default function Dashboard() {
  return (
    <main>
      <h1>Dashboard</h1>
      <SearchListings/>
    </main>
  );
}
