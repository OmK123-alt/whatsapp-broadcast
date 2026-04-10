import React, { useState } from "react";
import { Megaphone, History, Wifi, Send, Instagram, BookOpen } from "lucide-react";
import NewBroadcast from "./NewBroadcast";
import BroadcastHistory from "./BroadcastHistory";
import TelegramComposer from "./TelegramComposer";
import LectureUpdates from "./LectureUpdates";
import QRScreen from "./QRScreen";

export default function Dashboard({ waStatus, qr }) {
  const [view, setView] = useState("whatsapp"); // whatsapp | telegram | instagram | lecture-updates | history
  const waConnected = waStatus === "connected";

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
            label="WhatsApp"
            active={view === "whatsapp"}
            onClick={() => setView("whatsapp")}
          />
          <NavItem
            icon={<Send size={17} />}
            label="Telegram"
            active={view === "telegram"}
            onClick={() => setView("telegram")}
          />
          <NavItem
            icon={<Instagram size={17} />}
            label="Instagram"
            active={view === "instagram"}
            onClick={() => setView("instagram")}
          />
          <NavItem
            icon={<BookOpen size={17} />}
            label="Lecture Updates"
            active={view === "lecture-updates"}
            onClick={() => setView("lecture-updates")}
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
          <span style={{ fontSize: "0.78rem", color: waConnected ? "var(--accent2)" : "var(--text-muted)" }}>
            {waConnected ? "WhatsApp Connected" : "WhatsApp Not Connected"}
          </span>
        </div>
      </aside>

      {/* ── Main ── */}
      <main style={styles.main}>
        <div style={styles.topbar}>
          <div>
            <h2 style={styles.pageTitle}>
              {view === "whatsapp"
                ? "WhatsApp Broadcast"
                : view === "telegram"
                  ? "Telegram Broadcast"
                  : view === "instagram"
                    ? "Instagram Broadcast"
                    : view === "lecture-updates"
                      ? "Lecture Updates"
                    : "Broadcast History"}
            </h2>
            <p style={styles.pageSubtitle}>
              {view === "whatsapp"
                ? "Upload a batch poster and send it to your student groups"
                : view === "telegram"
                  ? "Compose and send Telegram campaigns to channels/chats"
                  : view === "instagram"
                    ? "Instagram module placeholder for upcoming integration"
                  : view === "lecture-updates"
                    ? "Lecture update workflow placeholder"
                : "Track all scheduled and sent broadcasts"}
            </p>
          </div>
          <div style={styles.waChip}>
            <Wifi size={13} color={waConnected ? "var(--accent2)" : "var(--text-muted)"} />
            <span>{waConnected ? "Connected" : "Not Connected"}</span>
          </div>
        </div>

        <div style={styles.content}>
          {view === "whatsapp" ? (
            waConnected ? <NewBroadcast /> : <QRScreen status={waStatus} qr={qr} />
          ) : view === "telegram" ? (
            <TelegramComposer />
          ) : view === "lecture-updates" ? (
            <LectureUpdates />
          ) : view === "history" ? (
            <BroadcastHistory />
          ) : (
            <PlatformPlaceholder platform={view} />
          )}
        </div>
      </main>
    </div>
  );
}

function PlatformPlaceholder({ platform }) {
  const label = platform === "telegram"
    ? "Telegram"
    : platform === "instagram"
      ? "Instagram"
      : "Lecture Updates";
  return (
    <div style={styles.placeholder}>
      <h3 style={styles.placeholderTitle}>{label} integration coming soon</h3>
      <p style={styles.placeholderText}>
        This section is ready in the sidebar. You can add campaign composer, audience mapping, and scheduling for {label} next.
      </p>
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
  content: { padding: "24px 36px 36px", flex: 1 },
  placeholder: {
    background: "var(--bg2)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius)",
    padding: "28px"
  },
  placeholderTitle: {
    fontFamily: "'Syne', sans-serif",
    fontSize: "1.05rem",
    color: "var(--text)"
  },
  placeholderText: {
    fontSize: "0.9rem",
    color: "var(--text-muted)",
    marginTop: "8px"
  }
};
