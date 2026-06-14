import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LineChart } from '../../src/components/charts';
import { Card, Empty, Segmented } from '../../src/components/ui';
import { useStore } from '../../src/store/AppStore';
import { font, Palette, radius, shadow, spacing, useColors } from '../../src/theme';
import { ExerciseLog, FoodLog } from '../../src/types';
import { lastNDays, prettyDate, shortLabel } from '../../src/utils/date';
import { calcTDEE } from '../../src/utils/nutrition';
import {
  firstRecordDate,
  hasCalorieRecord,
  latestWeight,
  sumExercise,
  sumFood,
  sumWater,
} from '../../src/utils/selectors';

const W = Dimensions.get('window').width;

interface DayBalance {
  date: string;
  intake: number;
  exercise: number;
  metabolism: number;
  expenditure: number;
  net: number;
  cumIntake: number;
  cumExpenditure: number;
  cumNet: number;
}

function buildDailyBalance(
  keys: string[],
  foodLogs: FoodLog[],
  exerciseLogs: ExerciseLog[],
  tdee: number,
  recordFrom: string | null,
): DayBalance[] {
  if (!recordFrom) return [];

  let cumIntake = 0;
  let cumExpenditure = 0;
  const result: DayBalance[] = [];

  for (const date of keys) {
    if (date < recordFrom) continue;
    if (!hasCalorieRecord(foodLogs, exerciseLogs, date)) continue;

    const dayIntake = sumFood(foodLogs, date);
    const dayExercise = sumExercise(exerciseLogs, date);
    const dayExpenditure = tdee + dayExercise;
    cumIntake += dayIntake;
    cumExpenditure += dayExpenditure;

    result.push({
      date,
      intake: dayIntake,
      exercise: dayExercise,
      metabolism: tdee,
      expenditure: dayExpenditure,
      net: dayIntake - dayExpenditure,
      cumIntake,
      cumExpenditure,
      cumNet: cumIntake - cumExpenditure,
    });
  }

  return result;
}

function buildAllTimeBalance(foodLogs: FoodLog[], exerciseLogs: ExerciseLog[], tdee: number): DayBalance[] {
  const start = firstRecordDate(foodLogs, exerciseLogs);
  if (!start) return [];

  const dates = new Set<string>();
  foodLogs.forEach((l) => dates.add(l.date));
  exerciseLogs.forEach((l) => dates.add(l.date));

  const keys = [...dates].filter((d) => d >= start).sort();
  return buildDailyBalance(keys, foodLogs, exerciseLogs, tdee, start);
}

export default function StatsScreen() {
  const { data } = useStore();
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [period, setPeriod] = useState<'week' | 'month'>('week');
  const days = period === 'week' ? 7 : 30;
  const profile = data.profile;
  const currentWeight = latestWeight(data.weightLogs) ?? undefined;
  const tdee = profile ? calcTDEE(profile, currentWeight) : 2000;
  const recordFrom = firstRecordDate(data.foodLogs, data.exerciseLogs);

  const keys = useMemo(() => lastNDays(days), [days]);

  const allTimeBalance = useMemo(
    () => buildAllTimeBalance(data.foodLogs, data.exerciseLogs, tdee),
    [data.foodLogs, data.exerciseLogs, tdee],
  );

  const dailyBalance = useMemo(
    () => allTimeBalance.filter((d) => keys.includes(d.date)),
    [allTimeBalance, keys],
  );

  const periodTotals = useMemo(
    () => ({
      intake: dailyBalance.reduce((s, d) => s + d.intake, 0),
      expenditure: dailyBalance.reduce((s, d) => s + d.expenditure, 0),
      net: dailyBalance.reduce((s, d) => s + d.net, 0),
    }),
    [dailyBalance],
  );

  const allTimeTotals = useMemo(() => {
    const last = allTimeBalance[allTimeBalance.length - 1];
    if (!last) {
      return { intake: 0, exercise: 0, metabolism: 0, expenditure: 0, net: 0 };
    }
    const totalExercise = Math.round(data.exerciseLogs.reduce((s, l) => s + l.calories, 0));
    const totalMetabolism = tdee * allTimeBalance.length;
    return {
      intake: last.cumIntake,
      exercise: totalExercise,
      metabolism: totalMetabolism,
      expenditure: last.cumExpenditure,
      net: last.cumNet,
    };
  }, [allTimeBalance, data.exerciseLogs, tdee]);

  const activeDays = dailyBalance.length || 1;
  const avgIntake = Math.round(dailyBalance.reduce((s, d) => s + d.intake, 0) / activeDays);
  const avgBurned = Math.round(dailyBalance.reduce((s, d) => s + d.exercise, 0) / activeDays);
  const avgWater = Math.round(
    keys.filter((k) => recordFrom && k >= recordFrom).reduce((s, k) => s + sumWater(data.waterLogs, k), 0) /
      activeDays,
  );
  const net = Math.round(dailyBalance.reduce((s, d) => s + d.net, 0) / activeDays);

  const balanceChartPoints = useMemo(
    () => dailyBalance.map((d) => ({ label: shortLabel(d.date), value: d.net })),
    [dailyBalance],
  );

  const hasData = dailyBalance.length > 0;

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
                支出含维持生命 {allTimeTotals.metabolism} kcal + 运动 {allTimeTotals.exercise} kcal
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
                <Text style={styles.cardHint}>仅显示有记录 · 代谢 {tdee} kcal</Text>
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

            {/* 热量收支趋势 */}
            <Card>
              <View style={styles.cardTitleRow}>
                <Text style={styles.cardTitle}>热量收支趋势</Text>
                <Text style={styles.cardHint}>负值为缺口 · 正值为盈余</Text>
              </View>
              {balanceChartPoints.length < 2 ? (
                <Empty icon="📈" title="记录更多天数后显示趋势" subtitle="至少需要 2 天有饮食或运动记录" />
              ) : (
                <LineChart
                  data={balanceChartPoints}
                  width={W - spacing.xl * 2 - spacing.lg * 2}
                  color={colors.calorie}
                  unit=" kcal"
                />
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

  return (
    <View style={[styles.timelineRow, isLast && styles.timelineRowLast]}>
      <View style={styles.timelineAxis}>
        <View style={[styles.timelineDot, isFirst && styles.timelineDotActive]} />
        {!isLast ? <View style={styles.timelineLine} /> : null}
      </View>
      <View style={styles.timelineContent}>
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
          累计 摄入 {day.cumIntake} · 支出 {day.cumExpenditure}（含维持生命 {day.metabolism}/天）· 净
          {day.cumNet <= 0 ? '缺口' : '盈余'} {Math.abs(day.cumNet)}
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
