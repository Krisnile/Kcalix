// 食物热量数据库（每 100 克可食部，单位 kcal）
// 数据为常见参考值，用于估算

export interface FoodItem {
  id: string;
  name: string;
  category: FoodCategory;
  calories: number; // 每 100g
  protein?: number; // g / 100g
  fat?: number;
  carb?: number;
  emoji: string;
}

export type FoodCategory = '主食' | '肉蛋' | '水产' | '蔬菜' | '水果' | '豆奶' | '饮品' | '零食' | '快餐' | '汤羹';

export const categories: FoodCategory[] = [
  '主食', '肉蛋', '水产', '蔬菜', '水果', '豆奶', '饮品', '零食', '快餐', '汤羹',
];

export const foods: FoodItem[] = [
  // 主食
  { id: 'f1', name: '米饭（白）', category: '主食', calories: 116, protein: 2.6, fat: 0.3, carb: 25.9, emoji: '🍚' },
  { id: 'f2', name: '馒头', category: '主食', calories: 223, protein: 7, fat: 1.1, carb: 47, emoji: '🍞' },
  { id: 'f3', name: '面条（煮）', category: '主食', calories: 110, protein: 4, fat: 0.5, carb: 24, emoji: '🍜' },
  { id: 'f4', name: '全麦面包', category: '主食', calories: 246, protein: 9, fat: 3.4, carb: 45, emoji: '🍞' },
  { id: 'f5', name: '燕麦片', category: '主食', calories: 367, protein: 15, fat: 6.7, carb: 61, emoji: '🌾' },
  { id: 'f6', name: '红薯', category: '主食', calories: 99, protein: 1.1, fat: 0.2, carb: 23, emoji: '🍠' },
  { id: 'f7', name: '玉米', category: '主食', calories: 112, protein: 4, fat: 1.2, carb: 22.8, emoji: '🌽' },
  { id: 'f8', name: '土豆', category: '主食', calories: 81, protein: 2.6, fat: 0.2, carb: 17.8, emoji: '🥔' },
  { id: 'f9', name: '小米粥', category: '主食', calories: 46, protein: 1.4, fat: 0.7, carb: 8.4, emoji: '🥣' },
  { id: 'f10', name: '糙米饭', category: '主食', calories: 111, protein: 2.6, fat: 0.9, carb: 23, emoji: '🍚' },
  { id: 'f11', name: '意大利面', category: '主食', calories: 158, protein: 5.8, fat: 0.9, carb: 31, emoji: '🍝' },
  { id: 'f12', name: '包子（肉）', category: '主食', calories: 227, protein: 8, fat: 9, carb: 28, emoji: '🥟' },

  // 肉蛋
  { id: 'm1', name: '鸡胸肉', category: '肉蛋', calories: 133, protein: 24, fat: 5, carb: 0, emoji: '🍗' },
  { id: 'm2', name: '鸡腿（去皮）', category: '肉蛋', calories: 181, protein: 19, fat: 12, carb: 0, emoji: '🍗' },
  { id: 'm3', name: '猪瘦肉', category: '肉蛋', calories: 143, protein: 20.3, fat: 6.2, carb: 1.5, emoji: '🥩' },
  { id: 'm4', name: '五花肉', category: '肉蛋', calories: 395, protein: 13, fat: 37, carb: 0, emoji: '🥓' },
  { id: 'm5', name: '牛肉（瘦）', category: '肉蛋', calories: 125, protein: 20, fat: 4.2, carb: 1.2, emoji: '🥩' },
  { id: 'm6', name: '羊肉（瘦）', category: '肉蛋', calories: 118, protein: 20, fat: 3.9, carb: 0.2, emoji: '🥩' },
  { id: 'm7', name: '鸡蛋', category: '肉蛋', calories: 144, protein: 13.3, fat: 8.8, carb: 2.8, emoji: '🥚' },
  { id: 'm8', name: '鸭肉', category: '肉蛋', calories: 240, protein: 15.5, fat: 19.7, carb: 0.2, emoji: '🦆' },
  { id: 'm9', name: '培根', category: '肉蛋', calories: 181, protein: 22, fat: 9, carb: 0.5, emoji: '🥓' },
  { id: 'm10', name: '火腿肠', category: '肉蛋', calories: 212, protein: 14, fat: 10, carb: 16, emoji: '🌭' },

  // 水产
  { id: 'w1', name: '草鱼', category: '水产', calories: 113, protein: 16.6, fat: 5.2, carb: 0, emoji: '🐟' },
  { id: 'w2', name: '三文鱼', category: '水产', calories: 139, protein: 17.2, fat: 7.8, carb: 0, emoji: '🐟' },
  { id: 'w3', name: '虾', category: '水产', calories: 93, protein: 18.6, fat: 0.8, carb: 2.8, emoji: '🦐' },
  { id: 'w4', name: '带鱼', category: '水产', calories: 127, protein: 17.7, fat: 4.9, carb: 3.1, emoji: '🐟' },
  { id: 'w5', name: '螃蟹', category: '水产', calories: 103, protein: 17.5, fat: 2.6, carb: 2.3, emoji: '🦀' },
  { id: 'w6', name: '金枪鱼罐头', category: '水产', calories: 116, protein: 26, fat: 1, carb: 0, emoji: '🐟' },

  // 蔬菜
  { id: 'v1', name: '西兰花', category: '蔬菜', calories: 36, protein: 4.1, fat: 0.6, carb: 4.3, emoji: '🥦' },
  { id: 'v2', name: '白菜', category: '蔬菜', calories: 17, protein: 1.5, fat: 0.1, carb: 3.2, emoji: '🥬' },
  { id: 'v3', name: '菠菜', category: '蔬菜', calories: 28, protein: 2.6, fat: 0.3, carb: 4.5, emoji: '🥬' },
  { id: 'v4', name: '番茄', category: '蔬菜', calories: 20, protein: 0.9, fat: 0.2, carb: 4, emoji: '🍅' },
  { id: 'v5', name: '黄瓜', category: '蔬菜', calories: 16, protein: 0.8, fat: 0.2, carb: 2.9, emoji: '🥒' },
  { id: 'v6', name: '胡萝卜', category: '蔬菜', calories: 39, protein: 1, fat: 0.2, carb: 8.8, emoji: '🥕' },
  { id: 'v7', name: '茄子', category: '蔬菜', calories: 23, protein: 1.1, fat: 0.2, carb: 4.9, emoji: '🍆' },
  { id: 'v8', name: '生菜', category: '蔬菜', calories: 16, protein: 1.3, fat: 0.3, carb: 2, emoji: '🥬' },
  { id: 'v9', name: '蘑菇', category: '蔬菜', calories: 24, protein: 2.7, fat: 0.1, carb: 4.1, emoji: '🍄' },
  { id: 'v10', name: '青椒', category: '蔬菜', calories: 22, protein: 1, fat: 0.2, carb: 5.4, emoji: '🫑' },

  // 水果
  { id: 'fr1', name: '苹果', category: '水果', calories: 54, protein: 0.2, fat: 0.2, carb: 13.5, emoji: '🍎' },
  { id: 'fr2', name: '香蕉', category: '水果', calories: 93, protein: 1.4, fat: 0.2, carb: 22, emoji: '🍌' },
  { id: 'fr3', name: '橙子', category: '水果', calories: 48, protein: 0.8, fat: 0.2, carb: 11.1, emoji: '🍊' },
  { id: 'fr4', name: '葡萄', category: '水果', calories: 44, protein: 0.5, fat: 0.2, carb: 10.3, emoji: '🍇' },
  { id: 'fr5', name: '西瓜', category: '水果', calories: 26, protein: 0.6, fat: 0.1, carb: 6.8, emoji: '🍉' },
  { id: 'fr6', name: '草莓', category: '水果', calories: 32, protein: 1, fat: 0.2, carb: 7.1, emoji: '🍓' },
  { id: 'fr7', name: '芒果', category: '水果', calories: 60, protein: 0.6, fat: 0.2, carb: 15, emoji: '🥭' },
  { id: 'fr8', name: '蓝莓', category: '水果', calories: 57, protein: 0.7, fat: 0.3, carb: 14, emoji: '🫐' },
  { id: 'fr9', name: '牛油果', category: '水果', calories: 160, protein: 2, fat: 15, carb: 9, emoji: '🥑' },
  { id: 'fr10', name: '猕猴桃', category: '水果', calories: 61, protein: 0.8, fat: 0.6, carb: 14.5, emoji: '🥝' },

  // 豆奶
  { id: 'd1', name: '牛奶（全脂）', category: '豆奶', calories: 65, protein: 3.3, fat: 3.6, carb: 4.9, emoji: '🥛' },
  { id: 'd2', name: '脱脂牛奶', category: '豆奶', calories: 34, protein: 3.4, fat: 0.1, carb: 5, emoji: '🥛' },
  { id: 'd3', name: '豆浆', category: '豆奶', calories: 31, protein: 3, fat: 1.6, carb: 1.2, emoji: '🥛' },
  { id: 'd4', name: '酸奶（原味）', category: '豆奶', calories: 72, protein: 2.5, fat: 2.7, carb: 9.3, emoji: '🥛' },
  { id: 'd5', name: '豆腐', category: '豆奶', calories: 81, protein: 8.1, fat: 3.7, carb: 3.8, emoji: '🧈' },
  { id: 'd6', name: '希腊酸奶', category: '豆奶', calories: 97, protein: 9, fat: 5, carb: 3.6, emoji: '🥛' },
  { id: 'd7', name: '奶酪', category: '豆奶', calories: 328, protein: 25, fat: 24, carb: 3.5, emoji: '🧀' },

  // 饮品
  { id: 'b1', name: '可乐', category: '饮品', calories: 43, carb: 10.8, emoji: '🥤' },
  { id: 'b2', name: '橙汁', category: '饮品', calories: 45, carb: 10.4, emoji: '🧃' },
  { id: 'b3', name: '美式咖啡（无糖）', category: '饮品', calories: 2, emoji: '☕' },
  { id: 'b4', name: '拿铁', category: '饮品', calories: 56, protein: 2.9, fat: 3, carb: 4.4, emoji: '☕' },
  { id: 'b5', name: '珍珠奶茶', category: '饮品', calories: 110, fat: 2, carb: 22, emoji: '🧋' },
  { id: 'b6', name: '啤酒', category: '饮品', calories: 43, carb: 3.6, emoji: '🍺' },
  { id: 'b7', name: '绿茶（无糖）', category: '饮品', calories: 1, emoji: '🍵' },

  // 零食
  { id: 's1', name: '薯片', category: '零食', calories: 547, protein: 7, fat: 37, carb: 49, emoji: '🍟' },
  { id: 's2', name: '巧克力', category: '零食', calories: 546, protein: 4.9, fat: 31, carb: 60, emoji: '🍫' },
  { id: 's3', name: '坚果混合', category: '零食', calories: 607, protein: 20, fat: 54, carb: 20, emoji: '🥜' },
  { id: 's4', name: '饼干', category: '零食', calories: 433, protein: 9, fat: 13, carb: 71, emoji: '🍪' },
  { id: 's5', name: '冰淇淋', category: '零食', calories: 207, protein: 3.5, fat: 11, carb: 24, emoji: '🍦' },
  { id: 's6', name: '蛋糕', category: '零食', calories: 347, protein: 5, fat: 15, carb: 48, emoji: '🍰' },
  { id: 's7', name: '爆米花', category: '零食', calories: 387, protein: 8, fat: 4.5, carb: 78, emoji: '🍿' },

  // 快餐
  { id: 'q1', name: '汉堡', category: '快餐', calories: 295, protein: 17, fat: 14, carb: 24, emoji: '🍔' },
  { id: 'q2', name: '炸鸡', category: '快餐', calories: 279, protein: 22, fat: 18, carb: 8, emoji: '🍗' },
  { id: 'q3', name: '薯条', category: '快餐', calories: 312, protein: 3.4, fat: 15, carb: 41, emoji: '🍟' },
  { id: 'q4', name: '披萨', category: '快餐', calories: 266, protein: 11, fat: 10, carb: 33, emoji: '🍕' },
  { id: 'q5', name: '热狗', category: '快餐', calories: 290, protein: 10, fat: 18, carb: 23, emoji: '🌭' },
  { id: 'q6', name: '煎饼果子', category: '快餐', calories: 230, protein: 8, fat: 9, carb: 30, emoji: '🥞' },
  { id: 'q7', name: '寿司', category: '快餐', calories: 145, protein: 4, fat: 1, carb: 30, emoji: '🍣' },
  { id: 'q8', name: '炒饭', category: '快餐', calories: 163, protein: 4.5, fat: 5, carb: 25, emoji: '🍛' },

  // 汤羹
  { id: 't1', name: '紫菜蛋花汤', category: '汤羹', calories: 30, protein: 2.5, fat: 1.5, carb: 1.6, emoji: '🍲' },
  { id: 't2', name: '番茄蛋汤', category: '汤羹', calories: 35, protein: 2, fat: 2, carb: 2, emoji: '🍲' },
  { id: 't3', name: '排骨汤', category: '汤羹', calories: 78, protein: 5, fat: 6, carb: 0.5, emoji: '🍲' },
  { id: 't4', name: '南瓜汤', category: '汤羹', calories: 45, protein: 1, fat: 1.5, carb: 7, emoji: '🍲' },
];

