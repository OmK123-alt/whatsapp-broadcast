import React, { useState, useEffect } from "react";
import { Toaster } from "react-hot-toast";
import axios from "axios";
import QRScreen from "./components/QRScreen";
import Dashboard from "./components/Dashboard";

export default function App() {
  const [waStatus, setWaStatus] = useState("disconnected");
  const [qr, setQR] = useState(null);

  const pollStatus = async () => {
    try {
      const { data } = await axios.get("/api/wa/status");
      setWaStatus(data.status);
      setQR(data.qr || null);
    } catch {
      setWaStatus("disconnected");
    }
  };

  useEffect(() => {
    pollStatus();
    const interval = setInterval(pollStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "#1a2035",
            color: "#f0f2ff",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "10px",
            fontFamily: "'DM Sans', sans-serif"
          }
        }}
      />
      {waStatus === "connected" ? (
        <Dashboard waStatus={waStatus} />
      ) : (
        <QRScreen status={waStatus} qr={qr} />
      )}
    </>
  );
}
