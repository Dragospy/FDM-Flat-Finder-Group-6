import { useState } from "react";
import Modal from "./Modal";

/**
 * Modal that collects a reason from the user and confirms or cancels.
 *
 * @param {string} title    Heading shown at the top of the modal
 * @param {function} onConfirm  Called with the trimmed reason string when the user confirms
 * @param {function} onCancel   Called when the user cancels or closes the modal
 */
export default function ReportModal({ title = "Report listing", onConfirm, onCancel, error }) {
  const [reason, setReason] = useState("");

  const trimmed = reason.trim();
  const canConfirm = trimmed.length > 0;

  return (
    <Modal title={title} onClose={onCancel}>
      <textarea
        className="modal-textarea"
        placeholder="Please describe the issue with this listing…"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        rows={5}
        autoFocus
      />
      {error && <p className="enquiry-error">{error}</p>}
      <div className="modal-buttons">
        <button className="modal-button modal-button-secondary" onClick={onCancel}>
          Cancel
        </button>
        <button
          className="modal-button modal-button-danger"
          onClick={() => canConfirm && onConfirm(trimmed)}
          disabled={!canConfirm}
        >
          Confirm
        </button>
      </div>
    </Modal>
  );
}
