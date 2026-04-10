const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");

const wa = require("./whatsapp");
const scheduler = require("./scheduler");
const telegramScheduler = require("./telegramScheduler");
const { hasTelegramBotToken } = require("./telegram");
const lectureUpdates = require("./lectureUpdates");

const app = express();
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin@sharda";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Sharda@2026!WA";
const AUTH_TOKEN = process.env.AUTH_TOKEN || "wa-portal-auth-token";

function getAllowedOrigins() {
  const envOrigins = (process.env.FRONTEND_URL || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  return [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    ...envOrigins
  ];
}

function isAllowedVercelOrigin(origin) {
  try {
    const host = new URL(origin).hostname;
    return host.endsWith(".vercel.app");
  } catch {
    return false;
  }
}

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      if (getAllowedOrigins().includes(origin)) return callback(null, true);
      if (isAllowedVercelOrigin(origin)) return callback(null, true);
      return callback(new Error("CORS origin not allowed"));
    }
  })
);
app.use(express.json());

app.post("/api/auth/login", async (req, res) => {
  const { username, password } = req.body || {};
  if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: "Invalid credentials" });
  }
  try {
    // Fresh login starts with a fresh WhatsApp session.
    await wa.logoutClient();
  } catch (err) {
    console.error("[Auth] WhatsApp logout on login failed:", err.message);
  }
  return res.json({
    token: AUTH_TOKEN,
    user: { username: ADMIN_USERNAME }
  });
});

app.get("/api/auth/me", (req, res) => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (token !== AUTH_TOKEN) return res.status(401).json({ error: "Unauthorized" });
  return res.json({ user: { username: ADMIN_USERNAME } });
});

app.post("/api/auth/logout", async (req, res) => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (token !== AUTH_TOKEN) return res.status(401).json({ error: "Unauthorized" });

  try {
    await wa.logoutClient();
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.use("/api", (req, res, next) => {
  if (req.path === "/auth/login" || req.path === "/auth/me" || req.path === "/auth/logout") return next();
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (token !== AUTH_TOKEN) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  return next();
});

const UPLOADS_DIR = process.env.VERCEL
  ? path.join("/tmp", "uploads")
  : path.join(__dirname, "uploads");

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

app.use("/uploads", express.static(UPLOADS_DIR));

const storage = multer.diskStorage({
  destination: UPLOADS_DIR,
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${uuidv4()}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 16 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp/;
    if (allowed.test(path.extname(file.originalname).toLowerCase())) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  }
});

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

app.get("/api/wa/groups", async (req, res) => {
  try {
    if (wa.getStatus() !== "connected") {
      return res.json([]);
    }

    const timeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Timeout fetching groups")), 15000)
    );
    const groups = await Promise.race([wa.refreshGroups(), timeout]);
    res.json(groups);
  } catch (err) {
    console.error("[Groups] Error:", err.message);
    res.json(wa.getGroups());
  }
});

