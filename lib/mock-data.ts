import { subDays } from "date-fns";

import { toIsoDate } from "@/lib/date";
import { createId } from "@/lib/utils";
import type {
  BodyPart,
  BrandDefinition,
  ExerciseDefinition,
  ExerciseType,
  MachineDefinition,
  MachineSettingFieldType,
  MachineSettingTemplate,
  Profile,
  SessionExercise,
  SessionExerciseSet,
  WorkoutAppState,
  WorkoutSession,
} from "@/types/domain";

const now = new Date().toISOString();

export const bodyParts: BodyPart[] = [
  { id: "shoulders", key: "shoulders", name: "어깨", color: "#f4c542", displayOrder: 1 },
  { id: "chest", key: "chest", name: "가슴", color: "#e35d5b", displayOrder: 2 },
  { id: "back", key: "back", name: "등", color: "#4f7cff", displayOrder: 3 },
  { id: "biceps", key: "biceps", name: "이두", color: "#8b5cf6", displayOrder: 4 },
  { id: "triceps", key: "triceps", name: "삼두", color: "#f28a2e", displayOrder: 5 },
  { id: "abs", key: "abs", name: "복근", color: "#7a8698", displayOrder: 6 },
  { id: "quads", key: "quads", name: "전면하체", color: "#2bb673", displayOrder: 7 },
  { id: "hamstrings", key: "hamstrings", name: "후면하체", color: "#117a54", displayOrder: 8 },
];

const exerciseCatalog = [
  ["bb-bench", "바벨 벤치프레스", "chest", "barbell"],
  ["incline-bb-bench", "인클라인 바벨 벤치프레스", "chest", "barbell"],
  ["db-bench", "덤벨 벤치프레스", "chest", "dumbbell"],
  ["incline-db-bench", "인클라인 덤벨 벤치프레스", "chest", "dumbbell"],
  ["machine-chest-press", "체스트프레스 머신", "chest", "machine"],
  ["pec-dec-fly", "펙덱 플라이", "chest", "machine"],
  ["cable-fly", "케이블 플라이", "chest", "cable"],
  ["dips", "딥스", "chest", "bodyweight"],
  ["push-up", "푸시업", "chest", "bodyweight"],
  ["pull-up", "풀업", "back", "bodyweight"],
  ["lat-pulldown", "랫풀다운", "back", "machine"],
  ["bb-row", "바벨 로우", "back", "barbell"],
  ["db-row", "덤벨로우", "back", "dumbbell"],
  ["one-arm-db-row", "원암 덤벨로우", "back", "dumbbell"],
  ["incline-db-row", "인클라인 덤벨로우", "back", "dumbbell"],
  ["seated-cable-row", "시티드 케이블 로우", "back", "cable"],
  ["tbar-row", "T바 로우", "back", "machine"],
  ["machine-row", "머신 로우", "back", "machine"],
  ["straight-arm-pulldown", "스트레이트암 풀다운", "back", "cable"],
  ["long-pull", "롱풀", "back", "machine"],
  ["bb-ohp", "바벨 오버헤드프레스", "shoulders", "barbell"],
  ["db-shoulder-press", "덤벨 숄더프레스", "shoulders", "dumbbell"],
  ["machine-shoulder-press", "머신 숄더프레스", "shoulders", "machine"],
  ["side-lateral-raise", "사이드 레터럴 레이즈", "shoulders", "dumbbell"],
  ["rear-delt-fly", "리어델트 플라이", "shoulders", "machine"],
  ["face-pull", "페이스풀", "shoulders", "cable"],
  ["front-raise", "프론트 레이즈", "shoulders", "dumbbell"],
  ["bb-curl", "바벨 컬", "biceps", "barbell"],
  ["ez-bar-curl", "EZ바 컬", "biceps", "barbell"],
  ["db-curl", "덤벨 컬", "biceps", "dumbbell"],
  ["hammer-curl", "해머 컬", "biceps", "dumbbell"],
  ["preacher-curl", "프리처 컬", "biceps", "machine"],
  ["cable-curl", "케이블 컬", "biceps", "cable"],
  ["cable-pushdown", "케이블 푸시다운", "triceps", "cable"],
  ["overhead-extension", "오버헤드 익스텐션", "triceps", "cable"],
  ["skullcrusher", "스컬크러셔", "triceps", "barbell"],
  ["close-grip-bench", "클로즈그립 벤치프레스", "triceps", "barbell"],
  ["machine-triceps-extension", "머신 트라이셉스 익스텐션", "triceps", "machine"],
  ["crunch", "크런치", "abs", "bodyweight"],
  ["cable-crunch", "케이블 크런치", "abs", "cable"],
  ["leg-raise", "레그레이즈", "abs", "bodyweight"],
  ["hanging-leg-raise", "행잉 레그레이즈", "abs", "bodyweight"],
  ["plank", "플랭크", "abs", "bodyweight"],
  ["ab-machine", "앱도미널 머신", "abs", "machine"],
  ["back-squat", "백스쿼트", "quads", "barbell"],
  ["front-squat", "프론트스쿼트", "quads", "barbell"],
  ["leg-press", "레그프레스", "quads", "machine"],
  ["hack-squat", "핵스쿼트", "quads", "machine"],
  ["lunge", "런지", "quads", "dumbbell"],
  ["bulgarian-split-squat", "불가리안 스플릿 스쿼트", "quads", "dumbbell"],
  ["leg-extension", "레그 익스텐션", "quads", "machine"],
  ["deadlift", "데드리프트", "hamstrings", "barbell"],
  ["romanian-deadlift", "루마니안 데드리프트", "hamstrings", "barbell"],
  ["leg-curl", "레그 컬", "hamstrings", "machine"],
  ["hip-thrust", "힙 쓰러스트", "hamstrings", "barbell"],
  ["good-morning", "굿모닝", "hamstrings", "barbell"],
  ["glute-ham-raise", "글루트햄 레이즈", "hamstrings", "bodyweight"],
  ["back-extension", "백 익스텐션", "hamstrings", "bodyweight"],
] as const satisfies ReadonlyArray<
  readonly [slug: string, name: string, bodyPartId: string, exerciseType: ExerciseType]
