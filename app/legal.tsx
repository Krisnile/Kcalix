import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, font, radius, shadow, spacing } from '../src/theme';

type LegalType = 'about' | 'terms' | 'privacy' | 'licenses';

const titles: Record<LegalType, string> = {
  about: '关于零卡',
  terms: '用户协议',
  privacy: '隐私政策',
  licenses: '第三方开源清单',
};

export default function LegalScreen() {
  const router = useRouter();
  const { type } = useLocalSearchParams<{ type: LegalType }>();
  const t = (type as LegalType) || 'about';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.head}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.closeBtn}>
          <Ionicons name="chevron-down" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.title}>{titles[t]}</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {t === 'about' && <About />}
        {t === 'terms' && <Paragraphs items={termsText} />}
        {t === 'privacy' && <Paragraphs items={privacyText} />}
        {t === 'licenses' && <Licenses />}
      </ScrollView>
    </SafeAreaView>
  );
}

function About() {
  return (
    <View style={{ alignItems: 'center' }}>
      <Text style={{ fontSize: 64, marginTop: spacing.lg }}>🥗</Text>
      <Text style={styles.appName}>零卡 Kcalix</Text>
      <Text style={styles.version}>版本 1.0.0</Text>
      <Text style={styles.aboutDesc}>
        零卡是一款简洁而强大的卡路里管理工具，帮助你科学记录每日的饮食摄入、运动消耗、体重变化与饮水情况，让健康管理成为一种轻松的日常习惯。
      </Text>
      <View style={styles.featureCard}>
        <Feature icon="restaurant-outline" text="智能卡路里预算与三餐记录" />
        <Feature icon="trending-down-outline" text="体重趋势与目标进度追踪" />
        <Feature icon="water-outline" text="每日饮水量记录与提醒" />
        <Feature icon="book-outline" text="常见食物热量数据库" />
      </View>
      <Text style={styles.copyright}>数据均保存在本地设备 · 用心守护你的隐私</Text>
    </View>
  );
}

function Feature({ icon, text }: { icon: any; text: string }) {
  return (
    <View style={styles.feature}>
      <Ionicons name={icon} size={20} color={colors.primary} />
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
}

function Paragraphs({ items }: { items: { h?: string; p: string }[] }) {
  return (
    <View style={{ gap: spacing.lg }}>
      {items.map((it, i) => (
        <View key={i}>
          {it.h ? <Text style={styles.h}>{it.h}</Text> : null}
          <Text style={styles.p}>{it.p}</Text>
        </View>
      ))}
    </View>
  );
}

function Licenses() {
  const libs = [
    { name: 'React Native', license: 'MIT' },
    { name: 'Expo / Expo Router', license: 'MIT' },
    { name: 'react-native-svg', license: 'MIT' },
    { name: '@react-native-async-storage/async-storage', license: 'MIT' },
    { name: 'react-native-safe-area-context', license: 'MIT' },
    { name: 'react-native-gesture-handler', license: 'MIT' },
    { name: '@expo/vector-icons (Ionicons)', license: 'MIT' },
  ];
  return (
    <View style={styles.licenseCard}>
      <Text style={[styles.p, { marginBottom: spacing.md }]}>本应用基于以下优秀的开源项目构建，在此致谢：</Text>
      {libs.map((l, i) => (
        <View key={l.name} style={[styles.licenseRow, i < libs.length - 1 && styles.licenseBorder]}>
          <Text style={styles.licenseName}>{l.name}</Text>
          <Text style={styles.licenseTag}>{l.license}</Text>
        </View>
      ))}
    </View>
  );
}

const termsText: { h?: string; p: string }[] = [
  { p: '感谢你使用「零卡」。在使用本应用前，请仔细阅读并同意本协议。你一旦开始使用，即视为已接受全部条款。' },
  { h: '一、服务说明', p: '零卡是一款帮助用户记录与管理卡路里摄入、消耗及身体数据的工具类应用。应用内提供的基础代谢率、每日热量目标、食物热量等数据均基于公开通用公式估算，仅供参考，不构成任何医疗或营养专业建议。' },
  { h: '二、用户责任', p: '你应对自己录入的数据真实性负责。若你患有疾病、处于孕期哺乳期或有特殊健康状况，请在专业医师或营养师指导下进行饮食和运动安排，切勿仅依赖本应用的估算结果。' },
  { h: '三、数据与隐私', p: '本应用为纯本地应用，你的全部个人资料与记录均仅保存在你的设备本地，不会上传至任何服务器，亦不会与第三方共享。卸载应用或清除数据将导致记录永久丢失，请谨慎操作。' },
  { h: '四、免责声明', p: '在法律允许的范围内，对于因使用本应用估算数据进行饮食、运动决策而产生的任何后果，开发者不承担责任。' },
  { h: '五、协议更新', p: '我们可能不时更新本协议，更新后将在应用内提示。继续使用即表示你接受更新后的条款。' },
];

const privacyText: { h?: string; p: string }[] = [
  { p: '我们高度重视你的隐私。本隐私政策说明零卡如何处理你的信息。' },
  { h: '一、我们收集什么', p: '零卡仅收集你主动录入的健康数据（性别、年龄、身高、体重、目标、饮食、运动、饮水记录等），用于在本机为你提供记录与统计功能。' },
  { h: '二、数据存储位置', p: '上述所有数据仅存储在你的设备本地存储中，不会被上传到云端或任何第三方服务器。开发者无法访问你的任何个人数据。' },
  { h: '三、权限说明', p: '零卡不会主动请求位置、通讯录、相机等敏感权限。如需开启提醒功能，仅会使用本地通知权限。' },
  { h: '四、数据删除', p: '你可以随时在「我的-清除所有数据」中删除全部本地数据。该操作不可恢复。' },
  { h: '五、联系我们', p: '如对隐私有任何疑问，可通过应用内「联系客服」与我们沟通。' },
];

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  closeBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: font.lg, fontWeight: '700', color: colors.text },
  scroll: { padding: spacing.xl, paddingBottom: 40 },

  appName: { fontSize: font.xl, fontWeight: '800', color: colors.text, marginTop: spacing.md },
  version: { fontSize: font.sm, color: colors.textTertiary, marginTop: 4 },
  aboutDesc: { fontSize: font.md, color: colors.textSecondary, lineHeight: 24, marginTop: spacing.lg, textAlign: 'center' },
  featureCard: { backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.lg, marginTop: spacing.xl, alignSelf: 'stretch', gap: spacing.md, ...shadow.soft },
  feature: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  featureText: { fontSize: font.md, color: colors.text },
  copyright: { fontSize: font.xs, color: colors.textTertiary, marginTop: spacing.xl, textAlign: 'center' },

  h: { fontSize: font.md, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  p: { fontSize: font.md, color: colors.textSecondary, lineHeight: 24 },

  licenseCard: { backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.lg, ...shadow.soft },
  licenseRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.md },
  licenseBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.divider },
  licenseName: { fontSize: font.md, color: colors.text },
  licenseTag: { fontSize: font.xs, color: colors.primaryDark, backgroundColor: colors.primarySoft, paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.pill, fontWeight: '700' },
});
