import React, { useEffect, useState } from "react";
import api from "../services/api";

const DoctorsTab = () => {
  const [doctors, setDoctors] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .get("/doctors", { params: search ? { specialization: search } : {} })
      .then((res) => setDoctors(res.data.doctors))
      .finally(() => setLoading(false));
  }, [search]);

  return (
    <div>
      <input
        placeholder="Filter by specialization..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ padding: "0.5rem", borderRadius: "6px", border: "1px solid #ccc", marginBottom: "1rem", width: "260px" }}
      />
      {loading ? (
        <p>Loading doctors...</p>
      ) : !doctors.length ? (
        <p>No doctors found.</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Specialization</th>
              <th>Experience</th>
              <th>Fee (KSh)</th>
              <th>Accepting patients?</th>
            </tr>
          </thead>
          <tbody>
            {doctors.map((d) => (
              <tr key={d._id}>
                <td>{d.name}</td>
                <td>{d.specialization}</td>
                <td>{d.experienceYears} yrs</td>
                <td>{d.consultationFee}</td>
                <td>{d.isAcceptingPatients ? "Yes" : "No"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

const PatientsTab = () => {
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .get("/patients", { params: search ? { search } : {} })
      .then((res) => setPatients(res.data.patients))
      .finally(() => setLoading(false));
  }, [search]);

  return (
    <div>
      <input
        placeholder="Search by name..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ padding: "0.5rem", borderRadius: "6px", border: "1px solid #ccc", marginBottom: "1rem", width: "260px" }}
      />
      {loading ? (
        <p>Loading patients...</p>
      ) : !patients.length ? (
        <p>No patients found.</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Member #</th>
              <th>Name</th>
              <th>Age</th>
              <th>Gender</th>
              <th>Phone</th>
            </tr>
          </thead>
          <tbody>
            {patients.map((p) => (
              <tr key={p._id}>
                <td>{p.memberNumber || "—"}</td>
                <td>{p.name}</td>
                <td>{p.age || "—"}</td>
                <td>{p.gender || "—"}</td>
                <td>{p.phone || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

const People = () => {
  const [tab, setTab] = useState("doctors");

  return (
    <div className="page">
      <h1>Doctors & Patients</h1>
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
        <button
          onClick={() => setTab("doctors")}
          style={{
            background: tab === "doctors" ? "#0f4c81" : "#e5e7eb",
            color: tab === "doctors" ? "white" : "#333",
            border: "none",
            padding: "0.5rem 1rem",
            borderRadius: "6px",
            cursor: "pointer",
          }}
        >
          Doctors
        </button>
        <button
          onClick={() => setTab("patients")}
          style={{
            background: tab === "patients" ? "#0f4c81" : "#e5e7eb",
            color: tab === "patients" ? "white" : "#333",
            border: "none",
            padding: "0.5rem 1rem",
            borderRadius: "6px",
            cursor: "pointer",
          }}
        >
          Patients
        </button>
      </div>

      {tab === "doctors" ? <DoctorsTab /> : <PatientsTab />}
    </div>
  );
};

export default People;