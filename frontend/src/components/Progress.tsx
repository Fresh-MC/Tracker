// Progress.tsx
import * as React from "react";
import { cn } from "./lib/utils"; // Adjust path if needed

// Define the props interface for the Progress component
interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
  max?: number;
  indicatorClassName?: string;
  indeterminate?: boolean;
  color?: "default" | "primary" | "secondary" | "success" | "warning" | "danger";
  size?: "sm" | "md" | "lg" | "xl" | "2xl";
  showValue?: boolean; // Controls the visibility of the percentage bubble
  label?: string;
  animationSpeed?: "slow" | "normal" | "fast";
}

/**
 * A highly customizable Progress bar component with a percentage indicator.
 * It uses Tailwind CSS for styling and is designed to be fully responsive.
 * Supports various colors, sizes, animation speeds, and an indeterminate state.
 *
 * @param {ProgressProps} props - The props for the Progress component.
 * @param {React.Ref<HTMLDivElement>} ref - The ref to the main div element.
 * @returns {JSX.Element} The Progress component.
 */
const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  (
    {
      className,
      value = 0,
      max = 100,
      indicatorClassName,
      indeterminate = false,
      color = "primary",
      size = "md",
      showValue = false, // Default to false, but can be set to true to show the bubble
      animationSpeed = "normal",
      label,
      ...props
    },
    ref
  ) => {
    // Calculate the percentage of the progress
    const percentage = value ? (value / max) * 100 : 0;
    // Ensure the percentage is within the valid range [0, 100]
    const clampedPercentage = Math.max(0, Math.min(100, percentage));

    // Define color variants for the progress indicator
    const colorVariants: Record<string, string> = {
      default: "bg-gray-400",
      primary: "bg-indigo-600", // Changed to indigo-600 as per the requested style
      secondary: "bg-purple-500",
      success: "bg-green-500",
      warning: "bg-yellow-500",
      danger: "bg-red-500",
    };

    // Define size variants for the progress bar height
    const sizeVariants: Record<string, string> = {
      sm: "h-2",
      md: "h-2.5", // Adjusted to match the requested height
      lg: "h-4",
      xl: "h-6",
      "2xl": "h-8",
    };

    // Define animation speed variants for the transition
    const animationVariants: Record<string, string> = {
      slow: "duration-1000",
      normal: "duration-700",
      fast: "duration-300",
    };

    return (
      <div
        ref={ref}
        className={cn(
          "relative w-full",
          { "pt-12": showValue && !indeterminate }, // Add top padding only if bubble is shown
          className
        )}
        {...props}
      >
        {/* Percentage indicator bubble - visible only if showValue is true and not indeterminate */}
        {showValue && !indeterminate && (
          <span
            className='absolute bottom-0 mb-4 -translate-x-1/2 w-12 h-10 bg-white shadow-[0px_12px_30px_0px_rgba(16,24,40,0.1)] rounded-full px-3.5 py-2 text-gray-800 text-xs font-medium flex justify-center items-center after:absolute after:bg-white after:flex after:bottom-[-5px] after:left-1/2 after:-z-10 after:h-3 after:w-3 after:-translate-x-1/2 after:rotate-45'
            style={{ left: `${clampedPercentage}%` }} // Position the bubble based on the progress value
          >
            {`${Math.round(clampedPercentage)}%`}
          </span>
        )}
        {label && (
  <div className="mb-1 text-sm font-medium text-white">{label}</div>
)}

        {/* Progress bar container */}
        <div
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={max}
          aria-valuenow={indeterminate ? undefined : value}
          className={cn(
            "relative flex w-full overflow-hidden rounded-3xl bg-gray-100", // Changed to rounded-3xl and bg-gray-100
            sizeVariants[size]
          )}
        >
          {/* Actual progress bar indicator */}
          <div
            className={cn(
              "h-full transition-all ease-out",
              animationVariants[animationSpeed],
              colorVariants[color], // Uses the color prop for the background
              indicatorClassName,
              {
                "animate-indeterminate": indeterminate, // Apply indeterminate animation if true
                "rounded-3xl": true, // Ensure the indicator also has rounded corners
              }
            )}
            style={{
              width: indeterminate ? "100%" : `${clampedPercentage}%`,
              transform: indeterminate ? "translateX(-100%)" : undefined,
              // Keyframe animation for indeterminate state (defined globally or in a CSS file)
              // This part assumes a global CSS animation named 'progress-indeterminate' is available
              animation: indeterminate ? "progress-indeterminate 1.5s infinite linear" : undefined,
            }}
          />
        </div>
      </div>
    );
  }
);

Progress.displayName = "Progress";

export { Progress };
