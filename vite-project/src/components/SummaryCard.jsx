import React from "react";

export default function SummaryCard({ title, value, color }) {
  return (
    <div className={`bg-white dark:bg-gray-900 p-6 rounded-xl shadow-md`}>
      <h3 className="text-lg font-semibold text-gray-700 dark:text-white mb-2">{title}</h3>
      <p className={`text-3xl font-bold text-${color}-500`}>{value}</p>
    </div>
  );
}
