import React from "react";
import { motion, useReducedMotion } from "framer-motion";

const PATH = "M0 30 H40 L50 30 L58 8 L68 52 L78 18 L86 30 H130 L140 30 L148 12 L158 46 L166 30 H200";

const EcgLine = ({ height = 40, opacity = 0.9 }) => {
  const reduce = useReducedMotion();
  return (
    <svg viewBox="0 0 200 60" width="100%" height={height} preserveAspectRatio="none" aria-hidden="true" style={{ opacity }}>
      <path d={PATH} fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <motion.path
        d={PATH}
        fill="none"
        stroke="#67e8f9"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ filter: "drop-shadow(0 0 4px rgba(103,232,249,0.9))" }}
        initial={{ pathLength: 0, pathOffset: 0 }}
        animate={reduce ? { pathLength: 1 } : { pathLength: [0, 0.35, 0.35], pathOffset: [0, 0, 1] }}
        transition={reduce ? { duration: 0 } : { duration: 2.6, repeat: Infinity, ease: "linear" }}
      />
    </svg>
  );
};

export default EcgLine;