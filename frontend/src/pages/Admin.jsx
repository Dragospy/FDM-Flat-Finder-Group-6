/**
 * Admin.jsx — Admin-only management panel.
 */
import { useEffect, useState } from "react";
import { approveListing, deleteListing, getListing, getListings, rejectListing, revertListingToPending } from "../lib/api";
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

/**
 * Renders the details for a listing and buttons to approve/reject/revert the listing, depending on the current status
 * 
 * @param {string} id
 * @param {function} toggleDisplayedListing Function to toggle the displayed listing
 * @param {function} setCurrentImage Function to change the image showing for the listing
 * @param {number} currentImage Index in the images array of the current image showing for the listing
 * @returns Component to display the details for a listing
 */
function ListingDetails({id, toggleDisplayedListing, setCurrentImage, currentImage}) {

  const listing = getListing(id);

  const prevImage = () => {
    setCurrentImage(currentImage - 1)
    if (currentImage === 0) {setCurrentImage(listing.images.length-1);}
  }

  const nextImage = () => {
    setCurrentImage(currentImage + 1)
    if (currentImage === listing.images.length-1) {setCurrentImage(0);}
  }

  function getConfirmation(message) {
    if (window.confirm(message)) {return true;}
    else {return false;}
  }

  return (
    <div className="listing-details-container">
      <header className="listing-details-header">
        <div className="listing-images-container">

          <img src={listing.images[currentImage]} className="listing-details-image"></img>
          <div className="arrow-buttons-container">
            <button onClick={prevImage} className="image-prev-button">&lt;</button>
            <button onClick={nextImage} className="image-next-button">&gt;</button>
          </div>
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
      
      {listing.status === LISTING_STATUS.PENDING && <button className="approve-button" onClick={() => {if (getConfirmation("Are you sure you want to approve this listing?")) {approveListing(id); toggleDisplayedListing(null);}}}>Approve</button>}
      {listing.status === LISTING_STATUS.PENDING && <button className="reject-button" onClick={() => {if (getConfirmation("Are you sure you want to reject this listing?")) {rejectListing(id); toggleDisplayedListing(null);}}}>Reject</button>}
      {listing.status != LISTING_STATUS.PENDING && <button className="revert-button" onClick={() => {if (getConfirmation("Are you sure you want to revert this listing to pending?")) {revertListingToPending(id); toggleDisplayedListing(null);}}}>Revert to Pending</button>}
      <button className="delete-button" onClick={() => {if (getConfirmation("Are you sure you want to delete this listing? This action cannot be undone.")) {deleteListing(id); toggleDisplayedListing(null);}}}>Delete</button>
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
  // db.reset();
  // console.log(getListings());
  const [displayedStatus, setDisplayedStatus] = useState(LISTING_STATUS.PENDING);
  const [displayedListing, setDisplayedListing] = useState(null);
  const [currentImage, setCurrentImage] = useState(0);

  const toggleDisplayedListing = (newListing) => {
    if (displayedListing === newListing) {setDisplayedListing(null)}
    else (setDisplayedListing(newListing))

    setCurrentImage(0);
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

      {displayedListing != null && <hr className="panel-separator"/>}

      {displayedListing != null && <div className="right-panel">
        <button className="listing-details-close-button" onClick={() => toggleDisplayedListing(null)}>X</button>
        <ListingDetails id={displayedListing} toggleDisplayedListing={toggleDisplayedListing} setCurrentImage={setCurrentImage} currentImage={currentImage}/>
      </div>}
    </main>
  );
}
