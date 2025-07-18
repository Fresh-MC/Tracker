import React, { useEffect, useState } from "react";
import { Progress } from "./Progress";
import ZoomCards from "./HoverCard.tsx";
import Navbar from "./Navbar";
import SpeedDial from "./SpeedDial";
import Drawer from "./Drawer";
import Footer from "./Footer";

export default function DashboardCards() {
  const [isHovered, setIsHovered] = useState(false);
  const [setProgress] = useState(45);

  const progressYou = 78;
  const progressTeam = 65;
  const progressExpected = 80;
  const avg = Math.round((progressYou + progressTeam + progressExpected) / 3);

  useEffect(() => {
    fetch("http://localhost:3000/api/progress")
      .then((res) => res.json())
      .then((data) => {
        const percentage = (data.completed / data.total) * 100;
        setProgress(percentage);
      })
      .catch((err) => {
        console.error("Failed to fetch progress:", err);
      });
  }, []);

  return (
    <div className="flex items-start gap-4 p-4">
      {/* SpeedDial on the left */}
      <SpeedDial />

      {/* Navbar and main content */}
      <div className="w-full">
        <Navbar />
        <div className="mt-6" />

        <div className="bg-[#181818] dark:bg-[#181818] rounded-3xl opacity-0.1">
          <div className="min-h-screen w-full flex items-center justify-center px-4">
            <div className="w-full max-w-6xl mx-auto flex flex-col items-center space-y-12">
              {/* Name Card */}
              <div
                className="w-full py-20 px-6 sm:px-16 rounded-[48px] bg-white/5 
                border-none 
                shadow-[inset_0_1px_4px_rgba(255,255,255,0.1),0_8px_32px_rgba(0,0,0,0.35)]
                hover:scale-[1.01] hover:shadow-[0_0_30px_rgba(255,255,255,0.1)]
                transition-all duration-300 ease-out relative z-10"
              >
                <div className="relative group text-center">
                  <h1 className="text-[14vw] sm:text-[172px] font-extrabold text-[#f8f7ec] tracking-[0.40em] drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]">
                    SACHIN
                  </h1>
                  <div className="absolute left-1/2 top-full mt-2 h-[2px] bg-white w-[150%] -translate-x-1/2 opacity-50 group-hover:w-0 group-hover:opacity-0 transition-all duration-300" />
                </div>
                <h2 className="text-3xl sm:text-7xl font-semibold text-[#f8f7ec] mt-6 text-center drop-shadow-sm">
                  Developer
                </h2>
              </div>

              {/* Divider */}
              <div className="flex w-full items-center rounded-full my-6">
                <div className="flex-1 border-b border-[#f8f7ec]"></div>
                <span className="text-[#f8f7ec] dark:text-[#f8f7ec] text-lg font-semibold leading-8 px-8 py-3">
                  Today
                </span>
                <div className="flex-1 border-b border-[#f8f7ec]"></div>
              </div>

              {/* Hover Progress Section */}
              <div
                className="group p-6 w-full max-w-6xl space-y-6 bg-[#181818] rounded-3xl border-none shadow-lg transition-all duration-300 hover:bg-white/10 hover:shadow-xl"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
              >
                <div className="w-full flex justify-start items-start">
                  <div className="space-y-2">
                    <h1 className="text-2xl font-semibold text-white">Progress</h1>
                  </div>
                </div>

                {/* Collapsed view */}
                <div
                  className={`transition-all duration-300 overflow-hidden ${
                    isHovered ? "max-h-0 opacity-0" : "max-h-40 opacity-100"
                  }`}
                >
                  <Progress
                    value={avg}
                    size="2xl"
                    showValue
                    className="w-full rounded-[5px] overflow-hidden"
                    indicatorClassName="bg-[#2e4f4f] transition-all duration-500"
                  />
                </div>

                {/* Expanded view */}
                <div
                  className={`transition-all duration-500 space-y-4 overflow-hidden ${
                    isHovered ? "max-h-[300px] opacity-100" : "max-h-0 opacity-0"
                  }`}
                >
                  <Progress
                    label="You"
                    value={progressYou}
                    size="lg"
                    showValue
                    className="w-full rounded-[5px] overflow-hidden"
                    indicatorClassName="bg-[#c05a43] transition-all duration-500"
                  />
                  <Progress
                    label="Team"
                    value={progressTeam}
                    size="lg"
                    showValue
                    className="w-full rounded-[5px] overflow-hidden"
                    indicatorClassName="bg-[#2e4f4f] transition-all duration-500 delay-100"
                  />
                  <Progress
                    label="Expected"
                    value={progressExpected}
                    size="lg"
                    showValue
                    className="w-full rounded-[5px] overflow-hidden"
                    indicatorClassName="bg-[#31493c] transition-all duration-500 delay-200"
                  />
                </div>
              </div>

              {/* Cards Section */}
              <section className="flex items-center justify-center min-h-[450px]">
                <ZoomCards />
                <ZoomCards />
              </section>
            </div>
          </div>
        </div>
        <div className="flex w-full items-center rounded-full my-6">
                <div className="flex-1 border-b border-[#f8f7ec]"></div>
                
                <div className="flex-1 border-b border-[#f8f7ec]"></div>
              </div>

        {/* ✅ Footer goes here */}
        <Footer />
      </div>
    </div>
  );
}
