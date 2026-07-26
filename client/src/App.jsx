import React from "react";
import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import BookAppointment from "./pages/BookAppointment";
import Reception from "./pages/Reception";
import People from "./pages/People";
import MyAvailability from "./pages/MyAvailability";
import MyRecords from "./pages/MyRecords";
import Bills from "./pages/Bills";
import BillReceipt from "./pages/BillReceipt";

function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/book-appointment"
          element={
            <ProtectedRoute roles={["patient"]}>
              <BookAppointment />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reception"
          element={
            <ProtectedRoute roles={["admin", "doctor"]}>
              <Reception />
            </ProtectedRoute>
          }
        />
        <Route
          path="/people"
          element={
            <ProtectedRoute roles={["admin"]}>
              <People />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-availability"
          element={
            <ProtectedRoute roles={["doctor"]}>
              <MyAvailability />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-records"
          element={
            <ProtectedRoute roles={["patient"]}>
              <MyRecords />
            </ProtectedRoute>
          }
        />
        <Route
          path="/bills"
          element={
            <ProtectedRoute>
              <Bills />
            </ProtectedRoute>
          }
        />
        <Route
          path="/bills/:id"
          element={
            <ProtectedRoute>
              <BillReceipt />
            </ProtectedRoute>
          }
        />
      </Routes>
    </>
  );
}

export default App;