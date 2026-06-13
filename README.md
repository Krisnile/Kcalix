# 零卡 Kcalix · 卡路里计算器

一款界面简洁、功能完整的卡路里管理 App（基于 **Expo + React Native + TypeScript**），用于记录与分析每日的**饮食摄入、运动消耗、体重变化和饮水量**。所有数据均保存在手机本地，保护隐私。

> 可在安卓手机上运行：开发阶段用 **Expo Go** 扫码即开即用；正式分发可用 **EAS Build** 一键打包出 `.apk` 安装包。

## 功能一览

- **首次启动引导**：用户条款弹窗 + 性别 / 昵称 / 年龄 / 身高 / 当前体重 / 目标体重 / 活动量 / 目标设置，数据持久化，仅首次需要设置。
- **底部四个 Tab**：记录、添加、食谱、我的（中间「添加」为悬浮主按钮）。
- **记录页（三个子页）**
  - 饮食：每日剩余可摄入热量圆环、早/午/晚/加餐分组记录、近 7 天摄入柱状图与目标线。
  - 体重：当前体重、BMI、较初始与距目标差值、周/月/年趋势折线图、目标进度条。
  - 喝水：今日饮水进度圆环与水杯可视化、快速记录、近 7 天饮水柱状图。
- **添加页**：饮食（搜索食物库或手动）、运动（按体重与时长估算消耗）、体重、喝水。
- **食谱页**：80+ 常见食物热量数据库，支持分类筛选、搜索、查看蛋白质/脂肪/碳水明细。
- **我的页**：个人资料展示与编辑、每日热量/饮水目标设置、提醒开关、联系客服、意见反馈、关于、用户协议、隐私政策、第三方开源清单、清除数据。

## 技术栈

- Expo SDK 56 / React Native 0.85 / React 19
- expo-router（文件式路由）
- react-native-svg（自绘折线图 / 柱状图 / 进度圆环，性能稳定）
- @react-native-async-storage/async-storage（本地持久化）
- @expo/vector-icons（Ionicons 图标）

## 目录结构

```
app/                      # 路由（expo-router）
  _layout.tsx             # 根布局：Provider + 导航栈
  index.tsx               # 启动入口（引导判定）
  onboarding.tsx          # 首次引导（条款 + 资料设置向导）
  legal.tsx               # 关于 / 协议 / 隐私 / 开源清单
  (tabs)/
    _layout.tsx           # 自定义底部 Tab 栏
    index.tsx             # 记录（饮食/体重/喝水）
    add.tsx               # 添加
    food.tsx              # 食谱热量库
    profile.tsx           # 我的
src/
  theme.ts                # 设计系统（配色/间距/圆角/阴影）
  types.ts                # 数据类型
  store/AppStore.tsx      # 全局状态 + AsyncStorage 持久化
  data/foods.ts           # 食物热量库 + 运动消耗预设
  utils/                  # 日期、营养计算、聚合选择器
  components/             # UI 组件与图表
```

## 本地运行

> 前提：已安装 Node.js 18+。安卓真机安装 **Expo Go**（应用商店搜索）。

```bash
# 1. 安装依赖
npm install

# 2. 启动开发服务器
npx expo start
```

启动后用安卓手机打开 **Expo Go**，扫描终端里的二维码即可运行（手机与电脑需在同一网络）。

### 安装报错排查：`npm error Invalid Version`

这是 npm 在为 React Native 0.85 的间接依赖（`fb-dotslash` 的平台可选包版本为空）做依赖去重时的已知 bug，**不是项目代码问题**。任选一种方式解决：

```bash
# 方式一：升级 npm（通常已修复该 bug，推荐先试）
npm install -g npm@latest && npm install

# 方式二：禁用去重的嵌套安装
npm install --install-strategy=nested

# 方式三：改用 pnpm 或 yarn
pnpm install        # 或   yarn install
```

> 如果之前安装到一半失败过，先删掉残留再重装：`rm -rf node_modules package-lock.json && npm install`。

## 打包成可下载的安卓 APK

使用 Expo 官方云构建（无需本地安装 Android SDK）：

```bash
# 安装并登录 EAS
npm install -g eas-cli
eas login

# 初始化（首次）
eas build:configure

# 构建可直接安装的 APK
eas build -p android --profile preview
```

构建完成后，EAS 会给出一个 `.apk` 下载链接，在安卓手机浏览器打开即可下载安装。

> 若要本地构建：`npx expo prebuild` 生成原生工程后，用 Android Studio 打开 `android/` 目录构建（需要本机已配置 Android SDK / JDK）。

## 说明

- 所有卡路里、基础代谢（Mifflin-St Jeor 公式）、TDEE 均为估算值，仅供日常参考，不能替代专业医疗或营养建议。
- 数据仅保存在设备本地，卸载或在「我的-清除所有数据」会永久删除。
