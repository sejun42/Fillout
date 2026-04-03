"use client";

import { createContext, startTransition, useContext, useEffect, useState } from "react";

import { createDemoState, createPersonalState, createSeedState, createLoggedOutState, demoProfile } from "@/lib/mock-data";
import { buildMachineTemplates } from "@/lib/workout";
import { createId } from "@/lib/utils";
import type {
  AppMode,
  BrandDefinition,
  ExerciseType,
  NewMachineInput,
  Profile,
  WorkoutAppState,
  WorkoutSession,
} from "@/types/domain";

const LEGACY_STORAGE_KEY = "fillout-mvp-state";
const STORAGE_PREFIX = "fillout-mvp-state";
const ACTIVE_STORAGE_KEY = "fillout-mvp-active-workspace";

interface WorkoutAppContextValue {
  state: WorkoutAppState;
  hydrated: boolean;
  supabaseConfigured: boolean;
  signIn: (email: string, mode?: AppMode) => void;
  signOut: () => void;
  saveSession: (session: WorkoutSession) => void;
  deleteSession: (sessionId: string) => void;
  addBrand: (name: string) => void;
  addExercise: (name: string, primaryBodyPartId: string, exerciseType: ExerciseType) => void;
  addMachine: (input: NewMachineInput) => void;
}

const WorkoutAppContext = createContext<WorkoutAppContextValue | null>(null);

function createProfile(email: string): Profile {
  const now = new Date().toISOString();
  return {
    id: `user:${email.toLowerCase()}`,
    nickname: email.split("@")[0] ?? "athlete",
    email,
    createdAt: now,
    updatedAt: now,
  };
}

function getWorkspaceStorageKey(profile: Profile | null, mode: AppMode) {
  if (mode === "demo") {
    return `${STORAGE_PREFIX}:demo`;
  }

  if (!profile) {
    return null;
  }

  return `${STORAGE_PREFIX}:user:${profile.email.toLowerCase()}`;
}

function parseState(value: string | null) {
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value) as WorkoutAppState;
  } catch {
    return null;
  }
}

function shouldMigrateLegacyState(state: WorkoutAppState) {
  if (state.profile?.email === demoProfile.email) {
    return "demo" as const;
  }

  if (!state.profile) {
    return null;
  }

  const ownsEverySession = state.sessions.every((session) => session.userId === state.profile?.id);
  return ownsEverySession ? ("user" as const) : null;
}

