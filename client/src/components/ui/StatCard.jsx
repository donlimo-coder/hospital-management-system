import React from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import AnimatedNumber from "./AnimatedNumber";
import Skeleton from "./Skeleton";

// `change` is optional: only pass it when you have a real comparison value.
// `tone` colours the icon: default | success | warning | critical
const StatCard = ({ title, value, prefix, suffix, decimals, change, icon: Icon, hint, loading, tone = "default", index = 0 }) => {
  const up = typeof change === "number" && change >= 0;
  return (
    <motion.div
      className="glass-card stat-tile"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.06 }}
      whileHover={{ y: -5 }}
    >
      <div className="stat-tile-top">
        <span className={`stat-icon tone-${tone}`}>{Icon && <Icon size={18} />}</span>
        {typeof change === "number" && !loading && (
          <span className={`stat-trend ${up ? "up" : "down"}`}>
            {up ? <ArrowUpRight size={15} /> : <ArrowDownRight size={15} />}
            {Math.abs(change)}%
          </span>
        )}
      </div>
      {loading ? (
        <>
          <Skeleton height={30} width="55%" />
          <Skeleton height={12} width="70%" style={{ marginTop: 10 }} />
        </>
      ) : (
        <>
          <div className="stat-tile-value">
            <AnimatedNumber value={value} prefix={prefix} suffix={suffix} decimals={decimals} />
          </div>
          <div className="stat-tile-title">{title}</div>
          {hint && <div className="stat-tile-hint">{hint}</div>}
        </>
      )}
    </motion.div>
  );
};

export default StatCard;