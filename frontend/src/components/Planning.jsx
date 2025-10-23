import { useMemo } from "react";

export default function Planning({ tasks }) {
  const nudges = useMemo(() => {
    const nudgeList = [];

    // 1. Unassigned Task Warning
    const unassigned = tasks.filter((task) => !task.assignee);
    if (unassigned.length > 2) {
      nudgeList.push("🧭 Who’s taking this up? Unassigned tasks often slip.");
    }

    // 2. High-priority Overload Check
    const dateMap = {}; // { person: { date: count } }
    tasks.forEach((task) => {
      if (task.assignee && task.priority === "High" && task.endDate) {
        const date = task.endDate;
        if (!dateMap[task.assignee]) dateMap[task.assignee] = {};
        dateMap[task.assignee][date] = (dateMap[task.assignee][date] || 0) + 1;
      }
    });

    Object.entries(dateMap).forEach(([person, dates]) => {
      Object.entries(dates).forEach(([date, count]) => {
        if (count >= 3) {
          nudgeList.push(`⚠️ ${person} has ${count} high-priority deadlines on ${date}. Reallocate?`);
        }
      });
    });

    // 3. Motivational Tip (Always one)
    const motivationalTips = [
      "🌱 Start small. Even 30-minute tasks move projects forward.",
      "🚀 Done is better than perfect.",
      "🔁 Progress comes from showing up every day.",
      "📦 Break big tasks into tiny wins.",
    ];
    const randomTip = motivationalTips[Math.floor(Math.random() * motivationalTips.length)];
    nudgeList.push(randomTip);

    return nudgeList;
  }, [tasks]);

  return (
    <div className="mt-6 p-4 bg-[#202020] border border-none rounded-xl shadow-sm space-y-2">
      <h3 className="font-semibold text-[white]">Planning Nudges</h3>
      <ul className="list-disc list-inside text-sm text-[#f8f7ec] space-y-1">
        {nudges.map((nudge, index) => (
          <li key={index}>{nudge}</li>
        ))}
      </ul>
    </div>
  );
}
