/**
 * Home.jsx — Public landing page.
 */

import { Link } from "react-router-dom";
import { SearchListings } from "../components/SearchListing.jsx";

import "../stylesheets/Home.css";

export default function Home() {
  return (
    <main>
      <h1>Home</h1>
      <Link to="/login"><button>Sign in</button></Link>
      <Link to="/register"><button>Register</button></Link>
      <SearchListings/>
    </main>
  );
}
