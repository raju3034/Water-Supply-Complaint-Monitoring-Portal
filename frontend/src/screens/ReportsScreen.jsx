import React, { useState, useEffect } from "react";
import { api } from "../services/api";

export default function ReportsScreen({ currentUser }) {
  const [activeReport, setActiveReport] = useState("complaint-status");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchReport = async (reportType) => {
    try {
      setLoading(true);
      let res;
      if (reportType === "complaint-status") res = await api.reports.getComplaintStatus();
      else if (reportType === "area-wise") res = await api.reports.getAreaWise();
      else if (reportType === "water-schedule") res = await api.reports.getWaterSchedule();
      else if (reportType === "resolution-time") res = await api.reports.getResolutionTime();

      if (res && res.success) {
        setData(res);
      }
    } catch (err) {
      console.error("Failed to fetch report:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport(activeReport);
  }, [activeReport]);

  // Export to CSV function
  const handleExportCSV = () => {
    if (!data) return;

    let csvContent = "data:text/csv;charset=utf-8,";
    const filename = `${activeReport}-report-${new Date().toISOString().slice(0, 10)}.csv`;

    if (activeReport === "complaint-status" && data.details) {
      csvContent += "Complaint ID,Citizen Name,Phone,Issue Type,Ward / Area,Priority,Status,Technician,Reported Date\n";
      data.details.forEach((row) => {
        csvContent += `"${row.id}","${row.citizenName}","${row.phone}","${row.type}","${row.area}","${row.priority}","${row.status}","${row.assignedTechnician}","${new Date(row.createdAt).toLocaleDateString()}"\n`;
      });
    } else if (activeReport === "area-wise" && data.areas) {
      csvContent += "Ward / Area,Total Complaints,Leakage,Shortage,Quality,Low Pressure,Open Issues,Resolved,Resolution Rate (%),Health\n";
      data.areas.forEach((row) => {
        csvContent += `"${row.area}",${row.total},${row.leakage},${row.shortage},${row.quality},${row.lowPressure},${row.openCount},${row.resolved},${row.resolutionRatePercent}%,"${row.health}"\n`;
      });
    } else if (activeReport === "water-schedule" && data.schedules) {
      csvContent += "Ward,Area,Intake Source,Morning Supply,Evening Supply,Days,Daily Hours,Pressure,Status,Remarks\n";
      data.schedules.forEach((row) => {
        csvContent += `"${row.ward}","${row.area}","${row.source}","${row.morningWindow}","${row.eveningWindow}","${row.days}",${row.dailyHours},"${row.pressure}","${row.status}","${row.remarks}"\n`;
      });
    } else if (activeReport === "resolution-time" && data.technicianMetrics) {
      csvContent += "Technician Name,Tasks Assigned,Tasks Resolved,Avg Resolution Hours,Citizen Rating,Efficiency (%)\n";
      data.technicianMetrics.forEach((row) => {
        csvContent += `"${row.technicianName}",${row.assignedCount},${row.resolvedCount},${row.avgResolutionHours},${row.citizenRatingAvg},${row.completionEfficiencyPercent}%\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="screen-container reports-view">
      {/* Header */}
      <div className="section-header print-hidden">
        <div>
          <span className="eyebrow">STATUTORY AUDIT & PERFORMANCE</span>
          <h2 className="section-title">📈 Mandatory Course Project Reports</h2>
          <p className="section-desc">
            Official municipal analytics mandated for B.Tech DevOps & Full Stack Evaluation. Supports real-time CSV export and print preview.
          </p>
        </div>
        <div className="header-actions">
          <button type="button" className="btn btn-outline" onClick={handleExportCSV}>
            📥 Export to CSV
          </button>
          <button type="button" className="btn btn-primary" onClick={handlePrint}>
            🖨️ Print / Save as PDF
          </button>
        </div>
      </div>

      {/* Report Nav Tabs */}
      <div className="report-tabs-bar print-hidden">
        <button
          type="button"
          className={`report-tab ${activeReport === "complaint-status" ? "active" : ""}`}
          onClick={() => setActiveReport("complaint-status")}
        >
          1. Complaint Status Report
        </button>
        <button
          type="button"
          className={`report-tab ${activeReport === "area-wise" ? "active" : ""}`}
          onClick={() => setActiveReport("area-wise")}
        >
          2. Area-wise Complaint Report
        </button>
        <button
          type="button"
          className={`report-tab ${activeReport === "water-schedule" ? "active" : ""}`}
          onClick={() => setActiveReport("water-schedule")}
        >
          3. Water Supply Schedule Report
        </button>
        <button
          type="button"
          className={`report-tab ${activeReport === "resolution-time" ? "active" : ""}`}
          onClick={() => setActiveReport("resolution-time")}
        >
          4. Resolution Time Report
        </button>
      </div>

      {/* Printable Report Header */}
      <div className="print-report-header">
        <h2>JalConnect Municipal Water Operations Report</h2>
        <p>Report Name: <strong>{data ? data.reportName : activeReport}</strong> | Generated: {data ? new Date(data.generatedAt).toLocaleString() : ""}</p>
        <hr />
      </div>

      {loading ? (
        <div className="loading-spinner">Generating official report analytics...</div>
      ) : !data ? (
        <div className="empty-box">Unable to generate report data.</div>
      ) : (
        <div className="report-content-panel">
          {/* ================= REPORT 1 ================= */}
          {activeReport === "complaint-status" && (
            <div className="report-subpage">
              <div className="kpi-grid">
                <div className="kpi-card">
                  <span className="kpi-label">Total Registered</span>
                  <strong className="kpi-value">{data.summary.total}</strong>
                </div>
                <div className="kpi-card">
                  <span className="kpi-label">Pending Review</span>
                  <strong className="kpi-value" style={{ color: "#f59e0b" }}>{data.summary.pending}</strong>
                </div>
                <div className="kpi-card">
                  <span className="kpi-label">Dispatched / Field</span>
                  <strong className="kpi-value" style={{ color: "#3b82f6" }}>{data.summary.assigned + data.summary.inProgress}</strong>
                </div>
                <div className="kpi-card">
                  <span className="kpi-label">Resolved Rate</span>
                  <strong className="kpi-value" style={{ color: "#10b981" }}>{data.summary.resolutionRatePercent}%</strong>
                </div>
              </div>

              <div className="report-section-title">Breakdown by Priority & Issue Type</div>
              <div className="report-stat-pills">
                <span className="stat-pill">Low: {data.priorityBreakdown.Low}</span>
                <span className="stat-pill">Medium: {data.priorityBreakdown.Medium}</span>
                <span className="stat-pill">High: {data.priorityBreakdown.High}</span>
                <span className="stat-pill critical">Critical: {data.priorityBreakdown.Critical}</span>
                <span className="stat-pill info">Leakages: {data.typeBreakdown.Leakage}</span>
                <span className="stat-pill info">Shortages: {data.typeBreakdown["Water Shortage"]}</span>
                <span className="stat-pill info">Quality: {data.typeBreakdown["Water Quality"]}</span>
              </div>

              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Complaint ID</th>
                      <th>Citizen</th>
                      <th>Type</th>
                      <th>Ward / Locality</th>
                      <th>Priority</th>
                      <th>Status</th>
                      <th>Technician</th>
                      <th>Logged Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.details.map((row) => (
                      <tr key={row.id}>
                        <td><strong>{row.id}</strong></td>
                        <td>{row.citizenName} ({row.phone})</td>
                        <td>{row.type}</td>
                        <td>{row.area}</td>
                        <td>
                          <span className={`priority-tag priority-${row.priority.toLowerCase()}`}>
                            {row.priority}
                          </span>
                        </td>
                        <td>
                          <span className={`status-pill status-${row.status.toLowerCase().replace(/\s+/g, "-")}`}>
                            {row.status}
                          </span>
                        </td>
                        <td>{row.assignedTechnician}</td>
                        <td>{new Date(row.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ================= REPORT 2 ================= */}
          {activeReport === "area-wise" && (
            <div className="report-subpage">
              <div className="summary-banner">
                <strong>Monitored Wards:</strong> {data.totalAreasMonitored} zones under surveillance.
              </div>

              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Ward / Area</th>
                      <th>Total Grievances</th>
                      <th>Leakages</th>
                      <th>Water Shortage</th>
                      <th>Quality Issues</th>
                      <th>Low Pressure</th>
                      <th>Open Backlog</th>
                      <th>Resolved</th>
                      <th>Resolution %</th>
                      <th>Zone Health</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.areas.map((row) => (
                      <tr key={row.area}>
                        <td><strong>{row.area}</strong></td>
                        <td><strong>{row.total}</strong></td>
                        <td>{row.leakage}</td>
                        <td>{row.shortage}</td>
                        <td>{row.quality}</td>
                        <td>{row.lowPressure}</td>
                        <td>
                          <span className={row.openCount > 0 ? "text-warning" : "text-muted"}>
                            {row.openCount}
                          </span>
                        </td>
                        <td><span className="text-success">{row.resolved}</span></td>
                        <td><strong>{row.resolutionRatePercent}%</strong></td>
                        <td>
                          <span className={`health-badge health-${row.health.toLowerCase().replace(/\s+/g, "-")}`}>
                            {row.health}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ================= REPORT 3 ================= */}
          {activeReport === "water-schedule" && (
            <div className="report-subpage">
              <div className="kpi-grid">
                <div className="kpi-card">
                  <span className="kpi-label">Active Schedules</span>
                  <strong className="kpi-value">{data.summary.totalSchedules}</strong>
                </div>
                <div className="kpi-card">
                  <span className="kpi-label">On-Time Compliance</span>
                  <strong className="kpi-value" style={{ color: "#10b981" }}>{data.summary.complianceRatePercent}%</strong>
                </div>
                <div className="kpi-card">
                  <span className="kpi-label">Delayed Supply</span>
                  <strong className="kpi-value" style={{ color: "#f59e0b" }}>{data.summary.delayedCount}</strong>
                </div>
                <div className="kpi-card">
                  <span className="kpi-label">Avg Daily Supply</span>
                  <strong className="kpi-value">{data.summary.avgDailySupplyHours} hrs</strong>
                </div>
              </div>

              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Ward</th>
                      <th>Area / Locality</th>
                      <th>Feeder Source</th>
                      <th>Morning Window</th>
                      <th>Evening Window</th>
                      <th>Days</th>
                      <th>Daily Duration</th>
                      <th>Pressure Level</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.schedules.map((row) => (
                      <tr key={row.id}>
                        <td><strong>{row.ward}</strong></td>
                        <td>{row.area}</td>
                        <td>{row.source}</td>
                        <td>🌅 {row.morningWindow}</td>
                        <td>🌆 {row.eveningWindow}</td>
                        <td>{row.days}</td>
                        <td>{row.dailyHours} hrs</td>
                        <td>{row.pressure}</td>
                        <td>
                          <span className={`status-pill status-${row.status.toLowerCase().replace(/\s+/g, "-")}`}>
                            {row.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ================= REPORT 4 ================= */}
          {activeReport === "resolution-time" && (
            <div className="report-subpage">
              <div className="kpi-grid">
                <div className="kpi-card">
                  <span className="kpi-label">Overall Avg Turnaround</span>
                  <strong className="kpi-value" style={{ color: "#0284c7" }}>{data.summary.overallAvgHours} hrs</strong>
                  <span className="kpi-sub">Benchmark &lt; 24 hrs</span>
                </div>
                <div className="kpi-card">
                  <span className="kpi-label">Fastest Resolution</span>
                  <strong className="kpi-value" style={{ color: "#10b981" }}>{data.summary.fastestResolutionHours} hrs</strong>
                  <span className="kpi-sub">Industrial valve repair</span>
                </div>
                <div className="kpi-card">
                  <span className="kpi-label">Longest Resolution</span>
                  <strong className="kpi-value" style={{ color: "#f59e0b" }}>{data.summary.longestResolutionHours} hrs</strong>
                  <span className="kpi-sub">Complex line excavation</span>
                </div>
                <div className="kpi-card">
                  <span className="kpi-label">Completed Repaired Samples</span>
                  <strong className="kpi-value">{data.summary.totalResolved}</strong>
                </div>
              </div>

              <div className="report-section-title">Average Resolution Time by Complaint Category</div>
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Complaint Type</th>
                      <th>Total Lodged</th>
                      <th>Total Resolved</th>
                      <th>Average Resolution Hours</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.categoryResolution.map((cg) => (
                      <tr key={cg.complaintType}>
                        <td><strong>{cg.complaintType}</strong></td>
                        <td>{cg.totalLodged}</td>
                        <td>{cg.totalResolved}</td>
                        <td><strong>{cg.avgResolutionHours} hours</strong></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="report-section-title" style={{ marginTop: "24px" }}>
                Field Technician Performance & Efficiency Leaderboard
              </div>
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Technician Name</th>
                      <th>Assigned Tasks</th>
                      <th>Resolved Tasks</th>
                      <th>Avg Turnaround Time</th>
                      <th>Citizen Star Rating</th>
                      <th>Resolution Efficiency</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.technicianMetrics.map((t) => (
                      <tr key={t.technicianName}>
                        <td><strong>🔧 {t.technicianName}</strong></td>
                        <td>{t.assignedCount}</td>
                        <td><strong className="text-success">{t.resolvedCount}</strong></td>
                        <td>{t.avgResolutionHours} hrs</td>
                        <td>
                          <span>⭐ {t.citizenRatingAvg} / 5.0</span>
                        </td>
                        <td>
                          <div className="efficiency-bar-wrapper">
                            <span>{t.completionEfficiencyPercent}%</span>
                            <div className="bar-track-sm">
                              <div
                                className="bar-fill-sm"
                                style={{ width: `${t.completionEfficiencyPercent}%` }}
                              ></div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

