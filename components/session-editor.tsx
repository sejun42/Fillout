"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Copy, Plus, Save, Search, Trash2, X } from "lucide-react";
import { useState } from "react";

import { useWorkoutApp } from "@/components/providers/workout-app-provider";
import { Card, EmptyState, Pill, SectionHeading, buttonStyles } from "@/components/ui";
import { formatLongDate } from "@/lib/date";
import { createEmptySession } from "@/lib/mock-data";
import { findPreviousExerciseRecord, getSessionComparison } from "@/lib/stats";
import {
  createDefaultSet,
  createEmptySessionExercise,
  getBodyPartName,
  getBrandName,
  getMachineTemplates,
  summarizeSessionTitle,
  syncSettingsWithTemplates,
} from "@/lib/workout";
import { createId } from "@/lib/utils";
import type { ExerciseDefinition, SessionExercise, WorkoutSession } from "@/types/domain";

function cloneSession(session: WorkoutSession) {
  return JSON.parse(JSON.stringify(session)) as WorkoutSession;
}

function cloneExerciseFromPrevious(previous: SessionExercise) {
  return previous.sets.map((set, index) => ({
    ...createDefaultSet(index + 1),
    weightValue: set.weightValue,
    reps: set.reps,
    isCompleted: false,
  }));
}

export function SessionEditor({ sessionDate }: { sessionDate: string }) {
  const { state, hydrated } = useWorkoutApp();
  const existingSession = state.sessions.find((session) => session.sessionDate === sessionDate) ?? null;

  if (!hydrated) {
    return (
      <Card>
        <p className="text-sm text-[#56697f]">세션을 불러오는 중입니다.</p>
      </Card>
    );
  }

  const initialSession =
    existingSession != null
      ? cloneSession(existingSession)
      : createEmptySession(state.profile?.id ?? "user:guest", sessionDate);

  return (
    <SessionEditorForm
      key={`${sessionDate}:${existingSession?.updatedAt ?? "new"}:${state.profile?.id ?? "guest"}`}
      sessionDate={sessionDate}
      initialSession={initialSession}
      existingSessionId={existingSession?.id ?? null}
    />
  );
}

