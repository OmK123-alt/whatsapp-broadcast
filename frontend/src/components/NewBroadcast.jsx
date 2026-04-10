import React, { useState, useEffect, useRef } from "react";
import api from "../api";
import toast from "react-hot-toast";
import {
  Upload, X, Calendar, Clock, Send, Users, Image as ImageIcon,
  RefreshCw, CheckSquare, Square, ChevronRight, Loader2
} from "lucide-react";

export default function NewBroadcast() {
  const [groups, setGroups]         = useState([]);
  const [loadingGroups, setLoading] = useState(true);
  const [selectedGroups, setSelected] = useState([]);
  const [groupSearch, setGroupSearch] = useState("");
  const [caption, setCaption]       = useState("");
  const [imageFile, setImageFile]   = useState(null);
  const [imagePreview, setPreview]  = useState(null);
  const [scheduleMode, setSchedule] = useState("now"); // now | later
  const [scheduledAt, setScheduledAt] = useState("");
  const [batchName, setBatchName]   = useState("");
  const [sending, setSending]       = useState(false);
  const fileRef = useRef();

  useEffect(() => { loadGroups(); }, []);

  const loadGroups = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/api/wa/groups", { timeout: 20000 });
      setGroups(data);
      if (data.length === 0) toast("No groups found. Make sure WhatsApp is connected.", { icon: "⚠️" });
    } catch (err) {
      toast.error("Could not load groups — tap Refresh to try again");
      setGroups([]);
    } finally {
      setLoading(false);
    }
  };

  const handleImage = (file) => {
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) handleImage(file);
  };

  const toggleGroup = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    const filteredIds = filteredGroups.map((g) => g.id);
    const allFilteredSelected = filteredIds.every((id) => selectedGroups.includes(id));

    if (allFilteredSelected) {
      setSelected((prev) => prev.filter((id) => !filteredIds.includes(id)));
      return;
    }

    setSelected((prev) => Array.from(new Set([...prev, ...filteredIds])));
  };

  const filteredGroups = groups.filter((g) =>
    g.name.toLowerCase().includes(groupSearch.toLowerCase())
  );

  const handleSubmit = async () => {
    if (!imageFile) return toast.error("Please upload a banner image");
    if (!caption.trim()) return toast.error("Please enter a caption");
    if (!selectedGroups.length) return toast.error("Select at least one batch group");
    if (scheduleMode === "later" && !scheduledAt) return toast.error("Please set a schedule time");

    const fd = new FormData();
    fd.append("image", imageFile);
    fd.append("caption", caption);
    fd.append("groupIds", JSON.stringify(selectedGroups));
    fd.append("batchName", batchName || "Broadcast");
    if (scheduleMode === "later") fd.append("scheduledAt", new Date(scheduledAt).toISOString());

    setSending(true);
    try {
      await api.post("/api/broadcasts", fd);
      toast.success(scheduleMode === "now" ? "✅ Broadcast sent!" : "📅 Broadcast scheduled!");
      // Reset form
      setImageFile(null); setPreview(null);
      setCaption(""); setBatchName("");
      setSelected([]); setScheduledAt("");
      setSchedule("now");
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to send broadcast");
    } finally {
      setSending(false);
    }
  };

  const minDateTime = () => {
    const d = new Date(Date.now() + 5 * 60 * 1000);
    return d.toISOString().slice(0, 16);
  };

  return (
    <div style={styles.grid}>
      {/* ── LEFT COLUMN ── */}
      <div style={styles.column}>

        {/* Batch Name */}
        <Section title="Batch Name" icon="🎓">
          <input
            type="text"
            placeholder="e.g. MPSC Rajyaseva 2025 — Batch A"
            value={batchName}
            onChange={(e) => setBatchName(e.target.value)}
            style={styles.input}
          />
        </Section>

        {/* Image Upload */}
        <Section title="Batch Poster" icon="🖼️">
          {imagePreview ? (
            <div style={styles.previewBox}>
              <img src={imagePreview} alt="Preview" style={styles.previewImg} />
              <button style={styles.removeBtn} onClick={() => { setImageFile(null); setPreview(null); }}>
                <X size={14} /> Remove
              </button>
            </div>
          ) : (
            <div
              style={styles.dropzone}
              onClick={() => fileRef.current.click()}
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
            >
              <ImageIcon size={28} color="var(--text-muted)" />
              <p style={styles.dropText}>Drop poster here or <span style={{ color: "var(--accent)" }}>browse</span></p>
              <p style={styles.dropSub}>JPG, PNG, GIF up to 16 MB</p>
            </div>
          )}
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => handleImage(e.target.files[0])} />
        </Section>

        {/* Caption */}
        <Section title="Caption / Message" icon="✏️">
          <textarea
            placeholder="Write your batch announcement here...&#10;&#10;🔥 New Batch Starting!&#10;📚 Subject: ..."
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            style={{ ...styles.input, minHeight: 130, resize: "vertical" }}
          />
          <div style={styles.charCount}>{caption.length} / 1024 chars</div>
        </Section>

        {/* Schedule */}
        <Section title="When to Send" icon="⏰">
          <div style={styles.scheduleToggle}>
            <ToggleBtn active={scheduleMode === "now"} onClick={() => setSchedule("now")}>
              <Send size={14} /> Send Now
            </ToggleBtn>
            <ToggleBtn active={scheduleMode === "later"} onClick={() => setSchedule("later")}>
              <Calendar size={14} /> Schedule
            </ToggleBtn>
          </div>
          {scheduleMode === "later" && (
            <input
              type="datetime-local"
              min={minDateTime()}
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              style={{ ...styles.input, marginTop: 12, colorScheme: "dark" }}
            />
          )}
        </Section>
      </div>

      {/* ── RIGHT COLUMN ── */}
      <div style={styles.column}>
        <Section
          title={`Select Batch Groups`}
          icon="👥"
          action={
            <button style={styles.refreshBtn} onClick={loadGroups}>
              <RefreshCw size={13} />
            </button>
          }
        >
          {loadingGroups ? (
            <div style={styles.loadingGroups}>
              <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} />
              <span>Loading groups... (may take 10–20 sec)</span>
              <button style={styles.refreshBtn} onClick={loadGroups}>Retry</button>
            </div>
          ) : groups.length === 0 ? (
            <div style={styles.emptyGroups}>
              <Users size={28} color="var(--text-muted)" />
              <p>No WhatsApp groups found.</p>
              <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Make sure you're an admin of the groups.</p>
            </div>
          ) : (
            <>
              <input
                type="text"
                placeholder="Search groups..."
                value={groupSearch}
                onChange={(e) => setGroupSearch(e.target.value)}
                style={{ ...styles.input, marginBottom: "10px" }}
              />

              {/* Select All */}
              <button style={styles.selectAllBtn} onClick={toggleAll}>
                {filteredGroups.length > 0 && filteredGroups.every((g) => selectedGroups.includes(g.id))
                  ? <CheckSquare size={15} color="var(--accent)" />
                  : <Square size={15} color="var(--text-muted)" />}
                <span>
                  {filteredGroups.length > 0 && filteredGroups.every((g) => selectedGroups.includes(g.id))
                    ? "Deselect Visible"
                    : "Select Visible"}
                </span>
                <span style={styles.countBadge}>
                  {filteredGroups.filter((g) => selectedGroups.includes(g.id)).length}/{filteredGroups.length}
                </span>
              </button>

              <div style={styles.groupList}>
                {filteredGroups.map((g) => {
                  const active = selectedGroups.includes(g.id);
                  return (
                    <button
                      key={g.id}
                      style={{ ...styles.groupItem, ...(active ? styles.groupItemActive : {}) }}
                      onClick={() => toggleGroup(g.id)}
                    >
                      <div style={styles.groupIcon(active)}>
                        {g.name.charAt(0).toUpperCase()}
                      </div>
                      <span style={styles.groupName}>{g.name}</span>
                      {active
                        ? <CheckSquare size={15} color="var(--accent)" style={{ marginLeft: "auto", flexShrink: 0 }} />
                        : <Square size={15} color="var(--text-muted)" style={{ marginLeft: "auto", flexShrink: 0 }} />}
                    </button>
                  );
                })}
                {filteredGroups.length === 0 && (
                  <div style={styles.emptyGroups}>
                    <Users size={24} color="var(--text-muted)" />
                    <p>No matching groups found.</p>
                  </div>
                )}
              </div>
            </>
          )}
        </Section>

        {/* Summary + Send */}
        <div style={styles.summaryCard}>
          <div style={styles.summaryRow}>
            <span style={styles.summaryLabel}>Groups selected</span>
            <span style={styles.summaryVal}>{selectedGroups.length}</span>
          </div>
          <div style={styles.summaryRow}>
            <span style={styles.summaryLabel}>Poster</span>
            <span style={styles.summaryVal}>{imageFile ? "✓ Ready" : "—"}</span>
          </div>
          <div style={styles.summaryRow}>
            <span style={styles.summaryLabel}>Delivery</span>
            <span style={styles.summaryVal}>
              {scheduleMode === "now" ? "Immediately" : scheduledAt ? new Date(scheduledAt).toLocaleString("en-IN") : "Not set"}
            </span>
          </div>

          <button
            style={{ ...styles.sendBtn, ...(sending ? styles.sendBtnDisabled : {}) }}
            onClick={handleSubmit}
            disabled={sending}
          >
            {sending ? (
              <><Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> Sending...</>
            ) : scheduleMode === "now" ? (
              <><Send size={16} /> Send Broadcast</>
            ) : (
              <><Calendar size={16} /> Schedule Broadcast</>
            )}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

