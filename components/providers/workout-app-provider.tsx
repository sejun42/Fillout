"use client";

import { createContext, startTransition, useContext, useEffect, useState } from "react";

import { createSeedState } from "@/lib/mock-data";
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

const STORAGE_KEY = "fillout-mvp-state";

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

export function WorkoutAppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<WorkoutAppState>(() => createSeedState());
  const [hydrated, setHydrated] = useState(false);
  const supabaseConfigured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);

    startTransition(() => {
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as WorkoutAppState;
          setState(parsed);
        } catch {
          window.localStorage.removeItem(STORAGE_KEY);
        }
      }

      setHydrated(true);
    });
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [hydrated, state]);

  const value: WorkoutAppContextValue = {
    state,
    hydrated,
    supabaseConfigured,
    signIn(email, mode = "demo") {
      setState((current) => ({
        ...current,
        mode,
        profile: createProfile(email),
      }));
    },
    signOut() {
      setState((current) => ({
        ...current,
        mode: "demo",
        profile: null,
      }));
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
