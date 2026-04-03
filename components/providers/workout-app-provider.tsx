"use client";

import { createContext, startTransition, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";

import {
  createDemoState,
  createLoggedOutState,
  createPersonalState,
  createSeedState,
  demoProfile,
} from "@/lib/mock-data";
import {
  createExerciseInSupabase,
  createSharedBrandInSupabase,
  createSharedMachineInSupabase,
  deleteSessionFromSupabase,
  loadRemoteAppState,
  saveSessionToSupabase,
} from "@/lib/supabase/app-data";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { buildMachineTemplateDescriptors, buildMachineTemplates } from "@/lib/workout";
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
  isSyncing: boolean;
  syncError: string | null;
  signIn: (email: string, mode?: AppMode) => void;
  signOut: () => Promise<void>;
  refreshRemoteState: () => Promise<void>;
  saveSession: (session: WorkoutSession) => Promise<void>;
  deleteSession: (sessionId: string) => Promise<void>;
  addBrand: (name: string) => Promise<void>;
  addExercise: (name: string, primaryBodyPartId: string, exerciseType: ExerciseType) => Promise<void>;
  addMachine: (input: NewMachineInput) => Promise<void>;
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

function getLocalFallbackState() {
  const activeWorkspace = window.localStorage.getItem(ACTIVE_STORAGE_KEY);

  if (activeWorkspace) {
    const storedState = parseState(window.localStorage.getItem(activeWorkspace));
    if (storedState) {
      return storedState;
    }
  }

  return createLoggedOutState();
}

function migrateLegacyState() {
  const legacyState = parseState(window.localStorage.getItem(LEGACY_STORAGE_KEY));

  if (!legacyState) {
    return;
  }

  const migrationTarget = shouldMigrateLegacyState(legacyState);
  if (migrationTarget === "demo") {
    window.localStorage.setItem(`${STORAGE_PREFIX}:demo`, JSON.stringify(createDemoState()));
  } else if (migrationTarget === "user" && legacyState.profile) {
    const profile = legacyState.profile;
    const key =
      getWorkspaceStorageKey(profile, legacyState.mode) ?? `${STORAGE_PREFIX}:user:${profile.email.toLowerCase()}`;
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

function saveSessionLocally(state: WorkoutAppState, session: WorkoutSession): WorkoutAppState {
  const updatedSession = {
    ...session,
    updatedAt: new Date().toISOString(),
  };
  const nextSessions = state.sessions.some((item) => item.id === updatedSession.id)
    ? state.sessions.map((item) => (item.id === updatedSession.id ? updatedSession : item))
    : [updatedSession, ...state.sessions];

  return {
    ...state,
    sessions: nextSessions.sort((left, right) => right.sessionDate.localeCompare(left.sessionDate)),
  };
}

function deleteSessionLocally(state: WorkoutAppState, sessionId: string): WorkoutAppState {
  return {
    ...state,
    sessions: state.sessions.filter((session) => session.id !== sessionId),
  };
}

function addBrandLocally(state: WorkoutAppState, name: string): WorkoutAppState {
  const trimmed = name.trim();
  if (!trimmed) {
    return state;
  }

  const exists = state.brands.some((brand) => brand.name.toLowerCase() === trimmed.toLowerCase());
  if (exists) {
    return state;
  }

  const brand: BrandDefinition = {
    id: createId("brand"),
    ownerUserId: state.profile?.id ?? null,
    name: trimmed,
    isSystem: false,
    isShared: false,
    createdAt: new Date().toISOString(),
  };

  return {
    ...state,
    brands: [...state.brands, brand],
  };
}

function addExerciseLocally(
  state: WorkoutAppState,
  name: string,
  primaryBodyPartId: string,
  exerciseType: ExerciseType,
): WorkoutAppState {
  const trimmed = name.trim();
  if (!trimmed) {
    return state;
  }

  const exists = state.exercises.some((exercise) => exercise.name.toLowerCase() === trimmed.toLowerCase());
  if (exists) {
    return state;
  }

  return {
    ...state,
    exercises: [
      ...state.exercises,
      {
        id: createId("exercise"),
        ownerUserId: state.profile?.id ?? null,
        name: trimmed,
        primaryBodyPartId,
        exerciseType,
        isSystem: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
  };
}

function addMachineLocally(state: WorkoutAppState, input: NewMachineInput): WorkoutAppState {
  const trimmed = input.name.trim();
  if (!trimmed) {
    return state;
  }

  const trimmedBrandFallback = input.brandNameFallback?.trim() || null;
  if (!input.brandId && !trimmedBrandFallback) {
    throw new Error("브랜드를 선택하거나 직접 입력하세요.");
  }

  const machineId = createId("machine");
  const machine = {
    id: machineId,
    ownerUserId: state.profile?.id ?? null,
    brandId: input.brandId,
    brandNameFallback: trimmedBrandFallback,
    name: trimmed,
    primaryBodyPartId: input.primaryBodyPartId,
    isSystem: false,
    isShared: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return {
    ...state,
    machines: [...state.machines, machine],
    machineSettingTemplates: [
      ...state.machineSettingTemplates,
      ...buildMachineTemplates(input, machineId),
    ],
  };
}

export function WorkoutAppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<WorkoutAppState>(() => createSeedState());
  const [hydrated, setHydrated] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const supabaseConfigured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
  const supabase = useMemo(
    () => (supabaseConfigured ? getSupabaseBrowserClient() : null),
    [supabaseConfigured],
  );

  const hydrateRemoteFromCurrentUser = useCallback(async () => {
    if (!supabase) {
      return false;
    }

    const userResult = await supabase.auth.getUser();
    if (userResult.error || !userResult.data.user) {
      return false;
    }

    const remoteState = await loadRemoteAppState(supabase, userResult.data.user);
    startTransition(() => {
      setState(remoteState);
      setSyncError(null);
    });
    return true;
  }, [supabase]);

  const runRemoteMutation = useCallback(async (action: () => Promise<void>) => {
    setIsSyncing(true);
    setSyncError(null);

    try {
      await action();
      await hydrateRemoteFromCurrentUser();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Supabase 동기화에 실패했습니다.";
      setSyncError(message);
      throw error;
    } finally {
      setIsSyncing(false);
    }
  }, [hydrateRemoteFromCurrentUser]);

  async function getCurrentRemoteUserId() {
    if (!supabase) {
      throw new Error("Supabase 클라이언트를 사용할 수 없습니다.");
    }

    const userResult = await supabase.auth.getUser();
    if (userResult.error || !userResult.data.user) {
      throw new Error("Supabase 로그인 세션이 없습니다.");
    }

    return userResult.data.user.id;
  }

  useEffect(() => {
    let disposed = false;

    async function initialize() {
      await Promise.resolve();
      migrateLegacyState();

      if (supabase) {
        setIsSyncing(true);

        try {
          const loadedRemote = await hydrateRemoteFromCurrentUser();
          if (disposed) {
            return;
          }

          if (!loadedRemote) {
            startTransition(() => {
              setState(getLocalFallbackState());
            });
          }
        } catch (error) {
          if (disposed) {
            return;
          }

          startTransition(() => {
            setState(getLocalFallbackState());
            setSyncError(error instanceof Error ? error.message : "Supabase 상태를 불러오지 못했습니다.");
          });
        } finally {
          if (!disposed) {
            startTransition(() => {
              setHydrated(true);
              setIsSyncing(false);
            });
          }
        }

        return;
      }

      startTransition(() => {
        setState(getLocalFallbackState());
        setHydrated(true);
      });
    }

    void initialize();

    if (!supabase) {
      return () => {
        disposed = true;
      };
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
      void (async () => {
        await Promise.resolve();
        if (disposed) {
          return;
        }

        if (session?.user) {
          setIsSyncing(true);
          try {
            const remoteState = await loadRemoteAppState(supabase, session.user);
            if (disposed) {
              return;
            }

            startTransition(() => {
              setState(remoteState);
              setSyncError(null);
              setHydrated(true);
              setIsSyncing(false);
            });
          } catch (error) {
            if (disposed) {
              return;
            }

            startTransition(() => {
              setSyncError(error instanceof Error ? error.message : "Supabase 상태를 갱신하지 못했습니다.");
              setHydrated(true);
              setIsSyncing(false);
            });
          }

          return;
        }

        startTransition(() => {
          setState(getLocalFallbackState());
          setHydrated(true);
          setIsSyncing(false);
        });
      })();
    });

    return () => {
      disposed = true;
      subscription.unsubscribe();
    };
  }, [supabase, hydrateRemoteFromCurrentUser]);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    const shouldPersistLocally = state.mode === "demo" || !supabaseConfigured;
    if (shouldPersistLocally) {
      const storageKey = getWorkspaceStorageKey(state.profile, state.mode);
      if (storageKey) {
        window.localStorage.setItem(storageKey, JSON.stringify(state));
        window.localStorage.setItem(ACTIVE_STORAGE_KEY, storageKey);
        return;
      }
    }

    window.localStorage.removeItem(ACTIVE_STORAGE_KEY);
  }, [hydrated, state, supabaseConfigured]);

  useEffect(() => {
    if (!hydrated || !supabase || state.mode !== "supabase") {
      return;
    }

    function handleRefresh() {
      void runRemoteMutation(async () => {
        return;
      });
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        handleRefresh();
      }
    }

    window.addEventListener("focus", handleRefresh);
    window.addEventListener("online", handleRefresh);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("focus", handleRefresh);
      window.removeEventListener("online", handleRefresh);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [hydrated, runRemoteMutation, state.mode, supabase]);

  const value: WorkoutAppContextValue = {
    state,
    hydrated,
    supabaseConfigured,
    isSyncing,
    syncError,
    signIn(email, mode = "demo") {
      if (mode === "demo") {
        const demoState = parseState(window.localStorage.getItem(`${STORAGE_PREFIX}:demo`)) ?? createDemoState();
        setState(demoState);
        return;
      }

      const profile = createProfile(email);
      const storageKey = getWorkspaceStorageKey(profile, mode);
      const storedState = storageKey ? parseState(window.localStorage.getItem(storageKey)) : null;
      setState(storedState ?? createPersonalState(profile, mode));
    },
    async signOut() {
      if (supabase && state.mode === "supabase") {
        await supabase.auth.signOut();
      }

      setState(createLoggedOutState());
    },
    async refreshRemoteState() {
      if (!supabase) {
        return;
      }

      await runRemoteMutation(async () => {
        return;
      });
    },
    async saveSession(session) {
      if (supabase && state.mode === "supabase") {
        await runRemoteMutation(async () => {
          const userId = await getCurrentRemoteUserId();
          await saveSessionToSupabase(supabase, userId, session);
        });
        return;
      }

      setState((current) => saveSessionLocally(current, session));
    },
    async deleteSession(sessionId) {
      if (supabase && state.mode === "supabase") {
        await runRemoteMutation(async () => {
          const userId = await getCurrentRemoteUserId();
          await deleteSessionFromSupabase(supabase, userId, sessionId);
        });
        return;
      }

      setState((current) => deleteSessionLocally(current, sessionId));
    },
    async addBrand(name) {
      if (supabase && state.mode === "supabase") {
        await runRemoteMutation(async () => {
          const userId = await getCurrentRemoteUserId();
          await createSharedBrandInSupabase(supabase, userId, name);
        });
        return;
      }

      setState((current) => addBrandLocally(current, name));
    },
    async addExercise(name, primaryBodyPartId, exerciseType) {
      if (supabase && state.mode === "supabase") {
        await runRemoteMutation(async () => {
          const userId = await getCurrentRemoteUserId();
          await createExerciseInSupabase(supabase, userId, {
            name,
            primaryBodyPartId,
            exerciseType,
          });
        });
        return;
      }

      setState((current) => addExerciseLocally(current, name, primaryBodyPartId, exerciseType));
    },
    async addMachine(input) {
      if (supabase && state.mode === "supabase") {
        await runRemoteMutation(async () => {
          const userId = await getCurrentRemoteUserId();
          await createSharedMachineInSupabase(supabase, userId, {
            name: input.name,
            brandId: input.brandId,
            brandNameFallback: input.brandNameFallback,
            primaryBodyPartId: input.primaryBodyPartId,
            templates: buildMachineTemplateDescriptors(input).map((template, index) => ({
              ...template,
              sortOrder: index + 1,
            })),
          });
        });
        return;
      }

      setState((current) => addMachineLocally(current, input));
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
