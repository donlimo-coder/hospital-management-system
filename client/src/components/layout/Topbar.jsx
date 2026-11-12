import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Bell, Sun, Moon, Menu, LogOut, BellOff, Receipt } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { getNavItems } from "./navConfig";

const drop = {
  initial: { opacity: 0, y: -6, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -6, scale: 0.98 },
  transition: { duration: 0.15 },
};

const initials = (name = "") =>
  name.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join("") || "U";

const Topbar = ({ isMobile, onMenu, theme, onToggleTheme }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const rootRef = useRef(null);
  const inputRef = useRef(null);
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [menu, setMenu] = useState(null); // "notif" | "profile" | null

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return getNavItems(user.role).filter((i) => i.label.toLowerCase().includes(q));
  }, [query, user.role]);

  useEffect(() => {
    const onDown = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setMenu(null);
        setSearchOpen(false);
      }
    };
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === "Escape") { setMenu(null); setSearchOpen(false); }
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const go = (to) => {
    navigate(to);
    setQuery("");
    setSearchOpen(false);
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="topbar" ref={rootRef}>
      {isMobile && (
        <button className="icon-btn" onClick={onMenu} aria-label="Open menu">
          <Menu size={18} />
        </button>
      )}

      <div className="topbar-search">
        <Search size={16} />
        <input
          ref={inputRef}
          value={query}
          placeholder="Search pages…"
          onChange={(e) => { setQuery(e.target.value); setSearchOpen(true); }}
          onFocus={() => setSearchOpen(true)}
          onKeyDown={(e) => { if (e.key === "Enter" && results[0]) go(results[0].to); }}
          aria-label="Search pages"
        />
        <span className="kbd">Ctrl K</span>
        <AnimatePresence>
          {searchOpen && query.trim() && (
            <motion.div className="dropdown" style={{ left: 0, right: 0 }} {...drop}>
              {results.length ? (
                results.map(({ to, label, icon: Icon }, i) => (
                  <button key={to} className={`dropdown-item${i === 0 ? " is-first" : ""}`} onClick={() => go(to)}>
                    <Icon size={16} /> {label}
                  </button>
                ))
              ) : (
                <div className="dropdown-empty">No matching pages</div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="topbar-right">
        <button className="icon-btn" onClick={onToggleTheme} aria-label="Toggle appearance" title="Toggle appearance">
          {theme === "light" ? <Moon size={17} /> : <Sun size={17} />}
        </button>

        <div style={{ position: "relative" }}>
          <button
            className="icon-btn"
            onClick={() => setMenu(menu === "notif" ? null : "notif")}
            aria-label="Notifications"
          >
            <Bell size={17} />
          </button>
          <AnimatePresence>
            {menu === "notif" && (
              <motion.div className="dropdown right" style={{ width: 280 }} {...drop}>
                <div className="dropdown-head"><strong>Notifications</strong></div>
                <div className="dropdown-empty">
                  <BellOff size={22} style={{ marginBottom: 6 }} />
                  <div>You're all caught up</div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div style={{ position: "relative" }}>
          <button className="profile-btn" onClick={() => setMenu(menu === "profile" ? null : "profile")} aria-label="Account menu">
            <span className="avatar">{initials(user.name)}</span>
            <span className="profile-meta">
              <strong>{user.name}</strong>
              <span>{user.role}</span>
            </span>
          </button>
          <AnimatePresence>
            {menu === "profile" && (
              <motion.div className="dropdown right" {...drop}>
                <div className="dropdown-head">
                  <strong>{user.name}</strong>
                  <span style={{ textTransform: "capitalize" }}>{user.email || user.role}</span>
                </div>
                <button className="dropdown-item" onClick={() => { setMenu(null); navigate("/bills"); }}>
                  <Receipt size={16} /> Bills
                </button>
                <button className="dropdown-item danger" onClick={handleLogout}>
                  <LogOut size={16} /> Sign out
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
};

export default Topbar;