"use client";

import { startTransition, useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Card, Pill, SectionHeading } from "@/components/ui";
import { useWorkoutApp } from "@/components/providers/workout-app-provider";
import { getMonthlyStats, getSessionComparison, getWeeklyStats } from "@/lib/stats";
import { getBodyPartName, summarizeSessionTitle } from "@/lib/workout";

const tabs = [
  { id: "last", label: "지난 세션" },
  { id: "weekly", label: "주간" },
  { id: "monthly", label: "월간" },
] as const;

type StatsTab = (typeof tabs)[number]["id"];

export function StatsDashboard() {
  const { state } = useWorkoutApp();
  const [tab, setTab] = useState<StatsTab>("last");
  const [chartsReady, setChartsReady] = useState(false);

  useEffect(() => {
    startTransition(() => {
      setChartsReady(true);
    });
  }, []);

  const comparison = getSessionComparison(state);
  const weekly = getWeeklyStats(state);
  const monthly = getMonthlyStats(state);
  const bodyPartLookup = new Map(state.bodyParts.map((bodyPart) => [bodyPart.id, bodyPart]));

  const weeklyFrequencyData = weekly.frequencyByBodyPart.map((item) => ({
    name: getBodyPartName(item.bodyPartId, state.bodyParts),
    count: item.count,
    color: bodyPartLookup.get(item.bodyPartId)?.color ?? "#8ea1b3",
  }));

  const monthlyRatioData = monthly.frequencyByBodyPart
    .filter((item) => item.count > 0)
    .map((item) => ({
      name: getBodyPartName(item.bodyPartId, state.bodyParts),
      value: item.count,
      color: bodyPartLookup.get(item.bodyPartId)?.color ?? "#8ea1b3",
    }));

  return (
    <div className="space-y-5">
      <Card>
        <SectionHeading eyebrow="Analytics" title="세션 비교와 주간 · 월간 통계" description="지난 기록 대비 볼륨과 빈도 변화를 빠르게 확인합니다." />
        <div className="mt-4 inline-flex rounded-full bg-[#edf3f9] p-1">
          {tabs.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                tab === item.id ? "bg-[#10253f] text-white" : "text-[#4a627b]"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </Card>

      {tab === "last" ? (
        <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
          <Card>
            <SectionHeading
              eyebrow="Last session"
              title={comparison.currentSession ? summarizeSessionTitle(comparison.currentSession, state.bodyParts) : "세션 없음"}
              description="같은 주부위 기준 직전 세션과 비교한 변화"
            />
            <div className="mt-5 grid grid-cols-3 gap-3">
              <div className="rounded-[22px] bg-[#eef4fb] p-4">
                <p className="text-xs text-[#617995]">총 볼륨</p>
                <p className="mt-2 text-2xl font-semibold text-[#10253f]">
                  {comparison.volumeChange >= 0 ? "+" : ""}
                  {comparison.volumeChange.toFixed(0)}
                </p>
              </div>
              <div className="rounded-[22px] bg-[#fff4e8] p-4">
                <p className="text-xs text-[#9a6b1b]">총 세트</p>
                <p className="mt-2 text-2xl font-semibold text-[#8b4a18]">
                  {comparison.totalSetsChange >= 0 ? "+" : ""}
                  {comparison.totalSetsChange}
                </p>
              </div>
              <div className="rounded-[22px] bg-[#ecf9f1] p-4">
                <p className="text-xs text-[#2b7b52]">운동 수</p>
                <p className="mt-2 text-2xl font-semibold text-[#21573d]">
                  {comparison.exerciseCountChange >= 0 ? "+" : ""}
                  {comparison.exerciseCountChange}
                </p>
              </div>
            </div>
            {comparison.previousSession ? (
              <div className="mt-5 rounded-[22px] bg-[#f5f8fb] p-4">
                <p className="text-sm font-semibold text-[#10253f]">비교 대상 세션</p>
                <p className="mt-1 text-sm text-[#64778d]">
                  {summarizeSessionTitle(comparison.previousSession, state.bodyParts)} · {comparison.previousSession.sessionDate}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {comparison.previousSession.bodyPartIds.map((bodyPartId) => (
                    <Pill key={bodyPartId}>{getBodyPartName(bodyPartId, state.bodyParts)}</Pill>
                  ))}
                </div>
              </div>
            ) : null}
          </Card>

          <Card>
            <SectionHeading eyebrow="Body part volume" title="최근 7일 부위별 볼륨" />
            <div className="mt-5 h-[320px]">
              {chartsReady ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={weekly.volumeByBodyPart.map((item) => ({
                      name: getBodyPartName(item.bodyPartId, state.bodyParts),
                      volume: Number(item.volume.toFixed(0)),
                      color: bodyPartLookup.get(item.bodyPartId)?.color ?? "#8ea1b3",
                    }))}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#d7e0ea" />
                    <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={12} />
                    <YAxis tickLine={false} axisLine={false} fontSize={12} />
                    <Tooltip />
                    <Bar dataKey="volume" radius={[12, 12, 0, 0]}>
                      {weekly.volumeByBodyPart.map((item) => (
                        <Cell key={item.bodyPartId} fill={bodyPartLookup.get(item.bodyPartId)?.color ?? "#8ea1b3"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full rounded-[24px] bg-[#f5f8fb]" />
              )}
            </div>
          </Card>
        </div>
      ) : null}

      {tab === "weekly" ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <SectionHeading eyebrow="Weekly frequency" title="부위별 운동 빈도" description="최근 7일 동안 세션에 포함된 횟수" />
            <div className="mt-5 h-[300px]">
              {chartsReady ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyFrequencyData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#d7e0ea" />
                    <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={12} />
                    <YAxis tickLine={false} axisLine={false} fontSize={12} />
                    <Tooltip />
                    <Bar dataKey="count" radius={[12, 12, 0, 0]}>
                      {weeklyFrequencyData.map((item) => (
                        <Cell key={item.name} fill={item.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full rounded-[24px] bg-[#f5f8fb]" />
              )}
            </div>
          </Card>

          <Card>
            <SectionHeading eyebrow="Weekly volume" title="날짜별 볼륨 추이" description="무게 x 반복 기준 세션 총합" />
            <div className="mt-5 h-[300px]">
              {chartsReady ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={weekly.volumeByDay}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#d7e0ea" />
                    <XAxis dataKey="date" tickLine={false} axisLine={false} fontSize={12} />
                    <YAxis tickLine={false} axisLine={false} fontSize={12} />
                    <Tooltip />
                    <Line type="monotone" dataKey="volume" stroke="#10253f" strokeWidth={3} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full rounded-[24px] bg-[#f5f8fb]" />
              )}
            </div>
          </Card>
        </div>
      ) : null}

      {tab === "monthly" ? (
        <div className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
          <div className="space-y-4">
            <Card>
              <SectionHeading eyebrow="Monthly trend" title="주차별 볼륨 추이" description="이번 달 주차 단위 누적 볼륨" />
              <div className="mt-5 h-[300px]">
                {chartsReady ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthly.volumeByWeek}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#d7e0ea" />
                      <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} />
                      <YAxis tickLine={false} axisLine={false} fontSize={12} />
                      <Tooltip />
                      <Bar dataKey="volume" fill="#ff9a3d" radius={[12, 12, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full rounded-[24px] bg-[#f5f8fb]" />
                )}
              </div>
            </Card>

            <Card>
              <SectionHeading eyebrow="Recent 4 weeks" title="최근 4주 비교" description="월간 리듬을 유지하고 있는지 확인" />
              <div className="mt-5 h-[260px]">
                {chartsReady ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthly.recentFourWeeks}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#d7e0ea" />
                      <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} />
                      <YAxis tickLine={false} axisLine={false} fontSize={12} />
                      <Tooltip />
                      <Line type="monotone" dataKey="volume" stroke="#ff9a3d" strokeWidth={3} dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full rounded-[24px] bg-[#f5f8fb]" />
                )}
              </div>
            </Card>
          </div>

          <Card>
            <SectionHeading eyebrow="Monthly ratio" title="부위별 수행 비율" description="이번 달 세션에 포함된 부위 분포" />
            <div className="mt-5 h-[300px]">
              {chartsReady ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={monthlyRatioData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={70}
                      outerRadius={110}
                      paddingAngle={2}
                    >
                      {monthlyRatioData.map((item) => (
                        <Cell key={item.name} fill={item.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full rounded-[24px] bg-[#f5f8fb]" />
              )}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {monthlyRatioData.map((item) => (
                <Pill key={item.name}>
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  {item.name} {item.value}회
                </Pill>
              ))}
            </div>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
