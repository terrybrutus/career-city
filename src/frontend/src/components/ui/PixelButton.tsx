import { cn } from "@/lib/utils";
import { type ButtonHTMLAttributes, forwardRef } from "react";

type PixelButtonVariant =
  | "primary"
  | "secondary"
  | "accent"
  | "danger"
  | "ghost";
type PixelButtonSize = "sm" | "md" | "lg";

interface PixelButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: PixelButtonVariant;
  size?: PixelButtonSize;
  glowing?: boolean;
}

const variantStyles: Record<PixelButtonVariant, string> = {
  primary:
    "bg-primary text-primary-foreground border-primary hover:shadow-neon-md hover:shadow-primary",
  secondary:
    "bg-secondary text-secondary-foreground border-secondary hover:shadow-[0_0_16px_oklch(var(--secondary)),0_0_24px_oklch(var(--secondary)/0.5)]",
  accent:
    "bg-accent text-accent-foreground border-accent hover:shadow-[0_0_16px_oklch(var(--accent)),0_0_24px_oklch(var(--accent)/0.5)]",
  danger:
    "bg-destructive text-destructive-foreground border-destructive hover:shadow-[0_0_16px_oklch(var(--destructive)),0_0_24px_oklch(var(--destructive)/0.5)]",
  ghost:
    "bg-transparent text-foreground border-border hover:border-primary hover:text-primary hover:shadow-neon-sm",
};

const sizeStyles: Record<PixelButtonSize, string> = {
  sm: "px-3 py-1.5 text-[8px]",
  md: "px-4 py-2 text-[10px]",
  lg: "px-6 py-3 text-[12px]",
};

export const PixelButton = forwardRef<HTMLButtonElement, PixelButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      glowing = false,
      className,
      children,
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        className={cn(
          "font-display border-4 rounded-none cursor-pointer transition-all duration-100",
          "active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          "disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none",
          glowing && "animate-pulse-glow",
          variantStyles[variant],
          sizeStyles[size],
          className,
        )}
        {...props}
      >
        {children}
      </button>
    );
  },
);

PixelButton.displayName = "PixelButton";
