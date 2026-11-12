import React, { useState, useEffect } from "react";
import { api } from "../services/api";

export default function DashboardScreen({ currentUser, onNavigate }) {
  const [stats, setStats] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, compRes, schedRes] = await Promise.all([
        api.complaints.getStats(),
        api.complaints.getAll(),
        api.schedules.getAll(),
      ]);

      if (statsRes.success) setStats(statsRes.data);
      if (compRes.success) setComplaints(compRes.data);
      if (schedRes.success) setSchedules(schedRes.data);
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  if (loading) {
    return <div className="loading-spinner">Loading Executive Dashboard KPIs...</div>;
  }

  // Visual Breakdown Aggregations
  const categories = ["Leakage", "Water Shortage", "Water Quality", "Low Pressure", "Pipeline Damage"];
  const categoryCounts = categories.map((cat) => ({
    name: cat,
    count: complaints.filter((c) => c.complaintType === cat).length,
  }));

  const maxCatCount = Math.max(...categoryCounts.map((c) => c.count), 1);

  const statusItems = [
    { label: "Pending", count: stats ? stats.pending : 0, color: "#f59e0b" },
    { label: "Assigned", count: stats ? stats.assigned : 0, color: "#3b82f6" },
    { label: "In Progress", count: stats ? stats.inProgress : 0, color: "#8b5cf6" },
    { label: "Resolved", count: stats ? stats.resolved : 0, color: "#10b981" },
  ];

  const totalComplaints = stats ? stats.total : 1;

  // Urgent Items needing immediate assignment
  const urgentQueue = complaints.filter(
    (c) => (c.status === "Pending" || c.priority === "Critical") && c.status !== "Resolved"
  ).slice(0, 5);

  return (
    <div className="screen-container">
      {/* Header */}
      <div className="section-header">
        <div>
          <span className="eyebrow">EXECUTIVE OPERATIONS OVERSIGHT</span>
          <h2 className="section-title">📊 Water Grid Monitoring & Complaint Dashboard</h2>
          <p className="section-desc">
            Holistic situational awareness across municipal water zones, technician SLAs, and pipeline integrity.
          </p>
        </div>
        <div className="header-actions">
          <button
            type="button"
            className="btn btn-outline"
            onClick={loadDashboardData}
          >
            🔄 Refresh Data
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => onNavigate("reports")}
          >
            📈 Open Mandatory Reports
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon-wrapper" style={{ background: "#e0f2fe", color: "#0284c7" }}>
            💧
          </div>
          <div className="kpi-info">
            <span className="kpi-label">Total Complaints</span>
            <strong className="kpi-value">{stats ? stats.total : 0}</strong>
            <span className="kpi-sub">Across all 6 monitored wards</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrapper" style={{ background: "#dcfce7", color: "#16a34a" }}>
            🎯
          </div>
          <div className="kpi-info">
            <span className="kpi-label">Resolution Rate</span>
            <strong className="kpi-value">{stats ? stats.resolutionRate : 0}%</strong>
            <span className="kpi-sub">{stats ? stats.resolved : 0} tickets completed</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrapper" style={{ background: "#fef3c7", color: "#d97706" }}>
            ⏳
          </div>
          <div className="kpi-info">
            <span className="kpi-label">Active Workload</span>
            <strong className="kpi-value">
              {stats ? stats.pending + stats.assigned + stats.inProgress : 0}
            </strong>
            <span className="kpi-sub">Pending, Assigned & Field In Progress</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrapper" style={{ background: "#fee2e2", color: "#dc2626" }}>
            🚨
          </div>
          <div className="kpi-info">
            <span className="kpi-label">Critical Unresolved</span>
            <strong className="kpi-value" style={{ color: "#dc2626" }}>
              {stats ? stats.critical : 0}
            </strong>
            <span className="kpi-sub">Requires priority dispatch</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrapper" style={{ background: "#f3e8ff", color: "#9333ea" }}>
            ⏱️
          </div>
          <div className="kpi-info">
            <span className="kpi-label">Avg Resolution Time</span>
            <strong className="kpi-value">{stats ? stats.avgResolutionHours : 0} hrs</strong>
            <span className="kpi-sub">Municipal benchmark &lt; 24 hrs</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrapper" style={{ background: "#e0e7ff", color: "#4f46e5" }}>
            📅
          </div>
          <div className="kpi-info">
            <span className="kpi-label">Supply Schedules</span>
            <strong className="kpi-value">{schedules.length}</strong>
            <span className="kpi-sub">Area supply windows published</span>
          </div>
        </div>
      </div>

      {/* Visual Analytics Grid */}
      <div className="charts-grid">
        {/* Chart 1: Status Distribution */}
        <div className="dashboard-panel">
          <h3 className="panel-title">📌 Grievance Status Distribution</h3>
          <p className="panel-sub">Current status breakdown across all registered citizen complaints.</p>

          <div className="status-bars-container">
            {statusItems.map((st) => {
              const pct = totalComplaints > 0 ? Math.round((st.count / totalComplaints) * 100) : 0;
              return (
                <div key={st.label} className="status-bar-row">
                  <div className="status-bar-label">
                    <span>{st.label}</span>
                    <strong>{st.count} ({pct}%)</strong>
                  </div>
                  <div className="bar-track">
                    <div
                      className="bar-fill"
                      style={{
                        width: `${Math.max(pct, 4)}%`,
                        backgroundColor: st.color,
                      }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chart 2: Category Breakdown */}
        <div className="dashboard-panel">
          <h3 className="panel-title">💧 Complaints by Issue Category</h3>
          <p className="panel-sub">Volume of leakage, shortage, water quality, and low pressure reports.</p>

          <div className="category-bars-container">
            {categoryCounts.map((cat) => {
              const pct = Math.round((cat.count / maxCatCount) * 100);
              return (
                <div key={cat.name} className="category-bar-row">
                  <div className="cat-header">
                    <span className="cat-name">{cat.name}</span>
                    <strong className="cat-count">{cat.count} ticket(s)</strong>
                  </div>
                  <div className="bar-track">
                    <div
                      className="bar-fill cat-fill"
                      style={{ width: `${Math.max(pct, 6)}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Urgent Attention Table */}
      <div className="dashboard-panel urgent-panel">
        <div className="urgent-header">
          <div>
            <h3 className="panel-title">🚨 High Priority & Pending Assignment Queue</h3>
            <p className="panel-sub">Complaints that require immediate officer review or technician assignment.</p>
          </div>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => onNavigate("manage-complaints")}
          >
            📋 Go to Assignment Console &rarr;
          </button>
        </div>

        {urgentQueue.length === 0 ? (
          <div className="empty-box-compact">All high-priority complaints have been dispatched!</div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Ticket ID</th>
                  <th>Citizen</th>
                  <th>Type</th>
                  <th>Ward / Area</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {urgentQueue.map((c) => (
                  <tr key={c._id || c.complaintId}>
                    <td><strong>{c.complaintId}</strong></td>
                    <td>{c.citizenName} ({c.phone})</td>
                    <td>{c.complaintType}</td>
                    <td>{c.area}</td>
                    <td>
                      <span className={`priority-tag priority-${c.priority.toLowerCase()}`}>
                        {c.priority}
                      </span>
                    </td>
                    <td>
                      <span className={`status-pill status-${c.status.toLowerCase().replace(/\s+/g, "-")}`}>
                        {c.status}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-sm btn-primary"
                        onClick={() => onNavigate("manage-complaints")}
                      >
                        Assign &rarr;
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

