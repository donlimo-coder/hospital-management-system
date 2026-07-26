import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

const GenerateBillForm = ({ appointment, onGenerated }) => {
  const [medicineCharges, setMedicineCharges] = useState("");
  const [labCharges, setLabCharges] = useState("");
  const [discount, setDiscount] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const { data } = await api.post("/bills", {
        appointmentId: appointment._id,
        medicineCharges: Number(medicineCharges) || 0,
        labCharges: Number(labCharges) || 0,
        discount: Number(discount) || 0,
      });
      onGenerated(data.bill);
    } catch (err) {
      setError(err.response?.data?.message || "Could not generate bill");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap", marginTop: "0.4rem" }}>
      {error && <p className="form-error" style={{ width: "100%" }}>{error}</p>}
      <input type="number" placeholder="Medicine (KSh)" value={medicineCharges} onChange={(e) => setMedicineCharges(e.target.value)} style={{ width: "130px" }} />
      <input type="number" placeholder="Lab (KSh)" value={labCharges} onChange={(e) => setLabCharges(e.target.value)} style={{ width: "110px" }} />
      <input type="number" placeholder="Discount (KSh)" value={discount} onChange={(e) => setDiscount(e.target.value)} style={{ width: "130px" }} />
      <button type="submit" disabled={saving}>{saving ? "Generating..." : "Generate Bill"}</button>
    </form>
  );
};

const Bills = () => {
  const { user } = useAuth();
  const [bills, setBills] = useState([]);
  const [unbilledAppointments, setUnbilledAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    const billsRes = await api.get("/bills");
    setBills(billsRes.data.bills);

    if (["admin", "doctor"].includes(user.role)) {
      const apptRes = await api.get("/appointments", { params: { status: "completed" } });
      const billedApptIds = new Set(billsRes.data.bills.map((b) => b.appointment?._id));
      setUnbilledAppointments(apptRes.data.appointments.filter((a) => !billedApptIds.has(a._id)));
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const markPaid = async (id) => {
    await api.put(`/bills/${id}/pay`);
    setBills((prev) => prev.map((b) => (b._id === id ? { ...b, isPaid: true } : b)));
  };

  if (loading) return <div className="page"><p>Loading bills...</p></div>;

  return (
    <div className="page">
      <h1>Billing</h1>

      {["admin", "doctor"].includes(user.role) && (
        <div className="auth-card" style={{ maxWidth: "700px" }}>
          <h2>Completed Visits Awaiting a Bill</h2>
          {unbilledAppointments.length === 0 ? (
            <p>All completed appointments have been billed.</p>
          ) : (
            unbilledAppointments.map((a) => (
              <div key={a._id} style={{ borderBottom: "1px solid #eee", paddingBottom: "0.6rem", marginBottom: "0.6rem" }}>
                <p style={{ margin: 0 }}>
                  <strong>{a.patient?.name}</strong> — {a.date} — Dr. {a.doctor?.name} (KSh {a.doctor?.consultationFee} consultation)
                </p>
                <GenerateBillForm appointment={a} onGenerated={() => loadData()} />
              </div>
            ))
          )}
        </div>
      )}

      <div className="auth-card" style={{ maxWidth: "700px", marginTop: "1rem" }}>
        <h2>{user.role === "patient" ? "My Bills" : "All Bills"}</h2>
        {bills.length === 0 ? (
          <p>No bills yet.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                {user.role !== "patient" && <th>Patient</th>}
                <th>Doctor</th>
                <th>Total (KSh)</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {bills.map((b) => (
                <tr key={b._id}>
                  {user.role !== "patient" && <td>{b.patient?.name}</td>}
                  <td>{b.appointment?.doctor?.name || "—"}</td>
                  <td>{b.total}</td>
                  <td>
                    <span className={`badge ${b.isPaid ? "badge-completed" : "badge-pending"}`}>
                      {b.isPaid ? "Paid" : "Unpaid"}
                    </span>
                  </td>
                  <td style={{ display: "flex", gap: "0.4rem" }}>
                    <Link to={`/bills/${b._id}`}>View / Print</Link>
                    {["admin", "doctor"].includes(user.role) && !b.isPaid && (
                      <button onClick={() => markPaid(b._id)}>Mark Paid</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Bills;