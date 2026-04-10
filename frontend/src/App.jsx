import React, { useState, useEffect } from "react";
import { Toaster, toast } from "react-hot-toast";
import api from "./api";
import QRScreen from "./components/QRScreen";
import Dashboard from "./components/Dashboard";

export default function App() {
  const [authChecked, setAuthChecked] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);
  const [waStatus, setWaStatus] = useState("disconnected");
  const [qr, setQR] = useState(null);

  const checkAuth = async () => {
    const token = localStorage.getItem("wa_auth_token");
    if (!token) {
      setAuthChecked(true);
      setIsAuthenticated(false);
      return;
    }
    try {
      await api.get("/api/auth/me");
      setIsAuthenticated(true);
    } catch {
      localStorage.removeItem("wa_auth_token");
      setIsAuthenticated(false);
    } finally {
      setAuthChecked(true);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      toast.error("Enter username and password");
      return;
    }
    setLoggingIn(true);
    try {
      const { data } = await api.post("/api/auth/login", {
        username: username.trim(),
        password
      });
      localStorage.setItem("wa_auth_token", data.token);
      setIsAuthenticated(true);
      toast.success("Login successful");
    } catch {
      toast.error("Invalid credentials");
    } finally {
      setLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      await api.post("/api/auth/logout");
    } catch {
      // Continue local logout even if backend call fails
    } finally {
      localStorage.removeItem("wa_auth_token");
      setIsAuthenticated(false);
      setUsername("");
      setPassword("");
      setWaStatus("disconnected");
      setQR(null);
      toast.success("Logged out");
    }
  };

  const pollStatus = async () => {
    try {
      const { data } = await api.get("/api/wa/status");
      setWaStatus(data.status);
      setQR(data.qr || null);
    } catch {
      setWaStatus("disconnected");
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    pollStatus();
    const interval = setInterval(pollStatus, 3000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  if (!authChecked) return null;

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

      {!isAuthenticated ? (
        <div style={styles.loginWrap}>
          <form style={styles.loginCard} onSubmit={handleLogin}>
            <h2 style={styles.title}>Portal Login</h2>
            <p style={styles.sub}>Sign in to access WhatsApp Broadcast Portal</p>
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={styles.input}
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
            />
            <button type="submit" style={styles.button} disabled={loggingIn}>
              {loggingIn ? "Signing in..." : "Login"}
            </button>
          </form>
        </div>
      ) : (
        <>
          <div style={styles.logoutBar}>
            <button style={styles.logoutBtn} onClick={handleLogout}>Logout</button>
          </div>
          {waStatus === "connected" ? (
            <Dashboard waStatus={waStatus} />
          ) : (
            <QRScreen status={waStatus} qr={qr} />
          )}
        </>
      )}
    </>
  );
}

const styles = {
  loginWrap: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "var(--bg)"
  },
  loginCard: {
    width: "100%",
    maxWidth: 380,
    background: "var(--bg2)",
    border: "1px solid var(--border)",
    borderRadius: 12,
    padding: 22,
    display: "flex",
    flexDirection: "column",
    gap: 10
  },
  title: {
    color: "var(--text)",
    fontFamily: "'Syne', sans-serif"
  },
  sub: {
    color: "var(--text-muted)",
    fontSize: "0.85rem",
    marginBottom: 6
  },
  input: {
    background: "var(--bg)",
    border: "1px solid var(--border)",
    color: "var(--text)",
    borderRadius: 8,
    padding: "10px 12px"
  },
  button: {
    marginTop: 6,
    background: "linear-gradient(135deg, var(--accent), #6e3dff)",
    color: "#fff",
    borderRadius: 8,
    padding: "10px 14px",
    fontFamily: "'Syne', sans-serif",
    fontWeight: 700
  },
  logoutBar: {
    position: "fixed",
    top: 12,
    right: 12,
    zIndex: 50
  },
  logoutBtn: {
    background: "var(--bg2)",
    color: "var(--text-sub)",
    border: "1px solid var(--border)",
    borderRadius: 8,
    padding: "8px 12px"
  }
};
