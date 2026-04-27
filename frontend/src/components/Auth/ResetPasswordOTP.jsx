import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Lock } from "lucide-react";
import { motion } from "framer-motion";

export default function ResetPasswordOTP() {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState("");

  const inputsRef = useRef([]);
  const navigate = useNavigate(); // ✅ navigation

  // Handle OTP input
  const handleChange = (value, index) => {
    if (!/^[0-9]?$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      inputsRef.current[index + 1].focus();
    }
  };

  // Handle backspace
  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputsRef.current[index - 1].focus();
    }
  };

  // ✅ Submit
  const handleSubmit = (e) => {
    e.preventDefault();

    const enteredOtp = otp.join("");

    if (enteredOtp !== "123456") {
      return setMessage("Invalid OTP (use 123456)");
    }

    if (password !== confirm) {
      return setMessage("Passwords do not match");
    }

    setMessage("Password reset successful ✅");

    // ✅ Redirect after success
    setTimeout(() => {
      navigate("/"); // goes to login page
    }, 1500);
  };

  return (
    <div className="login-container">
      <div className="login-card">

        {/* Header */}
        <div className="login-header">
          <h2 className="login-title">Verify OTP</h2>
          <p className="login-subtitle">
            Enter the 6-digit code sent to your email
          </p>
        </div>

        {/* Message */}
        {message && (
          <div
            className="error-banner"
            style={{ color: "#00D9FF", borderColor: "#00D9FF" }}
          >
            {message}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="login-form">

          {/* OTP BOXES */}
          <div className="form-group">
            <label className="form-label">OTP Code</label>

            <div
              style={{
                display: "flex",
                gap: "10px",
                justifyContent: "center",
              }}
            >
              {otp.map((digit, index) => (
                <input
                  key={index}
                  type="text"
                  maxLength="1"
                  value={digit}
                  ref={(el) => (inputsRef.current[index] = el)}
                  onChange={(e) => handleChange(e.target.value, index)}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  className="form-input"
                  style={{
                    width: "45px",
                    height: "50px",
                    textAlign: "center",
                    fontSize: "1.2rem",
                  }}
                />
              ))}
            </div>
          </div>

          {/* NEW PASSWORD */}
          <div className="form-group">
            <label className="form-label">New Password</label>
            <div className="input-wrapper">
              <Lock className="input-icon" />
              <input
                type="password"
                className="form-input"
                placeholder="Enter new password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {/* CONFIRM PASSWORD */}
          <div className="form-group">
            <label className="form-label">Confirm Password</label>
            <div className="input-wrapper">
              <Lock className="input-icon" />
              <input
                type="password"
                className="form-input"
                placeholder="Confirm password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
            </div>
          </div>

          {/* SUBMIT */}
          <button type="submit" className="submit-btn">
            <span className="btn-content">Reset Password</span>
          </button>
        </form>
      </div>
    </div>
  );
}