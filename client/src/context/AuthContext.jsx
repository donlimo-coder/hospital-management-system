import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import api from "../services/api";

const AuthContext = createContext(null);

// Auto-logout after this many minutes of no mouse/keyboard/touch activity.
// Handles sensitive patient data, so a forgotten unlocked screen shouldn't
// stay logged in indefinitely. Admin gets the tightest window since that
// account can see everything; doctor/patient get a bit more room.
const IDLE_TIMEOUT_MINUTES_BY_ROLE = {
  admin: 0.5, // 30 seconds
  doctor: 1,
  patient: 1,
};
const DEFAULT_IDLE_TIMEOUT_MINUTES = 1;
const WARNING_BEFORE_SECONDS = 10; // show a warning this many seconds before logout

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("hms_user");
    return stored ? JSON.parse(stored) : null;
  });
  const [idleWarning, setIdleWarning] = useState(false);

  const idleTimerRef = useRef(null);
  const warningTimerRef = useRef(null);
  const userRef = useRef(user);
  userRef.current = user;

  const login = async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password });
    localStorage.setItem("hms_token", data.token);
    localStorage.setItem("hms_user", JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  };

  const register = async (payload) => {
    const { data } = await api.post("/auth/register", payload);
    localStorage.setItem("hms_token", data.token);
    localStorage.setItem("hms_user", JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  };

  const logout = useCallback(() => {
    localStorage.removeItem("hms_token");
    localStorage.removeItem("hms_user");
    setUser(null);
    setIdleWarning(false);
  }, []);

  const resetIdleTimer = useCallback(() => {
    setIdleWarning(false);
    clearTimeout(idleTimerRef.current);
    clearTimeout(warningTimerRef.current);

    const role = userRef.current?.role;
    const timeoutMinutes = IDLE_TIMEOUT_MINUTES_BY_ROLE[role] ?? DEFAULT_IDLE_TIMEOUT_MINUTES;
    const timeoutMs = timeoutMinutes * 60 * 1000;
    const warningMs = Math.max(timeoutMs - WARNING_BEFORE_SECONDS * 1000, 0);

    warningTimerRef.current = setTimeout(() => {
      setIdleWarning(true);
    }, warningMs);

    idleTimerRef.current = setTimeout(() => {
      logout();
      window.location.href = "/login";
    }, timeoutMs);
  }, [logout]);

  // Only track activity while someone is actually logged in.
  useEffect(() => {
    if (!user) {
      clearTimeout(idleTimerRef.current);
      clearTimeout(warningTimerRef.current);
      return;
    }

    const events = ["mousedown", "mousemove", "keydown", "touchstart", "scroll"];
    resetIdleTimer();
    events.forEach((evt) => window.addEventListener(evt, resetIdleTimer));

    return () => {
      events.forEach((evt) => window.removeEventListener(evt, resetIdleTimer));
      clearTimeout(idleTimerRef.current);
      clearTimeout(warningTimerRef.current);
    };
  }, [user, resetIdleTimer]);

  return (
    <AuthContext.Provider value={{ user, login, register, logout, idleWarning }}>
      {children}
      {idleWarning && (
        <div
          style={{
            position: "fixed",
            bottom: "1rem",
            right: "1rem",
            background: "#1a1a2e",
            color: "white",
            padding: "0.9rem 1.2rem",
            borderRadius: "10px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.25)",
            zIndex: 1000,
            maxWidth: "280px",
          }}
        >
          You'll be logged out soon due to inactivity. Move your mouse or tap to stay signed in.
        </div>
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);