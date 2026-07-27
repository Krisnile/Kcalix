import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import React, { useMemo, useState } from 'react';
import {
  Alert,
  Image,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, PageTitle } from '../../src/components/ui';
import { images } from '../../src/images';
import { useStore } from '../../src/store/AppStore';
import { font, Palette, radius, shadow, spacing, useColors } from '../../src/theme';
import { ActivityLevel, Gender, Goal } from '../../src/types';
import { buildCsv, parseCsv } from '../../src/utils/csv';
import { todayKey } from '../../src/utils/date';
import { bmiCategory, calcBMI, calcCalorieGoal, calcTDEE, goalLabel } from '../../src/utils/nutrition';
import { latestWeight } from '../../src/utils/selectors';

export default function ProfileScreen() {
  const router = useRouter();
  const { data, updateProfile, updateSettings, resetAll, replaceRecords } = useStore();
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [editing, setEditing] = useState(false);
  const [supportVisible, setSupportVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const profile = data.profile;
  if (!profile) return null;

  const pickAvatar = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('需要相册权限', '请在系统设置中允许零卡访问相册后重试。');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });
      if (!result.canceled && result.assets?.[0]?.uri) {
        updateProfile({ avatarUri: result.assets[0].uri });
      }
    } catch (e) {
      Alert.alert('选择失败', '无法读取所选图片，请重试。');
    }
  };

  const changeAvatar = () => {
    const options: { text: string; style?: 'cancel' | 'destructive'; onPress?: () => void }[] = [
      { text: '从相册选择', onPress: pickAvatar },
    ];
    if (profile.avatarUri) {
      options.push({ text: '恢复默认头像', style: 'destructive', onPress: () => updateProfile({ avatarUri: undefined }) });
    }
    options.push({ text: '取消', style: 'cancel' });
    Alert.alert('修改头像', '选择一张图片作为你的头像', options);
  };

  const current = latestWeight(data.weightLogs) ?? profile.weight;
  const bmi = calcBMI(current, profile.height);
  const cat = bmiCategory(bmi);
  const goalCal = calcCalorieGoal(profile, current);
  const tdee = calcTDEE(profile, current);

  const confirmReset = () => {
    Alert.alert('清除所有数据', '这将删除全部记录与个人资料，且无法恢复。确定继续吗？', [
      { text: '取消', style: 'cancel' },
      { text: '清除', style: 'destructive', onPress: () => { resetAll(); router.replace('/onboarding'); } },
    ]);
  };

  const contactSupport = () => setSupportVisible(true);

  const exportCsv = async () => {
    try {
      setBusy(true);
      const csv = buildCsv(data);
      const uri = `${FileSystem.cacheDirectory}零卡数据_${todayKey()}.csv`;
      // 加 BOM 让 Excel 正确识别 UTF-8 中文
      await FileSystem.writeAsStringAsync(uri, `\ufeff${csv}`, { encoding: FileSystem.EncodingType.UTF8 });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { mimeType: 'text/csv', dialogTitle: '导出零卡记录数据' });
      } else {
        Alert.alert('导出完成', `文件已保存到：\n${uri}`);
      }
    } catch (e) {
      Alert.alert('导出失败', '无法生成或分享文件，请稍后重试。');
    } finally {
      setBusy(false);
    }
  };

  const importCsv = async () => {
    try {
      const picked = await DocumentPicker.getDocumentAsync({
        type: ['text/csv', 'text/comma-separated-values', 'application/csv', 'text/plain', '*/*'],
        copyToCacheDirectory: true,
      });
      if (picked.canceled || !picked.assets?.[0]) return;
      setBusy(true);

      const asset = picked.assets[0];
      let uri = asset.uri;
      // 部分 Android 设备对 content:// 读取不稳定，先复制到缓存
      if (!uri.startsWith('file://')) {
        const cacheUri = `${FileSystem.cacheDirectory}kcalix-import.csv`;
        await FileSystem.copyAsync({ from: uri, to: cacheUri });
        uri = cacheUri;
      }

      const text = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.UTF8 });
      const records = parseCsv(text);
      const total =
        records.weightLogs.length + records.foodLogs.length + records.exerciseLogs.length + records.waterLogs.length;
      if (total === 0) {
        Alert.alert(
          '未识别到数据',
          '该 CSV 中没有可导入的记录。请使用本应用「导出数据」生成的文件，或用 Excel 编辑后保持 type、date 等列名不变。',
        );
        return;
      }
      Alert.alert(
        '确认导入',
        `识别到 ${total} 条记录（体重 ${records.weightLogs.length}、饮食 ${records.foodLogs.length}、运动 ${records.exerciseLogs.length}、饮水 ${records.waterLogs.length}）。\n\n导入将覆盖现有的全部记录，确定继续吗？`,
        [
          { text: '取消', style: 'cancel' },
          {
            text: '覆盖导入',
            style: 'destructive',
            onPress: () => {
              replaceRecords(records);
              Alert.alert('导入成功', '记录已更新。');
            },
          },
        ],
      );
    } catch (e) {
      Alert.alert('导入失败', '无法读取或解析所选文件。请确认是本应用导出的 CSV，且未被另存为其他格式。');
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={{ marginBottom: spacing.lg }}>
          <PageTitle title="我的" />
        </View>

        {/* 个人资料卡 */}
        <View style={styles.profileCard}>
          <Pressable onPress={changeAvatar} style={styles.avatarWrap}>
            <Image
              source={profile.avatarUri ? { uri: profile.avatarUri } : profile.gender === 'male' ? images.avatarMale : images.avatarFemale}
              style={styles.avatar}
              resizeMode="cover"
            />
            <View style={styles.avatarBadge}>
              <Ionicons name="camera" size={12} color="#fff" />
            </View>
          </Pressable>

          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{profile.name}</Text>
            <Text style={styles.sub}>
              {profile.gender === 'male' ? '男' : '女'} · {profile.age}岁 · {profile.height}cm
            </Text>
            <View style={[styles.bmiTag, { backgroundColor: cat.color + '22' }]}>
              <Text style={[styles.bmiText, { color: cat.color }]}>BMI {bmi} · {cat.label}</Text>
            </View>
          </View>
          <Pressable style={styles.editBtn} onPress={() => setEditing(true)}>
            <Ionicons name="create-outline" size={18} color={colors.primaryDark} />
            <Text style={styles.editText}>编辑</Text>
          </Pressable>
        </View>

        {/* 数据概览 */}
        <View style={styles.statsRow}>
          <StatBox label="当前体重" value={`${current}`} unit="kg" color={colors.weight} />
          <StatBox label="目标体重" value={`${profile.targetWeight}`} unit="kg" color={colors.primary} />
          <StatBox label="每日热量" value={`${goalCal}`} unit="kcal" color={colors.calorie} />
        </View>
        <View style={styles.infoCard}>
          <InfoRow label="健康目标" value={goalLabel[profile.goal]} />
          <InfoRow label="每日总消耗 (TDEE)" value={`${tdee} kcal`} />
          <InfoRow label="每日饮水目标" value={`${profile.waterGoal} ml`} last />
        </View>

        {/* 设置 */}
        <Group title="偏好设置">
          <ToggleRow
            icon="notifications-outline"
            label="记录提醒"
            value={data.settings.reminderEnabled}
            onChange={(v) => updateSettings({ reminderEnabled: v })}
          />
          <MenuRow
            icon="color-palette-outline"
            label="外观主题"
            value={themeLabel(data.settings.theme)}
            onPress={() => router.push('/appearance')}
          />
        </Group>

        {/* 数据管理 */}
        <Group title="数据管理">
          <MenuRow icon="cloud-upload-outline" label="导出数据 (CSV)" onPress={busy ? () => {} : exportCsv} />
          <MenuRow icon="cloud-download-outline" label="导入数据 (CSV)" onPress={busy ? () => {} : importCsv} />
        </Group>

        {/* 帮助与反馈 */}
        <Group title="帮助与反馈">
          <MenuRow icon="headset-outline" label="联系客服" onPress={contactSupport} />
          <MenuRow icon="chatbubble-ellipses-outline" label="意见反馈" onPress={() => Linking.openURL('mailto:kkisie@163.com?subject=零卡意见反馈')} />
        </Group>

        {/* 关于 */}
        <Group title="关于">
          <MenuRow icon="information-circle-outline" label="关于零卡" onPress={() => router.push('/legal?type=about')} />
          <MenuRow icon="document-text-outline" label="用户协议" onPress={() => router.push('/legal?type=terms')} />
          <MenuRow icon="lock-closed-outline" label="隐私政策" onPress={() => router.push('/legal?type=privacy')} />
          <MenuRow icon="list-outline" label="第三方开源清单" onPress={() => router.push('/legal?type=licenses')} />
        </Group>

        <Pressable style={styles.dangerBtn} onPress={confirmReset}>
          <Ionicons name="trash-outline" size={18} color={colors.danger} />
          <Text style={styles.dangerText}>清除所有数据</Text>
        </Pressable>

        <Text style={styles.version}>零卡 Kcalix v1.1.0</Text>
        <View style={{ height: 20 }} />
      </ScrollView>

      <EditModal visible={editing} onClose={() => setEditing(false)} />
      <ContactSupportModal visible={supportVisible} onClose={() => setSupportVisible(false)} />
    </SafeAreaView>
  );
}

function ContactSupportModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const sendEmail = () => {
    onClose();
    Linking.openURL('mailto:kkisie@163.com?subject=零卡客服');
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.supportBackdrop} onPress={onClose}>
        <Pressable style={styles.supportCard} onPress={() => {}}>
          <View style={styles.supportIcon}>
            <Ionicons name="headset-outline" size={27} color={colors.primaryDark} />
          </View>
          <Text style={styles.supportTitle}>联系客服</Text>
          <Text style={styles.supportIntro}>遇到问题或有建议，都可以来找我们。</Text>
          <View style={styles.supportInfo}>
            <View style={styles.supportInfoRow}>
              <Ionicons name="mail-outline" size={18} color={colors.primary} />
              <View>
                <Text style={styles.supportInfoLabel}>客服邮箱</Text>
                <Text style={styles.supportInfoValue}>kkisie@163.com</Text>
              </View>
            </View>
            <View style={styles.supportInfoRow}>
              <Ionicons name="time-outline" size={18} color={colors.primary} />
              <View>
                <Text style={styles.supportInfoLabel}>工作时间</Text>
                <Text style={styles.supportInfoValue}>周一至周五 9:00–18:00</Text>
              </View>
            </View>
          </View>
          <Pressable style={styles.supportPrimary} onPress={sendEmail}>
            <Ionicons name="paper-plane-outline" size={18} color="#fff" />
            <Text style={styles.supportPrimaryText}>发送邮件</Text>
          </Pressable>
          <Pressable style={styles.supportClose} onPress={onClose}>
            <Text style={styles.supportCloseText}>暂时不用</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function EditModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { data, updateProfile, addWeight } = useStore();
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const p = data.profile!;
  const curWeight = latestWeight(data.weightLogs) ?? p.weight;
  const [name, setName] = useState(p.name);
  const [gender, setGender] = useState<Gender>(p.gender);
  const [age, setAge] = useState(String(p.age));
  const [height, setHeight] = useState(String(p.height));
  const [current, setCurrent] = useState(String(curWeight));
  const [target, setTarget] = useState(String(p.targetWeight));
  const [goal, setGoal] = useState<Goal>(p.goal);
  const [activity, setActivity] = useState<ActivityLevel>(p.activity);
  const [calGoal, setCalGoal] = useState(p.customCalorieGoal ? String(p.customCalorieGoal) : '');
  const [water, setWater] = useState(String(p.waterGoal));

  React.useEffect(() => {
    if (visible) {
      const cw = latestWeight(data.weightLogs) ?? p.weight;
      setName(p.name); setGender(p.gender); setAge(String(p.age)); setHeight(String(p.height));
      setCurrent(String(cw));
      setTarget(String(p.targetWeight)); setGoal(p.goal); setActivity(p.activity);
      setCalGoal(p.customCalorieGoal ? String(p.customCalorieGoal) : ''); setWater(String(p.waterGoal));
    }
  }, [visible]);

  const save = () => {
    updateProfile({
      name: name.trim() || '我',
      gender,
      age: parseInt(age, 10) || p.age,
      height: parseInt(height, 10) || p.height,
      targetWeight: parseFloat(target) || p.targetWeight,
      goal,
      activity,
      customCalorieGoal: calGoal ? parseInt(calGoal, 10) : undefined,
      waterGoal: parseInt(water, 10) || p.waterGoal,
    });
    // 当前体重变化时，记录/覆盖今天的体重
    const cw = Math.round((parseFloat(current) || curWeight) * 10) / 10;
    if (cw > 0 && cw !== Math.round(curWeight * 10) / 10) {
      addWeight({ date: todayKey(), weight: cw });
    }
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
        <View style={styles.modalHead}>
          <Pressable onPress={onClose} hitSlop={10}><Text style={styles.modalCancel}>取消</Text></Pressable>
          <Text style={styles.modalTitle}>编辑资料</Text>
          <Pressable onPress={save} hitSlop={10}><Text style={styles.modalSave}>保存</Text></Pressable>
        </View>
        <ScrollView contentContainerStyle={{ padding: spacing.xl, gap: spacing.lg }} keyboardShouldPersistTaps="handled">
          <Field label="昵称"><TextInput value={name} onChangeText={setName} style={styles.fieldInput} maxLength={12} /></Field>
          <Field label="性别">
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              {(['female', 'male'] as Gender[]).map((g) => (
                <Pressable key={g} onPress={() => setGender(g)} style={[styles.pill, gender === g && styles.pillActive]}>
                  <Text style={[styles.pillText, gender === g && { color: '#fff' }]}>{g === 'male' ? '男' : '女'}</Text>
                </Pressable>
              ))}
            </View>
          </Field>
          <Field label="年龄（岁）"><TextInput value={age} onChangeText={setAge} keyboardType="numeric" style={styles.fieldInput} /></Field>
          <Field label="身高（cm）"><TextInput value={height} onChangeText={setHeight} keyboardType="numeric" style={styles.fieldInput} /></Field>
          <Field label="当前体重（kg，可精确到 0.1）"><TextInput value={current} onChangeText={setCurrent} keyboardType="decimal-pad" style={styles.fieldInput} /></Field>
          <Field label="目标体重（kg，可精确到 0.1）"><TextInput value={target} onChangeText={setTarget} keyboardType="decimal-pad" style={styles.fieldInput} /></Field>
          <Field label="健康目标">
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              {(['lose', 'keep', 'gain'] as Goal[]).map((g) => (
                <Pressable key={g} onPress={() => setGoal(g)} style={[styles.pill, goal === g && styles.pillActive]}>
                  <Text style={[styles.pillText, goal === g && { color: '#fff' }]}>{goalLabel[g]}</Text>
                </Pressable>
              ))}
            </View>
          </Field>
          <Field label="自定义每日热量目标（kcal，留空则自动计算）">
            <TextInput value={calGoal} onChangeText={setCalGoal} keyboardType="numeric" placeholder="自动" placeholderTextColor={colors.textTertiary} style={styles.fieldInput} />
          </Field>
          <Field label="每日饮水目标（ml）"><TextInput value={water} onChangeText={setWater} keyboardType="numeric" style={styles.fieldInput} /></Field>
          <Button label="保存修改" onPress={save} />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

function StatBox({ label, value, unit, color }: { label: string; value: string; unit: string; color: string }) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={styles.statBox}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statUnit}>{unit}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function InfoRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={[styles.infoRow, !last && styles.infoRowBorder]}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={{ marginTop: spacing.xl }}>
      <Text style={styles.groupTitle}>{title}</Text>
      <View style={styles.groupCard}>{children}</View>
    </View>
  );
}

