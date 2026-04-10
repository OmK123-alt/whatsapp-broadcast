import React, { useState } from "react";
import { Megaphone, History, Wifi } from "lucide-react";
import NewBroadcast from "./NewBroadcast";
import BroadcastHistory from "./BroadcastHistory";

export default function Dashboard({ waStatus }) {
  const [view, setView] = useState("new"); // new | history

  return (
    <div style={styles.layout}>
      {/* ── Sidebar ── */}
      <aside style={styles.sidebar}>
        <div style={styles.brand}>
          <div style={styles.brandMark}>SA</div>
          <div>
            <div style={styles.brandName}>Sharda Academy</div>
            <div style={styles.brandTag}>Broadcast Portal</div>
          </div>
        </div>

        <nav style={styles.nav}>
          <NavItem
            icon={<Megaphone size={17} />}
            label="New Broadcast"
            active={view === "new"}
            onClick={() => setView("new")}
          />
          <NavItem
            icon={<History size={17} />}
            label="History"
            active={view === "history"}
            onClick={() => setView("history")}
          />
        </nav>

        <div style={styles.statusBadge}>
          <span style={styles.statusDot} />
          <span style={{ fontSize: "0.78rem", color: "var(--accent2)" }}>WhatsApp Connected</span>
        </div>
      </aside>

      {/* ── Main ── */}
      <main style={styles.main}>
        <div style={styles.topbar}>
          <div>
            <h2 style={styles.pageTitle}>
              {view === "new" ? "New Broadcast" : "Broadcast History"}
            </h2>
            <p style={styles.pageSubtitle}>
              {view === "new"
                ? "Upload a batch poster and send it to your student groups"
                : "Track all scheduled and sent broadcasts"}
            </p>
          </div>
          <div style={styles.waChip}>
            <Wifi size={13} color="var(--accent2)" />
            <span>Connected</span>
          </div>
        </div>

        <div style={styles.content}>
          {view === "new" ? <NewBroadcast /> : <BroadcastHistory />}
        </div>
      </main>
    </div>
  );
}

function NavItem({ icon, label, active, onClick }) {
  return (
    <button onClick={onClick} style={{ ...styles.navItem, ...(active ? styles.navItemActive : {}) }}>
      <span style={{ opacity: active ? 1 : 0.5 }}>{icon}</span>
      <span>{label}</span>
    </button>
  );
}

const styles = {
  layout: {
    display: "flex", minHeight: "100vh"
  },
  sidebar: {
    width: 240, flexShrink: 0,
    background: "var(--bg2)",
    borderRight: "1px solid var(--border)",
    display: "flex", flexDirection: "column",
    padding: "28px 16px"
  },
  brand: {
    display: "flex", alignItems: "center", gap: "12px",
    marginBottom: "36px", paddingLeft: "8px"
  },
  brandMark: {
    width: 38, height: 38,
    background: "linear-gradient(135deg, var(--accent), #6e3dff)",
    borderRadius: "10px",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "0.9rem", color: "#fff"
  },
  brandName: {
    fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "0.95rem", color: "var(--text)"
  },
  brandTag: { fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "1px" },
  nav: { display: "flex", flexDirection: "column", gap: "4px", flex: 1 },
  navItem: {
    display: "flex", alignItems: "center", gap: "10px",
    padding: "10px 12px", borderRadius: "var(--radius-sm)",
    background: "transparent", color: "var(--text-sub)",
    fontFamily: "'DM Sans', sans-serif", fontSize: "0.88rem", fontWeight: 400,
    transition: "all 0.15s", textAlign: "left", width: "100%"
  },
  navItemActive: {
    background: "rgba(61,109,255,0.12)",
    color: "var(--accent)",
    fontWeight: 500
  },
  statusBadge: {
    display: "flex", alignItems: "center", gap: "8px",
    padding: "10px 12px",
    background: "rgba(0,230,160,0.07)",
    borderRadius: "var(--radius-sm)",
    border: "1px solid rgba(0,230,160,0.12)",
    marginTop: "auto"
  },
  statusDot: {
    width: 7, height: 7, borderRadius: "50%",
    background: "var(--accent2)", flexShrink: 0,
    boxShadow: "0 0 6px var(--accent2)"
  },
  main: { flex: 1, display: "flex", flexDirection: "column", overflow: "auto" },
  topbar: {
    padding: "28px 36px 0",
    display: "flex", alignItems: "flex-start", justifyContent: "space-between"
  },
  pageTitle: { fontSize: "1.5rem", color: "var(--text)" },
  pageSubtitle: { fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "4px" },
  waChip: {
    display: "flex", alignItems: "center", gap: "6px",
    padding: "6px 12px", borderRadius: "20px",
    background: "rgba(0,230,160,0.08)", border: "1px solid rgba(0,230,160,0.15)",
    fontSize: "0.78rem", color: "var(--accent2)", marginTop: "4px"
  },
  content: { padding: "24px 36px 36px", flex: 1 }
};
