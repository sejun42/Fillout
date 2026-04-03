import type { User, SupabaseClient } from "@supabase/supabase-js";

import { createPersonalState } from "@/lib/mock-data";
import type {
  BrandDefinition,
  ExerciseDefinition,
  MachineDefinition,
  MachineSettingTemplate,
  Profile,
  SessionExercise,
  SessionExerciseSet,
  WorkoutAppState,
  WorkoutSession,
} from "@/types/domain";
import type { Database } from "@/types/supabase";

type AppSupabaseClient = SupabaseClient;

function assertNoError<T>(result: { data: T; error: { message: string } | null }, label: string): NonNullable<T> {
  if (result.error) {
    throw new Error(`${label}: ${result.error.message}`);
  }

  if (result.data == null) {
    throw new Error(`${label}: empty response`);
  }

  return result.data as NonNullable<T>;
}

function mapProfile(user: User, nickname: string | null): Profile {
  const fallbackUpdatedAt = new Date().toISOString();
  return {
    id: user.id,
    nickname: nickname ?? (typeof user.user_metadata?.nickname === "string" ? user.user_metadata.nickname : null),
    email: user.email ?? "",
    createdAt: user.created_at ?? fallbackUpdatedAt,
    updatedAt: fallbackUpdatedAt,
  };
}

