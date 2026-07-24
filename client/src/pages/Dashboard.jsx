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

const AppointmentsList = ({ role }) => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const cancel = async (id) => {
    await api.put(`/appointments/${id}/cancel`);
    setAppointments((prev) => prev.map((a) => (a._id === id ? { ...a, status: "cancelled" } : a)));
  };

  if (loading) return <p>Loading appointments...</p>;
  if (!appointments.length) return <p>No appointments yet.</p>;

  return (
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
        {appointments.map((a) => (
          <tr key={a._id}>
            <td>{a.date}</td>
            <td>{a.time}</td>
            {role !== "patient" && <td>{a.patient?.name}</td>}
            {role !== "doctor" && <td>{a.doctor?.name}</td>}
            <td>
              <span className={`badge badge-${a.status}`}>{a.status}</span>
            </td>
            <td>
              {role === "doctor" && a.status === "pending" && (
                <button onClick={() => updateStatus(a._id, "confirmed")}>Confirm</button>
              )}
              {role === "doctor" && a.status === "confirmed" && (
                <button onClick={() => updateStatus(a._id, "completed")}>Complete</button>
              )}
              {role === "patient" && ["pending", "confirmed"].includes(a.status) && (
                <button onClick={() => cancel(a._id)}>Cancel</button>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
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
