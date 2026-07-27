import React, { useState } from 'react';
import { GestureResponderEvent, View } from 'react-native';
import Svg, {
  Circle,
  Defs,
  G,
  Line,
  LinearGradient,
  Path,
  Rect,
  Stop,
  Text as SvgText,
} from 'react-native-svg';
import { useColors } from '../theme';

/* ============================================================
 * 圆环进度（每日热量预算 / 饮水）
 * ========================================================== */
export function RingProgress({
  size = 180,
  stroke = 16,
  progress,
  color,
  trackColor,
  children,
}: {
  size?: number;
  stroke?: number;
  progress: number;
  color?: string;
  trackColor?: string;
  children?: React.ReactNode;
}) {
  const c = useColors();
  const ringColor = color ?? c.primary;
  const track = trackColor ?? c.divider;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(1, progress));
  const offset = circ * (1 - clamped);
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Defs>
          <LinearGradient id="ring" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={ringColor} />
            <Stop offset="1" stopColor={c.primaryDark} />
          </LinearGradient>
        </Defs>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={track} strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="url(#ring)"
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${circ} ${circ}`}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      {children}
    </View>
  );
}

/* ============================================================
 * 折线趋势图（平滑曲线 + 渐变填充 + 触摸数值气泡）
 * ========================================================== */
interface Point {
  label: string;
  value: number | null;
}

// 用 Catmull-Rom 生成平滑贝塞尔路径
function smoothPath(pts: { x: number; y: number }[]): string {
  if (pts.length < 2) return '';
  let d = `M${pts[0].x},${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] || p2;
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C${cp1x.toFixed(2)},${cp1y.toFixed(2)} ${cp2x.toFixed(2)},${cp2y.toFixed(2)} ${p2.x.toFixed(2)},${p2.y.toFixed(2)}`;
  }
  return d;
}

export function LineChart({
  data,
  width,
  height = 210,
  color,
  unit = '',
}: {
  data: Point[];
  width: number;
  height?: number;
  color?: string;
  unit?: string;
}) {
  const c = useColors();
  const line = color ?? c.weight;
  const [active, setActive] = useState<number | null>(null);

  const padL = 38;
  const padR = 14;
  const padT = 18;
  const padB = 26;
  const innerW = width - padL - padR;
  const innerH = height - padT - padB;

  const valid = data.map((d, i) => ({ ...d, i })).filter((d) => d.value != null) as { label: string; value: number; i: number }[];
  if (valid.length === 0) return <View style={{ height }} />;

  const values = valid.map((d) => d.value);
  let min = Math.min(...values);
  let max = Math.max(...values);
  if (min === max) {
    min -= 1;
    max += 1;
  }
  const range = max - min;
  min -= range * 0.18;
  max += range * 0.18;

  const xFor = (i: number) => padL + (data.length <= 1 ? innerW / 2 : (innerW * i) / (data.length - 1));
  const yFor = (v: number) => padT + innerH - ((v - min) / (max - min)) * innerH;

  // 连续段（处理 null 间隙）
  const segments: { x: number; y: number }[][] = [];
  let cur: { x: number; y: number }[] = [];
  data.forEach((d, i) => {
    if (d.value == null) {
      if (cur.length) segments.push(cur);
      cur = [];
    } else {
      cur.push({ x: xFor(i), y: yFor(d.value) });
    }
  });
  if (cur.length) segments.push(cur);

  const ticks = [max, (max + min) / 2, min];

  // 触摸 → 最近的有效点
  const handleTouch = (e: GestureResponderEvent) => {
    const x = e.nativeEvent.locationX;
    let nearest = valid[0];
    let best = Infinity;
    for (const p of valid) {
      const dx = Math.abs(xFor(p.i) - x);
      if (dx < best) {
        best = dx;
        nearest = p;
      }
    }
    setActive(nearest.i);
  };

  const activePoint = active != null ? data[active] : null;
  const ax = active != null ? xFor(active) : 0;
  const ay = activePoint && activePoint.value != null ? yFor(activePoint.value) : 0;

  // 气泡尺寸与位置（边界夹紧）
  const tipW = 76;
  const tipH = 38;
  const tipX = Math.max(padL, Math.min(width - padR - tipW, ax - tipW / 2));
  const tipY = Math.max(2, ay - tipH - 10);

  return (
    <View
      onStartShouldSetResponder={() => true}
      onMoveShouldSetResponder={() => true}
      onResponderGrant={handleTouch}
      onResponderMove={handleTouch}
      onResponderRelease={() => setActive(null)}
      onResponderTerminate={() => setActive(null)}
    >
      <Svg width={width} height={height}>
        <Defs>
          <LinearGradient id="lineArea" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={line} stopOpacity={0.25} />
            <Stop offset="1" stopColor={line} stopOpacity={0.02} />
          </LinearGradient>
        </Defs>

        {/* 网格与 Y 轴刻度 */}
        {ticks.map((t, i) => {
          const y = yFor(t);
          return (
            <G key={i}>
              <Line x1={padL} y1={y} x2={width - padR} y2={y} stroke={c.divider} strokeWidth={1} />
              <SvgText x={4} y={y + 4} fontSize={10} fill={c.textTertiary}>
                {t.toFixed(t >= 100 ? 0 : 1)}
              </SvgText>
            </G>
          );
        })}

        {/* 渐变面积 + 平滑曲线 */}
        {segments.map((seg, i) => {
          if (seg.length < 2) return null;
          const linePath = smoothPath(seg);
          const areaPath = `${linePath} L${seg[seg.length - 1].x},${padT + innerH} L${seg[0].x},${padT + innerH} Z`;
          return (
            <G key={i}>
              <Path d={areaPath} fill="url(#lineArea)" />
              <Path d={linePath} stroke={line} strokeWidth={3} fill="none" strokeLinejoin="round" strokeLinecap="round" />
            </G>
          );
        })}

        {/* 数据点 */}
        {valid.map((d) => (
          <Circle key={d.i} cx={xFor(d.i)} cy={yFor(d.value)} r={3.5} fill={c.card} stroke={line} strokeWidth={2} />
        ))}

        {/* X 轴标签 */}
        {data.map((d, i) =>
          i % Math.ceil(data.length / 6 || 1) === 0 || i === data.length - 1 ? (
            <SvgText key={`x${i}`} x={xFor(i)} y={height - 6} fontSize={10} fill={c.textTertiary} textAnchor="middle">
              {d.label}
            </SvgText>
          ) : null,
        )}

        {/* 触摸辅助线 + 气泡 */}
        {activePoint && activePoint.value != null ? (
          <G>
            <Line x1={ax} y1={padT} x2={ax} y2={padT + innerH} stroke={line} strokeWidth={1} strokeDasharray="3 3" opacity={0.6} />
            <Circle cx={ax} cy={ay} r={6} fill={line} stroke={c.card} strokeWidth={2} />
            <Rect x={tipX} y={tipY} width={tipW} height={tipH} rx={8} fill="#0F172A" opacity={0.92} />
            <SvgText x={tipX + tipW / 2} y={tipY + 16} fontSize={12} fontWeight="bold" fill="#fff" textAnchor="middle">
              {activePoint.value}
              {unit}
            </SvgText>
            <SvgText x={tipX + tipW / 2} y={tipY + 30} fontSize={9} fill="rgba(255,255,255,0.75)" textAnchor="middle">
              {activePoint.label}
            </SvgText>
          </G>
        ) : null}
      </Svg>
    </View>
  );
}

/* ============================================================
 * 双线对比图（摄入 vs 支出，触摸查看同日详情）
 * ========================================================== */
interface ComparisonPoint {
  label: string;
  primary: number;
  secondary: number;
}

export function ComparisonLineChart({
  data,
  width,
  height = 220,
  primaryColor,
  secondaryColor,
  primaryLabel,
  secondaryLabel,
  unit = '',
}: {
  data: ComparisonPoint[];
  width: number;
  height?: number;
  primaryColor: string;
  secondaryColor: string;
  primaryLabel: string;
  secondaryLabel: string;
  unit?: string;
}) {
  const c = useColors();
  const [active, setActive] = useState<number | null>(data.length ? data.length - 1 : null);
  const padL = 38;
  const padR = 14;
  const padT = 54;
  const padB = 28;
  const innerW = width - padL - padR;
  const innerH = height - padT - padB;
  const maxValue = Math.max(1, ...data.flatMap((point) => [point.primary, point.secondary]));
  const max = maxValue * 1.14;
  const xFor = (index: number) => padL + (data.length <= 1 ? innerW / 2 : (innerW * index) / (data.length - 1));
  const yFor = (value: number) => padT + innerH - (value / max) * innerH;
  const primaryPoints = data.map((point, index) => ({ x: xFor(index), y: yFor(point.primary) }));
  const secondaryPoints = data.map((point, index) => ({ x: xFor(index), y: yFor(point.secondary) }));
  const ticks = [max, max / 2, 0];

  const handleTouch = (event: GestureResponderEvent) => {
    if (!data.length) return;
    const x = event.nativeEvent.locationX;
    let nearest = 0;
    let distance = Infinity;
    data.forEach((_, index) => {
      const nextDistance = Math.abs(xFor(index) - x);
      if (nextDistance < distance) {
        nearest = index;
        distance = nextDistance;
      }
    });
    setActive(nearest);
  };

  if (!data.length) return <View style={{ height }} />;
  const activePoint = active != null ? data[active] : null;
  const activeX = active != null ? xFor(active) : 0;
  const tipW = 156;
  const tipX = Math.max(padL, Math.min(width - padR - tipW, activeX - tipW / 2));

  return (
    <View
      onStartShouldSetResponder={() => true}
      onMoveShouldSetResponder={() => true}
      onResponderGrant={handleTouch}
      onResponderMove={handleTouch}
    >
      <Svg width={width} height={height}>
        <Defs>
          <LinearGradient id="comparisonArea" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={primaryColor} stopOpacity={0.18} />
            <Stop offset="1" stopColor={primaryColor} stopOpacity={0.01} />
          </LinearGradient>
        </Defs>

        {ticks.map((tick, index) => {
          const y = yFor(tick);
          return (
            <G key={`grid-${index}`}>
              <Line x1={padL} y1={y} x2={width - padR} y2={y} stroke={c.divider} strokeWidth={1} />
              <SvgText x={4} y={y + 4} fontSize={10} fill={c.textTertiary}>
                {Math.round(tick)}
              </SvgText>
            </G>
          );
        })}

        {primaryPoints.length > 1 ? (
          <>
            <Path
              d={`${smoothPath(primaryPoints)} L${primaryPoints[primaryPoints.length - 1].x},${padT + innerH} L${primaryPoints[0].x},${padT + innerH} Z`}
              fill="url(#comparisonArea)"
            />
            <Path d={smoothPath(primaryPoints)} stroke={primaryColor} strokeWidth={3} fill="none" strokeLinecap="round" />
            <Path d={smoothPath(secondaryPoints)} stroke={secondaryColor} strokeWidth={2.5} fill="none" strokeLinecap="round" strokeDasharray="7 5" />
          </>
        ) : null}

        {data.map((point, index) => (
          <G key={`point-${index}`}>
            <Circle cx={xFor(index)} cy={yFor(point.primary)} r={active === index ? 5 : 3} fill={c.card} stroke={primaryColor} strokeWidth={2} />
            <Circle cx={xFor(index)} cy={yFor(point.secondary)} r={active === index ? 5 : 3} fill={c.card} stroke={secondaryColor} strokeWidth={2} />
            {(index % Math.ceil(data.length / 6 || 1) === 0 || index === data.length - 1) ? (
              <SvgText x={xFor(index)} y={height - 7} fontSize={10} fill={active === index ? c.text : c.textTertiary} textAnchor="middle">
                {point.label}
              </SvgText>
            ) : null}
          </G>
        ))}

        {activePoint ? (
          <G>
            <Line x1={activeX} y1={padT} x2={activeX} y2={padT + innerH} stroke={c.textTertiary} strokeWidth={1} strokeDasharray="3 4" />
            <Rect x={tipX} y={2} width={tipW} height={45} rx={10} fill="#0F172A" opacity={0.94} />
            <SvgText x={tipX + 10} y={17} fontSize={9} fill="rgba(255,255,255,0.68)">
              {activePoint.label}
            </SvgText>
            <Circle cx={tipX + 12} cy={32} r={4} fill={primaryColor} />
            <SvgText x={tipX + 20} y={36} fontSize={10} fill="#fff">
              {primaryLabel} {activePoint.primary}{unit}
            </SvgText>
            <Circle cx={tipX + 91} cy={32} r={4} fill={secondaryColor} />
            <SvgText x={tipX + 99} y={36} fontSize={10} fill="#fff">
              {secondaryLabel} {activePoint.secondary}{unit}
            </SvgText>
          </G>
        ) : null}
      </Svg>
    </View>
  );
}

/* ============================================================
 * 柱状图（圆角柱 + 目标线 + 触摸高亮数值）
 * ========================================================== */
interface Bar {
  label: string;
  value: number;
  highlight?: boolean;
}

export function BarChart({
  data,
  width,
  height = 190,
  color,
  goal,
  goalColor,
  unit = '',
}: {
  data: Bar[];
  width: number;
  height?: number;
  color?: string;
  goal?: number;
  goalColor?: string;
  unit?: string;
}) {
  const c = useColors();
  const fillColor = color ?? c.calorie;
  const goalLine = goalColor ?? c.danger;
  const [active, setActive] = useState<number | null>(null);
  const padT = 20;
  const padB = 26;
  const padL = 8;
  const padR = 8;
  const innerW = width - padL - padR;
  const innerH = height - padT - padB;
  const max = Math.max(goal || 0, ...data.map((d) => d.value), 1) * 1.15;
  const slot = innerW / data.length;
  const barW = Math.min(slot * 0.5, 28);
  const yFor = (v: number) => padT + innerH - (v / max) * innerH;

  const handleTouch = (e: GestureResponderEvent) => {
    const x = e.nativeEvent.locationX - padL;
    const idx = Math.floor(x / slot);
    if (idx >= 0 && idx < data.length) setActive(idx);
  };

  return (
    <View
      onStartShouldSetResponder={() => true}
      onMoveShouldSetResponder={() => true}
      onResponderGrant={handleTouch}
      onResponderMove={handleTouch}
      onResponderRelease={() => setActive(null)}
      onResponderTerminate={() => setActive(null)}
    >
      <Svg width={width} height={height}>
        <Defs>
          <LinearGradient id="barFill" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={fillColor} stopOpacity={1} />
            <Stop offset="1" stopColor={fillColor} stopOpacity={0.6} />
          </LinearGradient>
        </Defs>

        {goal ? (
          <Line
            x1={padL}
            y1={yFor(goal)}
            x2={width - padR}
            y2={yFor(goal)}
            stroke={goalLine}
            strokeWidth={1.5}
            strokeDasharray="4 4"
          />
        ) : null}

        {data.map((d, i) => {
          const x = padL + slot * i + slot / 2;
          const h = Math.max(2, (d.value / max) * innerH);
          const y = padT + innerH - h;
          const isActive = active === i || (active == null && d.highlight);
          return (
            <G key={i}>
              <Rect
                x={x - barW / 2}
                y={y}
                width={barW}
                height={h}
                rx={7}
                fill={isActive ? c.primary : 'url(#barFill)'}
              />
              {isActive && d.value > 0 ? (
                <SvgText x={x} y={y - 6} fontSize={11} fontWeight="bold" fill={c.text} textAnchor="middle">
                  {d.value}
                  {unit}
                </SvgText>
              ) : null}
              {(i % Math.ceil(data.length / 7 || 1) === 0 || i === data.length - 1) ? (
                <SvgText x={x} y={height - 8} fontSize={10} fill={isActive ? c.text : c.textTertiary} textAnchor="middle">
                  {d.label}
                </SvgText>
              ) : null}
            </G>
          );
        })}
      </Svg>
    </View>
  );
}
