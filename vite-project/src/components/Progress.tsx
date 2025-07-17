import * as React from "react";
import { cn } from "./lib/utils"; // Adjust path if needed

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
  max?: number;
  indicatorClassName?: string;
  indeterminate?: boolean;
  color?: "default" | "primary" | "secondary" | "success" | "warning" | "danger";
  size?: "sm" | "md" | "lg";
  showValue?: boolean;
  animationSpeed?: "slow" | "normal" | "fast";
}

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
      showValue = false,
      animationSpeed = "normal",
      ...props
    },
    ref
  ) => {
    const percentage = value ? (value / max) * 100 : 0;

    const colorVariants: Record<string, string> = {
      default: "bg-gray-400",
      primary: "bg-blue-500",
      secondary: "bg-purple-500",
      success: "bg-green-500",
      warning: "bg-yellow-500",
      danger: "bg-red-500",
    };

    const sizeVariants: Record<string, string> = {
      sm: "h-2",
      md: "h-4",
      lg: "h-6",
    };

    const animationVariants: Record<string, string> = {
      slow: "duration-1000",
      normal: "duration-700",
      fast: "duration-300",
    };

    return (
      <div
        ref={ref}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={indeterminate ? undefined : value}
        className={cn(
          "relative w-full overflow-hidden rounded-full bg-gray-200",
          sizeVariants[size],
          className
        )}
        {...props}
      >
        <div
          className={cn(
            "h-full transition-all ease-out",
            animationVariants[animationSpeed],
            colorVariants[color],
            indicatorClassName
          )}
          style={{
            width: indeterminate ? "100%" : `${percentage}%`,
            transform: indeterminate ? "translateX(-100%)" : undefined,
            animation: indeterminate ? "progress-indeterminate 1.5s infinite linear" : undefined,
          }}
        />
        {showValue && !indeterminate && (
          <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white">
            {Math.round(percentage)}%
          </div>
        )}
      </div>
    );
  }
);

Progress.displayName = "Progress";

export { Progress };
