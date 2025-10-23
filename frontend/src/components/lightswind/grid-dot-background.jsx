"use client";

import React, { useEffect, useState } from "react";
import { cn } from "../lib/utils";

export const GridBackground = ({
  className,
  children,
  gridSize = 24,
  gridColor = "#f8f7ec",
  darkGridColor = "#262626",
  showFade = true,
  fadeIntensity = 20,
  ...props
}) => {
  const [currentGridColor, setCurrentGridColor] = useState(gridColor);

  useEffect(() => {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const isDark = document.documentElement.classList.contains("dark") || prefersDark;
    let colorToUse = isDark ? darkGridColor : gridColor;
    setCurrentGridColor(colorToUse);

    const observer = new MutationObserver((mutations) => {
      for (let mutation of mutations) {
        if (mutation.attributeName === "class") {
          const updatedIsDark = document.documentElement.classList.contains("dark");
          setCurrentGridColor(updatedIsDark ? darkGridColor : gridColor);
          break;
        }
      }
    });

    observer.observe(document.documentElement, { attributes: true });
    return () => observer.disconnect();
  }, []);

  return (
    <div
      className={cn(
        "relative flex min-h-screen w-full items-center justify-center",
        className
      )}
      style={{ backgroundColor: "#181818" }} // 🔥 Set static dark background
      {...props}
    >
      {/* Grid pattern */}
      <div
        className="absolute inset-0 will-change-transform"
        style={{
          backgroundSize: `${gridSize}px ${gridSize}px`,
          backgroundImage: `
            linear-gradient(to right, ${currentGridColor} 1px, transparent 1px),
            linear-gradient(to bottom, ${currentGridColor} 1px, transparent 1px)
          `,
        }}
      />

      {/* Fade effect */}
      {showFade && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(ellipse at center, rgba(24,24,24,0) ${fadeIntensity}%, #181818 100%)`,
            mixBlendMode: "normal", // adjust if needed
          }}
        />
      )}

      {/* Actual content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
};
