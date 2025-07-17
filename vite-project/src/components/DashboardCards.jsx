import React, { useEffect } from "react";

import SummaryCard from "./SummaryCard";
import Navbar from "./Navbar";
import { Progress } from "./Progress";
import GlowingCards, { GlowingCard } from "./lightswind/glowing-cards";

const cardData = [
  { title: "Tasks Today", value: 12, color: "blue" },
  { title: "Completed", value: 34, color: "green" },
  { title: "Overdue", value: 5, color: "red" },
  { title: "Pending", value: 3, color: "yellow" },
];

export default function DashboardCards() {
  useEffect(() => {
    fetch("http://localhost:3001/api/progress")
      .then((res) => res.json())
      .then((data) => {
        const percentage = (data.completed / data.total) * 100;
        setProgress(percentage);
      })
      .catch((err) => {
        console.error("Failed to fetch progress:", err);
      });
  }, []);
  const [progress, setProgress] = React.useState(45); // simulate progress (replace with actual state later)
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="p-6 flex-1">
        <div className="bg-[#242424] w-full px-4 py-12 flex flex-col items-center justify-center rounded-[66px]">
          {/* Name with extended underline */}
          <div className="relative group">
            <h1 className="text-[10vw] sm:text-[64px] font-happy text-[#f8f7ec] tracking-[0.3em] text-center px-8 drop-shadow-[0_0_20px_rgba(255,255,255,0.4)]">
              SACHIN
            </h1>
            {/* Custom underline with extension */}
            <div className="absolute left-1/2 top-full mt-2 h-[2px] bg-[#f8f7ec] w-[150%] -translate-x-1/2 transition-all duration-300 group-hover:w-[0%] group-hover:opacity-0" />
          </div>

          {/* Subtitle */}
          <h2 className="text-2xl font-semibold text-[#f8f7ec] mt-4 -mb-1 text-center relative -top 2">
            Developer
          </h2>
        </div>
        {/* 🟩 Progress Bar */}
        <div className="p-6 max-w-md mx-auto">
          <h2 className="text-xl font-bold mb-4">Progress Test</h2>
          <Progress value={65} color="success" size="md" showValue />
          <Progress value={100} color="primary" size="lg" animationSpeed="fast" />
        </div>

        {/* First GlowingCards example (you have two, consider combining if they're meant to be one set) */}
        <GlowingCards>
          <GlowingCard glowColor="#ff0000" className="bg-[#242424] text-white border-transparent"> {/* <--- ADD THIS LINE */}
            <h2>Card Title 1</h2>
            <p>Some content for card 1.</p>
          </GlowingCard>
        </GlowingCards>

        {/* Second GlowingCards example */}
        <GlowingCards
          customTheme={{
            cardBg: "#242424", // This will affect the glow overlay if you've modified glowing-cards.js
            cardBorder: "#38bdf8",
            textColor: "#e2e8f0", // This will affect the text color within the glowing overlay if used
            hoverBg: "#f0f0f0",
          }}
        >
          {/* <--- ADD THIS LINE to the GlowingCard inside this container too */}
          <GlowingCard className="bg-[#242424] text-white border-transparent">
            Card 1
          </GlowingCard>
        </GlowingCards>

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