import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LineChart } from '../../src/components/charts';
import { Card, Empty, Segmented } from '../../src/components/ui';
import { useStore } from '../../src/store/AppStore';
import { font, Palette, radius, shadow, spacing, useColors } from '../../src/theme';
import { daysBetween, lastNDays, prettyDate, shortLabel, todayKey, toKey } from '../../src/utils/date';
import { calcCalorieGoal } from '../../src/utils/nutrition';
import { latestWeight, sumExercise, sumFood, sumWater, weightForDate } from '../../src/utils/selectors';

const W = Dimensions.get('window').width;

interface DayBalance {
  date: string;
  intake: number;
  exercise: number;
  expenditure: number;
  net: number;
  cumIntake: number;
  cumExpenditure: number;
  cumNet: number;
}

function buildDailyBalance(keys: string[], intake: number[], burned: number[], goal: number): DayBalance[] {
  let cumIntake = 0;
  let cumExpenditure = 0;
  return keys.map((date, i) => {
    const dayIntake = intake[i];
    const dayExercise = burned[i];
    const dayExpenditure = goal + dayExercise;
    cumIntake += dayIntake;
    cumExpenditure += dayExpenditure;
    return {
      date,
      intake: dayIntake,
      exercise: dayExercise,
      expenditure: dayExpenditure,
      net: dayIntake - dayExpenditure,
      cumIntake,
      cumExpenditure,
      cumNet: cumIntake - cumExpenditure,
    };
  });
}

