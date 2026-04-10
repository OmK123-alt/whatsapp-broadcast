const schedule = require("node-schedule");
const { sendTelegramBroadcast } = require("./telegram");

const telegramBroadcasts = new Map();
const telegramJobs = new Map();

function addTelegramBroadcast(broadcast) {
  telegramBroadcasts.set(broadcast.id, broadcast);

  if (broadcast.scheduledAt) {
    const fireDate = new Date(broadcast.scheduledAt);
    if (fireDate > new Date()) {
      const job = schedule.scheduleJob(fireDate, async () => {
        await executeTelegramBroadcast(broadcast.id);
      });
      telegramJobs.set(broadcast.id, job);
      console.log(`[TelegramScheduler] Scheduled broadcast ${broadcast.id} at ${fireDate}`);
    }
  }
}

async function executeTelegramBroadcast(id) {
  const broadcast = telegramBroadcasts.get(id);
  if (!broadcast) return;

  broadcast.status = "sending";
  console.log(`[TelegramScheduler] Executing broadcast ${id}`);

  try {
    const results = await sendTelegramBroadcast({
      caption: broadcast.caption,
      targetIds: broadcast.targetIds,
      imagePath: broadcast.imagePath
    });

    broadcast.status = "sent";
    broadcast.sentAt = new Date().toISOString();
    broadcast.results = results;
  } catch (err) {
    broadcast.status = "failed";
    broadcast.error = err.message;
  }
}

async function sendNow(id) {
  if (telegramJobs.has(id)) {
    telegramJobs.get(id).cancel();
    telegramJobs.delete(id);
  }
  await executeTelegramBroadcast(id);
}

function cancelBroadcast(id) {
  if (telegramJobs.has(id)) {
    telegramJobs.get(id).cancel();
    telegramJobs.delete(id);
  }
  const broadcast = telegramBroadcasts.get(id);
  if (broadcast) broadcast.status = "cancelled";
}

function getAllBroadcasts() {
  return Array.from(telegramBroadcasts.values()).sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );
}

function getBroadcast(id) {
  return telegramBroadcasts.get(id);
}

module.exports = {
  addTelegramBroadcast,
  sendNow,
  cancelBroadcast,
  getAllBroadcasts,
  getBroadcast
};
