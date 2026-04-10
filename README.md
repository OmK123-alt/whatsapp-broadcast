# 📢 Sharda Academy — WhatsApp Broadcast Portal

Send batch launch posters with captions to your academy's WhatsApp groups — instantly or scheduled.

---

## 🗂️ Project Structure

```
whatsapp-broadcast/
├── backend/          ← Node.js + Express + whatsapp-web.js
│   ├── server.js
│   ├── whatsapp.js
│   ├── scheduler.js
│   ├── uploads/      ← (auto-created) stored poster images
│   └── package.json
└── frontend/         ← React + Vite
    ├── src/
    │   ├── App.jsx
    │   ├── components/
    │   │   ├── QRScreen.jsx
    │   │   ├── Dashboard.jsx
    │   │   ├── NewBroadcast.jsx
    │   │   └── BroadcastHistory.jsx
    │   └── index.css
    └── package.json
```

---

## ⚙️ Setup & Run

### 1. Install Backend Dependencies
```bash
cd backend
npm install
```

### 2. Install Frontend Dependencies
```bash
cd frontend
npm install
```

### 3. Start Both (open two terminals)

**Terminal 1 — Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
```

### 4. Connect WhatsApp
- Open http://localhost:5173
- A QR code will appear
- Open WhatsApp on your phone → **Linked Devices** → **Link a Device**
- Scan the QR code
- ✅ You're connected! (stays connected via `LocalAuth`)

---

## 🚀 Features

| Feature | Details |
|---|---|
| 📸 Poster Upload | Drag & drop or browse — JPG/PNG/GIF up to 16 MB |
| ✏️ Caption | Multiline message with emoji support |
| 👥 Batch Selection | Auto-loads all your WhatsApp groups; select individual or all |
| ⏰ Schedule | Send immediately OR pick a future date & time |
| 📋 History | Track all broadcasts — sent, scheduled, failed |
| 🔄 Auto-reconnect | Disconnects auto-reconnect; auth saved locally |

---

## 🔧 Notes

- WhatsApp session is saved in `backend/.wwebjs_auth/` — you only scan QR once
- Broadcasts are stored in memory — restarting the server clears history
  - For persistence: swap the `Map` in `scheduler.js` with a JSON file or SQLite
- The backend uses Puppeteer/Chromium — first `npm install` may take a few minutes
- You must be a **group admin or member** of the WhatsApp groups to send messages

---

## 🔒 IMPORTANT

This portal uses the unofficial `whatsapp-web.js` library.
Use it responsibly — avoid spamming. WhatsApp may ban accounts that send bulk messages too rapidly.
The 1.2-second delay between messages is intentional to avoid rate limiting.
