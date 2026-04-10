const { app, initWhatsAppOnce } = require("../backend/app");

initWhatsAppOnce();

module.exports = app;
