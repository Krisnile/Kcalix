import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Dimensions, Keyboard, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BarChart, LineChart, RingProgress } from '../../src/components/charts';
import { Card, Empty, PageTitle, Segmented, confirmDelete } from '../../src/components/ui';
import { useStore } from '../../src/store/AppStore';
import { font, getMealColors, Palette, radius, shadow, spacing, useColors } from '../../src/theme';
import { MealType } from '../../src/types';
import { addDays, lastNDays, prettyDate, shortLabel, timeOf, todayKey, weekday } from '../../src/utils/date';
import { bmiCategory, calcBMI, calcCalorieGoal } from '../../src/utils/nutrition';
import {
  foodByMeal,
  latestWeight,
  mealLabel,
  mealOrder,
  sumExercise,
  sumFood,
  sumWater,
  weightForDate,
} from '../../src/utils/selectors';

type RecordView = 'weight' | 'diet' | 'water';
const W = Dimensions.get('window').width;

export default function RecordScreen() {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [view, setView] = useState<RecordView>('diet');
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <PageTitle title="记录" />
        <Segmented
          style={{ marginTop: spacing.md }}
          value={view}
          onChange={setView}
          options={[
            { value: 'weight', label: '体重' },
            { value: 'diet', label: '饮食' },
            { value: 'water', label: '喝水' },
          ]}
        />
      </View>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {view === 'diet' && <DietView />}
        {view === 'weight' && <WeightView />}
        {view === 'water' && <WaterView />}
        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

/* ============== 饮食 ============== */
function DietView() {
  const router = useRouter();
  const { data, removeFood, removeExercise } = useStore();
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [date, setDate] = useState(todayKey());
  const goal = data.profile ? calcCalorieGoal(data.profile, latestWeight(data.weightLogs) ?? undefined) : 1800;

  const eaten = sumFood(data.foodLogs, date);
  const burned = sumExercise(data.exerciseLogs, date);
  const remaining = goal + burned - eaten;
  const meals = foodByMeal(data.foodLogs, date);
  const exercises = data.exerciseLogs.filter((e) => e.date === date);
  const progress = eaten / goal;

  const week = lastNDays(7);
  const bars = week.map((k) => ({ label: weekday(k).replace('周', ''), value: sumFood(data.foodLogs, k), highlight: k === date }));

  return (
    <View style={{ gap: spacing.lg }}>
      <DateNav date={date} onChange={setDate} />

      <Card style={styles.ringCard}>
        <RingProgress progress={progress} color={remaining < 0 ? colors.danger : colors.primary}>
          <View style={{ alignItems: 'center' }}>
            <Text style={styles.ringValue}>{Math.abs(remaining)}</Text>
            <Text style={styles.ringLabel}>{remaining < 0 ? '已超出 kcal' : '剩余 kcal'}</Text>
          </View>
        </RingProgress>
        <View style={styles.ringStats}>
          <StatMini icon="flame-outline" color={colors.calorie} label="目标" value={goal} />
          <StatMini icon="restaurant-outline" color={colors.diet} label="已摄入" value={eaten} />
          <StatMini icon="walk-outline" color={colors.exercise} label="运动" value={burned} />
        </View>
      </Card>

      {mealOrder.map((meal) => (
        <MealCard key={meal} meal={meal} items={meals[meal]} onAdd={() => router.push('/add')} onDelete={removeFood} />
      ))}

      <ExerciseCard items={exercises} total={burned} onAdd={() => router.push('/add')} onDelete={removeExercise} />

      <Card>
        <Text style={styles.cardTitle}>近 7 天摄入</Text>
        <BarChart data={bars} width={W - spacing.xl * 2 - spacing.lg * 2} color={colors.diet} goal={goal} />
        <View style={styles.legendRow}>
          <Legend color={colors.danger} dashed label={`目标线 ${goal} kcal`} />
        </View>
      </Card>
    </View>
  );
}

function MealCard({
  meal,
  items,
  onAdd,
  onDelete,
}: {
  meal: MealType;
  items: { id: string; name: string; calories: number; amount: number; unit: string }[];
  onAdd: () => void;
  onDelete: (id: string) => void;
}) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const mealColors = useMemo(() => getMealColors(colors), [colors]);
  const total = items.reduce((s, i) => s + i.calories, 0);
  const mc = mealColors[meal];
  return (
    <Card>
      <View style={styles.mealHeader}>
        <View style={[styles.mealDot, { backgroundColor: mc.soft }]}>
          <View style={[styles.mealDotInner, { backgroundColor: mc.color }]} />
        </View>
        <Text style={styles.mealTitle}>{mealLabel[meal]}</Text>
        <Text style={styles.mealTotal}>{total} kcal</Text>
        <Pressable onPress={onAdd} hitSlop={8} style={styles.mealAdd}>
          <Ionicons name="add" size={20} color={colors.primaryDark} />
        </Pressable>
      </View>
      {items.length === 0 ? (
        <Text style={styles.mealEmpty}>暂无记录，点击 + 添加</Text>
      ) : (
        items.map((it) => (
          <Pressable
            key={it.id}
            onLongPress={() => confirmDelete(() => onDelete(it.id), it.name)}
            style={styles.foodItem}
          >
            <Text style={styles.foodName} numberOfLines={1}>
              {it.name}
            </Text>
            <Text style={styles.foodAmount}>
              {it.amount}
              {it.unit}
            </Text>
            <Text style={styles.foodCal}>{it.calories} kcal</Text>
            <Ionicons name="ellipsis-horizontal" size={14} color={colors.textTertiary} style={{ marginLeft: 6 }} />
          </Pressable>
        ))
      )}
      {items.length > 0 ? <Text style={styles.tipText}>长按某条记录可删除</Text> : null}
    </Card>
  );
}

