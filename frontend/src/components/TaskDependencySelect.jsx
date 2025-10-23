import { useEffect, useState } from "react";

export default function TaskDependencySelect({ task, allTasks, onUpdate }) {
  const [selectedDepId, setSelectedDepId] = useState(task.dependsOn || "");
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    // Check timing conflict if dependency exists
    if (!selectedDepId) return;

    const depTask = allTasks.find((t) => t.id === selectedDepId);
    if (depTask && task.startDate && depTask.endDate) {
      const start = new Date(task.startDate);
      const depEnd = new Date(depTask.endDate);
      setShowWarning(start < depEnd);
    }
  }, [selectedDepId, task, allTasks]);

  const handleChange = (e) => {
    const depId = e.target.value;
    setSelectedDepId(depId);
    onUpdate(task.id, depId); // Notify parent
  };

  return (
    <div className="mt-2 text-[#f8f7ec] bg-[#242424] hover:bg-[#202020]">
      <label className="block text-sm text-[#f8f7ec] mb-1">Depends on:</label>
      <select
        value={selectedDepId}
        onChange={handleChange}
        className="border text-[#f8f7ec] bg-[#242424] hover:bg-[#202020] border-gray-300 rounded px-3 py-2 w-full"
      >
        <option value="">None</option>
        {allTasks
          .filter((t) => t.id !== task.id)
          .map((t) => (
            <option key={t.id} value={t.id}>
              {t.title}
            </option>
          ))}
      </select>

      {showWarning && (
        <div className="mt-1 text-sm text-red-500">
          ⚠️ Start date is before “{allTasks.find(t => t.id === selectedDepId)?.title}” ends!
        </div>
      )}
    </div>
  );
}
