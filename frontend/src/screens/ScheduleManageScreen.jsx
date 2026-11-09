import React, { useState, useEffect } from "react";
import { api } from "../services/api";
import Modal from "../components/Modal";

export default function ScheduleManageScreen({ currentUser }) {
  const [activeTab, setActiveTab] = useState("schedules"); // 'schedules' or 'updates'
  const [schedules, setSchedules] = useState([]);
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);

  // Schedule Modal
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [scheduleForm, setScheduleForm] = useState({
    area: "",
    wardNumber: "Ward 1",
    morningSupply: "06:00 AM - 08:30 AM",
    eveningSupply: "06:00 PM - 08:00 PM",
    supplyDays: "Daily",
    durationHours: 4.5,
    source: "Central Water Reservoir",
    pressureLevel: "Normal",
    status: "On Time",
    remarks: "Regular scheduled supply.",
  });

  // Service Update Modal
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [editingUpdate, setEditingUpdate] = useState(null);
  const [updateForm, setUpdateForm] = useState({
    title: "",
    area: "Ward 1 - Old Town Heritage",
    type: "Scheduled Maintenance",
    severity: "Info",
    message: "",
    effectiveFrom: new Date().toISOString().slice(0, 16),
    effectiveTo: "Until Further Notice",
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [schedRes, updateRes] = await Promise.all([
        api.schedules.getAll(),
        api.serviceUpdates.getAll(),
      ]);
      if (schedRes.success) setSchedules(schedRes.data);
      if (updateRes.success) setUpdates(updateRes.data);
    } catch (err) {
      console.error("Failed to load schedules/updates:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Schedule Handlers
  const openNewScheduleModal = () => {
    setEditingSchedule(null);
    setScheduleForm({
      area: "",
      wardNumber: "Ward 1",
      morningSupply: "06:00 AM - 08:30 AM",
      eveningSupply: "06:00 PM - 08:00 PM",
      supplyDays: "Daily",
      durationHours: 4.5,
      source: "Central Water Reservoir",
      pressureLevel: "Normal",
      status: "On Time",
      remarks: "Regular scheduled supply.",
    });
    setIsScheduleModalOpen(true);
  };

  const openEditScheduleModal = (s) => {
    setEditingSchedule(s);
    setScheduleForm({
      area: s.area,
      wardNumber: s.wardNumber,
      morningSupply: s.morningSupply,
      eveningSupply: s.eveningSupply,
      supplyDays: s.supplyDays,
      durationHours: s.durationHours,
      source: s.source,
      pressureLevel: s.pressureLevel,
      status: s.status,
      remarks: s.remarks,
    });
    setIsScheduleModalOpen(true);
  };

  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingSchedule) {
        await api.schedules.update(editingSchedule._id || editingSchedule.id, scheduleForm);
      } else {
        await api.schedules.create(scheduleForm);
      }
      setIsScheduleModalOpen(false);
      loadData();
    } catch (err) {
      alert(err.message || "Failed to save schedule.");
    }
  };

  const handleDeleteSchedule = async (id) => {
    if (!window.confirm("Are you sure you want to remove this supply schedule?")) return;
    try {
      await api.schedules.delete(id);
      loadData();
    } catch (err) {
      alert(err.message || "Failed to delete schedule.");
    }
  };

  // Update Handlers
  const openNewUpdateModal = () => {
    setEditingUpdate(null);
    setUpdateForm({
      title: "",
      area: "Ward 1 - Old Town Heritage",
      type: "Scheduled Maintenance",
      severity: "Info",
      message: "",
      effectiveFrom: new Date().toISOString().slice(0, 16),
      effectiveTo: "Until Further Notice",
    });
    setIsUpdateModalOpen(true);
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingUpdate) {
        await api.serviceUpdates.update(editingUpdate._id || editingUpdate.id, updateForm);
      } else {
        await api.serviceUpdates.create(updateForm);
      }
      setIsUpdateModalOpen(false);
      loadData();
    } catch (err) {
      alert(err.message || "Failed to publish alert.");
    }
  };

  const handleDeleteUpdate = async (id) => {
    if (!window.confirm("Delete this broadcasted alert?")) return;
    try {
      await api.serviceUpdates.delete(id);
      loadData();
    } catch (err) {
      alert(err.message || "Failed to delete update.");
    }
  };

  return (
    <div className="screen-container">
      <div className="section-header">
        <div>
          <span className="eyebrow">GRID DISTRIBUTION & COMMUNICATIONS</span>
          <h2 className="section-title">⚙️ Supply Schedules & Service Outage Alerts</h2>
          <p className="section-desc">
            Publish daily water supply windows per ward, define feeder line sources, and broadcast emergency repair announcements.
          </p>
        </div>
        <div className="header-actions">
          {activeTab === "schedules" ? (
            <button type="button" className="btn btn-primary" onClick={openNewScheduleModal}>
              ➕ Publish Area Schedule
            </button>
          ) : (
            <button type="button" className="btn btn-primary" onClick={openNewUpdateModal}>
              📢 Broadcast Public Advisory
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs-nav">
        <button
          type="button"
          className={`tab-btn ${activeTab === "schedules" ? "active" : ""}`}
          onClick={() => setActiveTab("schedules")}
        >
          💧 Area Supply Schedules ({schedules.length})
        </button>
        <button
          type="button"
          className={`tab-btn ${activeTab === "updates" ? "active" : ""}`}
          onClick={() => setActiveTab("updates")}
        >
          ⚠️ Public Alerts & Advisories ({updates.length})
        </button>
      </div>

      {loading ? (
        <div className="loading-spinner">Loading grid data...</div>
      ) : activeTab === "schedules" ? (
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Ward</th>
                <th>Area / Locality</th>
                <th>Supply Windows</th>
                <th>Water Source</th>
                <th>Pressure</th>
                <th>Daily Hours</th>
                <th>Status</th>
                <th>Remarks</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {schedules.map((s) => (
                <tr key={s._id || s.scheduleId}>
                  <td><strong>{s.wardNumber}</strong></td>
                  <td>{s.area}</td>
                  <td>
                    <div>🌅 {s.morningSupply}</div>
                    <div>🌆 {s.eveningSupply}</div>
                  </td>
                  <td>{s.source}</td>
                  <td>
                    <span className={`pressure-${s.pressureLevel.toLowerCase()}`}>
                      {s.pressureLevel}
                    </span>
                  </td>
                  <td>{s.durationHours} hrs</td>
                  <td>
                    <span className={`status-pill status-${s.status.toLowerCase().replace(/\s+/g, "-")}`}>
                      {s.status}
                    </span>
                  </td>
                  <td><small>{s.remarks}</small></td>
                  <td>
                    <div className="table-actions">
                      <button
                        type="button"
                        className="btn btn-sm btn-secondary"
                        onClick={() => openEditScheduleModal(s)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-danger"
                        onClick={() => handleDeleteSchedule(s._id || s.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Advisory Title</th>
                <th>Affected Area</th>
                <th>Type</th>
                <th>Severity</th>
                <th>Time Window</th>
                <th>Status</th>
                <th>Message</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {updates.map((u) => (
                <tr key={u._id || u.updateId}>
                  <td><strong>{u.title}</strong></td>
                  <td>{u.area}</td>
                  <td><span className="badge-type">{u.type}</span></td>
                  <td>
                    <span className={`priority-tag priority-${u.severity.toLowerCase()}`}>
                      {u.severity}
                    </span>
                  </td>
                  <td>
                    <small>{u.effectiveFrom} to {u.effectiveTo}</small>
                  </td>
                  <td>
                    <span className={`status-pill status-${u.status.toLowerCase()}`}>
                      {u.status}
                    </span>
                  </td>
                  <td><small>{u.message}</small></td>
                  <td>
                    <button
                      type="button"
                      className="btn btn-sm btn-danger"
                      onClick={() => handleDeleteUpdate(u._id || u.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Schedule Edit/Create Modal */}
      <Modal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        title={editingSchedule ? `✏️ Edit Schedule: ${editingSchedule.area}` : "💧 Publish Area Water Supply Schedule"}
      >
        <form onSubmit={handleScheduleSubmit} className="schedule-form">
          <div className="form-grid">
            <div className="form-group">
              <label>Area / Locality Name <span className="req">*</span></label>
              <input
                type="text"
                className="text-input"
                placeholder="e.g. Ward 2 - Lakeview Residency"
                value={scheduleForm.area}
                onChange={(e) => setScheduleForm({ ...scheduleForm, area: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>Ward Identifier <span className="req">*</span></label>
              <input
                type="text"
                className="text-input"
                placeholder="e.g. Ward 2"
                value={scheduleForm.wardNumber}
                onChange={(e) => setScheduleForm({ ...scheduleForm, wardNumber: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>Morning Supply Window <span className="req">*</span></label>
              <input
                type="text"
                className="text-input"
                placeholder="06:00 AM - 08:30 AM"
                value={scheduleForm.morningSupply}
                onChange={(e) => setScheduleForm({ ...scheduleForm, morningSupply: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>Evening Supply Window <span className="req">*</span></label>
              <input
                type="text"
                className="text-input"
                placeholder="06:00 PM - 08:00 PM"
                value={scheduleForm.eveningSupply}
                onChange={(e) => setScheduleForm({ ...scheduleForm, eveningSupply: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>Water Intake / Source <span className="req">*</span></label>
              <input
                type="text"
                className="text-input"
                placeholder="e.g. Bhadra River Intake - Unit 1"
                value={scheduleForm.source}
                onChange={(e) => setScheduleForm({ ...scheduleForm, source: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>Daily Duration (Hours):</label>
              <input
                type="number"
                step="0.5"
                className="text-input"
                value={scheduleForm.durationHours}
                onChange={(e) => setScheduleForm({ ...scheduleForm, durationHours: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>Pressure Rating:</label>
              <select
                className="select-input"
                value={scheduleForm.pressureLevel}
                onChange={(e) => setScheduleForm({ ...scheduleForm, pressureLevel: e.target.value })}
              >
                <option value="Normal">Normal Pressure (2.0 - 2.5 bar)</option>
                <option value="High">High Pressure (3.0+ bar)</option>
                <option value="Low">Low Pressure (&lt; 1.5 bar)</option>
              </select>
            </div>

            <div className="form-group">
              <label>Current Status:</label>
              <select
                className="select-input"
                value={scheduleForm.status}
                onChange={(e) => setScheduleForm({ ...scheduleForm, status: e.target.value })}
              >
                <option value="On Time">On Time</option>
                <option value="Delayed">Delayed</option>
                <option value="Under Maintenance">Under Maintenance</option>
                <option value="Interrupted">Interrupted</option>
              </select>
            </div>

            <div className="form-group full-width">
              <label>Operational Remarks / Notes:</label>
              <input
                type="text"
                className="text-input"
                placeholder="e.g. Regular chlorination tested at 0.5 ppm."
                value={scheduleForm.remarks}
                onChange={(e) => setScheduleForm({ ...scheduleForm, remarks: e.target.value })}
              />
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setIsScheduleModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              💾 Save Schedule
            </button>
          </div>
        </form>
      </Modal>

      {/* Service Update Create Modal */}
      <Modal
        isOpen={isUpdateModalOpen}
        onClose={() => setIsUpdateModalOpen(false)}
        title="📢 Broadcast Public Service Advisory"
      >
        <form onSubmit={handleUpdateSubmit} className="update-form">
          <div className="form-group">
            <label>Advisory Title <span className="req">*</span></label>
            <input
              type="text"
              className="text-input"
              placeholder="e.g. Urgent Pipeline Overhaul on West Bank line"
              value={updateForm.title}
              onChange={(e) => setUpdateForm({ ...updateForm, title: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>Affected Locality / Ward <span className="req">*</span></label>
            <input
              type="text"
              className="text-input"
              placeholder="e.g. Ward 6 - Riverside Extension"
              value={updateForm.area}
              onChange={(e) => setUpdateForm({ ...updateForm, area: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>Advisory Type:</label>
            <select
              className="select-input"
              value={updateForm.type}
              onChange={(e) => setUpdateForm({ ...updateForm, type: e.target.value })}
            >
              <option value="Scheduled Maintenance">Scheduled Maintenance</option>
              <option value="Emergency Outage">Emergency Outage</option>
              <option value="Supply Delay">Supply Delay</option>
              <option value="Water Quality Advisory">Water Quality Advisory</option>
              <option value="Normal Service Resumed">Normal Service Resumed</option>
            </select>
          </div>

          <div className="form-group">
            <label>Severity:</label>
            <select
              className="select-input"
              value={updateForm.severity}
              onChange={(e) => setUpdateForm({ ...updateForm, severity: e.target.value })}
            >
              <option value="Info">Info (Standard notice)</option>
              <option value="Warning">Warning (Pressure drop / delay)</option>
              <option value="Critical">Critical (Total temporary shutdown)</option>
            </select>
          </div>

          <div className="form-group">
            <label>Detailed Message for Citizens <span className="req">*</span></label>
            <textarea
              className="textarea-input"
              rows="3"
              placeholder="Specify the reason, expected restoration time, and any alternative tanker arrangements..."
              value={updateForm.message}
              onChange={(e) => setUpdateForm({ ...updateForm, message: e.target.value })}
              required
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setIsUpdateModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              🚀 Broadcast Advisory
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
