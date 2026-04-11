/**
 * Admin.jsx — Admin-only management panel.
 * Allows admins to search, deactivate, and reactivate user accounts.
 */

import { useState, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import { getAccounts, deactivateAccount, activateAccount } from "../lib/api";
import "../stylesheets/Admin.css";

export default function Admin() {
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
    <main className="admin-page">
      <h1>Admin Panel</h1>

      <div className="admin-tabs">
        <button
          className={`admin-tab ${tab === "active" ? "active" : ""}`}
          onClick={() => { setTab("active"); setSearch(""); }}
        >
          Active Users
        </button>
        <button
          className={`admin-tab ${tab === "deactivated" ? "active" : ""}`}
          onClick={() => { setTab("deactivated"); setSearch(""); }}
        >
          Deactivated Users
        </button>
      </div>

      <input
        type="text"
        className="admin-search"
        placeholder={`Search ${tab} users by name, email, or role…`}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {error && <p className="admin-error">{error}</p>}

      {filtered.length === 0 ? (
        <p className="admin-empty">
          {search ? "No users match your search." : `No ${tab} users found.`}
        </p>
      ) : (
        <table className="admin-table">
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
                <td className="admin-role">{account.role}</td>
                <td>
                  {tab === "active" ? (
                    <button
                      className="admin-btn deactivate"
                      onClick={() => handleDeactivate(account.id)}
                    >
                      Deactivate
                    </button>
                  ) : (
                    <button
                      className="admin-btn activate"
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
    </main>
  );
}
