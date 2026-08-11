const express = require("express");
const mongoose = require("mongoose");
const { protect, authorize } = require("../middleware/auth");
const Doctor = require("../models/Doctor");
const Patient = require("../models/Patient");
const Appointment = require("../models/Appointment");
const Bill = require("../models/Bill");

const router = express.Router();

// Builds a "YYYY-MM-DD" cutoff string N days back, or null for "all time".
// Appointment.date is stored as a string in this format, so string
// comparison (>=) works correctly for range filtering.
function getCutoffDateStr(days) {
  if (!days || days === "all") return null;
  const n = parseInt(days, 10);
  if (Number.isNaN(n)) return null;
  const d = new Date(Date.now() - n * 24 * 60 * 60 * 1000);
  return d.toISOString().slice(0, 10);
}

// Returns a $match-ready clinic filter: {} for super-admin viewing all
// clinics (req.clinicId null), or { clinic: ObjectId } otherwise.
function getClinicMatch(req) {
  if (req.clinicId === null || req.clinicId === undefined) return {};
  return { clinic: new mongoose.Types.ObjectId(req.clinicId) };
}

// @route GET /api/analytics/dashboard?days=30 (admin, superadmin)
// @desc  Combined payload for all analytics dashboard charts
router.get("/dashboard", protect, authorize("admin", "superadmin"), async (req, res, next) => {
  try {
    const cutoffDateStr = getCutoffDateStr(req.query.days);
    const clinicMatch = getClinicMatch(req);
    const appointmentDateMatch = { ...clinicMatch, ...(cutoffDateStr ? { date: { $gte: cutoffDateStr } } : {}) };

    const cutoffDateObj = cutoffDateStr ? new Date(cutoffDateStr) : null;
    const billDateMatch = { ...clinicMatch, ...(cutoffDateObj ? { createdAt: { $gte: cutoffDateObj } } : {}) };

    const overdueThreshold = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [
      revenueTrend,
      appointmentsVsWalkins,
      doctorWorkloadRaw,
      genderBreakdown,
      ageGroups,
      peakHours,
      billingStatusRaw,
    ] = await Promise.all([
      // 1. Revenue trend: paid bills, grouped by day
      Bill.aggregate([
        { $match: { isPaid: true, ...billDateMatch } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            revenue: { $sum: "$total" },
          },
        },
        { $sort: { _id: 1 } },
        { $project: { _id: 0, date: "$_id", revenue: 1 } },
      ]),

      // 2. Appointments vs walk-ins, grouped by day
      Appointment.aggregate([
        { $match: appointmentDateMatch },
        {
          $group: {
            _id: { date: "$date", source: { $ifNull: ["$source", "online"] } },
            count: { $sum: 1 },
          },
        },
        { $sort: { "_id.date": 1 } },
        {
          $group: {
            _id: "$_id.date",
            counts: { $push: { source: "$_id.source", count: "$count" } },
          },
        },
        { $sort: { _id: 1 } },
        { $project: { _id: 0, date: "$_id", counts: 1 } },
      ]),

      // 3. Doctor workload: appointment count per doctor
      Appointment.aggregate([
        { $match: appointmentDateMatch },
        { $group: { _id: "$doctor", count: { $sum: 1 } } },
        {
          $lookup: {
            from: "doctors",
            localField: "_id",
            foreignField: "_id",
            as: "doctorInfo",
          },
        },
        { $unwind: "$doctorInfo" },
        {
          $project: {
            _id: 0,
            doctor: "$doctorInfo.name",
            count: 1,
          },
        },
        { $sort: { count: -1 } },
      ]),

      // 4. Patient demographics: gender breakdown
      Patient.aggregate([
        { $match: clinicMatch },
        { $group: { _id: { $ifNull: ["$gender", "unknown"] }, count: { $sum: 1 } } },
        { $project: { _id: 0, gender: "$_id", count: 1 } },
      ]),

      // 4b. Patient demographics: age groups
      Patient.aggregate([
        { $match: { ...clinicMatch, age: { $ne: null } } },
        {
          $bucket: {
            groupBy: "$age",
            boundaries: [0, 19, 36, 51, 66, 200],
            default: "unknown",
            output: { count: { $sum: 1 } },
          },
        },
      ]),

      // 5. Peak hours: appointment count by hour of day (time is "HH:mm")
      Appointment.aggregate([
        { $match: appointmentDateMatch },
        {
          $project: {
            hour: { $toInt: { $substrCP: ["$time", 0, 2] } },
          },
        },
        { $group: { _id: "$hour", count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
        { $project: { _id: 0, hour: "$_id", count: 1 } },
      ]),

      // 6. Billing status: paid / pending / overdue (unpaid + created 7+ days ago)
      Bill.aggregate([
        { $match: billDateMatch },
        {
          $group: {
            _id: {
              $cond: [
                { $eq: ["$isPaid", true] },
                "paid",
                {
                  $cond: [{ $lt: ["$createdAt", overdueThreshold] }, "overdue", "pending"],
                },
              ],
            },
            count: { $sum: 1 },
            amount: { $sum: "$total" },
          },
        },
        { $project: { _id: 0, status: "$_id", count: 1, amount: 1 } },
      ]),
    ]);

    // Reshape appointments-vs-walkins into a flat, chart-friendly array
    const appointmentsVsWalkinsFormatted = appointmentsVsWalkins.map((day) => {
      const online = day.counts.find((c) => c.source === "online")?.count || 0;
      const walkIn = day.counts.find((c) => c.source === "walk-in")?.count || 0;
      return { date: day.date, online, walkIn };
    });

    // Reshape age buckets into labeled groups
    const ageGroupLabels = { 0: "0-18", 19: "19-35", 36: "36-50", 51: "51-65", 66: "65+" };
    const ageGroupsFormatted = ageGroups.map((g) => ({
      group: ageGroupLabels[g._id] || "Unknown",
      count: g.count,
    }));

    // Reshape billing status into a simple object with counts + amounts
    const billingStatus = { paid: 0, pending: 0, overdue: 0 };
    const billingAmounts = { paid: 0, pending: 0, overdue: 0 };
    billingStatusRaw.forEach((b) => {
      billingStatus[b.status] = b.count;
      billingAmounts[b.status] = b.amount;
    });

    res.json({
      revenueTrend,
      appointmentsVsWalkins: appointmentsVsWalkinsFormatted,
      doctorWorkload: doctorWorkloadRaw,
      demographics: { gender: genderBreakdown, ageGroups: ageGroupsFormatted },
      peakHours,
      billingStatus,
      billingAmounts,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;