export default function StatsScreen() {
  const { data } = useStore();
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [period, setPeriod] = useState<'week' | 'month'>('week');
  const days = period === 'week' ? 7 : 30;
  const profile = data.profile;
  const goal = profile ? calcCalorieGoal(profile, latestWeight(data.weightLogs) ?? undefined) : 1800;

  const keys = useMemo(() => lastNDays(days), [days]);

  const intake = keys.map((k) => sumFood(data.foodLogs, k));
  const burned = keys.map((k) => sumExercise(data.exerciseLogs, k));
  const water = keys.map((k) => sumWater(data.waterLogs, k));

  const dailyBalance = useMemo(
    () => buildDailyBalance(keys, intake, burned, goal),
    [keys, intake, burned, goal],
  );

  const periodTotals = useMemo(() => {
    const last = dailyBalance[dailyBalance.length - 1];
    return last
      ? { intake: last.cumIntake, expenditure: last.cumExpenditure, net: last.cumNet }
      : { intake: 0, expenditure: 0, net: 0 };
  }, [dailyBalance]);

  const allTimeTotals = useMemo(() => {
    const totalIntake = Math.round(data.foodLogs.reduce((s, l) => s + l.calories, 0));
    const totalExercise = Math.round(data.exerciseLogs.reduce((s, l) => s + l.calories, 0));
    const startDate = profile ? toKey(new Date(profile.createdAt)) : keys[0];
    const metabolismDays = daysBetween(startDate, todayKey());
    const totalMetabolism = goal * metabolismDays;
    const totalExpenditure = totalExercise + totalMetabolism;
    return {
      intake: totalIntake,
      exercise: totalExercise,
      metabolism: totalMetabolism,
      expenditure: totalExpenditure,
      net: totalIntake - totalExpenditure,
    };
  }, [data.foodLogs, data.exerciseLogs, profile, goal, keys]);

  // 日均（仅统计有记录的天，避免被空白天拉低）
  const activeDays = keys.filter((k, i) => intake[i] > 0 || burned[i] > 0 || water[i] > 0).length || 1;
  const avg = (arr: number[]) => Math.round(arr.reduce((s, v) => s + v, 0) / activeDays);
  const avgIntake = avg(intake);
  const avgBurned = avg(burned);
  const avgWater = avg(water);
  const net = avgIntake - avgBurned - goal;

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
            {/* 累计收支（至今） */}
            <Card style={styles.cumCard}>
              <Text style={styles.cumTitle}>累计收支（至今）</Text>
              <View style={styles.cumRow}>
                <CumMetric label="累计摄入" value={allTimeTotals.intake} unit="kcal" color={colors.diet} />
                <View style={styles.cumDivider} />
                <CumMetric label="累计支出" value={allTimeTotals.expenditure} unit="kcal" color={colors.exercise} />
              </View>
              <Text style={styles.cumHint}>
                支出含基础代谢 {allTimeTotals.metabolism} kcal + 运动 {allTimeTotals.exercise} kcal
              </Text>
              <View style={[styles.cumNet, { backgroundColor: allTimeTotals.net <= 0 ? colors.primarySoft : '#FEF3C7' }]}>
                <Text style={styles.cumNetLabel}>净收支</Text>
                <Text style={[styles.cumNetValue, { color: allTimeTotals.net <= 0 ? colors.primaryDark : colors.warning }]}>
                  {allTimeTotals.net > 0 ? '+' : ''}
                  {allTimeTotals.net} kcal（{allTimeTotals.net <= 0 ? '缺口' : '盈余'}）
                </Text>
              </View>
            </Card>

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

            {/* 每日热量收支时间轴 */}
            <Card padded={false}>
              <View style={[styles.cardTitleRow, { paddingHorizontal: spacing.lg, paddingTop: spacing.lg }]}>
                <Text style={styles.cardTitle}>热量收支时间轴</Text>
                <Text style={styles.cardHint}>按日 · 目标 {goal} kcal</Text>
              </View>
              <View style={styles.timeline}>
                {[...dailyBalance].reverse().map((day, idx, arr) => (
                  <DayBalanceRow key={day.date} day={day} isFirst={idx === 0} isLast={idx === arr.length - 1} />
                ))}
              </View>
              <View style={styles.periodSummary}>
                <Text style={styles.periodSummaryTitle}>
                  {period === 'week' ? '近 7 天' : '近 30 天'}累计
                </Text>
                <View style={styles.periodSummaryRow}>
                  <Text style={styles.periodSummaryText}>
                    摄入 <Text style={styles.periodSummaryValue}>{periodTotals.intake}</Text>
                  </Text>
                  <Text style={styles.periodSummaryText}>
                    支出 <Text style={styles.periodSummaryValue}>{periodTotals.expenditure}</Text>
                  </Text>
                  <Text
                    style={[
                      styles.periodSummaryText,
                      { color: periodTotals.net <= 0 ? colors.primaryDark : colors.warning },
                    ]}
                  >
                    净{periodTotals.net <= 0 ? '缺口' : '盈余'}{' '}
                    <Text style={styles.periodSummaryValue}>{Math.abs(periodTotals.net)}</Text>
                  </Text>
                </View>
              </View>
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

function CumMetric({ label, value, unit, color }: { label: string; value: number; unit: string; color: string }) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={styles.cumMetric}>
      <Text style={styles.cumMetricLabel}>{label}</Text>
      <Text style={[styles.cumMetricValue, { color }]}>{value}</Text>
      <Text style={styles.cumMetricUnit}>{unit}</Text>
    </View>
  );
}

function DayBalanceRow({ day, isFirst, isLast }: { day: DayBalance; isFirst: boolean; isLast: boolean }) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const surplus = day.net > 0;
  const hasLog = day.intake > 0 || day.exercise > 0;

  return (
    <View style={[styles.timelineRow, isLast && styles.timelineRowLast]}>
      <View style={styles.timelineAxis}>
        <View style={[styles.timelineDot, isFirst && styles.timelineDotActive]} />
        {!isLast ? <View style={styles.timelineLine} /> : null}
      </View>
      <View style={[styles.timelineContent, !hasLog && styles.timelineContentMuted]}>
        <View style={styles.timelineHeader}>
          <Text style={styles.timelineDate}>{prettyDate(day.date)}</Text>
          <Text style={[styles.timelineNet, { color: surplus ? colors.warning : colors.primaryDark }]}>
            {day.net > 0 ? '+' : ''}
            {day.net} kcal
          </Text>
        </View>
        <View style={styles.timelineMetrics}>
          <Text style={styles.timelineMetric}>
            摄入 <Text style={styles.timelineMetricValue}>{day.intake}</Text>
          </Text>
          <Text style={styles.timelineMetricSep}>·</Text>
          <Text style={styles.timelineMetric}>
            支出 <Text style={styles.timelineMetricValue}>{day.expenditure}</Text>
          </Text>
          <Text style={styles.timelineMetricSep}>·</Text>
          <Text style={styles.timelineMetric}>
            {surplus ? '盈余' : '缺口'}{' '}
            <Text style={[styles.timelineMetricValue, { color: surplus ? colors.warning : colors.primaryDark }]}>
              {Math.abs(day.net)}
            </Text>
          </Text>
        </View>
        <Text style={styles.timelineCum}>
          累计 摄入 {day.cumIntake} · 支出 {day.cumExpenditure} · 净{day.cumNet <= 0 ? '缺口' : '盈余'}{' '}
          {Math.abs(day.cumNet)}
        </Text>
      </View>
    </View>
  );
}

