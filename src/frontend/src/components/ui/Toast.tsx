import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

type ToastType = "success" | "error" | "info" | "warning";

export interface ToastData {
  id: string;
  message: string;
  type?: ToastType;
  duration?: number;
}

const typeStyles: Record<ToastType, string> = {
  success: "border-primary text-primary shadow-neon-sm",
  error:
    "border-destructive text-destructive shadow-[0_0_8px_oklch(var(--destructive))]",
  info: "border-secondary text-secondary shadow-[0_0_8px_oklch(var(--secondary))]",
  warning: "border-accent text-accent shadow-[0_0_8px_oklch(var(--accent))]",
};

interface ToastItemProps {
  toast: ToastData;
  onDismiss: (id: string) => void;
}

function ToastItem({ toast, onDismiss }: ToastItemProps) {
  const [visible, setVisible] = useState(false);
  const duration = toast.duration ?? 4000;

  useEffect(() => {
    const showTimer = setTimeout(() => setVisible(true), 50);
    const hideTimer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onDismiss(toast.id), 300);
    }, duration);
    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, [toast.id, duration, onDismiss]);

  return (
    <div
      data-ocid="toast"
      className={cn(
        "bg-card border-4 rounded-none px-4 py-3 font-display text-[8px] min-w-[280px] max-w-[400px]",
        "transition-all duration-300",
        typeStyles[toast.type ?? "info"],
        visible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0",
      )}
    >
      {toast.message}
    </div>
  );
}

let globalToastHandler: ((toast: ToastData) => void) | null = null;

export function toast(
  message: string,
  type: ToastType = "info",
  duration?: number,
) {
  if (globalToastHandler) {
    globalToastHandler({
      id: `${Date.now()}-${Math.random()}`,
      message,
      type,
      duration,
    });
  }
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  useEffect(() => {
    globalToastHandler = (t: ToastData) => setToasts((prev) => [...prev, t]);
    return () => {
      globalToastHandler = null;
    };
  }, []);

  const dismiss = (id: string) =>
    setToasts((prev) => prev.filter((t) => t.id !== id));

  return (
    <div
      className="fixed bottom-20 right-4 z-[200] flex flex-col gap-2 items-end"
      aria-live="polite"
      data-ocid="toast.container"
    >
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
      ))}
    </div>
  );
}
