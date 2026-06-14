// 日期工具：统一使用本地时区的 YYYY-MM-DD

export function toKey(d: Date): string {
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function todayKey(): string {
  return toKey(new Date());
}

export function parseKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(key: string, n: number): string {
  const d = parseKey(key);
  d.setDate(d.getDate() + n);
  return toKey(d);
}

export function isSameKey(a: string, b: string): boolean {
  return a === b;
}

const weekNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

export function weekday(key: string): string {
  return weekNames[parseKey(key).getDay()];
}

export function shortLabel(key: string): string {
  const d = parseKey(key);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export function prettyDate(key: string): string {
  const d = parseKey(key);
  const t = todayKey();
  if (key === t) return '今天';
  if (key === addDays(t, -1)) return '昨天';
  if (key === addDays(t, 1)) return '明天';
  return `${d.getMonth() + 1}月${d.getDate()}日 ${weekday(key)}`;
}

// 从 ISO 时间戳取 HH:MM
export function timeOf(iso: string): string {
  const d = new Date(iso);
  const h = `${d.getHours()}`.padStart(2, '0');
  const m = `${d.getMinutes()}`.padStart(2, '0');
  return `${h}:${m}`;
}

// 返回最近 n 天的 key（从旧到新）
export function lastNDays(n: number, end: string = todayKey()): string[] {
  const arr: string[] = [];
  for (let i = n - 1; i >= 0; i--) arr.push(addDays(end, -i));
  return arr;
}

// 计算两个日期之间包含的天数（含首尾）
export function daysBetween(from: string, to: string): number {
  const ms = parseKey(to).getTime() - parseKey(from).getTime();
  return Math.max(1, Math.round(ms / 86400000) + 1);
}
