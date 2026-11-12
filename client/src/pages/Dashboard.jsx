import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Stethoscope,
  Users,
  CalendarDays,
  CalendarCheck,
  Clock,
  ClipboardCheck,
  Banknote,
  CalendarPlus,
  ConciergeBell,
  X,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import StatCard from "../components/ui/StatCard";
import Skeleton from "../components/ui/Skeleton";

const STATUS_COLORS = {
  pending: "#f59e0b",
  confirmed: "#22a6d6",
  completed: "#12a594",
  cancelled: "#e5484d",
};

const pad = (n) => String(n).padStart(2, "0");
const toDateStr = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
};

const SUBTITLES = {
  admin: "A live view of the hospital: patients, appointments and revenue.",
  doctor: "Your appointments and consultations at a glance.",
  patient: "Your appointments and care at a glance.",
};

const tooltipStyle = {
  borderRadius: 12,
  border: "none",
  boxShadow: "0 10px 30px rgba(6,20,38,0.2)",
  fontSize: 13,
};

/* ---------- Stat tiles ---------- */

const AdminStats = () => {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get("/stats/overview").then((res) => setStats(res.data)).catch(() => {});
  }, []);

  const tiles = [
    { title: "Doctors", value: stats?.doctorCount, icon: Stethoscope },
    { title: "Patients", value: stats?.patientCount, icon: Users },
    { title: "Appointments", value: stats?.appointmentCount, icon: CalendarCheck },
    { title: "Pending", value: stats?.pendingAppointments, icon: Clock, tone: "warning" },
    { title: "Revenue", value: stats?.totalRevenue, prefix: "KSh ", icon: Banknote, tone: "success" },
  ];

  return (
    <div className="stat-grid-v2">
      {tiles.map((t, i) => (
        <StatCard key={t.title} index={i} loading={!stats} {...t} />
      ))}
    </div>
  );
};

const AppointmentStats = ({ appointments, loading }) => {
  const count = (s) => appointments.filter((a) => a.status === s).length;
  const tiles = [
    { title: "Total appointments", value: appointments.length, icon: CalendarDays },
    { title: "Pending", value: count("pending"), icon: Clock, tone: "warning" },
    { title: "Confirmed", value: count("confirmed"), icon: CalendarCheck },
    { title: "Completed", value: count("completed"), icon: ClipboardCheck, tone: "success" },
  ];
  return (
    <div className="stat-grid-v2">
      {tiles.map((t, i) => (
        <StatCard key={t.title} index={i} loading={loading} {...t} />
      ))}
    </div>
  );
};

/* ---------- Charts (built only from real appointments) ---------- */

