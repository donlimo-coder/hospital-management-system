import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        🏥 Hospital MS
      </Link>
      <div className="navbar-links">
        {user ? (
          <>
            <Link to="/dashboard">Dashboard</Link>
            <Link to="/bills">Bills</Link>
            {user.role === "patient" && <Link to="/book-appointment">Book Appointment</Link>}
            {user.role === "patient" && <Link to="/my-records">My Records</Link>}
            {["admin", "doctor"].includes(user.role) && <Link to="/reception">Reception</Link>}
            {user.role === "doctor" && <Link to="/my-availability">My Availability</Link>}
            {user.role === "admin" && <Link to="/people">Doctors & Patients</Link>}
            {user.role === "admin" && <Link to="/analytics">Analytics</Link>}
            
            <span className="navbar-user">
              {user.name} ({user.role})
            </span>
            <button onClick={handleLogout}>Logout</button>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;