// CSV 导入/导出：固定列格式，覆盖全部四类记录
// 列：type,date,name,meal,calories,amount,unit,duration,weight,water,createdAt
// 兼容旧版含 time 列、Excel 改过的日期/分隔符

import { AppData, ExerciseLog, FoodLog, MealType, WaterLog, WeightLog } from '../types';

const HEADER = ['type', 'date', 'name', 'meal', 'calories', 'amount', 'unit', 'duration', 'weight', 'water', 'createdAt'];

const MEAL_MAP: Record<string, MealType> = {
  breakfast: 'breakfast',
  lunch: 'lunch',
  dinner: 'dinner',
  snack: 'snack',
  早餐: 'breakfast',
  午餐: 'lunch',
  晚餐: 'dinner',
  加餐: 'snack',
};

export interface ParsedRecords {
  weightLogs: WeightLog[];
  foodLogs: FoodLog[];
  exerciseLogs: ExerciseLog[];
  waterLogs: WaterLog[];
}

function esc(v: string | number | undefined): string {
  if (v == null) return '';
  const s = String(v);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

// 将全部记录导出为 CSV 文本
export function buildCsv(data: AppData): string {
  const rows: string[] = [HEADER.join(',')];

  for (const w of data.weightLogs) {
    rows.push([esc('weight'), esc(w.date), '', '', '', '', '', '', esc(w.weight), '', esc(w.createdAt)].join(','));
  }
  for (const f of data.foodLogs) {
    rows.push(
      [esc('food'), esc(f.date), esc(f.name), esc(f.meal), esc(f.calories), esc(f.amount), esc(f.unit), '', '', '', esc(f.createdAt)].join(','),
    );
  }
  for (const e of data.exerciseLogs) {
    rows.push([esc('exercise'), esc(e.date), esc(e.name), '', esc(e.calories), '', '', esc(e.duration), '', '', esc(e.createdAt)].join(','));
  }
  for (const w of data.waterLogs) {
    rows.push([esc('water'), esc(w.date), '', '', '', '', '', '', '', esc(w.amount), esc(w.createdAt)].join(','));
  }

  return rows.join('\n');
}

function normalizeHeader(cell: string): string {
  return cell.trim().replace(/^\ufeff/, '').toLowerCase();
}

function detectDelimiter(line: string): string {
  const tabs = (line.match(/\t/g) || []).length;
  const semis = (line.match(/;/g) || []).length;
  const commas = (line.match(/,/g) || []).length;
  if (tabs > 0 && tabs >= semis && tabs >= commas) return '\t';
  if (semis > commas) return ';';
  return ',';
}

// 解析一行 CSV（支持引号转义与自定义分隔符）
function parseLine(line: string, delimiter = ','): string[] {
  const out: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cur += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === delimiter) {
      out.push(cur);
      cur = '';
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out;
}

function buildColumnIndex(headerCells: string[]): Record<string, number> | null {
  const normalized = headerCells.map(normalizeHeader);
  if (normalized[0] !== 'type') return null;
  const idx: Record<string, number> = {};
  normalized.forEach((key, i) => {
    idx[key] = i;
  });
  return idx;
}

function col(cols: string[], idx: Record<string, number>, key: string): string {
  const i = idx[key];
  if (i == null || i >= cols.length) return '';
  return cols[i].trim();
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function parseDateKey(raw: string): string | null {
  const s = raw.trim().replace(/^\ufeff/, '');
  if (!s) return null;
  if (DATE_RE.test(s)) return s;

  const slash = s.match(/^(\d{4})[\/.\-年](\d{1,2})[\/.\-月](\d{1,2})日?$/);
  if (slash) {
    const [, y, m, d] = slash;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  // Excel 可能导出为 M/D/YYYY（少见，尽量兼容）
  const us = s.match(/^(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{4})$/);
  if (us) {
    const [, m, d, y] = us;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  return null;
}

function parseMeal(raw: string): MealType {
  const trimmed = raw.trim();
  if (!trimmed) return 'snack';
  return MEAL_MAP[trimmed] ?? MEAL_MAP[trimmed.toLowerCase()] ?? 'snack';
}

function parseNumber(raw: string): number | null {
  const s = raw.trim().replace(/,/g, '');
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function stripBom(text: string): string {
  return text.replace(/^\ufeff/, '').replace(/\ufeff/g, '');
}

let counter = 0;
function genId(): string {
  counter += 1;
  return `${Date.now().toString(36)}${counter.toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

// 解析 CSV 文本为记录。无法识别的行会被跳过。
export function parseCsv(text: string): ParsedRecords {
  const result: ParsedRecords = { weightLogs: [], foodLogs: [], exerciseLogs: [], waterLogs: [] };
  const cleaned = stripBom(text);
  const lines = cleaned
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  if (lines.length === 0) return result;

  const delimiter = detectDelimiter(lines[0]);
  const headerCells = parseLine(lines[0], delimiter);
  const columnIndex = buildColumnIndex(headerCells);
  const start = columnIndex ? 1 : 0;

  // 无表头时按固定列顺序解析（兼容手工编辑）
  const fixedIndex: Record<string, number> = {
    type: 0,
    date: 1,
    name: 2,
    meal: 3,
    calories: 4,
    amount: 5,
    unit: 6,
    duration: 7,
    weight: 8,
    water: 9,
    createdat: 10,
  };
  const idx = columnIndex ?? fixedIndex;
  const get = (cols: string[], key: string) => col(cols, idx, key);

  for (let i = start; i < lines.length; i++) {
    const cols = parseLine(lines[i], delimiter);
    const type = get(cols, 'type').toLowerCase();
    const date = parseDateKey(get(cols, 'date'));
    if (!type || !date) continue;

    const createdAtRaw = get(cols, 'createdat') || get(cols, 'createdAt');
    const ts = createdAtRaw || new Date(`${date}T12:00:00`).toISOString();

    if (type === 'weight') {
      const w = parseNumber(get(cols, 'weight'));
      if (w != null && w > 0) {
        result.weightLogs.push({ id: genId(), date, weight: Math.round(w * 10) / 10, createdAt: ts });
      }
    } else if (type === 'food') {
      const name = get(cols, 'name');
      const cal = parseNumber(get(cols, 'calories'));
      if (name && cal != null) {
        result.foodLogs.push({
          id: genId(),
          date,
          meal: parseMeal(get(cols, 'meal')),
          name,
          calories: Math.round(cal),
          amount: parseNumber(get(cols, 'amount')) ?? 0,
          unit: get(cols, 'unit') || '份',
          createdAt: ts,
        });
      }
    } else if (type === 'exercise') {
      const name = get(cols, 'name');
      const cal = parseNumber(get(cols, 'calories'));
      if (name && cal != null) {
        result.exerciseLogs.push({
          id: genId(),
          date,
          name,
          calories: Math.round(cal),
          duration: parseNumber(get(cols, 'duration')) ?? 0,
          createdAt: ts,
        });
      }
    } else if (type === 'water') {
      const amt = parseNumber(get(cols, 'water'));
      if (amt != null && amt > 0) {
        result.waterLogs.push({ id: genId(), date, amount: Math.round(amt), createdAt: ts });
      }
    }
  }

  // 体重同一天去重（保留后者）
  const byDate = new Map<string, WeightLog>();
  for (const w of result.weightLogs) byDate.set(w.date, w);
  result.weightLogs = Array.from(byDate.values());

  return result;
}