app.post("/api/broadcasts", upload.single("image"), async (req, res) => {
  try {
    const { caption, groupIds, scheduledAt, batchName } = req.body;

    if (!req.file) return res.status(400).json({ error: "Image is required" });
    if (!caption) return res.status(400).json({ error: "Caption is required" });

    const parsedGroups = JSON.parse(groupIds || "[]");
    if (!parsedGroups.length) {
      return res.status(400).json({ error: "Select at least one batch" });
    }

    const broadcast = {
      id: uuidv4(),
      platform: "whatsapp",
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
    if (!scheduledAt) await scheduler.sendNow(broadcast.id);

    res.json(scheduler.getBroadcast(broadcast.id));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/broadcasts", (req, res) => {
  res.json(scheduler.getAllBroadcasts());
});

app.get("/api/broadcasts/:id", (req, res) => {
  const b = scheduler.getBroadcast(req.params.id);
  if (!b) return res.status(404).json({ error: "Not found" });
  res.json(b);
});

app.delete("/api/broadcasts/:id", (req, res) => {
  scheduler.cancelBroadcast(req.params.id);
  res.json({ success: true });
});

app.get("/api/telegram/status", (req, res) => {
  res.json({
    connected: hasTelegramBotToken()
  });
});

app.post("/api/telegram/broadcasts", upload.single("image"), async (req, res) => {
  try {
    const { caption, targetIds, scheduledAt, campaignName } = req.body;
    const parsedTargets = JSON.parse(targetIds || "[]");

    if (!caption?.trim()) return res.status(400).json({ error: "Message is required" });
    if (!parsedTargets.length) return res.status(400).json({ error: "Add at least one chat/channel id" });

    const broadcast = {
      id: uuidv4(),
      platform: "telegram",
      campaignName: campaignName || "Telegram Campaign",
      caption,
      targetIds: parsedTargets,
      imagePath: req.file?.path || null,
      imageUrl: req.file ? `/uploads/${req.file.filename}` : null,
      scheduledAt: scheduledAt || null,
      status: scheduledAt ? "scheduled" : "pending",
      createdAt: new Date().toISOString(),
      sentAt: null,
      results: []
    };

    telegramScheduler.addTelegramBroadcast(broadcast);
    if (!scheduledAt) await telegramScheduler.sendNow(broadcast.id);

    res.json(telegramScheduler.getBroadcast(broadcast.id));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/telegram/broadcasts", (req, res) => {
  res.json(telegramScheduler.getAllBroadcasts());
});

app.get("/api/telegram/broadcasts/:id", (req, res) => {
  const b = telegramScheduler.getBroadcast(req.params.id);
  if (!b) return res.status(404).json({ error: "Not found" });
  res.json(b);
});

app.delete("/api/telegram/broadcasts/:id", (req, res) => {
  telegramScheduler.cancelBroadcast(req.params.id);
  res.json({ success: true });
});

app.get("/api/lecture-updates", (req, res) => {
  res.json(lectureUpdates.getAllLectureUpdates());
});

app.post("/api/lecture-updates", async (req, res) => {
  try {
    const {
      batchId,
      batchName,
      lectureDate,
      monthlyPlan,
      subjectUpdates
    } = req.body;

    if (!batchId || !batchName) {
      return res.status(400).json({ error: "Batch is required" });
    }

    if (!lectureDate) {
      return res.status(400).json({ error: "Lecture date is required" });
    }

    if (!Array.isArray(monthlyPlan) || monthlyPlan.length === 0) {
      return res.status(400).json({ error: "At least one monthly plan is required" });
    }

    for (const monthItem of monthlyPlan) {
      const month = monthItem?.month?.trim();
      const subjects = Array.isArray(monthItem?.subjects)
        ? monthItem.subjects.map((s) => (s || "").trim()).filter(Boolean)
        : [];

      if (!month) {
        return res.status(400).json({ error: "Each plan row needs a month name" });
      }
      if (subjects.length !== 2) {
        return res.status(400).json({ error: "Each month must have exactly 2 subjects" });
      }
    }

    if (!Array.isArray(subjectUpdates) || subjectUpdates.length === 0) {
      return res.status(400).json({ error: "Please configure Yes/No per subject" });
    }

    const normalizedUpdates = [];
    for (const item of subjectUpdates) {
      const subject = (item?.subject || "").trim();
      const status = (item?.status || "").toLowerCase();
      const time = (item?.time || "").trim();

      if (!subject) {
        return res.status(400).json({ error: "Each subject update needs subject name" });
      }
      if (status !== "yes" && status !== "no") {
        return res.status(400).json({ error: `Please select Yes/No for ${subject}` });
      }
      if (status === "yes" && !time) {
        return res.status(400).json({ error: `Please enter time for ${subject}` });
      }

      normalizedUpdates.push({
        subject,
        status,
        time: status === "yes" ? time : null
      });
    }

    const notificationMessages = normalizedUpdates.map((item) =>
      item.status === "yes"
        ? `${item.subject} चे lecture उद्या ${item.time} ला असेल`
        : `उद्या ${item.subject} चया lecture ला सुट्टी असेल`
    );

    let notificationResults = [];
    for (const message of notificationMessages) {
      const result = await wa.sendTextBroadcast({
        caption: message,
        groupIds: [batchId]
      });
      notificationResults = notificationResults.concat(result);
    }

    const saved = lectureUpdates.addLectureUpdate({
      platform: "lecture-updates",
      batchId,
      batchName,
      lectureDate,
      monthlyPlan,
      subjectUpdates: normalizedUpdates,
      notificationMessages,
      notificationResults
    });

    res.json(saved);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/lecture-updates/:id", (req, res) => {
  lectureUpdates.deleteLectureUpdate(req.params.id);
  res.json({ success: true });
});

function initWhatsAppOnce() {
  if (global.__WA_INITIALIZED__) return;

  global.__WA_INITIALIZED__ = true;
  setTimeout(() => {
    try {
      wa.initClient();
    } catch (err) {
      console.error("[Server] Failed to start WhatsApp client:", err.message);
    }
  }, 3000);
}

module.exports = {
  app,
  initWhatsAppOnce
};
