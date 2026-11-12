import React, { useState, useEffect } from "react";
import { api } from "../services/api";
import Modal from "../components/Modal";

export default function TechnicianScreen({ currentUser, onNavigate }) {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewFilter, setViewFilter] = useState("AssignedToMe"); // 'AssignedToMe' or 'All'
  const [statusFilter, setStatusFilter] = useState("All");

  // Resolution modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTask, setActiveTask] = useState(null);
  const [resolveForm, setResolveForm] = useState({
    status: "Resolved",
    resolutionNote: "",
    actionTaken: "",
    materialUsed: "",
    customNote: "",
  });
  const [resolveLoading, setResolveLoading] = useState(false);
  const [resolveError, setResolveError] = useState("");

  const loadTechnicianTasks = async () => {
    try {
      setLoading(true);
      const res = await api.complaints.getAll();
      if (res.success) {
        setComplaints(res.data);
      }
    } catch (err) {
      console.error("Failed to load technician tasks:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTechnicianTasks();
  }, [currentUser]);

  // Filter tasks
  const techName = currentUser ? currentUser.name : "Rajesh Kumar";
  const myTasks = complaints.filter((c) => {
    const isMine =
      viewFilter === "All" ||
      (c.assignedTechnicianName && c.assignedTechnicianName.toLowerCase().includes(techName.toLowerCase())) ||
      (currentUser && c.assignedTechnician === (currentUser.id || currentUser._id));

    const matchesStatus = statusFilter === "All" || c.status === statusFilter;
    return isMine && matchesStatus;
  });

  const openResolutionModal = (task, targetStatus = "Resolved") => {
    setActiveTask(task);
    setResolveForm({
      status: targetStatus,
      resolutionNote: task.resolutionNote || "",
      actionTaken: task.actionTaken || "",
      materialUsed: task.materialUsed || "",
      customNote: "",
    });
    setResolveError("");
    setIsModalOpen(true);
  };

  const handleStartWork = async (task) => {
    try {
      const res = await api.complaints.resolve(task._id || task.id, {
        status: "In Progress",
        customNote: `Technician ${techName} arrived on site and started investigation.`,
      });
      if (res.success) {
        loadTechnicianTasks();
      }
    } catch (err) {
      alert(err.message || "Failed to update task.");
    }
  };

  const handleResolutionSubmit = async (e) => {
    e.preventDefault();
    if (!activeTask) return;
    setResolveLoading(true);
    setResolveError("");

    if (!resolveForm.actionTaken.trim() || !resolveForm.resolutionNote.trim()) {
      setResolveError("Action taken and resolution note are required for verification.");
      setResolveLoading(false);
      return;
    }

    try {
      const res = await api.complaints.resolve(activeTask._id || activeTask.id, {
        status: resolveForm.status,
        resolutionNote: resolveForm.resolutionNote,
        actionTaken: resolveForm.actionTaken,
        materialUsed: resolveForm.materialUsed,
        customNote: `Field work completed by ${techName}: ${resolveForm.actionTaken}`,
      });

      if (res.success) {
        setIsModalOpen(false);
        loadTechnicianTasks();
      } else {
        setResolveError(res.message || "Failed to submit resolution.");
      }
    } catch (err) {
      setResolveError(err.message || "Error submitting field report.");
    } finally {
      setResolveLoading(false);
    }
  };

  return (
    <div className="screen-container">
      <div className="section-header">
        <div>
          <span className="eyebrow">FIELD OPERATIONS WORKBENCH</span>
          <h2 className="section-title">🛠️ Field Technician Task Execution Portal</h2>
          <p className="section-desc">
            Signed in as <strong>{techName}</strong>. Review assigned pipeline tickets, log on-site excavation & valve replacement, and document materials used.
          </p>
        </div>
        <div className="header-actions">
          <button type="button" className="btn btn-outline" onClick={loadTechnicianTasks}>
            🔄 Refresh Tasks
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="filter-card">
        <div className="filter-row">
          <div className="filter-group">
            <label>Roster Scope:</label>
            <select
              className="select-input"
              value={viewFilter}
              onChange={(e) => setViewFilter(e.target.value)}
            >
              <option value="AssignedToMe">Assigned to Me ({techName})</option>
              <option value="All">All Municipal Field Tasks</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Status Filter:</label>
            <select
              className="select-input"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All">All Statuses</option>
              <option value="Assigned">Assigned (Ready for Site Visit)</option>
              <option value="In Progress">In Progress (Active Work)</option>
              <option value="Resolved">Resolved & Closed</option>
            </select>
          </div>

          <div className="tech-kpi-summary">
            <span>My Active Tasks: <strong>{complaints.filter((c) => c.status !== "Resolved" && (c.assignedTechnicianName || "").includes(techName)).length}</strong></span>
            <span>Completed Repairs: <strong>{complaints.filter((c) => c.status === "Resolved" && (c.assignedTechnicianName || "").includes(techName)).length}</strong></span>
          </div>
        </div>
      </div>

      {/* Task Cards */}
      {loading ? (
        <div className="loading-spinner">Loading field dispatch queue...</div>
      ) : myTasks.length === 0 ? (
        <div className="empty-box">No field tasks assigned in this filter. Great job!</div>
      ) : (
        <div className="tech-tasks-grid">
          {myTasks.map((task) => (
            <div key={task._id || task.complaintId} className="tech-task-card">
              <div className="task-header">
                <div className="task-id-badge">
                  <strong>{task.complaintId}</strong>
                  <span className={`priority-tag priority-${task.priority.toLowerCase()}`}>
                    {task.priority} Priority
                  </span>
                </div>
                <span className={`status-pill status-${task.status.toLowerCase().replace(/\s+/g, "-")}`}>
                  {task.status}
                </span>
              </div>

              <h4 className="task-title">
                {task.complaintType} in {task.area}
              </h4>

              <div className="task-location-box">
                <p>📍 <strong>Site Address:</strong> {task.address}</p>
                {task.landmark && <p>🚩 <strong>Landmark:</strong> {task.landmark}</p>}
                <p>👤 <strong>Citizen:</strong> {task.citizenName} (📞 {task.phone})</p>
                {task.targetResolutionDate && (
                  <p>🎯 <strong>SLA Deadline:</strong> {task.targetResolutionDate}</p>
                )}
              </div>

              <div className="task-problem-box">
                <strong>Reported Issue:</strong>
                <p>{task.description}</p>
              </div>

              {/* Existing Log Details */}
              {(task.actionTaken || task.materialUsed || task.resolutionNote) && (
                <div className="task-completed-log">
                  {task.actionTaken && <p><strong>Action:</strong> {task.actionTaken}</p>}
                  {task.materialUsed && <p><strong>Materials:</strong> {task.materialUsed}</p>}
                  {task.resolutionNote && <p><strong>Notes:</strong> {task.resolutionNote}</p>}
                  {task.resolutionHours > 0 && <p><strong>Duration:</strong> {task.resolutionHours} hours</p>}
                </div>
              )}

              {/* Action Buttons */}
              <div className="task-actions-bar">
                {task.status === "Assigned" && (
                  <button
                    type="button"
                    className="btn btn-warning"
                    onClick={() => handleStartWork(task)}
                  >
                    🚜 Mark Site Arrival / In Progress
                  </button>
                )}

                {task.status === "In Progress" && (
                  <button
                    type="button"
                    className="btn btn-success"
                    onClick={() => openResolutionModal(task, "Resolved")}
                  >
                    ✅ Complete & Log Resolution
                  </button>
                )}

                {task.status === "Resolved" ? (
                  <div className="task-done-badge">
                    <span>🎉 Resolved Successfully</span>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline"
                      onClick={() => openResolutionModal(task, "Resolved")}
                    >
                      ✏️ Edit Log
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Resolution Log Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={activeTask ? `🛠️ Field Work Log: ${activeTask.complaintId}` : ""}
      >
        {activeTask && (
          <form onSubmit={handleResolutionSubmit} className="resolve-form">
            <div className="complaint-summary-bubble">
              <p><strong>Locality:</strong> {activeTask.area} | <strong>Type:</strong> {activeTask.complaintType}</p>
              <p><strong>Citizen:</strong> {activeTask.citizenName} ({activeTask.phone})</p>
            </div>

            {resolveError && <div className="notice notice-error">{resolveError}</div>}

            <div className="form-group">
              <label>Work Status <span className="req">*</span></label>
              <select
                className="select-input"
                value={resolveForm.status}
                onChange={(e) => setResolveForm({ ...resolveForm, status: e.target.value })}
              >
                <option value="In Progress">In Progress (Further parts needed)</option>
                <option value="Resolved">Resolved (Water Supply Fully Restored)</option>
              </select>
            </div>

            <div className="form-group">
              <label>Technical Action Taken <span className="req">*</span></label>
              <textarea
                className="textarea-input"
                rows="3"
                placeholder="e.g. Excaved 1.2m depth, located shear crack on 4-inch ductile iron main, fitted mechanical repair sleeve and tested pressure."
                value={resolveForm.actionTaken}
                onChange={(e) => setResolveForm({ ...resolveForm, actionTaken: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>Inventory & Materials Consumed:</label>
              <input
                type="text"
                className="text-input"
                placeholder="e.g. 1x 100mm repair clamp, 1x rubber gasket, 4x M16 galvanized bolts"
                value={resolveForm.materialUsed}
                onChange={(e) => setResolveForm({ ...resolveForm, materialUsed: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Root Cause & Technician Remarks <span className="req">*</span></label>
              <textarea
                className="textarea-input"
                rows="3"
                placeholder="e.g. Road surface traffic vibration caused joint loosening. Recommended soil re-compaction."
                value={resolveForm.resolutionNote}
                onChange={(e) => setResolveForm({ ...resolveForm, resolutionNote: e.target.value })}
                required
              />
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setIsModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={resolveLoading}
              >
                {resolveLoading ? "Saving Report..." : "💾 Submit Field Completion Report"}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}

