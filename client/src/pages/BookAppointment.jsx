import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

const BookAppointment = () => {
  const [doctors, setDoctors] = useState([]);
  const [specialization, setSpecialization] = useState("");
  const [specializationOptions, setSpecializationOptions] = useState([]);
  const [doctorId, setDoctorId] = useState("");
  const [date, setDate] = useState("");
  const [reason, setReason] = useState("");
  const [selectedTime, setSelectedTime] = useState("");

  const [slots, setSlots] = useState(null);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  // Fetch the full doctor list once (unfiltered) just to build the
  // specialization suggestion list, so patients see real options
  // even if they don't know the exact spelling.
  useEffect(() => {
    api.get("/doctors").then((res) => {
      const unique = Array.from(
        new Set((res.data.doctors || []).map((d) => d.specialization).filter(Boolean))
      ).sort((a, b) => a.localeCompare(b));
      setSpecializationOptions(unique);
    });
  }, []);

  useEffect(() => {
    api.get("/doctors", { params: specialization ? { specialization } : {} }).then((res) => setDoctors(res.data.doctors));
  }, [specialization]);

  useEffect(() => {
    setSelectedTime("");
    setSlots(null);
    setSlotsError("");
    if (!doctorId || !date) return;

    setSlotsLoading(true);
    api
      .get(`/doctors/${doctorId}/availability`, { params: { date } })
      .then((res) => setSlots(res.data.slots))
      .catch((err) => setSlotsError(err.response?.data?.message || "Could not load availability"))
      .finally(() => setSlotsLoading(false));
  }, [doctorId, date]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!selectedTime) {
      setError("Please pick an available time slot.");
      return;
    }
    try {
      await api.post("/appointments", { doctorId, date, time: selectedTime, reason });
      setSuccess("Appointment booked! Redirecting to your dashboard...");
      setTimeout(() => navigate("/dashboard"), 1200);
    } catch (err) {
      setError(err.response?.data?.message || "Could not book appointment");
    }
  };

  const todayStr = new Date().toISOString().split("T")[0];

  return (
    <div className="page">
      <h1>Book an Appointment</h1>
      <form className="auth-card" onSubmit={handleSubmit}>
        {error && <p className="form-error">{error}</p>}
        {success && <p className="form-success">{success}</p>}

        <label>Filter by specialization</label>
        <input
          list="specialization-options"
          placeholder="e.g. Cardiologist"
          value={specialization}
          onChange={(e) => setSpecialization(e.target.value)}
        />
        <datalist id="specialization-options">
          {specializationOptions.map((s) => (
            <option key={s} value={s} />
          ))}
        </datalist>

        <label>Doctor</label>
        <select required value={doctorId} onChange={(e) => setDoctorId(e.target.value)}>
          <option value="">Select a doctor</option>
          {doctors.map((d) => (
            <option key={d._id} value={d._id}>
              {d.name} — {d.specialization} (KSh {d.consultationFee})
            </option>
          ))}
        </select>

        <label>Date</label>
        <input type="date" required min={todayStr} value={date} onChange={(e) => setDate(e.target.value)} />

        {doctorId && date && (
          <>
            <label>Available times</label>
            {slotsLoading && <p>Checking availability...</p>}
            {slotsError && <p className="form-error">{slotsError}</p>}
            {!slotsLoading && slots && slots.length === 0 && (
              <p>This doctor doesn't work on this day — try a different date.</p>
            )}
            {!slotsLoading && slots && slots.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "0.3rem" }}>
                {slots.map((s) => (
                  <button
                    type="button"
                    key={s.time}
                    disabled={!s.available}
                    onClick={() => setSelectedTime(s.time)}
                    style={{
                      padding: "0.4rem 0.7rem",
                      borderRadius: "6px",
                      border: selectedTime === s.time ? "2px solid #0f4c81" : "1px solid #ccc",
                      background: !s.available ? "#eee" : selectedTime === s.time ? "#e7f0fa" : "white",
                      color: !s.available ? "#999" : "#1a1a2e",
                      cursor: s.available ? "pointer" : "not-allowed",
                      textDecoration: !s.available ? "line-through" : "none",
                    }}
                  >
                    {s.time}
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        <label>Reason for visit</label>
        <textarea value={reason} onChange={(e) => setReason(e.target.value)} />

        <button type="submit" disabled={!selectedTime}>
          Confirm Booking {selectedTime && `— ${selectedTime}`}
        </button>
      </form>
    </div>
  );
};

export default BookAppointment;