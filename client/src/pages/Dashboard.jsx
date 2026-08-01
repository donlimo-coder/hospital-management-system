import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

const StatCard = ({ label, value }) => (
  <div className="stat-card">
    <p className="stat-value">{value}</p>
    <p className="stat-label">{label}</p>
  </div>
);

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get("/stats/overview").then((res) => setStats(res.data)).catch(() => {});
  }, []);

  return (
    <div>
      <h2>Admin Overview</h2>
      {stats ? (
        <div className="stat-grid">
          <StatCard label="Doctors" value={stats.doctorCount} />
          <StatCard label="Patients" value={stats.patientCount} />
          <StatCard label="Appointments" value={stats.appointmentCount} />
          <StatCard label="Pending" value={stats.pendingAppointments} />
          <StatCard label="Revenue (KSh)" value={stats.totalRevenue} />
        </div>
      ) : (
        <p>Loading stats...</p>
      )}
    </div>
  );
};

const ConsultationNotesForm = ({ appointment, onSave, onCancel }) => {
  const [diagnosis, setDiagnosis] = useState(appointment.diagnosis || "");
  const [prescription, setPrescription] = useState(
    appointment.prescription?.length ? appointment.prescription : [{ medicine: "", dosage: "", duration: "" }]
  );
  const [followUpDate, setFollowUpDate] = useState(appointment.followUpDate || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const updateLine = (idx, field, value) => {
    setPrescription((prev) => prev.map((p, i) => (i === idx ? { ...p, [field]: value } : p)));
  };
  const addLine = () => setPrescription((prev) => [...prev, { medicine: "", dosage: "", duration: "" }]);
  const removeLine = (idx) => setPrescription((prev) => prev.filter((_, i) => i !== idx));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const cleanPrescription = prescription.filter((p) => p.medicine.trim());
      await onSave({ status: "completed", diagnosis, prescription: cleanPrescription, followUpDate: followUpDate || undefined });
    } catch (err) {
      setError(err.response?.data?.message || "Could not save notes");
    } finally {
      setSaving(false);
    }
  };

  return (
    <tr>
      <td colSpan={6}>
        <form onSubmit={handleSubmit} className="auth-card" style={{ margin: "0.5rem 0", maxWidth: "600px" }}>
          <h3 style={{ marginTop: 0 }}>Consultation Notes</h3>
          {error && <p className="form-error">{error}</p>}

          <label>Diagnosis</label>
          <textarea value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} rows={2} />

          <label>Prescription</label>
          {prescription.map((p, idx) => (
            <div key={idx} style={{ display: "flex", gap: "0.4rem", marginBottom: "0.4rem" }}>
              <input
                placeholder="Medicine"
                value={p.medicine}
                onChange={(e) => updateLine(idx, "medicine", e.target.value)}
                style={{ flex: 2 }}
              />
              <input
                placeholder="Dosage"
                value={p.dosage}
                onChange={(e) => updateLine(idx, "dosage", e.target.value)}
                style={{ flex: 1 }}
              />
              <input
                placeholder="Duration"
                value={p.duration}
                onChange={(e) => updateLine(idx, "duration", e.target.value)}
                style={{ flex: 1 }}
              />
              {prescription.length > 1 && (
                <button type="button" onClick={() => removeLine(idx)} style={{ background: "#e94560", color: "white", border: "none", borderRadius: "4px", padding: "0 0.6rem", cursor: "pointer" }}>
                  ✕
                </button>
              )}
            </div>
          ))}
          <button type="button" onClick={addLine} style={{ background: "#e5e7eb", color: "#333", border: "none", borderRadius: "6px", padding: "0.3rem 0.7rem", cursor: "pointer", width: "fit-content" }}>
            + Add medicine
          </button>

          <label>Follow-up date (optional)</label>
          <input type="date" value={followUpDate} onChange={(e) => setFollowUpDate(e.target.value)} />

          <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
            <button type="submit" disabled={saving}>{saving ? "Saving..." : "Save & Mark Completed"}</button>
            <button type="button" onClick={onCancel} style={{ background: "#e5e7eb", color: "#333" }}>Cancel</button>
          </div>
        </form>
      </td>
    </tr>
  );
};

const ConsultationNotesView = ({ appointment }) => (
  <tr>
    <td colSpan={6}>
      <div className="auth-card" style={{ margin: "0.5rem 0", maxWidth: "600px", background: "#f8fafc" }}>
        <p><strong>Diagnosis:</strong> {appointment.diagnosis || "—"}</p>
        <p><strong>Prescription:</strong></p>
        {appointment.prescription?.length ? (
          <ul style={{ marginTop: 0 }}>
            {appointment.prescription.map((p, idx) => (
              <li key={idx}>{p.medicine} — {p.dosage} — {p.duration}</li>
            ))}
          </ul>
        ) : (
          <p style={{ marginTop: 0, color: "#888" }}>None recorded</p>
        )}
        {appointment.followUpDate && <p><strong>Follow-up:</strong> {appointment.followUpDate}</p>}
      </div>
    </td>
  </tr>
);

