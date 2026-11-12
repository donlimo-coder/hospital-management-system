import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Search, Stethoscope, Users } from "lucide-react";
import api from "../services/api";
import Skeleton from "../components/ui/Skeleton";

const initialsOf = (name = "") =>
  name
    .replace(/^dr\.?\s+/i, "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join("") || "?";

const SearchField = ({ value, onChange, placeholder }) => (
  <div className="search-field">
    <Search size={16} />
    <input placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} aria-label={placeholder} />
  </div>
);

const SkeletonRows = () => (
  <div style={{ display: "grid", gap: 12 }}>
    <Skeleton height={38} />
    <Skeleton height={38} />
    <Skeleton height={38} />
    <Skeleton height={38} />
  </div>
);

const Row = ({ index, children }) => (
  <motion.tr
    initial={{ opacity: 0, y: 6 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.25, delay: Math.min(index, 10) * 0.03 }}
  >
    {children}
  </motion.tr>
);

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
      <div className="section-head">
        <SearchField value={search} onChange={setSearch} placeholder="Filter by specialization..." />
        {!loading && (
          <span className="count-note">
            {doctors.length} {doctors.length === 1 ? "doctor" : "doctors"}
          </span>
        )}
      </div>

      {loading ? (
        <SkeletonRows />
      ) : !doctors.length ? (
        <div className="empty-state">No doctors found.</div>
      ) : (
        <div className="table-scroll">
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
              {doctors.map((d, i) => (
                <Row key={d._id} index={i}>
                  <td>
                    <div className="person-cell">
                      <span className="avatar-sm">{initialsOf(d.name)}</span>
                      {d.name}
                    </div>
                  </td>
                  <td>
                    <span className="chip">{d.specialization}</span>
                  </td>
                  <td>{d.experienceYears} yrs</td>
                  <td>{d.consultationFee}</td>
                  <td>
                    <span className={`status-tag ${d.isAcceptingPatients ? "status-ok" : "status-off"}`}>
                      {d.isAcceptingPatients ? "Accepting" : "Not accepting"}
                    </span>
                  </td>
                </Row>
              ))}
            </tbody>
          </table>
        </div>
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
      <div className="section-head">
        <SearchField value={search} onChange={setSearch} placeholder="Search by name..." />
        {!loading && (
          <span className="count-note">
            {patients.length} {patients.length === 1 ? "patient" : "patients"}
          </span>
        )}
      </div>

      {loading ? (
        <SkeletonRows />
      ) : !patients.length ? (
        <div className="empty-state">No patients found.</div>
      ) : (
        <div className="table-scroll">
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
              {patients.map((p, i) => (
                <Row key={p._id} index={i}>
                  <td>{p.memberNumber ? <span className="mono-badge">{p.memberNumber}</span> : "—"}</td>
                  <td>
                    <div className="person-cell">
                      <span className="avatar-sm">{initialsOf(p.name)}</span>
                      {p.name}
                    </div>
                  </td>
                  <td>{p.age || "—"}</td>
                  <td style={{ textTransform: "capitalize" }}>{p.gender || "—"}</td>
                  <td>{p.phone || "—"}</td>
                </Row>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const TABS = [
  { value: "doctors", label: "Doctors", icon: Stethoscope },
  { value: "patients", label: "Patients", icon: Users },
];

const People = () => {
  const [tab, setTab] = useState("doctors");

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Doctors & Patients</h1>
          <p>Everyone registered at the hospital, in one place.</p>
        </div>
        <div className="seg" role="tablist" aria-label="People">
          {TABS.map(({ value, label, icon: Icon }) => (
            <button key={value} className={tab === value ? "active" : ""} onClick={() => setTab(value)}>
              {tab === value && (
                <motion.span
                  layoutId="people-pill"
                  className="seg-pill"
                  transition={{ type: "spring", stiffness: 380, damping: 32 }}
                />
              )}
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <Icon size={15} /> {label}
              </span>
            </button>
          ))}
        </div>
      </div>

      <motion.div
        key={tab}
        className="glass-card"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {tab === "doctors" ? <DoctorsTab /> : <PatientsTab />}
      </motion.div>
    </div>
  );
};

export default People;