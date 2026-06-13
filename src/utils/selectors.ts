import { ExerciseLog, FoodLog, MealType, WaterLog, WeightLog } from '../types';

export const mealLabel: Record<MealType, string> = {
  breakfast: '早餐',
  lunch: '午餐',
  dinner: '晚餐',
  snack: '加餐',
};

export const mealOrder: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

export function sumFood(logs: FoodLog[], date: string): number {
  return Math.round(logs.filter((l) => l.date === date).reduce((s, l) => s + l.calories, 0));
}

export function foodByMeal(logs: FoodLog[], date: string): Record<MealType, FoodLog[]> {
  const result: Record<MealType, FoodLog[]> = { breakfast: [], lunch: [], dinner: [], snack: [] };
  logs
    .filter((l) => l.date === date)
    .forEach((l) => result[l.meal].push(l));
  return result;
}

export function sumExercise(logs: ExerciseLog[], date: string): number {
  return Math.round(logs.filter((l) => l.date === date).reduce((s, l) => s + l.calories, 0));
}

export function sumWater(logs: WaterLog[], date: string): number {
  return Math.round(logs.filter((l) => l.date === date).reduce((s, l) => s + l.amount, 0));
}

export function latestWeight(logs: WeightLog[]): number | null {
  if (!logs.length) return null;
  const sorted = [...logs].sort((a, b) => a.date.localeCompare(b.date));
  return sorted[sorted.length - 1].weight;
}

export function weightForDate(logs: WeightLog[], date: string): number | null {
  const sorted = [...logs].filter((l) => l.date <= date).sort((a, b) => a.date.localeCompare(b.date));
  return sorted.length ? sorted[sorted.length - 1].weight : null;
}
