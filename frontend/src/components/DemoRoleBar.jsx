import React from "react";

export default function DemoRoleBar({ onQuickLogin, currentUser }) {
  const roles = [
    {
      role: "Admin",
      label: "👑 Admin",
      email: "admin@jalconnect.gov.in",
      pwd: "Admin@1234",
      desc: "Executive Oversight & Reports",
    },
    {
      role: "Water Department Officer",
      label: "🏢 Dept Officer",
      email: "officer@jalconnect.gov.in",
      pwd: "Officer@1234",
      desc: "Assignments & Schedules",
    },
    {
      role: "Field Technician",
      label: "🔧 Technician",
      email: "technician@jalconnect.gov.in",
      pwd: "Tech@1234",
      desc: "Field Work & Resolution",
    },
    {
      role: "Citizen",
      label: "👤 Citizen",
      email: "citizen@example.com",
      pwd: "Citizen@1234",
      desc: "Complaint Lodging & Tracking",
    },
  ];

  return (
    <div className="demo-bar">
      <div className="demo-bar-inner">
        <span className="demo-bar-title">
          <span className="demo-badge">DEMO EVALUATION</span> 1-Click Role Switcher:
        </span>
        <div className="demo-buttons">
          {roles.map((r) => {
            const isActive = currentUser && currentUser.role === r.role;
            return (
              <button
                key={r.role}
                type="button"
                className={`demo-btn ${isActive ? "active" : ""}`}
                title={`${r.desc} (${r.email})`}
                onClick={() => onQuickLogin(r.email, r.pwd)}
              >
                {r.label}
                {isActive && <span className="active-dot">●</span>}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

