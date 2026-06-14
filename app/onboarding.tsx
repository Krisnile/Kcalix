import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../src/components/ui';
import { images } from '../src/images';
import { useStore } from '../src/store/AppStore';
import { colors, font, radius, shadow, spacing } from '../src/theme';
import { ActivityLevel, Gender, Goal, Profile } from '../src/types';
import {
  activityLabel,
  calcBMR,
  calcCalorieGoal,
  calcTDEE,
  goalLabel,
  recommendedWater,
} from '../src/utils/nutrition';

type Step = 'terms' | 'gender' | 'body' | 'weight' | 'goal' | 'summary';
const order: Step[] = ['terms', 'gender', 'body', 'weight', 'goal', 'summary'];

export default function Onboarding() {
  const router = useRouter();
  const { completeOnboarding } = useStore();
  const [stepIdx, setStepIdx] = useState(0);
  const step = order[stepIdx];

  const [name, setName] = useState('');
  const [gender, setGender] = useState<Gender>('female');
  const [age, setAge] = useState(25);
  const [height, setHeight] = useState(165);
  const [weight, setWeight] = useState(60);
  const [target, setTarget] = useState(55);
  const [activity, setActivity] = useState<ActivityLevel>('light');
  const [goal, setGoal] = useState<Goal>('lose');

  const progress = (stepIdx + 1) / order.length;

  const profile: Profile = {
    name: name.trim() || '我',
    gender,
    age,
    height,
    weight,
    targetWeight: target,
    activity,
    goal,
    waterGoal: recommendedWater(weight),
    createdAt: new Date().toISOString(),
  };

  const next = () => {
    if (stepIdx < order.length - 1) setStepIdx(stepIdx + 1);
  };
  const back = () => {
    if (stepIdx > 0) setStepIdx(stepIdx - 1);
  };

  const finish = () => {
    completeOnboarding(profile);
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* 顶部进度 */}
      <View style={styles.topBar}>
        {stepIdx > 0 && step !== 'terms' ? (
          <Pressable onPress={back} hitSlop={12}>
            <Text style={styles.backText}>‹ 返回</Text>
          </Pressable>
        ) : (
          <View style={{ width: 50 }} />
        )}
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>
        <Text style={styles.stepCount}>
          {stepIdx + 1}/{order.length}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {step === 'terms' && <TermsStep />}

        {step === 'gender' && (
          <StepWrap title="你的性别是？" subtitle="用于精准估算基础代谢">
            <View style={styles.genderRow}>
              {(
                [
                  { v: 'female', label: '女生', img: images.avatarFemale },
                  { v: 'male', label: '男生', img: images.avatarMale },
                ] as { v: Gender; label: string; img: any }[]
              ).map((g) => (
                <Pressable
                  key={g.v}
                  onPress={() => setGender(g.v)}
                  style={[styles.genderCard, gender === g.v && styles.genderCardActive]}
                >
                  <Image source={g.img} style={styles.genderAvatar} resizeMode="cover" />
                  <Text style={[styles.genderLabel, gender === g.v && { color: colors.primaryDark }]}>{g.label}</Text>
                </Pressable>
              ))}
            </View>
            <View style={styles.nameBox}>
              <Text style={styles.fieldLabel}>昵称（选填）</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="给自己起个名字吧"
                placeholderTextColor={colors.textTertiary}
                style={styles.nameInput}
                maxLength={12}
              />
            </View>
          </StepWrap>
        )}

        {step === 'body' && (
          <StepWrap title="一些基础数据" subtitle="拖动调整到你的实际数值">
            <Stepper label="年龄" value={age} unit="岁" min={10} max={99} step={1} onChange={setAge} />
            <Stepper label="身高" value={height} unit="cm" min={120} max={220} step={1} onChange={setHeight} />
          </StepWrap>
        )}

        {step === 'weight' && (
          <StepWrap title="体重目标" subtitle="设定起点与想要达到的体重，也可直接输入">
            <Stepper label="当前体重" value={weight} unit="kg" min={30} max={200} step={0.1} editable onChange={setWeight} />
            <Stepper label="目标体重" value={target} unit="kg" min={30} max={200} step={0.1} editable onChange={setTarget} />
          </StepWrap>
        )}

        {step === 'goal' && (
          <StepWrap title="你的目标与活动量" subtitle="决定每日推荐热量">
            <Text style={styles.fieldLabel}>主要目标</Text>
            <View style={styles.goalRow}>
              {(['lose', 'keep', 'gain'] as Goal[]).map((g) => (
                <Pressable
                  key={g}
                  onPress={() => setGoal(g)}
                  style={[styles.goalChip, goal === g && styles.goalChipActive]}
                >
                  <Text style={[styles.goalChipText, goal === g && { color: '#fff' }]}>{goalLabel[g]}</Text>
                </Pressable>
              ))}
            </View>
            <Text style={[styles.fieldLabel, { marginTop: spacing.xl }]}>日常活动量</Text>
            <View style={{ gap: spacing.sm }}>
              {(Object.keys(activityLabel) as ActivityLevel[]).map((a) => (
                <Pressable
                  key={a}
                  onPress={() => setActivity(a)}
                  style={[styles.activityRow, activity === a && styles.activityRowActive]}
                >
                  <Text style={[styles.activityText, activity === a && { color: colors.primaryDark, fontWeight: '700' }]}>
                    {activityLabel[a]}
                  </Text>
                  <View style={[styles.radio, activity === a && styles.radioActive]} />
                </Pressable>
              ))}
            </View>
          </StepWrap>
        )}

        {step === 'summary' && <SummaryStep profile={profile} />}
      </ScrollView>

      <View style={styles.footer}>
        {step === 'terms' ? (
          <Button label="同意并继续" onPress={next} />
        ) : step === 'summary' ? (
          <Button label="开启我的健康之旅 🎉" onPress={finish} />
        ) : (
          <Button label="下一步" onPress={next} />
        )}
      </View>
    </SafeAreaView>
  );
}

