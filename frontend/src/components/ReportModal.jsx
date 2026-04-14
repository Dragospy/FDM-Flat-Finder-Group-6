import { useState } from "react";
import "../stylesheets/ReportModal.css";

/**
 * Reusable modal that collects a reason from the user and confirms or cancels.
 *
 * @param {string} title    Heading shown at the top of the modal
 * @param {function} onConfirm  Called with the trimmed reason string when the user confirms
 * @param {function} onCancel   Called when the user cancels or closes the modal
 */
export default function ReportModal({ title = "Report listing", onConfirm, onCancel }) {
  const [reason, setReason] = useState("");

  const trimmed = reason.trim();
  const canConfirm = trimmed.length > 0;

  return (
    <div className="report-overlay">
      <div className="report-modal">
        <h3 className="report-modal-title">{title}</h3>
        <textarea
          className="report-modal-input"
          placeholder="Please describe the issue with this listing…"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={5}
          autoFocus
        />
        <div className="report-modal-buttons">
          <button className="report-modal-cancel" onClick={onCancel}>
            Cancel
          </button>
          <button
            className="report-modal-confirm"
            onClick={() => canConfirm && onConfirm(trimmed)}
            disabled={!canConfirm}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
