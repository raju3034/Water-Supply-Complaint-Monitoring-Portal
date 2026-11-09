import React, { useState } from "react";
import { api } from "../services/api";

export default function AuthScreen({ currentUser, onLoginSuccess, onLogout }) {
  const [activeTab, setActiveTab] = useState("login"); // 'login' or 'register'

  // Login form
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

  // Register form
  const [regData, setRegData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    assignedArea: "Ward 1 - Old Town Heritage",
  });
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState("");
  const [regSuccess, setRegSuccess] = useState("");

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError("");

    try {
      const res = await api.auth.login({ email: loginEmail, password: loginPassword });
      if (res.success) {
        localStorage.setItem("jalconnect_token", res.token);
        localStorage.setItem("jalconnect_user", JSON.stringify(res.user));
        onLoginSuccess(res.user);
      } else {
        setLoginError(res.message || "Invalid credentials.");
      }
    } catch (err) {
      setLoginError(err.message || "Sign in failed.");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setRegLoading(true);
    setRegError("");
    setRegSuccess("");

    if (!regData.name.trim() || !regData.email.trim() || !regData.phone.trim() || !regData.password) {
      setRegError("All fields are mandatory.");
      setRegLoading(false);
      return;
    }

    try {
      const res = await api.auth.register(regData);
      if (res.success) {
        setRegSuccess("Account registered successfully! Signing you in...");
        localStorage.setItem("jalconnect_token", res.token);
        localStorage.setItem("jalconnect_user", JSON.stringify(res.user));
        setTimeout(() => {
          onLoginSuccess(res.user);
        }, 1000);
      } else {
        setRegError(res.message || "Registration failed.");
      }
    } catch (err) {
      setRegError(err.message || "Failed to register account.");
    } finally {
      setRegLoading(false);
    }
  };

  const handleQuickRole = async (email, pwd) => {
    setLoginEmail(email);
    setLoginPassword(pwd);
    setLoginLoading(true);
    setLoginError("");
    try {
      const res = await api.auth.login({ email, password: pwd });
      if (res.success) {
        localStorage.setItem("jalconnect_token", res.token);
        localStorage.setItem("jalconnect_user", JSON.stringify(res.user));
        onLoginSuccess(res.user);
      }
    } catch (err) {
      setLoginError(err.message || "Quick login failed.");
    } finally {
      setLoginLoading(false);
    }
  };

  const demoAccounts = [
    {
      role: "Admin",
      title: "👑 System Administrator",
      email: "admin@jalconnect.gov.in",
      pwd: "Admin@1234",
      duty: "Complete system authority, audit trails, and executive reporting.",
      color: "#4f46e5",
    },
    {
      role: "Water Department Officer",
      title: "🏢 Department Officer",
      email: "officer@jalconnect.gov.in",
      pwd: "Officer@1234",
      duty: "Complaint allocation, technician dispatching, and schedule publishing.",
      color: "#0284c7",
    },
    {
      role: "Field Technician",
      title: "🔧 Field Technician",
      email: "technician@jalconnect.gov.in",
      pwd: "Tech@1234",
      duty: "On-site pipe repair, valve replacement, and resolution logs.",
      color: "#d97706",
    },
    {
      role: "Citizen",
      title: "👤 Citizen Consumer",
      email: "citizen@example.com",
      pwd: "Citizen@1234",
      duty: "Register grievances, track status, and rate service quality.",
      color: "#059669",
    },
  ];

  return (
    <div className="screen-container">
      {currentUser ? (
        <div className="logged-in-card">
          <div className="logged-in-icon">✅</div>
          <h3>Currently Signed In</h3>
          <p className="logged-in-name">{currentUser.name}</p>
          <div className="logged-in-details">
            <span className={`user-role-pill role-${currentUser.role.toLowerCase().replace(/\s+/g, "-")}`}>
              {currentUser.role}
            </span>
            <span className="logged-in-email">{currentUser.email}</span>
            <span className="logged-in-area">{currentUser.assignedArea || "All Zones"}</span>
          </div>

          <div className="logged-in-actions">
            <button type="button" className="btn btn-secondary" onClick={onLogout}>
              Sign Out from Account
            </button>
          </div>
        </div>
      ) : null}

      {/* 1-Click Role Showcase */}
      <div className="quick-roles-showcase">
        <div className="section-header-compact">
          <h3 className="section-title">⚡ Fast Evaluation: 1-Click Role Sign In</h3>
          <span className="eval-pill">EVALUATION READY</span>
        </div>
        <p className="section-desc">
          DevOps Evaluation feature: instantly test each assigned user role with pre-configured mock credentials.
        </p>

        <div className="quick-roles-grid">
          {demoAccounts.map((acc) => (
            <div key={acc.role} className="quick-role-card" style={{ borderColor: acc.color }}>
              <div className="quick-role-header">
                <h4 style={{ color: acc.color }}>{acc.title}</h4>
                <span className="quick-role-badge">{acc.role}</span>
              </div>
              <p className="quick-role-duty">{acc.duty}</p>
              <div className="quick-role-creds">
                <small><strong>User:</strong> {acc.email}</small>
                <small><strong>Pass:</strong> {acc.pwd}</small>
              </div>
              <button
                type="button"
                className="btn btn-outline"
                style={{ borderColor: acc.color, color: acc.color }}
                onClick={() => handleQuickRole(acc.email, acc.pwd)}
                disabled={loginLoading}
              >
                Log In as {acc.role.split(" ")[0]}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Standard Login & Registration Form */}
      <div className="auth-box-container">
        <div className="auth-tabs">
          <button
            type="button"
            className={`auth-tab-btn ${activeTab === "login" ? "active" : ""}`}
            onClick={() => setActiveTab("login")}
          >
            🔐 Sign In to Portal
          </button>
          <button
            type="button"
            className={`auth-tab-btn ${activeTab === "register" ? "active" : ""}`}
            onClick={() => setActiveTab("register")}
          >
            📝 Citizen Registration
          </button>
        </div>

        {activeTab === "login" ? (
          <form onSubmit={handleLoginSubmit} className="auth-form">
            <h3>Portal Account Login</h3>
            <p className="auth-sub">Enter your email and password to access your role-specific dashboard.</p>

            {loginError && <div className="notice notice-error">{loginError}</div>}

            <div className="form-group">
              <label>Official / Registered Email Address:</label>
              <input
                type="email"
                className="text-input"
                placeholder="e.g. officer@jalconnect.gov.in"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Password:</label>
              <input
                type="password"
                className="text-input"
                placeholder="Enter your password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary btn-large" disabled={loginLoading}>
              {loginLoading ? "Authenticating..." : "Sign In"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegisterSubmit} className="auth-form">
            <h3>Create Citizen Account</h3>
            <p className="auth-sub">Register to lodge complaints and track water repair progress in real time.</p>

            {regError && <div className="notice notice-error">{regError}</div>}
            {regSuccess && <div className="notice notice-success">{regSuccess}</div>}

            <div className="form-group">
              <label>Full Legal Name:</label>
              <input
                type="text"
                className="text-input"
                placeholder="e.g. Meera Reddy"
                value={regData.name}
                onChange={(e) => setRegData({ ...regData, name: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>Email Address:</label>
              <input
                type="email"
                className="text-input"
                placeholder="e.g. meera.reddy@example.com"
                value={regData.email}
                onChange={(e) => setRegData({ ...regData, email: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>10-Digit Mobile Number:</label>
              <input
                type="tel"
                className="text-input"
                maxLength="10"
                placeholder="e.g. 9845123456"
                value={regData.phone}
                onChange={(e) => setRegData({ ...regData, phone: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>Residential Ward / Locality:</label>
              <select
                className="select-input"
                value={regData.assignedArea}
                onChange={(e) => setRegData({ ...regData, assignedArea: e.target.value })}
              >
                <option value="Ward 1 - Old Town Heritage">Ward 1 - Old Town Heritage</option>
                <option value="Ward 2 - Lakeview Residency">Ward 2 - Lakeview Residency</option>
                <option value="Ward 3 - Green Park Colony">Ward 3 - Green Park Colony</option>
                <option value="Ward 4 - Industrial Area & Enclave">Ward 4 - Industrial Area & Enclave</option>
                <option value="Ward 5 - Sunrise Heights">Ward 5 - Sunrise Heights</option>
                <option value="Ward 6 - Riverside Extension">Ward 6 - Riverside Extension</option>
              </select>
            </div>

            <div className="form-group">
              <label>Create Password (minimum 6 characters):</label>
              <input
                type="password"
                className="text-input"
                placeholder="At least 6 characters"
                value={regData.password}
                onChange={(e) => setRegData({ ...regData, password: e.target.value })}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary btn-large" disabled={regLoading}>
              {regLoading ? "Registering..." : "Create Citizen Account"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
