import React, { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { useMediaQuery, useTheme } from "./hooks";

const AppShell = () => {
  const location = useLocation();
  const isMobile = useMediaQuery("(max-width: 900px)");
  const { theme, toggle } = useTheme();
  const [drawer, setDrawer] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem("hms_sidebar") === "1"; } catch { return false; }
  });

  useEffect(() => { setDrawer(false); }, [location.pathname]);
  useEffect(() => { if (!isMobile) setDrawer(false); }, [isMobile]);

  const toggleCollapsed = () => {
    setCollapsed((c) => {
      try { localStorage.setItem("hms_sidebar", c ? "0" : "1"); } catch { /* ignore */ }
      return !c;
    });
  };

  return (
    <div className="app-shell">
      <Sidebar
        collapsed={collapsed}
        onToggle={toggleCollapsed}
        isMobile={isMobile}
        open={drawer}
        onClose={() => setDrawer(false)}
      />
      <AnimatePresence>
        {isMobile && drawer && (
          <motion.div
            className="sidebar-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setDrawer(false)}
          />
        )}
      </AnimatePresence>

      <div className="app-main">
        <Topbar isMobile={isMobile} onMenu={() => setDrawer(true)} theme={theme} onToggleTheme={toggle} />
        <main className="content-panel">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default AppShell;