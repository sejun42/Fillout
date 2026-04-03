"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, CalendarDays, Dumbbell, LibraryBig, Settings2 } from "lucide-react";

import { useWorkoutApp } from "@/components/providers/workout-app-provider";
import { cn } from "@/lib/utils";

const navigation = [
  { href: "/", label: "홈", icon: CalendarDays },
  { href: "/stats", label: "통계", icon: BarChart3 },
  { href: "/library", label: "라이브러리", icon: LibraryBig },
  { href: "/settings", label: "설정", icon: Settings2 },
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { state, supabaseConfigured } = useWorkoutApp();

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_#ffe7cf_0,_#f7f3ea_38%,_#eaf3fb_100%)]">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 pb-28 pt-5 sm:px-6 lg:px-8">
        <header className="mb-5 flex items-start justify-between gap-4 rounded-[28px] border border-white/70 bg-[#10253f] px-5 py-4 text-white shadow-[0_24px_60px_rgba(16,37,63,0.18)]">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/70">Fillout</p>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold tracking-[-0.04em]">Gym Memory Board</h1>
              <Dumbbell className="h-5 w-5 text-[#ffb36b]" />
            </div>
            <p className="text-sm text-white/72">
              머신 브랜드, 세팅값, 지난 기록 비교까지 한 번에 관리합니다.
            </p>
          </div>
          <div className="space-y-2 text-right">
            <p className="text-sm font-medium">
              {state.profile ? `${state.profile.nickname ?? state.profile.email}` : "로그인 필요"}
            </p>
            <p className="text-xs text-white/70">
              {supabaseConfigured ? "Supabase ready" : "Demo data mode"}
            </p>
          </div>
        </header>

        {!state.profile ? (
          <Link
            href="/login"
            className="mb-5 rounded-[24px] border border-[#ffd6b0] bg-[#fff4e8] px-4 py-3 text-sm font-medium text-[#9a4f1b]"
          >
            로그인 세션이 없습니다. 이메일 로그인 또는 데모 진입을 위해 이동
          </Link>
        ) : null}

        <main className="flex-1">{children}</main>
      </div>

      <nav className="fixed inset-x-0 bottom-4 z-20 mx-auto flex w-[min(92vw,440px)] items-center justify-between rounded-[28px] border border-white/60 bg-white/78 px-3 py-2 shadow-[0_18px_48px_rgba(16,37,63,0.18)] backdrop-blur">
        {navigation.map((item) => {
          const isActive =
            item.href === "/" ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex min-w-16 flex-col items-center gap-1 rounded-[20px] px-3 py-2 text-xs font-medium transition",
                isActive ? "bg-[#10253f] shadow-[0_12px_28px_rgba(16,37,63,0.2)]" : "text-[#6b7d90]",
              )}
            >
              <Icon className={cn("h-4 w-4", isActive ? "text-white" : "text-[#10253f]")} />
              <span className={cn("leading-none", isActive ? "text-white" : "text-[#10253f]")}>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
