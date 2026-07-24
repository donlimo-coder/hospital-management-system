const notFound = (req, res, next) => {
  res.status(404).json({ message: `Route not found: ${req.originalUrl}` });
};

const errorHandler = (err, req, res, next) => {
  console.error(err.stack);

  // Multer upload errors (file too large, wrong type, etc.)
  if (err.name === "MulterError" || err.message?.includes("Only JPG, PNG, or PDF")) {
    return res.status(400).json({ message: err.message });
  }

  // Mongoose duplicate key error (e.g. double-booking, duplicate email)
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {}).join(", ");
    return res.status(409).json({ message: `Duplicate value for field(s): ${field}` });
  }

  // Mongoose validation error
  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ message: messages.join(", ") });
  }

  const statusCode = err.statusCode && err.statusCode !== 200 ? err.statusCode : 500;
  res.status(statusCode).json({ message: err.message || "Server error" });
};

module.exports = { notFound, errorHandler };