const AppointmentsList = ({ role }) => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notesFormFor, setNotesFormFor] = useState(null);
  const [notesViewFor, setNotesViewFor] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [reminderStatus, setReminderStatus] = useState({});

  useEffect(() => {
    api
      .get("/appointments")
      .then((res) => setAppointments(res.data.appointments))
      .finally(() => setLoading(false));
  }, []);

  const updateStatus = async (id, status) => {
    await api.put(`/appointments/${id}/status`, { status });
    setAppointments((prev) => prev.map((a) => (a._id === id ? { ...a, status } : a)));
  };

  const saveNotes = async (id, payload) => {
    const { data } = await api.put(`/appointments/${id}/status`, payload);
    setAppointments((prev) => prev.map((a) => (a._id === id ? data.appointment : a)));
    setNotesFormFor(null);
  };

  const cancel = async (id) => {
    await api.put(`/appointments/${id}/cancel`);
    setAppointments((prev) => prev.map((a) => (a._id === id ? { ...a, status: "cancelled" } : a)));
  };

  const sendReminder = async (id) => {
    setReminderStatus((prev) => ({ ...prev, [id]: "sending" }));
    try {
      await api.post(`/appointments/${id}/reminder`);
      setReminderStatus((prev) => ({ ...prev, [id]: "sent" }));
    } catch (err) {
      setReminderStatus((prev) => ({ ...prev, [id]: "failed" }));
    }
  };

  if (loading) return <p>Loading appointments...</p>;
  if (!appointments.length) return <p>No appointments yet.</p>;

  const filtered = appointments.filter((a) => {
    if (statusFilter !== "all" && a.status !== statusFilter) return false;
    if (search.trim()) {
      const term = search.trim().toLowerCase();
      const nameMatch = a.patient?.name?.toLowerCase().includes(term) || a.doctor?.name?.toLowerCase().includes(term);
      if (!nameMatch) return false;
    }
    return true;
  });

  return (
    <div>
      <div style={{ display: "flex", gap: "0.6rem", marginBottom: "1rem", flexWrap: "wrap" }}>
        <input
          placeholder={role === "patient" ? "Search by doctor name..." : "Search by patient or doctor name..."}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ padding: "0.5rem", borderRadius: "6px", border: "1px solid #ccc", width: "260px" }}
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ padding: "0.5rem", borderRadius: "6px", border: "1px solid #ccc" }}
        >
          <option value="all">All statuses</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <p>No appointments match your search.</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Time</th>
              {role !== "patient" && <th>Patient</th>}
              {role !== "doctor" && <th>Doctor</th>}
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((a) => (
              <React.Fragment key={a._id}>
                <tr>
                  <td>{a.date}</td>
                  <td>{a.time}</td>
                  {role !== "patient" && <td>{a.patient?.name}</td>}
                  {role !== "doctor" && <td>{a.doctor?.name}</td>}
                  <td>
                    <span className={`badge badge-${a.status}`}>{a.status}</span>
                  </td>
                  <td style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", alignItems: "center" }}>
                    {role === "doctor" && a.status === "pending" && (
                      <button onClick={() => updateStatus(a._id, "confirmed")}>Confirm</button>
                    )}
                    {role === "doctor" && a.status === "confirmed" && (
                      <button onClick={() => setNotesFormFor(notesFormFor === a._id ? null : a._id)}>
                        {notesFormFor === a._id ? "Close" : "Complete & Add Notes"}
                      </button>
                    )}
                    {role === "patient" && ["pending", "confirmed"].includes(a.status) && (
                      <button onClick={() => cancel(a._id)}>Cancel</button>
                    )}
                    {a.status === "completed" && (
                      <button onClick={() => setNotesViewFor(notesViewFor === a._id ? null : a._id)}>
                        {notesViewFor === a._id ? "Hide Notes" : "View Notes"}
                      </button>
                    )}
                    {["admin", "doctor"].includes(role) && ["pending", "confirmed"].includes(a.status) && (
                      <button
                        onClick={() => sendReminder(a._id)}
                        disabled={reminderStatus[a._id] === "sending"}
                      >
                        {reminderStatus[a._id] === "sending"
                          ? "Sending..."
                          : reminderStatus[a._id] === "sent"
                          ? "Reminder Sent"
                          : reminderStatus[a._id] === "failed"
                          ? "Retry Reminder"
                          : "Send Reminder"}
                      </button>
                    )}
                  </td>
                </tr>
                {notesFormFor === a._id && (
                  <ConsultationNotesForm
                    appointment={a}
                    onSave={(payload) => saveNotes(a._id, payload)}
                    onCancel={() => setNotesFormFor(null)}
                  />
                )}
                {notesViewFor === a._id && <ConsultationNotesView appointment={a} />}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

const Dashboard = () => {
  const { user } = useAuth();

  return (
    <div className="page">
      <h1>Welcome, {user.name.split(" ")[0]} 👋</h1>
      {user.role === "admin" && <AdminDashboard />}
      <h2 style={{ marginTop: "2rem" }}>
        {user.role === "patient" ? "My Appointments" : "Appointments"}
      </h2>
      <AppointmentsList role={user.role} />
    </div>
  );
};

export default Dashboard;