// 常见运动每分钟消耗（以 60kg 体重估算，kcal/分钟）
export interface ExercisePreset {
  id: string;
  name: string;
  perMin: number;
  emoji: string;
}

export const exercisePresets: ExercisePreset[] = [
  { id: 'e1', name: '步行', perMin: 4, emoji: '🚶' },
  { id: 'e2', name: '快走', perMin: 6, emoji: '🚶‍♂️' },
  { id: 'e3', name: '跑步', perMin: 11, emoji: '🏃' },
  { id: 'e4', name: '骑行', perMin: 8, emoji: '🚴' },
  { id: 'e5', name: '游泳', perMin: 10, emoji: '🏊' },
  { id: 'e6', name: '跳绳', perMin: 12, emoji: '🪢' },
  { id: 'e7', name: '瑜伽', perMin: 3, emoji: '🧘' },
  { id: 'e8', name: '力量训练', perMin: 6, emoji: '🏋️' },
  { id: 'e9', name: '羽毛球', perMin: 7, emoji: '🏸' },
  { id: 'e10', name: '篮球', perMin: 9, emoji: '🏀' },
  { id: 'e11', name: '爬楼梯', perMin: 8, emoji: '🪜' },
  { id: 'e12', name: '广场舞', perMin: 5, emoji: '💃' },
];
