"use client";

import { Plus } from "lucide-react";
import { useState } from "react";

import { useWorkoutApp } from "@/components/providers/workout-app-provider";
import { Card, Pill, SectionHeading, buttonStyles } from "@/components/ui";
import { settingTemplatePresets } from "@/lib/mock-data";
import { getBodyPartName, getBrandName, getMachineTemplates } from "@/lib/workout";
import { exerciseTypes } from "@/types/domain";

export function LibraryDashboard() {
  const { state, addBrand, addExercise, addMachine } = useWorkoutApp();
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

  return (
    <div className="space-y-5">
      <section className="grid gap-4 xl:grid-cols-3">
        <Card className="space-y-4">
          <SectionHeading eyebrow="Custom brand" title="브랜드 추가" description="기본 드롭다운에 없는 브랜드를 등록합니다." />
          <input
            value={brandName}
            onChange={(event) => setBrandName(event.target.value)}
            placeholder="예: Arsenal Strength"
            className="w-full rounded-2xl border border-[#d5dfeb] bg-white px-4 py-3 text-sm outline-none ring-0"
          />
          <button
            type="button"
            className={buttonStyles("primary")}
            onClick={() => {
              addBrand(brandName);
              setBrandName("");
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            브랜드 저장
          </button>
        </Card>

        <Card className="space-y-4">
          <SectionHeading eyebrow="Custom exercise" title="운동 추가" description="기본 라이브러리에 없는 운동을 추가합니다." />
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
          <button
            type="button"
            className={buttonStyles("primary")}
            onClick={() => {
              addExercise(exerciseName, exerciseBodyPartId, exerciseType);
              setExerciseName("");
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            운동 저장
          </button>
        </Card>

        <Card className="space-y-4">
          <SectionHeading eyebrow="Custom machine" title="머신 추가" description="브랜드와 세팅 필드를 함께 등록합니다." />
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
          <button
            type="button"
            className={buttonStyles("primary")}
            onClick={() => {
              addMachine({
                name: machineName,
                brandId: machineBrandId === "__custom__" ? null : machineBrandId,
                brandNameFallback: machineBrandId === "__custom__" ? machineBrandFallback : null,
                primaryBodyPartId: machineBodyPartId,
                templateKeys: selectedTemplateKeys,
              });
              setMachineName("");
              setMachineBrandFallback("");
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            머신 저장
          </button>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <Card>
          <SectionHeading eyebrow="Exercises" title={`${state.exercises.length}개 운동`} description="시스템 + 내 커스텀 운동" />
          <div className="mt-4 space-y-2">
            {state.exercises.slice().sort((left, right) => left.name.localeCompare(right.name)).map((exercise) => (
              <div key={exercise.id} className="rounded-[20px] bg-[#f5f8fb] p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-[#10253f]">{exercise.name}</p>
                  <Pill className={exercise.isSystem ? "bg-white" : "bg-[#10253f] text-white"}>
                    {exercise.isSystem ? "기본" : "커스텀"}
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
          <SectionHeading eyebrow="Brands" title={`${state.brands.length}개 브랜드`} description="기본 제공 + 추가 브랜드" />
          <div className="mt-4 space-y-2">
            {state.brands.slice().sort((left, right) => left.name.localeCompare(right.name)).map((brand) => (
              <div key={brand.id} className="rounded-[20px] bg-[#f5f8fb] p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-[#10253f]">{brand.name}</p>
                  <Pill className={brand.isSystem ? "bg-white" : "bg-[#10253f] text-white"}>
                    {brand.isSystem ? "기본" : "내 브랜드"}
                  </Pill>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <SectionHeading eyebrow="Machines" title={`${state.machines.length}개 머신`} description="세팅 필드까지 저장된 머신 목록" />
          <div className="mt-4 space-y-2">
            {state.machines.slice().sort((left, right) => left.name.localeCompare(right.name)).map((machine) => (
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
                    {machine.isSystem ? "기본" : "커스텀"}
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