function ExerciseCard({
  items,
  total,
  onAdd,
  onDelete,
}: {
  items: { id: string; name: string; calories: number; duration: number }[];
  total: number;
  onAdd: () => void;
  onDelete: (id: string) => void;
}) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <Card>
      <View style={styles.mealHeader}>
        <View style={[styles.mealDot, { backgroundColor: colors.exerciseSoft }]}>
          <Ionicons name="walk" size={15} color={colors.exercise} />
        </View>
        <Text style={styles.mealTitle}>运动消耗</Text>
        <Text style={[styles.mealTotal, { color: colors.exercise }]}>-{total} kcal</Text>
        <Pressable onPress={onAdd} hitSlop={8} style={[styles.mealAdd, { backgroundColor: colors.exerciseSoft }]}>
          <Ionicons name="add" size={20} color={colors.exercise} />
        </Pressable>
      </View>
      {items.length === 0 ? (
        <Text style={styles.mealEmpty}>暂无运动记录，点击 + 添加</Text>
      ) : (
        items.map((it) => (
          <Pressable key={it.id} onLongPress={() => confirmDelete(() => onDelete(it.id), it.name)} style={styles.foodItem}>
            <Text style={styles.foodName} numberOfLines={1}>
              {it.name}
            </Text>
            <Text style={styles.foodAmount}>{it.duration} 分钟</Text>
            <Text style={[styles.foodCal, { color: colors.exercise }]}>-{it.calories} kcal</Text>
            <Ionicons name="ellipsis-horizontal" size={14} color={colors.textTertiary} style={{ marginLeft: 6 }} />
          </Pressable>
        ))
      )}
      {items.length > 0 ? <Text style={styles.tipText}>长按某条记录可删除</Text> : null}
    </Card>
  );
}

