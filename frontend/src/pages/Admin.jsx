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
  getAccounts,
  deactivateAccount,
  activateAccount,
} from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { LISTING_STATUS } from "../constants/listingStatus";
import "../stylesheets/Admin.css";

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
      <img className="listing-image" src={listing.images[0]}></img>
      <h3 className={listing.id === displayedListing ? "active-listing-title" : "listing-title"}>{listing.title}</h3>
      <div className={listing.id === displayedListing ? "active-listing-info" : "listing-info"}>
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
      
      {listing.status === LISTING_STATUS.PENDING && <button className="approve-button" onClick={() => {showPopUp("Are you sure you want to approve this listing?", "approve", handleApprove, listing.id, toggleDisplayedListing);}}>Approve</button>}
      {listing.status === LISTING_STATUS.PENDING && <button className="reject-button" onClick={() => {showPopUp("Are you sure you want to reject this listing?", "reject", handleReject, listing.id, toggleDisplayedListing);}}>Reject</button>}
      {listing.status != LISTING_STATUS.PENDING && <button className="revert-button" onClick={() => {showPopUp("Are you sure you want to revert this listing to pending?", "revert", handleRevert, listing.id, toggleDisplayedListing);}}>Revert to Pending</button>}
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
function PopUp({details, togglePopUp}) {

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

  const filtered = useMemo(() => {
    const query = search.toLowerCase();
    return listings
      .filter((l) => (l.status === displayedStatus))
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
          {search ? "No listings match your search." : `No ${displayedStatus} listings found.`}
        </p>
      ) : 
          displayListings(filtered, displayedStatus, displayedListing, toggleDisplayedListing)}
        </div>
      </div>

      {displayedListing != null && <hr className="panel-separator"/>}

      {displayedListing != null && <div className="right-panel">
        <button className="listing-details-close-button" onClick={() => toggleDisplayedListing(null)}>X</button>
        <ListingDetails id={displayedListing} toggleDisplayedListing={toggleDisplayedListing} setCurrentImage={setCurrentImage} currentImage={currentImage} showPopUp={configurePopUp} setListings={setListings}/>
      </div>}

    </div>
  );
}

/**
 * Account management sub-tab — search, deactivate, and reactivate user accounts.
 */
function AccountManagement({configurePopUp}) {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("active");
  const [accounts, setAccounts] = useState(() => getAccounts());
  const [error, setError] = useState("");

  const filtered = useMemo(() => {
    const query = search.toLowerCase();
    return accounts
      .filter((a) => a.id !== user.id) // admins cannot deactivate themselves
      .filter((a) => (tab === "active" ? a.active !== false : a.active === false))
      .filter(
        (a) =>
          a.name.toLowerCase().includes(query) ||
          a.email.toLowerCase().includes(query) ||
          a.role.toLowerCase().includes(query)
      );
  }, [accounts, search, tab, user.id]);

  function handleDeactivate(id) {
    try {
      deactivateAccount(id);
      setAccounts(getAccounts());
      setError("");
    } catch (err) {
      setError(err.message);
    }
  }

  function handleActivate(id) {
    try {
      activateAccount(id);
      setAccounts(getAccounts());
      setError("");
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="account-management">
      <div className="account-tabs">
        <button
          className={`account-tab ${tab === "active" ? "active" : ""}`}
          onClick={() => { setTab("active"); setSearch(""); }}
        >
          Active Users
        </button>
        <button
          className={`account-tab ${tab === "deactivated" ? "active" : ""}`}
          onClick={() => { setTab("deactivated"); setSearch(""); }}
        >
          Deactivated Users
        </button>
      </div>

      <input
        type="text"
        className="account-search"
        placeholder={`Search ${tab} users by name, email, or role…`}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {error && <p className="account-error">{error}</p>}

      {filtered.length === 0 ? (
        <p className="account-empty">
          {search ? "No users match your search." : `No ${tab} users found.`}
        </p>
      ) : (
        <table className="account-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((account) => (
              <tr key={account.id}>
                <td>{account.name}</td>
                <td>{account.email}</td>
                <td className="account-role">{account.role}</td>
                <td>
                  {tab === "active" ? (
                    <button
                      className="account-btn deactivate"
                      onClick={() => configurePopUp("Are you sure you want to deactivate the account with email: " + account.email + "?", "deactivate", handleDeactivate, account.id, null)}
                    >
                      Deactivate
                    </button>
                  ) : (
                    <button
                      className="account-btn activate"
                      onClick={() => configurePopUp("Are you sure you want to activate the account with email: " + account.email + "?", "activate", handleActivate, account.id, null)}
                    >
                      Activate
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default function Admin() {
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
    <main>
      <h1 className="admin-heading">Admin Panel</h1>

      <div className="admin-subtabs">
        <button
          className={`admin-subtab ${section === "approval" ? "active" : ""}`}
          onClick={() => setSection("approval")}
        >
          Accommodation Approval
        </button>
        <button
          className={`admin-subtab ${section === "accounts" ? "active" : ""}`}
          onClick={() => setSection("accounts")}
        >
          Account Management
        </button>
      </div>

      {section === "approval" ? <AccommodationApproval configurePopUp={configurePopUp}/> : <AccountManagement configurePopUp={configurePopUp}/>}

      {popUp != null && <PopUp details={popUp} togglePopUp={setPopUp}/>}
    </main>
  );
}
