import React, { useEffect, useState } from "react";
import api from "../services/api";

const PatientReports = ({ patient }) => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [label, setLabel] = useState("");
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const loadReports = () => {
    setLoading(true);
    api
      .get(`/patients/${patient._id}/reports`)
      .then((res) => setReports(res.data.reports))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patient._id]);

  const handleUpload = async (e) => {
    e.preventDefault();
    setUploadError("");
    if (!file) {
      setUploadError("Choose a file first (JPG, PNG, or PDF).");
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      if (label) formData.append("label", label);
      await api.post(`/patients/${patient._id}/reports`, formData);
      setLabel("");
      setFile(null);
      document.getElementById("report-file-input").value = "";
      loadReports();
    } catch (err) {
      setUploadError(err.response?.data?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (reportId) => {
    await api.delete(`/patients/${patient._id}/reports/${reportId}`);
    setReports((prev) => prev.filter((r) => r._id !== reportId));
  };

  return (
    <div className="auth-card" style={{ marginTop: "1rem" }}>
      <h2>Lab Reports / X-rays</h2>

      {loading ? (
        <p>Loading reports...</p>
      ) : reports.length === 0 ? (
        <p>No reports on file yet.</p>
      ) : (
        <ul style={{ paddingLeft: "1.2rem" }}>
          {reports.map((r) => (
            <li key={r._id} style={{ marginBottom: "0.4rem" }}>
              <a href={r.url} target="_blank" rel="noreferrer">
                {r.label}
              </a>{" "}
              <span style={{ color: "#888", fontSize: "0.8rem" }}>
                ({new Date(r.uploadedAt).toLocaleDateString()})
              </span>{" "}
              <button
                type="button"
                onClick={() => handleDelete(r._id)}
                style={{ background: "#e94560", color: "white", border: "none", borderRadius: "4px", padding: "0.1rem 0.5rem", fontSize: "0.75rem", cursor: "pointer" }}
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={handleUpload} style={{ marginTop: "0.8rem" }}>
        {uploadError && <p className="form-error">{uploadError}</p>}
        <label>Label (optional)</label>
        <input placeholder="e.g. Chest X-ray" value={label} onChange={(e) => setLabel(e.target.value)} />
        <label>File (JPG, PNG, or PDF — max 10MB)</label>
        <input id="report-file-input" type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={(e) => setFile(e.target.files[0])} />
        <button type="submit" disabled={uploading} style={{ marginTop: "0.7rem" }}>
          {uploading ? "Uploading..." : "Upload Report"}
        </button>
      </form>
    </div>
  );
};

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
        <>
          <div className="auth-card" style={{ marginTop: "1rem" }}>
            <h2>Patient Found</h2>
            <p><strong>Member #:</strong> {foundPatient.memberNumber}</p>
            <p><strong>Name:</strong> {foundPatient.name}</p>
            <p><strong>Age:</strong> {foundPatient.age || "—"}</p>
            <p><strong>Gender:</strong> {foundPatient.gender || "—"}</p>
            <p><strong>Phone:</strong> {foundPatient.phone || "—"}</p>
            <p><strong>Address:</strong> {foundPatient.address || "—"}</p>
          </div>
          <PatientReports patient={foundPatient} />
        </>
      )}

      {newPatient && (
        <>
          <div className="auth-card" style={{ marginTop: "1rem" }}>
            <h2>Patient Registered ✅</h2>
            <p>Give this member number to the patient — they'll quote it on future visits:</p>
            <p style={{ fontSize: "1.5rem", fontWeight: 700, color: "#0f4c81" }}>{newPatient.memberNumber}</p>
          </div>
          <PatientReports patient={newPatient} />
        </>
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