function themeLabel(mode: 'light' | 'dark' | 'system' | undefined): string {
  if (mode === 'dark') return '深色';
  if (mode === 'system') return '跟随系统';
  return '浅色';
}

function MenuRow({ icon, label, onPress, value }: { icon: any; label: string; onPress: () => void; value?: string }) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <Pressable style={styles.menuRow} onPress={onPress}>
      <View style={styles.menuIcon}>
        <Ionicons name={icon} size={18} color={colors.primaryDark} />
      </View>
      <Text style={styles.menuLabel}>{label}</Text>
      {value ? <Text style={styles.menuValue}>{value}</Text> : null}
      <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
    </Pressable>
  );
}

function ToggleRow({ icon, label, value, onChange }: { icon: any; label: string; value: boolean; onChange: (v: boolean) => void }) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={styles.menuRow}>
      <View style={styles.menuIcon}>
        <Ionicons name={icon} size={18} color={colors.primaryDark} />
      </View>
      <Text style={styles.menuLabel}>{label}</Text>
      <Switch value={value} onValueChange={onChange} trackColor={{ true: colors.primary, false: colors.border }} thumbColor="#fff" />
    </View>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { paddingHorizontal: spacing.xl, paddingTop: spacing.sm },
  profileCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.lg, ...shadow.card },
  avatarWrap: { width: 60, height: 60 },
  avatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: colors.primarySoft },
  avatarBadge: { position: 'absolute', right: -2, bottom: -2, width: 22, height: 22, borderRadius: 11, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.card },
  name: { fontSize: font.lg, fontWeight: '800', color: colors.text },
  sub: { fontSize: font.sm, color: colors.textSecondary, marginTop: 2 },
  bmiTag: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.pill, marginTop: 6 },
  bmiText: { fontSize: font.xs, fontWeight: '700' },
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.primarySoft, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.pill },
  editText: { fontSize: font.sm, color: colors.primaryDark, fontWeight: '700' },

  statsRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg },
  statBox: { flex: 1, backgroundColor: colors.card, borderRadius: radius.lg, alignItems: 'center', paddingVertical: spacing.lg, ...shadow.soft },
  statValue: { fontSize: font.xl, fontWeight: '800' },
  statUnit: { fontSize: 10, color: colors.textTertiary },
  statLabel: { fontSize: font.xs, color: colors.textSecondary, marginTop: 4 },

  infoCard: { backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.lg, marginTop: spacing.md, ...shadow.soft },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.md },
  infoRowBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.divider },
  infoLabel: { fontSize: font.md, color: colors.textSecondary },
  infoValue: { fontSize: font.md, color: colors.text, fontWeight: '600' },

  groupTitle: { fontSize: font.sm, color: colors.textTertiary, fontWeight: '600', marginBottom: spacing.sm, marginLeft: spacing.xs },
  groupCard: { backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.md, ...shadow.soft },
  menuRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md },
  menuIcon: { width: 34, height: 34, borderRadius: 11, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  menuLabel: { flex: 1, fontSize: font.md, color: colors.text },
  menuValue: { fontSize: font.sm, color: colors.textTertiary },

  dangerBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: spacing.xl, paddingVertical: spacing.lg, borderRadius: radius.md, borderWidth: 1, borderColor: colors.danger + '78', backgroundColor: colors.danger + '12' },
  dangerText: { color: colors.danger, fontSize: font.md, fontWeight: '700' },
  version: { textAlign: 'center', color: colors.textTertiary, fontSize: font.xs, marginTop: spacing.lg },

  supportBackdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,0.42)', alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  supportCard: { width: '100%', maxWidth: 380, backgroundColor: colors.card, borderRadius: radius.xl, padding: spacing.xl, alignItems: 'center', ...shadow.float },
  supportIcon: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  supportTitle: { fontSize: font.xl, fontWeight: '800', color: colors.text },
  supportIntro: { fontSize: font.sm, color: colors.textSecondary, marginTop: 5, textAlign: 'center' },
  supportInfo: { width: '100%', backgroundColor: colors.bg, borderRadius: radius.md, padding: spacing.md, gap: spacing.md, marginTop: spacing.lg },
  supportInfoRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  supportInfoLabel: { fontSize: font.xs, color: colors.textTertiary },
  supportInfoValue: { fontSize: font.md, color: colors.text, fontWeight: '600', marginTop: 2 },
  supportPrimary: { width: '100%', height: 48, borderRadius: radius.md, backgroundColor: colors.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, marginTop: spacing.lg },
  supportPrimaryText: { color: '#fff', fontSize: font.md, fontWeight: '700' },
  supportClose: { paddingVertical: spacing.md, paddingHorizontal: spacing.xl },
  supportCloseText: { color: colors.textSecondary, fontSize: font.sm, fontWeight: '600' },

  modalHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  modalTitle: { fontSize: font.lg, fontWeight: '700', color: colors.text },
  modalCancel: { fontSize: font.md, color: colors.textSecondary },
  modalSave: { fontSize: font.md, color: colors.primary, fontWeight: '700' },
  fieldLabel: { fontSize: font.sm, color: colors.textSecondary, marginBottom: spacing.sm, fontWeight: '600' },
  fieldInput: { backgroundColor: colors.card, borderRadius: radius.md, paddingHorizontal: spacing.lg, height: 50, fontSize: font.md, color: colors.text, outlineStyle: 'none', ...shadow.soft } as any,
  pill: { flex: 1, height: 44, borderRadius: radius.md, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center', ...shadow.soft },
  pillActive: { backgroundColor: colors.primary },
  pillText: { fontSize: font.md, color: colors.textSecondary, fontWeight: '600' },
  });
