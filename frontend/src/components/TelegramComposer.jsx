import React, { useEffect, useRef, useState } from "react";
import api from "../api";
import toast from "react-hot-toast";
import { Calendar, Image as ImageIcon, Loader2, Send, X } from "lucide-react";

export default function TelegramComposer() {
  const [status, setStatus] = useState({ connected: false });
  const [campaignName, setCampaignName] = useState("");
  const [caption, setCaption] = useState("");
  const [targetsInput, setTargetsInput] = useState("");
  const [scheduleMode, setScheduleMode] = useState("now");
  const [scheduledAt, setScheduledAt] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [sending, setSending] = useState(false);

  const fileRef = useRef();

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    try {
      const { data } = await api.get("/api/telegram/status");
      setStatus(data);
    } catch {
      setStatus({ connected: false });
    }
  };

  const handleImage = (file) => {
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target.result);
    reader.readAsDataURL(file);
  };

  const parseTargets = () =>
    targetsInput
      .split(/\r?\n|,/)
      .map((value) => value.trim())
      .filter(Boolean);

  const handleSubmit = async () => {
    const targetIds = parseTargets();

    if (!caption.trim()) return toast.error("Please enter a Telegram message");
    if (!targetIds.length) return toast.error("Add at least one chat/channel id");
    if (scheduleMode === "later" && !scheduledAt) return toast.error("Please set schedule time");

    const fd = new FormData();
    fd.append("campaignName", campaignName || "Telegram Campaign");
    fd.append("caption", caption);
    fd.append("targetIds", JSON.stringify(targetIds));
    if (imageFile) fd.append("image", imageFile);
    if (scheduleMode === "later") fd.append("scheduledAt", new Date(scheduledAt).toISOString());

    setSending(true);
    try {
      await api.post("/api/telegram/broadcasts", fd);
      toast.success(scheduleMode === "now" ? "Telegram campaign sent" : "Telegram campaign scheduled");
      setCampaignName("");
      setCaption("");
      setTargetsInput("");
      setScheduleMode("now");
      setScheduledAt("");
      setImageFile(null);
      setImagePreview(null);
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to send Telegram campaign");
    } finally {
      setSending(false);
    }
  };

  const minDateTime = () => {
    const d = new Date(Date.now() + 5 * 60 * 1000);
    return d.toISOString().slice(0, 16);
  };

  return (
    <div style={styles.wrap}>
      {!status.connected && (
        <div style={styles.warn}>
          TELEGRAM_BOT_TOKEN is not configured on backend. Set it before sending.
        </div>
      )}

      <div style={styles.section}>
        <label style={styles.label}>Campaign Name</label>
        <input
          type="text"
          placeholder="e.g. Scholarship Alert - April"
          value={campaignName}
          onChange={(e) => setCampaignName(e.target.value)}
          style={styles.input}
        />
      </div>

      <div style={styles.section}>
        <label style={styles.label}>Message</label>
        <textarea
          placeholder="Write your Telegram message..."
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          style={styles.textarea}
        />
      </div>

      <div style={styles.section}>
        <label style={styles.label}>Chat / Channel IDs</label>
        <textarea
          placeholder={"One per line, e.g.\n@channelusername\n-1001234567890"}
          value={targetsInput}
          onChange={(e) => setTargetsInput(e.target.value)}
          style={styles.textareaSmall}
        />
      </div>

      <div style={styles.section}>
        <label style={styles.label}>Optional Banner (UI ready)</label>
        {imagePreview ? (
          <div>
            <img src={imagePreview} alt="Preview" style={styles.previewImg} />
            <button
              style={styles.removeBtn}
              onClick={() => {
                setImageFile(null);
                setImagePreview(null);
              }}
            >
              <X size={14} /> Remove
            </button>
          </div>
        ) : (
          <button style={styles.uploadBtn} onClick={() => fileRef.current?.click()}>
            <ImageIcon size={16} /> Upload image
          </button>
        )}
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => handleImage(e.target.files[0])} />
      </div>

      <div style={styles.section}>
        <label style={styles.label}>Delivery</label>
        <div style={styles.row}>
          <button style={{ ...styles.pill, ...(scheduleMode === "now" ? styles.pillActive : {}) }} onClick={() => setScheduleMode("now")}>
            <Send size={14} /> Send now
          </button>
          <button style={{ ...styles.pill, ...(scheduleMode === "later" ? styles.pillActive : {}) }} onClick={() => setScheduleMode("later")}>
            <Calendar size={14} /> Schedule
          </button>
        </div>
        {scheduleMode === "later" && (
          <input
            type="datetime-local"
            min={minDateTime()}
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            style={{ ...styles.input, marginTop: "10px", maxWidth: 280 }}
          />
        )}
      </div>

      <button style={{ ...styles.submit, ...(sending ? styles.submitDisabled : {}) }} onClick={handleSubmit} disabled={sending}>
        {sending ? <><Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} /> Sending...</> : "Send Telegram Campaign"}
      </button>

      <style>{`@keyframes spin { from{transform:rotate(0deg)}to{transform:rotate(360deg)} }`}</style>
    </div>
  );
}

