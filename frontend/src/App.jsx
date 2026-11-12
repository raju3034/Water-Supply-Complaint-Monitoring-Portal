import React, { useState, useEffect } from "react";
import "./App.css";

import Navbar from "./components/Navbar";

import PublicScheduleScreen from "./screens/PublicScheduleScreen";
import RegisterComplaintScreen from "./screens/RegisterComplaintScreen";
import MyComplaintsScreen from "./screens/MyComplaintsScreen";
import AuthScreen from "./screens/AuthScreen";
import DashboardScreen from "./screens/DashboardScreen";
import OfficerManageScreen from "./screens/OfficerManageScreen";
import TechnicianScreen from "./screens/TechnicianScreen";
import ScheduleManageScreen from "./screens/ScheduleManageScreen";
import ReportsScreen from "./screens/ReportsScreen";

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState("schedules");

  // Restore authenticated user on mount
  useEffect(() => {
    const savedUser = localStorage.getItem("jalconnect_user");
    const token = localStorage.getItem("jalconnect_token");
    if (savedUser && token) {
      try {
        setCurrentUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem("jalconnect_user");
        localStorage.removeItem("jalconnect_token");
      }
    }
  }, []);

  // Quick 1-click login handler removed — manual login only
  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    if (user.role === "Admin" || user.role === "Water Department Officer") {
      setActiveTab("dashboard");
    } else if (user.role === "Field Technician") {
      setActiveTab("technician-tasks");
    } else {
      setActiveTab("my-complaints");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("jalconnect_token");
    localStorage.removeItem("jalconnect_user");
    setCurrentUser(null);
    setActiveTab("schedules");
  };

  return (
    <div className="portal-app">
      {/* Main Navigation Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <main className="portal-main">
        {activeTab === "schedules" && (
          <PublicScheduleScreen
            currentUser={currentUser}
            onNavigate={(tab) => setActiveTab(tab)}
          />
        )}

        {activeTab === "register-complaint" && (
          <RegisterComplaintScreen
            currentUser={currentUser}
            onNavigate={(tab) => setActiveTab(tab)}
            onComplaintRegistered={() => { }}
          />
        )}

        {activeTab === "my-complaints" && (
          <MyComplaintsScreen
            currentUser={currentUser}
            onNavigate={(tab) => setActiveTab(tab)}
          />
        )}

        {activeTab === "auth" && (
          <AuthScreen
            currentUser={currentUser}
            onLoginSuccess={handleLoginSuccess}
            onLogout={handleLogout}
          />
        )}

        {activeTab === "dashboard" && (
          <DashboardScreen
            currentUser={currentUser}
            onNavigate={(tab) => setActiveTab(tab)}
          />
        )}

        {activeTab === "manage-complaints" && (
          <OfficerManageScreen
            currentUser={currentUser}
            onNavigate={(tab) => setActiveTab(tab)}
          />
        )}

        {activeTab === "technician-tasks" && (
          <TechnicianScreen
            currentUser={currentUser}
            onNavigate={(tab) => setActiveTab(tab)}
          />
        )}

        {activeTab === "manage-schedules" && (
          <ScheduleManageScreen
            currentUser={currentUser}
          />
        )}

        {activeTab === "reports" && (
          <ReportsScreen
            currentUser={currentUser}
          />
        )}
      </main>

      {/* Portal Footer */}
      <footer className="portal-footer print-hidden">
        <div className="footer-content">
          <div className="footer-col">
            <h4>💧 JalConnect Municipal Water Portal</h4>
            <p>
              Integrated Water Supply Complaint, Schedule Monitoring and Field Resolution Platform.
            </p>
          </div>

          <div className="footer-col">
            <h4>Quick Links</h4>
            <ul>
              <li><button type="button" onClick={() => setActiveTab("schedules")}>Area Water Supply Schedules</button></li>
              <li><button type="button" onClick={() => setActiveTab("register-complaint")}>Lodge Water Leakage Grievance</button></li>
              <li><button type="button" onClick={() => setActiveTab("my-complaints")}>Real-time Grievance Tracking</button></li>
              <li><button type="button" onClick={() => setActiveTab("reports")}>Mandatory Compliance Reports</button></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>Municipal Control Room</h4>
            <p>📞 Toll-Free Helpline: 1800-120-JAL (525)</p>
            <p>📧 Email: support@jalconnect.gov.in</p>
            <p>🕒 Operations: 24x7 Water Supply Control Center</p>
          </div>
        </div>

        <div className="footer-bottom">
          <p>© 2026-2027 Municipal Water Supply Department. All rights reserved. Academic Course Project Submission.</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
