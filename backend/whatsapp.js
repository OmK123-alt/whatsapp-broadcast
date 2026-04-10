// whatsapp.js — Manages the WhatsApp Web client lifecycle

const { Client, LocalAuth, MessageMedia } = require("whatsapp-web.js");
const qrcode = require("qrcode");
const path = require("path");

let client = null;
let qrCodeData = null;
let connectionStatus = "disconnected";
let connectedGroups = [];
let isInitializing = false;

function initClient() {
  if (isInitializing) return;
  isInitializing = true;

  console.log("[WA] Creating client...");

  client = new Client({
    authStrategy: new LocalAuth({
      clientId: "sharda-academy",
      dataPath: path.join(__dirname, ".wwebjs_auth")
    }),
    bypassCSP: true,
    restartOnAuthFail: true,
    puppeteer: {
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--no-first-run",
        "--no-zygote",
        "--disable-extensions"
      ]
    }
  });

  client.on("loading_screen", (percent, message) => {
    console.log(`[WA] Loading: ${percent}% — ${message}`);
  });

  client.on("qr", async (qr) => {
    connectionStatus = "qr_ready";
    isInitializing = false;
    qrCodeData = await qrcode.toDataURL(qr);
    console.log("[WA] QR code ready — scan with WhatsApp");
  });

  client.on("authenticated", () => {
    console.log("[WA] Authenticated");
  });

  client.on("ready", async () => {
    connectionStatus = "connected";
    isInitializing = false;
    qrCodeData = null;
    console.log("[WA] Client ready!");
    console.log("[WA] Loading groups in 20 seconds...");
    setTimeout(async () => {
      await refreshGroups();
    }, 20000);
  });

  client.on("auth_failure", (msg) => {
    console.error("[WA] Auth failure:", msg);
    connectionStatus = "disconnected";
    isInitializing = false;
    setTimeout(() => initClient(), 10000);
  });

  client.on("disconnected", (reason) => {
    console.log("[WA] Disconnected:", reason);
    connectionStatus = "disconnected";
    isInitializing = false;
    connectedGroups = [];
    setTimeout(() => initClient(), 8000);
  });

  client.initialize().catch((err) => {
    console.error("[WA] Init error:", err.message);
    connectionStatus = "disconnected";
    isInitializing = false;
    console.log("[WA] Retrying in 10 seconds...");
    setTimeout(() => initClient(), 10000);
  });
}

async function refreshGroups() {
  try {
    console.log("[WA] Fetching groups...");

    // Use WWebJS's own injected window function — most reliable
    const groups = await client.pupPage.evaluate(async () => {
      // Give store time if needed
      await new Promise(r => setTimeout(r, 2000));

      // Try WWebJS injected helper first
      if (window.WWebJS && window.WWebJS.getChats) {
        const chats = await window.WWebJS.getChats();
        return chats
          .filter(c => c.isGroup)
          .map(c => ({ id: c.id._serialized, name: c.name || "Unnamed" }));
      }

      // Try all known store paths
      const storeAttempts = [
        () => window.Store?.Chat?.models,
        () => window.Store?.Chat?._models,
        () => window.Store?.Chat?.getModelsArray?.(),
        () => window.Store?.Conn?.wid && window.Store?.Chat?.findAll?.(),
      ];

      for (const attempt of storeAttempts) {
        try {
          const models = attempt();
          if (!models) continue;
          const arr = Array.isArray(models) ? models : Object.values(models);
          if (arr.length === 0) continue;
          const result = arr
            .filter(c => c && c.isGroup && c.id?._serialized)
            .map(c => ({ id: c.id._serialized, name: c.name || c.formattedTitle || "Unnamed" }));
          if (result.length > 0) return result;
        } catch(e) { continue; }
      }
      return [];
    });

    if (groups && groups.length > 0) {
      connectedGroups = groups.sort((a, b) => a.name.localeCompare(b.name));
      console.log(`[WA] Loaded ${connectedGroups.length} groups`);
      return connectedGroups;
    }

    // Last resort: getChats with 60s timeout
    console.log("[WA] Trying getChats() with 60s timeout...");
    const chats = await Promise.race([
      client.getChats(),
      new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), 60000))
    ]);
    connectedGroups = chats
      .filter(c => c.isGroup)
      .map(c => ({ id: c.id._serialized, name: c.name || "Unnamed" }))
      .sort((a, b) => a.name.localeCompare(b.name));
    console.log(`[WA] Loaded ${connectedGroups.length} groups via getChats`);
    return connectedGroups;

  } catch (err) {
    console.error("[WA] Groups error:", err.message);
    // Auto retry after 20 seconds
    console.log("[WA] Will retry groups in 20 seconds...");
    setTimeout(() => refreshGroups(), 20000);
    return connectedGroups;
  }
}

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
      await new Promise((r) => setTimeout(r, 1500));
    } catch (err) {
      results.push({ groupId, status: "failed", error: err.message });
      console.error(`[WA] Failed for ${groupId}:`, err.message);
    }
  }

  return results;
}

function getStatus() { return connectionStatus; }
function getQR()     { return qrCodeData; }
function getGroups() { return connectedGroups; }

module.exports = { initClient, sendBroadcast, refreshGroups, getStatus, getQR, getGroups };