function StepWrap({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <View>
      <Text style={styles.stepTitle}>{title}</Text>
      {subtitle ? <Text style={styles.stepSub}>{subtitle}</Text> : null}
      <View style={{ marginTop: spacing.xl }}>{children}</View>
    </View>
  );
}

function TermsStep() {
  return (
    <View>
      <Image source={images.logo} style={styles.welcomeLogo} resizeMode="contain" />
      <Text style={styles.welcomeTitle}>欢迎使用 零卡</Text>
      <Text style={styles.welcomeSub}>科学记录每日卡路里摄入与消耗，{'\n'}让健康管理变得简单</Text>
      <View style={styles.termsBox}>
        <Text style={styles.termsTitle}>用户条款与隐私政策</Text>
        <Text style={styles.termsText}>
          欢迎使用「零卡」健康管理工具。在开始之前，请阅读并同意以下条款：
          {'\n\n'}1. 本应用提供的卡路里、基础代谢等数据均为基于公开公式的估算值，仅供日常参考，不能替代专业医疗、营养建议。
          {'\n\n'}2. 你的所有个人数据（性别、身高、体重等）仅保存在本机设备上，我们不会上传或共享你的隐私信息。
          {'\n\n'}3. 若你患有疾病或处于特殊时期（如孕期），请在专业人士指导下进行饮食与运动管理。
          {'\n\n'}4. 继续使用即表示你已阅读并同意上述条款及隐私政策。
        </Text>
      </View>
    </View>
  );
}

