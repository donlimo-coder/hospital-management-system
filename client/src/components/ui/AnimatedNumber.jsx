import React, { useEffect, useState } from "react";
import { animate, useReducedMotion } from "framer-motion";

const AnimatedNumber = ({ value, prefix = "", suffix = "", decimals = 0, duration = 1 }) => {
  const n = Number(value);
  const valid = Number.isFinite(n);
  const reduce = useReducedMotion();
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!valid) return;
    if (reduce) { setDisplay(n); return; }
    const controls = animate(0, n, { duration, ease: "easeOut", onUpdate: setDisplay });
    return () => controls.stop();
  }, [n, valid, duration, reduce]);

  if (!valid) return <>{value}</>;
  return (
    <>
      {prefix}
      {display.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}
      {suffix}
    </>
  );
};

export default AnimatedNumber;