>;

export const systemExercises: ExerciseDefinition[] = exerciseCatalog.map(
  ([slug, name, primaryBodyPartId, exerciseType]) => ({
    id: `exercise:${slug}`,
    ownerUserId: null,
    name,
    primaryBodyPartId,
    exerciseType,
    isSystem: true,
    createdAt: now,
    updatedAt: now,
  }),
);

const brandNames = [
  "Hammer Strength",
  "Technogym",
  "Life Fitness",
  "Matrix",
  "Cybex",
  "Gym80",
  "Panatta",
  "Atlantis",
  "Prime",
  "Nautilus",
  "Newtech",
  "DRAX",
] as const;

export const systemBrands: BrandDefinition[] = brandNames.map((name) => ({
  id: `brand:${name.toLowerCase().replace(/\s+/g, "-")}`,
  ownerUserId: null,
  name,
  isSystem: true,
  createdAt: now,
}));

function brandId(name: string) {
  return `brand:${name.toLowerCase().replace(/\s+/g, "-")}`;
}

export const systemMachines: MachineDefinition[] = [
  {
    id: "machine:drax-incline-chest-press",
    ownerUserId: null,
    brandId: brandId("DRAX"),
    brandNameFallback: null,
    name: "Incline Chest Press",
    primaryBodyPartId: "chest",
    isSystem: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "machine:matrix-lat-pulldown",
    ownerUserId: null,
    brandId: brandId("Matrix"),
    brandNameFallback: null,
    name: "Lat Pulldown",
    primaryBodyPartId: "back",
    isSystem: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "machine:technogym-shoulder-press",
    ownerUserId: null,
    brandId: brandId("Technogym"),
    brandNameFallback: null,
    name: "Shoulder Press",
    primaryBodyPartId: "shoulders",
    isSystem: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "machine:newtech-leg-press",
    ownerUserId: null,
    brandId: brandId("Newtech"),
    brandNameFallback: null,
    name: "45 Leg Press",
    primaryBodyPartId: "quads",
    isSystem: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "machine:drax-leg-curl",
    ownerUserId: null,
    brandId: brandId("DRAX"),
    brandNameFallback: null,
    name: "Seated Leg Curl",
    primaryBodyPartId: "hamstrings",
    isSystem: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "machine:hammer-row",
    ownerUserId: null,
    brandId: brandId("Hammer Strength"),
    brandNameFallback: null,
    name: "Iso-Lateral Row",
    primaryBodyPartId: "back",
    isSystem: true,
    createdAt: now,
    updatedAt: now,
  },
];