const styles = {
  wrap: {
    background: "var(--bg2)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius)",
    padding: "20px",
    display: "flex",
    flexDirection: "column",
    gap: "14px"
  },
  warn: {
    background: "rgba(245,158,11,0.12)",
    color: "#fbbf24",
    border: "1px solid rgba(245,158,11,0.28)",
    borderRadius: "8px",
    padding: "10px 12px",
    fontSize: "0.82rem"
  },
  section: {
    display: "flex",
    flexDirection: "column",
    gap: "8px"
  },
  label: {
    fontSize: "0.82rem",
    color: "var(--text-muted)"
  },
  input: {
    background: "var(--bg)",
    border: "1px solid var(--border)",
    borderRadius: "8px",
    padding: "10px 12px",
    color: "var(--text)"
  },
  textarea: {
    minHeight: 130,
    background: "var(--bg)",
    border: "1px solid var(--border)",
    borderRadius: "8px",
    padding: "10px 12px",
    color: "var(--text)",
    resize: "vertical"
  },
  textareaSmall: {
    minHeight: 95,
    background: "var(--bg)",
    border: "1px solid var(--border)",
    borderRadius: "8px",
    padding: "10px 12px",
    color: "var(--text)",
    resize: "vertical"
  },
  row: {
    display: "flex",
    gap: "8px"
  },
  pill: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "8px 12px",
    borderRadius: "8px",
    border: "1px solid var(--border)",
    background: "var(--bg)",
    color: "var(--text-muted)"
  },
  pillActive: {
    color: "var(--accent)",
    border: "1px solid rgba(61,109,255,0.3)",
    background: "rgba(61,109,255,0.12)"
  },
  uploadBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    width: "fit-content",
    padding: "8px 12px",
    borderRadius: "8px",
    border: "1px solid var(--border)",
    background: "var(--bg)",
    color: "var(--text-sub)"
  },
  previewImg: {
    width: "100%",
    maxHeight: "240px",
    objectFit: "cover",
    borderRadius: "8px"
  },
  removeBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    marginTop: "8px",
    background: "rgba(239,68,68,0.1)",
    border: "1px solid rgba(239,68,68,0.2)",
    color: "var(--danger)",
    borderRadius: "8px",
    padding: "6px 10px"
  },
  submit: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    marginTop: "6px",
    borderRadius: "8px",
    padding: "12px 16px",
    color: "#fff",
    background: "linear-gradient(135deg, #229ed9, #1976d2)",
    fontFamily: "'Syne', sans-serif",
    fontWeight: 700
  },
  submitDisabled: {
    opacity: 0.6,
    cursor: "not-allowed"
  }
};
