import { useEffect, useMemo, useRef, useState } from "react";

import { getUsageLogs, USAGE_EVENTS } from "../lib/usageLog";
import { getAccounts } from "../lib/api";
import "../stylesheets/ManageAccounts.css";
import "../stylesheets/SystemUsageReport.css";

const RANGES = [
  { id: "24h",  label: "Last 24 hours", ms: 24 * 60 * 60 * 1000 },
  { id: "7d",   label: "Last 7 days",   ms: 7 * 24 * 60 * 60 * 1000 },
  { id: "30d",  label: "Last 30 days",  ms: 30 * 24 * 60 * 60 * 1000 },
  { id: "all",  label: "All time",      ms: null },
];

const EVENT_LABELS = {
  [USAGE_EVENTS.LOGIN]:                 "Login",
  [USAGE_EVENTS.LOGIN_FAILED]:          "Login (failed)",
  [USAGE_EVENTS.LOGOUT]:                "Logout",
  [USAGE_EVENTS.REGISTER]:              "Registration",
  [USAGE_EVENTS.LISTING_CREATED]:       "Listing created",
  [USAGE_EVENTS.LISTING_DELETED]:       "Listing deleted",
  [USAGE_EVENTS.LISTING_APPROVED]:      "Listing approved",
  [USAGE_EVENTS.LISTING_REJECTED]:      "Listing rejected",
  [USAGE_EVENTS.APPLICATION_SUBMITTED]: "Application submitted",
  [USAGE_EVENTS.ACCOUNT_DEACTIVATED]:   "Account deactivated",
  [USAGE_EVENTS.ACCOUNT_ACTIVATED]:     "Account activated",
};

function labelFor(type) {
  return EVENT_LABELS[type] ?? type;
}

