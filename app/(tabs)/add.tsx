import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
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
import { Button, Card, PageTitle, Segmented } from '../../src/components/ui';
import { RemoteFood, searchOnlineFoods } from '../../src/data/foodApi';
import { exercisePresets, foods } from '../../src/data/foods';
import { useStore } from '../../src/store/AppStore';
import { font, mealColors, Palette, radius, shadow, spacing, useColors } from '../../src/theme';
import { MealType } from '../../src/types';
import { todayKey } from '../../src/utils/date';
import { latestWeight, mealLabel, mealOrder } from '../../src/utils/selectors';

type Mode = 'diet' | 'exercise' | 'weight' | 'water';

interface FoodChoice {
  id: string;
  name: string;
  calories: number;
  emoji: string;
  unit: '克' | '份';
  defaultAmount: number;
  source: '食物库' | '历史' | '在线';
}

const normalizeFoodName = (value: string) => value.toLowerCase().replace(/\s+/g, '');

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
        <PageTitle title="添加记录" />
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
  const { addFood, data } = useStore();
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [date, setDate] = useState(todayKey());
  const params = useLocalSearchParams<{ food?: string; cal?: string }>();
  const [meal, setMeal] = useState<MealType>(guessMeal());
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<FoodChoice | null>(null);
  const [grams, setGrams] = useState(100);
  const [customName, setCustomName] = useState('');
  const [customCal, setCustomCal] = useState('');

  const [online, setOnline] = useState<RemoteFood[]>([]);
  const [onlineLoading, setOnlineLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  // 从「食谱」页选中食物跳转过来时，预填手动添加（按每 100g 估算）
  useEffect(() => {
    if (!params.food || !params.cal) return;
    const choice: FoodChoice = {
      id: `recipe-${String(params.food)}`,
      name: String(params.food),
      calories: Number(params.cal),
      emoji: '🥗',
      unit: '克',
      defaultAmount: 100,
      source: '在线',
    };
    setQuery(choice.name);
    setSelected(choice);
    setGrams(100);
  }, [params.food, params.cal]);

  const historyChoices = useMemo<FoodChoice[]>(() => {
    const seen = new Set<string>();
    return [...data.foodLogs]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .flatMap((log) => {
        const key = normalizeFoodName(log.name);
        if (!key || seen.has(key)) return [];
        seen.add(key);
        const isGram = log.unit === '克' && log.amount > 0;
        return [{
          id: `history-${log.id}`,
          name: log.name,
          calories: isGram ? Math.round((log.calories * 100) / log.amount) : Math.round(log.calories / Math.max(log.amount, 1)),
          emoji: '↺',
          unit: isGram ? '克' as const : '份' as const,
          defaultAmount: isGram ? log.amount : Math.max(1, log.amount),
          source: '历史' as const,
        }];
      });
  }, [data.foodLogs]);

  const libraryChoices = useMemo<FoodChoice[]>(
    () => foods.map((food) => ({
      id: `library-${food.id}`,
      name: food.name,
      calories: food.calories,
      emoji: food.emoji,
      unit: '克',
      defaultAmount: 100,
      source: '食物库',
    })),
    [],
  );

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2 || selected) {
      abortRef.current?.abort();
      setOnline([]);
      setOnlineLoading(false);
      return;
    }
    setOnlineLoading(true);
    const timer = setTimeout(async () => {
      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      try {
        setOnline(await searchOnlineFoods(q, ctrl.signal));
      } catch (error: any) {
        if (error?.name !== 'AbortError') setOnline([]);
      } finally {
        setOnlineLoading(false);
      }
    }, 450);
    return () => clearTimeout(timer);
  }, [query, selected]);

  const results = useMemo<FoodChoice[]>(() => {
    const q = normalizeFoodName(query.trim());
    if (!q) return [...historyChoices.slice(0, 5), ...libraryChoices.slice(0, 7)];
    const match = (item: FoodChoice) => normalizeFoodName(item.name).includes(q);
    const local = [...historyChoices.filter(match), ...libraryChoices.filter(match)];
    const names = new Set(local.map((item) => normalizeFoodName(item.name)));
    const remote = online
      .filter((item) => !names.has(normalizeFoodName(item.name)))
      .map((item): FoodChoice => ({
        id: `online-${item.id}`,
        name: item.name,
        calories: item.calories,
        emoji: item.emoji,
        unit: '克',
        defaultAmount: 100,
        source: '在线',
      }));
    return [...local, ...remote].slice(0, 24);
  }, [historyChoices, libraryChoices, online, query]);

  const computedCal = selected
    ? Math.round(selected.unit === '克' ? (selected.calories * grams) / 100 : selected.calories * grams)
    : 0;

  const submitSelected = () => {
    if (!selected) return;
    addFood({ date, meal, name: selected.name, calories: computedCal, amount: grams, unit: selected.unit });
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
            placeholder="搜索食物库、在线食谱或吃过的食物"
            placeholderTextColor={colors.textTertiary}
            style={styles.searchInput}
          />
        </View>

        {selected ? (
          <View style={styles.selectedBox}>
            <Text style={styles.selectedName}>
              {selected.emoji} {selected.name}
            </Text>
            <View style={styles.selectedMeta}>
              <Text style={styles.selectedPer}>
                {selected.calories} kcal / {selected.unit === '克' ? '100g' : '份'}
              </Text>
              <View style={styles.sourceBadge}>
                <Text style={styles.sourceBadgeText}>{selected.source}</Text>
              </View>
            </View>
            <View style={styles.gramRow}>
              <Pressable
                style={styles.gramBtn}
                onPress={() => setGrams(Math.max(selected.unit === '克' ? 10 : 1, grams - (selected.unit === '克' ? 10 : 1)))}
              >
                <Text style={styles.gramBtnText}>−</Text>
              </Pressable>
              <View style={{ alignItems: 'center', flex: 1 }}>
                <View style={styles.amountInputRow}>
                  <TextInput
                    value={String(grams)}
                    onChangeText={(value) => setGrams(Math.max(0, parseInt(value.replace(/\D/g, ''), 10) || 0))}
                    keyboardType="number-pad"
                    selectTextOnFocus
                    style={styles.amountInput}
                  />
                  <Text style={styles.amountUnit}>{selected.unit}</Text>
                </View>
                <Text style={styles.gramCal}>≈ {computedCal} kcal</Text>
              </View>
              <Pressable style={styles.gramBtn} onPress={() => setGrams(grams + (selected.unit === '克' ? 10 : 1))}>
                <Text style={styles.gramBtnText}>+</Text>
              </Pressable>
            </View>
            <Button
              label={`添加到${mealLabel[meal]}`}
              onPress={submitSelected}
              disabled={grams <= 0}
              style={{ marginTop: spacing.md }}
            />
          </View>
        ) : (
          <View style={{ marginTop: spacing.sm }}>
            {results.map((f) => (
              <Pressable
                key={f.id}
                style={styles.resultItem}
                onPress={() => {
                  setSelected(f);
                  setGrams(f.defaultAmount);
                }}
              >
                <Text style={styles.resultEmoji}>{f.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.resultName}>{f.name}</Text>
                  <Text style={styles.resultSource}>{f.source}{f.source === '历史' ? ' · 上次记录' : ''}</Text>
                </View>
                <Text style={styles.resultCal}>{f.calories} kcal/{f.unit === '克' ? '100g' : '份'}</Text>
              </Pressable>
            ))}
            {onlineLoading ? (
              <View style={styles.searchLoading}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={styles.searchLoadingText}>继续搜索在线食谱…</Text>
              </View>
            ) : null}
            {!results.length && !onlineLoading ? (
              <View style={styles.noResult}>
                <Text style={styles.noResultTitle}>没有找到「{query.trim()}」</Text>
                <Text style={styles.noResultHint}>可以在下方手动添加</Text>
              </View>
            ) : null}
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
  const [exerciseMode, setExerciseMode] = useState<'preset' | 'custom'>('preset');
  const [customExerciseName, setCustomExerciseName] = useState('');
  const [customMinutes, setCustomMinutes] = useState('30');
  const [customCalories, setCustomCalories] = useState('');

  // 以体重校正：预设按 60kg 估算
  const cal = Math.round(preset.perMin * minutes * (weight / 60));
  const parsedCustomMinutes = parseInt(customMinutes, 10);
  const parsedCustomCalories = parseInt(customCalories, 10);
  const customExerciseValid =
    customExerciseName.trim().length > 0 &&
    Number.isFinite(parsedCustomMinutes) &&
    parsedCustomMinutes >= 1 &&
    parsedCustomMinutes <= 1440 &&
    Number.isFinite(parsedCustomCalories) &&
    parsedCustomCalories >= 1 &&
    parsedCustomCalories <= 10000;

  const submit = () => {
    addExercise({ date, name: preset.name, calories: cal, duration: minutes });
    onDone(`已添加 ${preset.name} ${cal}kcal`);
  };

  const submitCustomExercise = () => {
    if (!customExerciseValid) return;
    const name = customExerciseName.trim();
    addExercise({
      date,
      name,
      calories: parsedCustomCalories,
      duration: parsedCustomMinutes,
    });
    onDone(`已添加 ${name} ${parsedCustomCalories}kcal`);
    setCustomExerciseName('');
    setCustomCalories('');
    Keyboard.dismiss();
  };

  return (
    <View style={{ gap: spacing.lg }}>
      <Card>
        <Text style={styles.label}>记录日期</Text>
        <DateField value={date} onChange={setDate} />
      </Card>

      <Card>
        <Text style={styles.label}>运动方式</Text>
        <Segmented
          value={exerciseMode}
          onChange={setExerciseMode}
          options={[
            { value: 'preset', label: '快捷估算' },
            { value: 'custom', label: '自定义' },
          ]}
        />
      </Card>

      {exerciseMode === 'preset' ? (
        <>
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
        </>
      ) : (
        <Card>
          <View style={styles.customExerciseHead}>
            <View>
              <Text style={styles.label}>自定义运动</Text>
              <Text style={styles.fieldHint}>按实际运动数据填写</Text>
            </View>
            <View style={styles.exerciseCustomIcon}>
              <Ionicons name="fitness-outline" size={22} color={colors.exercise} />
            </View>
          </View>
          <TextInput
            value={customExerciseName}
            onChangeText={setCustomExerciseName}
            placeholder="运动名称，如：普拉提、羽毛球"
            placeholderTextColor={colors.textTertiary}
            maxLength={30}
            style={styles.input}
          />
          <View style={styles.customExerciseFields}>
            <View style={styles.customExerciseField}>
              <Text style={styles.customExerciseLabel}>时长</Text>
              <View style={styles.customExerciseInputRow}>
                <TextInput
                  value={customMinutes}
                  onChangeText={(value) => setCustomMinutes(value.replace(/\D/g, '').slice(0, 4))}
                  keyboardType="number-pad"
                  placeholder="30"
                  placeholderTextColor={colors.textTertiary}
                  style={styles.customExerciseInput}
                />
                <Text style={styles.customExerciseUnit}>分钟</Text>
              </View>
            </View>
            <View style={styles.customExerciseField}>
              <Text style={styles.customExerciseLabel}>消耗</Text>
              <View style={styles.customExerciseInputRow}>
                <TextInput
                  value={customCalories}
                  onChangeText={(value) => setCustomCalories(value.replace(/\D/g, '').slice(0, 5))}
                  keyboardType="number-pad"
                  placeholder="例如 180"
                  placeholderTextColor={colors.textTertiary}
                  returnKeyType="done"
                  onSubmitEditing={submitCustomExercise}
                  style={styles.customExerciseInput}
                />
                <Text style={styles.customExerciseUnit}>kcal</Text>
              </View>
            </View>
          </View>
          <Text style={styles.customExerciseHint}>范围：1–1440 分钟，1–10000 kcal</Text>
          <Button
            label={customExerciseValid ? '添加自定义运动' : '填写完整后添加'}
            onPress={submitCustomExercise}
            disabled={!customExerciseValid}
            style={{ marginTop: spacing.lg }}
          />
        </Card>
      )}
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
  const [customAmount, setCustomAmount] = useState('250');
  const quick = [200, 300, 500];
  const parsedAmount = parseInt(customAmount, 10);
  const validAmount = Number.isFinite(parsedAmount) && parsedAmount >= 1 && parsedAmount <= 5000;

  const chooseAmount = (value: number) => {
    setAmount(value);
    setCustomAmount(String(value));
  };

  const submit = () => {
    if (!validAmount) return;
    addWater({ date, amount: parsedAmount });
    onDone(`已记录饮水 ${parsedAmount}ml`);
    Keyboard.dismiss();
  };

  return (
    <View style={{ gap: spacing.lg }}>
      <Card>
        <Text style={styles.label}>记录日期</Text>
        <DateField value={date} onChange={setDate} />
      </Card>

      <Card>
        <View style={styles.waterTitleRow}>
          <View>
            <Text style={styles.label}>饮水量</Text>
            <Text style={styles.fieldHint}>选择常用容量，或直接输入任意数值</Text>
          </View>
          <View style={styles.waterDrop}>
            <Ionicons name="water" size={22} color={colors.water} />
          </View>
        </View>
        <View style={styles.waterGrid}>
          {quick.map((q) => (
            <Pressable key={q} style={[styles.waterChip, amount === q && styles.waterChipActive]} onPress={() => chooseAmount(q)}>
              <Ionicons name="water-outline" size={22} color={colors.water} />
              <Text style={styles.waterChipText}>+{q}ml</Text>
            </Pressable>
          ))}
        </View>
        <View style={[styles.customWaterInput, !validAmount && customAmount ? styles.inputInvalid : null]}>
          <TextInput
            value={customAmount}
            onChangeText={(value) => {
              const next = value.replace(/\D/g, '').slice(0, 4);
              setCustomAmount(next);
              setAmount(parseInt(next, 10) || 0);
            }}
            placeholder="输入自定义饮水量"
            placeholderTextColor={colors.textTertiary}
            keyboardType="number-pad"
            returnKeyType="done"
            onSubmitEditing={submit}
            style={styles.customWaterText}
          />
          <Text style={styles.customWaterUnit}>ml</Text>
          <Pressable
            disabled={!validAmount}
            onPress={submit}
            style={[styles.customWaterAdd, !validAmount && { opacity: 0.4 }]}
          >
            <Ionicons name="add" size={20} color="#fff" />
            <Text style={styles.customWaterAddText}>记录</Text>
          </Pressable>
        </View>
        {!validAmount && customAmount ? <Text style={styles.validationText}>请输入 1–5000 ml</Text> : null}
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
  scroll: { paddingHorizontal: spacing.xl, paddingTop: spacing.sm },
  label: { fontSize: font.md, fontWeight: '700', color: colors.text, marginBottom: spacing.md },

  mealRow: { flexDirection: 'row', gap: spacing.sm },
  mealChip: { flex: 1, height: 42, borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  mealChipText: { fontSize: font.sm, color: colors.textSecondary },

  searchBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.bg, borderRadius: radius.md, paddingHorizontal: spacing.md, height: 46 },
  searchInput: { flex: 1, fontSize: font.md, color: colors.text, outlineStyle: 'none' } as any,
  resultItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.divider },
  resultEmoji: { fontSize: 20 },
  resultName: { flex: 1, fontSize: font.md, color: colors.text },
  resultCal: { fontSize: font.sm, color: colors.textTertiary },

  selectedBox: { marginTop: spacing.md, backgroundColor: colors.primarySoft, borderRadius: radius.md, padding: spacing.lg },
  selectedName: { fontSize: font.lg, fontWeight: '700', color: colors.text },
  selectedPer: { fontSize: font.sm, color: colors.textSecondary, marginTop: 2 },
  selectedMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sourceBadge: { backgroundColor: colors.card, paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.pill },
  sourceBadgeText: { fontSize: font.xs, color: colors.primaryDark, fontWeight: '700' },
  gramRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.md },
  gramBtn: { width: 48, height: 48, borderRadius: radius.md, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center', ...shadow.soft },
  gramBtnText: { fontSize: 26, color: colors.text, fontWeight: '600' },
  gramValue: { fontSize: font.xl, fontWeight: '800', color: colors.text },
  gramCal: { fontSize: font.sm, color: colors.textSecondary, marginTop: 2 },
  amountInputRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center', gap: 4 },
  amountInput: { minWidth: 68, paddingHorizontal: 6, paddingVertical: 0, fontSize: font.xl, fontWeight: '800', color: colors.text, textAlign: 'right', outlineStyle: 'none' } as any,
  amountUnit: { fontSize: font.md, color: colors.textSecondary, fontWeight: '600' },
  resultSource: { fontSize: font.xs, color: colors.textTertiary, marginTop: 2 },
  searchLoading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: spacing.lg },
  searchLoadingText: { fontSize: font.sm, color: colors.textSecondary },
  noResult: { alignItems: 'center', paddingVertical: spacing.xl },
  noResultTitle: { fontSize: font.md, color: colors.text, fontWeight: '700' },
  noResultHint: { fontSize: font.sm, color: colors.textTertiary, marginTop: 4 },

  input: { backgroundColor: colors.bg, borderRadius: radius.md, paddingHorizontal: spacing.lg, height: 48, fontSize: font.md, color: colors.text, outlineStyle: 'none' } as any,

  exerciseGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  exerciseChip: { width: '22%', aspectRatio: 1, borderRadius: radius.md, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', gap: 2, borderWidth: 1.5, borderColor: 'transparent' },
  exerciseChipActive: { borderColor: colors.exercise, backgroundColor: colors.exerciseSoft },
  exerciseName: { fontSize: font.xs, color: colors.textSecondary },
  customExerciseHead: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: spacing.md },
  exerciseCustomIcon: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.exerciseSoft, alignItems: 'center', justifyContent: 'center' },
  customExerciseFields: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.md },
  customExerciseField: { flex: 1 },
  customExerciseLabel: { fontSize: font.xs, color: colors.textSecondary, fontWeight: '700', marginBottom: spacing.xs },
  customExerciseInputRow: { height: 50, borderRadius: radius.md, backgroundColor: colors.bg, flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md },
  customExerciseInput: { flex: 1, fontSize: font.md, color: colors.text, fontWeight: '700', outlineStyle: 'none' } as any,
  customExerciseUnit: { fontSize: font.xs, color: colors.textTertiary, marginLeft: 4 },
  customExerciseHint: { fontSize: font.xs, color: colors.textTertiary, marginTop: spacing.sm },

  waterGrid: { flexDirection: 'row', gap: spacing.md },
  waterTitleRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: spacing.md },
  fieldHint: { fontSize: font.xs, color: colors.textTertiary, marginTop: -8 },
  waterDrop: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.waterSoft, alignItems: 'center', justifyContent: 'center' },
  waterChip: { flex: 1, borderRadius: radius.md, backgroundColor: colors.waterSoft, alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: spacing.lg, borderWidth: 1.5, borderColor: 'transparent' },
  waterChipActive: { borderColor: colors.water, backgroundColor: colors.waterSoft },
  waterChipText: { fontSize: font.md, color: colors.water, fontWeight: '700' },
  customWaterInput: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.md, height: 52, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.bg, paddingLeft: spacing.md },
  customWaterText: {
    flex: 1,
    fontSize: font.md,
    fontWeight: '600',
    color: colors.text,
    outlineStyle: 'none',
  } as any,
  customWaterUnit: { fontSize: font.sm, color: colors.textTertiary, marginRight: spacing.sm },
  customWaterAdd: { height: 40, paddingHorizontal: spacing.md, borderRadius: radius.sm, backgroundColor: colors.water, flexDirection: 'row', alignItems: 'center', gap: 4, marginRight: 5 },
  customWaterAddText: { color: '#fff', fontSize: font.sm, fontWeight: '700' },
  inputInvalid: { borderColor: colors.danger },
  validationText: { fontSize: font.xs, color: colors.danger, marginTop: spacing.xs },

  toast: { position: 'absolute', bottom: 30, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#1F2937', paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderRadius: radius.pill },
  toastText: { color: '#fff', fontSize: font.sm, fontWeight: '600' },
  });
