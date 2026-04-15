import { useState } from "react";
import ReportModal from "./ReportModal";
import { useAuth } from "../context/AuthContext";
import { reportListing } from "../lib/api";
import "../stylesheets/Enquiry.css";

/**
 * Reusable button that lets a logged-in user report a listing. Opens a ReportModal
 * and persists the report via the api on confirm.
 *
 * If `onSubmit` is supplied it runs after a successful report — handy for parent
 * components that want to update local state (e.g. show a toast).
 *
 * @param {string}   listingId  id of the listing being reported
 * @param {function} onSubmit   optional callback receiving the trimmed reason
 * @param {string}   label      button label (defaults to "Report")
 */
export default function ReportButton({ listingId, onSubmit, label = "Report" }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");

  if (!user) return null;

  function handleConfirm(reason) {
    try {
      reportListing(listingId, user.id, reason);
      onSubmit?.(reason);
      setOpen(false);
      setError("");
    } catch (err) {
      setError(err.message || "Could not submit report.");
    }
  }

  return (
    <>
      <button className="report-button" onClick={() => setOpen(true)}>
        {label}
      </button>
      {open && (
        <ReportModal
          title="Report listing"
          onConfirm={handleConfirm}
          onCancel={() => { setOpen(false); setError(""); }}
          error={error}
        />
      )}
    </>
  );
}
