import { useState } from "react";
import Modal from "./Modal";
import { useAuth } from "../context/AuthContext";
import { ROLES } from "../lib/auth";
import { createEnquiry } from "../lib/enquiries";
import "../stylesheets/Enquiry.css";

/**
 * Reusable button that lets a rentee start an enquiry about a specific listing.
 * Renders nothing for users who aren't logged in as a rentee, or for the host
 * of their own listing.
 *
 * @param {string} accommodationId   id of the listing being enquired about
 * @param {string} hostId            id of that listing's host (skips render if it matches the viewer)
 * @param {string} label             optional button label
 */
export default function EnquiryButton({ accommodationId, hostId, label = "Make Enquiry" }) {
  const { user } = useAuth();
  const [open, setOpen]       = useState(false);
  const [text, setText]       = useState("");
  const [error, setError]     = useState("");
  const [success, setSuccess] = useState(false);

  if (!user || user.role !== ROLES.RENTEE) return null;
  if (hostId && hostId === user.id) return null;

  const trimmed   = text.trim();
  const canSubmit = trimmed.length > 0;

  function handleClose() {
    setOpen(false);
    setText("");
    setError("");
    setSuccess(false);
  }

  function handleSubmit() {
    if (!canSubmit) return;
    try {
      createEnquiry(accommodationId, user.id, trimmed);
      setSuccess(true);
      setText("");
      window.dispatchEvent(new Event("enquiries:changed"));
    } catch (err) {
      setError(err.message || "Could not send enquiry.");
    }
  }

  return (
    <>
      <button className="enquiry-button" onClick={() => setOpen(true)}>
        {label}
      </button>
      {open && (
        <Modal title="Make an enquiry" onClose={handleClose}>
          {success ? (
            <>
              <p>Enquiry sent. The host will reply soon — you can follow the conversation in <strong>Enquiries</strong>.</p>
              <div className="modal-buttons">
                <button className="modal-button modal-button-primary" onClick={handleClose}>
                  Close
                </button>
              </div>
            </>
          ) : (
            <>
              <textarea
                className="modal-textarea"
                placeholder="Ask the host a question about this property…"
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={5}
                autoFocus
              />
              {error && <p className="enquiry-error">{error}</p>}
              <div className="modal-buttons">
                <button className="modal-button modal-button-secondary" onClick={handleClose}>
                  Cancel
                </button>
                <button
                  className="modal-button modal-button-primary"
                  onClick={handleSubmit}
                  disabled={!canSubmit}
                >
                  Send
                </button>
              </div>
            </>
          )}
        </Modal>
      )}
    </>
  );
}
