"use client";

import Link from "next/link";
import { addMonths, format, isSameMonth, parseISO } from "date-fns";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { useState } from "react";

import { InstallPrompt } from "@/components/install-prompt";
import { useWorkoutApp } from "@/components/providers/workout-app-provider";
import { Card, Pill, SectionHeading, buttonStyles } from "@/components/ui";
import { buildCalendarDays, formatMonthLabel } from "@/lib/date";
import { getRecommendationBanners, getSessionComparison, getSessionDotsForDate, getWeeklyStats } from "@/lib/stats";
import { getBodyPartName, summarizeSessionTitle } from "@/lib/workout";

export function HomeDashboard() {
  const { state } = useWorkoutApp();
  const [month, setMonth] = useState(() => new Date());
  const days = buildCalendarDays(month);
  const recommendations = getRecommendationBanners(state);
  const weekly = getWeeklyStats(state);
  const comparison = getSessionComparison(state);
  const monthSessions = state.sessions.filter((session) => isSameMonth(parseISO(session.sessionDate), month));
  const bodyPartMap = new Map(state.bodyParts.map((bodyPart) => [bodyPart.id, bodyPart]));

  return (
    <div className="space-y-4">
      <InstallPrompt />

      {recommendations.length > 0 ? (
        <section className="space-y-2">
          {recommendations.map((banner) => (
            <Card
              key={banner.id}
              className={banner.tone === "warning" ? "p-0 bg-[#fff1ec]" : "p-0 bg-[#eef7ff]"}
            >
              <div className="flex items-center gap-2 px-3 py-2.5">
                <div className="rounded-full bg-white/80 p-1.5 text-[#10253f]">
                  <Sparkles className="h-3.5 w-3.5" />
                </div>
                <p className="min-w-0 flex-1 truncate text-sm font-medium leading-5 text-[#10253f]" title={banner.title}>
                  {banner.title}
                </p>
              </div>
            </Card>
          ))}
        </section>
      ) : null}

      <section className="grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
        <Card className="space-y-4 p-4 sm:p-5">
          <SectionHeading
            eyebrow="Calendar"
            title="월간 운동 흐름"
            description="날짜를 눌러 바로 수정하거나 새 세션을 시작합니다."
            action={
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setMonth((current) => addMonths(current, -1))} className={buttonStyles("ghost")}>
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button type="button" onClick={() => setMonth((current) => addMonths(current, 1))} className={buttonStyles("ghost")}>
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            }
          />

          <div className="flex flex-wrap items-center gap-2">
            <p className="mr-2 text-sm font-semibold text-[#10253f] sm:text-base">{formatMonthLabel(month)}</p>
            {state.bodyParts.map((bodyPart) => (
              <Pill key={bodyPart.id} className="gap-1 bg-white px-2 py-1 text-[11px] sm:text-xs">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: bodyPart.color }} />
                {bodyPart.name}
              </Pill>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1.5 text-center text-[10px] font-semibold uppercase tracking-[0.16em] text-[#7d8ea1] sm:gap-2 sm:text-xs">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((label) => (
              <span key={label}>{label}</span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
            {days.map((day) => {
              const dots = getSessionDotsForDate(state.sessions, day.iso);
              const remaining = dots.length > 3 ? dots.length - 3 : 0;
              const session = state.sessions.find((item) => item.sessionDate === day.iso) ?? null;

              return (
                <Link
                  key={day.iso}
                  href={`/session/${day.iso}`}
                  className={`flex min-h-[72px] flex-col rounded-[18px] border px-2 py-2 text-left transition sm:min-h-[80px] sm:px-2.5 ${
                    day.isCurrentMonth
                      ? "border-white/60 bg-white/90 hover:-translate-y-0.5"
                      : "border-transparent bg-white/35 text-[#8ea1b3]"
                  } ${day.isToday ? "ring-2 ring-[#ffb36b]" : ""}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">{day.dayNumber}</span>
                    {session ? <span className="text-[9px] text-[#6580a0]">edit</span> : null}
                  </div>
                  <div className="mt-auto flex items-center gap-1">
                    {dots.slice(0, 3).map((bodyPartId) => (
                      <span
                        key={`${day.iso}:${bodyPartId}`}
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: bodyPartMap.get(bodyPartId)?.color ?? "#c6d0db" }}
                      />
                    ))}
                    {remaining > 0 ? <span className="text-[10px] font-semibold text-[#6a7d92]">+{remaining}</span> : null}
                  </div>
                </Link>
              );
            })}
            </div>
          </Card>

        <div className="space-y-4">
          <Card>
            <SectionHeading eyebrow="This month" title={`${monthSessions.length}일 운동`} description="이번 달 캘린더에 기록된 세션 수" />
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-[22px] bg-[#eef4fb] p-4">
                <p className="text-xs font-medium text-[#5a7592]">최근 세션</p>
                <p className="mt-2 text-2xl font-semibold text-[#10253f]">
                  {comparison.currentSession ? summarizeSessionTitle(comparison.currentSession, state.bodyParts) : "-"}
                </p>
              </div>
              <div className="rounded-[22px] bg-[#fff4e8] p-4">
                <p className="text-xs font-medium text-[#9a6b1b]">볼륨 변화</p>
                <p className="mt-2 text-2xl font-semibold text-[#8b4a18]">
                  {comparison.volumeChange >= 0 ? "+" : ""}
                  {comparison.volumeChange.toFixed(0)}
                </p>
              </div>
            </div>
          </Card>

          <Card>
            <SectionHeading eyebrow="Weekly" title="이번 주 요약" description="운동 중 바로 확인할 수 있는 빠른 지표" />
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-[20px] bg-[#f5f8fb] p-4">
                <p className="text-xs text-[#647b95]">운동일 수</p>
                <p className="mt-2 text-2xl font-semibold text-[#10253f]">{weekly.workoutDays}</p>
              </div>
              <div className="rounded-[20px] bg-[#f5f8fb] p-4">
                <p className="text-xs text-[#647b95]">총 세트 수</p>
                <p className="mt-2 text-2xl font-semibold text-[#10253f]">{weekly.totalSets}</p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Pill>
                가장 많이 한 부위:{" "}
                {weekly.mostFrequentBodyPartId ? getBodyPartName(weekly.mostFrequentBodyPartId, state.bodyParts) : "없음"}
              </Pill>
              <Pill>
                가장 적게 한 부위:{" "}
                {weekly.leastFrequentBodyPartId ? getBodyPartName(weekly.leastFrequentBodyPartId, state.bodyParts) : "없음"}
              </Pill>
            </div>
          </Card>
        </div>
      </section>

      <Card>
        <SectionHeading eyebrow="Recent" title="최근 세션" description="최근 저장한 세션으로 빠르게 이동" />
        <div className="mt-4 grid gap-3">
          {state.sessions.slice(0, 5).map((session) => (
            <Link
              key={session.id}
              href={`/session/${session.sessionDate}`}
              className="rounded-[22px] bg-[#f5f8fb] px-4 py-3 transition hover:bg-[#eaf2fa]"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-[#10253f]">{summarizeSessionTitle(session, state.bodyParts)}</p>
                  <p className="mt-1 text-xs text-[#65788e]">
                    {format(parseISO(session.sessionDate), "M.d")} ·{" "}
                    {session.bodyPartIds.map((id) => getBodyPartName(id, state.bodyParts)).join(", ")}
                  </p>
                </div>
                <div className="flex flex-wrap justify-end gap-1">
                  {session.bodyPartIds.map((bodyPartId) => (
                    <span
                      key={`${session.id}:${bodyPartId}`}
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: bodyPartMap.get(bodyPartId)?.color ?? "#c6d0db" }}
                    />
                  ))}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </Card>
    </div>
  );
}