function SummaryStep({ profile }: { profile: Profile }) {
  const bmr = calcBMR(profile);
  const tdee = calcTDEE(profile);
  const goalCal = calcCalorieGoal(profile);
  return (
    <View>
      <Text style={styles.stepTitle}>为你定制的方案</Text>
      <Text style={styles.stepSub}>基于你的数据科学计算</Text>
      <View style={styles.goalCalCard}>
        <Text style={styles.goalCalLabel}>每日推荐摄入</Text>
        <Text style={styles.goalCalValue}>{goalCal}</Text>
        <Text style={styles.goalCalUnit}>千卡 / 天</Text>
      </View>
      <View style={styles.metricRow}>
        <Metric label="基础代谢" value={`${bmr}`} unit="kcal" />
        <Metric label="每日消耗" value={`${tdee}`} unit="kcal" />
        <Metric label="饮水目标" value={`${profile.waterGoal}`} unit="ml" />
      </View>
      <View style={styles.summaryList}>
        <SummaryItem label="目标" value={`${goalLabel[profile.goal]}（${profile.weight}→${profile.targetWeight}kg）`} />
        <SummaryItem label="身高 / 年龄" value={`${profile.height}cm · ${profile.age}岁`} />
      </View>
    </View>
  );
}

function Metric({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricUnit}>{unit}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryItem}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
  );
}

function formatStepperValue(value: number, step: number) {
  return step >= 1 ? String(Math.round(value)) : value.toFixed(1);
}

