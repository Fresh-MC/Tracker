// vite-project/src/pages/Dashboard.jsx
import React from "react";
import Navbar from "../components/Navbar";
import DashboardCards from "../components/DashboardCards";


import { GridBackground } from "../components/lightswind/grid-dot-background";

export default function App() {
  return (
    <GridBackground
      gridSize={24}
      gridColor="#e4e4e7"
      darkGridColor="#262626"
      showFade={true}
      fadeIntensity={30}
      className="min-h-screen px-6 py-12"
    >
      <div className="max-w-6xl mx-auto text-center space-y-8 z-20 relative">
        
       

        <DashboardCards />
      </div>
    </GridBackground>
  );
}
