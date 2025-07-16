import React from "react";
import SummaryCard from "./SummaryCard";
import Navbar from "./Navbar";

const cardData = [
  { title: "Tasks Today", value: 12, color: "blue" },
  { title: "Completed", value: 34, color: "green" },
  { title: "Overdue", value: 5, color: "red" },
  { title: "Pending", value: 3, color: "yellow" },
];

export default function DashboardCards() {
  return (
    <div>
      <Navbar />
      <div className="p-6">
        <h1 className="text-2xl font-bold text-blue-600 mb-6">Dashboard</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {cardData.map((card) => (
            <SummaryCard
              key={card.title}
              title={card.title}
              value={card.value}
              color={card.color}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
