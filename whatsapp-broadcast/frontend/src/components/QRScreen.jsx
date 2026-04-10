import React from "react";
import { Smartphone, Wifi, WifiOff, Loader2 } from "lucide-react";

export default function QRScreen({ status, qr }) {
  return (
    <div style={styles.wrapper}>
      {/* Background grid */}
      <div style={styles.gridBg} />

      <div style={styles.card}>
        {/* Logo / Header */}
        <div style={styles.header}>
          <div style={styles.logoMark}>SA</div>
          <div>
            <h1 style={styles.title}>Sharda Academy</h1>
            <p style={styles.subtitle}>Broadcast Portal</p>
          </div>
        </div>

        <div style={styles.divider} />

        {status === "disconnected" && !qr && (
          <div style={styles.stateBlock}>
            <WifiOff size={36} color="var(--text-muted)" />
            <p style={styles.stateTitle}>Starting WhatsApp...</p>
            <p style={styles.stateText}>The server is initializing. Please wait a moment.</p>
            <div style={styles.spinner}><Loader2 size={20} className="spin" /></div>
          </div>
        )}

        {status === "qr_ready" && qr && (
          <div style={styles.stateBlock}>
            <p style={styles.stateTitle}>Scan to Connect</p>
            <p style={styles.stateText}>
              Open WhatsApp on your phone → <strong>Linked Devices</strong> → <strong>Link a Device</strong>
            </p>
            <div style={styles.qrWrapper}>
              <img src={qr} alt="WhatsApp QR Code" style={styles.qrImage} />
            </div>
            <div style={styles.waitingRow}>
              <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />
              <span>Waiting for scan...</span>
            </div>
          </div>
        )}

        {status === "connected" && (
          <div style={styles.stateBlock}>
            <Wifi size={36} color="var(--accent2)" />
            <p style={{ ...styles.stateTitle, color: "var(--accent2)" }}>Connected!</p>
            <p style={styles.stateText}>Redirecting to dashboard...</p>
          </div>
        )}

        <div style={styles.footer}>
          <span style={styles.dot(status)} />
          <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>
            {status === "connected" ? "WhatsApp Connected"
              : status === "qr_ready" ? "Awaiting Scan"
              : "Connecting..."}
          </span>
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

const styles = {
  wrapper: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    padding: "24px"
  },
  gridBg: {
    position: "fixed", inset: 0, zIndex: 0,
    backgroundImage: `
      linear-gradient(rgba(61,109,255,0.04) 1px, transparent 1px),
      linear-gradient(90deg, rgba(61,109,255,0.04) 1px, transparent 1px)
    `,
    backgroundSize: "40px 40px"
  },
  card: {
    position: "relative", zIndex: 1,
    background: "var(--bg2)",
    border: "1px solid var(--border)",
    borderRadius: "20px",
    padding: "40px",
    width: "100%",
    maxWidth: "420px",
    boxShadow: "0 24px 80px rgba(0,0,0,0.5)"
  },
  header: {
    display: "flex", alignItems: "center", gap: "16px", marginBottom: "28px"
  },
  logoMark: {
    width: 48, height: 48,
    background: "linear-gradient(135deg, var(--accent), #6e3dff)",
    borderRadius: "12px",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontFamily: "'Syne', sans-serif",
    fontWeight: 800, fontSize: "1.1rem", color: "#fff",
    flexShrink: 0
  },
  title: { fontSize: "1.3rem", color: "var(--text)" },
  subtitle: { fontSize: "0.82rem", color: "var(--text-muted)", marginTop: "2px" },
  divider: { height: 1, background: "var(--border)", marginBottom: "28px" },
  stateBlock: {
    display: "flex", flexDirection: "column", alignItems: "center",
    gap: "12px", textAlign: "center"
  },
  stateTitle: {
    fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "1.2rem"
  },
  stateText: { fontSize: "0.85rem", color: "var(--text-sub)", maxWidth: "300px" },
  spinner: { marginTop: "8px", animation: "spin 1s linear infinite", display: "flex" },
  qrWrapper: {
    background: "#fff",
    padding: "14px",
    borderRadius: "14px",
    margin: "8px 0"
  },
  qrImage: { width: 220, height: 220, display: "block" },
  waitingRow: {
    display: "flex", alignItems: "center", gap: "8px",
    color: "var(--text-muted)", fontSize: "0.82rem",
    animation: "none"
  },
  footer: {
    display: "flex", alignItems: "center", gap: "8px",
    marginTop: "28px", paddingTop: "20px",
    borderTop: "1px solid var(--border)"
  },
  dot: (status) => ({
    width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
    background: status === "connected" ? "var(--accent2)"
      : status === "qr_ready" ? "var(--warn)"
      : "var(--text-muted)"
  })
};