/* ============== 体重 ============== */
function WeightView() {
  const router = useRouter();
  const { data, removeWeight } = useStore();
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [range, setRange] = useState<'week' | 'month' | 'year'>('week');
  const recentWeights = [...data.weightLogs].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8);
  const profile = data.profile;
  const current = latestWeight(data.weightLogs) ?? profile?.weight ?? 0;
  const start = profile?.weight ?? current;
  const target = profile?.targetWeight ?? current;
  const bmi = profile ? calcBMI(current, profile.height) : 0;
  const cat = bmiCategory(bmi);

  const days = range === 'week' ? 7 : range === 'month' ? 30 : 365;
  const points = useMemo(() => {
    const keys = lastNDays(days);
    // 年视图按周采样，但务必保留最后一天，避免最新数据被漏掉
    let sampled = keys;
    if (range === 'year') {
      sampled = keys.filter((_, i) => i % 7 === 0);
      if (sampled[sampled.length - 1] !== keys[keys.length - 1]) sampled.push(keys[keys.length - 1]);
    }
    return sampled.map((k) => ({ label: shortLabel(k), value: weightForDate(data.weightLogs, k) }));
  }, [data.weightLogs, range, days]);

  const diff = Math.round((current - start) * 10) / 10;
  const toGoal = Math.round((current - target) * 10) / 10;

  return (
    <View style={{ gap: spacing.lg }}>
      <Card style={styles.weightHeroCard}>
        <View style={{ flex: 1 }}>
          <Text style={styles.heroLabel}>当前体重</Text>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
            <Text style={styles.heroValue}>{current}</Text>
            <Text style={styles.heroUnit}>kg</Text>
          </View>
          <View style={[styles.bmiTag, { backgroundColor: cat.color + '22' }]}>
            <Text style={[styles.bmiText, { color: cat.color }]}>BMI {bmi} · {cat.label}</Text>
          </View>
        </View>
        <View style={styles.weightSideStats}>
          <SideStat label="较初始" value={`${diff > 0 ? '+' : ''}${diff} kg`} color={diff <= 0 ? colors.success : colors.warning} />
          <SideStat label="距目标" value={`${Math.abs(toGoal)} kg`} color={colors.weight} />
        </View>
      </Card>

      <Card>
        <View style={styles.cardTitleRow}>
          <Text style={styles.cardTitle}>体重趋势</Text>
          <Segmented
            style={{ width: 180 }}
            value={range}
            onChange={setRange}
            options={[
              { value: 'week', label: '周' },
              { value: 'month', label: '月' },
              { value: 'year', label: '年' },
            ]}
          />
        </View>
        {data.weightLogs.length === 0 ? (
          <Empty icon="⚖️" title="还没有体重记录" subtitle="去“添加”记录第一笔体重吧" />
        ) : (
          <LineChart data={points} width={W - spacing.xl * 2 - spacing.lg * 2} color={colors.weight} unit="kg" />
        )}
        {data.weightLogs.length > 0 ? <Text style={styles.tipText}>按住图表查看每天的具体数值</Text> : null}
      </Card>

      <Card>
        <Text style={styles.cardTitle}>目标进度</Text>
        <GoalProgress start={start} current={current} target={target} />
      </Card>

      {recentWeights.length > 0 ? (
        <Card>
          <Text style={styles.cardTitle}>体重记录</Text>
          {recentWeights.map((w, i) => {
            const prev = recentWeights[i + 1];
            const delta = prev ? Math.round((w.weight - prev.weight) * 10) / 10 : null;
            return (
              <Pressable
                key={w.id}
                onLongPress={() => confirmDelete(() => removeWeight(w.id), `${prettyDate(w.date)} ${w.weight}kg`)}
                style={styles.foodItem}
              >
                <Text style={styles.foodName}>{prettyDate(w.date)}</Text>
                {delta != null ? (
                  <Text style={[styles.foodAmount, { color: delta <= 0 ? colors.success : colors.warning }]}>
                    {delta > 0 ? '+' : ''}
                    {delta} kg
                  </Text>
                ) : (
                  <Text style={styles.foodAmount}>起始</Text>
                )}
                <Text style={[styles.foodCal, { color: colors.weight }]}>{w.weight} kg</Text>
                <Ionicons name="ellipsis-horizontal" size={14} color={colors.textTertiary} style={{ marginLeft: 6 }} />
              </Pressable>
            );
          })}
          <Text style={styles.tipText}>长按某条记录可删除 · 同一天再次记录会自动覆盖</Text>
        </Card>
      ) : null}

      <Pressable style={styles.addWeightBtn} onPress={() => router.push('/add')}>
        <Ionicons name="add-circle" size={22} color={colors.weight} />
        <Text style={[styles.addWeightText, { color: colors.weight }]}>记录今日体重</Text>
      </Pressable>
    </View>
  );
}

