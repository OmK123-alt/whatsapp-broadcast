// whatsapp.js — Manages the WhatsApp Web client lifecycle

const { Client, LocalAuth, MessageMedia } = require("whatsapp-web.js");
const qrcode = require("qrcode");
const path = require("path");
const fs = require("fs");

let client = null;
let qrCodeData = null;       // base64 PNG of the QR
let connectionStatus = "disconnected"; // disconnected | qr_ready | connected
let connectedGroups = [];    // cached list of groups

function initClient() {
  client = new Client({
    authStrategy: new LocalAuth({ dataPath: path.join(__dirname, ".wwebjs_auth") }),
    puppeteer: {
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--no-first-run",
        "--no-zygote",
        "--single-process",
        "--disable-gpu"
      ]
    }
  });

  client.on("qr", async (qr) => {
    connectionStatus = "qr_ready";
    qrCodeData = await qrcode.toDataURL(qr);
    console.log("[WA] QR code generated — scan with WhatsApp");
  });

  client.on("ready", async () => {
    connectionStatus = "connected";
    qrCodeData = null;
    console.log("[WA] Client ready ✓");
    await refreshGroups();
  });

  client.on("authenticated", () => {
    console.log("[WA] Authenticated ✓");
  });

  client.on("auth_failure", (msg) => {
    connectionStatus = "disconnected";
    console.error("[WA] Auth failure:", msg);
  });

  client.on("disconnected", (reason) => {
    connectionStatus = "disconnected";
    connectedGroups = [];
    console.log("[WA] Disconnected:", reason);
    // Auto-reinitialize after 5 seconds
    setTimeout(() => initClient(), 5000);
  });

  client.initialize();
}

async function refreshGroups() {
  try {
    const chats = await client.getChats();
    connectedGroups = chats
      .filter((c) => c.isGroup)
      .map((c) => ({ id: c.id._serialized, name: c.name }))
      .sort((a, b) => a.name.localeCompare(b.name));
    console.log(`[WA] Loaded ${connectedGroups.length} groups`);
    return connectedGroups;
  } catch (err) {
    console.error("[WA] Failed to load groups:", err.message);
    return [];
  }
}

// Send image + caption to a list of group IDs
async function sendBroadcast({ imagePath, caption, groupIds }) {
  if (connectionStatus !== "connected") {
    throw new Error("WhatsApp is not connected");
  }

  const media = MessageMedia.fromFilePath(imagePath);
  const results = [];

  for (const groupId of groupIds) {
    try {
      await client.sendMessage(groupId, media, { caption });
      results.push({ groupId, status: "sent" });
      console.log(`[WA] Sent to ${groupId}`);
      // Small delay to avoid rate limiting
      await new Promise((r) => setTimeout(r, 1200));
    } catch (err) {
      results.push({ groupId, status: "failed", error: err.message });
      console.error(`[WA] Failed for ${groupId}:`, err.message);
    }
  }

  return results;
}

function getStatus() {
  return connectionStatus;
}

function getQR() {
  return qrCodeData;
}

function getGroups() {
  return connectedGroups;
}

module.exports = { initClient, sendBroadcast, refreshGroups, getStatus, getQR, getGroups };
