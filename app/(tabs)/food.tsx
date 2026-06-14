import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { categories, FoodCategory, foods } from '../../src/data/foods';
import { RemoteFood, searchOnlineFoods } from '../../src/data/foodApi';
import { font, Palette, radius, shadow, spacing, useColors } from '../../src/theme';

// 列表统一展示类型（本地 / 在线通用）
interface DisplayFood {
  id: string;
  name: string;
  original?: string;
  calories: number;
  protein?: number;
  fat?: number;
  carb?: number;
  emoji: string;
  category?: string;
  brand?: string;
  online?: boolean;
}

export default function FoodScreen() {
  const router = useRouter();
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [query, setQuery] = useState('');
  const [cat, setCat] = useState<FoodCategory | '全部'>('全部');
  const [detail, setDetail] = useState<DisplayFood | null>(null);

  const [online, setOnline] = useState<RemoteFood[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const trimmed = query.trim();
  const searching = trimmed.length > 0;

  // 本地匹配（即时，模糊：忽略大小写与空格，双向包含）
  const localMatches = useMemo<DisplayFood[]>(() => {
    if (!searching) {
      return foods.filter((f) => cat === '全部' || f.category === cat);
    }
    const norm = (s: string) => s.toLowerCase().replace(/\s+/g, '');
    const q = norm(trimmed);
    return foods.filter((f) => {
      const n = norm(f.name);
      return n.includes(q) || q.includes(n) || (f.category && norm(f.category).includes(q));
    });
  }, [trimmed, searching, cat]);

  // 在线搜索（去抖 400ms）
  useEffect(() => {
    if (!searching) {
      setOnline([]);
      setLoading(false);
      setError(null);
      abortRef.current?.abort();
      return;
    }
    setLoading(true);
    setError(null);
    const handle = setTimeout(async () => {
      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      try {
        const results = await searchOnlineFoods(trimmed, ctrl.signal);
        setOnline(results);
      } catch (e: any) {
        if (e?.name !== 'AbortError') setError('在线搜索失败，请检查网络后重试');
      } finally {
        setLoading(false);
      }
    }, 400);
    return () => clearTimeout(handle);
  }, [trimmed, searching]);

  const allCats: (FoodCategory | '全部')[] = ['全部', ...categories];

  // 在线结果去掉与本地重名的
  const onlineDisplay: DisplayFood[] = useMemo(() => {
    const localNames = new Set(localMatches.map((l) => l.name));
    return online
      .filter((o) => !localNames.has(o.name))
      .map((o) => ({ ...o, online: true }));
  }, [online, localMatches]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>食谱热量库</Text>
        <Text style={styles.headerSub}>常见食物 + 在线海量数据库搜索</Text>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color={colors.textTertiary} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="搜索任意食物，如 米饭 / 全麦面包 / 牛奶"
            placeholderTextColor={colors.textTertiary}
            style={styles.searchInput}
            returnKeyType="search"
          />
          {query ? (
            <Pressable onPress={() => setQuery('')} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color={colors.textTertiary} />
            </Pressable>
          ) : null}
        </View>
      </View>

      {/* 浏览模式才显示分类 */}
      {!searching ? (
        <View style={styles.catBar}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.catContent}
          >
            {allCats.map((item) => {
              const active = item === cat;
              return (
                <Pressable key={item} onPress={() => setCat(item)} style={[styles.catChip, active && styles.catChipActive]}>
                  <Text style={[styles.catText, active && { color: '#fff' }]}>{item}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      ) : null}

      <FlatList
        style={{ flex: 1 }}
        data={searching ? [...localMatches, ...onlineDisplay] : localMatches}
        keyExtractor={(f) => f.id}
        contentContainerStyle={{ paddingHorizontal: spacing.xl, paddingTop: spacing.sm, paddingBottom: 30, gap: spacing.sm }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          searching ? (
            <View style={styles.searchMeta}>
              <Text style={styles.metaText}>
                本地 {localMatches.length} 条{onlineDisplay.length ? ` · 在线 ${onlineDisplay.length} 条` : ''}
              </Text>
              {loading ? (
                <View style={styles.loadingRow}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={styles.metaText}>在线搜索中…</Text>
                </View>
              ) : null}
            </View>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            {loading ? (
              <>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.emptyText}>正在搜索在线数据库…</Text>
              </>
            ) : error ? (
              <>
                <Text style={{ fontSize: 40 }}>📶</Text>
                <Text style={styles.emptyText}>{error}</Text>
              </>
            ) : (
              <>
                <Text style={{ fontSize: 40 }}>🔍</Text>
                <Text style={styles.emptyText}>没有找到「{trimmed}」</Text>
                <Text style={styles.emptyHint}>换个关键词试试</Text>
              </>
            )}
          </View>
        }
        renderItem={({ item }) => (
          <Pressable style={styles.foodCard} onPress={() => setDetail(item)}>
            <View style={styles.foodEmojiBox}>
              <Text style={{ fontSize: 24 }}>{item.emoji}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.foodName} numberOfLines={1}>
                {item.name}
              </Text>
              <View style={styles.foodMetaRow}>
                {item.online ? (
                  <View style={styles.onlineTag}>
                    <Ionicons name="cloud-outline" size={10} color={colors.primaryDark} />
                    <Text style={styles.onlineTagText}>在线</Text>
                  </View>
                ) : (
                  <Text style={styles.foodCat}>{item.category}</Text>
                )}
                {item.original ? (
                  <Text style={styles.foodCat} numberOfLines={1}>
                    {item.original}
                  </Text>
                ) : item.brand ? (
                  <Text style={styles.foodCat} numberOfLines={1}>
                    {item.brand}
                  </Text>
                ) : null}
              </View>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.foodCal}>{item.calories}</Text>
              <Text style={styles.foodCalUnit}>kcal/100g</Text>
            </View>
          </Pressable>
        )}
        ListFooterComponent={
          searching && !loading && (localMatches.length || onlineDisplay.length) ? (
            <Text style={styles.source}>在线数据来自 Open Food Facts 开放数据库</Text>
          ) : null
        }
      />

      <FoodDetailModal
        item={detail}
        onClose={() => setDetail(null)}
        onAdd={() => {
          const it = detail;
          setDetail(null);
          if (it) router.push({ pathname: '/add', params: { food: it.name, cal: String(it.calories) } });
        }}
      />
    </SafeAreaView>
  );
}

function FoodDetailModal({ item, onClose, onAdd }: { item: DisplayFood | null; onClose: () => void; onAdd: () => void }) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <Modal visible={!!item} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.modalBg} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          {item ? (
            <>
              <View style={styles.sheetHandle} />
              <View style={styles.sheetHead}>
                <View style={styles.sheetEmoji}>
                  <Text style={{ fontSize: 40 }}>{item.emoji}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.sheetName}>{item.name}</Text>
                  <Text style={styles.sheetCat}>{item.original || item.brand || item.category || (item.online ? '在线食物' : '')}</Text>
                </View>
              </View>

              <View style={styles.calBig}>
                <Text style={styles.calBigValue}>{item.calories}</Text>
                <Text style={styles.calBigUnit}>kcal / 100 克</Text>
              </View>

              <View style={styles.macroRow}>
                <Macro label="蛋白质" value={item.protein} color={colors.weight} />
                <Macro label="脂肪" value={item.fat} color={colors.calorie} />
                <Macro label="碳水" value={item.carb} color={colors.water} />
              </View>

              <Pressable style={styles.addBtn} onPress={onAdd}>
                <Ionicons name="add-circle" size={20} color="#fff" />
                <Text style={styles.addBtnText}>添加到饮食记录</Text>
              </Pressable>
            </>
          ) : null}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function Macro({ label, value, color }: { label: string; value?: number; color: string }) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={styles.macro}>
      <Text style={[styles.macroValue, { color }]}>{value != null ? `${value}g` : '—'}</Text>
      <Text style={styles.macroLabel}>{label}</Text>
    </View>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: spacing.xl, paddingTop: spacing.sm },
  headerTitle: { fontSize: font.xxl, fontWeight: '800', color: colors.text },
  headerSub: { fontSize: font.sm, color: colors.textSecondary, marginTop: 4 },
  searchBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.card, borderRadius: radius.md, paddingHorizontal: spacing.md, height: 48, marginTop: spacing.md, ...shadow.soft },
  searchInput: { flex: 1, fontSize: font.md, color: colors.text },
  catBar: { height: 56, marginTop: spacing.sm },
  catContent: { paddingHorizontal: spacing.xl, gap: spacing.sm, alignItems: 'center' },
  catChip: { paddingHorizontal: spacing.lg, height: 36, borderRadius: radius.pill, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center', ...shadow.soft },
  catChipActive: { backgroundColor: colors.primary },
  catText: { fontSize: font.sm, color: colors.textSecondary, fontWeight: '600' },

  searchMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.sm },
  metaText: { fontSize: font.xs, color: colors.textTertiary },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },

  foodCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.card, borderRadius: radius.md, padding: spacing.md, ...shadow.soft },
  foodEmojiBox: { width: 46, height: 46, borderRadius: radius.md, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
  foodName: { fontSize: font.md, fontWeight: '600', color: colors.text },
  foodMetaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: 2 },
  foodCat: { fontSize: font.xs, color: colors.textTertiary, flexShrink: 1 },
  onlineTag: { flexDirection: 'row', alignItems: 'center', gap: 2, backgroundColor: colors.primarySoft, paddingHorizontal: 6, paddingVertical: 1, borderRadius: radius.pill },
  onlineTagText: { fontSize: 10, color: colors.primaryDark, fontWeight: '700' },
  foodCal: { fontSize: font.lg, fontWeight: '800', color: colors.calorie },
  foodCalUnit: { fontSize: 10, color: colors.textTertiary },

  empty: { alignItems: 'center', paddingVertical: 60, gap: 10 },
  emptyText: { fontSize: font.md, color: colors.textTertiary },
  emptyHint: { fontSize: font.sm, color: colors.textTertiary },
  source: { fontSize: font.xs, color: colors.textTertiary, textAlign: 'center', marginTop: spacing.lg },

  modalBg: { flex: 1, backgroundColor: 'rgba(15,23,42,0.4)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.card, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, padding: spacing.xl, paddingBottom: 40 },
  sheetHandle: { width: 40, height: 5, borderRadius: 3, backgroundColor: colors.border, alignSelf: 'center', marginBottom: spacing.lg },
  sheetHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  sheetEmoji: { width: 64, height: 64, borderRadius: radius.lg, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
  sheetName: { fontSize: font.xl, fontWeight: '800', color: colors.text },
  sheetCat: { fontSize: font.sm, color: colors.textSecondary, marginTop: 2 },
  calBig: { alignItems: 'center', marginVertical: spacing.xl },
  calBigValue: { fontSize: 52, fontWeight: '800', color: colors.calorie },
  calBigUnit: { fontSize: font.sm, color: colors.textSecondary },
  macroRow: { flexDirection: 'row', gap: spacing.md },
  macro: { flex: 1, backgroundColor: colors.bg, borderRadius: radius.md, alignItems: 'center', paddingVertical: spacing.lg },
  macroValue: { fontSize: font.lg, fontWeight: '800' },
  macroLabel: { fontSize: font.xs, color: colors.textSecondary, marginTop: 2 },
  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.primary, height: 52, borderRadius: radius.md, marginTop: spacing.xl },
  addBtnText: { color: '#fff', fontSize: font.md, fontWeight: '700' },
  });
