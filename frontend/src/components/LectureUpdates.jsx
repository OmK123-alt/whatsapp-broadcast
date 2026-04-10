import React, { useEffect, useMemo, useState } from "react";
import api from "../api";
import toast from "react-hot-toast";
import { Calendar, CheckCircle2, Plus, Trash2, XCircle } from "lucide-react";

function tomorrowDateInput() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

export default function LectureUpdates() {
  const [groups, setGroups] = useState([]);
  const [history, setHistory] = useState([]);
  const [batchId, setBatchId] = useState("");
  const [batchSearch, setBatchSearch] = useState("");
  const [lectureDate, setLectureDate] = useState(tomorrowDateInput());
  const [monthlyPlan, setMonthlyPlan] = useState([
    { month: "Month 1", subjects: ["", ""] },
    { month: "Month 2", subjects: ["", ""] }
  ]);
  const [subjectUpdates, setSubjectUpdates] = useState({});
  const [saving, setSaving] = useState(false);

  const selectedBatch = useMemo(
    () => groups.find((g) => g.id === batchId),
    [groups, batchId]
  );
  const filteredGroups = useMemo(
    () => groups.filter((g) => g.name.toLowerCase().includes(batchSearch.toLowerCase())),
    [groups, batchSearch]
  );
  const subjectOptions = useMemo(() => {
    const all = monthlyPlan.flatMap((m) => m.subjects || []);
    return Array.from(new Set(all.map((s) => s.trim()).filter(Boolean)));
  }, [monthlyPlan]);

  useEffect(() => {
    setSubjectUpdates((prev) => {
      const next = {};
      subjectOptions.forEach((subject) => {
        next[subject] = prev[subject] || { status: "no", time: "" };
      });
      return next;
    });
  }, [subjectOptions]);

  useEffect(() => {
    loadGroups();
    loadHistory();
  }, []);

  const loadGroups = async () => {
    try {
      const { data } = await api.get("/api/wa/groups", { timeout: 20000 });
      setGroups(data || []);
    } catch {
      setGroups([]);
      toast.error("Could not load WhatsApp batches");
    }
  };

  const loadHistory = async () => {
    try {
      const { data } = await api.get("/api/lecture-updates");
      setHistory(data || []);
    } catch {
      toast.error("Could not load lecture updates");
    }
  };

  const setMonthField = (index, field, value) => {
    setMonthlyPlan((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  const setSubject = (monthIndex, subjectIndex, value) => {
    setMonthlyPlan((prev) =>
      prev.map((item, i) => {
        if (i !== monthIndex) return item;
        const updatedSubjects = [...item.subjects];
        updatedSubjects[subjectIndex] = value;
        return { ...item, subjects: updatedSubjects };
      })
    );
  };

  const addMonth = () => {
    setMonthlyPlan((prev) => [
      ...prev,
      { month: `Month ${prev.length + 1}`, subjects: ["", ""] }
    ]);
  };

  const removeMonth = (index) => {
    setMonthlyPlan((prev) => prev.filter((_, i) => i !== index));
  };

  const saveUpdate = async () => {
    if (!batchId) return toast.error("Please select a batch");
    if (!lectureDate) return toast.error("Please select lecture date");

    const normalizedPlan = monthlyPlan.map((m) => ({
      month: (m.month || "").trim(),
      subjects: (m.subjects || []).map((s) => (s || "").trim()).filter(Boolean)
    }));

    if (normalizedPlan.length === 0) {
      return toast.error("Please add at least one month plan");
    }
    if (normalizedPlan.some((m) => !m.month || m.subjects.length !== 2)) {
      return toast.error("Each month must have a name and exactly 2 subjects");
    }
    if (subjectOptions.length === 0) return toast.error("Please add subjects first");

    const normalizedSubjectUpdates = subjectOptions.map((subject) => {
      const cfg = subjectUpdates[subject] || { status: "no", time: "" };
      return {
        subject,
        status: cfg.status,
        time: cfg.status === "yes" ? (cfg.time || "").trim() : null
      };
    });

    const missingTime = normalizedSubjectUpdates.find((item) => item.status === "yes" && !item.time);
    if (missingTime) {
      return toast.error(`Please enter time for ${missingTime.subject}`);
    }

    setSaving(true);
    try {
      await api.post("/api/lecture-updates", {
        batchId,
        batchName: selectedBatch?.name || "Unknown Batch",
        lectureDate,
        monthlyPlan: normalizedPlan,
        subjectUpdates: normalizedSubjectUpdates
      });
      toast.success("Lecture update saved");
      loadHistory();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to save lecture update");
    } finally {
      setSaving(false);
    }
  };

  const deleteUpdate = async (id) => {
    try {
      await api.delete(`/api/lecture-updates/${id}`);
      setHistory((prev) => prev.filter((item) => item.id !== id));
      toast.success("Lecture update removed");
    } catch {
      toast.error("Failed to remove update");
    }
  };

  return (
    <div style={styles.grid}>
      <div style={styles.card}>
        <h3 style={styles.title}>Lecture Updates Planner</h3>

        <label style={styles.label}>Select Batch</label>
        <input
          type="text"
          value={batchSearch}
          onChange={(e) => setBatchSearch(e.target.value)}
          placeholder="Search batch..."
          style={styles.input}
        />
        <select value={batchId} onChange={(e) => setBatchId(e.target.value)} style={styles.input}>
          <option value="">Choose batch...</option>
          {filteredGroups.map((group) => (
            <option value={group.id} key={group.id}>
              {group.name}
            </option>
          ))}
        </select>

        <label style={styles.label}>Lecture Date</label>
        <input type="date" value={lectureDate} onChange={(e) => setLectureDate(e.target.value)} style={styles.input} />

        <div style={styles.monthHeader}>
          <h4 style={styles.subTitle}>Monthly Subject Plan (2 subjects per month)</h4>
          <button style={styles.addBtn} onClick={addMonth}>
            <Plus size={14} /> Add Month
          </button>
        </div>

        <div style={styles.monthList}>
          {monthlyPlan.map((monthItem, index) => (
            <div key={index} style={styles.monthCard}>
              <div style={styles.monthTop}>
                <input
                  value={monthItem.month}
                  onChange={(e) => setMonthField(index, "month", e.target.value)}
                  style={styles.monthInput}
                  placeholder="Month name"
                />
                {monthlyPlan.length > 1 && (
                  <button style={styles.deleteIconBtn} onClick={() => removeMonth(index)}>
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
              <input
                value={monthItem.subjects[0]}
                onChange={(e) => setSubject(index, 0, e.target.value)}
                style={styles.input}
                placeholder="Subject 1"
              />
              <input
                value={monthItem.subjects[1]}
                onChange={(e) => setSubject(index, 1, e.target.value)}
                style={styles.input}
                placeholder="Subject 2"
              />
            </div>
          ))}
        </div>

        <div style={styles.monthHeader}>
          <h4 style={styles.subTitle}>Tomorrow Subject Decision (Yes/No + Time)</h4>
        </div>
        {subjectOptions.length === 0 ? (
          <p style={styles.meta}>Add subjects above to configure messages.</p>
        ) : (
          <div style={styles.subjectDecisionList}>
            {subjectOptions.map((subject) => {
              const cfg = subjectUpdates[subject] || { status: "no", time: "" };
              return (
                <div key={subject} style={styles.subjectDecisionCard}>
                  <div style={styles.subjectRow}>
                    <p style={styles.batchName}>{subject}</p>
                    <div style={styles.toggleRow}>
                      <button
                        style={{ ...styles.toggle, ...(cfg.status === "yes" ? styles.toggleActiveYes : {}) }}
                        onClick={() =>
                          setSubjectUpdates((prev) => ({
                            ...prev,
                            [subject]: { ...cfg, status: "yes", time: cfg.time || "8:00 PM" }
                          }))
                        }
                      >
                        <CheckCircle2 size={14} /> Yes
                      </button>
                      <button
                        style={{ ...styles.toggle, ...(cfg.status === "no" ? styles.toggleActiveNo : {}) }}
                        onClick={() =>
                          setSubjectUpdates((prev) => ({
                            ...prev,
                            [subject]: { ...cfg, status: "no", time: "" }
                          }))
                        }
                      >
                        <XCircle size={14} /> No
                      </button>
                    </div>
                  </div>
                  {cfg.status === "yes" && (
                    <input
                      type="text"
                      value={cfg.time}
                      onChange={(e) =>
                        setSubjectUpdates((prev) => ({
                          ...prev,
                          [subject]: { ...cfg, time: e.target.value }
                        }))
                      }
                      style={styles.input}
                      placeholder="e.g. 8:00 PM"
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}

        <button style={{ ...styles.saveBtn, ...(saving ? styles.saveBtnDisabled : {}) }} onClick={saveUpdate} disabled={saving}>
          <Calendar size={15} /> {saving ? "Saving..." : "Save Lecture Update"}
        </button>
      </div>

      <div style={styles.card}>
        <h3 style={styles.title}>Saved Lecture Updates</h3>
        {history.length === 0 ? (
          <p style={styles.empty}>No lecture updates yet.</p>
        ) : (
          <div style={styles.historyList}>
            {history.map((item) => (
              <div key={item.id} style={styles.historyCard}>
                <div style={styles.historyTop}>
                  <div>
                    <p style={styles.batchName}>{item.batchName}</p>
                    <p style={styles.meta}>
                      Date: {item.lectureDate}
                    </p>
                  </div>
                  <button style={styles.deleteIconBtn} onClick={() => deleteUpdate(item.id)}>
                    <Trash2 size={14} />
                  </button>
                </div>
                <div style={styles.planList}>
                  {(item.monthlyPlan || []).map((month, i) => (
                    <p key={i} style={styles.meta}>
                      {month.month}: {month.subjects.join(" + ")}
                    </p>
                  ))}
                  {(item.notificationMessages || []).map((msg, i) => (
                    <p key={`msg-${i}`} style={styles.notice}>Msg: {msg}</p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  grid: {
    display: "grid",
    gridTemplateColumns: "1.2fr 1fr",
    gap: "20px",
    alignItems: "start"
  },
  card: {
    background: "var(--bg2)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius)",
    padding: "18px",
    display: "flex",
    flexDirection: "column",
    gap: "10px"
  },
  title: {
    fontFamily: "'Syne', sans-serif",
    color: "var(--text)"
  },
  subTitle: {
    fontSize: "0.85rem",
    color: "var(--text-sub)"
  },
  label: {
    marginTop: "4px",
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
  toggleRow: {
    display: "flex",
    gap: "8px"
  },
  toggle: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    border: "1px solid var(--border)",
    borderRadius: "8px",
    padding: "8px 12px",
    background: "var(--bg)",
    color: "var(--text-muted)"
  },
  toggleActiveYes: {
    borderColor: "rgba(34,197,94,0.35)",
    color: "#22c55e",
    background: "rgba(34,197,94,0.12)"
  },
  toggleActiveNo: {
    borderColor: "rgba(239,68,68,0.35)",
    color: "#ef4444",
    background: "rgba(239,68,68,0.12)"
  },
  monthHeader: {
    marginTop: "6px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },
  addBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    borderRadius: "8px",
    border: "1px solid var(--border)",
    background: "var(--bg)",
    color: "var(--text-sub)",
    padding: "7px 10px"
  },
  monthList: {
    display: "flex",
    flexDirection: "column",
    gap: "8px"
  },
  subjectDecisionList: {
    display: "flex",
    flexDirection: "column",
    gap: "8px"
  },
  subjectDecisionCard: {
    border: "1px solid var(--border)",
    borderRadius: "8px",
    padding: "10px",
    background: "var(--bg)"
  },
  subjectRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "10px",
    marginBottom: "8px"
  },
  monthCard: {
    border: "1px solid var(--border)",
    borderRadius: "8px",
    padding: "10px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    background: "var(--bg)"
  },
  monthTop: {
    display: "flex",
    gap: "8px",
    alignItems: "center"
  },
  monthInput: {
    flex: 1,
    background: "var(--bg2)",
    border: "1px solid var(--border)",
    borderRadius: "8px",
    padding: "8px 10px",
    color: "var(--text)"
  },
  deleteIconBtn: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    border: "1px solid rgba(239,68,68,0.35)",
    background: "rgba(239,68,68,0.12)",
    color: "#ef4444",
    borderRadius: "8px",
    padding: "7px"
  },
  saveBtn: {
    marginTop: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    borderRadius: "8px",
    padding: "12px 14px",
    color: "#fff",
    background: "linear-gradient(135deg, var(--accent), #6e3dff)",
    fontFamily: "'Syne', sans-serif",
    fontWeight: 700
  },
  saveBtnDisabled: {
    opacity: 0.6,
    cursor: "not-allowed"
  },
  empty: {
    color: "var(--text-muted)",
    fontSize: "0.85rem"
  },
  historyList: {
    display: "flex",
    flexDirection: "column",
    gap: "10px"
  },
  historyCard: {
    border: "1px solid var(--border)",
    borderRadius: "8px",
    padding: "10px",
    background: "var(--bg)"
  },
  historyTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "10px"
  },
  batchName: {
    color: "var(--text)",
    fontWeight: 600
  },
  meta: {
    color: "var(--text-muted)",
    fontSize: "0.8rem",
    marginTop: "3px"
  },
  notice: {
    color: "var(--accent)",
    fontSize: "0.8rem",
    marginTop: "5px"
  },
  planList: {
    marginTop: "6px"
  }
};
