import { cn } from "@/lib/utils";
import { type ReactNode, useEffect } from "react";
import { PixelButton } from "./PixelButton";

interface PixelModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  variant?: "default" | "primary" | "secondary" | "accent";
  className?: string;
}

const variantBorder: Record<string, string> = {
  default: "border-border",
  primary: "border-primary shadow-neon-md",
  secondary: "border-secondary shadow-[0_0_16px_oklch(var(--secondary))]",
  accent: "border-accent shadow-[0_0_16px_oklch(var(--accent))]",
};

export function PixelModal({
  isOpen,
  onClose,
  title,
  children,
  variant = "primary",
  className,
}: PixelModalProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handler);
      return () => window.removeEventListener("keydown", handler);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <dialog
      open
      className="fixed inset-0 z-50 flex items-center justify-center bg-transparent p-0 m-0 max-w-none max-h-none w-full h-full"
      data-ocid="modal.dialog"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
        onKeyUp={(e) => e.key === "Escape" && onClose()}
        role="presentation"
      />
      {/* Modal */}
      <div
        className={cn(
          "relative z-10 bg-card border-4 rounded-none min-w-[320px] max-w-[90vw] scanline",
          variantBorder[variant],
          className,
        )}
      >
        {title && (
          <div className="flex items-center justify-between border-b-4 border-current px-4 py-3">
            <h2 className="font-display text-[10px] text-primary tracking-widest">
              {title}
            </h2>
            <PixelButton
              variant="ghost"
              size="sm"
              onClick={onClose}
              aria-label="Close modal"
              data-ocid="modal.close_button"
            >
              [X]
            </PixelButton>
          </div>
        )}
        <div className="p-4">{children}</div>
      </div>
    </dialog>
  );
}
