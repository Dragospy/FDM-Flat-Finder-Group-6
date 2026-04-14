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
  getReportedListings,
  dismissReports,
  updateListing,
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
function Listing({id, setDisplayedListing, setPopUp}) {
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
 * @param {function} setCurrentImage Function to change the image showing for the listing
 * @param {function} showPopUp Function to show the pop up to ask if the user is sure they want to perform an action
 * @param {number} currentImage Index in the images array of the current image showing for the listing
 * @returns Component to display the details for a listing
 */
function ListingDetails({id, setCurrentImage, currentImage, showPopUp}) {

  const listing = getListing(id);

  const prevImage = () => {
    setCurrentImage(currentImage - 1)
    if (currentImage === 0) {setCurrentImage(listing.images.length-1);}
  }

  const nextImage = () => {
    setCurrentImage(currentImage + 1)
    if (currentImage === listing.images.length-1) {setCurrentImage(0);}
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

      {listing.status === LISTING_STATUS.PENDING && <button className="approve-button" onClick={() => showPopUp("Are you sure you want to approve this listing?")}>Approve</button>}
      {listing.status === LISTING_STATUS.PENDING && <button className="reject-button" onClick={() => showPopUp("Are you sure you want to reject this listing?")}>Reject</button>}
      {listing.status != LISTING_STATUS.PENDING && <button className="revert-button" onClick={() => showPopUp("Are you sure you want to revert this listing to pending?")}>Revert to Pending</button>}
      <button className="delete-button" onClick={() => showPopUp("Are you sure you want to delete this listing? This action cannot be undone.")}>Delete</button>
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

function PopUp({message, displayedListing, toggleDisplayedListing, togglePopUp}) {

  let m = "";
  let type = "";

  if (message.includes("approve")) {m = message.split("approve"); type = "approve";}
  else if (message.includes("reject")) {m = message.split("reject"); type = "reject";}
  else if (message.includes("revert")) {m = message.split("revert"); type = "revert";}
  else if (message.includes("delete")) {m = message.split("delete"); type = "delete";}
  else {type = "error";}

  function processListing() {
    if (message.includes("approve")) {approveListing(displayedListing);}
    else if (message.includes("reject")) {rejectListing(displayedListing);}
    else if (message.includes("revert")) {revertListingToPending(displayedListing);}
    else if (message.includes("delete")) {deleteListing(displayedListing);}
    else {type = "error";}

    togglePopUp(null);
    toggleDisplayedListing(null);
  }

  return (
    <div className="overlay-container">
      <div className="pop-up-container">
        <div className="pop-up-message">
          <p>{m[0]} <u className={"pop-up-" + type}>{type}</u> {m[1]}</p>
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
function AccommodationApproval() {
  const [displayedStatus, setDisplayedStatus] = useState(LISTING_STATUS.PENDING);
  const [displayedListing, setDisplayedListing] = useState(null);
  const [currentImage, setCurrentImage] = useState(0);
  const [popUp, setPopUp] = useState(null);

  const toggleDisplayedListing = (newListing) => {
    if (displayedListing === newListing) {setDisplayedListing(null)}
    else (setDisplayedListing(newListing))

    setCurrentImage(0);
  }

  return (
    <div className="admin-container">
      <div className="left-panel">
        <StatusSelection displayedStatus={displayedStatus} setDisplayedStatus={setDisplayedStatus} toggleDisplayedListing={toggleDisplayedListing}/>
        <h2>{displayedStatus.charAt(0).toUpperCase() + displayedStatus.slice(1)}</h2>
        <div className="listing-group">
          {displayListings(displayedStatus, toggleDisplayedListing)}
        </div>
      </div>

      {displayedListing != null && <hr className="panel-separator"/>}

      {displayedListing != null && <div className="right-panel">
        <button className="listing-details-close-button" onClick={() => toggleDisplayedListing(null)}>X</button>
        <ListingDetails id={displayedListing} toggleDisplayedListing={toggleDisplayedListing} setCurrentImage={setCurrentImage} currentImage={currentImage} showPopUp={setPopUp}/>
      </div>}

      {popUp != null && <PopUp message={popUp} displayedListing={displayedListing} toggleDisplayedListing={setDisplayedListing} togglePopUp={setPopUp}/>}
    </div>
  );
}

/**
 * Account management sub-tab — search, deactivate, and reactivate user accounts.
 */
function AccountManagement() {
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
                      onClick={() => handleDeactivate(account.id)}
                    >
                      Deactivate
                    </button>
                  ) : (
                    <button
                      className="account-btn activate"
                      onClick={() => handleActivate(account.id)}
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

/**
 * Reported listings sub-tab — admins review reports and either dismiss them
 * (wrongful report) or deactivate the listing (legitimate report).
 */
function ReportedListings() {
  const [reported, setReported] = useState(() => getReportedListings());
  const [selectedId, setSelectedId] = useState(null);
  const [message, setMessage] = useState("");

  function refresh() {
    const next = getReportedListings();
    setReported(next);
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

  const selected = selectedId ? reported.find((l) => l.id === selectedId) : null;

  return (
    <div className="admin-container">
      <div className="left-panel">
        <h2>Reported Listings</h2>
        {message && <p className="reported-message">{message}</p>}
        {reported.length === 0 ? (
          <p>No reported listings.</p>
        ) : (
          <div className="listing-group">
            {reported.map((l) => (
              <div
                key={l.id}
                className="listing-container"
                onClick={() => setSelectedId(l.id === selectedId ? null : l.id)}
              >
                <img className="listing-image" src={l.images[0]} />
                <h3 className="listing-title">{l.title}</h3>
                <div className="listing-info">
                  <p>{l.reports.length} report(s)</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selected && <hr className="panel-separator" />}

      {selected && (
        <div className="right-panel">
          <button className="listing-details-close-button" onClick={() => setSelectedId(null)}>X</button>
          <div className="listing-details-container">
            <h2 className="listing-details-title">{selected.title}</h2>
            <p>{selected.type} &#8226; £{selected.price}/{selected.priceUnit}</p>
            <p>{selected.location.address}, {selected.location.city}</p>

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

            <button className="approve-button" onClick={() => handleDismiss(selected.id)}>
              Dismiss Reports
            </button>
            <button className="reject-button" onClick={() => handleDeactivate(selected.id)}>
              Deactivate Listing
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Admin() {
  const [section, setSection] = useState("approval");

  return (
    <main>
      <h1 style={{ margin: "1rem" }}>Admin Panel</h1>

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
        <button
          className={`admin-subtab ${section === "reported" ? "active" : ""}`}
          onClick={() => setSection("reported")}
        >
          Reported Listings
        </button>
      </div>

      {section === "approval" && <AccommodationApproval />}
      {section === "accounts" && <AccountManagement />}
      {section === "reported" && <ReportedListings />}
    </main>
  );
}
