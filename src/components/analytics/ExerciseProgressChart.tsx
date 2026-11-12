import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, {
  Circle,
  Defs,
  LinearGradient,
  Line,
  Path,
  Stop,
  Text as SvgText,
} from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useLanguage } from '@/context/LanguageProvider';
import {
  analyticsService,
} from '@/services/AnalyticsService';
import { ExerciseProgressPoint } from '@/repositories/AnalyticsRepository';

export type ProgressMetric = '1rm' | 'volume' | 'max_weight';

export interface ExerciseProgressChartProps {
  readonly slug: string;
  readonly exerciseTitle?: string;
  readonly onDataLoaded?: (pointsCount: number) => void;
}

const CHART_HEIGHT = 180;
const PADDING_TOP = 25;
const PADDING_BOTTOM = 30;
const PADDING_LEFT = 42;
const PADDING_RIGHT = 24;

export const ExerciseProgressChart: React.FC<ExerciseProgressChartProps> = ({
  slug,
  exerciseTitle,
  onDataLoaded,
}) => {
  const { i18n } = useLanguage();
  const screenWidth = Dimensions.get('window').width;
  const chartWidth = Math.max(280, screenWidth - 64);

  const [loading, setLoading] = useState<boolean>(true);
  const [history, setHistory] = useState<ExerciseProgressPoint[]>([]);
  const [selectedMetric, setSelectedMetric] = useState<ProgressMetric>('1rm');
  const [selectedPointIndex, setSelectedPointIndex] = useState<number | null>(null);
  const [show1RMExplanation, setShow1RMExplanation] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setSelectedPointIndex(null);

    analyticsService
      .getProgress(slug)
      .then((res) => {
        if (!isMounted) return;
        const valid = res.history || [];
        setHistory(valid);
        if (valid.length > 0) {
          setSelectedPointIndex(valid.length - 1);
        }
        if (onDataLoaded) {
          onDataLoaded(valid.length);
        }
      })
      .catch((err) => {
        console.warn('[ExerciseProgressChart] Fetch error:', err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [slug]);

  const { points, minValue, maxValue, unit, metricLabel } = useMemo(() => {
    let unit = 'kg';
    let metricLabel = i18n.t('analytics.chart.metric1RM');

    const mapped = history.map((pt, idx) => {
      let val = 0;
      if (selectedMetric === '1rm') {
        val = pt.estimated_1rm_kg || 0;
        metricLabel = i18n.t('analytics.chart.metric1RM');
      } else if (selectedMetric === 'volume') {
        val = pt.total_volume_kg || 0;
        metricLabel = i18n.t('analytics.chart.metricVolume');
      } else {
        val = pt.max_weight_kg || 0;
        metricLabel = i18n.t('analytics.chart.metricMaxWeight');
      }
      return {
        ...pt,
        val,
        index: idx,
      };
    });

    const values = mapped.map((m) => (typeof m.val === 'number' && !isNaN(m.val) ? m.val : 0));
    const minVal = values.length > 0 ? Math.min(...values) : 0;
    const maxVal = values.length > 0 ? Math.max(...values) : 100;

    // Diagram alsó és felső margójának beállítása
    const safeMin = isFinite(minVal) ? minVal : 0;
    const safeMax = isFinite(maxVal) ? maxVal : 100;
    const range = Math.max(0, safeMax - safeMin);
    const effectiveMin = Math.max(0, Math.floor(safeMin - (range > 0 ? range * 0.15 : safeMin * 0.1)));
    const effectiveMax = Math.max(effectiveMin + 1, Math.ceil(safeMax + (range > 0 ? range * 0.18 : 20)));

    return {
      points: mapped,
      minValue: effectiveMin,
      maxValue: effectiveMax,
      unit,
      metricLabel,
    };
  }, [history, selectedMetric, i18n]);

  const { pathData, areaData, coordinates } = useMemo(() => {
    if (points.length === 0) {
      return { pathData: '', areaData: '', coordinates: [] };
    }

    const usableWidth = chartWidth - PADDING_LEFT - PADDING_RIGHT;
    const usableHeight = CHART_HEIGHT - PADDING_TOP - PADDING_BOTTOM;
    const valRange = Math.max(1, maxValue - minValue);

    const coords = points.map((p, idx) => {
      const rawX =
        points.length === 1
          ? PADDING_LEFT + usableWidth / 2
          : PADDING_LEFT + (idx / Math.max(1, points.length - 1)) * usableWidth;

      const normY = isFinite(p.val) ? Math.max(0, Math.min(1, (p.val - minValue) / valRange)) : 0;
      const rawY = PADDING_TOP + usableHeight - normY * usableHeight;

      const x = isFinite(rawX) ? rawX : PADDING_LEFT;
      const y = isFinite(rawY) ? rawY : PADDING_TOP;
      return { x, y, point: p };
    });

    if (coords.length === 1) {
      const c = coords[0];
      return {
        pathData: `M ${c.x - 30} ${c.y} L ${c.x + 30} ${c.y}`,
        areaData: `M ${c.x - 30} ${c.y} L ${c.x + 30} ${c.y} L ${c.x + 30} ${CHART_HEIGHT - PADDING_BOTTOM} L ${c.x - 30} ${CHART_HEIGHT - PADDING_BOTTOM} Z`,
        coordinates: coords,
      };
    }

    // Bézier görbe számítása a pontok összekötéséhez
    let path = `M ${coords[0].x} ${coords[0].y}`;
    for (let i = 0; i < coords.length - 1; i++) {
      const curr = coords[i];
      const next = coords[i + 1];
      const controlX = (curr.x + next.x) / 2;
      path += ` C ${controlX} ${curr.y}, ${controlX} ${next.y}, ${next.x} ${next.y}`;
    }

    const lastCoord = coords[coords.length - 1];
    const firstCoord = coords[0];
    const bottomY = CHART_HEIGHT - PADDING_BOTTOM;
    const area = `${path} L ${lastCoord.x} ${bottomY} L ${firstCoord.x} ${bottomY} Z`;

    return { pathData: path, areaData: area, coordinates: coords };
  }, [points, chartWidth, minValue, maxValue]);

  // Teljes fejlődés összesítése (első vs utolsó mérés)
  const statsOverview = useMemo(() => {
    if (points.length === 0) return null;
    const first = points[0].val;
    const last = points[points.length - 1].val;
    const diff = Math.round((last - first) * 10) / 10;
    const pct = first > 0 ? Math.round(((last - first) / first) * 100) : 0;
    const isPositive = diff >= 0;

    return {
      first,
      last,
      diff,
      pct,
      isPositive,
      sessionsCount: points.length,
    };
  }, [points]);

  const selectedPoint = selectedPointIndex != null ? points[selectedPointIndex] : null;

  if (loading) {
    return (
      <View style={styles.loadingBox}>
        <ActivityIndicator size="small" color={Colors.accent.blue} />
        <Text style={styles.loadingText}>{i18n.t('analytics.chart.loading')}</Text>
      </View>
    );
  }

  if (points.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconCircle}>
          <Ionicons name="trending-up-outline" size={28} color={Colors.accent.blue} />
        </View>
        <Text style={styles.emptyTitle}>{i18n.t('analytics.chart.emptyTitle')}</Text>
        <Text style={styles.emptyDesc}>{i18n.t('analytics.chart.emptyDesc')}</Text>
      </View>
    );
  }

  const midValue = Math.round((minValue + maxValue) / 2);

  return (
    <View style={styles.wrapper}>
      {/* 1. Mérőszám választó fülek */}
      <View style={styles.tabsRow}>
        <TouchableOpacity
          style={[styles.tabBtn, selectedMetric === '1rm' && styles.tabBtnActive]}
          onPress={() => setSelectedMetric('1rm')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabBtnText, selectedMetric === '1rm' && styles.tabBtnTextActive]}>
            {i18n.t('analytics.chart.metric1RM')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, selectedMetric === 'volume' && styles.tabBtnActive]}
          onPress={() => setSelectedMetric('volume')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabBtnText, selectedMetric === 'volume' && styles.tabBtnTextActive]}>
            {i18n.t('analytics.chart.metricVolume')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, selectedMetric === 'max_weight' && styles.tabBtnActive]}
          onPress={() => setSelectedMetric('max_weight')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabBtnText, selectedMetric === 'max_weight' && styles.tabBtnTextActive]}>
            {i18n.t('analytics.chart.metricMaxWeight')}
          </Text>
        </TouchableOpacity>

        {selectedMetric === '1rm' && (
          <TouchableOpacity
            style={styles.infoToggleBtn}
            onPress={() => setShow1RMExplanation((p) => !p)}
            activeOpacity={0.7}
          >
            <Ionicons name="information-circle-outline" size={18} color={Colors.accent.blue} />
          </TouchableOpacity>
        )}
      </View>

      {/* 1RM információs kártya */}
      {selectedMetric === '1rm' && show1RMExplanation && (
        <View style={styles.infoExplainerCard}>
          <View style={styles.infoExplainerHeader}>
            <Ionicons name="bulb-outline" size={15} color={Colors.accent.amber} />
            <Text style={styles.infoExplainerTitle}>{i18n.t('plan.1rmExplanationTitle')}</Text>
          </View>
          <Text style={styles.infoExplainerBody}>{i18n.t('plan.1rmExplanationBody')}</Text>
        </View>
      )}

      {/* 2. Főbb statisztikák sávja */}
      {statsOverview && (
        <View style={styles.statsStrip}>
          <View style={styles.statCol}>
            <Text style={styles.statLabel}>{i18n.t('analytics.chart.statCurrent')}</Text>
            <Text style={styles.statVal}>
              {statsOverview.last} {unit}
            </Text>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statCol}>
            <Text style={styles.statLabel}>{i18n.t('analytics.chart.statStarting')}</Text>
            <Text style={styles.statVal}>
              {statsOverview.first} {unit}
            </Text>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statCol}>
            <Text style={styles.statLabel}>{i18n.t('analytics.chart.statProgress')}</Text>
            <Text
              style={[
                styles.statVal,
                { color: statsOverview.isPositive ? '#22C55E' : '#FF6B81' },
              ]}
            >
              {statsOverview.isPositive ? `+${statsOverview.diff}` : statsOverview.diff} {unit}
              {statsOverview.pct !== 0 && ` (${statsOverview.isPositive ? '+' : ''}${statsOverview.pct}%)`}
            </Text>
          </View>
        </View>
      )}

      {/* 3. Kiválasztott pont részletei */}
      {selectedPoint && (
        <View style={styles.tooltipCard}>
          <View style={styles.tooltipLeft}>
            <Ionicons name="calendar-outline" size={13} color={Colors.accent.blue} />
            <Text style={styles.tooltipDate}>{selectedPoint.date}</Text>
          </View>
          <Text style={styles.tooltipVal}>
            {metricLabel}: <Text style={styles.tooltipHighlight}>{selectedPoint.val} {unit}</Text>
            {selectedPoint.sets_count > 0 && ` · ${selectedPoint.sets_count} ${i18n.t('analytics.chart.setsLabel')}`}
          </Text>
        </View>
      )}

      {/* 4. Interaktív diagram */}
      <View style={styles.svgContainer}>
        <Svg width={chartWidth} height={CHART_HEIGHT}>
          <Defs>
            <LinearGradient id="gradientFill" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor="#4AB8F8" stopOpacity="0.38" />
              <Stop offset="80%" stopColor="#2563EB" stopOpacity="0.06" />
              <Stop offset="100%" stopColor="#2563EB" stopOpacity="0.0" />
            </LinearGradient>
          </Defs>

          {/* Rácsvonalak és Y tengely feliratok */}
          <Line
            x1={PADDING_LEFT}
            y1={PADDING_TOP}
            x2={chartWidth - PADDING_RIGHT}
            y2={PADDING_TOP}
            stroke="rgba(255,255,255,0.08)"
            strokeDasharray="4, 4"
            strokeWidth={1}
          />
          <SvgText
            x={PADDING_LEFT - 6}
            y={PADDING_TOP + 4}
            fill="rgba(255,255,255,0.35)"
            fontSize="10"
            textAnchor="end"
          >
            {maxValue}
          </SvgText>

          <Line
            x1={PADDING_LEFT}
            y1={(PADDING_TOP + CHART_HEIGHT - PADDING_BOTTOM) / 2}
            x2={chartWidth - PADDING_RIGHT}
            y2={(PADDING_TOP + CHART_HEIGHT - PADDING_BOTTOM) / 2}
            stroke="rgba(255,255,255,0.06)"
            strokeDasharray="4, 4"
            strokeWidth={1}
          />
          <SvgText
            x={PADDING_LEFT - 6}
            y={(PADDING_TOP + CHART_HEIGHT - PADDING_BOTTOM) / 2 + 3}
            fill="rgba(255,255,255,0.35)"
            fontSize="10"
            textAnchor="end"
          >
            {midValue}
          </SvgText>

          <Line
            x1={PADDING_LEFT}
            y1={CHART_HEIGHT - PADDING_BOTTOM}
            x2={chartWidth - PADDING_RIGHT}
            y2={CHART_HEIGHT - PADDING_BOTTOM}
            stroke="rgba(255,255,255,0.12)"
            strokeWidth={1}
          />
          <SvgText
            x={PADDING_LEFT - 6}
            y={CHART_HEIGHT - PADDING_BOTTOM + 3}
            fill="rgba(255,255,255,0.35)"
            fontSize="10"
            textAnchor="end"
          >
            {minValue}
          </SvgText>

          {/* Görbe alatti színátmenetes kitöltés */}
          {areaData !== '' && <Path d={areaData} fill="url(#gradientFill)" />}

          {/* Fő diagram görbe */}
          {pathData !== '' && (
            <Path
              d={pathData}
              fill="none"
              stroke="#4AB8F8"
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Adatpontok a grafikonon */}
          {coordinates.map((coord, idx) => {
            const isSelected = selectedPointIndex === idx;
            return (
              <React.Fragment key={idx}>
                {/* Kijelölő gyűrű a kiválasztott pont körül */}
                {isSelected && (
                  <Circle
                    cx={coord.x}
                    cy={coord.y}
                    r={9}
                    fill="rgba(74, 184, 248, 0.25)"
                  />
                )}
                <Circle
                  cx={coord.x}
                  cy={coord.y}
                  r={isSelected ? 5.5 : 3.5}
                  fill={isSelected ? '#FFFFFF' : '#4AB8F8'}
                  stroke="#1E40AF"
                  strokeWidth={2}
                  onPress={() => setSelectedPointIndex(idx)}
                />
              </React.Fragment>
            );
          })}

          {/* Dátum címkék az X tengelyen */}
          {coordinates.length > 0 && (
            <>
              <SvgText
                x={coordinates[0].x}
                y={CHART_HEIGHT - 10}
                fill="rgba(255,255,255,0.4)"
                fontSize="10"
                textAnchor="start"
              >
                {coordinates[0].point.date.slice(5)}
              </SvgText>
              {coordinates.length > 1 && (
                <SvgText
                  x={coordinates[coordinates.length - 1].x}
                  y={CHART_HEIGHT - 10}
                  fill="rgba(255,255,255,0.4)"
                  fontSize="10"
                  textAnchor="end"
                >
                  {coordinates[coordinates.length - 1].point.date.slice(5)}
                </SvgText>
              )}
            </>
          )}
        </Svg>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
  },
  loadingBox: {
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loadingText: {
    color: Colors.text.secondary,
    fontSize: 12,
  },
  emptyContainer: {
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(74, 184, 248, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
    textAlign: 'center',
  },
  emptyDesc: {
    color: Colors.text.secondary,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 260,
  },
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: '#0D1528',
    borderRadius: 12,
    padding: 3,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBtnActive: {
    backgroundColor: '#1E2D4A',
  },
  tabBtnText: {
    color: Colors.text.secondary,
    fontSize: 11,
    fontWeight: '600',
  },
  tabBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  infoToggleBtn: {
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoExplainerCard: {
    backgroundColor: 'rgba(74, 184, 248, 0.08)',
    borderRadius: 12,
    padding: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(74, 184, 248, 0.2)',
  },
  infoExplainerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  infoExplainerTitle: {
    color: Colors.accent.amber,
    fontSize: 12,
    fontWeight: '700',
  },
  infoExplainerBody: {
    color: '#B5C2D2',
    fontSize: 11,
    lineHeight: 16,
  },
  statsStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0F1A30',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  statCol: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    color: 'rgba(255, 255, 255, 0.45)',
    fontSize: 10,
    fontWeight: '600',
    marginBottom: 2,
  },
  statVal: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  statDivider: {
    width: 1,
    height: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  tooltipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#172544',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: 'rgba(74, 184, 248, 0.3)',
  },
  tooltipLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  tooltipDate: {
    color: Colors.accent.blue,
    fontSize: 11,
    fontWeight: '700',
  },
  tooltipVal: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  tooltipHighlight: {
    color: '#4AB8F8',
    fontWeight: '800',
  },
  svgContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});

