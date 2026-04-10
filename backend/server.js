// server.js — Express API server

const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");

const wa = require("./whatsapp");
const scheduler = require("./scheduler");

const app = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ─────────────────────────────────────────────────────────────
app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

// Serve uploaded images statically
const UPLOADS_DIR = path.join(__dirname, "uploads");
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR);
app.use("/uploads", express.static(UPLOADS_DIR));

// ── Multer (image uploads) ─────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: UPLOADS_DIR,
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${uuidv4()}${ext}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 16 * 1024 * 1024 }, // 16 MB
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp/;
    if (allowed.test(path.extname(file.originalname).toLowerCase())) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  }
});

// ── WhatsApp Routes ────────────────────────────────────────────────────────

// GET /api/wa/status  → { status, qr? }
app.get("/api/wa/status", (req, res) => {
  try {
    res.json({
      status: wa.getStatus(),
      qr: wa.getQR()
    });
  } catch (err) {
    res.json({ status: "disconnected", qr: null });
  }
});

// GET /api/wa/groups  → [{ id, name }]
app.get("/api/wa/groups", async (req, res) => {
  try {
    if (wa.getStatus() !== "connected") {
      return res.json([]);
    }
    // Timeout after 15 seconds
    const timeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Timeout fetching groups")), 15000)
    );
    const groups = await Promise.race([wa.refreshGroups(), timeout]);
    res.json(groups);
  } catch (err) {
    console.error("[Groups] Error:", err.message);
    // Return cached groups if available, else empty
    res.json(wa.getGroups());
  }
});

// ── Broadcast Routes ───────────────────────────────────────────────────────

// POST /api/broadcasts  — create a new broadcast
// Body: multipart/form-data  { image, caption, groupIds (JSON array), scheduledAt? }
app.post("/api/broadcasts", upload.single("image"), async (req, res) => {
  try {
    const { caption, groupIds, scheduledAt, batchName } = req.body;
    if (!req.file) return res.status(400).json({ error: "Image is required" });
    if (!caption)  return res.status(400).json({ error: "Caption is required" });

    const parsedGroups = JSON.parse(groupIds || "[]");
    if (!parsedGroups.length) return res.status(400).json({ error: "Select at least one batch" });

    const broadcast = {
      id: uuidv4(),
      batchName: batchName || "Unnamed Batch",
      caption,
      groupIds: parsedGroups,
      imagePath: req.file.path,
      imageUrl: `/uploads/${req.file.filename}`,
      scheduledAt: scheduledAt || null,
      status: scheduledAt ? "scheduled" : "pending",
      createdAt: new Date().toISOString(),
      sentAt: null,
      results: []
    };

    scheduler.addBroadcast(broadcast);

    // If no schedule, send immediately
    if (!scheduledAt) {
      await scheduler.sendNow(broadcast.id);
    }

    res.json(scheduler.getBroadcast(broadcast.id));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/broadcasts  → list all
app.get("/api/broadcasts", (req, res) => {
  res.json(scheduler.getAllBroadcasts());
});

// GET /api/broadcasts/:id
app.get("/api/broadcasts/:id", (req, res) => {
  const b = scheduler.getBroadcast(req.params.id);
  if (!b) return res.status(404).json({ error: "Not found" });
  res.json(b);
});

// DELETE /api/broadcasts/:id  → cancel scheduled
app.delete("/api/broadcasts/:id", (req, res) => {
  scheduler.cancelBroadcast(req.params.id);
  res.json({ success: true });
});

// ── Start ──────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 Sharda Academy Broadcast Server running on http://localhost:${PORT}`);
  console.log("📱 Initializing WhatsApp client in 3 seconds...\n");
  // Delay startup so Express is fully ready before Puppeteer launches
  setTimeout(() => {
    try {
      wa.initClient();
    } catch (err) {
      console.error("[Server] Failed to start WhatsApp client:", err.message);
    }
  }, 3000);
});
