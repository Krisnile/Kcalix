import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { font, Palette, radius, shadow, useColors } from '../../src/theme';

const TABS: {
  name: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconActive: keyof typeof Ionicons.glyphMap;
  center?: boolean;
}[] = [
  { name: 'index', label: '记录', icon: 'today-outline', iconActive: 'today' },
  { name: 'stats', label: '统计', icon: 'stats-chart-outline', iconActive: 'stats-chart' },
  { name: 'add', label: '添加', icon: 'add', iconActive: 'add', center: true },
  { name: 'food', label: '食谱', icon: 'restaurant-outline', iconActive: 'restaurant' },
  { name: 'profile', label: '我的', icon: 'person-outline', iconActive: 'person' },
];

export default function TabsLayout() {
  return (
    <Tabs tabBar={(props) => <CustomTabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="stats" />
      <Tabs.Screen name="add" />
      <Tabs.Screen name="food" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}

function CustomTabBar({ state, navigation }: any) {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      {TABS.map((tab, i) => {
        const route = state.routes.find((r: any) => r.name === tab.name);
        const routeIndex = state.routes.findIndex((r: any) => r.name === tab.name);
        const focused = state.index === routeIndex;

        const onPress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route?.key, canPreventDefault: true });
          if (!focused && !event.defaultPrevented) navigation.navigate(tab.name);
        };

        if (tab.center) {
          return (
            <Pressable key={tab.name} style={styles.centerWrap} onPress={onPress}>
              <View style={styles.centerBtn}>
                <Ionicons name="add" size={32} color="#fff" />
                <View style={styles.centerSpark} />
              </View>
              <Text style={styles.centerLabel}>{tab.label}</Text>
            </Pressable>
          );
        }

        return (
          <Pressable key={tab.name} style={styles.item} onPress={onPress}>
            <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
              <Ionicons
                name={focused ? tab.iconActive : tab.icon}
                size={21}
                color={focused ? colors.primaryDark : colors.textTertiary}
              />
              {focused ? <View style={styles.tabStatusDot} /> : null}
            </View>
            <Text style={[styles.label, focused && { color: colors.primary, fontWeight: '700' }]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    bar: {
      flexDirection: 'row',
      backgroundColor: colors.card,
      paddingTop: 8,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
    },
    item: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2 },
    iconWrap: { position: 'relative', width: 38, height: 28, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
    iconWrapActive: { backgroundColor: colors.primarySoft },
    tabStatusDot: { position: 'absolute', right: 4, top: 4, width: 4, height: 4, borderRadius: 2, backgroundColor: colors.accent },
    label: { fontSize: font.xs, color: colors.textTertiary },
    centerWrap: { flex: 1, alignItems: 'center', justifyContent: 'flex-start', gap: 2 },
    centerBtn: {
      position: 'relative',
      width: 46,
      height: 46,
      borderRadius: radius.md,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: -17,
      borderWidth: 3,
      borderColor: colors.card,
      ...shadow.float,
    },
    centerSpark: { position: 'absolute', right: 5, top: 5, width: 5, height: 5, borderRadius: 3, backgroundColor: colors.accent },
    centerLabel: { fontSize: font.xs, color: colors.textSecondary, fontWeight: '600' },
  });
