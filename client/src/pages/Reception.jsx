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

const MEMBER_PREFIX = "HMS-";

const idNumberLabel = (idType) => {
  if (idType === "passport") return "Passport Number";
  if (idType === "birth_certificate") return "Birth Certificate Number";
  if (idType === "national_id") return "National ID Number";
  return "ID Number";
};

const Reception = () => {
  const [memberDigits, setMemberDigits] = useState("");
  const [foundPatient, setFoundPatient] = useState(null);
  const [searchError, setSearchError] = useState("");
  const [searching, setSearching] = useState(false);

  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [form, setForm] = useState({ name: "", age: "", gender: "male", phone: "", address: "", idType: "", idNumber: "" });
  const [registerError, setRegisterError] = useState("");
  const [newPatient, setNewPatient] = useState(null);

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", age: "", gender: "male", phone: "", address: "", idType: "", idNumber: "" });
  const [editError, setEditError] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  const handleDigitsChange = (e) => {
    // Only allow digits, cap at 6 (matches HMS-000001 style member numbers)
    const digitsOnly = e.target.value.replace(/\D/g, "").slice(0, 6);
    setMemberDigits(digitsOnly);
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    setSearchError("");
    setFoundPatient(null);
    setNewPatient(null);
    setIsEditing(false);

    if (!memberDigits) {
      setSearchError("Enter the member number digits.");
      return;
    }

    const fullMemberNumber = `${MEMBER_PREFIX}${memberDigits.padStart(6, "0")}`;
    setSearching(true);
    try {
      const { data } = await api.get(`/patients/member/${fullMemberNumber}`);
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

  const startEditing = () => {
    setEditForm({
      name: foundPatient.name || "",
      age: foundPatient.age || "",
      gender: foundPatient.gender || "male",
      phone: foundPatient.phone || "",
      address: foundPatient.address || "",
      idType: foundPatient.idType || "",
      idNumber: foundPatient.idNumber || "",
    });
    setEditError("");
    setIsEditing(true);
  };

  const handleEditSave = async (e) => {
    e.preventDefault();
    setEditError("");
    setEditSaving(true);
    try {
      const { data } = await api.put(`/patients/${foundPatient._id}`, {
        ...editForm,
        age: Number(editForm.age) || undefined,
      });
      setFoundPatient(data.patient);
      setIsEditing(false);
    } catch (err) {
      setEditError(err.response?.data?.message || "Update failed");
    } finally {
      setEditSaving(false);
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
      setForm({ name: "", age: "", gender: "male", phone: "", address: "", idType: "", idNumber: "" });
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
        <div style={{ display: "flex", alignItems: "center", border: "1px solid #ccc", borderRadius: "6px", overflow: "hidden" }}>
          <span style={{ padding: "0.5rem 0.4rem", background: "#eaf3f0", color: "#0f4c81", fontWeight: 600, fontFamily: "monospace" }}>
            {MEMBER_PREFIX}
          </span>
          <input
            placeholder="000001"
            required
            inputMode="numeric"
            value={memberDigits}
            onChange={handleDigitsChange}
            style={{ border: "none", flex: 1, padding: "0.5rem", fontFamily: "monospace" }}
          />
        </div>
        <button type="submit" disabled={searching} style={{ marginTop: "0.7rem" }}>
          {searching ? "Searching..." : "Search"}
        </button>
      </form>

      {foundPatient && (
        <>
          <div className="auth-card" style={{ marginTop: "1rem", maxWidth: isEditing ? "650px" : undefined }}>
            <h2>Patient Found</h2>
            {!isEditing ? (
              <>
                <p><strong>Member #:</strong> {foundPatient.memberNumber}</p>
                <p><strong>Name:</strong> {foundPatient.name}</p>
                <p><strong>Age:</strong> {foundPatient.age || "—"}</p>
                <p><strong>Gender:</strong> {foundPatient.gender || "—"}</p>
                <p><strong>Phone:</strong> {foundPatient.phone || "—"}</p>
                <p><strong>Address:</strong> {foundPatient.address || "—"}</p>
                <p><strong>ID:</strong> {foundPatient.idNumber ? `${foundPatient.idType?.replace("_", " ") || "ID"} - ${foundPatient.idNumber}` : "—"}</p>
                <button type="button" onClick={startEditing} style={{ marginTop: "0.5rem" }}>
                  Edit Details
                </button>
              </>
            ) : (
              <form onSubmit={handleEditSave}>
                {editError && <p className="form-error">{editError}</p>}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.9rem 1.2rem" }}>
                  <div>
                    <label>Full Name</label>
                    <input
                      required
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      style={{ width: "100%", boxSizing: "border-box" }}
                    />
                  </div>
                  <div>
                    <label>Age</label>
                    <input
                      type="number"
                      value={editForm.age}
                      onChange={(e) => setEditForm({ ...editForm, age: e.target.value })}
                      style={{ width: "100%", boxSizing: "border-box" }}
                    />
                  </div>
                  <div>
                    <label>Gender</label>
                    <select
                      value={editForm.gender}
                      onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}
                      style={{ width: "100%", boxSizing: "border-box" }}
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label>Phone</label>
                    <input
                      value={editForm.phone}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      style={{ width: "100%", boxSizing: "border-box" }}
                    />
                  </div>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <label>Address</label>
                    <input
                      value={editForm.address}
                      onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                      style={{ width: "100%", boxSizing: "border-box" }}
                    />
                  </div>
                  <div>
                    <label>ID Type</label>
                    <select
                      value={editForm.idType}
                      onChange={(e) => setEditForm({ ...editForm, idType: e.target.value, idNumber: "" })}
                      style={{ width: "100%", boxSizing: "border-box" }}
                    >
                      <option value="">— Select —</option>
                      <option value="national_id">National ID</option>
                      <option value="passport">Passport</option>
                      <option value="birth_certificate">Birth Certificate</option>
                    </select>
                  </div>
                  <div>
                    <label>{idNumberLabel(editForm.idType)}</label>
                    <input
                      value={editForm.idNumber}
                      onChange={(e) => setEditForm({ ...editForm, idNumber: e.target.value })}
                      style={{ width: "100%", boxSizing: "border-box" }}
                    />
                  </div>
                </div>
                <div style={{ display: "flex", gap: "0.5rem", marginTop: "1.1rem" }}>
                  <button type="submit" disabled={editSaving}>
                    {editSaving ? "Saving..." : "Save Changes"}
                  </button>
                  <button type="button" onClick={() => setIsEditing(false)}>
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
          <PatientReports patient={foundPatient} />
        </>
      )}      {newPatient && (
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
          <label>ID Type</label>
          <select value={form.idType} onChange={(e) => setForm({ ...form, idType: e.target.value, idNumber: "" })}>
            <option value="">— Select —</option>
            <option value="national_id">National ID</option>
            <option value="passport">Passport</option>
            <option value="birth_certificate">Birth Certificate</option>
          </select>

          <label>{idNumberLabel(form.idType)}</label>
          <input value={form.idNumber} onChange={(e) => setForm({ ...form, idNumber: e.target.value })} />
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