function StatBox({ icon, color, label, value, unit }: { icon: any; color: string; label: string; value: number; unit: string }) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={styles.statBox}>
      <Ionicons name={icon} size={20} color={color} />
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statUnit}>{unit}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.bg },
    header: { paddingHorizontal: spacing.xl, paddingTop: spacing.sm, paddingBottom: spacing.md },
    headerTitle: { fontSize: font.xxl, fontWeight: '800', color: colors.text },
    scroll: { paddingHorizontal: spacing.xl, paddingTop: spacing.sm },

    cumCard: { ...shadow.soft },
    cumTitle: { fontSize: font.lg, fontWeight: '700', color: colors.text, marginBottom: spacing.md },
    cumRow: { flexDirection: 'row', alignItems: 'center' },
    cumMetric: { flex: 1, alignItems: 'center', gap: 2 },
    cumMetricLabel: { fontSize: font.sm, color: colors.textSecondary },
    cumMetricValue: { fontSize: font.xxl, fontWeight: '800' },
    cumMetricUnit: { fontSize: font.xs, color: colors.textTertiary },
    cumDivider: { width: 1, height: 48, backgroundColor: colors.divider },
    cumHint: { fontSize: font.xs, color: colors.textTertiary, marginTop: spacing.md, textAlign: 'center' },
    cumNet: { marginTop: spacing.md, borderRadius: radius.md, padding: spacing.md, alignItems: 'center' },
    cumNetLabel: { fontSize: font.sm, color: colors.textSecondary },
    cumNetValue: { fontSize: font.lg, fontWeight: '800', marginTop: 2 },

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

    timeline: { paddingHorizontal: spacing.lg },
    timelineRow: { flexDirection: 'row', minHeight: 88 },
    timelineRowLast: { minHeight: 72 },
    timelineAxis: { width: 20, alignItems: 'center' },
    timelineDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.divider, marginTop: 6 },
    timelineDotActive: { backgroundColor: colors.primary },
    timelineLine: { flex: 1, width: 2, backgroundColor: colors.divider, marginVertical: 4 },
    timelineContent: {
      flex: 1,
      paddingBottom: spacing.lg,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.divider,
    },
    timelineContentMuted: { opacity: 0.65 },
    timelineHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    timelineDate: { fontSize: font.md, fontWeight: '700', color: colors.text },
    timelineNet: { fontSize: font.md, fontWeight: '800' },
    timelineMetrics: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', marginTop: 4, gap: 4 },
    timelineMetric: { fontSize: font.sm, color: colors.textSecondary },
    timelineMetricValue: { fontWeight: '700', color: colors.text },
    timelineMetricSep: { fontSize: font.sm, color: colors.textTertiary },
    timelineCum: { fontSize: font.xs, color: colors.textTertiary, marginTop: 6 },

    periodSummary: {
      marginTop: spacing.sm,
      padding: spacing.lg,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.divider,
      backgroundColor: colors.bg,
    },
    periodSummaryTitle: { fontSize: font.sm, fontWeight: '700', color: colors.textSecondary, marginBottom: spacing.sm },
    periodSummaryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
    periodSummaryText: { fontSize: font.sm, color: colors.textSecondary },
    periodSummaryValue: { fontWeight: '800', color: colors.text },
  });
