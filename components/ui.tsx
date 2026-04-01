import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function buttonStyles(variant: "primary" | "secondary" | "ghost" | "danger" = "primary") {
  return cn(
    "inline-flex items-center justify-center rounded-2xl px-4 py-2.5 text-sm font-semibold transition active:scale-[0.99]",
    variant === "primary" && "bg-[#10253f] text-white shadow-[0_12px_30px_rgba(16,37,63,0.24)]",
    variant === "secondary" && "bg-white/70 text-[#10253f] ring-1 ring-white/60 backdrop-blur",
    variant === "ghost" && "bg-transparent text-[#10253f] ring-1 ring-[#10253f]/12",
    variant === "danger" && "bg-[#a93f3a] text-white shadow-[0_12px_30px_rgba(169,63,58,0.24)]",
  );
}

export function Card({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-[28px] border border-white/70 bg-white/80 p-5 shadow-[0_24px_60px_rgba(16,37,63,0.08)] backdrop-blur",
        className,
      )}
    >
      {children}
    </section>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="space-y-1">
        {eyebrow ? <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#4d6f8f]">{eyebrow}</p> : null}
        <h2 className="text-xl font-semibold tracking-[-0.03em] text-[#10253f]">{title}</h2>
        {description ? <p className="text-sm leading-6 text-[#56697f]">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function Pill({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full bg-[#eef4fb] px-3 py-1.5 text-xs font-medium text-[#26486b]",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-[24px] border border-dashed border-[#9fb3c8] bg-[#f5f8fb] p-5 text-center">
      <h3 className="text-base font-semibold text-[#10253f]">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-[#5d7188]">{description}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
