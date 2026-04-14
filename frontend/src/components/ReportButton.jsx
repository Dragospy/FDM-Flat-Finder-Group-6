import { useState } from "react";
import ReportModal from "./ReportModal";
import "../stylesheets/ReportModal.css";

/**
 * Button that opens a ReportModal. When the user confirms, `onSubmit` is called
 * with the reason string. Wiring to persist the report lives outside this component.
 *
 * @param {function} onSubmit  Receives the trimmed reason string
 * @param {string} label       Button label (defaults to "Report")
 */
export default function ReportButton({ onSubmit, label = "Report" }) {
  const [open, setOpen] = useState(false);

  function handleConfirm(reason) {
    onSubmit?.(reason);
    setOpen(false);
  }

  return (
    <>
      <button className="report-button" onClick={() => setOpen(true)}>
        {label}
      </button>
      {open && (
        <ReportModal
          onConfirm={handleConfirm}
          onCancel={() => setOpen(false)}
        />
      )}
    </>
  );
}