function SessionEditorForm({
  sessionDate,
  initialSession,
  existingSessionId,
}: {
  sessionDate: string;
  initialSession: WorkoutSession;
  existingSessionId: string | null;
}) {
  const router = useRouter();
  const { state, saveSession, deleteSession, isSyncing, syncError } = useWorkoutApp();
  const [draft, setDraft] = useState<WorkoutSession>(initialSession);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const existingSession = existingSessionId
    ? state.sessions.find((session) => session.id === existingSessionId) ?? null
    : null;
  const comparison = getSessionComparison(state, sessionDate);
  const exerciseLookup = new Map(state.exercises.map((exercise) => [exercise.id, exercise]));
  const machineLookup = new Map(state.machines.map((machine) => [machine.id, machine]));
  const hasRequiredInput = draft.bodyPartIds.length > 0 && draft.exercises.length > 0;

  const filteredExercises = state.exercises
    .filter((exercise) => exercise.name.toLowerCase().includes(search.trim().toLowerCase()))
    .sort((left, right) => Number(right.isSystem) - Number(left.isSystem));

  function patchDraft(updater: (current: WorkoutSession) => WorkoutSession) {
    setDraft((current) => (current ? updater(current) : current));
  }

  function patchExercise(exerciseId: string, updater: (exercise: SessionExercise) => SessionExercise) {
    patchDraft((current) => ({
      ...current,
      exercises: current.exercises.map((exercise, index) =>
        exercise.id === exerciseId ? { ...updater(exercise), orderIndex: index + 1 } : exercise,
      ),
    }));
  }

  function handleAddExercise(definition: ExerciseDefinition) {
    const previous = findPreviousExerciseRecord({
      sessions: state.sessions,
      currentSessionDate: sessionDate,
      currentSessionId: draft.id,
      exerciseDefinitionId: definition.id,
      machineId: null,
    });
    const nextExercise = createEmptySessionExercise(definition.id, draft.exercises.length + 1);

    if (previous) {
      nextExercise.sets = cloneExerciseFromPrevious(previous.exercise);
    }

    patchDraft((current) => ({
      ...current,
      exercises: [...current.exercises, nextExercise],
    }));
    setIsModalOpen(false);
    setSearch("");
  }

  function fillPreviousRecord(exercise: SessionExercise) {
    const previous = findPreviousExerciseRecord({
      sessions: state.sessions,
      currentSessionDate: sessionDate,
      currentSessionId: draft.id,
      exerciseDefinitionId: exercise.exerciseDefinitionId,
      machineId: exercise.machineId,
    });

    if (!previous) {
      return;
    }

    const templates = getMachineTemplates(exercise.machineId, state.machineSettingTemplates);
    patchExercise(exercise.id, (currentExercise) => ({
      ...currentExercise,
      settings: templates.length
        ? syncSettingsWithTemplates(currentExercise.settings, templates, previous.exercise.settings)
        : currentExercise.settings,
      sets: cloneExerciseFromPrevious(previous.exercise),
      updatedAt: new Date().toISOString(),
    }));
  }

  function normalizeBeforeSave() {
    return {
      ...draft,
      userId: state.profile?.id ?? draft.userId,
      updatedAt: new Date().toISOString(),
      bodyPartIds: [...new Set(draft.bodyPartIds)],
      exercises: draft.exercises.map((exercise, exerciseIndex) => ({
        ...exercise,
        orderIndex: exerciseIndex + 1,
        updatedAt: new Date().toISOString(),
        settings: exercise.settings.filter((setting) => setting.valueText.trim() !== ""),
        sets: exercise.sets.map((set, index) => ({
          ...set,
          id: set.id || createId("set"),
          setNumber: index + 1,
          updatedAt: new Date().toISOString(),
        })),
      })),
    };
  }

  return (
    <div className="space-y-5">
      <Card className="space-y-4">
        <SectionHeading eyebrow="Workout session" title={formatLongDate(sessionDate)} description="부위 선택 후 운동을 추가하고 바로 저장합니다." />
        <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
          <input
            value={draft.title}
            onChange={(event) => patchDraft((current) => ({ ...current, title: event.target.value }))}
            placeholder="세션 제목 (선택)"
            className="rounded-2xl border border-[#d5dfeb] bg-white px-4 py-3 text-sm"
          />
          <div className="flex flex-wrap gap-2">
            {state.bodyParts.map((bodyPart) => {
              const selected = draft.bodyPartIds.includes(bodyPart.id);

              return (
                <button
                  key={bodyPart.id}
                  type="button"
                  onClick={() =>
                    patchDraft((current) => ({
                      ...current,
                      bodyPartIds: selected
                        ? current.bodyPartIds.filter((id) => id !== bodyPart.id)
                        : [...current.bodyPartIds, bodyPart.id],
                    }))
                  }
                  className={`rounded-full px-3 py-2 text-xs font-semibold transition ${
                    selected ? "text-white" : "text-[#3f5f80]"
                  }`}
                  style={{
                    backgroundColor: selected ? bodyPart.color : "#eef4fb",
                  }}
                >
                  {bodyPart.name}
                </button>
              );
            })}
          </div>
          <div className="flex gap-2">
            <button type="button" className={buttonStyles("secondary")} onClick={() => setIsModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              운동 추가
            </button>
            <button
              type="button"
              className={buttonStyles("primary")}
              disabled={!hasRequiredInput}
              onClick={async () => {
                try {
                  await saveSession(normalizeBeforeSave());
                } catch (error) {
                  window.alert(error instanceof Error ? error.message : "세션 저장에 실패했습니다.");
                }
              }}
            >
              <Save className="mr-2 h-4 w-4" />
              저장
            </button>
          </div>
        </div>

        <textarea
          value={draft.notes}
          onChange={(event) => patchDraft((current) => ({ ...current, notes: event.target.value }))}
          placeholder="세션 메모"
          className="min-h-24 w-full rounded-[24px] border border-[#d5dfeb] bg-white px-4 py-3 text-sm"
        />

        <div className="flex flex-wrap items-center gap-2">
          <Pill>{summarizeSessionTitle(draft, state.bodyParts)}</Pill>
          <Pill>운동 {draft.exercises.length}개</Pill>
          <Pill>저장 상태 {existingSession ? "기존 세션 수정" : "새 세션"}</Pill>
          {isSyncing ? <Pill>Supabase 동기화 중</Pill> : null}
          {syncError ? <Pill className="bg-[#a93f3a] text-white">{syncError}</Pill> : null}
          {existingSession ? (
            <button
              type="button"
              className={buttonStyles("danger")}
              onClick={async () => {
                if (window.confirm("이 날짜의 세션을 삭제할까요?")) {
                  try {
                    await deleteSession(existingSession.id);
                    router.push("/");
                  } catch (error) {
                    window.alert(error instanceof Error ? error.message : "세션 삭제에 실패했습니다.");
                  }
                }
              }}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              삭제
            </button>
          ) : null}
        </div>
      </Card>

      <section className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
        <Card>
          <SectionHeading eyebrow="Progress" title="지난 세션 비교" description="같은 주부위 기준 직전 세션과 비교" />
          <div className="mt-4 grid grid-cols-3 gap-3">
            <div className="rounded-[20px] bg-[#eef4fb] p-4">
              <p className="text-xs text-[#647b95]">볼륨 변화</p>
              <p className="mt-2 text-xl font-semibold text-[#10253f]">
                {comparison.volumeChange >= 0 ? "+" : ""}
                {comparison.volumeChange.toFixed(0)}
              </p>
            </div>
            <div className="rounded-[20px] bg-[#fff4e8] p-4">
              <p className="text-xs text-[#9a6b1b]">세트 변화</p>
              <p className="mt-2 text-xl font-semibold text-[#8b4a18]">
                {comparison.totalSetsChange >= 0 ? "+" : ""}
                {comparison.totalSetsChange}
              </p>
            </div>
            <div className="rounded-[20px] bg-[#ecf9f1] p-4">
              <p className="text-xs text-[#2b7b52]">운동 수 변화</p>
              <p className="mt-2 text-xl font-semibold text-[#21573d]">
                {comparison.exerciseCountChange >= 0 ? "+" : ""}
                {comparison.exerciseCountChange}
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <SectionHeading eyebrow="Guide" title="빠른 입력 팁" description="운동 중 탭 수를 줄이는 데 집중한 규칙" />
          <div className="mt-4 space-y-3 text-sm leading-6 text-[#56697f]">
            <div className="rounded-[20px] bg-[#f5f8fb] p-4">머신을 선택하면 이전 세팅값을 자동으로 미리 채웁니다.</div>
            <div className="rounded-[20px] bg-[#f5f8fb] p-4">새 세트는 직전 세트 값을 복사해서 추가합니다.</div>
            <div className="rounded-[20px] bg-[#f5f8fb] p-4">각 세트 입력 칸에는 직전 기록이 placeholder로 표시됩니다.</div>
          </div>
        </Card>
      </section>

      {draft.exercises.length === 0 ? (
        <EmptyState
          title="아직 추가된 운동이 없습니다"
          description="세션 부위를 선택한 뒤 `운동 추가`로 기본 라이브러리나 커스텀 운동을 넣으세요."
          action={
            <button type="button" className={buttonStyles("primary")} onClick={() => setIsModalOpen(true)}>
              운동 추가 열기
            </button>
          }
        />
      ) : (
        <div className="space-y-4">
          {draft.exercises
            .slice()
            .sort((left, right) => left.orderIndex - right.orderIndex)
            .map((exercise, index) => {
              const definition = exerciseLookup.get(exercise.exerciseDefinitionId);
              const previous = findPreviousExerciseRecord({
                sessions: state.sessions,
                currentSessionDate: sessionDate,
                currentSessionId: draft.id,
                exerciseDefinitionId: exercise.exerciseDefinitionId,
                machineId: exercise.machineId,
              });
              const machine = exercise.machineId ? machineLookup.get(exercise.machineId) ?? null : null;
              const templates = getMachineTemplates(exercise.machineId, state.machineSettingTemplates);

              return (
                <Card key={exercise.id} className="space-y-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#68819d]">
                        Exercise {index + 1}
                      </p>
                      <h3 className="mt-1 text-xl font-semibold tracking-[-0.03em] text-[#10253f]">
                        {definition?.name ?? "운동"}
                      </h3>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <Pill>{definition ? getBodyPartName(definition.primaryBodyPartId, state.bodyParts) : "부위"}</Pill>
                        <Pill>{definition?.exerciseType ?? "other"}</Pill>
                        {machine ? <Pill>{getBrandName(machine, state.brands)}</Pill> : <Pill>머신 선택 안 함</Pill>}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {previous ? (
                        <button type="button" className={buttonStyles("secondary")} onClick={() => fillPreviousRecord(exercise)}>
                          <Copy className="mr-2 h-4 w-4" />
                          이전 기록 채우기
                        </button>
                      ) : null}
                      <button
                        type="button"
                        className={buttonStyles("danger")}
                        onClick={() =>
                          patchDraft((current) => ({
                            ...current,
                            exercises: current.exercises
                              .filter((item) => item.id !== exercise.id)
                              .map((item, itemIndex) => ({ ...item, orderIndex: itemIndex + 1 })),
                          }))
                        }
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        카드 삭제
                      </button>
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-[1fr_1fr]">
                    <select
                      value={exercise.machineId ?? ""}
                      onChange={(event) => {
                        const machineId = event.target.value || null;
                        const nextTemplates = getMachineTemplates(machineId, state.machineSettingTemplates);
                        const previousRecord = findPreviousExerciseRecord({
                          sessions: state.sessions,
                          currentSessionDate: sessionDate,
                          currentSessionId: draft.id,
                          exerciseDefinitionId: exercise.exerciseDefinitionId,
                          machineId,
                        });

                        patchExercise(exercise.id, (currentExercise) => {
                          const hasTypedSets = currentExercise.sets.some(
                            (set) => set.weightValue != null || set.reps != null || set.isCompleted,
                          );

                          return {
                            ...currentExercise,
                            machineId,
                            settings: machineId
                              ? syncSettingsWithTemplates(
                                  currentExercise.settings,
                                  nextTemplates,
                                  previousRecord?.exercise.settings,
                                )
                              : [],
                            sets:
                              !hasTypedSets && previousRecord
                                ? cloneExerciseFromPrevious(previousRecord.exercise)
                                : currentExercise.sets,
                            updatedAt: new Date().toISOString(),
                          };
                        });
                      }}
                      className="rounded-2xl border border-[#d5dfeb] bg-white px-4 py-3 text-sm"
                    >
                      <option value="">머신 선택 안 함</option>
                      {state.machines.map((machineOption) => (
                        <option key={machineOption.id} value={machineOption.id}>
                          {getBrandName(machineOption, state.brands)} / {machineOption.name}
                        </option>
                      ))}
                    </select>
                    <textarea
                      value={exercise.notes}
                      onChange={(event) =>
                        patchExercise(exercise.id, (currentExercise) => ({
                          ...currentExercise,
                          notes: event.target.value,
                        }))
                      }
                      placeholder="운동 메모"
                      className="min-h-24 rounded-[24px] border border-[#d5dfeb] bg-white px-4 py-3 text-sm"
                    />
                  </div>

                  {templates.length > 0 ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-[#10253f]">머신 세팅값</p>
                        {previous ? (
                          <p className="text-xs text-[#68819d]">이전 기록 {previous.session.sessionDate} 기준 자동 프리필</p>
                        ) : null}
                      </div>
                      <div className="grid gap-3 md:grid-cols-3">
                        {templates.map((template) => {
                          const currentSetting = exercise.settings.find((setting) => setting.templateId === template.id);

                          if (template.fieldType === "dropdown") {
                            return (
                              <label key={template.id} className="space-y-2">
                                <span className="text-xs font-medium text-[#60758e]">{template.fieldLabel}</span>
                                <select
                                  value={currentSetting?.valueText ?? ""}
                                  onChange={(event) =>
                                    patchExercise(exercise.id, (currentExercise) => ({
                                      ...currentExercise,
                                      settings: syncSettingsWithTemplates(currentExercise.settings, templates).map((setting) =>
                                        setting.templateId === template.id
                                          ? { ...setting, valueText: event.target.value }
                                          : setting,
                                      ),
                                    }))
                                  }
                                  className="w-full rounded-2xl border border-[#d5dfeb] bg-white px-4 py-3 text-sm"
                                >
                                  <option value="">선택</option>
                                  {template.options?.map((option) => (
                                    <option key={option} value={option}>
                                      {option}
                                    </option>
                                  ))}
                                </select>
                              </label>
                            );
                          }

                          return (
                            <label key={template.id} className="space-y-2">
                              <span className="text-xs font-medium text-[#60758e]">{template.fieldLabel}</span>
                              <input
                                type={template.fieldType === "number" ? "number" : "text"}
                                value={currentSetting?.valueText ?? ""}
                                onChange={(event) =>
                                  patchExercise(exercise.id, (currentExercise) => ({
                                    ...currentExercise,
                                    settings: syncSettingsWithTemplates(currentExercise.settings, templates).map((setting) =>
                                      setting.templateId === template.id
                                        ? { ...setting, valueText: event.target.value }
                                        : setting,
                                    ),
                                  }))
                                }
                                placeholder={template.fieldType === "number" ? "예: 30" : "입력"}
                                className="w-full rounded-2xl border border-[#d5dfeb] bg-white px-4 py-3 text-sm"
                              />
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-[#10253f]">세트 기록</p>
                      <button
                        type="button"
                        className={buttonStyles("ghost")}
                        onClick={() =>
                          patchExercise(exercise.id, (currentExercise) => {
                            const lastSet = currentExercise.sets.at(-1);
                            return {
                              ...currentExercise,
                              sets: [...currentExercise.sets, createDefaultSet(currentExercise.sets.length + 1, lastSet)],
                            };
                          })
                        }
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        세트 추가
                      </button>
                    </div>

                    <div className="overflow-hidden rounded-[22px] border border-[#dbe5ef]">
                      <div className="grid grid-cols-[60px_1fr_1fr_72px_44px] bg-[#eef4fb] px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#67819c]">
                        <span>세트</span>
                        <span>무게</span>
                        <span>횟수</span>
                        <span>이전</span>
                        <span>완료</span>
                      </div>
                      {exercise.sets.map((set, setIndex) => {
                        const previousSet = previous?.exercise.sets[setIndex];

                        return (
                          <div
                            key={set.id}
                            className="grid grid-cols-[60px_1fr_1fr_72px_44px] items-center gap-2 border-t border-[#eef3f7] px-3 py-3 text-sm"
                          >
                            <span className="font-semibold text-[#10253f]">{setIndex + 1}</span>
                            <input
                              type="number"
                              step="0.5"
                              value={set.weightValue ?? ""}
                              placeholder={previousSet?.weightValue != null ? String(previousSet.weightValue) : ""}
                              onChange={(event) =>
                                patchExercise(exercise.id, (currentExercise) => ({
                                  ...currentExercise,
                                  sets: currentExercise.sets.map((currentSet, currentIndex) =>
                                    currentIndex === setIndex
                                      ? {
                                          ...currentSet,
                                          weightValue:
                                            event.target.value === "" ? null : Number(event.target.value),
                                        }
                                      : currentSet,
                                  ),
                                }))
                              }
                              className="rounded-2xl border border-[#d5dfeb] bg-white px-3 py-2"
                            />
                            <input
                              type="number"
                              value={set.reps ?? ""}
                              placeholder={previousSet?.reps != null ? String(previousSet.reps) : ""}
                              onChange={(event) =>
                                patchExercise(exercise.id, (currentExercise) => ({
                                  ...currentExercise,
                                  sets: currentExercise.sets.map((currentSet, currentIndex) =>
                                    currentIndex === setIndex
                                      ? {
                                          ...currentSet,
                                          reps: event.target.value === "" ? null : Number(event.target.value),
                                        }
                                      : currentSet,
                                  ),
                                }))
                              }
                              className="rounded-2xl border border-[#d5dfeb] bg-white px-3 py-2"
                            />
                            <span className="text-xs text-[#71869f]">
                              {previousSet ? `${previousSet.weightValue ?? "-"} x ${previousSet.reps ?? "-"}` : "-"}
                            </span>
                            <input
                              type="checkbox"
                              checked={set.isCompleted}
                              onChange={(event) =>
                                patchExercise(exercise.id, (currentExercise) => ({
                                  ...currentExercise,
                                  sets: currentExercise.sets.map((currentSet, currentIndex) =>
                                    currentIndex === setIndex
                                      ? {
                                          ...currentSet,
                                          isCompleted: event.target.checked,
                                        }
                                      : currentSet,
                                  ),
                                }))
                              }
                              className="h-4 w-4 justify-self-center accent-[#10253f]"
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </Card>
              );
            })}
        </div>
      )}

      {isModalOpen ? (
        <div className="fixed inset-0 z-30 flex items-end bg-[#10253f]/35 backdrop-blur-sm sm:items-center sm:justify-center">
          <div className="h-[82vh] w-full rounded-t-[32px] bg-[#f7fafc] p-5 shadow-2xl sm:h-auto sm:max-h-[80vh] sm:max-w-2xl sm:rounded-[32px]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#64809d]">Exercise picker</p>
                <h3 className="mt-1 text-xl font-semibold tracking-[-0.03em] text-[#10253f]">운동 추가</h3>
              </div>
              <button type="button" onClick={() => setIsModalOpen(false)} className={buttonStyles("ghost")}>
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 flex items-center gap-3 rounded-[24px] border border-[#d8e2ec] bg-white px-4 py-3">
              <Search className="h-4 w-4 text-[#6d8298]" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="운동명 검색"
                className="w-full bg-transparent text-sm outline-none"
              />
            </div>

            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-[#60758e]">검색 결과 {filteredExercises.length}개</p>
              <Link href="/library" className={buttonStyles("secondary")}>
                커스텀 운동 추가
              </Link>
            </div>

            <div className="mt-4 grid max-h-[52vh] gap-3 overflow-y-auto pr-1">
              {filteredExercises.map((exercise) => (
                <button
                  key={exercise.id}
                  type="button"
                  onClick={() => handleAddExercise(exercise)}
                  className="rounded-[24px] bg-white px-4 py-4 text-left shadow-[0_12px_24px_rgba(16,37,63,0.06)] transition hover:-translate-y-0.5"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-base font-semibold text-[#10253f]">{exercise.name}</p>
                      <p className="mt-1 text-sm text-[#64788f]">
                        {getBodyPartName(exercise.primaryBodyPartId, state.bodyParts)} · {exercise.exerciseType}
                      </p>
                    </div>
                    <Pill className={exercise.isSystem ? "bg-[#eef4fb]" : "bg-[#10253f] text-white"}>
                      {exercise.isSystem ? "기본" : "커스텀"}
                    </Pill>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
