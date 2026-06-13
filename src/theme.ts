// 全局设计系统：配色、间距、圆角、阴影、字号
// 统一管理，保证全 App 视觉一致、简洁现代

export const colors = {
  // 基础背景与文字
  bg: '#F5F7FA',
  card: '#FFFFFF',
  text: '#0F172A',
  textSecondary: '#64748B',
  textTertiary: '#94A3B8',
  border: '#EAEEF3',
  divider: '#F1F5F9',

  // 主色（清新薄荷绿）
  primary: '#16C098',
  primaryDark: '#0EA47E',
  primarySoft: '#E4F8F2',

  // 功能分类色
  weight: '#6366F1', // 体重 - 靛蓝
  weightSoft: '#ECECFE',
  diet: '#16C098', // 饮食 - 绿
  dietSoft: '#E4F8F2',
  water: '#38BDF8', // 喝水 - 天蓝
  waterSoft: '#E2F4FE',
  exercise: '#FB923C', // 运动 - 橙
  exerciseSoft: '#FEEEDF',
  calorie: '#F97316', // 热量 - 橙红
  calorieSoft: '#FEEDE0',

  // 状态色
  success: '#22C55E',
  warning: '#F59E0B',
  danger: '#EF4444',

  white: '#FFFFFF',
  black: '#000000',
  shadow: '#0F172A',
};

// 餐次配色（早/午/晚/加餐）
export const mealColors: Record<string, { color: string; soft: string }> = {
  breakfast: { color: '#FBBF24', soft: '#FEF6E0' },
  lunch: { color: '#16C098', soft: '#E4F8F2' },
  dinner: { color: '#6366F1', soft: '#ECECFE' },
  snack: { color: '#F472B6', soft: '#FCE9F3' },
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
  sm: 10,
  md: 16,
  lg: 22,
  xl: 28,
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
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
  },
  soft: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  float: {
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
    elevation: 8,
  },
};
