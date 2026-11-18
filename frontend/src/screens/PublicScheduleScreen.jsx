import React, { useState, useEffect } from "react";
import { api } from "../services/api";
import Modal from "../components/Modal";

export default function PublicScheduleScreen({ onNavigate, currentUser }) {
  const [schedules, setSchedules] = useState([]);
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedWard, setSelectedWard] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  // Public Tracker Modal State
  const [trackQuery, setTrackQuery] = useState("");
  const [trackLoading, setTrackLoading] = useState(false);
  const [trackResults, setTrackResults] = useState(null);
  const [trackError, setTrackError] = useState("");
  const [isTrackerOpen, setIsTrackerOpen] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [schedRes, updateRes] = await Promise.all([
        api.schedules.getAll(),
        api.serviceUpdates.getAll({ status: "Active" }),
      ]);
      if (schedRes.success) setSchedules(schedRes.data);
      if (updateRes.success) setUpdates(updateRes.data);
    } catch (err) {
      console.error("Failed to load public data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleTrackSubmit = async (e) => {
    e.preventDefault();
    if (!trackQuery.trim()) return;

    setTrackLoading(true);
    setTrackError("");
    setTrackResults(null);

    try {
      const res = await api.complaints.trackPublic(trackQuery.trim());
      if (res.success && res.data.length > 0) {
        setTrackResults(res.data);
      } else {
        setTrackError("No complaints found for that ID or Phone.");
      }
    } catch (err) {
      setTrackError(err.message || "Tracking lookup failed.");
    } finally {
      setTrackLoading(false);
    }
  };

  const filteredSchedules = schedules.filter((s) => {
    const matchesWard = selectedWard === "All" || s.wardNumber === selectedWard;
    const matchesSearch =
      searchQuery === "" ||
      s.area.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.source.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesWard && matchesSearch;
  });

  const uniqueWards = ["All", ...new Set(schedules.map((s) => s.wardNumber))];

  return (
    <div className="screen-container">
      {/* Hero Banner */}
      <section className="hero-banner">
        <div className="hero-content">
          <span className="hero-tag">MUNICIPAL WATER SUPPLY & MONITORING</span>
          <h2 className="hero-title">Safe, Transparent & Reliable Water Distribution</h2>
          <p className="hero-subtitle">
            Check real-time water supply timings for your ward, track active pipeline maintenance,
            and report water leakage or quality issues instantly.
          </p>
          <div className="hero-actions">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => onNavigate("register-complaint")}
            >
              📝 Register a Water Complaint
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsTrackerOpen(true)}
            >
              🔍 Track Complaint by ID
            </button>
          </div>

          {!currentUser && (
            <div className="hero-auth-alert">
              <span>📢 <strong>Citizen Notice:</strong> You must sign in or register to lodge a complaint or track your complaints.</span>
              <div className="hero-auth-alert-actions">
                <button
                  type="button"
                  className="btn btn-sm btn-light"
                  onClick={() => onNavigate("auth", { initialTab: "login", returnTab: "register-complaint" })}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-light"
                  onClick={() => onNavigate("auth", { initialTab: "register", returnTab: "register-complaint" })}
                >
                  Register
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Active Service Bulletins */}
      {updates.length > 0 && (
        <section className="alerts-section">
          <div className="section-header-compact">
            <h3 className="section-title">⚠️ Live Service Updates & Outage Advisories</h3>
            <span className="live-pill">LIVE SYSTEM</span>
          </div>
          <div className="alerts-grid">
            {updates.map((item) => (
              <div key={item._id || item.updateId} className={`alert-card severity-${item.severity.toLowerCase()}`}>
                <div className="alert-badge">{item.type}</div>
                <h4 className="alert-title">{item.title}</h4>
                <p className="alert-meta">
                  <strong>Affected Area:</strong> {item.area} | <strong>Window:</strong> {item.effectiveFrom} to {item.effectiveTo}
                </p>
                <p className="alert-message">{item.message}</p>
                <span className="alert-author">Broadcasted by: {item.publishedBy}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Water Supply Schedule Section */}
      <section className="schedule-section">
        <div className="section-header">
          <div>
            <h3 className="section-title">💧 Area-wise Water Supply Schedules</h3>
            <p className="section-desc">
              Daily scheduled water supply hours, transmission pressure, and current operational status across municipality wards.
            </p>
          </div>

          <div className="schedule-filters">
            <div className="filter-group">
              <label>Filter by Ward:</label>
              <select
                className="select-input"
                value={selectedWard}
                onChange={(e) => setSelectedWard(e.target.value)}
              >
                {uniqueWards.map((w) => (
                  <option key={w} value={w}>
                    {w}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label>Search Locality / Source:</label>
              <input
                type="text"
                className="text-input"
                placeholder="e.g. Lakeview, Bhadra River..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="loading-spinner">Loading current water supply schedules...</div>
        ) : filteredSchedules.length === 0 ? (
          <div className="empty-box">No water supply schedules matching your filter.</div>
        ) : (
          <div className="schedules-grid">
            {filteredSchedules.map((item) => (
              <div key={item._id || item.scheduleId} className="schedule-card">
                <div className="schedule-card-header">
                  <div>
                    <span className="ward-pill">{item.wardNumber}</span>
                    <h4 className="card-area-title">{item.area}</h4>
                  </div>
                  <span
                    className={`status-pill status-${item.status
                      .toLowerCase()
                      .replace(/\s+/g, "-")}`}
                  >
                    {item.status}
                  </span>
                </div>

                <div className="supply-timings-box">
                  <div className="timing-row">
                    <span className="timing-label">🌅 Morning Supply:</span>
                    <strong className="timing-value">{item.morningSupply}</strong>
                  </div>
                  <div className="timing-row">
                    <span className="timing-label">🌆 Evening Supply:</span>
                    <strong className="timing-value">{item.eveningSupply}</strong>
                  </div>
                </div>

                <div className="schedule-card-details">
                  <div className="detail-item">
                    <span>Source:</span>
                    <strong>{item.source}</strong>
                  </div>
                  <div className="detail-item">
                    <span>Frequency:</span>
                    <strong>{item.supplyDays}</strong>
                  </div>
                  <div className="detail-item">
                    <span>Duration:</span>
                    <strong>{item.durationHours} hrs / day</strong>
                  </div>
                  <div className="detail-item">
                    <span>Pressure:</span>
                    <strong className={`pressure-${item.pressureLevel.toLowerCase()}`}>
                      {item.pressureLevel} Pressure
                    </strong>
                  </div>
                </div>

                {item.remarks && (
                  <div className="schedule-remarks">
                    <small>ℹ️ {item.remarks}</small>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Quick Lookup Modal */}
      <Modal
        isOpen={isTrackerOpen}
        onClose={() => {
          setIsTrackerOpen(false);
          setTrackResults(null);
          setTrackError("");
          setTrackQuery("");
        }}
        title="🔍 Instant Complaint Status Lookup"
      >
        <form onSubmit={handleTrackSubmit} className="tracker-form">
          <p className="modal-help-text">
            Enter your <strong>Complaint Tracking ID</strong> (e.g. <code>CMP-2026-1001</code>) or your registered <strong>Mobile Number</strong>:
          </p>
          <div className="search-input-group">
            <input
              type="text"
              className="text-input"
              placeholder="e.g. CMP-2026-1001 or 9876543214"
              value={trackQuery}
              onChange={(e) => setTrackQuery(e.target.value)}
              required
            />
            <button type="submit" className="btn btn-primary" disabled={trackLoading}>
              {trackLoading ? "Searching..." : "Track Status"}
            </button>
          </div>
        </form>

        {trackError && <div className="notice notice-error">{trackError}</div>}

        {trackResults && (
          <div className="tracker-results-container">
            <h4>Found {trackResults.length} Record(s):</h4>
            {trackResults.map((c) => (
              <div key={c._id || c.complaintId} className="tracker-result-card">
                <div className="tracker-result-header">
                  <strong>{c.complaintId}</strong>
                  <span className={`status-pill status-${c.status.toLowerCase().replace(/\s+/g, "-")}`}>
                    {c.status}
                  </span>
                </div>
                <p><strong>Citizen:</strong> {c.citizenName} ({c.phone})</p>
                <p><strong>Type:</strong> {c.complaintType} | <strong>Area:</strong> {c.area}</p>
                <p><strong>Description:</strong> {c.description}</p>
                <p><strong>Assigned Officer:</strong> {c.assignedOfficerName || "Under Department Review"}</p>
                <p><strong>Field Technician:</strong> {c.assignedTechnicianName || "Pending Dispatch"}</p>
                {c.resolutionNote && (
                  <div className="resolution-highlight">
                    <strong>Resolution Note:</strong> {c.resolutionNote}
                  </div>
                )}
                {!currentUser && (
                  <div className="tracker-result-cta">
                    <small>💡 Sign in or register as a citizen to track live stepper progress or report unresolved delays.</small>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline"
                      onClick={() => {
                        setIsTrackerOpen(false);
                        onNavigate("auth", { initialTab: "login", returnTab: "my-complaints" });
                      }}
                    >
                      Sign In to Account →
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
}

