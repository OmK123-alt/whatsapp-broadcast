// server.js — local dev server entrypoint
const PORT = process.env.PORT || 5000;
const { app, initWhatsAppOnce } = require("./app");

app.listen(PORT, () => {
  console.log(`\n🚀 Sharda Academy Broadcast Server running on http://localhost:${PORT}`);
  console.log("📱 Initializing WhatsApp client in 3 seconds...\n");
  initWhatsAppOnce();
});