function mapExercise(row: Database["public"]["Tables"]["exercise_definitions"]["Row"]): ExerciseDefinition {
  return {
    id: row.id,
    ownerUserId: row.owner_user_id,
    name: row.name,
    primaryBodyPartId: row.primary_body_part_id,
    exerciseType: row.exercise_type as ExerciseDefinition["exerciseType"],
    isSystem: row.is_system,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapBrand(row: Database["public"]["Tables"]["brand_definitions"]["Row"]): BrandDefinition {
  return {
    id: row.id,
    ownerUserId: row.owner_user_id,
    name: row.name,
    isSystem: row.is_system,
    isShared: row.is_shared ?? false,
    createdAt: row.created_at,
  };
}

function mapMachine(row: Database["public"]["Tables"]["machine_definitions"]["Row"]): MachineDefinition {
  return {
    id: row.id,
    ownerUserId: row.owner_user_id,
    brandId: row.brand_id,
    brandNameFallback: row.brand_name_fallback,
    name: row.name,
    primaryBodyPartId: row.primary_body_part_id,
    isSystem: row.is_system,
    isShared: row.is_shared ?? false,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapTemplate(row: Database["public"]["Tables"]["machine_setting_templates"]["Row"]): MachineSettingTemplate {
  return {
    id: row.id,
    machineId: row.machine_id,
    fieldKey: row.field_key,
    fieldLabel: row.field_label,
    fieldType: row.field_type as MachineSettingTemplate["fieldType"],
    options: Array.isArray(row.options_json)
      ? row.options_json.filter((value): value is string => typeof value === "string")
      : null,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
  };
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

async function loadProfileNickname(supabase: AppSupabaseClient, userId: string) {
  const result = await supabase.from("profiles").select("nickname").eq("id", userId).limit(1);

  if (result.error) {
    throw new Error(`Failed to load profile: ${result.error.message}`);
  }

  return (result.data as Array<{ nickname: string | null }>)[0]?.nickname ?? null;
}

export async function loadRemoteAppState(supabase: AppSupabaseClient, user: User): Promise<WorkoutAppState> {
  const nickname = await loadProfileNickname(supabase, user.id);
  const [
    bodyPartResult,
    exerciseResult,
    brandResult,
    machineResult,
    sessionResult,
  ] = await Promise.all([
    supabase.from("body_parts").select("*").order("display_order", { ascending: true }),
    supabase.from("exercise_definitions").select("*").order("name", { ascending: true }),
    supabase.from("brand_definitions").select("*").order("name", { ascending: true }),
    supabase.from("machine_definitions").select("*").order("name", { ascending: true }),
    supabase.from("workout_sessions").select("*").eq("user_id", user.id).order("session_date", { ascending: false }),
  ]);

  const profile = mapProfile(user, nickname);
  const baseState = createPersonalState(profile, "supabase");
  const bodyParts = assertNoError(bodyPartResult, "Failed to load body parts").map((row) => ({
    id: row.id,
    key: row.key as WorkoutAppState["bodyParts"][number]["key"],
    name: row.name_ko,
    color: row.color_hex,
    displayOrder: row.display_order,
  }));
  const exercises = assertNoError(exerciseResult, "Failed to load exercises").map(mapExercise);
  const brands = assertNoError(brandResult, "Failed to load brands").map(mapBrand);
  const machines = assertNoError(machineResult, "Failed to load machines").map(mapMachine);
  const sessionRows = assertNoError(sessionResult, "Failed to load workout sessions");

  const machineIds = machines.map((machine) => machine.id);
  const sessionIds = sessionRows.map((session) => session.id);

  const [templateResult, bodyPartLinkResult, sessionExerciseResult] = await Promise.all([
    machineIds.length
      ? supabase.from("machine_setting_templates").select("*").in("machine_id", machineIds).order("sort_order", { ascending: true })
      : Promise.resolve({ data: [], error: null }),
    sessionIds.length
      ? supabase.from("workout_session_body_parts").select("*").in("session_id", sessionIds)
      : Promise.resolve({ data: [], error: null }),
    sessionIds.length
      ? supabase.from("session_exercises").select("*").in("session_id", sessionIds).order("order_index", { ascending: true })
      : Promise.resolve({ data: [], error: null }),
  ]);

  const templates = assertNoError(templateResult, "Failed to load machine templates").map(mapTemplate);
  const bodyPartLinks = assertNoError(bodyPartLinkResult, "Failed to load session body parts");
  const sessionExerciseRows = assertNoError(sessionExerciseResult, "Failed to load session exercises");
  const sessionExerciseIds = sessionExerciseRows.map((exercise) => exercise.id);

  const [settingValueResult, setResult] = await Promise.all([
    sessionExerciseIds.length
      ? supabase.from("session_exercise_setting_values").select("*").in("session_exercise_id", sessionExerciseIds)
      : Promise.resolve({ data: [], error: null }),
    sessionExerciseIds.length
      ? supabase.from("session_exercise_sets").select("*").in("session_exercise_id", sessionExerciseIds).order("set_number", { ascending: true })
      : Promise.resolve({ data: [], error: null }),
  ]);

  const settingValues = assertNoError(settingValueResult, "Failed to load setting values");
  const setRows = assertNoError(setResult, "Failed to load session sets");

  const settingsByExerciseId = new Map<string, SessionExercise["settings"]>();
  for (const row of settingValues) {
    const current = settingsByExerciseId.get(row.session_exercise_id) ?? [];
    current.push({
      id: row.id,
      templateId: row.template_id,
      valueText: row.value_text,
    });
    settingsByExerciseId.set(row.session_exercise_id, current);
  }

  const setsByExerciseId = new Map<string, SessionExerciseSet[]>();
  for (const row of setRows) {
    const current = setsByExerciseId.get(row.session_exercise_id) ?? [];
    current.push({
      id: row.id,
      setNumber: row.set_number,
      weightValue: row.weight_value,
      reps: row.reps,
      isCompleted: row.is_completed,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
    setsByExerciseId.set(row.session_exercise_id, current);
  }

  const exercisesBySessionId = new Map<string, SessionExercise[]>();
  for (const row of sessionExerciseRows) {
    const current = exercisesBySessionId.get(row.session_id) ?? [];
    current.push({
      id: row.id,
      exerciseDefinitionId: row.exercise_definition_id,
      machineId: row.machine_id,
      orderIndex: row.order_index,
      notes: row.notes ?? "",
      settings: settingsByExerciseId.get(row.id) ?? [],
      sets: setsByExerciseId.get(row.id) ?? [],
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
    exercisesBySessionId.set(row.session_id, current);
  }

  const bodyPartIdsBySessionId = new Map<string, string[]>();
  for (const row of bodyPartLinks) {
    const current = bodyPartIdsBySessionId.get(row.session_id) ?? [];
    current.push(row.body_part_id);
    bodyPartIdsBySessionId.set(row.session_id, current);
  }

  const sessions: WorkoutSession[] = sessionRows.map((row) => ({
    id: row.id,
    userId: row.user_id,
    sessionDate: row.session_date,
    title: row.title ?? "",
    notes: row.notes ?? "",
    bodyPartIds: bodyPartIdsBySessionId.get(row.id) ?? [],
    exercises: (exercisesBySessionId.get(row.id) ?? []).sort((left, right) => left.orderIndex - right.orderIndex),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));

  return {
    ...baseState,
    bodyParts,
    exercises,
    brands,
    machines,
    machineSettingTemplates: templates,
    sessions,
  };
}

export async function saveSessionToSupabase(
  supabase: AppSupabaseClient,
  userId: string,
  session: WorkoutSession,
) {
  let sessionId = session.id;

  if (isUuid(session.id)) {
    const updated = await supabase
      .from("workout_sessions")
      .update({
        title: session.title || null,
        notes: session.notes || null,
        session_date: session.sessionDate,
      })
      .eq("id", session.id)
      .eq("user_id", userId)
      .select("id")
      .single();

    sessionId = assertNoError(updated, "Failed to update session").id;
  } else {
    const inserted = await supabase
      .from("workout_sessions")
      .insert({
        user_id: userId,
        session_date: session.sessionDate,
        title: session.title || null,
        notes: session.notes || null,
      })
      .select("id")
      .single();

    sessionId = assertNoError(inserted, "Failed to create session").id;
  }

  const existingExercisesResult = await supabase
    .from("session_exercises")
    .select("id")
    .eq("session_id", sessionId);
  const existingExerciseIds = assertNoError(existingExercisesResult, "Failed to inspect existing exercises").map(
    (row) => row.id,
  );

  if (existingExerciseIds.length > 0) {
    assertNoError(
      await supabase
        .from("session_exercise_setting_values")
        .delete()
        .in("session_exercise_id", existingExerciseIds),
      "Failed to clear setting values",
    );
    assertNoError(
      await supabase.from("session_exercise_sets").delete().in("session_exercise_id", existingExerciseIds),
      "Failed to clear sets",
    );
  }

  assertNoError(
    await supabase.from("session_exercises").delete().eq("session_id", sessionId),
    "Failed to clear exercises",
  );
  assertNoError(
    await supabase.from("workout_session_body_parts").delete().eq("session_id", sessionId),
    "Failed to clear body parts",
  );

  if (session.bodyPartIds.length > 0) {
    assertNoError(
      await supabase.from("workout_session_body_parts").insert(
        session.bodyPartIds.map((bodyPartId) => ({
          session_id: sessionId,
          body_part_id: bodyPartId,
        })),
      ),
      "Failed to save session body parts",
    );
  }

  if (session.exercises.length === 0) {
    return sessionId;
  }

  const insertedExercises = await supabase
    .from("session_exercises")
    .insert(
      session.exercises.map((exercise, index) => ({
        session_id: sessionId,
        exercise_definition_id: exercise.exerciseDefinitionId,
        machine_id: exercise.machineId,
        order_index: index + 1,
        notes: exercise.notes || null,
      })),
    )
    .select("id, order_index");

  const exerciseRows = assertNoError(insertedExercises, "Failed to save session exercises");
  const exerciseIdByOrder = new Map<number, string>(exerciseRows.map((row) => [row.order_index, row.id]));

  const settingRows: Database["public"]["Tables"]["session_exercise_setting_values"]["Insert"][] = [];
  const setRowsPayload: Database["public"]["Tables"]["session_exercise_sets"]["Insert"][] = [];

  for (const [index, exercise] of session.exercises.entries()) {
    const sessionExerciseId = exerciseIdByOrder.get(index + 1);
    if (!sessionExerciseId) {
      continue;
    }

    for (const setting of exercise.settings) {
      settingRows.push({
        session_exercise_id: sessionExerciseId,
        template_id: setting.templateId,
        value_text: setting.valueText,
      });
    }

    for (const set of exercise.sets) {
      setRowsPayload.push({
        session_exercise_id: sessionExerciseId,
        set_number: set.setNumber,
        weight_value: set.weightValue,
        reps: set.reps,
        is_completed: set.isCompleted,
      });
    }
  }

  if (settingRows.length > 0) {
    assertNoError(
      await supabase.from("session_exercise_setting_values").insert(settingRows),
      "Failed to save setting values",
    );
  }

  if (setRowsPayload.length > 0) {
    assertNoError(
      await supabase.from("session_exercise_sets").insert(setRowsPayload),
      "Failed to save sets",
    );
  }

  return sessionId;
}

export async function deleteSessionFromSupabase(
  supabase: AppSupabaseClient,
  userId: string,
  sessionId: string,
) {
  assertNoError(
    await supabase.from("workout_sessions").delete().eq("id", sessionId).eq("user_id", userId),
    "Failed to delete session",
  );
}

async function findVisibleBrandByName(supabase: AppSupabaseClient, name: string) {
  const result = await supabase
    .from("brand_definitions")
    .select("*")
    .ilike("name", name)
    .limit(1)
    .maybeSingle();

  if (result.error) {
    throw new Error(`Failed to inspect brands: ${result.error.message}`);
  }

  return result.data;
}

async function findVisibleMachineByIdentity(
  supabase: AppSupabaseClient,
  input: {
    name: string;
    brandId: string | null;
    brandNameFallback: string | null;
  },
) {
  const result = await supabase
    .from("machine_definitions")
    .select("*")
    .ilike("name", input.name)
    .limit(20);

  if (result.error) {
    throw new Error(`Failed to inspect machines: ${result.error.message}`);
  }

  const normalizedBrandFallback = input.brandNameFallback?.trim().toLowerCase() ?? null;

  return (
    result.data.find((machine) => {
      if (machine.name.toLowerCase() !== input.name.toLowerCase()) {
        return false;
      }

      if (input.brandId) {
        return machine.brand_id === input.brandId;
      }

      return (machine.brand_name_fallback ?? "").trim().toLowerCase() === (normalizedBrandFallback ?? "");
    }) ?? null
  );
}

export async function createSharedBrandInSupabase(
  supabase: AppSupabaseClient,
  userId: string,
  name: string,
) {
  const trimmed = name.trim();
  if (!trimmed) {
    throw new Error("브랜드명을 입력하세요.");
  }

  const existing = await findVisibleBrandByName(supabase, trimmed);
  if (existing) {
    return mapBrand(existing);
  }

  const inserted = await supabase
    .from("brand_definitions")
    .insert({
      owner_user_id: userId,
      name: trimmed,
      is_system: false,
      is_shared: true,
    })
    .select("*")
    .single();

  return mapBrand(assertNoError(inserted, "Failed to create shared brand"));
}

export async function createExerciseInSupabase(
  supabase: AppSupabaseClient,
  userId: string,
  input: {
    name: string;
    primaryBodyPartId: string;
    exerciseType: string;
  },
) {
  const trimmed = input.name.trim();
  if (!trimmed) {
    throw new Error("운동명을 입력하세요.");
  }

  const existingResult = await supabase
    .from("exercise_definitions")
    .select("*")
    .eq("owner_user_id", userId)
    .ilike("name", trimmed)
    .limit(1)
    .maybeSingle();
  if (existingResult.error) {
    throw new Error(`Failed to inspect exercises: ${existingResult.error.message}`);
  }

  const existing = existingResult.data;
  if (existing) {
    return mapExercise(existing);
  }

  const inserted = await supabase
    .from("exercise_definitions")
    .insert({
      owner_user_id: userId,
      name: trimmed,
      primary_body_part_id: input.primaryBodyPartId,
      exercise_type: input.exerciseType,
      is_system: false,
    })
    .select("*")
    .single();

  return mapExercise(assertNoError(inserted, "Failed to create exercise"));
}

export async function createSharedMachineInSupabase(
  supabase: AppSupabaseClient,
  userId: string,
  input: {
    name: string;
    brandId: string | null;
    brandNameFallback: string | null;
    primaryBodyPartId: string | null;
    templates: Array<{
      fieldKey: string;
      fieldLabel: string;
      fieldType: string;
      options: string[] | null;
      sortOrder: number;
    }>;
  },
) {
  const trimmed = input.name.trim();
  if (!trimmed) {
    throw new Error("머신명을 입력하세요.");
  }

  const trimmedBrandFallback = input.brandNameFallback?.trim() || null;
  if (!input.brandId && !trimmedBrandFallback) {
    throw new Error("브랜드를 선택하거나 직접 입력하세요.");
  }

  let brandId = input.brandId;
  if (!brandId && trimmedBrandFallback) {
    brandId = (await createSharedBrandInSupabase(supabase, userId, trimmedBrandFallback)).id;
  }

  const existing = await findVisibleMachineByIdentity(supabase, {
    name: trimmed,
    brandId,
    brandNameFallback: brandId ? null : trimmedBrandFallback,
  });
  if (existing) {
    return mapMachine(existing);
  }

  const insertedMachine = await supabase
    .from("machine_definitions")
    .insert({
      owner_user_id: userId,
      brand_id: brandId,
      brand_name_fallback: brandId ? null : trimmedBrandFallback,
      name: trimmed,
      primary_body_part_id: input.primaryBodyPartId,
      is_system: false,
      is_shared: true,
    })
    .select("*")
    .single();

  const machine = mapMachine(assertNoError(insertedMachine, "Failed to create machine"));

  if (input.templates.length > 0) {
    assertNoError(
      await supabase.from("machine_setting_templates").insert(
        input.templates.map((template) => ({
          machine_id: machine.id,
          field_key: template.fieldKey,
          field_label: template.fieldLabel,
          field_type: template.fieldType,
          options_json: template.options,
          sort_order: template.sortOrder,
        })),
      ),
      "Failed to create machine templates",
    );
  }

  return machine;
}
