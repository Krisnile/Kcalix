import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DateField } from '../../src/components/DatePicker';
import { Button, Card, Segmented } from '../../src/components/ui';
import { exercisePresets, FoodItem, foods } from '../../src/data/foods';
import { useStore } from '../../src/store/AppStore';
import { font, mealColors, Palette, radius, shadow, spacing, useColors } from '../../src/theme';
import { MealType } from '../../src/types';
import { todayKey } from '../../src/utils/date';
import { latestWeight, mealLabel, mealOrder } from '../../src/utils/selectors';

type Mode = 'diet' | 'exercise' | 'weight' | 'water';

export default function AddScreen() {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [mode, setMode] = useState<Mode>('diet');
  const [toast, setToast] = useState<string | null>(null);

  const flash = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 1600);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>添加记录</Text>
        <Segmented
          style={{ marginTop: spacing.md }}
          value={mode}
          onChange={setMode}
          options={[
            { value: 'diet', label: '饮食' },
            { value: 'exercise', label: '运动' },
            { value: 'weight', label: '体重' },
            { value: 'water', label: '喝水' },
          ]}
        />
      </View>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {mode === 'diet' && <DietForm onDone={flash} />}
          {mode === 'exercise' && <ExerciseForm onDone={flash} />}
          {mode === 'weight' && <WeightForm onDone={flash} />}
          {mode === 'water' && <WaterForm onDone={flash} />}
          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
      {toast ? (
        <View style={styles.toast}>
          <Ionicons name="checkmark-circle" size={18} color="#fff" />
          <Text style={styles.toastText}>{toast}</Text>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

/* ============== 饮食 ============== */
function DietForm({ onDone }: { onDone: (m: string) => void }) {
  const { addFood } = useStore();
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [date, setDate] = useState(todayKey());
  const params = useLocalSearchParams<{ food?: string; cal?: string }>();
  const [meal, setMeal] = useState<MealType>(guessMeal());
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<FoodItem | null>(null);
  const [grams, setGrams] = useState(100);
  const [customName, setCustomName] = useState('');
  const [customCal, setCustomCal] = useState('');

  // 从「食谱」页选中食物跳转过来时，预填手动添加（按每 100g 估算）
  useEffect(() => {
    if (params.food) setCustomName(String(params.food));
    if (params.cal) setCustomCal(String(params.cal));
  }, [params.food, params.cal]);

  const results = useMemo(() => {
    const q = query.trim();
    if (!q) return foods.slice(0, 8);
    return foods.filter((f) => f.name.includes(q)).slice(0, 20);
  }, [query]);

  const computedCal = selected ? Math.round((selected.calories * grams) / 100) : 0;

  const submitSelected = () => {
    if (!selected) return;
    addFood({ date, meal, name: selected.name, calories: computedCal, amount: grams, unit: '克' });
    onDone(`已添加 ${selected.name} ${computedCal}kcal`);
    setSelected(null);
    setQuery('');
    setGrams(100);
    Keyboard.dismiss();
  };

  const submitCustom = () => {
    const cal = parseInt(customCal, 10);
    if (!customName.trim() || !cal) return;
    addFood({ date, meal, name: customName.trim(), calories: cal, amount: 1, unit: '份' });
    onDone(`已添加 ${customName.trim()} ${cal}kcal`);
    setCustomName('');
    setCustomCal('');
    Keyboard.dismiss();
  };

  return (
    <View style={{ gap: spacing.lg }}>
      <Card>
        <Text style={styles.label}>记录日期</Text>
        <DateField value={date} onChange={setDate} />
      </Card>

      <Card>
        <Text style={styles.label}>选择餐次</Text>
        <View style={styles.mealRow}>
          {mealOrder.map((m) => {
            const active = m === meal;
            const mc = mealColors[m];
            return (
              <Pressable key={m} onPress={() => setMeal(m)} style={[styles.mealChip, active && { backgroundColor: mc.soft, borderColor: mc.color }]}>
                <Text style={[styles.mealChipText, active && { color: mc.color, fontWeight: '700' }]}>{mealLabel[m]}</Text>
              </Pressable>
            );
          })}
        </View>
      </Card>

      <Card>
        <Text style={styles.label}>搜索食物</Text>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color={colors.textTertiary} />
          <TextInput
            value={query}
            onChangeText={(t) => {
              setQuery(t);
              setSelected(null);
            }}
            placeholder="如：米饭、鸡胸肉、苹果"
            placeholderTextColor={colors.textTertiary}
            style={styles.searchInput}
          />
        </View>

        {selected ? (
          <View style={styles.selectedBox}>
            <Text style={styles.selectedName}>
              {selected.emoji} {selected.name}
            </Text>
            <Text style={styles.selectedPer}>{selected.calories} kcal / 100g</Text>
            <View style={styles.gramRow}>
              <Pressable style={styles.gramBtn} onPress={() => setGrams(Math.max(10, grams - 10))}>
                <Text style={styles.gramBtnText}>−</Text>
              </Pressable>
              <View style={{ alignItems: 'center', flex: 1 }}>
                <Text style={styles.gramValue}>{grams} 克</Text>
                <Text style={styles.gramCal}>≈ {computedCal} kcal</Text>
              </View>
              <Pressable style={styles.gramBtn} onPress={() => setGrams(grams + 10)}>
                <Text style={styles.gramBtnText}>+</Text>
              </Pressable>
            </View>
            <Button label={`添加到${mealLabel[meal]}`} onPress={submitSelected} style={{ marginTop: spacing.md }} />
          </View>
        ) : (
          <View style={{ marginTop: spacing.sm }}>
            {results.map((f) => (
              <Pressable key={f.id} style={styles.resultItem} onPress={() => setSelected(f)}>
                <Text style={styles.resultEmoji}>{f.emoji}</Text>
                <Text style={styles.resultName}>{f.name}</Text>
                <Text style={styles.resultCal}>{f.calories} kcal/100g</Text>
              </Pressable>
            ))}
          </View>
        )}
      </Card>

      <Card>
        <Text style={styles.label}>手动添加</Text>
        <TextInput value={customName} onChangeText={setCustomName} placeholder="食物名称" placeholderTextColor={colors.textTertiary} style={styles.input} />
        <TextInput value={customCal} onChangeText={setCustomCal} placeholder="热量 (kcal)" placeholderTextColor={colors.textTertiary} keyboardType="numeric" style={[styles.input, { marginTop: spacing.sm }]} />
        <Button label="添加" variant="secondary" onPress={submitCustom} style={{ marginTop: spacing.md }} />
      </Card>
    </View>
  );
}

/* ============== 运动 ============== */
function ExerciseForm({ onDone }: { onDone: (m: string) => void }) {
  const { addExercise, data } = useStore();
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [date, setDate] = useState(todayKey());
  const weight = latestWeight(data.weightLogs) ?? data.profile?.weight ?? 60;
  const [preset, setPreset] = useState(exercisePresets[2]);
  const [minutes, setMinutes] = useState(30);

  // 以体重校正：预设按 60kg 估算
  const cal = Math.round(preset.perMin * minutes * (weight / 60));

  const submit = () => {
    addExercise({ date, name: preset.name, calories: cal, duration: minutes });
    onDone(`已添加 ${preset.name} ${cal}kcal`);
  };

  return (
    <View style={{ gap: spacing.lg }}>
      <Card>
        <Text style={styles.label}>记录日期</Text>
        <DateField value={date} onChange={setDate} />
      </Card>

      <Card>
        <Text style={styles.label}>选择运动</Text>
        <View style={styles.exerciseGrid}>
          {exercisePresets.map((e) => {
            const active = e.id === preset.id;
            return (
              <Pressable key={e.id} style={[styles.exerciseChip, active && styles.exerciseChipActive]} onPress={() => setPreset(e)}>
                <Text style={{ fontSize: 22 }}>{e.emoji}</Text>
                <Text style={[styles.exerciseName, active && { color: colors.exercise, fontWeight: '700' }]}>{e.name}</Text>
              </Pressable>
            );
          })}
        </View>
      </Card>

      <Card>
        <Text style={styles.label}>时长</Text>
        <View style={styles.gramRow}>
          <Pressable style={styles.gramBtn} onPress={() => setMinutes(Math.max(5, minutes - 5))}>
            <Text style={styles.gramBtnText}>−</Text>
          </Pressable>
          <View style={{ alignItems: 'center', flex: 1 }}>
            <Text style={styles.gramValue}>{minutes} 分钟</Text>
            <Text style={[styles.gramCal, { color: colors.exercise }]}>≈ 消耗 {cal} kcal</Text>
          </View>
          <Pressable style={styles.gramBtn} onPress={() => setMinutes(minutes + 5)}>
            <Text style={styles.gramBtnText}>+</Text>
          </Pressable>
        </View>
        <Button label="添加运动记录" onPress={submit} style={{ marginTop: spacing.lg }} />
      </Card>
    </View>
  );
}

/* ============== 体重 ============== */
function WeightForm({ onDone }: { onDone: (m: string) => void }) {
  const { addWeight, data } = useStore();
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [date, setDate] = useState(todayKey());
  const [w, setW] = useState(latestWeight(data.weightLogs) ?? data.profile?.weight ?? 60);

  const submit = () => {
    addWeight({ date, weight: Math.round(w * 10) / 10 });
    onDone(`已记录体重 ${Math.round(w * 10) / 10}kg`);
  };

  return (
    <View style={{ gap: spacing.lg }}>
      <Card>
        <Text style={styles.label}>记录日期</Text>
        <DateField value={date} onChange={setDate} />
      </Card>

      <Card>
        <Text style={styles.label}>体重</Text>
        <View style={[styles.gramRow, { marginVertical: spacing.lg }]}>
          <Pressable style={styles.gramBtn} onPress={() => setW(Math.max(30, Math.round((w - 0.1) * 10) / 10))}>
            <Text style={styles.gramBtnText}>−</Text>
          </Pressable>
          <View style={{ alignItems: 'center', flex: 1 }}>
            <Text style={[styles.gramValue, { fontSize: 44, color: colors.weight }]}>{w.toFixed(1)}</Text>
            <Text style={styles.gramCal}>kg</Text>
          </View>
          <Pressable style={styles.gramBtn} onPress={() => setW(Math.min(200, Math.round((w + 0.1) * 10) / 10))}>
            <Text style={styles.gramBtnText}>+</Text>
          </Pressable>
        </View>
        <Button label="保存体重" onPress={submit} />
      </Card>
    </View>
  );
}

/* ============== 喝水 ============== */
function WaterForm({ onDone }: { onDone: (m: string) => void }) {
  const { addWater } = useStore();
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [date, setDate] = useState(todayKey());
  const [amount, setAmount] = useState(250);
  const quick = [100, 200, 250, 300, 500, 800];

  return (
    <View style={{ gap: spacing.lg }}>
      <Card>
        <Text style={styles.label}>记录日期</Text>
        <DateField value={date} onChange={setDate} />
      </Card>

      <Card>
      <Text style={styles.label}>饮水量 (ml)</Text>
      <View style={styles.waterGrid}>
        {quick.map((q) => (
          <Pressable key={q} style={[styles.waterChip, amount === q && styles.waterChipActive]} onPress={() => setAmount(q)}>
            <Text style={[styles.waterChipText, amount === q && { color: colors.water, fontWeight: '700' }]}>{q}</Text>
          </Pressable>
        ))}
      </View>
      <Button
        label={`记录 ${amount}ml`}
        onPress={() => {
          addWater({ date, amount });
          onDone(`已记录饮水 ${amount}ml`);
        }}
        style={{ marginTop: spacing.lg }}
      />
      </Card>
    </View>
  );
}

function guessMeal(): MealType {
  const h = new Date().getHours();
  if (h < 10) return 'breakfast';
  if (h < 15) return 'lunch';
  if (h < 20) return 'dinner';
  return 'snack';
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: spacing.xl, paddingTop: spacing.sm, paddingBottom: spacing.md },
  headerTitle: { fontSize: font.xxl, fontWeight: '800', color: colors.text },
  scroll: { paddingHorizontal: spacing.xl, paddingTop: spacing.sm },
  label: { fontSize: font.md, fontWeight: '700', color: colors.text, marginBottom: spacing.md },

  mealRow: { flexDirection: 'row', gap: spacing.sm },
  mealChip: { flex: 1, height: 42, borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  mealChipText: { fontSize: font.sm, color: colors.textSecondary },

  searchBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.bg, borderRadius: radius.md, paddingHorizontal: spacing.md, height: 46 },
  searchInput: { flex: 1, fontSize: font.md, color: colors.text },
  resultItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.divider },
  resultEmoji: { fontSize: 20 },
  resultName: { flex: 1, fontSize: font.md, color: colors.text },
  resultCal: { fontSize: font.sm, color: colors.textTertiary },

  selectedBox: { marginTop: spacing.md, backgroundColor: colors.primarySoft, borderRadius: radius.md, padding: spacing.lg },
  selectedName: { fontSize: font.lg, fontWeight: '700', color: colors.text },
  selectedPer: { fontSize: font.sm, color: colors.textSecondary, marginTop: 2 },
  gramRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.md },
  gramBtn: { width: 48, height: 48, borderRadius: radius.md, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center', ...shadow.soft },
  gramBtnText: { fontSize: 26, color: colors.text, fontWeight: '600' },
  gramValue: { fontSize: font.xl, fontWeight: '800', color: colors.text },
  gramCal: { fontSize: font.sm, color: colors.textSecondary, marginTop: 2 },

  input: { backgroundColor: colors.bg, borderRadius: radius.md, paddingHorizontal: spacing.lg, height: 48, fontSize: font.md, color: colors.text },

  exerciseGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  exerciseChip: { width: '22%', aspectRatio: 1, borderRadius: radius.md, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', gap: 2, borderWidth: 1.5, borderColor: 'transparent' },
  exerciseChipActive: { borderColor: colors.exercise, backgroundColor: colors.exerciseSoft },
  exerciseName: { fontSize: font.xs, color: colors.textSecondary },

  waterGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  waterChip: { width: '30%', height: 50, borderRadius: radius.md, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: 'transparent' },
  waterChipActive: { borderColor: colors.water, backgroundColor: colors.waterSoft },
  waterChipText: { fontSize: font.md, color: colors.textSecondary },

  toast: { position: 'absolute', bottom: 30, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#1F2937', paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderRadius: radius.pill },
  toastText: { color: '#fff', fontSize: font.sm, fontWeight: '600' },
  });
