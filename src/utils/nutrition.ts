import { ActivityLevel, Goal, Profile } from '../types';

// 活动系数（TDEE 计算）
export const activityFactor: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  veryActive: 1.9,
};

export const activityLabel: Record<ActivityLevel, string> = {
  sedentary: '久坐（很少运动）',
  light: '轻度活动（每周1-3次）',
  moderate: '中度活动（每周3-5次）',
  active: '高度活动（每周6-7次）',
  veryActive: '非常活跃（体力工作/运动员）',
};

export const goalLabel: Record<Goal, string> = {
  lose: '减脂',
  keep: '保持',
  gain: '增肌',
};

// 基础代谢率（Mifflin-St Jeor 公式）
export function calcBMR(profile: Pick<Profile, 'gender' | 'weight' | 'height' | 'age'>, weight?: number): number {
  const w = weight ?? profile.weight;
  const base = 10 * w + 6.25 * profile.height - 5 * profile.age;
  return Math.round(profile.gender === 'male' ? base + 5 : base - 161);
}

// 每日总消耗 TDEE
export function calcTDEE(profile: Profile, weight?: number): number {
  return Math.round(calcBMR(profile, weight) * activityFactor[profile.activity]);
}

// 每日热量目标（结合目标：减脂 -500，增肌 +300）
export function calcCalorieGoal(profile: Profile, currentWeight?: number): number {
  if (profile.customCalorieGoal && profile.customCalorieGoal > 0) {
    return profile.customCalorieGoal;
  }
  const tdee = calcTDEE(profile, currentWeight);
  if (profile.goal === 'lose') return Math.max(1200, tdee - 500);
  if (profile.goal === 'gain') return tdee + 300;
  return tdee;
}

// BMI
export function calcBMI(weightKg: number, heightCm: number): number {
  if (!heightCm) return 0;
  const m = heightCm / 100;
  return Math.round((weightKg / (m * m)) * 10) / 10;
}

export function bmiCategory(bmi: number): { label: string; color: string } {
  if (bmi < 18.5) return { label: '偏瘦', color: '#5B8FA3' };
  if (bmi < 24) return { label: '正常', color: '#22C55E' };
  if (bmi < 28) return { label: '偏胖', color: '#F59E0B' };
  return { label: '肥胖', color: '#EF4444' };
}

// 推荐每日饮水量（ml）：体重(kg) * 35
export function recommendedWater(weightKg: number): number {
  return Math.round((weightKg * 35) / 50) * 50;
}
