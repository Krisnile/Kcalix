import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, font, radius, shadow } from '../../src/theme';

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
              </View>
              <Text style={styles.centerLabel}>{tab.label}</Text>
            </Pressable>
          );
        }

        return (
          <Pressable key={tab.name} style={styles.item} onPress={onPress}>
            <Ionicons
              name={focused ? tab.iconActive : tab.icon}
              size={24}
              color={focused ? colors.primary : colors.textTertiary}
            />
            <Text style={[styles.label, focused && { color: colors.primary, fontWeight: '700' }]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    ...shadow.card,
  },
  item: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3 },
  label: { fontSize: font.xs, color: colors.textTertiary },
  centerWrap: { flex: 1, alignItems: 'center', justifyContent: 'flex-start', gap: 3 },
  centerBtn: {
    width: 54,
    height: 54,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -22,
    borderWidth: 4,
    borderColor: colors.card,
    ...shadow.float,
  },
  centerLabel: { fontSize: font.xs, color: colors.primary, fontWeight: '700' },
});
