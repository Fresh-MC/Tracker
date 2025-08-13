"use client";
import React, { useState, useEffect } from "react";

const ZoomCards = () => {
  const [modalTask, setModalTask] = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState({});
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    fetch("http://localhost:3000/api/tasks") // Replace with your backend endpoint
      .then((res) => res.json())
      .then((data) => {
        const mappedTasks = data.map((t) => ({
          _id: t._id,
          title: t.title,
          assignedBy: t.assignee,
          dateRange: `${t.startDate} → ${t.endDate}`,
          status: t.status,
          priority: t.priority,
          subtaskCount: t.subtasks?.length || 0,
          color:
            t.status.toLowerCase() === "pending"
              ? "bg-red-500"
              : t.status.toLowerCase() === "in progress"
              ? "bg-yellow-500"
              : "bg-green-500"
        }));
        setTasks(mappedTasks);
      })
      .catch((err) => console.error("Error fetching tasks:", err));
  }, []);

  const handleFileChange = (e, taskId) => {
    const file = e.target.files[0];
    if (file) {
      setUploadedFiles((prev) => ({
        ...prev,
        [taskId]: file,
      }));
    }
  };

  return (
    <div className="w-full relative px-4 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {tasks.map((task) => (
          <div
            key={task._id}
            className="w-full relative mx-auto overflow-hidden rounded-2xl shadow-xl transition-transform duration-300 hover:scale-105 group"
          >
            {/* Card */}
            <div className="bg-[#181818] w-full h-56 rounded-2xl flex flex-col justify-between p-4 text-[#f8f7ec]">
              
              {/* Top: Date Range & Priority */}
              <div className="flex justify-between items-start">
                <span className="text-xs bg-white/10 px-3 py-1 rounded-full">
                  {task.dateRange}
                </span>
                <span
                  className={`text-xs px-3 py-1 rounded-full ${
                    task.priority === "High"
                      ? "bg-red-600"
                      : task.priority === "Medium"
                      ? "bg-yellow-600"
                      : "bg-green-600"
                  }`}
                >
                  {task.priority}
                </span>
              </div>

              {/* Title */}
              <div className="text-lg font-semibold">{task.title}</div>

              {/* Bottom: Status & Assigned + Subtasks */}
              <div className="flex justify-between items-end">
                <span
                  className={`text-sm px-3 py-1 rounded-full ${task.color}`}
                >
                  {task.status}
                </span>
                <div className="flex items-center gap-4">
                  <span className="text-xs opacity-70">By {task.assignedBy}</span>
                  <span className="text-xs bg-white/10 px-2 py-1 rounded-full">
                    {task.subtaskCount} Subtasks
                  </span>
                </div>
              </div>
            </div>

            {/* Hover Actions */}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
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
                  onChange={(e) => handleFileChange(e, task._id)}
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
            <p><strong>Assigned by:</strong> {modalTask.assignedBy}</p>
            <p>
              <strong>Status:</strong>{" "}
              <span className={`px-2 py-1 rounded ${modalTask.color} text-[#f8f7ec]`}>
                {modalTask.status}
              </span>
            </p>
            <p><strong>Priority:</strong> {modalTask.priority}</p>
            <p><strong>Timeline:</strong> {modalTask.dateRange}</p>
            <p><strong>Subtasks:</strong> {modalTask.subtaskCount}</p>

            {uploadedFiles[modalTask._id] ? (
              <div className="mt-2">
                <p className="text-sm font-semibold">Proof Uploaded:</p>
                <p className="text-xs text-gray-500">
                  {uploadedFiles[modalTask._id].name}
                </p>
              </div>
            ) : (
              <p className="text-sm italic text-gray-500">No file uploaded yet.</p>
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
