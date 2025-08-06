"use client";
import React, { useState } from "react";

const ZoomCards = () => {
  const [modalTask, setModalTask] = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState({});

  const tasks = [
    {
      id: 1,
      title: "UI Design for Dashboard",
      assignedBy: "Sachin",
      dueTime: "2025-07-20 18:00",
      status: "In Progress",
      color: "bg-yellow-500",
    },
    {
      id: 2,
      title: "Backend API Integration",
      assignedBy: "Neha",
      dueTime: "2025-07-22 12:00",
      status: "Pending",
      color: "bg-red-500",
    },
  ];

  const handleFileChange = async (e, taskId) => {
    const file = e.target.files[0];
    if (file) {
      setUploadedFiles((prev) => ({
        ...prev,
        [taskId]: file,
      }));

      // Prepare form data
      const formData = new FormData();
      formData.append("file", file);
      formData.append("taskId", taskId);

      // Send to backend
      const res = await fetch("http://localhost:3000/api/upload", {
        method: "POST",
        body: formData,
        credentials: "include", // if you use cookies/auth
      });

      if (res.ok) {
        // Optionally handle response
        alert("File uploaded!");
      } else {
        alert("Upload failed");
      }
    }
  };

  return (
    <div className="w-full relative px-4 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {tasks.map((task) => (
          <div
            key={task.id}
            className="w-full relative mx-auto overflow-hidden rounded-2xl shadow-xl transition-transform duration-300 hover:scale-105 group"
          >
            {/* Background Placeholder */}
            <div className="bg-[#181818] w-full h-56 rounded-2xl flex flex-col justify-between p-4 text-[#f8f7ec]">
              {/* Top-right due time */}
              <div className="flex justify-between items-start">
                <span className="text-xs bg-white/10 px-3 py-1 rounded-full">
                  Due: {task.dueTime}
                </span>
              </div>

              {/* Center title */}
              <div className="text-lg font-semibold">{task.title}</div>

              {/* Bottom */}
              <div className="flex justify-between items-end">
                {/* Status */}
                <span
                  className={`text-sm px-3 py-1 rounded-full ${task.color}`}
                >
                  {task.status}
                </span>

                <div className="flex items-center gap-2">
                  {/* Assigned by */}
                  <span className="text-xs opacity-70">By {task.assignedBy}</span>

                  {/* Upload proof */}
                  
                </div>
              </div>
            </div>

            {/* View Details on hover or click */}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <button
                className="px-4 py-2 text-sm bg-white text-black rounded-full"
                onClick={() => setModalTask(task)}
              >
                View Details
              </button>
              <label className="cursor-pointer underline px-4 py-2 text-sm bg-white text-black rounded-full">
                    Upload Proof
                    <input
                      type="file"
                      onChange={(e) => handleFileChange(e, task.id)}
                      className="hidden"
                    />
                  </label>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {modalTask && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-full max-w-md space-y-4">
            <h2 className="text-xl font-bold">{modalTask.title}</h2>
            <p>
              <strong>Assigned by:</strong> {modalTask.assignedBy}
            </p>
            <p>
              <strong>Status:</strong>{" "}
              <span className={`px-2 py-1 rounded ${modalTask.color} text-[#f8f7ec]`}>
                {modalTask.status}
              </span>
            </p>
            <p>
              <strong>Due:</strong> {modalTask.dueTime}
            </p>

            {/* Preview uploaded file */}
            {uploadedFiles[modalTask.id] ? (
              <div className="mt-2">
                <p className="text-sm font-semibold">Proof Uploaded:</p>
                <p className="text-xs text-gray-500">
                  {uploadedFiles[modalTask.id].name}
                </p>
              </div>
            ) : (
              <p className="text-sm italic text-gray-500">
                No file uploaded yet.
              </p>
            )}

            <div className="flex justify-end">
              <button
                className="text-sm px-4 py-2 bg-black text-[#f8f7ec] rounded"
                onClick={() => setModalTask(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ZoomCards;