export function WorkoutAppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<WorkoutAppState>(() => createSeedState());
  const [hydrated, setHydrated] = useState(false);
  const supabaseConfigured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );

  useEffect(() => {
    const legacyState = parseState(window.localStorage.getItem(LEGACY_STORAGE_KEY));
    const activeWorkspace = window.localStorage.getItem(ACTIVE_STORAGE_KEY);

    startTransition(() => {
      if (legacyState) {
        const migrationTarget = shouldMigrateLegacyState(legacyState);
        if (migrationTarget === "demo") {
          window.localStorage.setItem(`${STORAGE_PREFIX}:demo`, JSON.stringify(createDemoState()));
        } else if (migrationTarget === "user" && legacyState.profile) {
          const profile = legacyState.profile;
          const key = getWorkspaceStorageKey(profile, legacyState.mode) ?? `${STORAGE_PREFIX}:user:${profile.email.toLowerCase()}`;
          window.localStorage.setItem(
            key,
            JSON.stringify({
              ...legacyState,
              profile,
            }),
          );
        }

        window.localStorage.removeItem(LEGACY_STORAGE_KEY);
      }

      if (activeWorkspace) {
        const storedState = parseState(window.localStorage.getItem(activeWorkspace));
        if (storedState) {
          setState(storedState);
          setHydrated(true);
          return;
        }
      }

      setState(createLoggedOutState());
      setHydrated(true);
    });
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    const storageKey = getWorkspaceStorageKey(state.profile, state.mode);
    if (storageKey) {
      window.localStorage.setItem(storageKey, JSON.stringify(state));
      window.localStorage.setItem(ACTIVE_STORAGE_KEY, storageKey);
      return;
    }

    window.localStorage.removeItem(ACTIVE_STORAGE_KEY);
  }, [hydrated, state]);

  const value: WorkoutAppContextValue = {
    state,
    hydrated,
    supabaseConfigured,
    signIn(email, mode = "demo") {
      if (mode === "demo") {
        const demoState = parseState(window.localStorage.getItem(`${STORAGE_PREFIX}:demo`)) ?? createDemoState();
        setState(demoState);
        return;
      }

      const profile = createProfile(email);
      const storageKey = getWorkspaceStorageKey(profile, mode);
      const storedState = storageKey ? parseState(window.localStorage.getItem(storageKey)) : null;

      setState(
        storedState
          ? {
              ...storedState,
              mode,
              profile,
            }
          : createPersonalState(profile, mode),
      );
    },
    signOut() {
      setState(createLoggedOutState());
    },
    saveSession(session) {
      setState((current) => {
        const updatedSession = {
          ...session,
          updatedAt: new Date().toISOString(),
        };
        const nextSessions = current.sessions.some((item) => item.id === updatedSession.id)
          ? current.sessions.map((item) => (item.id === updatedSession.id ? updatedSession : item))
          : [updatedSession, ...current.sessions];

        return {
          ...current,
          sessions: nextSessions.sort((left, right) => right.sessionDate.localeCompare(left.sessionDate)),
        };
      });
    },
    deleteSession(sessionId) {
      setState((current) => ({
        ...current,
        sessions: current.sessions.filter((session) => session.id !== sessionId),
      }));
    },
    addBrand(name) {
      const trimmed = name.trim();
      if (!trimmed) {
        return;
      }

      setState((current) => {
        const exists = current.brands.some((brand) => brand.name.toLowerCase() === trimmed.toLowerCase());
        if (exists) {
          return current;
        }

        const brand: BrandDefinition = {
          id: createId("brand"),
          ownerUserId: current.profile?.id ?? null,
          name: trimmed,
          isSystem: false,
          createdAt: new Date().toISOString(),
        };

        return {
          ...current,
          brands: [...current.brands, brand],
        };
      });
    },
    addExercise(name, primaryBodyPartId, exerciseType) {
      const trimmed = name.trim();
      if (!trimmed) {
        return;
      }

      setState((current) => {
        const exists = current.exercises.some((exercise) => exercise.name.toLowerCase() === trimmed.toLowerCase());
        if (exists) {
          return current;
        }

        return {
          ...current,
          exercises: [
            ...current.exercises,
            {
              id: createId("exercise"),
              ownerUserId: current.profile?.id ?? null,
              name: trimmed,
              primaryBodyPartId,
              exerciseType,
              isSystem: false,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ],
        };
      });
    },
    addMachine(input) {
      const trimmed = input.name.trim();
      if (!trimmed) {
        return;
      }

      setState((current) => {
        const machineId = createId("machine");
        const machine = {
          id: machineId,
          ownerUserId: current.profile?.id ?? null,
          brandId: input.brandId,
          brandNameFallback: input.brandNameFallback,
          name: trimmed,
          primaryBodyPartId: input.primaryBodyPartId,
          isSystem: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        return {
          ...current,
          machines: [...current.machines, machine],
          machineSettingTemplates: [
            ...current.machineSettingTemplates,
            ...buildMachineTemplates(input, machineId),
          ],
        };
      });
    },
  };

  return <WorkoutAppContext.Provider value={value}>{children}</WorkoutAppContext.Provider>;
}

export function useWorkoutApp() {
  const context = useContext(WorkoutAppContext);

  if (!context) {
    throw new Error("useWorkoutApp must be used within WorkoutAppProvider");
  }

  return context;
}
