import { cn } from "@/lib/utils";
import { type InputHTMLAttributes, forwardRef } from "react";

interface PixelInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const PixelInput = forwardRef<HTMLInputElement, PixelInputProps>(
  ({ label, error, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label
            htmlFor={inputId}
            className="font-display text-[8px] text-muted-foreground tracking-widest"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            "font-display text-[9px] bg-background text-foreground",
            "border-4 border-input rounded-none px-3 py-2",
            "focus:border-primary focus:outline-none focus:shadow-neon-sm",
            "placeholder:text-muted-foreground caret-primary",
            "transition-all duration-100",
            error &&
              "border-destructive focus:border-destructive focus:shadow-[0_0_8px_oklch(var(--destructive))]",
            className,
          )}
          {...props}
        />
        {error && (
          <span className="font-display text-[7px] text-destructive">
            {error}
          </span>
        )}
      </div>
    );
  },
);

PixelInput.displayName = "PixelInput";
