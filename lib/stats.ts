import { eachDayOfInterval, endOfMonth, endOfWeek, format, isSameDay, startOfMonth, startOfWeek, subDays } from "date-fns";

import { fromIsoDate, toIsoDate } from "@/lib/date";
import type {
  ExerciseDefinition,
  MonthlyStats,
  RecommendationBanner,
  SessionComparison,
  SessionExercise,
  SessionExerciseSet,
  WeeklyStats,
  WorkoutAppState,
  WorkoutSession,
} from "@/types/domain";

function buildExerciseLookup(exercises: ExerciseDefinition[]) {
  return new Map(exercises.map((exercise) => [exercise.id, exercise]));
}

export function getSetVolume(set: SessionExerciseSet) {
  if (set.weightValue == null || set.reps == null) {
    return 0;
  }

  return set.weightValue * set.reps;
}

export function getExerciseVolume(exercise: SessionExercise) {
  return exercise.sets.reduce((total, set) => total + getSetVolume(set), 0);
}

export function getSessionVolume(session: WorkoutSession) {
  return session.exercises.reduce((total, exercise) => total + getExerciseVolume(exercise), 0);
}

export function getSessionSetCount(session: WorkoutSession) {
  return session.exercises.reduce((total, exercise) => total + exercise.sets.length, 0);
}

export function sortSessionsByDate(sessions: WorkoutSession[], direction: "asc" | "desc" = "desc") {
  const sorted = [...sessions].sort((left, right) => left.sessionDate.localeCompare(right.sessionDate));
  return direction === "asc" ? sorted : sorted.reverse();
}

export function findSessionByDate(sessions: WorkoutSession[], date: string) {
  return sessions.find((session) => session.sessionDate === date) ?? null;
}

export function findPreviousExerciseRecord(options: {
  sessions: WorkoutSession[];
  currentSessionDate: string;
  currentSessionId?: string;
  exerciseDefinitionId: string;
  machineId: string | null;
}) {
  const { sessions, currentSessionDate, currentSessionId, exerciseDefinitionId, machineId } = options;
  const sorted = sortSessionsByDate(sessions, "desc");

  for (const session of sorted) {
    const isSameSession = currentSessionId != null && session.id === currentSessionId;
    const isBefore = session.sessionDate < currentSessionDate;

    if (!isBefore || isSameSession) {
      continue;
    }

    const match = session.exercises.find(
      (exercise) =>
        exercise.exerciseDefinitionId === exerciseDefinitionId &&
        exercise.machineId === machineId,
    );

    if (match) {
      return {
        session,
        exercise: match,
      };
    }
  }

  return null;
}

export function getSessionComparison(state: WorkoutAppState, sessionDate?: string): SessionComparison {
  const sessions = sortSessionsByDate(state.sessions, "desc");
  const currentSession = sessionDate
    ? findSessionByDate(state.sessions, sessionDate)
    : sessions[0] ?? null;

  if (!currentSession) {
    return {
      currentSession: null,
      previousSession: null,
      volumeChange: 0,
      totalSetsChange: 0,
      exerciseCountChange: 0,
    };
  }

  const anchorBodyPart = currentSession.bodyPartIds[0] ?? null;
  const previousSession =
    sessions.find(
      (session) =>
        session.id !== currentSession.id &&
        session.sessionDate < currentSession.sessionDate &&
        (anchorBodyPart ? session.bodyPartIds.includes(anchorBodyPart) : true),
    ) ?? null;

  return {
    currentSession,
    previousSession,
    volumeChange: getSessionVolume(currentSession) - (previousSession ? getSessionVolume(previousSession) : 0),
    totalSetsChange:
      getSessionSetCount(currentSession) - (previousSession ? getSessionSetCount(previousSession) : 0),
    exerciseCountChange:
      currentSession.exercises.length - (previousSession ? previousSession.exercises.length : 0),
  };
}

function accumulateBodyPartVolumes(state: WorkoutAppState, sessions: WorkoutSession[]) {
  const exerciseLookup = buildExerciseLookup(state.exercises);
  const accumulator = new Map<string, number>();

  for (const session of sessions) {
    for (const exercise of session.exercises) {
      const definition = exerciseLookup.get(exercise.exerciseDefinitionId);

      if (!definition) {
        continue;
      }

      accumulator.set(
        definition.primaryBodyPartId,
        (accumulator.get(definition.primaryBodyPartId) ?? 0) + getExerciseVolume(exercise),
      );
    }
  }

  return Array.from(accumulator.entries()).map(([bodyPartId, volume]) => ({
    bodyPartId,
    volume,
  }));
}

