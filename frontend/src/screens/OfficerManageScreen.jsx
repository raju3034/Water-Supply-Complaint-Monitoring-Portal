import React, { useState, useEffect } from "react";
import { api } from "../services/api";
import Modal from "../components/Modal";

export default function OfficerManageScreen({ currentUser, onNavigate }) {
  const [complaints, setComplaints] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [areaFilter, setAreaFilter] = useState("All");
  const [search, setSearch] = useState("");

  // Assign Modal
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [activeComplaint, setActiveComplaint] = useState(null);
  const [assignForm, setAssignForm] = useState({
    assignedTechnician: "",
    assignedTechnicianName: "",
    targetResolutionDate: "",
    priority: "High",
    note: "",
  });
  const [assignLoading, setAssignLoading] = useState(false);
  const [assignError, setAssignError] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      const [compRes, staffRes] = await Promise.all([
        api.complaints.getAll(),
        api.auth.getStaff().catch(() => ({ success: true, data: [] })),
      ]);
      if (compRes.success) setComplaints(compRes.data);
      if (staffRes.success) setStaff(staffRes.data);
    } catch (err) {
      console.error("Failed to load officer complaints data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const technicians = staff.filter((s) => s.role === "Field Technician");
  // Default technician fallback list if roster empty
  const defaultTechs = technicians.length
    ? technicians
    : [
        { id: "usr_tech_001", name: "Rajesh Kumar", department: "Emergency Pipeline Repair" },
        { id: "usr_tech_002", name: "Vikram Singh", department: "Valve & Pressure Maintenance" },
      ];

  const openAssignModal = (complaint) => {
    setActiveComplaint(complaint);
    setAssignForm({
      assignedTechnician: defaultTechs[0]?.id || "",
      assignedTechnicianName: defaultTechs[0]?.name || "",
      targetResolutionDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      priority: complaint.priority || "High",
      note: "",
    });
    setAssignError("");
    setIsAssignOpen(true);
  };

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    if (!activeComplaint) return;
    setAssignLoading(true);
    setAssignError("");

    try {
      const selectedTech = defaultTechs.find((t) => t.id === assignForm.assignedTechnician);
      const techName = selectedTech ? selectedTech.name : assignForm.assignedTechnicianName;

      const res = await api.complaints.assign(activeComplaint._id || activeComplaint.id, {
        assignedTechnician: assignForm.assignedTechnician,
        assignedTechnicianName: techName,
        targetResolutionDate: assignForm.targetResolutionDate,
        priority: assignForm.priority,
        note: assignForm.note,
      });

      if (res.success) {
        setIsAssignOpen(false);
        loadData();
      } else {
        setAssignError(res.message || "Assignment failed.");
      }
    } catch (err) {
      setAssignError(err.message || "Failed to assign technician.");
    } finally {
      setAssignLoading(false);
    }
  };

  // Filter complaints
  const filtered = complaints.filter((c) => {
    const matchesStatus = statusFilter === "All" || c.status === statusFilter;
    const matchesPriority = priorityFilter === "All" || c.priority === priorityFilter;
    const matchesArea = areaFilter === "All" || c.area === areaFilter;
    const matchesSearch =
      search === "" ||
      c.complaintId.toLowerCase().includes(search.toLowerCase()) ||
      c.citizenName.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search) ||
      c.description.toLowerCase().includes(search.toLowerCase()) ||
      (c.assignedTechnicianName && c.assignedTechnicianName.toLowerCase().includes(search.toLowerCase()));

    return matchesStatus && matchesPriority && matchesArea && matchesSearch;
  });

  const areasList = ["All", ...new Set(complaints.map((c) => c.area))];

  return (
    <div className="screen-container">
      <div className="section-header">
        <div>
          <span className="eyebrow">WATER DEPARTMENT OPERATIONS</span>
          <h2 className="section-title">📋 Grievance Management & Technician Dispatch</h2>
          <p className="section-desc">
            Review incoming complaints, adjust priority SLAs, and assign qualified Field Technicians to restore water supply.
          </p>
        </div>
        <div className="header-actions">
          <button type="button" className="btn btn-outline" onClick={loadData}>
            🔄 Refresh List
          </button>
        </div>
      </div>

      {/* Control Filter Bar */}
      <div className="filter-card">
        <div className="filter-row">
          <div className="filter-group">
            <label>Filter Status:</label>
            <select
              className="select-input"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All">All Statuses</option>
              <option value="Pending">Pending Assignment</option>
              <option value="Assigned">Assigned</option>
              <option value="In Progress">Field In Progress</option>
              <option value="Resolved">Resolved</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Filter Priority:</label>
            <select
              className="select-input"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
            >
              <option value="All">All Priorities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Filter Ward / Area:</label>
            <select
              className="select-input"
              value={areaFilter}
              onChange={(e) => setAreaFilter(e.target.value)}
            >
              {areasList.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group flex-grow">
            <label>Search Grievances:</label>
            <input
              type="text"
              className="text-input"
              placeholder="Search Ticket ID, citizen, phone, technician..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Main Table */}
      {loading ? (
        <div className="loading-spinner">Loading operations roster...</div>
      ) : filtered.length === 0 ? (
        <div className="empty-box">No complaints found matching selected criteria.</div>
      ) : (
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Ticket ID</th>
                <th>Citizen Details</th>
                <th>Issue Type</th>
                <th>Ward / Address</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Assigned Technician</th>
                <th>Target SLA</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item._id || item.complaintId}>
                  <td>
                    <strong className="id-link">{item.complaintId}</strong>
                    <br />
                    <small className="text-muted">{new Date(item.createdAt).toLocaleDateString()}</small>
                  </td>
                  <td>
                    <strong>{item.citizenName}</strong>
                    <br />
                    <small>📞 {item.phone}</small>
                  </td>
                  <td>
                    <span className="badge-type">{item.complaintType}</span>
                  </td>
                  <td>
                    <strong>{item.area}</strong>
                    <br />
                    <small className="text-muted">{item.address}</small>
                  </td>
                  <td>
                    <span className={`priority-tag priority-${item.priority.toLowerCase()}`}>
                      {item.priority}
                    </span>
                  </td>
                  <td>
                    <span className={`status-pill status-${item.status.toLowerCase().replace(/\s+/g, "-")}`}>
                      {item.status}
                    </span>
                  </td>
                  <td>
                    {item.assignedTechnicianName && item.assignedTechnicianName !== "Unassigned" ? (
                      <div>
                        <strong>🔧 {item.assignedTechnicianName}</strong>
                        {item.assignedOfficerName && (
                          <div><small className="text-muted">By: {item.assignedOfficerName}</small></div>
                        )}
                      </div>
                    ) : (
                      <span className="badge-unassigned">⚠️ Unassigned</span>
                    )}
                  </td>
                  <td>
                    {item.targetResolutionDate ? (
                      <small className="sla-date">🎯 {item.targetResolutionDate}</small>
                    ) : (
                      <small className="text-muted">Not set</small>
                    )}
                  </td>
                  <td>
                    <div className="table-actions">
                      <button
                        type="button"
                        className="btn btn-sm btn-primary"
                        onClick={() => openAssignModal(item)}
                      >
                        {item.status === "Pending" ? "Assign Tech" : "Reassign"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Assignment Modal */}
      <Modal
        isOpen={isAssignOpen}
        onClose={() => setIsAssignOpen(false)}
        title={activeComplaint ? `👷 Assign Technician: ${activeComplaint.complaintId}` : ""}
      >
        {activeComplaint && (
          <form onSubmit={handleAssignSubmit} className="assign-form">
            <div className="complaint-summary-bubble">
              <p><strong>Citizen:</strong> {activeComplaint.citizenName} | <strong>Area:</strong> {activeComplaint.area}</p>
              <p><strong>Issue:</strong> {activeComplaint.complaintType} - "{activeComplaint.description}"</p>
            </div>

            {assignError && <div className="notice notice-error">{assignError}</div>}

            <div className="form-group">
              <label>Select Field Technician <span className="req">*</span></label>
              <select
                className="select-input"
                value={assignForm.assignedTechnician}
                onChange={(e) => {
                  const tech = defaultTechs.find((t) => t.id === e.target.value);
                  setAssignForm({
                    ...assignForm,
                    assignedTechnician: e.target.value,
                    assignedTechnicianName: tech ? tech.name : "",
                  });
                }}
                required
              >
                {defaultTechs.map((t) => (
                  <option key={t.id} value={t.id}>
                    🔧 {t.name} ({t.department || "Operations"})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Target Resolution Date (SLA):</label>
              <input
                type="date"
                className="text-input"
                value={assignForm.targetResolutionDate}
                onChange={(e) => setAssignForm({ ...assignForm, targetResolutionDate: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>Adjust Priority Level:</label>
              <select
                className="select-input"
                value={assignForm.priority}
                onChange={(e) => setAssignForm({ ...assignForm, priority: e.target.value })}
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical (Immediate Dispatch)</option>
              </select>
            </div>

            <div className="form-group">
              <label>Officer Dispatch Instructions & Special Tools Required:</label>
              <textarea
                className="textarea-input"
                rows="3"
                placeholder="e.g. Carry 6-inch mechanical repair clamp, check isolation valve near junction 4..."
                value={assignForm.note}
                onChange={(e) => setAssignForm({ ...assignForm, note: e.target.value })}
              />
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setIsAssignOpen(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={assignLoading}
              >
                {assignLoading ? "Dispatching..." : "✅ Confirm Assignment & Dispatch"}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}

