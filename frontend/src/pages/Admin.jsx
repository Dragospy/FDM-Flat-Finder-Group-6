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

function StatusSelection({heading, setHeading}) {
  return (
    <form>
      <select id="statuses" value={heading} onChange={(event) => {setHeading(event.target.value);}}>
        <option value={LISTING_STATUS.PENDING}>Pending</option>
        <option value={LISTING_STATUS.APPROVED}>Approved</option>
        <option value={LISTING_STATUS.REJECTED}>Rejected</option>
      </select>
    </form>
  )
}

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
  const [heading, setHeading] = useState(LISTING_STATUS.PENDING);
  
  return (
    <main>
      <h1>Admin Panel</h1>
      <StatusSelection heading={heading} setHeading={setHeading}/>
      <h2>{heading.charAt(0).toUpperCase() + heading.slice(1)}</h2>
      <div className="listing-group">
        {heading === LISTING_STATUS.PENDING && displayListings(getListings(), LISTING_STATUS.PENDING)}
        {heading === LISTING_STATUS.APPROVED && displayListings(getListings(), LISTING_STATUS.APPROVED)}   
        {heading === LISTING_STATUS.REJECTED && displayListings(getListings(), LISTING_STATUS.REJECTED)}  
      </div>
    </main>
  );
}
