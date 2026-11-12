import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CalendarCheck, ClipboardCheck, FileText, UserRound, CalendarDays, Pill } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import StatCard from "../components/ui/StatCard";
import Skeleton from "../components/ui/Skeleton";

const initialsOf = (name = "") =>
  name
    .replace(/^dr\.?\s+/i, "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join("") || "?";

const DateBlock = ({ date }) => {
  const d = new Date(`${date}T00:00:00`);
  if (Number.isNaN(d.getTime())) return <div className="date-block"><strong>—</strong></div>;
  return (
    <div className="date-block">
      <strong>{d.getDate()}</strong>
      <span>{d.toLocaleDateString("en-GB", { month: "short" })}</span>
    </div>
  );
};

const Card = ({ delay = 0, style, children }) => (
  <motion.div
    className="glass-card"
    style={style}
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay }}
  >
    {children}
  </motion.div>
);

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

  if (loading) {
    return (
      <div className="page">
        <div className="page-header"><div><h1>My Records</h1></div></div>
        <div className="stat-grid-v2">
          {[0, 1, 2].map((i) => (
            <StatCard key={i} index={i} loading title="" value={0} />
          ))}
        </div>
        <div className="glass-card" style={{ marginTop: 16, display: "grid", gap: 12 }}>
          <Skeleton height={24} width="30%" />
          <Skeleton height={60} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page">
        <div className="page-header"><div><h1>My Records</h1></div></div>
        <div className="notice notice-error">{error}</div>
      </div>
    );
  }

  const pastAppointments = appointments.filter((a) => a.status === "completed");
  const upcomingAppointments = appointments.filter((a) => ["pending", "confirmed"].includes(a.status));

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>My Records</h1>
          <p>Your profile, appointments, visit history and lab reports in one place.</p>
        </div>
        {patient.memberNumber && (
          <div className="page-actions">
            <span className="member-badge">{patient.memberNumber}</span>
          </div>
        )}
      </div>

      <div className="stat-grid-v2">
        <StatCard index={0} title="Upcoming appointments" value={upcomingAppointments.length} icon={CalendarCheck} />
        <StatCard index={1} title="Completed visits" value={pastAppointments.length} icon={ClipboardCheck} tone="success" />
        <StatCard index={2} title="Lab reports" value={reports.length} icon={FileText} />
      </div>

      <Card delay={0.1} style={{ marginTop: 16 }}>
        <h2 className="card-title">
          <UserRound size={20} /> My Profile
        </h2>
        <dl className="detail-list">
          <div><dt>Name</dt><dd>{patient.name}</dd></div>
          <div><dt>Member #</dt><dd>{patient.memberNumber}</dd></div>
          <div><dt>Age</dt><dd>{patient.age || "—"}</dd></div>
          <div><dt>Gender</dt><dd>{patient.gender || "—"}</dd></div>
          <div><dt>Phone</dt><dd>{patient.phone || "—"}</dd></div>
          <div><dt>Address</dt><dd>{patient.address || "—"}</dd></div>
        </dl>
      </Card>

      <div className="two-col">
        <Card delay={0.18}>
          <h2 className="card-title">
            <CalendarDays size={20} /> Upcoming Appointments
          </h2>
          {upcomingAppointments.length === 0 ? (
            <div className="empty-state" style={{ padding: "16px 0" }}>No upcoming appointments.</div>
          ) : (
            upcomingAppointments.map((a) => (
              <div className="appt-row" key={a._id}>
                <DateBlock date={a.date} />
                <div className="appt-main">
                  Dr. {a.doctor?.name}
                  <small>
                    {a.time} · {a.doctor?.specialization}
                  </small>
                </div>
                <span className={`badge badge-${a.status}`}>{a.status}</span>
              </div>
            ))
          )}
        </Card>

        <Card delay={0.24}>
          <h2 className="card-title">
            <FileText size={20} /> Lab Reports / X-rays
          </h2>
          {reports.length === 0 ? (
            <div className="empty-state" style={{ padding: "16px 0" }}>No reports on file yet.</div>
          ) : (
            <div className="report-list" style={{ marginBottom: 0 }}>
              {reports.map((r) => (
                <div className="report-row" key={r._id}>
                  <FileText size={18} />
                  <a href={r.url} target="_blank" rel="noreferrer">
                    {r.label}
                  </a>
                  <small>{new Date(r.uploadedAt).toLocaleDateString()}</small>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Card delay={0.3} style={{ marginTop: 16 }}>
        <h2 className="card-title">
          <ClipboardCheck size={20} /> Visit History
        </h2>
        {pastAppointments.length === 0 ? (
          <div className="empty-state" style={{ padding: "16px 0" }}>No past visits yet.</div>
        ) : (
          pastAppointments.map((a) => (
            <div className="visit-card" key={a._id}>
              <div className="visit-head">
                <span className="avatar-sm">{initialsOf(a.doctor?.name)}</span>
                <div>
                  Dr. {a.doctor?.name}
                  <small>
                    {a.date} · {a.doctor?.specialization}
                  </small>
                </div>
              </div>
              <p>
                <strong>Diagnosis:</strong> {a.diagnosis || "—"}
              </p>
              {a.prescription?.length > 0 && (
                <>
                  <p style={{ marginBottom: 0 }}>
                    <strong>Prescription:</strong>
                  </p>
                  <div className="rx-list">
                    {a.prescription.map((p, idx) => (
                      <div className="rx-item" key={idx}>
                        <Pill size={15} />
                        <span>
                          {p.medicine} — {p.dosage} — {p.duration}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}
              {a.followUpDate && (
                <p>
                  <strong>Follow-up:</strong> {a.followUpDate}
                </p>
              )}
            </div>
          ))
        )}
      </Card>
    </div>
  );
};

export default MyRecords;