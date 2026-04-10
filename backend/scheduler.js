// scheduler.js — Manages scheduled broadcast jobs

const schedule = require("node-schedule");
const { sendBroadcast } = require("./whatsapp");

// In-memory store (persists as long as server is running)
// For production, swap this with a JSON file or SQLite
const broadcasts = new Map(); // id -> broadcast object
const jobs = new Map();       // id -> node-schedule job

function addBroadcast(broadcast) {
  broadcasts.set(broadcast.id, broadcast);

  if (broadcast.scheduledAt) {
    const fireDate = new Date(broadcast.scheduledAt);
    if (fireDate > new Date()) {
      const job = schedule.scheduleJob(fireDate, async () => {
        await executeBroadcast(broadcast.id);
      });
      jobs.set(broadcast.id, job);
      console.log(`[Scheduler] Scheduled broadcast ${broadcast.id} at ${fireDate}`);
    }
  }
}

async function executeBroadcast(id) {
  const broadcast = broadcasts.get(id);
  if (!broadcast) return;

  broadcast.status = "sending";
  console.log(`[Scheduler] Executing broadcast ${id}`);

  try {
    const results = await sendBroadcast({
      imagePath: broadcast.imagePath,
      caption: broadcast.caption,
      groupIds: broadcast.groupIds
    });

    broadcast.status = "sent";
    broadcast.sentAt = new Date().toISOString();
    broadcast.results = results;
    console.log(`[Scheduler] Broadcast ${id} completed`);
  } catch (err) {
    broadcast.status = "failed";
    broadcast.error = err.message;
    console.error(`[Scheduler] Broadcast ${id} failed:`, err.message);
  }
}

async function sendNow(id) {
  // Cancel any existing scheduled job
  if (jobs.has(id)) {
    jobs.get(id).cancel();
    jobs.delete(id);
  }
  await executeBroadcast(id);
}

function cancelBroadcast(id) {
  if (jobs.has(id)) {
    jobs.get(id).cancel();
    jobs.delete(id);
  }
  const broadcast = broadcasts.get(id);
  if (broadcast) broadcast.status = "cancelled";
}

function getAllBroadcasts() {
  return Array.from(broadcasts.values()).sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );
}

function getBroadcast(id) {
  return broadcasts.get(id);
}

module.exports = { addBroadcast, sendNow, cancelBroadcast, getAllBroadcasts, getBroadcast };
