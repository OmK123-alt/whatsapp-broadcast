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

---

## ▲ Deploy on Vercel

This repository is now configured with a root `vercel.json`:
- Frontend build output: `frontend/dist`
- API function entrypoint: `api/index.js` (routes `/api/*`)

### Environment variables (Vercel Project Settings)

- `FRONTEND_URL`  
  Set to your deployed frontend URL (or comma-separated list for multiple allowed origins).  
  Example: `https://your-project.vercel.app`
  - Preview deployments are also allowed automatically for `*.vercel.app`.

- `VITE_API_BASE_URL`  
  - If frontend and API are on the same Vercel project/domain: leave empty
  - If API is hosted on a different domain: set full URL (example: `https://api.example.com`)

- `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `AUTH_TOKEN`
  - Used for portal login protection.
  - Set strong values in production.

### Notes for this specific project

- `whatsapp-web.js` + Puppeteer + `LocalAuth` expects long-running/persistent server state.
- Vercel serverless functions are ephemeral, so WhatsApp login/session persistence and scheduled jobs may reset on cold starts/redeploys.
- For production reliability, keep frontend on Vercel and host backend on a persistent server (VM/container) if you need stable WhatsApp connection and scheduling.

### Quick deploy steps

1. Import this repo in Vercel.
2. Root directory: project root (`whatsapp-broadcast`).
3. Add env vars from `.env.example`.
4. Deploy.
