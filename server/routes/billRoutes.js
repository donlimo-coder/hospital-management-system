const express = require("express");
const { createBill, getBills, getBillById, markBillPaid } = require("../controllers/billController");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

router.post("/", protect, authorize("doctor", "admin"), createBill);
router.get("/", protect, getBills);
router.get("/:id", protect, getBillById);
router.put("/:id/pay", protect, markBillPaid);

module.exports = router;