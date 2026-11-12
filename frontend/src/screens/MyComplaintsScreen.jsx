import React, { useState, useEffect } from "react";
import { api } from "../services/api";
import Modal from "../components/Modal";

export default function MyComplaintsScreen({ currentUser, onNavigate }) {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [selectedComplaint, setSelectedComplaint] = useState(null);

  // Feedback Modal
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [feedbackComplaint, setFeedbackComplaint] = useState(null);
  const [rating, setRating] = useState(5);
  const [feedbackText, setFeedbackText] = useState("");
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState("");

  const loadComplaints = async () => {
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

  return (
    <div className="screen-container">
      <div className="section-header">
        <div>
          <span className="eyebrow">CITIZEN GRIEVANCE TRACKING</span>
          <h2 className="section-title">🔍 Complaint History & Live Progress Tracker</h2>
          <p className="section-desc">
            Monitor real-time resolution stages, field technician dispatch updates, and rate completed water repairs.
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

            return (
              <div key={item._id || item.complaintId} className="complaint-card">
                <div className="complaint-card-top">
                  <div className="complaint-id-badge">
                    <span className="id-icon">🏷️</span>
                    <strong className="id-text">{item.complaintId}</strong>
                    <span className={`priority-tag priority-${item.priority.toLowerCase()}`}>
                      {item.priority} Priority
                    </span>
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

                {/* Citizen Rating / Feedback Section */}
                <div className="complaint-card-footer">
                  {item.status === "Resolved" ? (
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
                    <span className="in-progress-hint">
                      ⚡ Municipal staff currently monitoring resolution SLA.
                    </span>
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
    </div>
  );
}

