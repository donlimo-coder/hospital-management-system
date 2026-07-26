import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../services/api";

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

  if (error) return <div className="page"><p className="form-error">{error}</p></div>;
  if (!bill) return <div className="page"><p>Loading receipt...</p></div>;

  return (
    <div className="page">
      <div className="no-print" style={{ marginBottom: "1rem", display: "flex", gap: "0.6rem" }}>
        <Link to="/bills">← Back to Bills</Link>
        <button onClick={() => window.print()}>Print / Save as PDF</button>
      </div>

      <div id="receipt" style={{ maxWidth: "500px", margin: "0 auto", background: "white", padding: "2rem", borderRadius: "10px", boxShadow: "0 2px 10px rgba(0,0,0,0.08)" }}>
        <h2 style={{ textAlign: "center", marginBottom: "0.2rem" }}>🏥 Hospital Management System</h2>
        <p style={{ textAlign: "center", color: "#888", marginTop: 0 }}>Payment Receipt</p>
        <hr />

        <p><strong>Receipt #:</strong> {bill._id.slice(-8).toUpperCase()}</p>
        <p><strong>Date:</strong> {new Date(bill.createdAt).toLocaleDateString()}</p>
        <p><strong>Patient:</strong> {bill.patient?.name} ({bill.patient?.memberNumber})</p>
        <p><strong>Doctor:</strong> {bill.appointment?.doctor?.name} ({bill.appointment?.doctor?.specialization})</p>
        <p><strong>Visit date:</strong> {bill.appointment?.date}</p>

        <hr />

        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <tbody>
            <tr>
              <td style={{ padding: "0.3rem 0" }}>Consultation Fee</td>
              <td style={{ padding: "0.3rem 0", textAlign: "right" }}>KSh {bill.consultationFee}</td>
            </tr>
            <tr>
              <td style={{ padding: "0.3rem 0" }}>Medicine Charges</td>
              <td style={{ padding: "0.3rem 0", textAlign: "right" }}>KSh {bill.medicineCharges}</td>
            </tr>
            <tr>
              <td style={{ padding: "0.3rem 0" }}>Lab Charges</td>
              <td style={{ padding: "0.3rem 0", textAlign: "right" }}>KSh {bill.labCharges}</td>
            </tr>
            <tr>
              <td style={{ padding: "0.3rem 0" }}>Discount</td>
              <td style={{ padding: "0.3rem 0", textAlign: "right" }}>- KSh {bill.discount}</td>
            </tr>
            <tr style={{ borderTop: "2px solid #333", fontWeight: 700 }}>
              <td style={{ padding: "0.5rem 0" }}>Total</td>
              <td style={{ padding: "0.5rem 0", textAlign: "right" }}>KSh {bill.total}</td>
            </tr>
          </tbody>
        </table>

        <hr />
        <p style={{ textAlign: "center", fontWeight: 700, color: bill.isPaid ? "#155724" : "#856404" }}>
          {bill.isPaid ? "PAID" : "PAYMENT PENDING"}
        </p>
        <p style={{ textAlign: "center", color: "#888", fontSize: "0.8rem" }}>Thank you for choosing us for your care.</p>
      </div>
    </div>
  );
};

export default BillReceipt;