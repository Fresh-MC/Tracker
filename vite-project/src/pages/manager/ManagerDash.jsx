// vite-project/src/pages/manager/ManagerDash.jsx
import React from "react";
import Navbar from "../../components/Navbar";

import TaskForm from "../../components/TaskForm";



export default function DashboardM() {
  return (
    <>
      <Navbar />
        <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Manager Dashboard</h1>
        <p className="mb-6 text-gray-600">Manage your team's tasks and projects</p>
        <TaskForm />
        </div>
    </>
  );
}
