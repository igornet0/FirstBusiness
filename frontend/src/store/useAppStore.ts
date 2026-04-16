import { create } from "zustand";
import { persist } from "zustand/middleware";
import { api, type MeResponse, type MissionDto } from "../lib/api";

type MissionStatePayload = {
  xp: number;
  level: number;
  missions: MeResponse["missions"];
  activeMissionId: string | null;
  progressPct: number;
};

type AppState = {
  token: string | null;
  me: MeResponse | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
  fetchMe: () => Promise<void>;
  applyMe: (partial: Partial<MeResponse>) => void;
  toggleTask: (missionId: string, taskIndex: number) => Promise<void>;
  completeMission: (
    missionId: string,
    answers: string[]
  ) => Promise<MissionStatePayload | null>;
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      token: null,
      me: null,
      loading: false,
      error: null,
      login: async (email, password) => {
        set({ loading: true, error: null });
        try {
          const { token } = await api.login(email, password);
          set({ token });
          const me = await api.me(token);
          set({ me, loading: false });
        } catch (e) {
          set({
            error:
              e instanceof Error ? e.message : "errors.loginFailed",
            loading: false,
          });
          throw e;
        }
      },
      register: async (email, password) => {
        set({ loading: true, error: null });
        try {
          const { token } = await api.register(email, password);
          set({ token });
          const me = await api.me(token);
          set({ me, loading: false });
        } catch (e) {
          set({
            error:
              e instanceof Error ? e.message : "errors.registerFailed",
            loading: false,
          });
          throw e;
        }
      },
      logout: () => set({ token: null, me: null, error: null }),
      fetchMe: async () => {
        const { token } = get();
        if (!token) return;
        set({ loading: true, error: null });
        try {
          const me = await api.me(token);
          set({ me, loading: false });
        } catch {
          set({ token: null, me: null, loading: false });
        }
      },
      applyMe: (partial) => {
        const me = get().me;
        if (!me) return;
        set({ me: { ...me, ...partial } });
      },
      toggleTask: async (missionId, taskIndex) => {
        const { token, me } = get();
        if (!token || !me) return;
        set({ loading: true, error: null });
        try {
          const data = await api.toggleTask(token, missionId, taskIndex);
          set({
            me: {
              ...me,
              xp: data.xp,
              level: data.level,
              missions: data.missions,
              activeMissionId: data.activeMissionId,
              progressPct: data.progressPct,
            },
            loading: false,
          });
        } catch (e) {
          set({
            error:
              e instanceof Error ? e.message : "errors.updateFailed",
            loading: false,
          });
        }
      },
      completeMission: async (missionId, answers) => {
        const { token, me } = get();
        if (!token || !me) return null;
        set({ loading: true, error: null });
        try {
          const data = await api.completeMission(token, missionId, answers);
          set({
            me: {
              ...me,
              xp: data.xp,
              level: data.level,
              missions: data.missions,
              activeMissionId: data.activeMissionId,
              progressPct: data.progressPct,
            },
            loading: false,
          });
          return data;
        } catch (e) {
          set({
            error:
              e instanceof Error ? e.message : "errors.updateFailed",
            loading: false,
          });
          return null;
        }
      },
    }),
    {
      name: "first-bysenes",
      partialize: (s) => ({ token: s.token }),
    }
  )
);

export function selectActiveMission(me: MeResponse | null): MissionDto | null {
  if (!me?.activeMissionId) return null;
  return me.missions.find((m) => m.id === me.activeMissionId) ?? null;
}
