// 全局数据类型定义

export type Gender = 'male' | 'female';

export type Goal = 'lose' | 'keep' | 'gain';

export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'veryActive';

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface Profile {
  name: string;
  gender: Gender;
  height: number; // cm
  weight: number; // kg，初始体重
  targetWeight: number; // kg
  age: number;
  goal: Goal;
  activity: ActivityLevel;
  // 可选自定义每日热量目标（不填则按公式计算）
  customCalorieGoal?: number;
  // 每日喝水目标 ml
  waterGoal: number;
  createdAt: string;
}

export interface WeightLog {
  id: string;
  date: string; // YYYY-MM-DD
  weight: number; // kg
  createdAt: string;
}

export interface FoodLog {
  id: string;
  date: string; // YYYY-MM-DD
  meal: MealType;
  name: string;
  calories: number; // kcal
  amount: number; // 克 / 份
  unit: string; // '克' | '份'
  createdAt: string;
}

export interface ExerciseLog {
  id: string;
  date: string;
  name: string;
  calories: number; // 消耗 kcal
  duration: number; // 分钟
  createdAt: string;
}

export interface WaterLog {
  id: string;
  date: string;
  amount: number; // ml
  createdAt: string;
}

export interface AppSettings {
  termsAccepted: boolean;
  reminderEnabled: boolean;
  units: 'metric'; // 预留
}

export interface AppData {
  onboarded: boolean;
  profile: Profile | null;
  settings: AppSettings;
  weightLogs: WeightLog[];
  foodLogs: FoodLog[];
  exerciseLogs: ExerciseLog[];
  waterLogs: WaterLog[];
}
