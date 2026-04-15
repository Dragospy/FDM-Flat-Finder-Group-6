/**
 * Admin.jsx — Admin-only management panel.
 * Has two sub-tabs:
 *   • Accommodation Approval — moderate listings (approve/reject/revert/delete)
 *   • Account Management     — search, deactivate, and reactivate user accounts
 */
import { useMemo, useState } from "react";
import {
  approveListing,
  deleteListing,
  getListing,
  getListings,
  rejectListing,
  revertListingToPending,
  getReportedListings,
  dismissReports,
  updateListing,
  APPLICATION_STATUS,
} from "../lib/api";
import "../stylesheets/Admin.css";

const LISTING_STATUS = {
  ALL: "all",
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
}

/**
 * A listing card
 *
 * @param {string} id
 * @returns Component to display a listing
 */
function Listing({id, setDisplayedListing, displayedListing, setPopUp}) {
  const listing = getListing(id);

  return (
    <div className={listing.id === displayedListing ? "active-listing-container" : " listing-container"} onClick={() => setDisplayedListing(id)}>
      {listing.images.length === 0 ? (
        <div className="admin-listing-no-image">
          <p>No image available</p>
        </div>
      ) : (
        <img className="admin-listing-image" src={listing.images[0]}></img>
      )}
      <h3 className={listing.id === displayedListing ? "active-admin-listing-title" : "admin-listing-title"}>{listing.title}</h3>
      <div className={listing.id === displayedListing ? "active-listing-info" : "listing-info"}>
        <p className={listing.id === displayedListing ? "active-admin-listing-type" :"admin-listing-type"}>{listing.type}</p>
        <p>&#8226;</p>
        <p className="listing-price">£{listing.price}</p>
      </div>
    </div>
  )
}

/**
 * Renders the details for a listing and buttons to approve/reject/revert the listing, depending on the current status
 *
 * @param {string} id
 * @param {function} setCurrentImage Function to change the image showing for the listing
 * @param {function} showPopUp Function to show the pop up to ask if the user is sure they want to perform an action
 * @param {number} currentImage Index in the images array of the current image showing for the listing
 * @returns Component to display the details for a listing
 */
