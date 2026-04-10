const TELEGRAM_API_BASE = "https://api.telegram.org";

function hasTelegramBotToken() {
  return Boolean(process.env.TELEGRAM_BOT_TOKEN);
}

async function sendTextMessage({ token, chatId, text }) {
  const response = await fetch(`${TELEGRAM_API_BASE}/bot${token}/sendMessage`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      chat_id: chatId,
      text
    })
  });

  const data = await response.json();
  if (!response.ok || !data.ok) {
    throw new Error(data.description || "Failed to send Telegram message");
  }
}

async function sendTelegramBroadcast({ caption, targetIds, imagePath }) {
  if (!hasTelegramBotToken()) {
    throw new Error("TELEGRAM_BOT_TOKEN is not configured");
  }

  if (imagePath) {
    throw new Error("Telegram image send is not configured yet. Send text-only campaigns for now.");
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const results = [];

  for (const targetId of targetIds) {
    try {
      await sendTextMessage({
        token,
        chatId: targetId,
        text: caption
      });
      results.push({ targetId, status: "sent" });
    } catch (err) {
      results.push({
        targetId,
        status: "failed",
        error: err.message
      });
    }
  }

  return results;
}

module.exports = {
  hasTelegramBotToken,
  sendTelegramBroadcast
};
