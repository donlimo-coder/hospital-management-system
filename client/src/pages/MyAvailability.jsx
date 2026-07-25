import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const MyAvailability = () => {
  const { user } = useAuth();
  const [availability, setAvailability] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!user.doctorProfile) return;
    api.get(`/doctors/${user.doctorProfile}`).then((res) => {
      setAvailability(res.data.doctor.availability || []);
      setLoading(false);
    });
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
    } catch (err) {
      setMessage(err.response?.data?.message || "Could not save availability");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="page"><p>Loading...</p></div>;

  return (
    <div className="page">
      <h1>My Weekly Availability</h1>
      <p>Toggle the days you work and set your hours. Patients will only see these slots when booking.</p>

      <form className="auth-card" onSubmit={handleSave} style={{ maxWidth: "500px" }}>
        {message && <p className="form-success">{message}</p>}

        {DAYS.map((day) => {
          const entry = availability.find((a) => a.day === day);
          return (
            <div key={day} style={{ display: "flex", alignItems: "center", gap: "0.7rem", marginTop: "0.6rem" }}>
              <label style={{ width: "90px", marginTop: 0 }}>
                <input type="checkbox" checked={!!entry} onChange={() => toggleDay(day)} /> {day}
              </label>
              {entry && (
                <>
                  <input
                    type="time"
                    value={entry.startTime}
                    onChange={(e) => updateTime(day, "startTime", e.target.value)}
                    style={{ padding: "0.3rem" }}
                  />
                  <span>to</span>
                  <input
                    type="time"
                    value={entry.endTime}
                    onChange={(e) => updateTime(day, "endTime", e.target.value)}
                    style={{ padding: "0.3rem" }}
                  />
                </>
              )}
            </div>
          );
        })}

        <button type="submit" disabled={saving} style={{ marginTop: "1.2rem" }}>
          {saving ? "Saving..." : "Save Availability"}
        </button>
      </form>
    </div>
  );
};

export default MyAvailability;