const Charts = ({ appointments }) => {
  const weekData = useMemo(() => {
    const today = new Date();
    const days = [];
    for (let i = -3; i <= 3; i++) {
      const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() + i);
      days.push({
        key: toDateStr(d),
        label: i === 0 ? "Today" : d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric" }),
        count: 0,
      });
    }
    appointments.forEach((a) => {
      if (a.status === "cancelled") return;
      const day = days.find((x) => x.key === a.date);
      if (day) day.count += 1;
    });
    return days;
  }, [appointments]);

  const statusData = useMemo(
    () =>
      ["pending", "confirmed", "completed", "cancelled"]
        .map((s) => ({ name: s, value: appointments.filter((a) => a.status === s).length }))
        .filter((s) => s.value > 0),
    [appointments]
  );

  return (
    <div className="dash-grid">
      <motion.div
        className="glass-card chart-card"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <h3>Appointments per day</h3>
        <p className="sub">Last 3 days, today and the next 3 days (cancelled excluded)</p>
        <div className="chart-box">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weekData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
              <defs>
                <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22d3ee" />
                  <stop offset="100%" stopColor="#3b82f6" />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="rgba(120,150,180,0.25)" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "#5b7590" }} />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "#5b7590" }} />
              <Tooltip cursor={{ fill: "rgba(34,150,200,0.08)" }} contentStyle={tooltipStyle} formatter={(v) => [v, "Appointments"]} />
              <Bar dataKey="count" fill="url(#barGrad)" radius={[8, 8, 0, 0]} maxBarSize={44} animationDuration={900} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      <motion.div
        className="glass-card chart-card"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.28 }}
      >
        <h3>Appointments by status</h3>
        <p className="sub">All time</p>
        <div className="chart-box" style={{ height: 170 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={statusData}
                dataKey="value"
                nameKey="name"
                innerRadius={52}
                outerRadius={76}
                paddingAngle={3}
                cornerRadius={6}
                stroke="none"
                animationDuration={900}
              >
                {statusData.map((s) => (
                  <Cell key={s.name} fill={STATUS_COLORS[s.name]} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
          <div className="donut-center">
            <div>
              <strong>{appointments.length}</strong>
              <span>total</span>
            </div>
          </div>
        </div>
        <div className="legend-list">
          {statusData.map((s) => (
            <div className="legend-row" key={s.name}>
              <span>
                <i className="legend-dot" style={{ background: STATUS_COLORS[s.name] }} />
                {s.name}
              </span>
              <strong>{s.value}</strong>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

/* ---------- Consultation notes (logic unchanged) ---------- */

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
                <button type="button" className="mini-btn danger" onClick={() => removeLine(idx)} aria-label="Remove medicine">
                  <X size={14} />
                </button>
              )}
            </div>
          ))}
          <button type="button" className="mini-btn ghost" onClick={addLine} style={{ width: "fit-content" }}>
            + Add medicine
          </button>

          <label>Follow-up date (optional)</label>
          <input type="date" value={followUpDate} onChange={(e) => setFollowUpDate(e.target.value)} />

          <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
            <button type="submit" className="mini-btn" disabled={saving}>{saving ? "Saving..." : "Save & Mark Completed"}</button>
            <button type="button" className="mini-btn ghost" onClick={onCancel}>Cancel</button>
          </div>
        </form>
      </td>
    </tr>
  );
};

const ConsultationNotesView = ({ appointment }) => (
  <tr>
    <td colSpan={6}>
      <div className="auth-card" style={{ margin: "0.5rem 0", maxWidth: "600px" }}>
        <p><strong>Diagnosis:</strong> {appointment.diagnosis || "—"}</p>
        <p><strong>Prescription:</strong></p>
        {appointment.prescription?.length ? (
          <ul style={{ marginTop: 0 }}>
            {appointment.prescription.map((p, idx) => (
              <li key={idx}>{p.medicine} — {p.dosage} — {p.duration}</li>
            ))}
          </ul>
        ) : (
          <p style={{ marginTop: 0, opacity: 0.7 }}>None recorded</p>
        )}
        {appointment.followUpDate && <p><strong>Follow-up:</strong> {appointment.followUpDate}</p>}
      </div>
    </td>
  </tr>
);

/* ---------- Appointments table (actions unchanged) ---------- */

const AppointmentsList = ({ role, appointments, setAppointments, loading }) => {
  const [notesFormFor, setNotesFormFor] = useState(null);
  const [notesViewFor, setNotesViewFor] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [reminderStatus, setReminderStatus] = useState({});

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

  if (loading) {
    return (
      <div style={{ display: "grid", gap: 12 }}>
        <Skeleton height={36} />
        <Skeleton height={36} />
        <Skeleton height={36} />
      </div>
    );
  }
  if (!appointments.length) return <div className="empty-state">No appointments yet.</div>;

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
      <div className="filters" style={{ marginBottom: "1rem" }}>
        <input
          placeholder={role === "patient" ? "Search by doctor name..." : "Search by patient or doctor name..."}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">All statuses</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">No appointments match your search.</div>
      ) : (
        <div className="table-scroll">
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
                    <td>
                      <div className="row-actions">
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
                      </div>
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
        </div>
      )}
    </div>
  );
};

/* ---------- Page ---------- */

const Dashboard = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/appointments")
      .then((res) => setAppointments(res.data.appointments))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const today = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>
            {greeting()}, {user.name.split(" ")[0]}
          </h1>
          <p>
            {today} · {SUBTITLES[user.role] || SUBTITLES.patient}
          </p>
        </div>
        <div className="page-actions">
          {user.role === "patient" ? (
            <Link to="/book-appointment" className="btn-dark">
              <CalendarPlus size={16} /> Book appointment
            </Link>
          ) : (
            <Link to="/reception" className="btn-glass">
              <ConciergeBell size={16} /> Reception
            </Link>
          )}
        </div>
      </div>

      {user.role === "admin" ? (
        <AdminStats />
      ) : (
        <AppointmentStats appointments={appointments} loading={loading} />
      )}

      {!loading && appointments.length > 0 && <Charts appointments={appointments} />}

      <motion.div
        className="glass-card"
        style={{ marginTop: 16 }}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.35 }}
      >
        <div className="section-head">
          <h2>{user.role === "patient" ? "My Appointments" : "Appointments"}</h2>
        </div>
        <AppointmentsList
          role={user.role}
          appointments={appointments}
          setAppointments={setAppointments}
          loading={loading}
        />
      </motion.div>
    </div>
  );
};

export default Dashboard;