import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CalendarDays, Clock, CalendarCheck } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import StatCard from "../components/ui/StatCard";
import Skeleton from "../components/ui/Skeleton";

const DAYS = [
  ["Mon", "Monday"],
  ["Tue", "Tuesday"],
  ["Wed", "Wednesday"],
  ["Thu", "Thursday"],
  ["Fri", "Friday"],
  ["Sat", "Saturday"],
  ["Sun", "Sunday"],
];

const toMinutes = (t) => {
  const [h, m] = (t || "").split(":").map(Number);
  return Number.isFinite(h) && Number.isFinite(m) ? h * 60 + m : null;
};

const MyAvailability = () => {
  const { user } = useAuth();
  const [availability, setAvailability] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [messageOk, setMessageOk] = useState(true);

  useEffect(() => {
    if (!user.doctorProfile) {
      setMessage("No doctor profile is linked to this account yet.");
      setMessageOk(false);
      setLoading(false);
      return;
    }
    api
      .get(`/doctors/${user.doctorProfile}`)
      .then((res) => setAvailability(res.data.doctor.availability || []))
      .catch((err) => {
        setMessage(err.response?.data?.message || "Could not load your availability");
        setMessageOk(false);
      })
      .finally(() => setLoading(false));
  }, [user.doctorProfile]);

  const toggleDay = (day) => {
    setAvailability((prev) => {
      const exists = prev.find((a) => a.day === day);
      if (exists) return prev.filter((a) => a.day !== day);
      return [...prev, { day, startTime: "09:00", endTime: "17:00" }];
    });
  };

  const updateTime = (day, field, value) => {
    setAvailability((prev) => prev.map((a) => (a.day === day ? { ...a, [field]: value } : a)));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      await api.put(`/doctors/${user.doctorProfile}`, { availability });
      setMessage("Saved! Patients will see these hours when booking.");
      setMessageOk(true);
    } catch (err) {
      setMessage(err.response?.data?.message || "Could not save availability");
      setMessageOk(false);
    } finally {
      setSaving(false);
    }
  };

  // Worked out from the hours you set below
  const weeklyHours =
    availability.reduce((sum, a) => {
      const s = toMinutes(a.startTime);
      const e = toMinutes(a.endTime);
      return s != null && e != null && e > s ? sum + (e - s) : sum;
    }, 0) / 60;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>My Weekly Availability</h1>
          <p>Toggle the days you work and set your hours. Patients will only see these slots when booking.</p>
        </div>
      </div>

      <div className="stat-grid-v2" style={{ maxWidth: 520 }}>
        <StatCard index={0} loading={loading} title="Working days" value={availability.length} icon={CalendarDays} />
        <StatCard index={1} loading={loading} title="Hours per week" value={Number(weeklyHours.toFixed(1))} decimals={1} icon={Clock} tone="success" />
      </div>

      <motion.form
        className="glass-card"
        onSubmit={handleSave}
        style={{ marginTop: 16, maxWidth: 620 }}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        {message && <div className={`notice ${messageOk ? "notice-success" : "notice-error"}`}>{message}</div>}

        {loading ? (
          <div style={{ display: "grid", gap: 12 }}>
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} height={36} />
            ))}
          </div>
        ) : (
          <>
            {DAYS.map(([day, fullName]) => {
              const entry = availability.find((a) => a.day === day);
              return (
                <div className="day-row" key={day}>
                  <label className="switch" aria-label={`Works on ${fullName}`}>
                    <input type="checkbox" checked={!!entry} onChange={() => toggleDay(day)} />
                    <span className="switch-track" />
                  </label>
                  <span className="day-name">{fullName}</span>
                  {entry ? (
                    <div className="time-range">
                      <input
                        className="time-input"
                        type="time"
                        value={entry.startTime}
                        onChange={(e) => updateTime(day, "startTime", e.target.value)}
                      />
                      <span>to</span>
                      <input
                        className="time-input"
                        type="time"
                        value={entry.endTime}
                        onChange={(e) => updateTime(day, "endTime", e.target.value)}
                      />
                    </div>
                  ) : (
                    <span className="day-off">Not working</span>
                  )}
                </div>
              );
            })}

            <div className="btn-row">
              <button type="submit" className="btn-dark" disabled={saving}>
                <CalendarCheck size={16} /> {saving ? "Saving..." : "Save Availability"}
              </button>
            </div>
          </>
        )}
      </motion.form>
    </div>
  );
};

export default MyAvailability;