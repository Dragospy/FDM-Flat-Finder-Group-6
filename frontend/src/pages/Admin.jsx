/**
 * Admin.jsx — Admin-only management panel.
 */
import { useEffect, useState } from "react";
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
function Listing({id, setDisplayedListing}) {
  const listing = getListing(id);
  return (
    <div className="listing-container" onClick={() => setDisplayedListing(id)}>
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

function ListingDetails({id, toggleDisplayedListing}) {
  const listing = getListing(id);

  return (
    <div className="listing-details-container">
      <header className="listing-details-header">
        <div className="listing-images-container">
          {
            listing.images.map((image, index) => {
              return (
                <img key={index} src={image} className="listing-details-image"></img>
              )
              
            })
          }
        </div>

        <h2 className="listing-details-title">{listing.title}</h2>
        <p>{listing.type} &#8226; {listing.maxGuests} max guest(s) &#8226; {listing.bedrooms} bedroom(s) &#8226; {listing.bathrooms} bathroom(s)</p>
      </header>

      <p className="listing-details-price">£{listing.price}/{listing.priceUnit}</p>

      <article className="listing-description-container">
        <h3 className="listing-details-desc-heading">Description</h3>
        <p>{listing.description}</p>
      </article>

      <section>
        <h3 className="listing-amenities-heading">Amenities</h3>
        <ul className="listing-amenities">
          {
            listing.amenities.map((amenity, index) => {
              return (
                <li key={index}>{amenity}</li>
              )
            })
          }
        </ul>
      </section>
      
      <section>
        <h3 className="listing-location-heading">Location</h3>
          <ul className="listing-location">
            <li>{listing.location.address}</li>
            <li>{listing.location.city}</li>
            <li>{listing.location.postcode}</li>
            <li>{listing.location.country}</li>
        </ul>
      </section>
      
      {listing.status === LISTING_STATUS.PENDING && <button className="approveButton" onClick={() => {approveListing(id); toggleDisplayedListing(null);}}>Approve</button>}
      {listing.status === LISTING_STATUS.PENDING && <button className="rejectButton" onClick={() => {rejectListing(id); toggleDisplayedListing(null)}}>Reject</button>}
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
function StatusSelection({displayedStatus, setDisplayedStatus, toggleDisplayedListing}) {
  return (
    <form>
      <select id="statuses" className="status-selection" value={displayedStatus} onChange={(event) => {setDisplayedStatus(event.target.value); toggleDisplayedListing(null);}}>
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
function displayListings(status, setDisplayedListing) {
  const listings = getListings();
  const validStatuses = Object.values(LISTING_STATUS);
  if (!validStatuses.includes(status))  throw new Error(`Status "${status}" not defined`);

  const filteredListings = listings.filter((l) => l.status === status);

  return filteredListings.map((listing, index) => {
    return (
      <Listing key={index} id={listing.id} setDisplayedListing={setDisplayedListing}></Listing>
    )
  })

}

export default function Admin() {
  db.reset();
  // console.log(getListings());
  const [displayedStatus, setDisplayedStatus] = useState(LISTING_STATUS.PENDING);
  const [displayedListing, setDisplayedListing] = useState(null);

  const toggleDisplayedListing = (newListing) => {
    if (displayedListing === newListing) {setDisplayedListing(null)}
    else (setDisplayedListing(newListing))
  }
  
  return (
    <main className="admin-container">
      <div className="left-panel">
        <h1>Admin Panel</h1>
        <StatusSelection displayedStatus={displayedStatus} setDisplayedStatus={setDisplayedStatus} toggleDisplayedListing={toggleDisplayedListing}/>
        <h2>{displayedStatus.charAt(0).toUpperCase() + displayedStatus.slice(1)}</h2>
        <div className="listing-group">
          {displayedStatus === LISTING_STATUS.PENDING && displayListings(LISTING_STATUS.PENDING, toggleDisplayedListing)}
          {displayedStatus === LISTING_STATUS.APPROVED && displayListings(LISTING_STATUS.APPROVED , toggleDisplayedListing)}   
          {displayedStatus === LISTING_STATUS.REJECTED && displayListings(LISTING_STATUS.REJECTED , toggleDisplayedListing)}  
        </div>
      </div>

      <hr className="panel-separator"/>

      {displayedListing != null && <div className="right-panel">
        <button className="listing-details-close-button" onClick={() => toggleDisplayedListing(null)}>X</button>
        <ListingDetails id={displayedListing} toggleDisplayedListing={toggleDisplayedListing}/>
      </div>}
    </main>
  );
}
