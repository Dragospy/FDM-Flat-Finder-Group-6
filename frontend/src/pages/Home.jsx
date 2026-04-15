/**
 * Home.jsx — Public landing page.
 */

import { Link } from "react-router-dom";
import { SearchListings } from "../components/SearchListing.jsx";

import "../stylesheets/Home.css";

export default function Home() {
  return (
    <main className="home-page">
      <div className="home-card">
        <h1 className="home-title">Flat Finder</h1>
        <p className="home-subtitle">Sign in or create an account to continue.</p>
        <div className="home-actions">
          <Link to="/login" className="home-button">Sign in</Link>
          <Link to="/register" className="home-button home-button--ghost">Register</Link>
        </div>
      </div>
    </main>
  );
}
