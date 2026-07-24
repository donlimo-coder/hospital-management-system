const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

// Files land in a "hospital-management/reports" folder in your Cloudinary
// account. Accepts images (X-rays, scanned reports) and PDFs (lab reports).
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "hospital-management/reports",
    resource_type: "auto", // lets PDFs and images both work
    allowed_formats: ["jpg", "jpeg", "png", "pdf"],
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = ["image/jpeg", "image/png", "application/pdf"];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only JPG, PNG, or PDF files are allowed"), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB per file
});

module.exports = upload;
