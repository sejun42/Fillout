"use client";

import { Plus } from "lucide-react";
import { useState } from "react";

import { useWorkoutApp } from "@/components/providers/workout-app-provider";
import { Card, Pill, SectionHeading, buttonStyles } from "@/components/ui";
import { settingTemplatePresets } from "@/lib/mock-data";
import { getBodyPartName, getBrandName, getMachineTemplates } from "@/lib/workout";
import { exerciseTypes } from "@/types/domain";

function getSourceLabel(options: { isSystem: boolean; isShared?: boolean }) {
  if (options.isSystem) {
    return "기본";
  }

  if (options.isShared) {
    return "공용";
  }

  return "내 항목";
}

export function LibraryDashboard() {
  const { state, addBrand, addExercise, addMachine, isSyncing, syncError } = useWorkoutApp();
  const [brandName, setBrandName] = useState("");
  const [exerciseName, setExerciseName] = useState("");
  const [exerciseBodyPartId, setExerciseBodyPartId] = useState("chest");
  const [exerciseType, setExerciseType] = useState<(typeof exerciseTypes)[number]>("machine");
  const [machineName, setMachineName] = useState("");
  const [machineBrandId, setMachineBrandId] = useState<string>("__custom__");
  const [machineBrandFallback, setMachineBrandFallback] = useState("");
  const [machineBodyPartId, setMachineBodyPartId] = useState<string>("chest");
  const [selectedTemplateKeys, setSelectedTemplateKeys] = useState<string[]>(["seat_height", "angle"]);

  function toggleTemplate(key: string) {
    setSelectedTemplateKeys((current) =>
      current.includes(key) ? current.filter((value) => value !== key) : [...current, key],
    );
  }

  async function handleBrandSubmit() {
    try {
      await addBrand(brandName);
      setBrandName("");
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "브랜드 저장에 실패했습니다.");
    }
  }

  async function handleExerciseSubmit() {
    try {
      await addExercise(exerciseName, exerciseBodyPartId, exerciseType);
      setExerciseName("");
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "운동 저장에 실패했습니다.");
    }
  }

  async function handleMachineSubmit() {
    try {
      await addMachine({
        name: machineName,
        brandId: machineBrandId === "__custom__" ? null : machineBrandId,
        brandNameFallback: machineBrandId === "__custom__" ? machineBrandFallback : null,
        primaryBodyPartId: machineBodyPartId,
        templateKeys: selectedTemplateKeys,
      });
      setMachineName("");
      setMachineBrandFallback("");
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "머신 저장에 실패했습니다.");
    }
  }

  return (
    <div className="space-y-5">
      {state.mode === "supabase" ? (
        <Card className="bg-[linear-gradient(135deg,_rgba(16,37,63,0.98),_rgba(20,88,135,0.86))] text-white">
          <SectionHeading
            eyebrow="Shared library"
            title="머신과 브랜드는 공용 라이브러리로 저장됩니다"
            description="한 번 추가한 머신 정보는 다른 사용자도 선택할 수 있습니다."
          />
          <div className="mt-4 flex flex-wrap gap-2 text-sm text-white/75">
            <Pill className="bg-white/14 text-white">현재 모드: {state.mode}</Pill>
            {isSyncing ? <Pill className="bg-white/14 text-white">Supabase 동기화 중</Pill> : null}
            {syncError ? <Pill className="bg-[#a93f3a] text-white">{syncError}</Pill> : null}
          </div>
        </Card>
      ) : null}

      <section className="grid gap-4 xl:grid-cols-3">
        <Card className="space-y-4">
          <SectionHeading eyebrow="Custom brand" title="브랜드 추가" description="Supabase 로그인 상태에서는 공용 브랜드로 저장됩니다." />
          <input
            value={brandName}
            onChange={(event) => setBrandName(event.target.value)}
            placeholder="예: Arsenal Strength"
            className="w-full rounded-2xl border border-[#d5dfeb] bg-white px-4 py-3 text-sm outline-none ring-0"
          />
          <button type="button" className={buttonStyles("primary")} onClick={handleBrandSubmit} disabled={isSyncing}>
            <Plus className="mr-2 h-4 w-4" />
            브랜드 저장
          </button>
        </Card>

        <Card className="space-y-4">
          <SectionHeading eyebrow="Custom exercise" title="운동 추가" description="운동 정의는 로그인 사용자 기준 커스텀 항목으로 저장됩니다." />
          <input
            value={exerciseName}
            onChange={(event) => setExerciseName(event.target.value)}
            placeholder="예: 스미스 인클라인 프레스"
            className="w-full rounded-2xl border border-[#d5dfeb] bg-white px-4 py-3 text-sm outline-none ring-0"
          />
          <div className="grid grid-cols-2 gap-3">
            <select
              value={exerciseBodyPartId}
              onChange={(event) => setExerciseBodyPartId(event.target.value)}
              className="rounded-2xl border border-[#d5dfeb] bg-white px-4 py-3 text-sm"
            >
              {state.bodyParts.map((bodyPart) => (
                <option key={bodyPart.id} value={bodyPart.id}>
                  {bodyPart.name}
                </option>
              ))}
            </select>
            <select
              value={exerciseType}
              onChange={(event) => setExerciseType(event.target.value as (typeof exerciseTypes)[number])}
              className="rounded-2xl border border-[#d5dfeb] bg-white px-4 py-3 text-sm"
            >
              {exerciseTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
          <button type="button" className={buttonStyles("primary")} onClick={handleExerciseSubmit} disabled={isSyncing}>
            <Plus className="mr-2 h-4 w-4" />
            운동 저장
          </button>
        </Card>

        <Card className="space-y-4">
          <SectionHeading eyebrow="Custom machine" title="머신 추가" description="새 머신은 세팅 필드와 함께 공용 라이브러리에 등록됩니다." />
          <input
            value={machineName}
            onChange={(event) => setMachineName(event.target.value)}
            placeholder="예: Flat Chest Press"
            className="w-full rounded-2xl border border-[#d5dfeb] bg-white px-4 py-3 text-sm outline-none ring-0"
          />
          <div className="grid grid-cols-2 gap-3">
            <select
              value={machineBrandId}
              onChange={(event) => setMachineBrandId(event.target.value)}
              className="rounded-2xl border border-[#d5dfeb] bg-white px-4 py-3 text-sm"
            >
              <option value="__custom__">브랜드 직접 입력</option>
              {state.brands.map((brand) => (
                <option key={brand.id} value={brand.id}>
                  {brand.name}
                </option>
              ))}
            </select>
            <select
              value={machineBodyPartId}
              onChange={(event) => setMachineBodyPartId(event.target.value)}
              className="rounded-2xl border border-[#d5dfeb] bg-white px-4 py-3 text-sm"
            >
              {state.bodyParts.map((bodyPart) => (
                <option key={bodyPart.id} value={bodyPart.id}>
                  {bodyPart.name}
                </option>
              ))}
            </select>
          </div>
          {machineBrandId === "__custom__" ? (
            <input
              value={machineBrandFallback}
              onChange={(event) => setMachineBrandFallback(event.target.value)}
              placeholder="브랜드명 입력"
              className="w-full rounded-2xl border border-[#d5dfeb] bg-white px-4 py-3 text-sm outline-none ring-0"
            />
          ) : null}
          <div className="flex flex-wrap gap-2">
            {settingTemplatePresets.map((preset) => (
              <button
                key={preset.key}
                type="button"
                onClick={() => toggleTemplate(preset.key)}
                className={`rounded-full px-3 py-2 text-xs font-medium ${
                  selectedTemplateKeys.includes(preset.key)
                    ? "bg-[#10253f] text-white"
                    : "bg-[#eef4fb] text-[#345577]"
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
          <button type="button" className={buttonStyles("primary")} onClick={handleMachineSubmit} disabled={isSyncing}>
            <Plus className="mr-2 h-4 w-4" />
            머신 저장
          </button>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <Card>
          <SectionHeading eyebrow="Exercises" title={`${state.exercises.length}개 운동`} description="시스템 + 내 커스텀 운동" />
          <div className="mt-4 space-y-2">
            {state.exercises
              .slice()
              .sort((left, right) => left.name.localeCompare(right.name))
              .map((exercise) => (
                <div key={exercise.id} className="rounded-[20px] bg-[#f5f8fb] p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-[#10253f]">{exercise.name}</p>
                    <Pill className={exercise.isSystem ? "bg-white" : "bg-[#10253f] text-white"}>
                      {getSourceLabel({ isSystem: exercise.isSystem })}
                    </Pill>
                  </div>
                  <p className="mt-2 text-xs text-[#667b92]">
                    {getBodyPartName(exercise.primaryBodyPartId, state.bodyParts)} · {exercise.exerciseType}
                  </p>
                </div>
              ))}
          </div>
        </Card>

        <Card>
          <SectionHeading eyebrow="Brands" title={`${state.brands.length}개 브랜드`} description="기본 + 공용 + 내 브랜드" />
          <div className="mt-4 space-y-2">
            {state.brands
              .slice()
              .sort((left, right) => left.name.localeCompare(right.name))
              .map((brand) => (
                <div key={brand.id} className="rounded-[20px] bg-[#f5f8fb] p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-[#10253f]">{brand.name}</p>
                    <Pill className={brand.isSystem ? "bg-white" : "bg-[#10253f] text-white"}>
                      {getSourceLabel({ isSystem: brand.isSystem, isShared: brand.isShared })}
                    </Pill>
                  </div>
                </div>
              ))}
          </div>
        </Card>

        <Card>
          <SectionHeading eyebrow="Machines" title={`${state.machines.length}개 머신`} description="다른 사용자와 공유되는 공용 머신 포함" />
          <div className="mt-4 space-y-2">
            {state.machines
              .slice()
              .sort((left, right) => left.name.localeCompare(right.name))
              .map((machine) => (
                <div key={machine.id} className="rounded-[20px] bg-[#f5f8fb] p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-[#10253f]">{machine.name}</p>
                      <p className="mt-1 text-xs text-[#667b92]">
                        {getBrandName(machine, state.brands)} ·{" "}
                        {machine.primaryBodyPartId ? getBodyPartName(machine.primaryBodyPartId, state.bodyParts) : "부위 미지정"}
                      </p>
                    </div>
                    <Pill className={machine.isSystem ? "bg-white" : "bg-[#10253f] text-white"}>
                      {getSourceLabel({ isSystem: machine.isSystem, isShared: machine.isShared })}
                    </Pill>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {getMachineTemplates(machine.id, state.machineSettingTemplates).map((template) => (
                      <Pill key={template.id}>{template.fieldLabel}</Pill>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        </Card>
      </section>
    </div>
  );
}
