/**
 * Enquiries.jsx — Two-pane chat view of all of the current user's enquiry threads.
 * Hosts see threads on their listings; rentees see threads they started.
 */

import { useEffect, useMemo, useState } from "react";

import { useAuth } from "../context/AuthContext";
import { db } from "../lib/db";
import {
  getThreadsForUser,
  appendMessage,
  markThreadRead,
  threadHasUnreadFor,
} from "../lib/enquiries";
import "../stylesheets/Enquiry.css";

export default function Enquiries() {
  const { user }                  = useAuth();
  const [threads, setThreads]     = useState(() => getThreadsForUser(user.id));
  const [activeId, setActiveId]   = useState(threads[0]?.id ?? null);
  const [reply, setReply]         = useState("");

  function refresh(nextActiveId = activeId) {
    setThreads(getThreadsForUser(user.id));
    if (nextActiveId !== activeId) setActiveId(nextActiveId);
  }

  // Mark the open thread as read whenever it changes
  useEffect(() => {
    if (!activeId) return;
    markThreadRead(activeId, user.id);
    setThreads(getThreadsForUser(user.id));
    window.dispatchEvent(new Event("enquiries:changed"));
  }, [activeId, user.id]);

  const active = useMemo(
    () => threads.find((t) => t.id === activeId) ?? null,
    [threads, activeId]
  );

  const otherParty = useMemo(() => {
    if (!active) return null;
    const otherId = active.hostId === user.id ? active.renteeId : active.hostId;
    return db.getById("accounts", otherId);
  }, [active, user.id]);

  const listing = useMemo(
    () => (active ? db.getById("listings", active.listingId) : null),
    [active]
  );

  function handleSend() {
    const trimmed = reply.trim();
    if (!trimmed || !active) return;
    appendMessage(active.id, user.id, trimmed);
    setReply("");
    refresh();
    window.dispatchEvent(new Event("enquiries:changed"));
  }

  return (
    <main className="enquiries-page">
      <aside className="enquiries-list">
        {threads.length === 0 && (
          <p className="enquiries-list-empty">No enquiries yet.</p>
        )}
        {threads.map((t) => {
          const otherId   = t.hostId === user.id ? t.renteeId : t.hostId;
          const other     = db.getById("accounts", otherId);
          const lst       = db.getById("listings", t.listingId);
          const lastMsg   = t.messages[t.messages.length - 1];
          const unread    = threadHasUnreadFor(t, user.id);
          return (
            <button
              key={t.id}
              className={`enquiry-thread-item ${t.id === activeId ? "active" : ""}`}
              onClick={() => setActiveId(t.id)}
            >
              <div className="enquiry-thread-title">
                <span>{lst?.title ?? "Listing removed"}</span>
                {unread && <span className="enquiry-unread-dot" />}
              </div>
              <div className="enquiry-thread-snippet">
                {other?.name ?? "Unknown"}: {lastMsg?.text ?? ""}
              </div>
            </button>
          );
        })}
      </aside>

      <section className={`enquiry-conversation ${!active ? "enquiry-conversation-empty" : ""}`}>
        {!active ? (
          <p>Select an enquiry to view the conversation.</p>
        ) : (
          <>
            <header className="enquiry-conversation-header">
              <h2>{listing?.title ?? "Listing removed"}</h2>
              <small>with {otherParty?.name ?? "Unknown"}</small>
            </header>
            <div className="enquiry-messages">
              {active.messages.map((m, i) => (
                <div
                  key={i}
                  className={`enquiry-message ${m.senderId === user.id ? "mine" : "theirs"}`}
                >
                  <div>{m.text}</div>
                  <div className="enquiry-message-meta">
                    {new Date(m.createdAt).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
            <div className="enquiry-reply">
              <textarea
                placeholder="Write a reply…"
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
              />
              <button
                className="modal-button modal-button-primary"
                onClick={handleSend}
                disabled={!reply.trim()}
              >
                Send
              </button>
            </div>
          </>
        )}
      </section>
    </main>
  );
}