function Section({ title, icon, children, action }) {
  return (
    <div style={sStyles.section}>
      <div style={sStyles.sectionHeader}>
        <span style={sStyles.sectionTitle}>{icon} {title}</span>
        {action}
      </div>
      {children}
    </div>
  );
}

function ToggleBtn({ active, onClick, children }) {
  return (
    <button
      style={{ ...sStyles.toggle, ...(active ? sStyles.toggleActive : {}) }}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

const styles = {
  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "24px",
    alignItems: "start"
  },
  column: { display: "flex", flexDirection: "column", gap: "16px" },
  input: {
    width: "100%",
    background: "var(--bg)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-sm)",
    padding: "10px 14px",
    color: "var(--text)",
    fontSize: "0.9rem",
    transition: "border 0.15s"
  },
  charCount: { textAlign: "right", fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "6px" },
  dropzone: {
    border: "2px dashed var(--border)",
    borderRadius: "var(--radius)",
    padding: "40px 20px",
    display: "flex", flexDirection: "column", alignItems: "center", gap: "8px",
    cursor: "pointer", transition: "border-color 0.15s",
    textAlign: "center"
  },
  dropText: { fontSize: "0.9rem", color: "var(--text-sub)" },
  dropSub: { fontSize: "0.78rem", color: "var(--text-muted)" },
  previewBox: { position: "relative" },
  previewImg: {
    width: "100%", maxHeight: 240, objectFit: "cover",
    borderRadius: "var(--radius-sm)", display: "block"
  },
  removeBtn: {
    display: "flex", alignItems: "center", gap: "5px",
    marginTop: "8px", background: "rgba(239,68,68,0.1)",
    color: "var(--danger)", padding: "5px 12px",
    borderRadius: "var(--radius-sm)", fontSize: "0.8rem",
    border: "1px solid rgba(239,68,68,0.2)"
  },
  scheduleToggle: { display: "flex", gap: "8px" },
  refreshBtn: {
    background: "var(--bg3)", border: "1px solid var(--border)",
    borderRadius: "6px", padding: "4px 8px",
    color: "var(--text-muted)", display: "flex", alignItems: "center"
  },
  loadingGroups: {
    display: "flex", alignItems: "center", gap: "10px",
    color: "var(--text-muted)", fontSize: "0.85rem", padding: "20px 0"
  },
  emptyGroups: {
    display: "flex", flexDirection: "column", alignItems: "center",
    gap: "8px", padding: "24px 0", textAlign: "center", color: "var(--text-sub)"
  },
  selectAllBtn: {
    display: "flex", alignItems: "center", gap: "8px",
    width: "100%", padding: "8px 0",
    background: "transparent", color: "var(--text-sub)",
    fontSize: "0.84rem", borderBottom: "1px solid var(--border)", marginBottom: "6px"
  },
  countBadge: {
    marginLeft: "auto",
    background: "rgba(61,109,255,0.12)",
    color: "var(--accent)",
    padding: "1px 8px", borderRadius: "20px", fontSize: "0.75rem"
  },
  groupList: { maxHeight: 340, overflowY: "auto", display: "flex", flexDirection: "column", gap: "4px" },
  groupItem: {
    display: "flex", alignItems: "center", gap: "10px",
    padding: "9px 10px", borderRadius: "var(--radius-sm)",
    background: "var(--bg)", border: "1px solid transparent",
    textAlign: "left", cursor: "pointer", transition: "all 0.12s"
  },
  groupItemActive: {
    background: "rgba(61,109,255,0.08)",
    border: "1px solid rgba(61,109,255,0.2)"
  },
  groupIcon: (active) => ({
    width: 30, height: 30, borderRadius: "8px", flexShrink: 0,
    background: active ? "rgba(61,109,255,0.2)" : "var(--bg3)",
    color: active ? "var(--accent)" : "var(--text-muted)",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: "0.8rem", fontWeight: 700, fontFamily: "'Syne', sans-serif"
  }),
  groupName: { fontSize: "0.85rem", color: "var(--text)", flex: 1 },
  summaryCard: {
    background: "var(--bg2)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius)",
    padding: "20px"
  },
  summaryRow: {
    display: "flex", justifyContent: "space-between",
    alignItems: "center", padding: "6px 0",
    borderBottom: "1px solid var(--border)"
  },
  summaryLabel: { fontSize: "0.82rem", color: "var(--text-muted)" },
  summaryVal: { fontSize: "0.82rem", color: "var(--text)", fontWeight: 500 },
  sendBtn: {
    width: "100%", marginTop: "16px",
    background: "linear-gradient(135deg, var(--accent), #6e3dff)",
    color: "#fff", padding: "13px",
    borderRadius: "var(--radius-sm)",
    fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "0.95rem",
    display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
    boxShadow: "0 4px 20px var(--accent-glow)", transition: "all 0.2s"
  },
  sendBtnDisabled: { opacity: 0.6, cursor: "not-allowed" }
};

const sStyles = {
  section: {
    background: "var(--bg2)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius)",
    padding: "20px"
  },
  sectionHeader: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    marginBottom: "14px"
  },
  sectionTitle: {
    fontFamily: "'Syne', sans-serif", fontWeight: 600,
    fontSize: "0.9rem", color: "var(--text)"
  },
  toggle: {
    flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
    padding: "9px 14px", borderRadius: "var(--radius-sm)",
    background: "var(--bg)", border: "1px solid var(--border)",
    color: "var(--text-muted)", fontSize: "0.84rem", cursor: "pointer", transition: "all 0.15s"
  },
  toggleActive: {
    background: "rgba(61,109,255,0.12)",
    border: "1px solid rgba(61,109,255,0.3)",
    color: "var(--accent)"
  }
};
