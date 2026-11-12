import React from "react";

const Skeleton = ({ width = "100%", height = 16, style }) => (
  <span className="skeleton" style={{ width, height, ...style }} aria-hidden="true" />
);

export default Skeleton;