function accumulateBodyPartFrequency(sessions: WorkoutSession[]) {
  const accumulator = new Map<string, number>();

  for (const session of sessions) {
    const uniqueIds = new Set(session.bodyPartIds);
    for (const bodyPartId of uniqueIds) {
      accumulator.set(bodyPartId, (accumulator.get(bodyPartId) ?? 0) + 1);
    }
  }

  return Array.from(accumulator.entries()).map(([bodyPartId, count]) => ({
    bodyPartId,
    count,
  }));
}

function fillFrequencyAcrossAllBodyParts(state: WorkoutAppState, source: Array<{ bodyPartId: string; count: number }>) {
  const map = new Map(source.map((item) => [item.bodyPartId, item.count]));
  return state.bodyParts.map((bodyPart) => ({
    bodyPartId: bodyPart.id,
    count: map.get(bodyPart.id) ?? 0,
  }));
}

function fillVolumeAcrossAllBodyParts(state: WorkoutAppState, source: Array<{ bodyPartId: string; volume: number }>) {
  const map = new Map(source.map((item) => [item.bodyPartId, item.volume]));
  return state.bodyParts.map((bodyPart) => ({
    bodyPartId: bodyPart.id,
    volume: Number((map.get(bodyPart.id) ?? 0).toFixed(1)),
  }));
}

export function getWeeklyStats(state: WorkoutAppState, today = new Date()): WeeklyStats {
  const start = subDays(today, 6);
  const interval = eachDayOfInterval({ start, end: today });
  const sessions = state.sessions.filter((session) => {
    const date = fromIsoDate(session.sessionDate);
    return date >= start && date <= today;
  });
  const frequencyByBodyPart = fillFrequencyAcrossAllBodyParts(state, accumulateBodyPartFrequency(sessions));
  const volumeByBodyPart = fillVolumeAcrossAllBodyParts(state, accumulateBodyPartVolumes(state, sessions));
  const mostFrequent = [...frequencyByBodyPart].sort((left, right) => right.count - left.count)[0] ?? null;
  const leastFrequent = [...frequencyByBodyPart].sort((left, right) => left.count - right.count)[0] ?? null;

  return {
    workoutDays: sessions.length,
    totalSets: sessions.reduce((total, session) => total + getSessionSetCount(session), 0),
    mostFrequentBodyPartId: mostFrequent && mostFrequent.count > 0 ? mostFrequent.bodyPartId : null,
    leastFrequentBodyPartId: leastFrequent ? leastFrequent.bodyPartId : null,
    frequencyByBodyPart,
    volumeByBodyPart,
    volumeByDay: interval.map((date) => {
      const iso = toIsoDate(date);
      const daySessions = sessions.filter((session) => session.sessionDate === iso);
      return {
        date: format(date, "M/d"),
        volume: Number(daySessions.reduce((total, session) => total + getSessionVolume(session), 0).toFixed(1)),
      };
    }),
  };
}

