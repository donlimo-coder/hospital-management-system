import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Printer, Cross } from "lucide-react";
import api from "../services/api";
import Skeleton from "../components/ui/Skeleton";

const fmt = (n) => Number(n || 0).toLocaleString();

const BillReceipt = () => {
  const { id } = useParams();
  const [bill, setBill] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get(`/bills/${id}`)
      .then((res) => setBill(res.data.bill))
      .catch((err) => setError(err.response?.data?.message || "Could not load bill"));
  }, [id]);

  if (error) {
    return (
      <div className="page">
        <div className="glass-card">
          <p className="form-error">{error}</p>
          <Link to="/bills" className="btn-glass">
            <ArrowLeft size={16} /> Back to Bills
          </Link>
        </div>
      </div>
    );
  }

  if (!bill) {
    return (
      <div className="page">
        <div className="glass-card" style={{ maxWidth: 520, margin: "0 auto", display: "grid", gap: 14 }}>
          <Skeleton height={40} />
          <Skeleton height={80} />
          <Skeleton height={120} />
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="no-print btn-row" style={{ marginTop: 0, marginBottom: 20, justifyContent: "center" }}>
        <Link to="/bills" className="btn-glass">
          <ArrowLeft size={16} /> Back to Bills
        </Link>
        <button className="btn-dark" onClick={() => window.print()}>
          <Printer size={16} /> Print / Save as PDF
        </button>
      </div>

      <motion.div
        id="receipt"
        className="receipt"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="receipt-head">
          <div className="brand-mark">
            <Cross size={20} color="#fff" strokeWidth={2.6} />
          </div>
          <div>
            <strong>Hospital Management System</strong>
            <span className="muted">Payment Receipt</span>
          </div>
        </div>

        <dl className="receipt-meta">
          <div>
            <dt>Receipt #</dt>
            <dd>{bill._id.slice(-8).toUpperCase()}</dd>
          </div>
          <div>
            <dt>Date</dt>
            <dd>{new Date(bill.createdAt).toLocaleDateString()}</dd>
          </div>
          <div className="full">
            <dt>Patient</dt>
            <dd>
              {bill.patient?.name} ({bill.patient?.memberNumber})
            </dd>
          </div>
          <div>
            <dt>Doctor</dt>
            <dd>
              {bill.appointment?.doctor?.name} ({bill.appointment?.doctor?.specialization})
            </dd>
          </div>
          <div>
            <dt>Visit date</dt>
            <dd>{bill.appointment?.date}</dd>
          </div>
        </dl>

        <table className="receipt-lines">
          <tbody>
            <tr>
              <td>Consultation Fee</td>
              <td>KSh {fmt(bill.consultationFee)}</td>
            </tr>
            <tr>
              <td>Medicine Charges</td>
              <td>KSh {fmt(bill.medicineCharges)}</td>
            </tr>
            <tr>
              <td>Lab Charges</td>
              <td>KSh {fmt(bill.labCharges)}</td>
            </tr>
            <tr>
              <td>Discount</td>
              <td>- KSh {fmt(bill.discount)}</td>
            </tr>
            <tr className="total">
              <td>Total</td>
              <td>KSh {fmt(bill.total)}</td>
            </tr>
          </tbody>
        </table>

        <div className="receipt-stamp">
          <span className={`stamp ${bill.isPaid ? "stamp-paid" : "stamp-pending"}`}>
            {bill.isPaid ? "PAID" : "PAYMENT PENDING"}
          </span>
        </div>
        <p className="muted" style={{ textAlign: "center", fontSize: "0.8rem", margin: 0 }}>
          Thank you for choosing us for your care.
        </p>
      </motion.div>
    </div>
  );
};

export default BillReceipt;