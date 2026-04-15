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
  APPLICATION_STATUS
} from "../lib/api";
import { useAuth } from "../context/AuthContext";
import "../stylesheets/ManageAccounts.css";
import { PopUp } from "./ModerateListings";

/**
 * Account management sub-tab — search, deactivate, and reactivate user accounts.
 */
export default function AccountManagement() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("active");
  const [accounts, setAccounts] = useState(() => getAccounts());
  const [error, setError] = useState("");
  const [popUp, setPopUp] = useState(null);

  const configurePopUp = (message, keyword, action, actionObject, toggleDisplayed) => {
    setPopUp({
      message: message, 
      keyword: keyword, 
      action: action,
      actionObject: actionObject,
      toggleDisplayed: toggleDisplayed})
  }

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

      <header className="admin-header">
        <p className="admin-eyebrow">Admin Dashboard</p>
        <h1>Manage Accounts</h1>
        <p className="admin-copy">Deactivate and reactivate accounts.</p>
      </header>

      <div className="manage-accounts">
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

      

      {popUp != null && <PopUp details={popUp} togglePopUp={setPopUp}/>}
    </div>
  );
}