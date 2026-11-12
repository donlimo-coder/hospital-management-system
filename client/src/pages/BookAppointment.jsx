import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Stethoscope, CalendarDays, Clock, FileText, CalendarCheck, CalendarClock } from "lucide-react";
import api from "../services/api";
import Skeleton from "../components/ui/Skeleton";

const DAY_ORDER = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DAY_FULL = {
  Mon: "Monday",
  Tue: "Tuesday",
  Wed: "Wednesday",
  Thu: "Thursday",
  Fri: "Friday",
  Sat: "Saturday",
  Sun: "Sunday",
};
const DAY_INDEX = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
const JS_DAY_ABBR = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const pad = (n) => String(n).padStart(2, "0");
const toLocalDateStr = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

// Next calendar date (today included) that falls on the given weekday
const nextDateForDay = (abbr) => {
  const d = new Date();
  const diff = (DAY_INDEX[abbr] - d.getDay() + 7) % 7;
  d.setDate(d.getDate() + diff);
  return toLocalDateStr(d);
};

const abbrOfDate = (dateStr) => JS_DAY_ABBR[new Date(`${dateStr}T00:00:00`).getDay()];

const windowsFor = (doctor, abbr) =>
  (doctor?.availability || [])
    .filter((a) => a.day === abbr)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

