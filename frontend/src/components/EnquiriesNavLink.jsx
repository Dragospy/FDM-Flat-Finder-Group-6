import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { ROLES } from "../lib/auth";
import { unreadCountForUser } from "../lib/enquiries";
import "../stylesheets/Enquiry.css";

/**
 * Sidebar/nav link to the Enquiries page with an unread-count badge.
 * Hidden for users that don't participate in enquiries (e.g. admins).
 *
 * Listens for the "enquiries:changed" window event so the badge updates
 * immediately when a message is sent or read elsewhere in the app.
 */
export default function EnquiriesNavLink() {
  const { user } = useAuth();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    const update = () => setCount(unreadCountForUser(user.id));
    update();
    window.addEventListener("enquiries:changed", update);
    window.addEventListener("storage", update);
    return () => {
      window.removeEventListener("enquiries:changed", update);
      window.removeEventListener("storage", update);
    };
  }, [user]);

  if (!user || (user.role !== ROLES.HOST && user.role !== ROLES.RENTEE)) {
    return null;
  }

  return (
    <Link to="/enquiries">
      Enquiries
      {count > 0 && <span className="enquiry-unread-badge">{count}</span>}
    </Link>
  );
}
