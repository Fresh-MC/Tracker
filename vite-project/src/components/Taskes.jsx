import { useState } from "react";

export default function Taskes({ projectEndDate }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [task, setTask] = useState({
    title: "",
    assignee: "",
    startDate: "",
    endDate: "",
    priority: "Medium",
    description: "",
    subtasks: [""],
  });

  // Suggests a deadline range based on today and project end
  const getSuggestedDeadline = () => {
    const today = new Date();
    const end = new Date(projectEndDate);
    const mid = new Date(today.getTime() + (end - today) / 2);
    return mid.toISOString().split("T")[0]; // YYYY-MM-DD
  };

  const handleSubtaskChange = (index, value) => {
    const updated = [...task.subtasks];
    updated[index] = value;
    setTask({ ...task, subtasks: updated });
  };

  const addSubtask = () => {
    setTask({ ...task, subtasks: [...task.subtasks, ""] });
  };

  const handleSubmit = () => {
    console.log("Task Created:", task);
    // Reset state or pass to parent
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
          <option value="Fresh">@Fresh</option>
          <option value="Friend1">@Friend1</option>
          <option value="Friend2">@Friend2</option>
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
            {task.subtasks.map((sub, index) => (
              <input
                key={index}
                type="text"
                value={sub}
                onChange={(e) => handleSubtaskChange(index, e.target.value)}
                placeholder={`Subtask ${index + 1}`}
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
              />
            ))}
            <button
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
