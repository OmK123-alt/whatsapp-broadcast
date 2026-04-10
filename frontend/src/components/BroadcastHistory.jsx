import React, { useState, useEffect } from "react";
import api from "../api";
import { RefreshCw, Trash2, CheckCircle2, Clock, AlertCircle, Loader2, Send } from "lucide-react";
import toast from "react-hot-toast";

export default function BroadcastHistory() {
  const [broadcasts, setBroadcasts] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [waRes, tgRes] = await Promise.all([
        api.get("/api/broadcasts"),
        api.get("/api/telegram/broadcasts").catch(() => ({ data: [] }))
      ]);

      const whatsapp = (waRes.data || []).map((item) => ({
        ...item,
        platform: item.platform || "whatsapp"
      }));
      const telegram = (tgRes.data || []).map((item) => ({
        ...item,
        platform: item.platform || "telegram"
      }));

      const merged = [...whatsapp, ...telegram].sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );
      setBroadcasts(merged);
    } catch {
      toast.error("Failed to load history");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const cancel = async (broadcast) => {
    try {
      const isTelegram = (broadcast.platform || "").toLowerCase() === "telegram";
      const path = isTelegram
        ? `/api/telegram/broadcasts/${broadcast.id}`
        : `/api/broadcasts/${broadcast.id}`;
      await api.delete(path);
      toast.success("Broadcast cancelled");
      load();
    } catch {
      toast.error("Failed to cancel");
    }
  };

  if (loading) return (
    <div style={styles.center}>
      <Loader2 size={22} style={{ animation: "spin 1s linear infinite" }} />
      <span style={{ color: "var(--text-muted)" }}>Loading history...</span>
      <style>{`@keyframes spin { from{transform:rotate(0deg)}to{transform:rotate(360deg)} }`}</style>
    </div>
  );

  if (!broadcasts.length) return (
    <div style={styles.empty}>
      <Send size={32} color="var(--text-muted)" />
      <p style={{ color: "var(--text-sub)" }}>No broadcasts yet.</p>
      <p style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>Your sent and scheduled broadcasts will appear here.</p>
    </div>
  );

  return (
    <div>
      <div style={styles.toolbar}>
        <span style={styles.count}>{broadcasts.length} broadcast{broadcasts.length !== 1 ? "s" : ""}</span>
        <button style={styles.refreshBtn} onClick={load}>
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      <div style={styles.list}>
        {broadcasts.map((b) => (
          <BroadcastCard key={`${b.platform || "whatsapp"}-${b.id}`} broadcast={b} onCancel={cancel} />
        ))}
      </div>
      <style>{`@keyframes spin { from{transform:rotate(0deg)}to{transform:rotate(360deg)} }`}</style>
    </div>
  );
}

