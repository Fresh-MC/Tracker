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
      </Routes>
    </HashRouter>
  </React.StrictMode>
);
