import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { font, Palette, radius, shadow, spacing, useColors } from '../theme';
import { parseKey, prettyDate, toKey, todayKey } from '../utils/date';

const WEEK = ['日', '一', '二', '三', '四', '五', '六'];

// 选择记录日期：点击展开月历，可选今天及以前的任意日期
export function DateField({ value, onChange }: { value: string; onChange: (d: string) => void }) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [open, setOpen] = useState(false);

  return (
    <>
      <Pressable style={styles.field} onPress={() => setOpen(true)}>
        <Ionicons name="calendar-outline" size={18} color={colors.primaryDark} />
        <Text style={styles.fieldText}>{prettyDate(value)}</Text>
        <Ionicons name="chevron-down" size={16} color={colors.textTertiary} />
      </Pressable>
      <CalendarModal
        visible={open}
        value={value}
        onClose={() => setOpen(false)}
        onPick={(d) => {
          onChange(d);
          setOpen(false);
        }}
      />
    </>
  );
}

function CalendarModal({
  visible,
  value,
  onClose,
  onPick,
}: {
  visible: boolean;
  value: string;
  onClose: () => void;
  onPick: (d: string) => void;
}) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const base = parseKey(value);
  const [cursor, setCursor] = useState({ y: base.getFullYear(), m: base.getMonth() });
  const today = todayKey();

  // 当弹窗重新打开时，同步到当前选中日期所在月份
  React.useEffect(() => {
    if (visible) {
      const d = parseKey(value);
      setCursor({ y: d.getFullYear(), m: d.getMonth() });
    }
  }, [visible, value]);

  const cells = useMemo(() => {
    const first = new Date(cursor.y, cursor.m, 1);
    const startPad = first.getDay();
    const daysInMonth = new Date(cursor.y, cursor.m + 1, 0).getDate();
    const arr: (string | null)[] = [];
    for (let i = 0; i < startPad; i++) arr.push(null);
    for (let d = 1; d <= daysInMonth; d++) arr.push(toKey(new Date(cursor.y, cursor.m, d)));
    return arr;
  }, [cursor]);

  const prevMonth = () => setCursor((c) => (c.m === 0 ? { y: c.y - 1, m: 11 } : { y: c.y, m: c.m - 1 }));
  const nextMonth = () => setCursor((c) => (c.m === 11 ? { y: c.y + 1, m: 0 } : { y: c.y, m: c.m + 1 }));

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.bg} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <View style={styles.navRow}>
            <Pressable onPress={prevMonth} hitSlop={10} style={styles.navBtn}>
              <Ionicons name="chevron-back" size={20} color={colors.text} />
            </Pressable>
            <Text style={styles.navTitle}>
              {cursor.y} 年 {cursor.m + 1} 月
            </Text>
            <Pressable onPress={nextMonth} hitSlop={10} style={styles.navBtn}>
              <Ionicons name="chevron-forward" size={20} color={colors.text} />
            </Pressable>
          </View>

          <View style={styles.weekRow}>
            {WEEK.map((w) => (
              <Text key={w} style={styles.weekText}>
                {w}
              </Text>
            ))}
          </View>

          <View style={styles.grid}>
            {cells.map((key, i) => {
              if (!key) return <View key={`e${i}`} style={styles.cell} />;
              const selected = key === value;
              const isToday = key === today;
              const future = key > today;
              return (
                <Pressable
                  key={key}
                  disabled={future}
                  onPress={() => onPick(key)}
                  style={[styles.cell]}
                >
                  <View style={[styles.dayDot, selected && styles.dayDotSel]}>
                    <Text
                      style={[
                        styles.dayText,
                        future && styles.dayDisabled,
                        isToday && !selected && styles.dayToday,
                        selected && styles.daySelText,
                      ]}
                    >
                      {parseKey(key).getDate()}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>

          <Pressable style={styles.todayBtn} onPress={() => onPick(today)}>
            <Text style={styles.todayBtnText}>回到今天</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    field: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      backgroundColor: colors.primarySoft,
      borderRadius: radius.md,
      paddingHorizontal: spacing.lg,
      height: 46,
    },
    fieldText: { flex: 1, fontSize: font.md, fontWeight: '700', color: colors.text },

    bg: { flex: 1, backgroundColor: 'rgba(15,23,42,0.45)', alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
    sheet: { width: '100%', maxWidth: 360, backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.lg, ...shadow.card },
    navRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
    navBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
    navTitle: { fontSize: font.lg, fontWeight: '800', color: colors.text },
    weekRow: { flexDirection: 'row' },
    weekText: { flex: 1, textAlign: 'center', fontSize: font.xs, color: colors.textTertiary, marginBottom: spacing.sm },
    grid: { flexDirection: 'row', flexWrap: 'wrap' },
    cell: { width: `${100 / 7}%`, aspectRatio: 1, alignItems: 'center', justifyContent: 'center' },
    dayDot: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
    dayDotSel: { backgroundColor: colors.primary },
    dayText: { fontSize: font.md, color: colors.text },
    dayDisabled: { color: colors.textTertiary, opacity: 0.4 },
    dayToday: { color: colors.primary, fontWeight: '800' },
    daySelText: { color: '#fff', fontWeight: '800' },
    todayBtn: { marginTop: spacing.md, alignItems: 'center', paddingVertical: spacing.sm },
    todayBtnText: { fontSize: font.sm, color: colors.primaryDark, fontWeight: '700' },
  });