export const settingTemplatePresets = [
  {
    key: "seat_height",
    label: "안장 높이",
    fieldType: "dropdown",
    options: Array.from({ length: 10 }, (_, index) => String(index + 1)),
  },
  {
    key: "pad_position",
    label: "패드 위치",
    fieldType: "dropdown",
    options: Array.from({ length: 5 }, (_, index) => String(index + 1)),
  },
  {
    key: "handle_position",
    label: "손잡이 위치",
    fieldType: "dropdown",
    options: Array.from({ length: 7 }, (_, index) => String(index + 1)),
  },
  {
    key: "footplate_position",
    label: "발판 위치",
    fieldType: "dropdown",
    options: Array.from({ length: 7 }, (_, index) => String(index + 1)),
  },
  {
    key: "backrest_position",
    label: "등받이 위치",
    fieldType: "dropdown",
    options: Array.from({ length: 6 }, (_, index) => String(index + 1)),
  },
  {
    key: "angle",
    label: "각도",
    fieldType: "number",
    options: null,
  },
  {
    key: "notes",
    label: "기타 메모",
    fieldType: "text",
    options: null,
  },
] as const satisfies ReadonlyArray<{
  key: string;
  label: string;
  fieldType: MachineSettingFieldType;
  options: string[] | null;
}>;

const machinePresetAssignments: Record<string, string[]> = {
  "machine:drax-incline-chest-press": ["seat_height", "pad_position", "angle"],
  "machine:matrix-lat-pulldown": ["seat_height", "handle_position"],
  "machine:technogym-shoulder-press": ["seat_height", "backrest_position"],
  "machine:newtech-leg-press": ["seat_height", "footplate_position", "angle"],
  "machine:drax-leg-curl": ["seat_height", "pad_position"],
  "machine:hammer-row": ["seat_height", "handle_position", "chest_support"],
};

export const machineSettingTemplates: MachineSettingTemplate[] = Object.entries(
  machinePresetAssignments,
).flatMap(([machineId, keys]) =>
  keys.map((fieldKey, index) => {
    const preset =
      settingTemplatePresets.find((item) => item.key === fieldKey) ??
      ({
        key: "chest_support",
        label: "가슴 지지 위치",
        fieldType: "dropdown",
        options: ["1", "2", "3", "4", "5"],
      } as const);

    return {
      id: `template:${machineId}:${fieldKey}`,
      machineId,
      fieldKey,
      fieldLabel: preset.label,
      fieldType: preset.fieldType,
      options: preset.options ? [...preset.options] : null,
      sortOrder: index + 1,
      createdAt: now,
    };
  }),
);

export const demoProfile: Profile = {
  id: "user:demo-athlete",
  nickname: "Demo Athlete",
  email: "demo@fillout.fit",
  createdAt: now,
  updatedAt: now,
};

function makeSet(setNumber: number, weightValue: number | null, reps: number | null, completed = true): SessionExerciseSet {
  return {
    id: `set:${setNumber}:${weightValue ?? "bw"}:${reps ?? "na"}:${createId("row")}`,
    setNumber,
    weightValue,
    reps,
    isCompleted: completed,
    createdAt: now,
    updatedAt: now,
  };
}

function makeExercise(options: {
  id: string;
  exerciseDefinitionId: string;
  machineId?: string | null;
  notes?: string;
  settings?: Array<{ templateId: string; valueText: string }>;
  sets: Array<[weight: number | null, reps: number | null, completed?: boolean]>;
}): SessionExercise {
  return {
    id: options.id,
    exerciseDefinitionId: options.exerciseDefinitionId,
    machineId: options.machineId ?? null,
    orderIndex: Number(options.id.split(":").at(-1) ?? 0),
    notes: options.notes ?? "",
    settings:
      options.settings?.map((setting) => ({
        id: createId("setting"),
        templateId: setting.templateId,
        valueText: setting.valueText,
      })) ?? [],
    sets: options.sets.map(([weight, reps, completed], index) =>
      makeSet(index + 1, weight, reps, completed),
    ),
    createdAt: now,
    updatedAt: now,
  };
}