function GoalProgress({ start, current, target }: { start: number; current: number; target: number }) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const totalNeeded = Math.abs(start - target) || 1;
  const done = Math.abs(start - current);
  const ratio = Math.max(0, Math.min(1, done / totalNeeded));
  return (
    <View style={{ marginTop: spacing.md }}>
      <View style={styles.goalLabels}>
        <Text style={styles.goalEnd}>起始 {start}kg</Text>
        <Text style={[styles.goalEnd, { color: colors.weight }]}>目标 {target}kg</Text>
      </View>
      <View style={styles.goalTrack}>
        <View style={[styles.goalFill, { width: `${ratio * 100}%` }]} />
        <View style={[styles.goalThumb, { left: `${ratio * 100}%` }]} />
      </View>
      <Text style={styles.goalPct}>已完成 {Math.round(ratio * 100)}%</Text>
    </View>
  );
}

/* ============== 喝水 ============== */
function WaterView() {
  const { data, addWater, removeWater } = useStore();
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const date = todayKey();
  const goal = data.profile?.waterGoal ?? 2000;
  const today = sumWater(data.waterLogs, date);
  const cups = Math.round(goal / 250);
  const filled = Math.min(cups, Math.round(today / 250));

  const todayLogs = data.waterLogs
    .filter((w) => w.date === date)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const week = lastNDays(7);
  const bars = week.map((k) => ({ label: weekday(k).replace('周', ''), value: sumWater(data.waterLogs, k), highlight: k === date }));

  const quick = [200, 300, 500];
  const [customWater, setCustomWater] = useState('');
  const customAmount = parseInt(customWater, 10);
  const customValid = Number.isFinite(customAmount) && customAmount >= 1 && customAmount <= 5000;

  const addCustomWater = () => {
    if (!customValid) return;
    addWater({ date, amount: customAmount });
    setCustomWater('');
    Keyboard.dismiss();
  };

  return (
    <View style={{ gap: spacing.lg }}>
      <Card style={styles.waterHero}>
        <RingProgress progress={today / goal} color={colors.water} size={160} stroke={14}>
          <View style={{ alignItems: 'center' }}>
            <Text style={[styles.ringValue, { color: colors.water }]}>{today}</Text>
            <Text style={styles.ringLabel}>/ {goal} ml</Text>
          </View>
        </RingProgress>
        <View style={styles.cupsRow}>
          {Array.from({ length: Math.min(cups, 10) }).map((_, i) => (
            <Ionicons key={i} name="water" size={22} color={i < filled ? colors.water : colors.divider} style={{ marginHorizontal: 2 }} />
          ))}
        </View>
      </Card>

      <Card>
        <View style={styles.waterSectionHead}>
          <Text style={styles.cardTitle}>快速记录</Text>
          <Text style={styles.waterSectionHint}>今天还差 {Math.max(0, goal - today)} ml</Text>
        </View>
        <View style={styles.quickRow}>
          {quick.map((q) => (
            <Pressable key={q} style={styles.quickBtn} onPress={() => addWater({ date, amount: q })}>
              <Ionicons name="water-outline" size={22} color={colors.water} />
              <Text style={styles.quickText}>+{q}ml</Text>
            </Pressable>
          ))}
        </View>
        <View style={styles.inlineWaterInput}>
          <TextInput
            value={customWater}
            onChangeText={(value) => setCustomWater(value.replace(/\D/g, '').slice(0, 4))}
            placeholder="自定义饮水量"
            placeholderTextColor={colors.textTertiary}
            keyboardType="number-pad"
            returnKeyType="done"
            onSubmitEditing={addCustomWater}
            style={styles.inlineWaterText}
          />
          <Text style={styles.inlineWaterUnit}>ml</Text>
          <Pressable
            disabled={!customValid}
            onPress={addCustomWater}
            style={[styles.inlineWaterAdd, !customValid && { opacity: 0.4 }]}
          >
            <Ionicons name="add" size={20} color="#fff" />
            <Text style={styles.inlineWaterAddText}>记录</Text>
          </Pressable>
        </View>
      </Card>

      <Card>
        <Text style={styles.cardTitle}>今日饮水记录</Text>
        {todayLogs.length === 0 ? (
          <Text style={styles.mealEmpty}>今天还没有饮水记录</Text>
        ) : (
          todayLogs.map((w) => (
            <Pressable
              key={w.id}
              onLongPress={() => confirmDelete(() => removeWater(w.id), `${timeOf(w.createdAt)} ${w.amount}ml`)}
              style={styles.foodItem}
            >
              <Ionicons name="water" size={16} color={colors.water} />
              <Text style={[styles.foodName, { marginLeft: 8 }]}>{timeOf(w.createdAt)}</Text>
              <Text style={[styles.foodCal, { color: colors.water }]}>{w.amount} ml</Text>
              <Ionicons name="ellipsis-horizontal" size={14} color={colors.textTertiary} style={{ marginLeft: 6 }} />
            </Pressable>
          ))
        )}
        {todayLogs.length > 0 ? <Text style={styles.tipText}>长按某条记录可删除</Text> : null}
      </Card>

      <Card>
        <Text style={styles.cardTitle}>近 7 天饮水</Text>
        <BarChart data={bars} width={W - spacing.xl * 2 - spacing.lg * 2} color={colors.water} goal={goal} goalColor={colors.water} />
      </Card>
    </View>
  );
}

