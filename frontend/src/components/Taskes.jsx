import { useState, useEffect } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export default function Taskes({ projectEndDate }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [users, setUsers] = useState([]);
  const [task, setTask] = useState({
    title: "",
    assignee: "",
    startDate: "",
    endDate: "",
    priority: "Medium",
    description: "",
    subtasks: [""],
  });

  // Fetch users (both existing workers & new joinees)
  useEffect(() => {
    fetch(`${API_URL}/api/users`)
      .then((res) => {
        if (!res.ok) {
          throw new Error('Failed to fetch users');
        }
        return res.json();
      })
      .then((data) => {
        // Ensure data is an array before setting
        if (Array.isArray(data)) {
          setUsers(data);
        } else if (data && Array.isArray(data.users)) {
          setUsers(data.users);
        } else {
          console.warn('Invalid user data format, using empty array');
          setUsers([]);
        }
      })
      .catch((err) => {
        console.error("Error fetching users:", err);
        setUsers([]); // Set empty array on error to prevent crash
      });
  }, []);

  // Suggests a deadline range based on today and project end
  const getSuggestedDeadline = () => {
    const today = new Date();
    
    // If no projectEndDate provided or invalid, default to 30 days from today
    if (!projectEndDate || projectEndDate === 'undefined' || projectEndDate === '') {
      const defaultEnd = new Date(today);
      defaultEnd.setDate(today.getDate() + 30);
      return defaultEnd.toISOString().split("T")[0];
    }
    
    const end = new Date(projectEndDate);
    
    // Check if end date is valid
    if (isNaN(end.getTime())) {
      const defaultEnd = new Date(today);
      defaultEnd.setDate(today.getDate() + 30);
      return defaultEnd.toISOString().split("T")[0];
    }
    
    // Calculate midpoint between today and project end
    const mid = new Date(today.getTime() + (end - today) / 2);
    return mid.toISOString().split("T")[0];
  };

  const handleSubtaskChange = (index, value) => {
    if (!task.subtasks || !Array.isArray(task.subtasks)) return;
    const updated = [...task.subtasks];
    updated[index] = value;
    setTask({ ...task, subtasks: updated });
  };

  const addSubtask = () => {
    const currentSubtasks = task.subtasks || [];
    setTask({ ...task, subtasks: [...currentSubtasks, ""] });
  };

  const handleSubmit = async () => {
    try {
      const res = await fetch(`${API_URL}/api/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(task),
      });

      const data = await res.json();

      if (res.ok) {
        console.log("Task Created in DB:", data);
        // Reset form
        setTask({
          title: "",
          assignee: "",
          startDate: "",
          endDate: "",
          priority: "Medium",
          description: "",
          subtasks: [""],
        });
        setIsExpanded(false);
      } else {
        console.error("Error creating task:", data.error || "Unknown error");
      }
    } catch (err) {
      console.error("Error saving task:", err);
    }
  };

  return (
    <div className="bg-[#242424] text-[#f8f7ec] hover:bg-[#202020] shadow-lg rounded-xl p-4 w-full max-w-3xl mx-auto mt-6 transition-all">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <input
          type="text"
          placeholder="Task title..."
          value={task.title}
          onChange={(e) => setTask({ ...task, title: e.target.value })}
          className="flex-grow border text-[#f8f7ec] border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring focus:ring-[#f8f7ec] focus:border-transparent"
        />

        <select
          value={task.assignee}
          onChange={(e) => setTask({ ...task, assignee: e.target.value })}
          className="border text-[#f8f7ec] bg-[#242424] hover:bg-[#202020] border-gray-300 rounded-lg px-4 py-2"
        >
          <option value="">Assign to</option>
          {users.length === 0 ? (
            <option disabled>Loading users...</option>
          ) : (
            users.map((user) => (
              user && user._id && user.username ? (
                <option key={user._id} value={user.username}>
                  @{user.username} ({user.role || 'user'})
                </option>
              ) : null
            ))
          )}
        </select>

        <select
          value={task.priority}
          onChange={(e) => setTask({ ...task, priority: e.target.value })}
          className="border text-[#f8f7ec] bg-[#242424] hover:bg-[#202020] border-gray-300 rounded-lg px-4 py-2"
        >
          <option>Low</option>
          <option>Medium</option>
          <option>High</option>
        </select>
      </div>

      <div className="flex text-[#f8f7ec] flex-col sm:flex-row gap-3 mt-3">
        <input
          type="date"
          value={task.startDate}
          onChange={(e) => setTask({ ...task, startDate: e.target.value })}
          className="border text-[#f8f7ec] border-gray-300 rounded-lg px-4 py-2"
        />
        <input
          type="date"
          value={task.endDate}
          onChange={(e) => setTask({ ...task, endDate: e.target.value })}
          className="border text-[#f8f7ec] border-gray-300 rounded-lg px-4 py-2"
        />
        <button
          className="text-sm text-[#f8f7ec] hover:underline"
          onClick={() => {
            const suggested = getSuggestedDeadline();
            setTask({ ...task, endDate: suggested });
          }}
        >
          Suggest Deadline
        </button>
      </div>

      {isExpanded && (
        <div className="mt-4 space-y-3">
          <textarea
            placeholder="Description..."
            value={task.description}
            onChange={(e) => setTask({ ...task, description: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-4 py-2"
          />

          <div className="space-y-2">
            <label className="font-semibold">Subtasks</label>
            {(task.subtasks || []).map((sub, index) => (
              <input
                key={index}
                type="text"
                value={sub || ''}
                onChange={(e) => handleSubtaskChange(index, e.target.value)}
                placeholder={`Subtask ${index + 1}`}
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
              />
            ))}
            <button
              type="button"
              className="text-sm text-white hover:underline"
              onClick={addSubtask}
            >
              + Add Subtask
            </button>
          </div>
        </div>
      )}

      <div className="flex items-center gap-4 mt-4">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-white hover:underline"
        >
          {isExpanded ? "Hide Advanced" : "Add More Details"}
        </button>
        <button
          onClick={handleSubmit}
          className="ml-auto bg-[#202020] text-white px-6 py-2 rounded-lg hover:bg-[#202020] transition"
        >
          Create Task
        </button>
      </div>
    </div>
  );
}
