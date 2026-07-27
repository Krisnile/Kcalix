// 全局设计系统：配色、间距、圆角、阴影、字号
// 统一管理，保证全 App 视觉一致、简洁现代
// 支持浅色 / 深色双主题：组件通过 useColors() 获取当前主题色板

import { useColorScheme } from 'react-native';
import { useStore } from './store/AppStore';

// 浅色主题
export const lightColors = {
  // 基础背景与文字
  bg: '#F3F5F4',
  card: '#FCFDFC',
  text: '#18211E',
  textSecondary: '#65716C',
  textTertiary: '#98A19D',
  border: '#E2E7E4',
  divider: '#EDF0EE',

  // 品牌色（墨玉绿 + 香槟金）
  primary: '#176B5B',
  primaryDark: '#0F5145',
  primarySoft: '#E3EEEA',
  accent: '#C69A5B',
  accentSoft: '#F4EDE2',

  // 低饱和功能色
  weight: '#7077A8',
  weightSoft: '#EBECF4',
  diet: '#3F786B',
  dietSoft: '#E5EEEB',
  water: '#5B8FA3',
  waterSoft: '#E5EEF1',
  exercise: '#B57852',
  exerciseSoft: '#F2E9E3',
  calorie: '#A86C4A',
  calorieSoft: '#F2E7E1',

  // 状态色
  success: '#3F786B',
  warning: '#B88746',
  danger: '#B85C5C',

  white: '#FFFFFF',
  black: '#000000',
  shadow: '#0F172A',
};

export type Palette = typeof lightColors;

// 深色主题（与浅色保持相同的键）
export const darkColors: Palette = {
  bg: '#101512',
  card: '#18201C',
  text: '#F0F3F1',
  textSecondary: '#A3ADA8',
  textTertiary: '#717D77',
  border: '#2A342F',
  divider: '#202A25',

  primary: '#72AC9D',
  primaryDark: '#9BC5BA',
  primarySoft: '#233B34',
  accent: '#D2AE77',
  accentSoft: '#3B3225',

  weight: '#9298BF',
  weightSoft: '#2D3043',
  diet: '#72AC9D',
  dietSoft: '#233B34',
  water: '#7AA4B4',
  waterSoft: '#22343B',
  exercise: '#C79473',
  exerciseSoft: '#3B2E27',
  calorie: '#C38868',
  calorieSoft: '#3C2B24',

  success: '#72AC9D',
  warning: '#D2AE77',
  danger: '#D77B7B',

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
  breakfast: { color: '#B88746', soft: '#F4EDE2' },
  lunch: { color: '#3F786B', soft: '#E5EEEB' },
  dinner: { color: '#7077A8', soft: '#EBECF4' },
  snack: { color: '#9B7185', soft: '#F1E8ED' },
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
