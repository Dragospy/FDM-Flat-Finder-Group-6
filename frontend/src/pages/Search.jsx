/**
 * Search.jsx — Search page
 */
import { Link } from "react-router-dom";
import "../stylesheets/Dashboard.css";

import {SearchListings} from  "../components/SearchListing.jsx";

export default function Search() {

  return (
    <main>
      <h1>Search</h1>
      <SearchListings/>
    </main>
  );
}