const initialsOf = (name = "") =>
  name
    .replace(/^dr\.?\s+/i, "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join("") || "?";

const BookAppointment = () => {
  const [allDoctors, setAllDoctors] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [doctorsLoaded, setDoctorsLoaded] = useState(false);
  const [doctorInfo, setDoctorInfo] = useState(null);
  const [specialization, setSpecialization] = useState("");
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

  // Full (unfiltered) doctor list, used to build the visible specialization buttons
  useEffect(() => {
    api
      .get("/doctors")
      .then((res) => setAllDoctors(res.data.doctors || []))
      .catch(() => {})
      .finally(() => setDoctorsLoaded(true));
  }, []);

  // Doctor dropdown, filtered by the chosen specialization
  useEffect(() => {
    api.get("/doctors", { params: specialization ? { specialization } : {} }).then((res) => {
      setDoctors(res.data.doctors);
      // If the previously chosen doctor isn't in this filtered list, clear the choice
      setDoctorId((prev) => (res.data.doctors.some((d) => d._id === prev) ? prev : ""));
    });
  }, [specialization]);

  // Load the chosen doctor's full profile so we can show their weekly schedule
  useEffect(() => {
    if (!doctorId) {
      setDoctorInfo(null);
      return;
    }
    api
      .get(`/doctors/${doctorId}`)
      .then((res) => setDoctorInfo(res.data.doctor))
      .catch(() => setDoctorInfo(null));
  }, [doctorId]);

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

  // Specialization buttons with how many doctors each has
  const specCounts = allDoctors.reduce((acc, d) => {
    if (d.specialization) acc[d.specialization] = (acc[d.specialization] || 0) + 1;
    return acc;
  }, {});
  const specializations = Object.keys(specCounts).sort((a, b) => a.localeCompare(b));

  const todayStr = new Date().toISOString().split("T")[0];
  const selectedDoctor =
    doctorInfo && doctorInfo._id === doctorId ? doctorInfo : doctors.find((d) => d._id === doctorId);

  const hasSchedule = (selectedDoctor?.availability || []).length > 0;
  const pickedAbbr = date ? abbrOfDate(date) : null;
  const pickedWindows = selectedDoctor && pickedAbbr ? windowsFor(selectedDoctor, pickedAbbr) : [];
  const noWorkingDay = !!(selectedDoctor && date && pickedWindows.length === 0);
  const workingDaysText = selectedDoctor
    ? DAY_ORDER.filter((d) => windowsFor(selectedDoctor, d).length > 0)
        .map((d) => DAY_FULL[d])
        .join(", ")
    : "";
  const pickedHoursText = pickedWindows.map((w) => `${w.startTime}–${w.endTime}`).join(" and ");

  const prettyDate = date
    ? new Date(`${date}T00:00:00`).toLocaleDateString("en-GB", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "—";

  const noDoctorsAtClinic = doctorsLoaded && allDoctors.length === 0;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Book an Appointment</h1>
          <p>Choose a specialization and doctor, see when they work, then pick a day and time that suits you.</p>
        </div>
      </div>

      <form className="book-grid" onSubmit={handleSubmit}>
        <motion.div
          className="glass-card"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {error && <div className="notice notice-error">{error}</div>}
          {success && <div className="notice notice-success">{success}</div>}

          <div className="step">
            <h2 className="step-title">
              <span className="step-num">1</span> <Stethoscope size={18} /> Choose a doctor
            </h2>

            {noDoctorsAtClinic ? (
              <div className="notice notice-warn" style={{ marginBottom: 0 }}>
                There are no doctors available at your clinic yet. Please contact the clinic reception.
              </div>
            ) : (
              <div className="form-grid">
                <div className="field full">
                  <label>Specialization</label>
                  {!doctorsLoaded ? (
                    <Skeleton height={34} />
                  ) : (
                    <div className="spec-chips">
                      <button
                        type="button"
                        className={`spec-chip${specialization === "" ? " active" : ""}`}
                        onClick={() => setSpecialization("")}
                      >
                        All <small>{allDoctors.length}</small>
                      </button>
                      {specializations.map((s) => (
                        <button
                          type="button"
                          key={s}
                          className={`spec-chip${specialization === s ? " active" : ""}`}
                          onClick={() => setSpecialization(specialization === s ? "" : s)}
                        >
                          {s} <small>{specCounts[s]}</small>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="field full">
                  <label>Doctor</label>
                  <select required value={doctorId} onChange={(e) => setDoctorId(e.target.value)}>
                    <option value="">Select a doctor</option>
                    {doctors.map((d) => (
                      <option key={d._id} value={d._id}>
                        {d.name} — {d.specialization} (KSh {d.consultationFee})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {selectedDoctor && (
              <div className="schedule-box">
                <div className="schedule-title">
                  <CalendarClock size={16} /> {selectedDoctor.name}'s weekly schedule
                </div>
                {hasSchedule ? (
                  <>
                    <div className="week-strip">
                      {DAY_ORDER.map((day) => {
                        const w = windowsFor(selectedDoctor, day);
                        const on = w.length > 0;
                        const picked = on && pickedAbbr === day;
                        return (
                          <button
                            type="button"
                            key={day}
                            disabled={!on}
                            className={`day-cell${on ? " on" : " off"}${picked ? " picked" : ""}`}
                            onClick={() => setDate(nextDateForDay(day))}
                            title={on ? `Pick the next ${DAY_FULL[day]}` : `Not working on ${DAY_FULL[day]}`}
                          >
                            <strong>{day}</strong>
                            <span>{on ? w.map((x) => `${x.startTime}–${x.endTime}`).join(", ") : "Off"}</span>
                          </button>
                        );
                      })}
                    </div>
                    <p className="schedule-hint">Tap a working day to pick its next date.</p>
                  </>
                ) : (
                  <p className="schedule-hint">This doctor hasn't set working hours yet.</p>
                )}
              </div>
            )}
          </div>

          <div className="step">
            <h2 className="step-title">
              <span className="step-num">2</span> <CalendarDays size={18} /> Pick a date
            </h2>
            <div className="field">
              <input type="date" required min={todayStr} value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            {selectedDoctor && date &&
              (noWorkingDay ? (
                <div className="notice notice-warn" style={{ marginTop: 10, marginBottom: 0 }}>
                  {hasSchedule
                    ? `${selectedDoctor.name} doesn't work on ${DAY_FULL[pickedAbbr]}s. Working days: ${workingDaysText}.`
                    : `${selectedDoctor.name} hasn't set working hours yet.`}
                </div>
              ) : (
                <p className="schedule-hint">
                  {selectedDoctor.name} works {pickedHoursText} on {DAY_FULL[pickedAbbr]}s.
                </p>
              ))}
          </div>

          {doctorId && date && !noWorkingDay && (
            <div className="step">
              <h2 className="step-title">
                <span className="step-num">3</span> <Clock size={18} /> Available times
              </h2>
              {slotsLoading && (
                <div className="slot-grid">
                  {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
                    <Skeleton key={i} height={38} />
                  ))}
                </div>
              )}
              {slotsError && <div className="notice notice-error">{slotsError}</div>}
              {!slotsLoading && slots && slots.length === 0 && (
                <div className="empty-state" style={{ padding: "12px 0" }}>
                  No time slots are available on this day. Try a different date.
                </div>
              )}
              {!slotsLoading && slots && slots.length > 0 && (
                <div className="slot-grid">
                  {slots.map((s) => (
                    <button
                      type="button"
                      key={s.time}
                      disabled={!s.available}
                      onClick={() => setSelectedTime(s.time)}
                      className={`slot${selectedTime === s.time ? " selected" : ""}`}
                    >
                      {s.time}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="step">
            <h2 className="step-title">
              <span className="step-num">{doctorId && date && !noWorkingDay ? 4 : 3}</span> <FileText size={18} /> Reason for visit
            </h2>
            <div className="field">
              <textarea
                placeholder="Briefly describe how you're feeling (optional)"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>
          </div>
        </motion.div>

        <motion.div
          className="glass-card"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <h2 className="card-title">
            <CalendarCheck size={20} /> Booking summary
          </h2>
          {selectedDoctor ? (
            <div className="summary-doctor">
              <span className="avatar-sm">{initialsOf(selectedDoctor.name)}</span>
              <div>
                <strong>{selectedDoctor.name}</strong>
                <small>{selectedDoctor.specialization}</small>
              </div>
            </div>
          ) : (
            <p style={{ color: "var(--ink-soft)", marginTop: 0 }}>No doctor selected yet.</p>
          )}
          <div className="summary-row">
            <span>Consultation fee</span>
            <strong>{selectedDoctor ? `KSh ${selectedDoctor.consultationFee}` : "—"}</strong>
          </div>
          <div className="summary-row">
            <span>Date</span>
            <strong>{prettyDate}</strong>
          </div>
          <div className="summary-row">
            <span>Time</span>
            <strong>{selectedTime || "—"}</strong>
          </div>
          <div className="btn-row">
            <button type="submit" className="btn-dark" disabled={!selectedTime} style={{ width: "100%", justifyContent: "center" }}>
              <CalendarCheck size={16} /> Confirm Booking {selectedTime && `— ${selectedTime}`}
            </button>
          </div>
        </motion.div>
      </form>
    </div>
  );
};

export default BookAppointment;