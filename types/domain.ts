export const bodyPartKeys = [
  "shoulders",
  "chest",
  "back",
  "biceps",
  "triceps",
  "abs",
  "quads",
  "hamstrings",
] as const;

export type BodyPartKey = (typeof bodyPartKeys)[number];

export const exerciseTypes = [
  "barbell",
  "dumbbell",
  "machine",
  "cable",
  "bodyweight",
  "other",
] as const;

export type ExerciseType = (typeof exerciseTypes)[number];

export const machineSettingFieldTypes = ["dropdown", "number", "text"] as const;

export type MachineSettingFieldType = (typeof machineSettingFieldTypes)[number];

export type AppMode = "demo" | "supabase";

export interface Profile {
  id: string;
  nickname: string | null;
  email: string;
  createdAt: string;
  updatedAt: string;
}

export interface BodyPart {
  id: string;
  key: BodyPartKey;
  name: string;
  color: string;
  displayOrder: number;
}

export interface ExerciseDefinition {
  id: string;
  ownerUserId: string | null;
  name: string;
  primaryBodyPartId: string;
  exerciseType: ExerciseType;
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BrandDefinition {
  id: string;
  ownerUserId: string | null;
  name: string;
  isSystem: boolean;
  createdAt: string;
}

export interface MachineDefinition {
  id: string;
  ownerUserId: string | null;
  brandId: string | null;
  brandNameFallback: string | null;
  name: string;
  primaryBodyPartId: string | null;
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MachineSettingTemplate {
  id: string;
  machineId: string;
  fieldKey: string;
  fieldLabel: string;
  fieldType: MachineSettingFieldType;
  options: string[] | null;
  sortOrder: number;
  createdAt: string;
}

export interface SessionExerciseSettingValue {
  id: string;
  templateId: string;
  valueText: string;
}

export interface SessionExerciseSet {
  id: string;
  setNumber: number;
  weightValue: number | null;
  reps: number | null;
  isCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SessionExercise {
  id: string;
  exerciseDefinitionId: string;
  machineId: string | null;
  orderIndex: number;
  notes: string;
  settings: SessionExerciseSettingValue[];
  sets: SessionExerciseSet[];
  createdAt: string;
  updatedAt: string;
}

export interface WorkoutSession {
  id: string;
  userId: string;
  sessionDate: string;
  title: string;
  notes: string;
  bodyPartIds: string[];
  exercises: SessionExercise[];
  createdAt: string;
  updatedAt: string;
}

export interface WorkoutAppState {
  mode: AppMode;
  profile: Profile | null;
  bodyParts: BodyPart[];
  exercises: ExerciseDefinition[];
  brands: BrandDefinition[];
  machines: MachineDefinition[];
  machineSettingTemplates: MachineSettingTemplate[];
  sessions: WorkoutSession[];
}

export interface NewExerciseInput {
  name: string;
  primaryBodyPartId: string;
  exerciseType: ExerciseType;
}

export interface NewMachineInput {
  name: string;
  brandId: string | null;
  brandNameFallback: string | null;
  primaryBodyPartId: string | null;
  templateKeys: string[];
}

export interface SessionComparison {
  currentSession: WorkoutSession | null;
  previousSession: WorkoutSession | null;
  volumeChange: number;
  totalSetsChange: number;
  exerciseCountChange: number;
}

export interface RecommendationBanner {
  id: string;
  title: string;
  detail: string;
  bodyPartId: string | null;
  tone: "warning" | "balance";
}

export interface WeeklyStats {
  workoutDays: number;
  totalSets: number;
  mostFrequentBodyPartId: string | null;
  leastFrequentBodyPartId: string | null;
  frequencyByBodyPart: Array<{ bodyPartId: string; count: number }>;
  volumeByDay: Array<{ date: string; volume: number }>;
  volumeByBodyPart: Array<{ bodyPartId: string; volume: number }>;
}

export interface MonthlyStats {
  workoutDays: number;
  frequencyByBodyPart: Array<{ bodyPartId: string; count: number }>;
  volumeByWeek: Array<{ label: string; volume: number }>;
  volumeByBodyPart: Array<{ bodyPartId: string; volume: number }>;
  recentFourWeeks: Array<{ label: string; volume: number }>;
}
