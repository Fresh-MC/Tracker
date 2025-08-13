// vite-project/src/navmain.jsx

import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter, Routes, Route } from "react-router-dom";
import TeamDashboard from "./pages/TeamDashboard.jsx";

import App from "./App.jsx";
import About from "./pages/About.jsx";
import Contact from "./pages/Contact.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import DashboardM from "./pages/manager/ManagerDash.jsx";
import Profile from "./pages/Profile.jsx";
import TaskForm from "./components/TaskForm.jsx";
import ProjectPlan from "./pages/ProjectPlan.jsx";
import Chat from "./pages/Chat";
import ManagerPage from "./components/ManagerPage.jsx";
import ProPlan from "./components/Proplans.jsx";

import "./index.css";

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <React.StrictMode>
    <HashRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/manager" element={<DashboardM />} />
        <Route path="/team-dashboard" element={<TeamDashboard />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/task-form" element={<TaskForm />} />
        <Route path="/project-plan" element={<ProjectPlan />} />
        <Route path="/chat" element={<Chat teamId="team1" senderEmail="user@example.com" />} />
        <Route path="/manager-page" element={<ManagerPage />} />
        <Route path="/plan" element={<ProPlan />} />
      </Routes>
    </HashRouter>
  </React.StrictMode>
);
