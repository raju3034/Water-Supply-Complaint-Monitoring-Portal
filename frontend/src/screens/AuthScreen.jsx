import React, { useState } from "react";
import { api } from "../services/api";

export default function AuthScreen({ currentUser, onLoginSuccess, onLogout, initialTab = "login" }) {
  const [activeTab, setActiveTab] = useState(initialTab); // 'login' or 'register'

  React.useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Login form
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
        setLoginError(res.message || "Invalid credentials. Please check email and password.");
      }
    } catch (err) {
      setLoginError(err.message || "Sign in failed. Please try again.");
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

  return (
    <div className="screen-container">

      {/* Currently Signed In Panel */}
      {currentUser && (
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
              🚪 Sign Out from Account
            </button>
          </div>
        </div>
      )}

      {/* Login / Register Form */}
      <div className="auth-box-container">
        {/* Tabs */}
        <div className="auth-tabs">
          <button
            type="button"
            className={`auth-tab-btn ${activeTab === "login" ? "active" : ""}`}
            onClick={() => { setActiveTab("login"); setLoginError(""); }}
          >
            🔐 Sign In
          </button>
          <button
            type="button"
            className={`auth-tab-btn ${activeTab === "register" ? "active" : ""}`}
            onClick={() => { setActiveTab("register"); setRegError(""); setRegSuccess(""); }}
          >
            📝 Register as Citizen
          </button>
        </div>

        {/* ── SIGN IN FORM ── */}
        {activeTab === "login" && (
          <form onSubmit={handleLoginSubmit} className="auth-form" autoComplete="off">
            <div className="auth-form-header">
              <div className="auth-form-icon">🔐</div>
              <h3>Portal Sign In</h3>
              <p className="auth-sub">
                Enter your registered email address and password to access your role-specific dashboard.
              </p>
            </div>

            {loginError && (
              <div className="notice notice-error">
                ⚠️ {loginError}
              </div>
            )}

            <div className="form-group">
              <label htmlFor="login-email">Email Address</label>
              <input
                id="login-email"
                type="email"
                className="text-input"
                placeholder="e.g. officer@jalconnect.gov.in"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="form-group">
              <label htmlFor="login-password">Password</label>
              <div className="password-input-wrap">
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  className="text-input"
                  placeholder="Enter your password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword((v) => !v)}
                  tabIndex={-1}
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-large"
              disabled={loginLoading || !loginEmail || !loginPassword}
            >
              {loginLoading ? (
                <span>⏳ Authenticating...</span>
              ) : (
                <span>Sign In →</span>
              )}
            </button>

            <p className="auth-switch-hint">
              New citizen?{" "}
              <button
                type="button"
                className="link-btn"
                onClick={() => setActiveTab("register")}
              >
                Create an account
              </button>
            </p>
          </form>
        )}

        {/* ── REGISTER FORM ── */}
        {activeTab === "register" && (
          <form onSubmit={handleRegisterSubmit} className="auth-form">
            <div className="auth-form-header">
              <div className="auth-form-icon">📝</div>
              <h3>Create Citizen Account</h3>
              <p className="auth-sub">
                Register to lodge water complaints and track repair progress in real time.
              </p>
            </div>

            {regError && <div className="notice notice-error">⚠️ {regError}</div>}
            {regSuccess && <div className="notice notice-success">✅ {regSuccess}</div>}

            <div className="form-group">
              <label htmlFor="reg-name">Full Legal Name</label>
              <input
                id="reg-name"
                type="text"
                className="text-input"
                placeholder="e.g. Meera Reddy"
                value={regData.name}
                onChange={(e) => setRegData({ ...regData, name: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="reg-email">Email Address</label>
              <input
                id="reg-email"
                type="email"
                className="text-input"
                placeholder="e.g. meera.reddy@example.com"
                value={regData.email}
                onChange={(e) => setRegData({ ...regData, email: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="reg-phone">10-Digit Mobile Number</label>
              <input
                id="reg-phone"
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
              <label htmlFor="reg-area">Residential Ward / Locality</label>
              <select
                id="reg-area"
                className="select-input"
                value={regData.assignedArea}
                onChange={(e) => setRegData({ ...regData, assignedArea: e.target.value })}
              >
                <option value="Ward 1 - Old Town Heritage">Ward 1 - Old Town Heritage</option>
                <option value="Ward 2 - Lakeview Residency">Ward 2 - Lakeview Residency</option>
                <option value="Ward 3 - Green Park Colony">Ward 3 - Green Park Colony</option>
                <option value="Ward 4 - Industrial Area & Enclave">Ward 4 - Industrial Area &amp; Enclave</option>
                <option value="Ward 5 - Sunrise Heights">Ward 5 - Sunrise Heights</option>
                <option value="Ward 6 - Riverside Extension">Ward 6 - Riverside Extension</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="reg-password">Create Password <span className="label-hint">(min. 6 characters)</span></label>
              <input
                id="reg-password"
                type="password"
                className="text-input"
                placeholder="At least 6 characters"
                value={regData.password}
                onChange={(e) => setRegData({ ...regData, password: e.target.value })}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary btn-large" disabled={regLoading}>
              {regLoading ? "⏳ Registering..." : "Create Citizen Account →"}
            </button>

            <p className="auth-switch-hint">
              Already have an account?{" "}
              <button
                type="button"
                className="link-btn"
                onClick={() => setActiveTab("login")}
              >
                Sign in here
              </button>
            </p>
          </form>
        )}
      </div>

    </div>
  );
}
