import { useEffect } from "react";
import "../stylesheets/Modal.css";

/**
 * Reusable modal shell. Renders an overlay + a panel with an optional title and
 * arbitrary children. Closing is delegated to the caller via `onClose`.
 *
 * @param {string}    title     Heading shown at the top of the modal (optional)
 * @param {function}  onClose   Called when the user clicks the overlay or hits Escape
 * @param {ReactNode} children  Body content of the modal
 */
export default function Modal({ title, onClose, children }) {
  useEffect(() => {
    function handleKey(e) {
      if (e.key === "Escape") onClose?.();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        {title && <h3 className="modal-title">{title}</h3>}
        {children}
      </div>
    </div>
  );
}
