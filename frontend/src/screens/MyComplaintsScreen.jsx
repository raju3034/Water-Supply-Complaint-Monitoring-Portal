import React, { useState, useEffect } from "react";
import { api } from "../services/api";
import Modal from "../components/Modal";

export default function MyComplaintsScreen({ currentUser, onNavigate }) {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [selectedComplaint, setSelectedComplaint] = useState(null);

  // Quick public lookup (for unauthenticated guests)
  const [guestLookupId, setGuestLookupId] = useState("");
  const [guestLookupResult, setGuestLookupResult] = useState(null);
  const [guestLookupLoading, setGuestLookupLoading] = useState(false);
  const [guestLookupError, setGuestLookupError] = useState("");

  // Feedback Modal
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [feedbackComplaint, setFeedbackComplaint] = useState(null);
  const [rating, setRating] = useState(5);
  const [feedbackText, setFeedbackText] = useState("");
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState("");

  // Report Unresolved / Escalation Modal
  const [isEscalateOpen, setIsEscalateOpen] = useState(false);
  const [escalateComplaint, setEscalateComplaint] = useState(null);
  const [escalateReason, setEscalateReason] = useState("Resolution is overdue beyond expected SLA");
  const [escalateDetails, setEscalateDetails] = useState("");
  const [submittingEscalate, setSubmittingEscalate] = useState(false);
  const [escalateSuccess, setEscalateSuccess] = useState("");
  const [escalateError, setEscalateError] = useState("");

  const loadComplaints = async () => {
    if (!currentUser) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const res = await api.complaints.getAll();
      if (res.success) {
        setComplaints(res.data);
      }
    } catch (err) {
      console.error("Failed to load complaints:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComplaints();
  }, [currentUser]);

  const handleGuestLookup = async (e) => {
    e.preventDefault();
    if (!guestLookupId.trim()) return;
    setGuestLookupLoading(true);
    setGuestLookupError("");
    setGuestLookupResult(null);
    try {
      const res = await api.complaints.trackPublic(guestLookupId.trim());
      if (res.success && res.data && res.data.length > 0) {
        setGuestLookupResult(res.data);
      } else {
        setGuestLookupError("No complaint found matching that Tracking ID or Phone Number.");
      }
    } catch (err) {
      setGuestLookupError(err.message || "Tracking lookup failed.");
    } finally {
      setGuestLookupLoading(false);
    }
  };

  const filtered = complaints.filter((c) => {
    const matchesStatus = statusFilter === "All" || c.status === statusFilter;
    const matchesSearch =
      search === "" ||
      c.complaintId.toLowerCase().includes(search.toLowerCase()) ||
      c.citizenName.toLowerCase().includes(search.toLowerCase()) ||
      c.description.toLowerCase().includes(search.toLowerCase()) ||
      c.area.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const openFeedbackModal = (c) => {
    setFeedbackComplaint(c);
    setRating(c.citizenRating || 5);
    setFeedbackText(c.citizenFeedback || "");
    setFeedbackSuccess("");
    setIsFeedbackOpen(true);
  };

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    if (!feedbackComplaint) return;
    setSubmittingFeedback(true);
    try {
      const res = await api.complaints.feedback(feedbackComplaint._id || feedbackComplaint.id, {
        citizenRating: rating,
        citizenFeedback: feedbackText,
      });
      if (res.success) {
        setFeedbackSuccess("Your feedback has been recorded. Thank you!");
        loadComplaints();
        setTimeout(() => setIsFeedbackOpen(false), 1400);
      }
    } catch (err) {
      alert(err.message || "Failed to submit rating.");
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const openEscalateModal = (c) => {
    setEscalateComplaint(c);
    setEscalateReason("Resolution is overdue beyond expected SLA");
    setEscalateDetails("");
    setEscalateSuccess("");
    setEscalateError("");
    setIsEscalateOpen(true);
  };

  const handleEscalateSubmit = async (e) => {
    e.preventDefault();
    if (!escalateComplaint) return;
    setSubmittingEscalate(true);
    setEscalateError("");
    try {
      const res = await api.complaints.reportUnresolved(
        escalateComplaint._id || escalateComplaint.id,
        {
          reason: escalateReason,
          details: escalateDetails,
        }
      );
      if (res.success) {
        setEscalateSuccess("Unresolved complaint report filed successfully! Priority escalated for immediate municipal action.");
        loadComplaints();
        setTimeout(() => setIsEscalateOpen(false), 1600);
      } else {
        setEscalateError(res.message || "Failed to submit report.");
      }
    } catch (err) {
      setEscalateError(err.message || "Failed to submit report.");
    } finally {
      setSubmittingEscalate(false);
    }
  };

  const getStageNumber = (status) => {
    switch (status) {
      case "Pending":
        return 1;
      case "Assigned":
        return 2;
      case "In Progress":
        return 3;
      case "Resolved":
        return 4;
      default:
        return 1;
    }
  };

  // 1. Unauthenticated Gate: Prompt to Login or Register
  if (!currentUser) {
    return (
      <div className="screen-container">
        <div className="auth-gate-card">
          <div className="auth-gate-icon">🔍</div>
          <span className="auth-gate-badge">CITIZEN AUTHENTICATION REQUIRED</span>
          <h2 className="auth-gate-title">Sign In or Register to Track Your Complaints</h2>
          <p className="auth-gate-desc">
            To view your personal grievance history, monitor live 4-stage technician dispatch status, and file escalation reports for unresolved issues, please sign in with your citizen account.
          </p>

          <div className="auth-gate-actions">
            <button
              type="button"
              className="btn btn-primary btn-large"
              onClick={() =>
                onNavigate("auth", {
                  initialTab: "login",
                  returnTab: "my-complaints",
                  redirectMessage: "Please sign in to view and track your registered complaints.",
                })
              }
            >
              🔐 Sign In to Track Complaints
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-large"
              onClick={() =>
                onNavigate("auth", {
                  initialTab: "register",
                  returnTab: "my-complaints",
                  redirectMessage: "Register as a citizen to track complaints and report unresolved issues.",
                })
              }
            >
              📝 Register as New Citizen
            </button>
          </div>

          <div className="quick-lookup-divider">
            <span>OR LOOK UP A SPECIFIC TICKET NUMBER DIRECTLY</span>
          </div>

          {/* Quick Ticket Search for Guests */}
          <form onSubmit={handleGuestLookup} className="guest-lookup-form">
            <div className="lookup-input-wrap">
              <input
                type="text"
                className="text-input"
                placeholder="Enter Ticket ID (e.g. CMP-802654) or 10-digit Phone..."
                value={guestLookupId}
                onChange={(e) => setGuestLookupId(e.target.value)}
                required
              />
              <button type="submit" className="btn btn-primary" disabled={guestLookupLoading}>
                {guestLookupLoading ? "Searching..." : "Track Status"}
              </button>
            </div>
          </form>

          {guestLookupError && <div className="notice notice-error">{guestLookupError}</div>}

          {guestLookupResult && (
            <div className="guest-lookup-results">
              <h4>Found {guestLookupResult.length} Record(s):</h4>
              {guestLookupResult.map((c) => (
                <div key={c._id || c.complaintId} className="quick-ticket-card">
                  <div className="quick-ticket-header">
                    <strong>{c.complaintId}</strong>
                    <span className={`status-pill status-${c.status.toLowerCase().replace(/\s+/g, "-")}`}>
                      {c.status}
                    </span>
                  </div>
                  <p><strong>Citizen:</strong> {c.citizenName} ({c.phone})</p>
                  <p><strong>Type:</strong> {c.complaintType} | <strong>Area:</strong> {c.area}</p>
                  <p><strong>Description:</strong> {c.description}</p>
                  <p><strong>Officer:</strong> {c.assignedOfficerName || "In Queue"} | <strong>Technician:</strong> {c.assignedTechnicianName || "Pending Dispatch"}</p>
                  <div className="quick-ticket-cta">
                    <small>💡 Sign in as citizen to view complete audit trail, rate resolution, or report unresolved delay.</small>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline"
                      onClick={() => onNavigate("auth", { initialTab: "login", returnTab: "my-complaints" })}
                    >
                      Sign In Now →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="screen-container">
      <div className="section-header">
        <div>
          <span className="eyebrow">CITIZEN GRIEVANCE TRACKING</span>
          <h2 className="section-title">🔍 Complaint History & Live Progress Tracker</h2>
          <p className="section-desc">
            Monitor real-time resolution stages, field technician dispatch updates, and report unresolved issues.
          </p>
        </div>
        <div>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => onNavigate("register-complaint")}
          >
            ➕ Lodge New Complaint
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="filter-bar-card">
        <div className="filter-chips">
          {["All", "Pending", "Assigned", "In Progress", "Resolved"].map((st) => (
            <button
              key={st}
              type="button"
              className={`filter-chip ${statusFilter === st ? "active" : ""}`}
              onClick={() => setStatusFilter(st)}
            >
              {st}
            </button>
          ))}
        </div>

        <div className="search-box">
          <input
            type="text"
            className="text-input"
            placeholder="Search by ID, keyword, locality..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="loading-spinner">Loading complaints data...</div>
      ) : filtered.length === 0 ? (
        <div className="empty-box">
          <p>No complaints found matching current criteria.</p>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              setStatusFilter("All");
              setSearch("");
            }}
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="complaints-timeline-list">
          {filtered.map((item) => {
            const currentStage = getStageNumber(item.status);
            const isResolved = item.status === "Resolved";

            return (
              <div key={item._id || item.complaintId} className={`complaint-card ${item.isEscalated ? "card-escalated" : ""}`}>
                <div className="complaint-card-top">
                  <div className="complaint-id-badge">
                    <span className="id-icon">🏷️</span>
                    <strong className="id-text">{item.complaintId}</strong>
                    <span className={`priority-tag priority-${item.priority.toLowerCase()}`}>
                      {item.priority} Priority
                    </span>
                    {item.isEscalated && (
                      <span className="escalation-badge" title={item.escalationReason}>
                        🚨 Escalated by Citizen
                      </span>
                    )}
                  </div>

                  <span className={`status-pill status-${item.status.toLowerCase().replace(/\s+/g, "-")}`}>
                    {item.status}
                  </span>
                </div>

                <div className="complaint-meta-grid">
                  <div>
                    <span className="meta-label">Category:</span>
                    <strong className="meta-val">{item.complaintType}</strong>
                  </div>
                  <div>
                    <span className="meta-label">Ward / Locality:</span>
                    <strong className="meta-val">{item.area}</strong>
                  </div>
                  <div>
                    <span className="meta-label">Complainant:</span>
                    <strong className="meta-val">{item.citizenName} ({item.phone})</strong>
                  </div>
                  <div>
                    <span className="meta-label">Reported On:</span>
                    <strong className="meta-val">{new Date(item.createdAt).toLocaleDateString()}</strong>
                  </div>
                </div>

                <div className="complaint-body">
                  <p><strong>Address:</strong> {item.address} {item.landmark ? `(Landmark: ${item.landmark})` : ""}</p>
                  <p><strong>Description:</strong> {item.description}</p>
                  {item.isEscalated && (
                    <div className="escalation-notice-box">
                      <strong>⚠️ Citizen Report / Escalation Filed:</strong>
                      <p>{item.escalationReason} {item.escalationDetails ? `— "${item.escalationDetails}"` : ""}</p>
                    </div>
                  )}
                </div>

                {/* 4-Stage Stepper Progress Bar */}
                <div className="stepper-wrapper">
                  <div className="stepper-track">
                    <div
                      className={`step-item ${currentStage >= 1 ? "completed" : ""}`}
                    >
                      <div className="step-circle">1</div>
                      <span className="step-title">Grievance Logged</span>
                      <small className="step-sub">{new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small>
                    </div>

                    <div
                      className={`step-item ${currentStage >= 2 ? "completed" : ""} ${currentStage === 2 ? "current" : ""}`}
                    >
                      <div className="step-circle">2</div>
                      <span className="step-title">Officer Assigned</span>
                      <small className="step-sub">{item.assignedOfficerName || "In Queue"}</small>
                    </div>

                    <div
                      className={`step-item ${currentStage >= 3 ? "completed" : ""} ${currentStage === 3 ? "current" : ""}`}
                    >
                      <div className="step-circle">3</div>
                      <span className="step-title">Technician Dispatched</span>
                      <small className="step-sub">{item.assignedTechnicianName || "Pending Dispatch"}</small>
                    </div>

                    <div
                      className={`step-item ${currentStage >= 4 ? "completed" : ""} ${currentStage === 4 ? "current" : ""}`}
                    >
                      <div className="step-circle">4</div>
                      <span className="step-title">Resolved & Verified</span>
                      <small className="step-sub">{item.resolvedAt ? new Date(item.resolvedAt).toLocaleDateString() : "Pending"}</small>
                    </div>
                  </div>
                </div>

                {/* Field Work Details if In Progress or Resolved */}
                {(item.resolutionNote || item.actionTaken || item.materialUsed) && (
                  <div className="field-resolution-summary">
                    <h4>🛠️ Field Resolution Notes:</h4>
                    {item.resolutionNote && <p><strong>Note:</strong> {item.resolutionNote}</p>}
                    {item.actionTaken && <p><strong>Action Taken:</strong> {item.actionTaken}</p>}
                    {item.materialUsed && <p><strong>Materials:</strong> {item.materialUsed}</p>}
                    {item.resolutionHours > 0 && (
                      <p><strong>Total Turnaround Time:</strong> {item.resolutionHours} hours</p>
                    )}
                  </div>
                )}

                {/* Citizen Action Footer */}
                <div className="complaint-card-footer">
                  {isResolved ? (
                    item.citizenRating ? (
                      <div className="rating-display">
                        <span className="stars">{"⭐".repeat(item.citizenRating)}</span>
                        <span className="rating-text">Citizen Rating: {item.citizenRating}/5</span>
                        {item.citizenFeedback && (
                          <span className="feedback-quote">"{item.citizenFeedback}"</span>
                        )}
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-warning"
                        onClick={() => openFeedbackModal(item)}
                      >
                        ⭐ Rate & Review Service
                      </button>
                    )
                  ) : (
                    <div className="unresolved-status-row">
                      <span className="in-progress-hint">
                        ⚡ Municipal staff currently monitoring resolution SLA.
                      </span>

                      {/* REPORT UNRESOLVED BUTTON */}
                      <button
                        type="button"
                        className="btn btn-sm btn-danger-outline btn-escalate"
                        onClick={() => openEscalateModal(item)}
                        title="Report delay or unresolved grievance to Senior Officers"
                      >
                        📢 Report Unresolved Issue
                      </button>
                    </div>
                  )}

                  <button
                    type="button"
                    className="btn btn-sm btn-secondary"
                    onClick={() => setSelectedComplaint(item)}
                  >
                    📜 View Audit History ({item.statusHistory ? item.statusHistory.length : 1})
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Audit History Modal */}
      <Modal
        isOpen={!!selectedComplaint}
        onClose={() => setSelectedComplaint(null)}
        title={selectedComplaint ? `📜 Audit Trail - ${selectedComplaint.complaintId}` : ""}
      >
        {selectedComplaint && (
          <div className="audit-trail-container">
            <p><strong>Issue:</strong> {selectedComplaint.complaintType} in {selectedComplaint.area}</p>
            <div className="audit-history-timeline">
              {(selectedComplaint.statusHistory || []).map((h, i) => (
                <div key={i} className="audit-node">
                  <div className="audit-node-dot"></div>
                  <div className="audit-node-content">
                    <div className="audit-node-header">
                      <span className={`status-pill status-${h.status.toLowerCase().replace(/\s+/g, "-")}`}>
                        {h.status}
                      </span>
                      <span className="audit-time">
                        {new Date(h.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <p className="audit-actor">
                      Updated by: <strong>{h.updatedBy}</strong> ({h.role})
                    </p>
                    {h.note && <p className="audit-note">{h.note}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>

      {/* Citizen Feedback Rating Modal */}
      <Modal
        isOpen={isFeedbackOpen}
        onClose={() => setIsFeedbackOpen(false)}
        title="⭐ Rate Your Resolution Experience"
      >
        {feedbackComplaint && (
          <form onSubmit={handleFeedbackSubmit} className="feedback-form">
            <p className="modal-help-text">
              Complaint <strong>{feedbackComplaint.complaintId}</strong> was resolved by field technician <strong>{feedbackComplaint.assignedTechnicianName}</strong>. How satisfied are you with the service?
            </p>

            {feedbackSuccess && <div className="notice notice-success">{feedbackSuccess}</div>}

            <div className="rating-selector">
              <label>Select Rating (1 to 5 Stars):</label>
              <div className="stars-buttons">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    className={`star-btn ${rating >= star ? "selected" : ""}`}
                    onClick={() => setRating(star)}
                  >
                    ★
                  </button>
                ))}
                <span className="rating-indicator">{rating} / 5 Stars</span>
              </div>
            </div>

            <div className="form-group">
              <label>Citizen Comments / Feedback:</label>
              <textarea
                className="textarea-input"
                rows="3"
                placeholder="Share any details about promptness, water clarity, or conduct..."
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
              />
            </div>

            <div className="modal-actions">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={submittingFeedback}
              >
                {submittingFeedback ? "Submitting..." : "Submit Rating"}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Report Unresolved Grievance Modal */}
      <Modal
        isOpen={isEscalateOpen}
        onClose={() => setIsEscalateOpen(false)}
        title="📢 Report Unresolved Grievance & Escalate Delay"
      >
        {escalateComplaint && (
          <form onSubmit={handleEscalateSubmit} className="escalate-form">
            <div className="escalate-modal-header">
              <div className="modal-ticket-id">
                <strong>Ticket:</strong> {escalateComplaint.complaintId} ({escalateComplaint.complaintType})
              </div>
              <div className="modal-ticket-status">
                Current Status: <span className={`status-pill status-${escalateComplaint.status.toLowerCase().replace(/\s+/g, "-")}`}>{escalateComplaint.status}</span>
              </div>
            </div>

            <p className="modal-help-text">
              Has your grievance remained unaddressed beyond the expected turnaround time? Submit an official escalation report directly to the Municipal Water Senior Officer desk.
            </p>

            {escalateSuccess && <div className="notice notice-success">✅ {escalateSuccess}</div>}
            {escalateError && <div className="notice notice-error">⚠️ {escalateError}</div>}

            <div className="form-group">
              <label htmlFor="escalate-reason">Reason for Reporting Delay / Non-Resolution: *</label>
              <select
                id="escalate-reason"
                className="select-input"
                value={escalateReason}
                onChange={(e) => setEscalateReason(e.target.value)}
                required
              >
                <option value="Resolution is overdue beyond expected SLA">Resolution is overdue beyond expected SLA</option>
                <option value="Water leakage or pipeline damage is worsening">Water leakage or pipeline damage is worsening</option>
                <option value="Technician was dispatched but never arrived on-site">Technician was dispatched but never arrived on-site</option>
                <option value="Work started but left incomplete without water restoration">Work started but left incomplete without water restoration</option>
                <option value="Water shortage is critical / health emergency">Water shortage is critical / health emergency</option>
                <option value="Low pressure issue recurring daily without resolution">Low pressure issue recurring daily without resolution</option>
                <option value="Other urgent concern">Other urgent concern</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="escalate-details">Additional Details / On-ground Observations:</label>
              <textarea
                id="escalate-details"
                className="textarea-input"
                rows="3"
                placeholder="Describe current status at your location, e.g. 'Street remains flooded, valve not turned off' or 'No water supply for 3 consecutive days'..."
                value={escalateDetails}
                onChange={(e) => setEscalateDetails(e.target.value)}
              />
            </div>

            <div className="escalation-action-consequences">
              <small>
                ⚡ <strong>What happens next:</strong> Submitting this report automatically updates the complaint status audit history, raises ticket priority, and flags the incident in the High Priority Executive Queue.
              </small>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setIsEscalateOpen(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={submittingEscalate}
              >
                {submittingEscalate ? "Submitting Report..." : "📢 Submit Escalation Report"}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
