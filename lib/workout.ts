import { createId } from "@/lib/utils";
import { settingTemplatePresets } from "@/lib/mock-data";
import type {
  BodyPart,
  BrandDefinition,
  ExerciseDefinition,
  MachineDefinition,
  MachineSettingTemplate,
  NewMachineInput,
  SessionExercise,
  SessionExerciseSettingValue,
  SessionExerciseSet,
  WorkoutSession,
} from "@/types/domain";

export function getLookup<T extends { id: string }>(items: T[]) {
  return new Map(items.map((item) => [item.id, item]));
}

export function getMachineTemplates(machineId: string | null, templates: MachineSettingTemplate[]) {
  if (!machineId) {
    return [];
  }

  return templates
    .filter((template) => template.machineId === machineId)
    .sort((left, right) => left.sortOrder - right.sortOrder);
}

export function getBrandName(machine: MachineDefinition | null, brands: BrandDefinition[]) {
  if (!machine) {
    return "프리웨이트";
  }

  if (machine.brandId) {
    return brands.find((brand) => brand.id === machine.brandId)?.name ?? machine.brandNameFallback ?? "커스텀";
  }

  return machine.brandNameFallback ?? "커스텀";
}

export function getExerciseName(exerciseId: string, exercises: ExerciseDefinition[]) {
  return exercises.find((exercise) => exercise.id === exerciseId)?.name ?? "운동";
}

export function getBodyPartName(bodyPartId: string, bodyParts: BodyPart[]) {
  return bodyParts.find((bodyPart) => bodyPart.id === bodyPartId)?.name ?? bodyPartId;
}

export function createDefaultSet(setNumber: number, previousSet?: SessionExerciseSet): SessionExerciseSet {
  return {
    id: createId("set"),
    setNumber,
    weightValue: previousSet?.weightValue ?? null,
    reps: previousSet?.reps ?? null,
    isCompleted: previousSet?.isCompleted ?? false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function createEmptySessionExercise(exerciseDefinitionId: string, orderIndex: number): SessionExercise {
  return {
    id: createId("session_exercise"),
    exerciseDefinitionId,
    machineId: null,
    orderIndex,
    notes: "",
    settings: [],
    sets: [createDefaultSet(1), createDefaultSet(2), createDefaultSet(3)],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function syncSettingsWithTemplates(
  existing: SessionExerciseSettingValue[],
  templates: MachineSettingTemplate[],
  previous?: SessionExerciseSettingValue[],
) {
  return templates.map((template) => {
    const currentValue = existing.find((item) => item.templateId === template.id);
    const previousValue = previous?.find((item) => item.templateId === template.id);

    return {
      id: currentValue?.id ?? createId("setting"),
      templateId: template.id,
      valueText: currentValue?.valueText ?? previousValue?.valueText ?? "",
    };
  });
}

export function buildMachineTemplates(input: NewMachineInput, machineId: string): MachineSettingTemplate[] {
  return buildMachineTemplateDescriptors(input).map((template, index) => ({
    id: createId("template"),
    machineId,
    fieldKey: template.fieldKey,
    fieldLabel: template.fieldLabel,
    fieldType: template.fieldType,
    options: template.options,
    sortOrder: index + 1,
    createdAt: new Date().toISOString(),
  }));
}

export function buildMachineTemplateDescriptors(input: NewMachineInput) {
  return input.templateKeys.flatMap((key) => {
    const preset = settingTemplatePresets.find((item) => item.key === key);

    if (!preset) {
      return [];
    }

    return [
      {
        fieldKey: preset.key,
        fieldLabel: preset.label,
        fieldType: preset.fieldType,
        options: preset.options ? [...preset.options] : null,
      },
    ];
  });
}

export function summarizeSessionTitle(session: WorkoutSession, bodyParts: BodyPart[]) {
  if (session.title.trim()) {
    return session.title.trim();
  }

  if (session.bodyPartIds.length === 0) {
    return "세션 초안";
  }

  return session.bodyPartIds.map((bodyPartId) => getBodyPartName(bodyPartId, bodyParts)).join(" + ");
}
