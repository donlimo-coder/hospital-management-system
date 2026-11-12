import React from "react";
import { Routes, Route, Outlet } from "react-router-dom";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import AppShell from "./components/layout/AppShell";
import Home from "./pages/Home";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import BookAppointment from "./pages/BookAppointment";
import Reception from "./pages/Reception";
import Analytics from "./pages/Analytics";
import People from "./pages/People";
import MyAvailability from "./pages/MyAvailability";
import MyRecords from "./pages/MyRecords";
import Bills from "./pages/Bills";
import BillReceipt from "./pages/BillReceipt";

const PublicLayout = () => (
  <>
    <Navbar />
    <Outlet />
  </>
);

function App() {
  return (
    <Routes>
      {/* Public pages keep the top navbar */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/register" element={<Register />} />
      </Route>

      {/* Everything behind login lives in the dashboard shell */}
      <Route
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
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
          path="/analytics"
          element={
            <ProtectedRoute roles={["admin"]}>
              <Analytics />
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
        <Route path="/bills" element={<Bills />} />
        <Route path="/bills/:id" element={<BillReceipt />} />
      </Route>
    </Routes>
  );
}

export default App;