/* ============== 公共小组件 ============== */
function DateNav({ date, onChange }: { date: string; onChange: (d: string) => void }) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const isToday = date === todayKey();
  return (
    <View style={styles.dateNav}>
      <Pressable onPress={() => onChange(addDays(date, -1))} hitSlop={10} style={styles.dateArrow}>
        <Ionicons name="chevron-back" size={20} color={colors.textSecondary} />
      </Pressable>
      <Text style={styles.dateText}>{prettyDate(date)}</Text>
      <Pressable
        onPress={() => !isToday && onChange(addDays(date, 1))}
        hitSlop={10}
        style={styles.dateArrow}
      >
        <Ionicons name="chevron-forward" size={20} color={isToday ? colors.divider : colors.textSecondary} />
      </Pressable>
    </View>
  );
}

function StatMini({ icon, color, label, value }: { icon: any; color: string; label: string; value: number }) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={styles.statMini}>
      <Ionicons name={icon} size={18} color={color} />
      <Text style={styles.statMiniValue}>{value}</Text>
      <Text style={styles.statMiniLabel}>{label}</Text>
    </View>
  );
}

function SideStat({ label, value, color }: { label: string; value: string; color: string }) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={styles.sideStat}>
      <Text style={styles.sideStatLabel}>{label}</Text>
      <Text style={[styles.sideStatValue, { color }]}>{value}</Text>
    </View>
  );
}

