/**
 * Admin.jsx — Admin-only management panel.
 */
import { useState } from "react";
import { approveListing, getListing, getListings, rejectListing } from "../lib/api";
import "../stylesheets/Admin.css";
import { db } from "../lib/db";
import { LISTING_STATUS } from "../constants/listingStatus";

/**
 * A listing card 
 * 
 * @param {string} id 
 * @returns Component to display a listing
 */
function Listing({id}) {
  const listing = getListing(id);
  return (
    <div className="listing-container">
      <img className="listing-image" src={listing.images[0]}></img>
      <h3 className="listing-title">{listing.title}</h3>
      <div className="listing-info">
        <p className="listing-type">{listing.type}</p>
        <p>&#8226;</p>
        <p>£{listing.price}</p>
      </div>
    </div>
  )
}

/**
 * Drop down menu to pick the status of listings to show
 * 
 * @param {string} displayedStatus Status of listings currently being displayed
 * @param {function} setDisplayedStatus Function to change the displayed status to the selected value
 * @returns Component to pick a status
 */
function StatusSelection({displayedStatus, setDisplayedStatus}) {
  return (
    <form>
      <select id="statuses" className="status-selection" value={displayedStatus} onChange={(event) => {setDisplayedStatus(event.target.value);}}>
        <option value={LISTING_STATUS.PENDING}>Pending</option>
        <option value={LISTING_STATUS.APPROVED}>Approved</option>
        <option value={LISTING_STATUS.REJECTED}>Rejected</option>
      </select>
    </form>
  )
}

/**
 * Filters the listings by the passed in status and renders the component for each match
 * 
 * @param {Array} listings List of all listings
 * @param {string} status Status to filter listings by
 * @returns Components of all listings that have the passed in status
 */
function displayListings(listings, status) {
  const validStatuses = Object.values(LISTING_STATUS);
  if (!validStatuses.includes(status))  throw new Error(`Status "${status}" not defined`);

  const filteredListings = listings.filter((l) => l.status === status);

  return filteredListings.map((listing, index) => {
    return (
      <Listing key={index} id={listing.id}></Listing>
    )
  })

}

export default function Admin() {
  // db.reset();
  // console.log(getListings());
  const [displayedStatus, setDisplayedStatus] = useState(LISTING_STATUS.PENDING);
  
  return (
    <main className="admin-container">
      <h1>Admin Panel</h1>
      <StatusSelection displayedStatus={displayedStatus} setDisplayedStatus={setDisplayedStatus}/>
      <h2>{displayedStatus.charAt(0).toUpperCase() + displayedStatus.slice(1)}</h2>
      <div className="listing-group">
        {displayedStatus === LISTING_STATUS.PENDING && displayListings(getListings(), LISTING_STATUS.PENDING)}
        {displayedStatus === LISTING_STATUS.APPROVED && displayListings(getListings(), LISTING_STATUS.APPROVED)}   
        {displayedStatus === LISTING_STATUS.REJECTED && displayListings(getListings(), LISTING_STATUS.REJECTED)}  
      </div>
    </main>
  );
}
