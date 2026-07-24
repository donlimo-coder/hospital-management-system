import React, { useState } from "react";
import api from "../services/api";

const Reception = () => {
  const [memberNumber, setMemberNumber] = useState("");
  const [foundPatient, setFoundPatient] = useState(null);
  const [searchError, setSearchError] = useState("");
  const [searching, setSearching] = useState(false);

  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [form, setForm] = useState({ name: "", age: "", gender: "male", phone: "", address: "" });
  const [registerError, setRegisterError] = useState("");
  const [newPatient, setNewPatient] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    setSearchError("");
    setFoundPatient(null);
    setNewPatient(null);
    setSearching(true);
    try {
      const { data } = await api.get(`/patients/member/${memberNumber.trim()}`);
      setFoundPatient(data.patient);
    } catch (err) {
      if (err.response?.status === 404) {
        setSearchError("No patient found with that member number.");
        setShowRegisterForm(true);
      } else {
        setSearchError(err.response?.data?.message || "Search failed");
      }
    } finally {
      setSearching(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setRegisterError("");
    try {
      const { data } = await api.post("/patients/walk-in", {
        ...form,
        age: Number(form.age) || undefined,
      });
      setNewPatient(data.patient);
      setShowRegisterForm(false);
      setForm({ name: "", age: "", gender: "male", phone: "", address: "" });
    } catch (err) {
      setRegisterError(err.response?.data?.message || "Registration failed");
    }
  };

  return (
    <div className="page">
      <h1>Reception</h1>
      <p>Look up a returning patient by their member number, or register a new walk-in.</p>

      <form className="auth-card" onSubmit={handleSearch}>
        <h2>Find Patient</h2>
        {searchError && <p className="form-error">{searchError}</p>}
        <label>Member Number</label>
        <input
          placeholder="e.g. HMS-000001"
          required
          value={memberNumber}
          onChange={(e) => setMemberNumber(e.target.value)}
        />
        <button type="submit" disabled={searching}>
          {searching ? "Searching..." : "Search"}
        </button>
      </form>

      {foundPatient && (
        <div className="auth-card" style={{ marginTop: "1rem" }}>
          <h2>Patient Found</h2>
          <p><strong>Member #:</strong> {foundPatient.memberNumber}</p>
          <p><strong>Name:</strong> {foundPatient.name}</p>
          <p><strong>Age:</strong> {foundPatient.age || "—"}</p>
          <p><strong>Gender:</strong> {foundPatient.gender || "—"}</p>
          <p><strong>Phone:</strong> {foundPatient.phone || "—"}</p>
          <p><strong>Address:</strong> {foundPatient.address || "—"}</p>
        </div>
      )}

      {newPatient && (
        <div className="auth-card" style={{ marginTop: "1rem" }}>
          <h2>Patient Registered ✅</h2>
          <p>Give this member number to the patient — they'll quote it on future visits:</p>
          <p style={{ fontSize: "1.5rem", fontWeight: 700, color: "#0f4c81" }}>{newPatient.memberNumber}</p>
        </div>
      )}

      {showRegisterForm && (
        <form className="auth-card" style={{ marginTop: "1rem" }} onSubmit={handleRegister}>
          <h2>Register New Patient</h2>
          {registerError && <p className="form-error">{registerError}</p>}

          <label>Full Name</label>
          <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />

          <label>Age</label>
          <input type="number" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} />

          <label>Gender</label>
          <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>

          <label>Phone</label>
          <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />

          <label>Address</label>
          <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />

          <button type="submit">Register & Get Member Number</button>
        </form>
      )}

      {!showRegisterForm && !foundPatient && (
        <button style={{ marginTop: "1rem" }} onClick={() => setShowRegisterForm(true)}>
          + Register a new walk-in patient
        </button>
      )}
    </div>
  );
};

export default Reception;
