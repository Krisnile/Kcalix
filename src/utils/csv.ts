// CSV 导入/导出：固定列格式，覆盖全部四类记录
// 列：type,date,time,name,meal,calories,amount,unit,duration,weight,water,createdAt

import { AppData, ExerciseLog, FoodLog, MealType, WaterLog, WeightLog } from '../types';

const HEADER = ['type', 'date', 'name', 'meal', 'calories', 'amount', 'unit', 'duration', 'weight', 'water', 'createdAt'];

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

// 解析一行 CSV（支持引号转义）
function parseLine(line: string): string[] {
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
    } else if (ch === ',') {
      out.push(cur);
      cur = '';
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out;
}

let counter = 0;
function genId(): string {
  counter += 1;
  return `${Date.now().toString(36)}${counter.toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// 解析 CSV 文本为记录。无法识别的行会被跳过。
export function parseCsv(text: string): ParsedRecords {
  const result: ParsedRecords = { weightLogs: [], foodLogs: [], exerciseLogs: [], waterLogs: [] };
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
  if (lines.length === 0) return result;

  // 跳过表头（若第一行包含 type）
  let start = 0;
  const first = parseLine(lines[0]).map((c) => c.toLowerCase());
  if (first[0] === 'type') start = 1;

  for (let i = start; i < lines.length; i++) {
    const cols = parseLine(lines[i]);
    const [type, date, name, meal, calories, amount, unit, duration, weight, water, createdAt] = cols;
    if (!DATE_RE.test(date || '')) continue;
    const ts = createdAt || new Date(`${date}T12:00:00`).toISOString();

    if (type === 'weight') {
      const w = Number(weight);
      if (isFinite(w) && w > 0) result.weightLogs.push({ id: genId(), date, weight: Math.round(w * 10) / 10, createdAt: ts });
    } else if (type === 'food') {
      const cal = Number(calories);
      if (name && isFinite(cal)) {
        const m = (['breakfast', 'lunch', 'dinner', 'snack'].includes(meal) ? meal : 'snack') as MealType;
        result.foodLogs.push({
          id: genId(),
          date,
          meal: m,
          name,
          calories: Math.round(cal),
          amount: Number(amount) || 0,
          unit: unit || '份',
          createdAt: ts,
        });
      }
    } else if (type === 'exercise') {
      const cal = Number(calories);
      if (name && isFinite(cal)) {
        result.exerciseLogs.push({ id: genId(), date, name, calories: Math.round(cal), duration: Number(duration) || 0, createdAt: ts });
      }
    } else if (type === 'water') {
      const amt = Number(water);
      if (isFinite(amt) && amt > 0) result.waterLogs.push({ id: genId(), date, amount: Math.round(amt), createdAt: ts });
    }
  }

  // 体重同一天去重（保留后者）
  const byDate = new Map<string, WeightLog>();
  for (const w of result.weightLogs) byDate.set(w.date, w);
  result.weightLogs = Array.from(byDate.values());

  return result;
}
