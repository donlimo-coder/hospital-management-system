import React from "react";
import { NavLink, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Cross, PanelLeftClose, PanelLeftOpen, X } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { getNavGroups } from "./navConfig";
import EcgLine from "../ui/EcgLine";

const ROLE_LABEL = { admin: "Administration", doctor: "Clinical staff", patient: "Patient portal" };

const Sidebar = ({ collapsed, onToggle, isMobile, open, onClose }) => {
  const { user } = useAuth();
  const groups = getNavGroups(user.role);
  const compact = collapsed && !isMobile;

  const animate = isMobile
    ? { x: open ? 0 : "-115%" }
    : { width: compact ? 84 : 268 };

  return (
    <motion.aside
      className={`sidebar${isMobile ? " is-mobile" : ""}`}
      initial={false}
      animate={animate}
      transition={{ type: "spring", stiffness: 320, damping: 34 }}
      aria-label="Main navigation"
    >
      <Link to="/dashboard" className="sidebar-brand" title="CareHMS">
        <div className="brand-mark"><Cross size={20} color="#fff" strokeWidth={2.6} /></div>
        {!compact && (
          <div className="brand-text">
            <strong>CareHMS</strong>
            <span>{ROLE_LABEL[user.role] || "Hospital management"}</span>
          </div>
        )}
        {isMobile && (
          <button
            className="icon-btn"
            style={{ marginLeft: "auto" }}
            onClick={(e) => { e.preventDefault(); onClose(); }}
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        )}
      </Link>

      <nav className="sidebar-nav">
        {groups.map((g) => (
          <div key={g.label}>
            {!compact && <div className="nav-group-label">{g.label}</div>}
            {compact && <div style={{ height: 10 }} />}
            {g.items.map(({ to, label, icon: Icon }) => (
              <NavLink key={to} to={to} className="nav-item" title={label}>
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <motion.span
                        layoutId="nav-active"
                        className="nav-active-bg"
                        transition={{ type: "spring", stiffness: 380, damping: 32 }}
                      />
                    )}
                    <Icon size={19} />
                    <AnimatePresence initial={false}>
                      {!compact && (
                        <motion.span
                          className="nav-label"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                        >
                          {label}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </>
                )}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div className="sidebar-vitals">
        <EcgLine height={compact ? 28 : 40} />
        {!compact && <span>System online</span>}
      </div>

      {!isMobile && (
        <div className="sidebar-footer">
          <button className="sidebar-toggle" onClick={onToggle} title={compact ? "Expand sidebar" : "Collapse sidebar"}>
            {compact ? <PanelLeftOpen size={19} /> : <PanelLeftClose size={19} />}
            {!compact && <span>Collapse</span>}
          </button>
        </div>
      )}
    </motion.aside>
  );
};

export default Sidebar;