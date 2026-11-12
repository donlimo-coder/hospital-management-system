import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Receipt, Banknote, ClipboardCheck, Clock, FileText } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import StatCard from "../components/ui/StatCard";

const initialsOf = (name = "") =>
  name.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join("") || "?";

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
    <form onSubmit={handleSubmit} className="bill-form">
      {error && <p className="form-error">{error}</p>}
      <div className="field">
        <label>Medicine (KSh)</label>
        <input type="number" placeholder="0" value={medicineCharges} onChange={(e) => setMedicineCharges(e.target.value)} />
      </div>
      <div className="field">
        <label>Lab (KSh)</label>
        <input type="number" placeholder="0" value={labCharges} onChange={(e) => setLabCharges(e.target.value)} />
      </div>
      <div className="field">
        <label>Discount (KSh)</label>
        <input type="number" placeholder="0" value={discount} onChange={(e) => setDiscount(e.target.value)} />
      </div>
      <button type="submit" className="btn-dark" disabled={saving}>
        <Receipt size={16} /> {saving ? "Generating..." : "Generate Bill"}
      </button>
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
    try {
      const billsRes = await api.get("/bills");
      setBills(billsRes.data.bills);

      if (["admin", "doctor"].includes(user.role)) {
        const apptRes = await api.get("/appointments", { params: { status: "completed" } });
        const billedApptIds = new Set(billsRes.data.bills.map((b) => b.appointment?._id));
        setUnbilledAppointments(apptRes.data.appointments.filter((a) => !billedApptIds.has(a._id)));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const markPaid = async (id) => {
    await api.put(`/bills/${id}/pay`);
    setBills((prev) => prev.map((b) => (b._id === id ? { ...b, isPaid: true } : b)));
  };

  // Summary numbers are added up from the real bills
  const totalBilled = bills.reduce((s, b) => s + (Number(b.total) || 0), 0);
  const totalPaid = bills.filter((b) => b.isPaid).reduce((s, b) => s + (Number(b.total) || 0), 0);
  const outstanding = totalBilled - totalPaid;
  const isStaff = ["admin", "doctor"].includes(user.role);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Billing</h1>
          <p>{user.role === "patient" ? "Your bills and receipts." : "Generate bills for completed visits and track payments."}</p>
        </div>
      </div>

      <div className="stat-grid-v2">
        <StatCard index={0} loading={loading} title={user.role === "patient" ? "My bills" : "Total bills"} value={bills.length} icon={Receipt} />
        <StatCard index={1} loading={loading} title="Total billed" prefix="KSh " value={totalBilled} icon={Banknote} />
        <StatCard index={2} loading={loading} title="Paid" prefix="KSh " value={totalPaid} icon={ClipboardCheck} tone="success" />
        <StatCard index={3} loading={loading} title="Outstanding" prefix="KSh " value={outstanding} icon={Clock} tone="warning" />
      </div>

      {isStaff && !loading && (
        <motion.div
          className="glass-card"
          style={{ marginTop: 16 }}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
        >
          <h2 className="card-title">
            <FileText size={20} /> Completed Visits Awaiting a Bill
          </h2>
          {unbilledAppointments.length === 0 ? (
            <div className="empty-state" style={{ padding: "16px 0" }}>All completed appointments have been billed.</div>
          ) : (
            unbilledAppointments.map((a) => (
              <div key={a._id} className="bill-row">
                <div className="bill-info">
                  <span className="avatar-sm">{initialsOf(a.patient?.name)}</span>
                  <div>
                    {a.patient?.name}
                    <small>
                      {a.date} · Dr. {a.doctor?.name} · KSh {a.doctor?.consultationFee} consultation
                    </small>
                  </div>
                </div>
                <GenerateBillForm appointment={a} onGenerated={() => loadData()} />
              </div>
            ))
          )}
        </motion.div>
      )}

      {!loading && (
        <motion.div
          className="glass-card"
          style={{ marginTop: 16 }}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.25 }}
        >
          <h2 className="card-title">
            <Receipt size={20} /> {user.role === "patient" ? "My Bills" : "All Bills"}
          </h2>
          {bills.length === 0 ? (
            <div className="empty-state">No bills yet.</div>
          ) : (
            <div className="table-scroll">
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
                      {user.role !== "patient" && (
                        <td>
                          <div className="person-cell">
                            <span className="avatar-sm">{initialsOf(b.patient?.name)}</span>
                            {b.patient?.name}
                          </div>
                        </td>
                      )}
                      <td>{b.appointment?.doctor?.name || "—"}</td>
                      <td>{Number(b.total).toLocaleString()}</td>
                      <td>
                        <span className={`badge ${b.isPaid ? "badge-completed" : "badge-pending"}`}>
                          {b.isPaid ? "Paid" : "Unpaid"}
                        </span>
                      </td>
                      <td>
                        <div className="row-actions">
                          <Link to={`/bills/${b._id}`} className="mini-btn ghost">
                            View / Print
                          </Link>
                          {isStaff && !b.isPaid && (
                            <button onClick={() => markPaid(b._id)}>Mark Paid</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default Bills;