import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

const MyRecords = () => {
  const { user } = useAuth();
  const [patient, setPatient] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user.patientProfile) {
      setError("No patient record is linked to this account yet.");
      setLoading(false);
      return;
    }

    Promise.all([
      api.get(`/patients/${user.patientProfile}`),
      api.get("/appointments"),
      api.get(`/patients/${user.patientProfile}/reports`),
    ])
      .then(([patientRes, apptRes, reportsRes]) => {
        setPatient(patientRes.data.patient);
        setAppointments(apptRes.data.appointments);
        setReports(reportsRes.data.reports);
      })
      .catch((err) => setError(err.response?.data?.message || "Could not load your records"))
      .finally(() => setLoading(false));
  }, [user.patientProfile]);

  if (loading) return <div className="page"><p>Loading your records...</p></div>;
  if (error) return <div className="page"><p className="form-error">{error}</p></div>;

  const pastAppointments = appointments.filter((a) => a.status === "completed");
  const upcomingAppointments = appointments.filter((a) => ["pending", "confirmed"].includes(a.status));

  return (
    <div className="page">
      <h1>My Records</h1>

      <div className="auth-card">
        <h2>My Profile</h2>
        <p><strong>Member #:</strong> {patient.memberNumber}</p>
        <p><strong>Name:</strong> {patient.name}</p>
        <p><strong>Age:</strong> {patient.age || "—"}</p>
        <p><strong>Gender:</strong> {patient.gender || "—"}</p>
        <p><strong>Phone:</strong> {patient.phone || "—"}</p>
        <p><strong>Address:</strong> {patient.address || "—"}</p>
      </div>

      <div className="auth-card" style={{ marginTop: "1rem" }}>
        <h2>Upcoming Appointments</h2>
        {upcomingAppointments.length === 0 ? (
          <p>No upcoming appointments.</p>
        ) : (
          <ul style={{ paddingLeft: "1.2rem" }}>
            {upcomingAppointments.map((a) => (
              <li key={a._id} style={{ marginBottom: "0.4rem" }}>
                {a.date} at {a.time} — Dr. {a.doctor?.name} ({a.doctor?.specialization}){" "}
                <span className={`badge badge-${a.status}`}>{a.status}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="auth-card" style={{ marginTop: "1rem" }}>
        <h2>Visit History</h2>
        {pastAppointments.length === 0 ? (
          <p>No past visits yet.</p>
        ) : (
          pastAppointments.map((a) => (
            <div key={a._id} style={{ borderBottom: "1px solid #eee", paddingBottom: "0.8rem", marginBottom: "0.8rem" }}>
              <p style={{ marginBottom: "0.3rem" }}>
                <strong>{a.date}</strong> — Dr. {a.doctor?.name} ({a.doctor?.specialization})
              </p>
              <p style={{ margin: "0.2rem 0" }}><strong>Diagnosis:</strong> {a.diagnosis || "—"}</p>
              {a.prescription?.length > 0 && (
                <>
                  <p style={{ margin: "0.2rem 0" }}><strong>Prescription:</strong></p>
                  <ul style={{ marginTop: 0 }}>
                    {a.prescription.map((p, idx) => (
                      <li key={idx}>{p.medicine} — {p.dosage} — {p.duration}</li>
                    ))}
                  </ul>
                </>
              )}
              {a.followUpDate && <p style={{ margin: "0.2rem 0" }}><strong>Follow-up:</strong> {a.followUpDate}</p>}
            </div>
          ))
        )}
      </div>

      <div className="auth-card" style={{ marginTop: "1rem" }}>
        <h2>Lab Reports / X-rays</h2>
        {reports.length === 0 ? (
          <p>No reports on file yet.</p>
        ) : (
          <ul style={{ paddingLeft: "1.2rem" }}>
            {reports.map((r) => (
              <li key={r._id} style={{ marginBottom: "0.3rem" }}>
                <a href={r.url} target="_blank" rel="noreferrer">{r.label}</a>{" "}
                <span style={{ color: "#888", fontSize: "0.8rem" }}>
                  ({new Date(r.uploadedAt).toLocaleDateString()})
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default MyRecords;