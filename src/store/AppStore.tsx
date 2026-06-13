import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  AppData,
  AppSettings,
  ExerciseLog,
  FoodLog,
  Profile,
  WaterLog,
  WeightLog,
} from '../types';
import { recommendedWater } from '../utils/nutrition';

const STORAGE_KEY = '@kcalix/data/v1';

const defaultSettings: AppSettings = {
  termsAccepted: false,
  reminderEnabled: true,
  units: 'metric',
};

const initialData: AppData = {
  onboarded: false,
  profile: null,
  settings: defaultSettings,
  weightLogs: [],
  foodLogs: [],
  exerciseLogs: [],
  waterLogs: [],
};

function uid(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

interface StoreContext {
  ready: boolean;
  data: AppData;
  completeOnboarding: (profile: Profile) => void;
  updateProfile: (patch: Partial<Profile>) => void;
  updateSettings: (patch: Partial<AppSettings>) => void;
  addWeight: (log: Omit<WeightLog, 'id' | 'createdAt'>) => void;
  addFood: (log: Omit<FoodLog, 'id' | 'createdAt'>) => void;
  addExercise: (log: Omit<ExerciseLog, 'id' | 'createdAt'>) => void;
  addWater: (log: Omit<WaterLog, 'id' | 'createdAt'>) => void;
  removeWeight: (id: string) => void;
  removeFood: (id: string) => void;
  removeExercise: (id: string) => void;
  removeWater: (id: string) => void;
  resetAll: () => void;
}

const Ctx = createContext<StoreContext | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<AppData>(initialData);
  const [ready, setReady] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 启动时加载持久化数据
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as AppData;
          setData({ ...initialData, ...parsed, settings: { ...defaultSettings, ...parsed.settings } });
        }
      } catch (e) {
        // 忽略读取错误，使用默认数据
      } finally {
        setReady(true);
      }
    })();
  }, []);

  // 数据变更后异步持久化（去抖）
  useEffect(() => {
    if (!ready) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data)).catch(() => {});
    }, 250);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [data, ready]);

  const completeOnboarding = useCallback((profile: Profile) => {
    setData((d) => {
      const firstWeight: WeightLog = {
        id: uid(),
        date: new Date().toISOString().slice(0, 10),
        weight: profile.weight,
        createdAt: new Date().toISOString(),
      };
      return {
        ...d,
        onboarded: true,
        profile,
        settings: { ...d.settings, termsAccepted: true },
        weightLogs: d.weightLogs.length ? d.weightLogs : [firstWeight],
      };
    });
  }, []);

  const updateProfile = useCallback((patch: Partial<Profile>) => {
    setData((d) => (d.profile ? { ...d, profile: { ...d.profile, ...patch } } : d));
  }, []);

  const updateSettings = useCallback((patch: Partial<AppSettings>) => {
    setData((d) => ({ ...d, settings: { ...d.settings, ...patch } }));
  }, []);

  const addWeight = useCallback((log: Omit<WeightLog, 'id' | 'createdAt'>) => {
    setData((d) => {
      // 同一天的体重记录覆盖
      const rest = d.weightLogs.filter((w) => w.date !== log.date);
      const next = [...rest, { ...log, id: uid(), createdAt: new Date().toISOString() }];
      next.sort((a, b) => a.date.localeCompare(b.date));
      return { ...d, weightLogs: next };
    });
  }, []);

  const addFood = useCallback((log: Omit<FoodLog, 'id' | 'createdAt'>) => {
    setData((d) => ({
      ...d,
      foodLogs: [...d.foodLogs, { ...log, id: uid(), createdAt: new Date().toISOString() }],
    }));
  }, []);

  const addExercise = useCallback((log: Omit<ExerciseLog, 'id' | 'createdAt'>) => {
    setData((d) => ({
      ...d,
      exerciseLogs: [...d.exerciseLogs, { ...log, id: uid(), createdAt: new Date().toISOString() }],
    }));
  }, []);

  const addWater = useCallback((log: Omit<WaterLog, 'id' | 'createdAt'>) => {
    setData((d) => ({
      ...d,
      waterLogs: [...d.waterLogs, { ...log, id: uid(), createdAt: new Date().toISOString() }],
    }));
  }, []);

  const removeWeight = useCallback((id: string) => {
    setData((d) => ({ ...d, weightLogs: d.weightLogs.filter((x) => x.id !== id) }));
  }, []);
  const removeFood = useCallback((id: string) => {
    setData((d) => ({ ...d, foodLogs: d.foodLogs.filter((x) => x.id !== id) }));
  }, []);
  const removeExercise = useCallback((id: string) => {
    setData((d) => ({ ...d, exerciseLogs: d.exerciseLogs.filter((x) => x.id !== id) }));
  }, []);
  const removeWater = useCallback((id: string) => {
    setData((d) => ({ ...d, waterLogs: d.waterLogs.filter((x) => x.id !== id) }));
  }, []);

  const resetAll = useCallback(() => {
    setData(initialData);
    AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
  }, []);

  const value = useMemo<StoreContext>(
    () => ({
      ready,
      data,
      completeOnboarding,
      updateProfile,
      updateSettings,
      addWeight,
      addFood,
      addExercise,
      addWater,
      removeWeight,
      removeFood,
      removeExercise,
      removeWater,
      resetAll,
    }),
    [
      ready,
      data,
      completeOnboarding,
      updateProfile,
      updateSettings,
      addWeight,
      addFood,
      addExercise,
      addWater,
      removeWeight,
      removeFood,
      removeExercise,
      removeWater,
      resetAll,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore(): StoreContext {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useStore must be used within AppProvider');
  return ctx;
}

export { recommendedWater };