function Stepper({
  label,
  value,
  unit,
  min,
  max,
  step,
  editable = false,
  onChange,
}: {
  label: string;
  value: number;
  unit: string;
  min: number;
  max: number;
  step: number;
  editable?: boolean;
  onChange: (v: number) => void;
}) {
  const [text, setText] = useState(formatStepperValue(value, step));
  const [focused, setFocused] = useState(false);

  React.useEffect(() => {
    if (!focused) setText(formatStepperValue(value, step));
  }, [value, step, focused]);

  const round = (n: number) => (step >= 1 ? Math.round(n) : Math.round(n * 10) / 10);
  const dec = () => onChange(Math.max(min, round(value - step)));
  const inc = () => onChange(Math.min(max, round(value + step)));

  const commit = () => {
    const parsed = parseFloat(text.replace(',', '.'));
    if (Number.isFinite(parsed)) {
      onChange(Math.min(max, Math.max(min, round(parsed))));
    } else {
      setText(formatStepperValue(value, step));
    }
  };

  return (
    <View style={styles.stepperCard}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.stepperRow}>
        <Pressable onPress={dec} style={styles.stepperBtn}>
          <Text style={styles.stepperBtnText}>−</Text>
        </Pressable>
        <View style={styles.stepperValueBox}>
          {editable ? (
            <TextInput
              value={text}
              onChangeText={setText}
              onFocus={() => setFocused(true)}
              onBlur={() => {
                setFocused(false);
                commit();
              }}
              onSubmitEditing={commit}
              keyboardType={step < 1 ? 'decimal-pad' : 'number-pad'}
              returnKeyType="done"
              selectTextOnFocus
              style={styles.stepperValueInput}
            />
          ) : (
            <Text style={styles.stepperValue}>{formatStepperValue(value, step)}</Text>
          )}
          <Text style={styles.stepperUnit}>{unit}</Text>
        </View>
        <Pressable onPress={inc} style={styles.stepperBtn}>
          <Text style={styles.stepperBtnText}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  topBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.md, gap: spacing.md },
  backText: { color: colors.textSecondary, fontSize: font.md, width: 50 },
  stepCount: { color: colors.textTertiary, fontSize: font.sm, width: 40, textAlign: 'right' },
  progressTrack: { flex: 1, height: 6, backgroundColor: colors.divider, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: 6, backgroundColor: colors.primary, borderRadius: 3 },
  content: { padding: spacing.xl, paddingBottom: 40 },
  footer: { padding: spacing.xl, paddingTop: spacing.sm },

  stepTitle: { fontSize: font.xxl, fontWeight: '800', color: colors.text },
  stepSub: { fontSize: font.md, color: colors.textSecondary, marginTop: 6 },

  welcomeLogo: { width: 96, height: 96, alignSelf: 'center', marginTop: 12 },
  welcomeTitle: { fontSize: 28, fontWeight: '800', color: colors.text, textAlign: 'center', marginTop: spacing.md },
  welcomeSub: { fontSize: font.md, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.sm, lineHeight: 22 },
  termsBox: { backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.lg, marginTop: spacing.xl, ...shadow.soft },
  termsTitle: { fontSize: font.lg, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  termsText: { fontSize: font.sm, color: colors.textSecondary, lineHeight: 21 },

  genderRow: { flexDirection: 'row', gap: spacing.lg },
  genderCard: { flex: 1, backgroundColor: colors.card, borderRadius: radius.lg, paddingVertical: spacing.xxl, alignItems: 'center', borderWidth: 2, borderColor: 'transparent', ...shadow.soft },
  genderCardActive: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  genderAvatar: { width: 64, height: 64, borderRadius: 32 },
  genderLabel: { fontSize: font.lg, fontWeight: '700', color: colors.text, marginTop: spacing.sm },
  nameBox: { marginTop: spacing.xl },
  nameInput: { backgroundColor: colors.card, borderRadius: radius.md, padding: spacing.lg, fontSize: font.md, color: colors.text, marginTop: spacing.sm, ...shadow.soft },

  fieldLabel: { fontSize: font.md, fontWeight: '700', color: colors.text },
  stepperCard: { backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.lg, ...shadow.soft },
  stepperRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.md },
  stepperBtn: { width: 52, height: 52, borderRadius: radius.md, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  stepperBtnText: { fontSize: 28, color: colors.primaryDark, fontWeight: '600' },
  stepperValueBox: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  stepperValue: { fontSize: 40, fontWeight: '800', color: colors.text },
  stepperValueInput: {
    minWidth: 72,
    fontSize: 40,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
    paddingVertical: 0,
  },
  stepperUnit: { fontSize: font.md, color: colors.textSecondary },

  goalRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.md },
  goalChip: { flex: 1, height: 48, borderRadius: radius.md, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center', ...shadow.soft },
  goalChipActive: { backgroundColor: colors.primary },
  goalChipText: { fontSize: font.md, fontWeight: '700', color: colors.textSecondary },

  activityRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.card, borderRadius: radius.md, padding: spacing.lg, ...shadow.soft },
  activityRowActive: { backgroundColor: colors.primarySoft },
  activityText: { fontSize: font.md, color: colors.textSecondary, flex: 1 },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: colors.border },
  radioActive: { borderColor: colors.primary, backgroundColor: colors.primary },

  goalCalCard: { backgroundColor: colors.primary, borderRadius: radius.xl, alignItems: 'center', paddingVertical: spacing.xxl, marginTop: spacing.xl, ...shadow.float },
  goalCalLabel: { color: 'rgba(255,255,255,0.85)', fontSize: font.md },
  goalCalValue: { color: '#fff', fontSize: 56, fontWeight: '800', marginTop: 4 },
  goalCalUnit: { color: 'rgba(255,255,255,0.85)', fontSize: font.sm },
  metricRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg },
  metric: { flex: 1, backgroundColor: colors.card, borderRadius: radius.lg, alignItems: 'center', paddingVertical: spacing.lg, ...shadow.soft },
  metricValue: { fontSize: font.xl, fontWeight: '800', color: colors.text },
  metricUnit: { fontSize: font.xs, color: colors.textTertiary },
  metricLabel: { fontSize: font.sm, color: colors.textSecondary, marginTop: 4 },
  summaryList: { backgroundColor: colors.card, borderRadius: radius.lg, marginTop: spacing.lg, paddingHorizontal: spacing.lg, ...shadow.soft },
  summaryItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.md, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.divider },
  summaryLabel: { fontSize: font.md, color: colors.textSecondary },
  summaryValue: { fontSize: font.md, color: colors.text, fontWeight: '600' },
});