function BroadcastCard({ broadcast: b, onCancel }) {
  const [expanded, setExpanded] = useState(false);
  const isTelegram = (b.platform || "").toLowerCase() === "telegram";

  const statusIcon = {
    sent: <CheckCircle2 size={14} color="var(--success)" />,
    scheduled: <Clock size={14} color="var(--warn)" />,
    sending: <Loader2 size={14} color="var(--accent)" style={{ animation: "spin 1s linear infinite" }} />,
    failed: <AlertCircle size={14} color="var(--danger)" />,
    pending: <Clock size={14} color="var(--text-muted)" />,
    cancelled: <AlertCircle size={14} color="var(--text-muted)" />
  };

  const sentCount = (b.results || []).filter((r) => r.status === "sent").length;
  const failCount = (b.results || []).filter((r) => r.status === "failed").length;

  return (
    <div style={styles.card}>
      <div style={styles.cardTop} onClick={() => setExpanded(!expanded)}>
        {b.imageUrl && (
          <img src={b.imageUrl} alt="" style={styles.thumb} />
        )}
        <div style={styles.cardMeta}>
          <div style={styles.cardTitleRow}>
            <span style={styles.cardTitle}>{b.batchName}</span>
            <span style={styles.platformPill(isTelegram)}>
              {isTelegram ? "Telegram" : "WhatsApp"}
            </span>
            <span className={`tag tag-${b.status}`}>
              {statusIcon[b.status]} {b.status}
            </span>
          </div>
          <p style={styles.cardCaption}>{b.caption.slice(0, 120)}{b.caption.length > 120 ? "..." : ""}</p>
          <div style={styles.cardFooter}>
            <span style={styles.metaItem}>
              {isTelegram
                ? `📣 ${(b.targetIds || []).length} target${(b.targetIds || []).length !== 1 ? "s" : ""}`
                : `👥 ${(b.groupIds || []).length} group${(b.groupIds || []).length !== 1 ? "s" : ""}`}
            </span>
            {b.sentAt && (
              <span style={styles.metaItem}>
                ✅ Sent {new Date(b.sentAt).toLocaleString("en-IN")}
              </span>
            )}
            {b.scheduledAt && b.status === "scheduled" && (
              <span style={styles.metaItem}>
                📅 Scheduled {new Date(b.scheduledAt).toLocaleString("en-IN")}
              </span>
            )}
            <span style={styles.metaItem}>
              🕒 Created {new Date(b.createdAt).toLocaleString("en-IN")}
            </span>
          </div>
        </div>

        {b.status === "scheduled" && (
          <button style={styles.cancelBtn} onClick={(e) => { e.stopPropagation(); onCancel(b); }}>
            <Trash2 size={13} />
          </button>
        )}
      </div>

      {/* Expanded results */}
      {expanded && b.results?.length > 0 && (
        <div style={styles.results}>
          <div style={styles.resultsSummary}>
            <span style={{ color: "var(--success)" }}>✅ {sentCount} sent</span>
            {failCount > 0 && <span style={{ color: "var(--danger)" }}>❌ {failCount} failed</span>}
          </div>
          {b.results.map((r, i) => (
            <div key={i} style={styles.resultRow}>
              <span style={styles.resultDot(r.status === "sent")} />
              <span style={{ fontSize: "0.8rem", color: "var(--text-sub)" }}>{r.groupId}</span>
              <span style={{ marginLeft: "auto", fontSize: "0.75rem", color: r.status === "sent" ? "var(--success)" : "var(--danger)" }}>
                {r.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  center: {
    display: "flex", flexDirection: "column", alignItems: "center", gap: "12px",
    padding: "60px 0", color: "var(--text)"
  },
  empty: {
    display: "flex", flexDirection: "column", alignItems: "center", gap: "10px",
    padding: "80px 0", textAlign: "center"
  },
  toolbar: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    marginBottom: "16px"
  },
  count: { fontSize: "0.85rem", color: "var(--text-muted)" },
  refreshBtn: {
    display: "flex", alignItems: "center", gap: "6px",
    background: "var(--bg2)", border: "1px solid var(--border)",
    borderRadius: "var(--radius-sm)", padding: "6px 12px",
    color: "var(--text-sub)", fontSize: "0.8rem"
  },
  list: { display: "flex", flexDirection: "column", gap: "12px" },
  card: {
    background: "var(--bg2)", border: "1px solid var(--border)",
    borderRadius: "var(--radius)", overflow: "hidden"
  },
  cardTop: {
    display: "flex", gap: "16px", padding: "16px", cursor: "pointer",
    alignItems: "flex-start"
  },
  thumb: {
    width: 68, height: 68, objectFit: "cover",
    borderRadius: "var(--radius-sm)", flexShrink: 0
  },
  cardMeta: { flex: 1, minWidth: 0 },
  cardTitleRow: {
    display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px", flexWrap: "wrap"
  },
  cardTitle: { fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "0.95rem" },
  platformPill: (isTelegram) => ({
    fontSize: "0.7rem",
    borderRadius: "999px",
    padding: "2px 8px",
    border: "1px solid",
    borderColor: isTelegram ? "rgba(34,158,217,0.35)" : "rgba(37,211,102,0.35)",
    color: isTelegram ? "#229ed9" : "#25d366",
    background: isTelegram ? "rgba(34,158,217,0.12)" : "rgba(37,211,102,0.12)"
  }),
  cardCaption: { fontSize: "0.83rem", color: "var(--text-sub)", lineHeight: 1.5, marginBottom: "8px" },
  cardFooter: { display: "flex", flexWrap: "wrap", gap: "10px" },
  metaItem: { fontSize: "0.75rem", color: "var(--text-muted)" },
  cancelBtn: {
    flexShrink: 0,
    background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)",
    color: "var(--danger)", borderRadius: "6px", padding: "6px 8px",
    display: "flex", alignItems: "center"
  },
  results: {
    borderTop: "1px solid var(--border)", padding: "14px 16px",
    display: "flex", flexDirection: "column", gap: "6px"
  },
  resultsSummary: {
    display: "flex", gap: "16px", marginBottom: "8px",
    fontFamily: "'Syne', sans-serif", fontWeight: 600, fontSize: "0.85rem"
  },
  resultRow: {
    display: "flex", alignItems: "center", gap: "8px",
    padding: "4px 0", borderBottom: "1px solid var(--border)"
  },
  resultDot: (ok) => ({
    width: 6, height: 6, borderRadius: "50%", flexShrink: 0,
    background: ok ? "var(--success)" : "var(--danger)"
  })
};
