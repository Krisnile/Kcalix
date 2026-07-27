import React, { useMemo } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import { font, Palette, radius, shadow, spacing, useColors } from '../theme';

// 统一的删除二次确认，防止误触
export function confirmDelete(onConfirm: () => void, name?: string) {
  Alert.alert(
    '删除记录',
    name ? `确定删除「${name}」这条记录吗？` : '确定删除这条记录吗？',
    [
      { text: '取消', style: 'cancel' },
      { text: '删除', style: 'destructive', onPress: onConfirm },
    ],
  );
}

// 卡片容器
export function Card({
  children,
  style,
  padded = true,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  padded?: boolean;
}) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={[styles.card, padded && { padding: spacing.lg }, style]}>{children}</View>
  );
}

// 区块标题
export function SectionTitle({ title, action }: { title: string; action?: React.ReactNode }) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={styles.sectionRow}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action}
    </View>
  );
}

// 页面标题：以“健康账本”的章节标记统一各主页面
export function PageTitle({ title }: { title: string }) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={styles.pageTitleRow}>
      <View style={styles.pageTitleLead}>
        <View style={styles.pageTitleMark} />
        <View style={styles.pageTitleCopy}>
          <Text style={styles.pageTitleText}>{title}</Text>
        </View>
      </View>
      <View style={[styles.pageTitleTrace, { pointerEvents: 'none' }]}>
        <View style={styles.pageTitleTraceRow}>
          <View style={[styles.pageTitleTraceLine, { width: 62 }]} />
          <View style={styles.pageTitleTraceDot} />
        </View>
        <View style={styles.pageTitleTraceRow}>
          <View style={[styles.pageTitleTraceLine, { width: 42, opacity: 0.7 }]} />
          <View style={[styles.pageTitleTraceDot, { opacity: 0.55 }]} />
        </View>
        <View style={styles.pageTitleTraceRow}>
          <View style={[styles.pageTitleTraceLine, { width: 72, opacity: 0.45 }]} />
          <View style={[styles.pageTitleTraceDot, { opacity: 0.35 }]} />
        </View>
      </View>
    </View>
  );
}

// 主按钮
export function Button({
  label,
  onPress,
  variant = 'primary',
  loading,
  disabled,
  style,
  icon,
}: {
  label: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  icon?: React.ReactNode;
}) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const isPrimary = variant === 'primary';
  const isDanger = variant === 'danger';
  const isGhost = variant === 'ghost';
  const bg = isPrimary ? colors.primary : isDanger ? colors.danger : isGhost ? 'transparent' : colors.primarySoft;
  const fg = isPrimary || isDanger ? colors.white : isGhost ? colors.textSecondary : colors.primaryDark;
  return (
    <Pressable
      onPress={disabled || loading ? undefined : onPress}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: bg, opacity: disabled ? 0.5 : pressed ? 0.85 : 1 },
        isGhost && { borderWidth: 1, borderColor: colors.border },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <View style={styles.buttonInner}>
          {icon}
          <Text style={[styles.buttonText, { color: fg }]}>{label}</Text>
        </View>
      )}
    </Pressable>
  );
}

// 分段选择器
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  style,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  style?: StyleProp<ViewStyle>;
}) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={[styles.segmented, style]}>
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <Pressable key={opt.value} style={styles.segItem} onPress={() => onChange(opt.value)}>
            <View style={[styles.segPill, active && styles.segPillActive]}>
              <Text style={[styles.segText, active && styles.segTextActive]}>{opt.label}</Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

// 标签 / 徽章
export function Tag({ text, color, soft }: { text: string; color: string; soft: string }) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={[styles.tag, { backgroundColor: soft }]}>
      <Text style={[styles.tagText, { color }]}>{text}</Text>
    </View>
  );
}

// 空状态
export function Empty({ icon = '🗒️', title, subtitle }: { icon?: string; title: string; subtitle?: string }) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={styles.empty}>
      <Text style={{ fontSize: 40 }}>{icon}</Text>
      <Text style={styles.emptyTitle}>{title}</Text>
      {subtitle ? <Text style={styles.emptySub}>{subtitle}</Text> : null}
    </View>
  );
}

export function Row({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return <View style={[styles.row, style]}>{children}</View>;
}

export function Txt({
  children,
  size = font.md,
  color,
  weight = '400',
  style,
}: {
  children: React.ReactNode;
  size?: number;
  color?: string;
  weight?: TextStyle['fontWeight'];
  style?: StyleProp<TextStyle>;
}) {
  const colors = useColors();
  return <Text style={[{ fontSize: size, color: color ?? colors.text, fontWeight: weight }, style]}>{children}</Text>;
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.card,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      ...shadow.card,
    },
    sectionRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.md,
    },
    sectionTitle: { fontSize: font.lg, fontWeight: '700', color: colors.text },
    pageTitleRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
    pageTitleLead: { flex: 1, flexDirection: 'row', alignItems: 'stretch', paddingRight: spacing.md },
    pageTitleMark: {
      width: 3,
      minHeight: 40,
      borderRadius: radius.pill,
      backgroundColor: colors.accent,
      marginRight: spacing.md,
    },
    pageTitleCopy: { justifyContent: 'center' },
    pageTitleText: {
      fontSize: font.xxl,
      lineHeight: 31,
      fontWeight: '900',
      color: colors.text,
      letterSpacing: -0.5,
    },
    pageTitleTrace: { width: 86, alignItems: 'flex-end', gap: 9, paddingTop: 4 },
    pageTitleTraceRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    pageTitleTraceLine: { height: 1, borderRadius: radius.pill, backgroundColor: colors.border },
    pageTitleTraceDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.accent },
    button: {
      height: 52,
      borderRadius: radius.md,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: spacing.lg,
    },
    buttonInner: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    buttonText: { fontSize: font.md, fontWeight: '700' },
    segmented: {
      flexDirection: 'row',
      backgroundColor: colors.card,
      borderRadius: radius.pill,
      padding: 4,
      borderWidth: 1,
      borderColor: colors.border,
    },
    segItem: { flex: 1 },
    segPill: {
      height: 38,
      borderRadius: radius.pill,
      alignItems: 'center',
      justifyContent: 'center',
    },
    segPillActive: { backgroundColor: colors.primarySoft },
    segText: { fontSize: font.sm, color: colors.textSecondary, fontWeight: '600' },
    segTextActive: { color: colors.primaryDark, fontWeight: '700' },
    tag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill },
    tagText: { fontSize: font.xs, fontWeight: '700' },
    empty: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40, gap: 6 },
    emptyTitle: { fontSize: font.md, fontWeight: '700', color: colors.text, marginTop: 6 },
    emptySub: { fontSize: font.sm, color: colors.textTertiary, textAlign: 'center' },
    row: { flexDirection: 'row', alignItems: 'center' },
  });