function downloadCsv(rows) {
  const header = ["timestamp", "type", "userId", "userRole", "meta"];
  const lines = [header.join(",")];
  for (const r of rows) {
    lines.push([
      r.createdAt,
      r.type,
      r.userId ?? "",
      r.userRole ?? "",
      r.meta ? JSON.stringify(r.meta).replace(/"/g, '""') : "",
    ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","));
  }
  const blob = new Blob([lines.join("\n")], { type: "text/csv" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href = url;
  a.download = `system-usage-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function SystemUsageReport() {
  const [range, setRange] = useState("7d");
  const [typeFilter, setTypeFilter] = useState("all");
  const accounts = useMemo(() => getAccounts(), []);
  const accountById = useMemo(() => {
    const map = new Map();
    accounts.forEach((a) => map.set(a.id, a));
    return map;
  }, [accounts]);

  const logs = useMemo(() => getUsageLogs(), []);

  const filtered = useMemo(() => {
    const r = RANGES.find((x) => x.id === range);
    const cutoff = r?.ms ? Date.now() - r.ms : null;
    return logs
      .filter((l) => !cutoff || new Date(l.createdAt).getTime() >= cutoff)
      .filter((l) => typeFilter === "all" || l.type === typeFilter)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [logs, range, typeFilter]);

  const stats = useMemo(() => {
    const byType = {};
    const uniqueUsers = new Set();
    for (const l of filtered) {
      byType[l.type] = (byType[l.type] || 0) + 1;
      if (l.userId) uniqueUsers.add(l.userId);
    }
    return { byType, uniqueUsers: uniqueUsers.size, total: filtered.length };
  }, [filtered]);

  const eventTypes = Object.values(USAGE_EVENTS);

  return (
    <div className="account-management">
      <header className="admin-header">
        <p className="admin-eyebrow">Admin Dashboard</p>
        <h1>System Usage Report</h1>
        <p className="admin-copy">Track logins, moderation actions, and platform activity.</p>
      </header>

      <div className="manage-accounts">
        <div className="account-tabs">
          {RANGES.map((r) => (
            <button
              key={r.id}
              className={`account-tab ${range === r.id ? "active" : ""}`}
              onClick={() => setRange(r.id)}
            >
              {r.label}
            </button>
          ))}
        </div>

        <div className="usage-summary">
          <div className="usage-stat">
            <span className="usage-stat-value">{stats.total}</span>
            <span className="usage-stat-label">Total events</span>
          </div>
          <div className="usage-stat">
            <span className="usage-stat-value">{stats.uniqueUsers}</span>
            <span className="usage-stat-label">Unique users</span>
          </div>
          <div className="usage-stat">
            <span className="usage-stat-value">{stats.byType[USAGE_EVENTS.LOGIN] || 0}</span>
            <span className="usage-stat-label">Logins</span>
          </div>
          <div className="usage-stat">
            <span className="usage-stat-value">{stats.byType[USAGE_EVENTS.REGISTER] || 0}</span>
            <span className="usage-stat-label">New registrations</span>
          </div>
          <div className="usage-stat">
            <span className="usage-stat-value">{stats.byType[USAGE_EVENTS.LISTING_CREATED] || 0}</span>
            <span className="usage-stat-label">Listings created</span>
          </div>
          <div className="usage-stat">
            <span className="usage-stat-value">{stats.byType[USAGE_EVENTS.APPLICATION_SUBMITTED] || 0}</span>
            <span className="usage-stat-label">Applications</span>
          </div>
        </div>

        <div className="usage-controls">
          <select
            className="usage-filter"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="all">All event types</option>
            {eventTypes.map((t) => (
              <option key={t} value={t}>{labelFor(t)}</option>
            ))}
          </select>

          <button
            className="account-btn activate"
            onClick={() => downloadCsv(filtered)}
            disabled={filtered.length === 0}
          >
            Export CSV
          </button>
        </div>

        <EventLog filtered={filtered} accountById={accountById} />
      </div>
    </div>
  );
}

const ROW_HEIGHT = 38;
const OVERSCAN = 8;

function EventLog({ filtered, accountById }) {
  const scrollRef = useRef(null);
  const rafRef = useRef(0);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportH, setViewportH] = useState(520);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    setViewportH(el.clientHeight);
    el.scrollTop = 0;
    setScrollTop(0);
  }, [filtered]);

  const onScroll = (e) => {
    const top = e.currentTarget.scrollTop;
    if (rafRef.current) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = 0;
      setScrollTop(top);
    });
  };

  const rendered = useMemo(() => {
    const total = filtered.length;
    const start = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN);
    const count = Math.ceil(viewportH / ROW_HEIGHT) + OVERSCAN * 2;
    const end = Math.min(total, start + count);
    const slice = filtered.slice(start, end).map((l) => {
      const acct = l.userId ? accountById.get(l.userId) : null;
      return {
        ...l,
        _name: acct ? acct.name : (l.userId ? "(deleted)" : "—"),
        _ts: new Date(l.createdAt).toLocaleString(),
        _metaStr: l.meta ? JSON.stringify(l.meta) : "",
      };
    });
    return { start, end, slice };
  }, [filtered, scrollTop, viewportH, accountById]);

  if (filtered.length === 0) {
    return <p className="account-empty">No usage events in this range.</p>;
  }

  const totalHeight = filtered.length * ROW_HEIGHT;
  const offsetY = rendered.start * ROW_HEIGHT;

  return (
    <div className="usage-log">
      <div className="usage-log-head">
        <span>Timestamp</span>
        <span>Event</span>
        <span>User</span>
        <span>Role</span>
        <span>Details</span>
      </div>
      <div
        ref={scrollRef}
        className="usage-log-scroll"
        onScroll={onScroll}
      >
        <div className="usage-log-spacer" style={{ height: totalHeight }}>
          <div className="usage-log-list" style={{ transform: `translate3d(0, ${offsetY}px, 0)` }}>
            {rendered.slice.map((l) => (
              <div key={l.id} className="usage-log-row" style={{ height: ROW_HEIGHT }}>
                <span>{l._ts}</span>
                <span>{labelFor(l.type)}</span>
                <span>{l._name}</span>
                <span className="account-role">{l.userRole ?? "—"}</span>
                <span className="usage-meta">{l._metaStr}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="usage-log-footer">
        <span>{filtered.length} events</span>
      </div>
    </div>
  );
}