function Legend({ color, label, dashed }: { color: string; label: string; dashed?: boolean }) {
  const colors = useColors();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <View style={{ width: 16, height: 0, borderTopWidth: 2, borderColor: color, borderStyle: dashed ? 'dashed' : 'solid' }} />
      <Text style={{ fontSize: font.xs, color: colors.textTertiary }}>{label}</Text>
    </View>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: spacing.xl, paddingTop: spacing.sm, paddingBottom: spacing.md },
  scroll: { paddingHorizontal: spacing.xl, paddingTop: spacing.sm },

  dateNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xl },
  dateArrow: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.card, ...shadow.soft },
  dateText: { fontSize: font.md, fontWeight: '700', color: colors.text, minWidth: 120, textAlign: 'center' },

  ringCard: { alignItems: 'center', gap: spacing.lg },
  ringValue: { fontSize: 40, fontWeight: '800', color: colors.text },
  ringLabel: { fontSize: font.sm, color: colors.textSecondary, marginTop: 2 },
  ringStats: { flexDirection: 'row', justifyContent: 'space-around', width: '100%', borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.divider, paddingTop: spacing.lg },
  statMini: { alignItems: 'center', gap: 2 },
  statMiniValue: { fontSize: font.lg, fontWeight: '800', color: colors.text },
  statMiniLabel: { fontSize: font.xs, color: colors.textTertiary },

  cardTitle: { fontSize: font.lg, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },

  mealHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  mealDot: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  mealDotInner: { width: 10, height: 10, borderRadius: 5 },
  mealTitle: { fontSize: font.md, fontWeight: '700', color: colors.text, flex: 1 },
  mealTotal: { fontSize: font.sm, color: colors.textSecondary, marginRight: spacing.sm },
  mealAdd: { width: 30, height: 30, borderRadius: 15, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  mealEmpty: { fontSize: font.sm, color: colors.textTertiary, paddingVertical: spacing.sm },
  foodItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.divider },
  foodName: { fontSize: font.md, color: colors.text, flex: 1 },
  foodAmount: { fontSize: font.sm, color: colors.textTertiary, marginRight: spacing.md },
  foodCal: { fontSize: font.sm, fontWeight: '700', color: colors.calorie },
  tipText: { fontSize: font.xs, color: colors.textTertiary, marginTop: spacing.sm, textAlign: 'center' },
  legendRow: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.sm },

  weightHeroCard: { flexDirection: 'row', alignItems: 'center' },
  heroLabel: { fontSize: font.sm, color: colors.textSecondary },
  heroValue: { fontSize: 48, fontWeight: '800', color: colors.text },
  heroUnit: { fontSize: font.lg, color: colors.textSecondary },
  bmiTag: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill, marginTop: spacing.sm },
  bmiText: { fontSize: font.sm, fontWeight: '700' },
  weightSideStats: { gap: spacing.md },
  sideStat: { alignItems: 'flex-end' },
  sideStatLabel: { fontSize: font.xs, color: colors.textTertiary },
  sideStatValue: { fontSize: font.lg, fontWeight: '800' },

  goalLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  goalEnd: { fontSize: font.sm, color: colors.textSecondary, fontWeight: '600' },
  goalTrack: { height: 10, backgroundColor: colors.divider, borderRadius: 5, marginVertical: spacing.md },
  goalFill: { position: 'absolute', left: 0, top: 0, bottom: 0, backgroundColor: colors.weight, borderRadius: 5 },
  goalThumb: { position: 'absolute', top: -3, width: 16, height: 16, borderRadius: 8, backgroundColor: '#fff', borderWidth: 3, borderColor: colors.weight, marginLeft: -8 },
  goalPct: { fontSize: font.sm, color: colors.textSecondary, textAlign: 'center' },
  addWeightBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.weightSoft, borderRadius: radius.md, paddingVertical: spacing.lg },
  addWeightText: { fontSize: font.md, fontWeight: '700' },

  waterHero: { alignItems: 'center', gap: spacing.lg },
  cupsRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' },
  quickRow: { flexDirection: 'row', gap: spacing.md },
  quickBtn: { flex: 1, alignItems: 'center', gap: 4, backgroundColor: colors.waterSoft, borderRadius: radius.md, paddingVertical: spacing.lg },
  quickText: { fontSize: font.md, fontWeight: '700', color: colors.water },
  waterSectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
  waterSectionHint: { fontSize: font.xs, color: colors.textTertiary },
  inlineWaterInput: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.md, height: 52, borderRadius: radius.md, backgroundColor: colors.bg, paddingLeft: spacing.md, borderWidth: 1, borderColor: colors.border },
  inlineWaterText: {
    flex: 1,
    fontSize: font.md,
    color: colors.text,
    fontWeight: '600',
    outlineStyle: 'none',
  } as any,
  inlineWaterUnit: { fontSize: font.sm, color: colors.textTertiary, marginRight: spacing.sm },
  inlineWaterAdd: { height: 40, paddingHorizontal: spacing.md, borderRadius: radius.sm, backgroundColor: colors.water, flexDirection: 'row', alignItems: 'center', gap: 4, marginRight: 5 },
  inlineWaterAddText: { color: '#fff', fontSize: font.sm, fontWeight: '700' },
  });
