import React from "react";

export default function Navbar({ activeTab, setActiveTab, currentUser, onLogout }) {
  const role = currentUser ? currentUser.role : "Guest";

  // Navigation tabs based on permissions
  const getNavItems = () => {
    const items = [
      { id: "schedules", label: "💧 Water Schedules", roles: ["all"] },
      { id: "register-complaint", label: "📝 Lodge Complaint", roles: ["all"] },
      { id: "my-complaints", label: "🔍 Track Complaints", roles: ["all"] },
    ];

    if (role === "Admin" || role === "Water Department Officer") {
      items.push(
        { id: "dashboard", label: "📊 KPI Dashboard", roles: ["Admin", "Water Department Officer"] },
        { id: "manage-complaints", label: "📋 Assign Complaints", roles: ["Admin", "Water Department Officer"] },
        { id: "manage-schedules", label: "⚙️ Schedules & Alerts", roles: ["Admin", "Water Department Officer"] }
      );
    }

    if (role === "Field Technician") {
      items.push({ id: "technician-tasks", label: "🛠️ My Field Tasks", roles: ["Field Technician"] });
    }

    // Reports are accessible to staff and admin
    if (["Admin", "Water Department Officer", "Field Technician"].includes(role)) {
      items.push({ id: "reports", label: "📈 Mandatory Reports", roles: ["Admin", "Water Department Officer", "Field Technician"] });
    }

    return items;
  };

  const navItems = getNavItems();

  return (
    <header className="main-navbar">
      <div className="navbar-container">
        <div className="navbar-brand" onClick={() => setActiveTab("schedules")}>
          <div className="brand-logo-circle">💧</div>
          <div className="brand-text">
            <h1 className="brand-title">JalConnect</h1>
            <span className="brand-subtitle">Water Supply Complaint & Monitoring Portal</span>
          </div>
        </div>

        <nav className="navbar-links">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`nav-link ${activeTab === item.id ? "active" : ""}`}
              onClick={() => setActiveTab(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="navbar-user">
          {currentUser ? (
            <div className="user-profile-badge">
              <div className="user-details">
                <span className="user-name">{currentUser.name}</span>
                <span className={`user-role-pill role-${currentUser.role.toLowerCase().replace(/\s+/g, "-")}`}>
                  {currentUser.role}
                </span>
              </div>
              <button
                type="button"
                className="btn-logout"
                title="Sign out of current account"
                onClick={onLogout}
              >
                Sign Out
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="btn-login-header"
              onClick={() => setActiveTab("auth")}
            >
              🔐 Sign In / Register
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
