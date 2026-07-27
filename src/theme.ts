// 全局设计系统：配色、间距、圆角、阴影、字号
// 统一管理，保证全 App 视觉一致、简洁现代
// 支持浅色 / 深色双主题：组件通过 useColors() 获取当前主题色板

import { useColorScheme } from 'react-native';
import { useStore } from './store/AppStore';

// 浅色主题
export const lightColors = {
  // 基础背景与文字
  bg: '#F3F8F8',
  card: '#FFFFFF',
  text: '#203039',
  textSecondary: '#647680',
  textTertiary: '#9AAAB1',
  border: '#DFEAEB',
  divider: '#EDF3F3',

  // 品牌色（冰川薄荷 + 雾蓝紫）
  primary: '#45B8A2',
  primaryDark: '#288D7D',
  primarySoft: '#E3F4F1',
  accent: '#7B8DE8',
  accentSoft: '#EEF0FC',

  // 清透、同明度的功能色
  weight: '#7B83D5',
  weightSoft: '#EEF0FB',
  diet: '#45B8A2',
  dietSoft: '#E3F4F1',
  water: '#5EAFD2',
  waterSoft: '#E7F4F9',
  exercise: '#F09A68',
  exerciseSoft: '#FFF0E8',
  calorie: '#EC8769',
  calorieSoft: '#FDECE7',

  // 状态色
  success: '#45A98F',
  warning: '#D9A34D',
  danger: '#D96D74',

  white: '#FFFFFF',
  black: '#000000',
  shadow: '#0F172A',
};

export type Palette = typeof lightColors;

// 深色主题（与浅色保持相同的键）
export const darkColors: Palette = {
  bg: '#11191D',
  card: '#192429',
  text: '#EFF7F7',
  textSecondary: '#A6B7BD',
  textTertiary: '#71858D',
  border: '#2A3A40',
  divider: '#202E33',

  primary: '#62CDB8',
  primaryDark: '#8BDCCB',
  primarySoft: '#213D3A',
  accent: '#9CA8F2',
  accentSoft: '#2C304B',

  weight: '#9CA3EB',
  weightSoft: '#2C304B',
  diet: '#62CDB8',
  dietSoft: '#213D3A',
  water: '#79C2E0',
  waterSoft: '#203944',
  exercise: '#F4AD83',
  exerciseSoft: '#412F27',
  calorie: '#F09A80',
  calorieSoft: '#432D29',

  success: '#62CDB8',
  warning: '#E1B35F',
  danger: '#EB8990',

  white: '#FFFFFF',
  black: '#000000',
  shadow: '#000000',
};

// 默认（浅色）色板：用于阴影定义、引导页等静态场景
export const colors = lightColors;

export type ThemeMode = 'light' | 'dark' | 'system';

// 根据设置 + 系统外观，返回当前生效的色板
export function useColors(): Palette {
  const { data } = useStore();
  const system = useColorScheme();
  const mode: ThemeMode = data.settings.theme ?? 'light';
  const resolved = mode === 'system' ? (system === 'dark' ? 'dark' : 'light') : mode;
  return resolved === 'dark' ? darkColors : lightColors;
}

// 当前是否为深色（用于 StatusBar 等）
export function useIsDark(): boolean {
  const { data } = useStore();
  const system = useColorScheme();
  const mode: ThemeMode = data.settings.theme ?? 'light';
  const resolved = mode === 'system' ? (system === 'dark' ? 'dark' : 'light') : mode;
  return resolved === 'dark';
}

// 餐次配色（早/午/晚/加餐）— 两种主题通用
export const mealColors: Record<string, { color: string; soft: string }> = {
  breakfast: { color: '#D9A34D', soft: '#FFF5DF' },
  lunch: { color: '#45B8A2', soft: '#E3F4F1' },
  dinner: { color: '#7B83D5', soft: '#EEF0FB' },
  snack: { color: '#D787B5', soft: '#FBEAF4' },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 22,
  pill: 999,
};

export const font = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 26,
  display: 34,
};

export const shadow = {
  card: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.035,
    shadowRadius: 12,
    elevation: 2,
  },
  soft: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.025,
    shadowRadius: 6,
    elevation: 1,
  },
  float: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 5,
  },
};
