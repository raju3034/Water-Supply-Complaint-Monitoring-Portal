import React, { useState, useEffect } from "react";
import { api } from "../services/api";

export default function RegisterComplaintScreen({ currentUser, onComplaintRegistered, onNavigate }) {
  const [formData, setFormData] = useState({
    citizenName: currentUser ? currentUser.name : "",
    phone: currentUser ? currentUser.phone : "",
    citizenEmail: currentUser ? currentUser.email : "",
    complaintType: "Leakage",
    area: currentUser && currentUser.assignedArea ? currentUser.assignedArea : "Ward 2 - Lakeview Residency",
    address: "",
    landmark: "",
    description: "",
    priority: "Medium",
  });

  const [loading, setLoading] = useState(false);
  const [submittedTicket, setSubmittedTicket] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (currentUser) {
      setFormData((prev) => ({
        ...prev,
        citizenName: currentUser.name || prev.citizenName,
        phone: currentUser.phone || prev.phone,
        citizenEmail: currentUser.email || prev.citizenEmail,
      }));
    }
  }, [currentUser]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    // Validation
    if (!formData.citizenName.trim() || !formData.phone.trim() || !formData.address.trim() || !formData.description.trim()) {
      setErrorMsg("Please fill in all mandatory fields (Name, Phone, Address, Description).");
      setLoading(false);
      return;
    }

    if (!/^\d{10}$/.test(formData.phone.trim())) {
      setErrorMsg("Please enter a valid 10-digit mobile number.");
      setLoading(false);
      return;
    }

    try {
      const res = await api.complaints.create(formData);
      if (res.success) {
        setSubmittedTicket(res.data);
        if (onComplaintRegistered) onComplaintRegistered(res.data);
      } else {
        setErrorMsg(res.message || "Failed to register complaint.");
      }
    } catch (err) {
      setErrorMsg(err.message || "An error occurred while submitting.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSubmittedTicket(null);
    setFormData({
      citizenName: currentUser ? currentUser.name : "",
      phone: currentUser ? currentUser.phone : "",
      citizenEmail: currentUser ? currentUser.email : "",
      complaintType: "Leakage",
      area: "Ward 2 - Lakeview Residency",
      address: "",
      landmark: "",
      description: "",
      priority: "Medium",
    });
  };

  const areasList = [
    "Ward 1 - Old Town Heritage",
    "Ward 2 - Lakeview Residency",
    "Ward 3 - Green Park Colony",
    "Ward 4 - Industrial Area & Enclave",
    "Ward 5 - Sunrise Heights",
    "Ward 6 - Riverside Extension",
  ];

  // 1. Unauthenticated Guest: Must Sign In or Register as Citizen
  if (!currentUser) {
    return (
      <div className="screen-container">
        <div className="auth-gate-card">
          <div className="auth-gate-icon">🔒</div>
          <span className="auth-gate-badge">CITIZEN AUTHENTICATION REQUIRED</span>
          <h2 className="auth-gate-title">Please Sign In or Register to Lodge a Complaint</h2>
          <p className="auth-gate-desc">
            To prevent unverified entries, maintain accountable municipal audit trails, and enable real-time tracking of technician dispatch, citizens must be signed in to submit water grievances.
          </p>

          <div className="auth-gate-actions">
            <button
              type="button"
              className="btn btn-primary btn-large"
              onClick={() =>
                onNavigate("auth", {
                  initialTab: "login",
                  returnTab: "register-complaint",
                  redirectMessage: "Please sign in to lodge your water supply complaint.",
                })
              }
            >
              🔐 Sign In to Lodge Complaint
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-large"
              onClick={() =>
                onNavigate("auth", {
                  initialTab: "register",
                  returnTab: "register-complaint",
                  redirectMessage: "Create an account in 30 seconds to lodge water complaints.",
                })
              }
            >
              📝 Register New Citizen Account
            </button>
          </div>

          <div className="auth-gate-benefits">
            <h4>✨ Citizen Account Privileges:</h4>
            <ul>
              <li>Direct tracking of pipeline leakage and water shortage tickets</li>
              <li>SMS and portal updates when technicians are dispatched</li>
              <li>Option to report unresolved delays or escalate priority</li>
              <li>Satisfaction rating and feedback submission upon repair</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  // 2. Logged in as Staff/Admin: Restrict to Citizen role
  if (currentUser.role !== "Citizen") {
    return (
      <div className="screen-container">
        <div className="auth-gate-card">
          <div className="auth-gate-icon">⚠️</div>
          <span className="auth-gate-badge">STAFF ACCOUNT DETECTED</span>
          <h2 className="auth-gate-title">Citizen Role Required to Lodge Grievances</h2>
          <p className="auth-gate-desc">
            You are currently signed in as <strong>{currentUser.name}</strong> ({currentUser.role}). Public grievances must be logged by verified citizen consumers.
          </p>
          <div className="auth-gate-actions">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => onNavigate(currentUser.role === "Field Technician" ? "technician-tasks" : "dashboard")}
            >
              ← Back to Staff Operations
            </button>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() =>
                onNavigate("auth", {
                  initialTab: "login",
                  returnTab: "register-complaint",
                  redirectMessage: "Sign in with a Citizen account to lodge a complaint.",
                })
              }
            >
              Switch Account
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="screen-container">
      <div className="form-card-wrapper">
        <div className="form-card-header">
          <div className="form-badge">CITIZEN GRIEVANCE PORTAL</div>
          <h2 className="form-title">📝 Register Water Supply Complaint</h2>
          <p className="form-subtitle">
            Logged in as <strong>{currentUser.name}</strong> ({currentUser.email || currentUser.phone}). Your ticket will be dispatched to municipal technicians.
          </p>
        </div>

        {submittedTicket ? (
          <div className="success-confirmation-card">
            <div className="success-icon-badge">✅</div>
            <h3>Grievance Successfully Registered!</h3>
            <p className="confirmation-text">
              Your grievance has been assigned to the Municipal Water Operations Queue.
            </p>

            <div className="ticket-token-box">
              <span className="token-label">Complaint Tracking ID:</span>
              <strong className="token-id">{submittedTicket.complaintId}</strong>
              <small className="token-hint">Please save this reference ID for all status inquiries.</small>
            </div>

            <div className="ticket-summary-grid">
              <div>
                <span>Citizen:</span>
                <strong>{submittedTicket.citizenName}</strong>
              </div>
              <div>
                <span>Issue Type:</span>
                <strong>{submittedTicket.complaintType}</strong>
              </div>
              <div>
                <span>Ward / Area:</span>
                <strong>{submittedTicket.area}</strong>
              </div>
              <div>
                <span>Priority:</span>
                <span className={`priority-tag priority-${submittedTicket.priority.toLowerCase()}`}>
                  {submittedTicket.priority}
                </span>
              </div>
              <div>
                <span>Current Status:</span>
                <span className="status-pill status-pending">Pending Review</span>
              </div>
            </div>

            <div className="confirmation-actions">
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => onNavigate("my-complaints")}
              >
                🔍 View in My Complaints & Live Tracker
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleReset}
              >
                ➕ Register Another Complaint
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="complaint-form">
            {errorMsg && <div className="notice notice-error">{errorMsg}</div>}

            <div className="form-grid">
              <div className="form-group">
                <label>Citizen Full Name <span className="req">*</span></label>
                <input
                  type="text"
                  name="citizenName"
                  className="text-input"
                  placeholder="e.g. Ramesh Reddy"
                  value={formData.citizenName}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Mobile Number (10 digits) <span className="req">*</span></label>
                <input
                  type="tel"
                  name="phone"
                  className="text-input"
                  maxLength="10"
                  placeholder="e.g. 9876543210"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Email Address (for auto updates)</label>
                <input
                  type="email"
                  name="citizenEmail"
                  className="text-input"
                  placeholder="e.g. citizen@example.com"
                  value={formData.citizenEmail}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label>Complaint Category <span className="req">*</span></label>
                <select
                  name="complaintType"
                  className="select-input"
                  value={formData.complaintType}
                  onChange={handleChange}
                >
                  <option value="Leakage">💧 Water Pipeline Leakage / Burst</option>
                  <option value="Water Shortage">🚱 Severe Water Shortage / No Supply</option>
                  <option value="Water Quality">🧪 Water Quality (Color / Turbidity / Odor)</option>
                  <option value="Low Pressure">📉 Low Water Pressure</option>
                  <option value="Pipeline Damage">🚧 Third-party Physical Damage</option>
                </select>
              </div>

              <div className="form-group">
                <label>Ward / Locality <span className="req">*</span></label>
                <select
                  name="area"
                  className="select-input"
                  value={formData.area}
                  onChange={handleChange}
                >
                  {areasList.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Urgency / Severity Level <span className="req">*</span></label>
                <select
                  name="priority"
                  className="select-input"
                  value={formData.priority}
                  onChange={handleChange}
                >
                  <option value="Low">Low (Minor drip, general inquiry)</option>
                  <option value="Medium">Medium (Moderate leakage / pressure)</option>
                  <option value="High">High (Zero supply, substantial loss)</option>
                  <option value="Critical">Critical (Contamination / road burst)</option>
                </select>
              </div>

              <div className="form-group full-width">
                <label>Physical Street Address & House / Plot No. <span className="req">*</span></label>
                <input
                  type="text"
                  name="address"
                  className="text-input"
                  placeholder="e.g. House No. 42, Cross Road 3, Lakeview Enclave"
                  value={formData.address}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group full-width">
                <label>Nearby Landmark / Cross Street</label>
                <input
                  type="text"
                  name="landmark"
                  className="text-input"
                  placeholder="e.g. Opposite Government Hospital or Near Water Tank 3"
                  value={formData.landmark}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group full-width">
                <label>Detailed Description of the Issue <span className="req">*</span></label>
                <textarea
                  name="description"
                  className="textarea-input"
                  rows="4"
                  placeholder="Provide precise details: duration of problem, visible water volume, pipeline location..."
                  value={formData.description}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-footer">
              <button
                type="submit"
                className="btn btn-primary btn-large"
                disabled={loading}
              >
                {loading ? "Submitting Grievance..." : "🚀 Submit Water Complaint"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

