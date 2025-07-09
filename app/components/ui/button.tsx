"use client"
import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline";
  size?: "sm" | "md";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "md", ...props }, ref) => {
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
      setMounted(true);
    }, []);

    if (!mounted) {
      return (
        <button
          className={cn(
            "inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none",
            variant === "default" && "bg-pink-500 text-white hover:bg-pink-400",
            variant === "outline" && "bg-transparent border border-neutral-700 text-white hover:bg-neutral-800",
            size === "sm" && "text-sm px-3 py-1 h-8",
            size === "md" && "text-base px-4 py-2 h-10",
            className
          )}
          disabled
        />
      );
    }

    return (
      <button
        className={cn(
          "inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none",
          variant === "default" && "bg-pink-500 text-white hover:bg-pink-400",
          variant === "outline" && "bg-transparent border border-neutral-700 text-white hover:bg-neutral-800",
          size === "sm" && "text-sm px-3 py-1 h-8",
          size === "md" && "text-base px-4 py-2 h-10",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button"; 