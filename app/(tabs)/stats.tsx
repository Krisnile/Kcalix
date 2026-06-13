import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BarChart, LineChart } from '../../src/components/charts';
import { Card, Empty, Segmented } from '../../src/components/ui';
import { useStore } from '../../src/store/AppStore';
import { colors, font, radius, shadow, spacing } from '../../src/theme';
import { lastNDays, shortLabel, weekday } from '../../src/utils/date';
import { calcCalorieGoal } from '../../src/utils/nutrition';
import { latestWeight, sumExercise, sumFood, sumWater, weightForDate } from '../../src/utils/selectors';

const W = Dimensions.get('window').width;

export default function StatsScreen() {
  const { data } = useStore();
  const [period, setPeriod] = useState<'week' | 'month'>('week');
  const days = period === 'week' ? 7 : 30;
  const profile = data.profile;
  const goal = profile ? calcCalorieGoal(profile, latestWeight(data.weightLogs) ?? undefined) : 1800;

  const keys = useMemo(() => lastNDays(days), [days]);

  const intake = keys.map((k) => sumFood(data.foodLogs, k));
  const burned = keys.map((k) => sumExercise(data.exerciseLogs, k));
  const water = keys.map((k) => sumWater(data.waterLogs, k));

  // 日均（仅统计有记录的天，避免被空白天拉低）
  const activeDays = keys.filter((k, i) => intake[i] > 0 || burned[i] > 0 || water[i] > 0).length || 1;
  const avg = (arr: number[]) => Math.round(arr.reduce((s, v) => s + v, 0) / activeDays);
  const avgIntake = avg(intake);
  const avgBurned = avg(burned);
  const avgWater = avg(water);
  const net = avgIntake - avgBurned - goal; // >0 盈余，<0 缺口

  // 摄入柱状图：周=7天；月=按周聚合为日均
  const intakeBars = useMemo(() => {
    if (period === 'week') {
      return keys.map((k, i) => ({ label: weekday(k).replace('周', ''), value: intake[i] }));
    }
    const buckets: { label: string; value: number }[] = [];
    for (let w = 0; w < 4; w++) {
      const slice = intake.slice(w * 7, w * 7 + 7);
      const wActive = slice.filter((v) => v > 0).length || 1;
      buckets.push({ label: `${w + 1}周`, value: Math.round(slice.reduce((s, v) => s + v, 0) / wActive) });
    }
    return buckets;
  }, [period, keys, intake]);

  // 体重趋势（每天取值，保留最新点）
  const weightPoints = useMemo(
    () => keys.map((k) => ({ label: shortLabel(k), value: weightForDate(data.weightLogs, k) })),
    [keys, data.weightLogs],
  );

  const startWeight = weightForDate(data.weightLogs, keys[0]);
  const endWeight = latestWeight(data.weightLogs);
  const weightDelta =
    startWeight != null && endWeight != null ? Math.round((endWeight - startWeight) * 10) / 10 : null;

  const hasData = activeDays > 0 && (avgIntake > 0 || avgBurned > 0 || avgWater > 0);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>统计</Text>
        <Segmented
          style={{ marginTop: spacing.md }}
          value={period}
          onChange={setPeriod}
          options={[
            { value: 'week', label: '近 7 天' },
            { value: 'month', label: '近 30 天' },
          ]}
        />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {!hasData ? (
          <Card>
            <Empty icon="📊" title="还没有足够的数据" subtitle="去“添加”记录饮食、运动或饮水后，这里会生成统计分析" />
          </Card>
        ) : (
          <View style={{ gap: spacing.lg }}>
            {/* 卡路里收支 */}
            <Card style={[styles.netCard, { backgroundColor: net <= 0 ? colors.primary : colors.warning }]}>
              <Text style={styles.netLabel}>日均卡路里{net <= 0 ? '缺口' : '盈余'}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
                <Text style={styles.netValue}>{Math.abs(net)}</Text>
                <Text style={styles.netUnit}>kcal / 天</Text>
              </View>
              <Text style={styles.netHint}>
                {net <= 0 ? '保持热量缺口，有助于减脂 💪' : '摄入高于消耗，注意控制哦'}
              </Text>
            </Card>

            {/* 三项日均 */}
            <View style={styles.statsRow}>
              <StatBox icon="restaurant-outline" color={colors.diet} label="日均摄入" value={avgIntake} unit="kcal" />
              <StatBox icon="walk-outline" color={colors.exercise} label="日均运动" value={avgBurned} unit="kcal" />
              <StatBox icon="water-outline" color={colors.water} label="日均饮水" value={avgWater} unit="ml" />
            </View>

            {/* 摄入趋势 */}
            <Card>
              <View style={styles.cardTitleRow}>
                <Text style={styles.cardTitle}>摄入趋势</Text>
                <Text style={styles.cardHint}>目标 {goal} kcal</Text>
              </View>
              <BarChart data={intakeBars} width={W - spacing.xl * 2 - spacing.lg * 2} color={colors.diet} goal={goal} />
            </Card>

            {/* 体重变化 */}
            <Card>
              <View style={styles.cardTitleRow}>
                <Text style={styles.cardTitle}>体重变化</Text>
                {weightDelta != null ? (
                  <Text style={[styles.delta, { color: weightDelta <= 0 ? colors.success : colors.warning }]}>
                    {weightDelta > 0 ? '+' : ''}
                    {weightDelta} kg
                  </Text>
                ) : null}
              </View>
              {data.weightLogs.length === 0 ? (
                <Empty icon="⚖️" title="暂无体重记录" />
              ) : (
                <LineChart data={weightPoints} width={W - spacing.xl * 2 - spacing.lg * 2} color={colors.weight} unit="kg" />
              )}
            </Card>
          </View>
        )}
        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function StatBox({ icon, color, label, value, unit }: { icon: any; color: string; label: string; value: number; unit: string }) {
  return (
    <View style={styles.statBox}>
      <Ionicons name={icon} size={20} color={color} />
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statUnit}>{unit}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: spacing.xl, paddingTop: spacing.sm, paddingBottom: spacing.md },
  headerTitle: { fontSize: font.xxl, fontWeight: '800', color: colors.text },
  scroll: { paddingHorizontal: spacing.xl, paddingTop: spacing.sm },

  netCard: { alignItems: 'flex-start', ...shadow.float },
  netLabel: { color: 'rgba(255,255,255,0.9)', fontSize: font.md },
  netValue: { color: '#fff', fontSize: 48, fontWeight: '800', marginTop: 2 },
  netUnit: { color: 'rgba(255,255,255,0.9)', fontSize: font.md },
  netHint: { color: 'rgba(255,255,255,0.92)', fontSize: font.sm, marginTop: spacing.sm },

  statsRow: { flexDirection: 'row', gap: spacing.md },
  statBox: { flex: 1, backgroundColor: colors.card, borderRadius: radius.lg, alignItems: 'center', paddingVertical: spacing.lg, gap: 2, ...shadow.soft },
  statValue: { fontSize: font.xl, fontWeight: '800' },
  statUnit: { fontSize: 10, color: colors.textTertiary },
  statLabel: { fontSize: font.xs, color: colors.textSecondary, marginTop: 2 },

  cardTitle: { fontSize: font.lg, fontWeight: '700', color: colors.text },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
  cardHint: { fontSize: font.sm, color: colors.textTertiary },
  delta: { fontSize: font.md, fontWeight: '800' },
});