function ListingDetails({id, setCurrentImage, currentImage, showPopUp, toggleDisplayedListing, setListings}) {

  const listing = getListing(id);

  const prevImage = () => {
    setCurrentImage(currentImage - 1)
    if (currentImage === 0) {setCurrentImage(listing.images.length-1);}
  }

  const nextImage = () => {
    setCurrentImage(currentImage + 1)
    if (currentImage === listing.images.length-1) {setCurrentImage(0);}
  }

  function handleApprove(id) {
    approveListing(id);
    setListings(getListings());
  }

  function handleReject(id) {
    rejectListing(id);
    setListings(getListings());
  }

  function handleRevert(id) {
    revertListingToPending(id);
    setListings(getListings());
  }

  function handleDelete(id) {
    deleteListing(id);
    setListings(getListings());
  }

  return (
    <div className="listing-details-container">
      <header className="listing-details-header">
        {listing.images.length === 0 ? (
          <div className="listing-details-no-image">
            <p>No image available</p>
          </div>
        ) : (
          <div className="listing-images-container">
            <img src={listing.images[currentImage]} className="listing-details-image"></img>
            <div className="arrow-buttons-container">
              <button onClick={prevImage} className="image-prev-button">&lt;</button>
            <button onClick={nextImage} className="image-next-button">&gt;</button>
          </div>
        </div>
        )}

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
        <ul className="admin-listing-amenities">
          {
            listing.amenities.map((amenity, index) => {
              return (
                <li className="admin-amenities-item" key={index}>{amenity}</li>
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
      
      {listing.status === APPLICATION_STATUS.SUBMITTED && <button className="approve-button" onClick={() => {showPopUp("Are you sure you want to approve this listing?", "approve", handleApprove, listing.id, toggleDisplayedListing);}}>Approve</button>}
      {listing.status === APPLICATION_STATUS.SUBMITTED && <button className="reject-button" onClick={() => {showPopUp("Are you sure you want to reject this listing?", "reject", handleReject, listing.id, toggleDisplayedListing);}}>Reject</button>}
      {listing.status != APPLICATION_STATUS.SUBMITTED && <button className="revert-button" onClick={() => {showPopUp("Are you sure you want to revert this listing to pending?", "revert", handleRevert, listing.id, toggleDisplayedListing);}}>Revert to Pending</button>}
      <button className="delete-button" onClick={() => {showPopUp("Are you sure you want to delete this listing? This action cannot be undone.", "delete", handleDelete, listing.id, toggleDisplayedListing);}}>Delete</button>      
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
function StatusSelection({displayedStatus, setSearch, setDisplayedStatus, setListings, toggleDisplayedListing}) {

  const [open, setOpen] = useState(false);

  return (
    <div className="status-selection">
      <button className="status-selection-button" onClick={() => setOpen(open => !open)}><p>{displayedStatus.charAt(0).toUpperCase() + displayedStatus.slice(1)}</p><p className="dropdown-arrow">&#9660;</p></button>
      {
        open && (
          <div className="status-dropdown">
            <button className="status-option" onClick={() => {setOpen(false); setDisplayedStatus(LISTING_STATUS.ALL); toggleDisplayedListing(null); setSearch(""); setListings(getListings());}}>All</button>
            <button className="status-option" onClick={() => {setOpen(false); setDisplayedStatus(LISTING_STATUS.PENDING); toggleDisplayedListing(null); setSearch(""); setListings(getListings());}}>Pending</button>
            <button className="status-option" onClick={() => {setOpen(false); setDisplayedStatus(LISTING_STATUS.APPROVED); toggleDisplayedListing(null); setSearch(""); setListings(getListings());}}>Approved</button>
            <button className="status-option bottom-status-option" onClick={() => {setOpen(false); setDisplayedStatus(LISTING_STATUS.REJECTED); toggleDisplayedListing(null); setSearch(""); setListings(getListings());}}>Rejected</button>
          </div>

        )
      }
    </div>

  )
}

/**
 * Filters the listings by the passed in status and renders the component for each match
 *
 * @param {Array} listings List of all listings
 * @param {string} status Status to filter listings by
 * @returns Components of all listings that have the passed in status
 */
function displayListings(listings, status, displayedListing, setDisplayedListing) {
  
  const validStatuses = Object.values(LISTING_STATUS);
  if (!validStatuses.includes(status))  throw new Error(`Status "${status}" not defined`);

  return listings.map((listing, index) => {
    return (
      <Listing key={index} id={listing.id} displayedListing={displayedListing} setDisplayedListing={setDisplayedListing}></Listing>
    )
  })

}

/**
 * Custom pop up to get confirmation from the user
 * 
 * @param {dictionary} details Details for the pop up
 * @param {function} togglePopUp Function to toggle the pop up
 * @returns Custom pop up to get confirmation from the user
 */
export function PopUp({details, togglePopUp}) {

  const keyword = details.keyword;
  const message = details.message.split(keyword);
  const action = details.action;
  const actionObject = details.actionObject;
  const toggleDisplayed = details.toggleDisplayed;

  function processListing() {
    action(actionObject);

    togglePopUp(null);

    if (toggleDisplayed) {
      toggleDisplayed(null);
    }
    
  }

  return (
    <div className="overlay-container">
      <div className="pop-up-container">
        <div className="pop-up-message">
          <p>{message[0]} <u className={"pop-up-" + keyword}>{keyword}</u> {message[1]}</p>
        </div>
        <div className="pop-up-button-container">
          <button className="pop-up-ok" onClick={processListing}>Ok</button>
          <button className="pop-up-cancel" onClick={() => togglePopUp(null)}>Cancel</button>
        </div>
      </div>

    </div>
  )
}

/**
 * Accommodation approval sub-tab — listing moderation panel.
 */
function AccommodationApproval({configurePopUp}) {
  const [displayedStatus, setDisplayedStatus] = useState(LISTING_STATUS.PENDING);
  const [displayedListing, setDisplayedListing] = useState(null);
  const [listings, setListings] = useState(() => getListings());
  const [currentImage, setCurrentImage] = useState(0);
  const [search, setSearch] = useState("");

  function convertStatusToApplicationStatus(status) {
    if (status === LISTING_STATUS.PENDING) return APPLICATION_STATUS.SUBMITTED;
    if (status === LISTING_STATUS.APPROVED) return APPLICATION_STATUS.ACCEPTED;
    if (status === LISTING_STATUS.REJECTED) return APPLICATION_STATUS.REJECTED;
  }

  const filtered = useMemo(() => {
    const query = search.toLowerCase();
    if (displayedStatus === LISTING_STATUS.ALL) {
      
      return listings
      .filter(
        (l) =>
          l.title.toLowerCase().includes(query) ||
          l.type.toLowerCase().includes(query) ||
          l.location.address.toLowerCase().includes(query) ||
          l.location.city.toLowerCase().includes(query) ||
          l.location.postcode.toLowerCase().includes(query) ||
          l.location.country.toLowerCase().includes(query)
      );
    }

    return listings
      .filter((l) => (l.status === convertStatusToApplicationStatus(displayedStatus)))
      .filter(
        (l) =>
          l.title.toLowerCase().includes(query) ||
          l.type.toLowerCase().includes(query) ||
          l.location.address.toLowerCase().includes(query) ||
          l.location.city.toLowerCase().includes(query) ||
          l.location.postcode.toLowerCase().includes(query) ||
          l.location.country.toLowerCase().includes(query)
      );
  }, [listings, search, displayedStatus]);

  const toggleDisplayedListing = (newListing) => {
    if (displayedListing === newListing) {setDisplayedListing(null)}
    else (setDisplayedListing(newListing))

    setCurrentImage(0);
  }
  
  return (
    <div className="manage-listings-container">
      <div className="left-panel">

        <div className="listing-filtering">
          <StatusSelection displayedStatus={displayedStatus} setSearch={setSearch} setDisplayedStatus={setDisplayedStatus} setListings={setListings} toggleDisplayedListing={toggleDisplayedListing}/>
          
          <input
          type="text"
          className="account-search"
          placeholder={`Search for ${displayedStatus} listings by title, type or location...`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        <div className="listing-group">
          {filtered.length === 0 ? (
        <p className="account-empty">
          {search ? "No listings match your search." : `No listings found.`}
        </p>
      ) : 
          displayListings(filtered, displayedStatus, displayedListing, toggleDisplayedListing)}
        </div>
      </div>

      {displayedListing != null && <div className="right-panel">
        <button className="listing-details-close-button" onClick={() => toggleDisplayedListing(null)}>X</button>
        <ListingDetails id={displayedListing} toggleDisplayedListing={toggleDisplayedListing} setCurrentImage={setCurrentImage} currentImage={currentImage} showPopUp={configurePopUp} setListings={setListings}/>
      </div>}

    </div>
  );
}

/**
 * Reported listings sub-tab — admins review reports and either dismiss them
 * (wrongful report) or deactivate the listing (legitimate report).
 */
function ReportedListings({configurePopUp}) {
  const [reported, setReported] = useState(() => getReportedListings());
  const [selectedId, setSelectedId] = useState(null);
  const [message, setMessage] = useState("");
  const [currentImage, setCurrentImage] = useState(0);
  const [search, setSearch] = useState("");

  function refresh() {
    const next = getReportedListings();
    setReported(next);
    setCurrentImage(0)
    if (!next.find((l) => l.id === selectedId)) setSelectedId(null);
  }

  function handleDismiss(id) {
    dismissReports(id);
    setMessage("Reports dismissed.");
    refresh();
  }

  function handleDeactivate(id) {
    updateListing(id, { available: false, reports: [] });
    setMessage("Listing deactivated.");
    refresh();
  }

  const prevImage = () => {
    setCurrentImage(currentImage - 1)
    if (currentImage === 0) {setCurrentImage(selected.images.length-1);}
  }

  const nextImage = () => {
    setCurrentImage(currentImage + 1)
    if (currentImage === selected.images.length-1) {setCurrentImage(0);}
  }

    const reportedFiltered = useMemo(() => {
    const query = search.toLowerCase();

    return reported
      .filter(
        (l) =>
          l.title.toLowerCase().includes(query) ||
          l.type.toLowerCase().includes(query) ||
          l.location.address.toLowerCase().includes(query) ||
          l.location.city.toLowerCase().includes(query) ||
          l.location.postcode.toLowerCase().includes(query) ||
          l.location.country.toLowerCase().includes(query)
      );
  }, [reported, search]);

  const selected = selectedId ? reportedFiltered.find((l) => l.id === selectedId) : null;

  return (
    <div className="manage-listings-container">
      <div className="left-panel">

        <input
          type="text"
          className="account-search"
          placeholder={`Search for reported listings by title, type or location...`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          />
        {message && <p className="reported-message">{message}</p>}
        {reportedFiltered.length === 0 ? (
          <p className="no-reported-message">No reported listings found.</p>
        ) : (
          <div className="listing-group">
            {reportedFiltered.map((l) => (
              <div
                key={l.id}
                className={l.id === selectedId ? "active-listing-container" : " listing-container"}
                onClick={() => {setSelectedId(l.id === selectedId ? null : l.id); setCurrentImage(0)}}
              >
              {l.images.length === 0 ? (
                <div className="admin-listing-no-image">
                  <p>No image available</p>
                </div>
              ) : (
                <img className="admin-listing-image" src={l.images[0]}></img>
              )}
                <h3 className={l.id === selectedId ? "active-admin-listing-title" : "admin-listing-title"}>{l.title}</h3>
                <div className="listing-info">
                  <p><strong>{l.reports.length} report(s)</strong></p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selected && (
        <div className="right-panel">
          <button className="listing-details-close-button" onClick={() => {setSelectedId(null); setCurrentImage(0);}}>X</button>
          <div className="listing-details-container">
            <header className="listing-details-header">

              {selected.images.length === 0 ? (
                <div className="listing-details-no-image">
                  <p>No image available</p>
                </div>
                ) : (
                  <div className="listing-images-container">
                    <img src={selected.images[currentImage]} className="listing-details-image"></img>
                    <div className="arrow-buttons-container">
                      <button onClick={prevImage} className="image-prev-button">&lt;</button>
                    <button onClick={nextImage} className="image-next-button">&gt;</button>
                  </div>
                </div>
              )}
              <h2 className="listing-details-title">{selected.title}</h2>
              <p>{selected.type} &#8226; £{selected.price}/{selected.priceUnit}</p>
            </header>
              <section>
              <h3 className="listing-location-heading">Location</h3>
                <ul className="listing-location">
                  <li>{selected.location.address}</li>
                  <li>{selected.location.city}</li>
                  <li>{selected.location.postcode}</li>
                  <li>{selected.location.country}</li>
              </ul>
            </section>
              
            
            <section>
              <h3>Reports ({selected.reports.length})</h3>
              <ul className="reports-list">
                {selected.reports.map((r, i) => (
                  <li key={i} className="report-entry">
                    <p><strong>By:</strong> {r.userId}</p>
                    <p><strong>At:</strong> {new Date(r.createdAt).toLocaleString()}</p>
                    <p><strong>Reason:</strong> {r.reason}</p>
                  </li>
                ))}
              </ul>
            </section>

            <button className="approve-button" onClick={() => configurePopUp("Are you sure you want to dismiss all reports for this listing?", "dismiss", handleDismiss, selected.id, null)}>
              Dismiss Reports
            </button>
            <button className="delete-button" onClick={() => configurePopUp("Are you sure you want to deactivate this listing?", "deactivate", handleDeactivate, selected.id, null)}>
              Deactivate Listing
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ModerateListings() {
  const [section, setSection] = useState("approval");
  const [popUp, setPopUp] = useState(null);

  const configurePopUp = (message, keyword, action, actionObject, toggleDisplayed) => {
    setPopUp({
      message: message, 
      keyword: keyword, 
      action: action,
      actionObject: actionObject,
      toggleDisplayed: toggleDisplayed})
  }

  return (
    <main className="admin-page">
      <header className="admin-header">
        <p className="admin-eyebrow">Admin Dashboard</p>
        <h1>Moderate Listings</h1>
        <p className="admin-copy">Approve or reject accommodation listings.</p>
      </header>

      <div className="admin-subtabs">
        <button
          className={`admin-subtab ${section === "approval" ? "active" : ""}`}
          onClick={() => setSection("approval")}
        >
          Accommodation Approval
        </button>
        <button
          className={`admin-subtab ${section === "reported" ? "active" : ""}`}
          onClick={() => setSection("reported")}
        >
          Reported Listings
        </button>
      </div>

      {section === "approval" && <AccommodationApproval configurePopUp={configurePopUp}/>}

      {section === "reported" && <ReportedListings configurePopUp={configurePopUp}/>}
      {popUp != null && <PopUp details={popUp} togglePopUp={setPopUp}/>}
    </main>
  );
}
