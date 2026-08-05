import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import heroImage from "../assets/images/hero-1.jpg";
import doctorPatientImage from "../assets/images/doctor-patient-1.jpg";
import "./Home.css";

const Home = () => {
  const { user } = useAuth();

  if (user) {
    return (
      <div className="page hero">
        <h1>Welcome back</h1>
        <p>Manage patients, doctors, appointments, and billing — all in one place.</p>
        <Link className="btn" to="/dashboard">
          Go to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="landing">
      <section
        className="landing-hero"
        style={{ backgroundImage: `url(${heroImage})` }}
      >
        <div>
          <span className="landing-eyebrow">For patients &amp; care teams</span>
          <h1>
            Book care in the time <br />
            it takes to <span className="accent">read this.</span>
          </h1>
          <p className="landing-sub">
            See a doctor's real open hours, pick a slot, and get a reminder before your
            visit. No phone tag, no guessing whether the clinic is even open.
          </p>
          <div className="landing-hero-actions">
            <Link className="landing-btn-primary" to="/register">
              Create your patient account
            </Link>
            <Link className="landing-staff-link" to="/login">
              Hospital staff sign in →
            </Link>
          </div>
        </div>

        <div className="landing-slotcard">
          <div className="landing-slotcard-head">
            <h3>Dr. Achieng — Thursday</h3>
            <span className="mono">6 open</span>
          </div>
          <div className="landing-slot-grid">
            <div className="landing-slot">09:00</div>
            <div className="landing-slot taken">09:30</div>
            <div className="landing-slot">10:00</div>
            <div className="landing-slot picked">10:30</div>
            <div className="landing-slot">11:00</div>
            <div className="landing-slot taken">11:30</div>
            <div className="landing-slot">13:00</div>
            <div className="landing-slot">13:30</div>
            <div className="landing-slot">14:00</div>
          </div>
          <p className="landing-slotcard-foot">
            Slots update the moment someone else books — no double-bookings.
          </p>
        </div>
      </section>

      <section className="landing-trust">
        <div className="landing-trust-item">
          <div>
            <strong>Real doctor availability</strong>
            Every slot you see is what's actually open, set by the doctor themself.
          </div>
        </div>
        <div className="landing-trust-item">
          <div>
            <strong>Separate views for every role</strong>
            Admins, doctors, and patients each get exactly what they need — nothing else.
          </div>
        </div>
        <div className="landing-trust-item">
          <div>
            <strong>SMS reminders</strong>
            A text before your visit, so appointments don't slip your mind.
          </div>
        </div>
      </section>

      <section className="landing-photo">
        <div className="landing-photo-image">
          <img src={doctorPatientImage} alt="Doctor consulting with a patient" />
        </div>
        <div className="landing-photo-text">
          <span className="landing-eyebrow">Care, not just software</span>
          <h2>Built around the moment that matters</h2>
          <p>
            Every feature here exists to protect the few minutes a doctor and patient
            actually spend together — accurate records on hand, nothing lost in
            paperwork, no waiting for a file to be found.
          </p>
        </div>
      </section>

      <section className="landing-steps">
        <h2>How it works</h2>
        <div className="landing-steps-grid">
          <div className="landing-step">
            <span className="landing-step-num mono">01</span>
            <h3>Create an account</h3>
            <p>Register with your name and phone number. You'll get a member number to quote on future visits.</p>
          </div>
          <div className="landing-step">
            <span className="landing-step-num mono">02</span>
            <h3>Pick a doctor & time</h3>
            <p>Filter by specialization, see open slots for any day, and book instantly.</p>
          </div>
          <div className="landing-step">
            <span className="landing-step-num mono">03</span>
            <h3>Show up — we'll remind you</h3>
            <p>Get an SMS ahead of your appointment, then find your visit notes and bill afterward.</p>
          </div>
        </div>
      </section>

      <section className="landing-features">
        <h2>Everything the front desk used to handle on paper</h2>
        <div className="landing-features-grid">
          <div className="landing-feature-card">
            <h3>Patient records</h3>
            <p>Visit history, diagnoses, and prescriptions, searchable by name, phone, or ID number.</p>
          </div>
          <div className="landing-feature-card">
            <h3>Lab reports & X-rays</h3>
            <p>Upload and attach results directly to a patient's file for doctors to review.</p>
          </div>
          <div className="landing-feature-card">
            <h3>Billing & receipts</h3>
            <p>Generate itemized bills after a visit and print or save a receipt as PDF.</p>
          </div>
          <div className="landing-feature-card">
            <h3>Walk-in registration</h3>
            <p>Front desk can register a new patient on the spot and hand them a member number.</p>
          </div>
          <div className="landing-feature-card">
            <h3>Doctor scheduling</h3>
            <p>Doctors set their own weekly hours — the booking page only shows what's really open.</p>
          </div>
          <div className="landing-feature-card">
            <h3>Role-based security</h3>
            <p>Admins, doctors, and patients see only what's relevant to them, with automatic sign-out.</p>
          </div>
        </div>
      </section>

      <section className="landing-cta">
        <h2>Ready when you are.</h2>
        <p>Set up your account in under a minute — no paperwork required.</p>
        <Link className="landing-btn-primary" to="/register">
          Create your patient account
        </Link>
      </section>
    </div>
  );
};

export default Home;
