import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Home = () => {
  const { user } = useAuth();

  return (
    <div className="page hero">
      <h1>Hospital Management System</h1>
      <p>Manage patients, doctors, appointments, and billing — all in one place.</p>
      {user ? (
        <Link className="btn" to="/dashboard">
          Go to Dashboard
        </Link>
      ) : (
        <div className="hero-actions">
          <Link className="btn" to="/login">
            Login
          </Link>
          <Link className="btn btn-outline" to="/register">
            Register
          </Link>
        </div>
      )}
    </div>
  );
};

export default Home;
