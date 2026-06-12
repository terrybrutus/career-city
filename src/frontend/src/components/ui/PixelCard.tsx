import { cn } from "@/lib/utils";
import { type HTMLAttributes, forwardRef } from "react";

type PixelCardVariant =
  | "default"
  | "primary"
  | "secondary"
  | "accent"
  | "muted";

interface PixelCardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: PixelCardVariant;
  scanlines?: boolean;
  glowing?: boolean;
}

const variantStyles: Record<PixelCardVariant, string> = {
  default: "bg-card border-border",
  primary: "bg-card border-primary",
  secondary: "bg-card border-secondary",
  accent: "bg-card border-accent",
  muted: "bg-muted border-border",
};

const glowStyles: Record<PixelCardVariant, string> = {
  default: "shadow-neon-sm",
  primary: "shadow-neon-md",
  secondary:
    "shadow-[0_0_16px_oklch(var(--secondary)),0_0_24px_oklch(var(--secondary)/0.5)]",
  accent:
    "shadow-[0_0_16px_oklch(var(--accent)),0_0_24px_oklch(var(--accent)/0.5)]",
  muted: "",
};

export const PixelCard = forwardRef<HTMLDivElement, PixelCardProps>(
  (
    {
      variant = "default",
      scanlines = false,
      glowing = false,
      className,
      children,
      ...props
    },
    ref,
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          "border-4 rounded-none p-4 relative",
          variantStyles[variant],
          glowing && glowStyles[variant],
          scanlines && "scanline",
          className,
        )}
        {...props}
      >
        {children}
      </div>
    );
  },
);

PixelCard.displayName = "PixelCard";
