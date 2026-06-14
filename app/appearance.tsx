import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStore } from '../src/store/AppStore';
import { font, Palette, radius, shadow, spacing, useColors } from '../src/theme';
import { ThemeMode } from '../src/types';

const OPTIONS: { value: ThemeMode; label: string; desc: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { value: 'light', label: '浅色', desc: '明亮清新，适合白天使用', icon: 'sunny-outline' },
  { value: 'dark', label: '深色', desc: '护眼省电，适合夜间使用', icon: 'moon-outline' },
  { value: 'system', label: '跟随系统', desc: '随系统外观自动切换', icon: 'phone-portrait-outline' },
];

export default function AppearanceScreen() {
  const router = useRouter();
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { data, updateSettings } = useStore();
  const current = data.settings.theme ?? 'light';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.head}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.closeBtn}>
          <Ionicons name="chevron-down" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.title}>外观主题</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.hint}>选择应用的整体配色风格</Text>
        <View style={styles.card}>
          {OPTIONS.map((opt, i) => {
            const active = current === opt.value;
            return (
              <Pressable
                key={opt.value}
                onPress={() => updateSettings({ theme: opt.value })}
                style={[styles.row, i < OPTIONS.length - 1 && styles.rowBorder]}
              >
                <View style={[styles.iconBox, active && { backgroundColor: colors.primarySoft }]}>
                  <Ionicons name={opt.icon} size={20} color={active ? colors.primaryDark : colors.textSecondary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowLabel}>{opt.label}</Text>
                  <Text style={styles.rowDesc}>{opt.desc}</Text>
                </View>
                {active ? (
                  <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
                ) : (
                  <View style={styles.radio} />
                )}
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.bg },
    head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
    closeBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
    title: { fontSize: font.lg, fontWeight: '700', color: colors.text },
    scroll: { padding: spacing.xl },
    hint: { fontSize: font.sm, color: colors.textTertiary, marginBottom: spacing.md, marginLeft: spacing.xs },
    card: { backgroundColor: colors.card, borderRadius: radius.lg, paddingHorizontal: spacing.lg, ...shadow.soft },
    row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.lg },
    rowBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.divider },
    iconBox: { width: 40, height: 40, borderRadius: radius.md, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
    rowLabel: { fontSize: font.md, fontWeight: '700', color: colors.text },
    rowDesc: { fontSize: font.xs, color: colors.textTertiary, marginTop: 2 },
    radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: colors.border },
  });