function makeSession(
  dateOffset: number,
  bodyPartIds: string[],
  exercises: SessionExercise[],
  title: string,
  notes = "",
): WorkoutSession {
  const sessionDate = toIsoDate(subDays(new Date(), dateOffset));
  return {
    id: `session:${sessionDate}`,
    userId: demoProfile.id,
    sessionDate,
    title,
    notes,
    bodyPartIds,
    exercises,
    createdAt: now,
    updatedAt: now,
  };
}

export const demoSessions: WorkoutSession[] = [
  makeSession(
    1,
    ["chest", "triceps"],
    [
      makeExercise({
        id: "exercise-session:1",
        exerciseDefinitionId: "exercise:bb-bench",
        sets: [
          [80, 8],
          [82.5, 6],
          [80, 7],
        ],
      }),
      makeExercise({
        id: "exercise-session:2",
        exerciseDefinitionId: "exercise:machine-chest-press",
        machineId: "machine:drax-incline-chest-press",
        settings: [
          {
            templateId: "template:machine:drax-incline-chest-press:seat_height",
            valueText: "4",
          },
          {
            templateId: "template:machine:drax-incline-chest-press:pad_position",
            valueText: "2",
          },
          {
            templateId: "template:machine:drax-incline-chest-press:angle",
            valueText: "30",
          },
        ],
        sets: [
          [55, 12],
          [60, 10],
          [60, 9],
        ],
      }),
      makeExercise({
        id: "exercise-session:3",
        exerciseDefinitionId: "exercise:cable-pushdown",
        sets: [
          [35, 15],
          [40, 12],
          [40, 11],
        ],
      }),
    ],
    "가슴 + 삼두",
    "체스트프레스 세팅 유지",
  ),
  makeSession(
    3,
    ["back", "biceps"],
    [
      makeExercise({
        id: "exercise-session:4",
        exerciseDefinitionId: "exercise:lat-pulldown",
        machineId: "machine:matrix-lat-pulldown",
        settings: [
          {
            templateId: "template:machine:matrix-lat-pulldown:seat_height",
            valueText: "5",
          },
          {
            templateId: "template:machine:matrix-lat-pulldown:handle_position",
            valueText: "3",
          },
        ],
        sets: [
          [55, 12],
          [60, 10],
          [60, 10],
        ],
      }),
      makeExercise({
        id: "exercise-session:5",
        exerciseDefinitionId: "exercise:machine-row",
        machineId: "machine:hammer-row",
        settings: [
          {
            templateId: "template:machine:hammer-row:seat_height",
            valueText: "3",
          },
          {
            templateId: "template:machine:hammer-row:handle_position",
            valueText: "2",
          },
        ],
        sets: [
          [45, 12],
          [50, 10],
          [55, 8],
        ],
      }),
      makeExercise({
        id: "exercise-session:6",
        exerciseDefinitionId: "exercise:hammer-curl",
        sets: [
          [16, 12],
          [16, 11],
          [18, 8],
        ],
      }),
    ],
    "등 + 이두",
  ),
  makeSession(
    5,
    ["quads", "hamstrings"],
    [
      makeExercise({
        id: "exercise-session:7",
        exerciseDefinitionId: "exercise:leg-press",
        machineId: "machine:newtech-leg-press",
        settings: [
          {
            templateId: "template:machine:newtech-leg-press:seat_height",
            valueText: "6",
          },
          {
            templateId: "template:machine:newtech-leg-press:footplate_position",
            valueText: "4",
          },
          {
            templateId: "template:machine:newtech-leg-press:angle",
            valueText: "18",
          },
        ],
        sets: [
          [180, 15],
          [220, 12],
          [240, 10],
        ],
      }),
      makeExercise({
        id: "exercise-session:8",
        exerciseDefinitionId: "exercise:romanian-deadlift",
        sets: [
          [90, 10],
          [100, 8],
          [100, 8],
        ],
      }),
      makeExercise({
        id: "exercise-session:9",
        exerciseDefinitionId: "exercise:leg-curl",
        machineId: "machine:drax-leg-curl",
        settings: [
          {
            templateId: "template:machine:drax-leg-curl:seat_height",
            valueText: "4",
          },
          {
            templateId: "template:machine:drax-leg-curl:pad_position",
            valueText: "3",
          },
        ],
        sets: [
          [35, 15],
          [40, 12],
          [40, 10],
        ],
      }),
    ],
    "하체",
  ),
  makeSession(
    8,
    ["shoulders", "abs"],
    [
      makeExercise({
        id: "exercise-session:10",
        exerciseDefinitionId: "exercise:machine-shoulder-press",
        machineId: "machine:technogym-shoulder-press",
        settings: [
          {
            templateId: "template:machine:technogym-shoulder-press:seat_height",
            valueText: "3",
          },
          {
            templateId: "template:machine:technogym-shoulder-press:backrest_position",
            valueText: "2",
          },
        ],
        sets: [
          [35, 12],
          [40, 10],
          [40, 9],
        ],
      }),
      makeExercise({
        id: "exercise-session:11",
        exerciseDefinitionId: "exercise:side-lateral-raise",
        sets: [
          [8, 20],
          [8, 18],
          [10, 12],
        ],
      }),
      makeExercise({
        id: "exercise-session:12",
        exerciseDefinitionId: "exercise:cable-crunch",
        sets: [
          [25, 20],
          [30, 15],
          [30, 15],
        ],
      }),
    ],
    "어깨 + 복근",
  ),
  makeSession(
    11,
    ["chest", "triceps", "abs"],
    [
      makeExercise({
        id: "exercise-session:13",
        exerciseDefinitionId: "exercise:incline-db-bench",
        sets: [
          [28, 12],
          [30, 10],
          [30, 9],
        ],
      }),
      makeExercise({
        id: "exercise-session:14",
        exerciseDefinitionId: "exercise:machine-chest-press",
        machineId: "machine:drax-incline-chest-press",
        settings: [
          {
            templateId: "template:machine:drax-incline-chest-press:seat_height",
            valueText: "4",
          },
          {
            templateId: "template:machine:drax-incline-chest-press:pad_position",
            valueText: "2",
          },
          {
            templateId: "template:machine:drax-incline-chest-press:angle",
            valueText: "25",
          },
        ],
        sets: [
          [50, 12],
          [55, 10],
          [55, 9],
        ],
      }),
      makeExercise({
        id: "exercise-session:15",
        exerciseDefinitionId: "exercise:overhead-extension",
        sets: [
          [20, 15],
          [22.5, 12],
          [22.5, 10],
        ],
      }),
    ],
    "가슴 상부 + 삼두",
  ),
  makeSession(
    14,
    ["back"],
    [
      makeExercise({
        id: "exercise-session:16",
        exerciseDefinitionId: "exercise:pull-up",
        sets: [
          [null, 10],
          [null, 8],
          [null, 7],
        ],
      }),
      makeExercise({
        id: "exercise-session:17",
        exerciseDefinitionId: "exercise:seated-cable-row",
        sets: [
          [45, 15],
          [50, 12],
          [55, 10],
        ],
      }),
      makeExercise({
        id: "exercise-session:18",
        exerciseDefinitionId: "exercise:straight-arm-pulldown",
        sets: [
          [20, 15],
          [25, 12],
          [25, 12],
        ],
      }),
    ],
    "등 볼륨데이",
  ),
  makeSession(
    18,
    ["quads"],
    [
      makeExercise({
        id: "exercise-session:19",
        exerciseDefinitionId: "exercise:back-squat",
        sets: [
          [100, 8],
          [105, 6],
          [100, 7],
        ],
      }),
      makeExercise({
        id: "exercise-session:20",
        exerciseDefinitionId: "exercise:leg-extension",
        sets: [
          [45, 15],
          [50, 12],
          [55, 10],
        ],
      }),
    ],
    "전면하체 집중",
  ),
];

export function createEmptySession(userId: string, sessionDate: string): WorkoutSession {
  return {
    id: `session:${sessionDate}:${createId("draft")}`,
    userId,
    sessionDate,
    title: "",
    notes: "",
    bodyPartIds: [],
    exercises: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function createSeedState(): WorkoutAppState {
  return {
    mode: "demo",
    profile: demoProfile,
    bodyParts,
    exercises: systemExercises,
    brands: systemBrands,
    machines: systemMachines,
    machineSettingTemplates,
    sessions: demoSessions,
  };
}
