import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Search, UserPlus, Pencil, FileText, Upload, Trash2, UserCheck, ConciergeBell } from "lucide-react";
import api from "../services/api";

const Panel = ({ children, className = "glass-card" }) => (
  <motion.div
    className={className}
    initial={{ opacity: 0, y: 14 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -8 }}
    transition={{ duration: 0.3 }}
  >
    {children}
  </motion.div>
);

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
    <Panel>
      <h2 className="card-title">
        <FileText size={20} /> Lab Reports / X-rays
      </h2>

      {loading ? (
        <p>Loading reports...</p>
      ) : reports.length === 0 ? (
        <p style={{ color: "var(--ink-soft)", marginTop: 0 }}>No reports on file yet.</p>
      ) : (
        <div className="report-list">
          {reports.map((r) => (
            <div className="report-row" key={r._id}>
              <FileText size={18} />
              <a href={r.url} target="_blank" rel="noreferrer">
                {r.label}
              </a>
              <small>{new Date(r.uploadedAt).toLocaleDateString()}</small>
              <button type="button" className="mini-btn danger" onClick={() => handleDelete(r._id)} aria-label="Delete report">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleUpload} className="upload-box">
        {uploadError && <p className="form-error">{uploadError}</p>}
        <div className="form-grid">
          <div className="field full">
            <label>Label (optional)</label>
            <input placeholder="e.g. Chest X-ray" value={label} onChange={(e) => setLabel(e.target.value)} />
          </div>
          <div className="field full">
            <label>File (JPG, PNG, or PDF, max 10MB)</label>
            <input id="report-file-input" type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={(e) => setFile(e.target.files[0])} />
          </div>
        </div>
        <div className="btn-row">
          <button type="submit" className="btn-dark" disabled={uploading}>
            <Upload size={16} /> {uploading ? "Uploading..." : "Upload Report"}
          </button>
        </div>
      </form>
    </Panel>
  );
};

const MEMBER_PREFIX = "HMS-";

const idNumberLabel = (idType) => {
  if (idType === "passport") return "Passport Number";
  if (idType === "birth_certificate") return "Birth Certificate Number";
  if (idType === "national_id") return "National ID Number";
  return "ID Number";
};

const emptyForm = { name: "", age: "", gender: "male", phone: "", address: "", idType: "", idNumber: "" };

const PatientFields = ({ values, onChange }) => (
  <div className="form-grid">
    <div className="field">
      <label>Full Name</label>
      <input required value={values.name} onChange={(e) => onChange({ ...values, name: e.target.value })} />
    </div>
    <div className="field">
      <label>Age</label>
      <input type="number" value={values.age} onChange={(e) => onChange({ ...values, age: e.target.value })} />
    </div>
    <div className="field">
      <label>Gender</label>
      <select value={values.gender} onChange={(e) => onChange({ ...values, gender: e.target.value })}>
        <option value="male">Male</option>
        <option value="female">Female</option>
        <option value="other">Other</option>
      </select>
    </div>
    <div className="field">
      <label>Phone</label>
      <input value={values.phone} onChange={(e) => onChange({ ...values, phone: e.target.value })} />
    </div>
    <div className="field full">
      <label>Address</label>
      <input value={values.address} onChange={(e) => onChange({ ...values, address: e.target.value })} />
    </div>
    <div className="field">
      <label>ID Type</label>
      <select value={values.idType} onChange={(e) => onChange({ ...values, idType: e.target.value, idNumber: "" })}>
        <option value="">Select</option>
        <option value="national_id">National ID</option>
        <option value="passport">Passport</option>
        <option value="birth_certificate">Birth Certificate</option>
      </select>
    </div>
    <div className="field">
      <label>{idNumberLabel(values.idType)}</label>
      <input value={values.idNumber} onChange={(e) => onChange({ ...values, idNumber: e.target.value })} />
    </div>
  </div>
);

const Reception = () => {
  const [memberDigits, setMemberDigits] = useState("");
  const [foundPatient, setFoundPatient] = useState(null);
  const [searchError, setSearchError] = useState("");
  const [searching, setSearching] = useState(false);

  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [registerError, setRegisterError] = useState("");
  const [newPatient, setNewPatient] = useState(null);

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState(emptyForm);
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
      setForm(emptyForm);
    } catch (err) {
      setRegisterError(err.response?.data?.message || "Registration failed");
    }
  };

  const nothingToShow = !foundPatient && !newPatient && !showRegisterForm;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Reception</h1>
          <p>Look up a returning patient by their member number, or register a new walk-in.</p>
        </div>
        {!showRegisterForm && !foundPatient && (
          <div className="page-actions">
            <button className="btn-dark" onClick={() => setShowRegisterForm(true)}>
              <UserPlus size={16} /> Register walk-in patient
            </button>
          </div>
        )}
      </div>

      <div className="reception-grid">
        <div className="stack">
          <form className="glass-card" onSubmit={handleSearch}>
            <h2 className="card-title">
              <Search size={20} /> Find Patient
            </h2>
            {searchError && <p className="form-error">{searchError}</p>}
            <div className="field">
              <label>Member Number</label>
              <div className="member-input">
                <span className="member-prefix">{MEMBER_PREFIX}</span>
                <input
                  placeholder="000001"
                  required
                  inputMode="numeric"
                  value={memberDigits}
                  onChange={handleDigitsChange}
                />
              </div>
            </div>
            <div className="btn-row">
              <button type="submit" className="btn-dark" disabled={searching}>
                <Search size={16} /> {searching ? "Searching..." : "Search"}
              </button>
            </div>
          </form>
        </div>

        <div className="stack">
          <AnimatePresence mode="popLayout">
            {foundPatient && (
              <React.Fragment key="found">
                <Panel>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 14 }}>
                    <h2 className="card-title" style={{ margin: 0 }}>
                      <UserCheck size={20} /> Patient Found
                    </h2>
                    <span className="member-badge">{foundPatient.memberNumber}</span>
                  </div>

                  {!isEditing ? (
                    <>
                      <dl className="detail-list">
                        <div><dt>Name</dt><dd>{foundPatient.name}</dd></div>
                        <div><dt>Age</dt><dd>{foundPatient.age || "—"}</dd></div>
                        <div><dt>Gender</dt><dd>{foundPatient.gender || "—"}</dd></div>
                        <div><dt>Phone</dt><dd>{foundPatient.phone || "—"}</dd></div>
                        <div className="full"><dt>Address</dt><dd>{foundPatient.address || "—"}</dd></div>
                        <div className="full">
                          <dt>ID</dt>
                          <dd>
                            {foundPatient.idNumber
                              ? `${foundPatient.idType?.replace("_", " ") || "ID"} - ${foundPatient.idNumber}`
                              : "—"}
                          </dd>
                        </div>
                      </dl>
                      <div className="btn-row">
                        <button type="button" className="btn-glass" onClick={startEditing}>
                          <Pencil size={16} /> Edit Details
                        </button>
                      </div>
                    </>
                  ) : (
                    <form onSubmit={handleEditSave}>
                      {editError && <p className="form-error">{editError}</p>}
                      <PatientFields values={editForm} onChange={setEditForm} />
                      <div className="btn-row">
                        <button type="submit" className="btn-dark" disabled={editSaving}>
                          {editSaving ? "Saving..." : "Save Changes"}
                        </button>
                        <button type="button" className="btn-glass" onClick={() => setIsEditing(false)}>
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}
                </Panel>
                <PatientReports patient={foundPatient} />
              </React.Fragment>
            )}

            {newPatient && (
              <React.Fragment key="new">
                <Panel>
                  <div className="success-row">
                    <UserCheck size={22} /> Patient Registered
                  </div>
                  <p>Give this member number to the patient. They'll quote it on future visits:</p>
                  <span className="member-badge big">{newPatient.memberNumber}</span>
                </Panel>
                <PatientReports patient={newPatient} />
              </React.Fragment>
            )}

            {showRegisterForm && (
              <motion.form
                key="register"
                className="glass-card"
                onSubmit={handleRegister}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3 }}
              >
                <h2 className="card-title">
                  <UserPlus size={20} /> Register New Patient
                </h2>
                {registerError && <p className="form-error">{registerError}</p>}
                <PatientFields values={form} onChange={setForm} />
                <div className="btn-row">
                  <button type="submit" className="btn-dark">
                    <UserPlus size={16} /> Register & Get Member Number
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>

          {nothingToShow && (
            <div className="glass-card empty-panel">
              <ConciergeBell size={34} />
              <p style={{ margin: 0 }}>Search for a patient by member number, or register a walk-in to get started.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Reception;