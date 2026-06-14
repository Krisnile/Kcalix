// 在线食物热量搜索：基于 Open Food Facts 开放数据库
// 免费、无需 API Key、含中文数据；不在本地存储任何食物数据，避免增大 App 体积。

export interface RemoteFood {
  id: string;
  name: string;
  original?: string; // 翻译前的原文（如英文名）
  brand?: string;
  calories: number; // 每 100g kcal
  protein?: number;
  fat?: number;
  carb?: number;
  emoji: string;
  source: 'online';
}

function round1(v: any): number | undefined {
  const n = Number(v);
  if (!isFinite(n)) return undefined;
  return Math.round(n * 10) / 10;
}

const CJK = /[\u4e00-\u9fff]/;
const hasCJK = (s: string) => CJK.test(s);

// 翻译结果缓存，避免重复请求
const transCache = new Map<string, string>();

// 批量把非中文名称翻译成中文（使用免费 gtx 接口，失败时回退原文）
async function translateNames(names: string[], signal?: AbortSignal): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  const uniq = Array.from(new Set(names.filter((n) => n && !hasCJK(n))));
  for (const n of uniq) if (transCache.has(n)) map.set(n, transCache.get(n)!);
  const need = uniq.filter((n) => !transCache.has(n));
  if (need.length === 0) return map;

  try {
    const q = need.join('\n');
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=zh-CN&dt=t&q=${encodeURIComponent(q)}`;
    const res = await fetch(url, { signal });
    if (res.ok) {
      const data = await res.json();
      const segs: any[] = Array.isArray(data?.[0]) ? data[0] : [];
      const joined = segs.map((s) => (Array.isArray(s) ? s[0] : '')).join('');
      const parts = joined.split('\n');
      need.forEach((orig, i) => {
        const t = (parts[i] || '').trim() || orig;
        transCache.set(orig, t);
        map.set(orig, t);
      });
    }
  } catch {
    // 翻译失败：保持原文
  }
  return map;
}

const ENDPOINT = 'https://world.openfoodfacts.org/cgi/search.pl';

// 搜索在线食物。失败时抛出错误，由调用方处理。
export async function searchOnlineFoods(query: string, signal?: AbortSignal): Promise<RemoteFood[]> {
  const params = new URLSearchParams({
    search_terms: query,
    search_simple: '1',
    action: 'process',
    json: '1',
    page_size: '40',
    lc: 'zh',
    fields: 'code,product_name,product_name_zh,generic_name_zh,brands,nutriments',
  });
  const res = await fetch(`${ENDPOINT}?${params.toString()}`, {
    headers: { 'User-Agent': 'Kcalix/1.0 (calorie tracker)', Accept: 'application/json' },
    signal,
  });
  if (!res.ok) throw new Error(`请求失败 (${res.status})`);
  const data = await res.json();
  const products: any[] = Array.isArray(data?.products) ? data.products : [];

  const out: RemoteFood[] = [];
  const seen = new Set<string>();
  for (const p of products) {
    const name: string = (p.product_name_zh || p.generic_name_zh || p.product_name || '').trim();
    if (!name) continue;

    const n = p.nutriments || {};
    let kcal: number | undefined = Number(n['energy-kcal_100g']);
    if (!isFinite(kcal) || kcal <= 0) {
      const kj = Number(n['energy_100g']); // 部分数据只有 kJ
      if (isFinite(kj) && kj > 0) kcal = kj / 4.184;
    }
    if (!kcal || !isFinite(kcal) || kcal <= 0 || kcal > 1000) continue;

    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);

    out.push({
      id: `off_${p.code || out.length}`,
      name,
      brand: p.brands ? String(p.brands).split(',')[0].trim() : undefined,
      calories: Math.round(kcal),
      protein: round1(n.proteins_100g),
      fat: round1(n.fat_100g),
      carb: round1(n.carbohydrates_100g),
      emoji: '🍽️',
      source: 'online',
    });
    if (out.length >= 30) break;
  }

  // 把英文/外文名称翻译成中文展示，原文保留为副标题
  try {
    const translations = await translateNames(
      out.map((o) => o.name),
      signal,
    );
    for (const o of out) {
      const zh = translations.get(o.name);
      if (zh && zh !== o.name) {
        o.original = o.name;
        o.name = zh;
      }
    }
  } catch {
    // 忽略翻译错误
  }

  return out;
}