export function getMonthlyStats(state: WorkoutAppState, today = new Date()): MonthlyStats {
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);
  const monthSessions = state.sessions.filter((session) => {
    const date = fromIsoDate(session.sessionDate);
    return date >= monthStart && date <= monthEnd;
  });

  const weeks: Array<{ label: string; volume: number }> = [];
  let cursor = startOfWeek(monthStart, { weekStartsOn: 1 });
  let index = 1;

  while (cursor <= monthEnd) {
    const weekEnd = endOfWeek(cursor, { weekStartsOn: 1 });
    const weekSessions = monthSessions.filter((session) => {
      const date = fromIsoDate(session.sessionDate);
      return date >= cursor && date <= weekEnd;
    });

    weeks.push({
      label: `W${index}`,
      volume: Number(weekSessions.reduce((total, session) => total + getSessionVolume(session), 0).toFixed(1)),
    });

    cursor = subDays(weekEnd, -1);
    index += 1;
  }

  const recentFourWeeks = Array.from({ length: 4 }, (_, weekIndex) => {
    const end = endOfWeek(subDays(today, weekIndex * 7), { weekStartsOn: 1 });
    const start = startOfWeek(end, { weekStartsOn: 1 });
    const weekSessions = state.sessions.filter((session) => {
      const date = fromIsoDate(session.sessionDate);
      return date >= start && date <= end;
    });

    return {
      label: `${format(start, "M/d")}주`,
      volume: Number(weekSessions.reduce((total, session) => total + getSessionVolume(session), 0).toFixed(1)),
    };
  }).reverse();

  return {
    workoutDays: monthSessions.length,
    frequencyByBodyPart: fillFrequencyAcrossAllBodyParts(state, accumulateBodyPartFrequency(monthSessions)),
    volumeByBodyPart: fillVolumeAcrossAllBodyParts(state, accumulateBodyPartVolumes(state, monthSessions)),
    volumeByWeek: weeks,
    recentFourWeeks,
  };
}

export function getRecommendationBanners(state: WorkoutAppState, today = new Date()): RecommendationBanner[] {
  const recent14 = state.sessions.filter((session) => {
    const date = fromIsoDate(session.sessionDate);
    return date >= subDays(today, 13) && date <= today;
  });
  const recent21 = state.sessions.filter((session) => {
    const date = fromIsoDate(session.sessionDate);
    return date >= subDays(today, 20) && date <= today;
  });
  const frequency14 = new Map(accumulateBodyPartFrequency(recent14).map((item) => [item.bodyPartId, item.count]));
  const frequency21 = new Map(accumulateBodyPartFrequency(recent21).map((item) => [item.bodyPartId, item.count]));
  const banners: RecommendationBanner[] = [];

  for (const bodyPart of state.bodyParts) {
    if ((frequency21.get(bodyPart.id) ?? 0) === 0) {
      banners.push({
        id: `missing:${bodyPart.id}`,
        title: `${bodyPart.name} 훈련 기록이 3주간 없습니다`,
        detail: "장기 미실시 부위를 우선 회복 루틴에 넣어보세요.",
        bodyPartId: bodyPart.id,
        tone: "warning",
      });
    } else if ((frequency14.get(bodyPart.id) ?? 0) <= 1) {
      banners.push({
        id: `low:${bodyPart.id}`,
        title: `최근 2주간 ${bodyPart.name} 빈도가 낮습니다`,
        detail: "다음 세션 후보 부위로 우선 노출하는 것이 좋습니다.",
        bodyPartId: bodyPart.id,
        tone: "balance",
      });
    }
  }

  const chestCount = frequency14.get("chest") ?? 0;
  const backCount = frequency14.get("back") ?? 0;
  if (chestCount - backCount >= 2) {
    banners.unshift({
      id: "imbalance:push-pull",
      title: "등 훈련 빈도가 가슴 대비 낮습니다",
      detail: "최근 14일 push/pull 밸런스를 맞추기 위해 등 세션을 추천합니다.",
      bodyPartId: "back",
      tone: "warning",
    });
  }

  const quadCount = frequency14.get("quads") ?? 0;
  const hamCount = frequency14.get("hamstrings") ?? 0;
  if (quadCount - hamCount >= 2) {
    banners.unshift({
      id: "imbalance:legs",
      title: "후면하체 빈도가 전면하체보다 낮습니다",
      detail: "루마니안 데드리프트나 레그 컬 세션을 우선 배치하세요.",
      bodyPartId: "hamstrings",
      tone: "warning",
    });
  }

  const deduped = new Map<string, RecommendationBanner>();
  for (const banner of banners) {
    if (!deduped.has(banner.id)) {
      deduped.set(banner.id, banner);
    }
  }

  return Array.from(deduped.values()).slice(0, 2);
}

export function getSessionDotsForDate(sessions: WorkoutSession[], date: string) {
  const session = findSessionByDate(sessions, date);
  if (!session) {
    return [];
  }

  return [...new Set(session.bodyPartIds)];
}

export function getWorkoutDaysInMonth(sessions: WorkoutSession[], month: Date) {
  return sessions.filter((session) => isSameDay(fromIsoDate(session.sessionDate), month)).length;
}
