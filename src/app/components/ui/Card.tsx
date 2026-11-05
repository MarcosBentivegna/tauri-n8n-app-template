import type { HTMLAttributes } from "react";
import { cn } from "../../lib/cn";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-white/[0.06] bg-white/[0.025] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.03)]",
        className,
      )}
      {...props}
    />
  );
}
