import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/api";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1 = enter phone, 2 = enter code + new password
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSendCode = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);
    try {
      const { data } = await api.post("/auth/forgot-password", { phone });
      setMessage(data.message);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post("/auth/reset-password", { phone, code, newPassword });
      setMessage(data.message);
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      setError(err.response?.data?.message || "Invalid or expired code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {step === 1 ? (
        <form className="auth-card" onSubmit={handleSendCode}>
          <h2>Forgot password</h2>
          <p className="form-hint">
            Enter the phone number on your account. We'll text you a 6-digit code.
          </p>
          {error && <p className="form-error">{error}</p>}
          {message && <p className="form-success">{message}</p>}

          <label>Phone number</label>
          <input
            type="tel"
            required
            placeholder="0722xxxxxx"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />

          <button type="submit" disabled={loading}>
            {loading ? "Sending..." : "Send reset code"}
          </button>

          <p>
            Remembered it? <Link to="/login">Back to login</Link>
          </p>
        </form>
      ) : (
        <form className="auth-card" onSubmit={handleResetPassword}>
          <h2>Enter code &amp; new password</h2>
          <p className="form-hint">
            We sent a 6-digit code to {phone}. It expires in 10 minutes.
          </p>
          {error && <p className="form-error">{error}</p>}
          {message && <p className="form-success">{message}</p>}

          <label>6-digit code</label>
          <input
            type="text"
            required
            maxLength={6}
            inputMode="numeric"
            placeholder="123456"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />

          <label>New password</label>
          <input
            type="password"
            required
            minLength={6}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />

          <label>Confirm new password</label>
          <input
            type="password"
            required
            minLength={6}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />

          <button type="submit" disabled={loading}>
            {loading ? "Resetting..." : "Reset password"}
          </button>

          <p>
            Didn't get a code?{" "}
            <button
              type="button"
              className="link-button"
              onClick={() => {
                setStep(1);
                setError("");
                setMessage("");
              }}
            >
              Try a different number
            </button>
          </p>
        </form>
      )}
    </div>
  );
};

export default ForgotPassword;
