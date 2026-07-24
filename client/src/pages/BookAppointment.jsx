import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

const BookAppointment = () => {
  const [doctors, setDoctors] = useState([]);
  const [specialization, setSpecialization] = useState("");
  const [form, setForm] = useState({ doctorId: "", date: "", time: "", reason: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/doctors", { params: { specialization } }).then((res) => setDoctors(res.data.doctors));
  }, [specialization]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    try {
      await api.post("/appointments", form);
      setSuccess("Appointment booked! Redirecting to your dashboard...");
      setTimeout(() => navigate("/dashboard"), 1200);
    } catch (err) {
      setError(err.response?.data?.message || "Could not book appointment");
    }
  };

  return (
    <div className="page">
      <h1>Book an Appointment</h1>
      <form className="auth-card" onSubmit={handleSubmit}>
        {error && <p className="form-error">{error}</p>}
        {success && <p className="form-success">{success}</p>}

        <label>Filter by specialization</label>
        <input
          placeholder="e.g. Cardiologist"
          value={specialization}
          onChange={(e) => setSpecialization(e.target.value)}
        />

        <label>Doctor</label>
        <select required value={form.doctorId} onChange={(e) => setForm({ ...form, doctorId: e.target.value })}>
          <option value="">Select a doctor</option>
          {doctors.map((d) => (
            <option key={d._id} value={d._id}>
              {d.name} — {d.specialization} (KSh {d.consultationFee})
            </option>
          ))}
        </select>

        <label>Date</label>
        <input type="date" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />

        <label>Time</label>
        <input type="time" required value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} />

        <label>Reason for visit</label>
        <textarea value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />

        <button type="submit">Confirm Booking</button>
      </form>
    </div>
  );
};

export default BookAppointment;
