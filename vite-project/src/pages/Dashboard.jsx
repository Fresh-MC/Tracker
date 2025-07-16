// vite-project/src/pages/Dashboard.jsx
import React from "react";
import Navbar from "../components/Navbar";
import DashboardCards from "../components/DashboardCards";

export default function Dashboard() {
  return (
    <>
      <Navbar />
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">SIH 19 Dashboard</h1>
        <p className="mb-6 text-gray-600">Smart Project Tracker Overview</p>
        <DashboardCards />
      </div>
    </>
  );
}
