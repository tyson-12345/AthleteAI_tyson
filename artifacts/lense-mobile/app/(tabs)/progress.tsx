import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import Svg, { Path, Line, Circle, Polyline, Defs, LinearGradient, Stop } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import { progress as progressApi, achievements as achievementsApi, type ProgressRecord, type AchievementRecord } from "@/lib/api";
import colors from "@/constants/colors";
const C = colors.light;

const METRICS = ["overall", "technique", "power", "balance", "consistency", "mobility", "speed"] as const;
type MetricKey = typeof METRICS[number];

const METRIC_KEY_MAP: Record<MetricKey, keyof ProgressRecord> = {
  overall:     "overallScore",
  technique:   "techniqueScore",
  power:       "powerScore",
  balance:     "balanceScore",
  consistency: "consistencyScore",
  mobility:    "mobilityScore",
  speed:       "speedScore",
};

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CHART_H = 120;

function getMetricColor(key: MetricKey) {
  if (key === "overall")                      return C.volt;
  if (key === "power" || key === "speed")     return C.success;
  if (key === "mobility")                      return C.warning;
  return C.volt;
}

// Week day circles matching the mockup
function WeekDots({ entries }: { entries: ProgressRecord[] }) {
  const today = new Date();
  const days = ["S", "M", "T", "W", "T", "F", "S"];
  const dayOfWeek = today.getDay(); // 0 = Sunday

  // Map entries to days of the week (this week only)
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - dayOfWeek);

  const completedDays = new Set<number>();
  entries.forEach((e) => {
    const d = new Date(e.date);
    const diff = Math.floor((d.getTime() - startOfWeek.getTime()) / 86400000);
    if (diff >= 0 && diff < 7) completedDays.add(diff);
  });

  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
      {days.map((day, i) => {
        const isToday = i === dayOfWeek;
        const done = completedDays.has(i);
        return (
          <View key={i} style={{ alignItems: "center", gap: 7 }}>
            <View style={[
              wds.dot,
              done ? wds.dotDone : isToday ? wds.dotToday : wds.dotEmpty,
            ]}>
              {done && <Feather name="check" size={14} color={C.ink} />}
            </View>
            <Text style={[wds.dayLabel, isToday && { color: C.volt, fontFamily: "Inter_700Bold" }]}>{day}</Text>
          </View>
        );
      })}
    </View>
  );
}

const wds = StyleSheet.create({
  dot:      { width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center" },
  dotDone:  { backgroundColor: C.volt },
  dotToday: { borderWidth: 2, borderColor: C.volt, shadowColor: C.volt, shadowOpacity: 0.4, shadowRadius: 6, shadowOffset: { width: 0, height: 0 } },
  dotEmpty: { backgroundColor: "#23272e" },
  dayLabel: { fontSize: 10, fontFamily: "Inter_600SemiBold", color: C.textSecondary },
});

export default function ProgressScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [activeMetric, setActiveMetric] = useState<MetricKey>("overall");
  const [entries, setEntries] = useState<ProgressRecord[]>([]);
  const [achievements, setAchievements] = useState<AchievementRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 + 84 : insets.bottom + 84 + 16;
  const chartWidth = SCREEN_WIDTH - 40 - 32; // account for section padding + card padding
  const lineColor = getMetricColor(activeMetric);

  const loadData = useCallback(async () => {
    try {
      const [{ entries: e }, { achievements: a }] = await Promise.all([
        progressApi.list(),
        achievementsApi.list(),
      ]);
      setEntries(e);
      setAchievements(a);
    } catch {
      // ignore
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const values = entries.map((p) => (p[METRIC_KEY_MAP[activeMetric]] as number) ?? 0);
  const minVal = values.length ? Math.max(0, Math.min(...values) - 8) : 0;
  const maxVal = values.length ? Math.min(100, Math.max(...values) + 8) : 100;
  const range = maxVal - minVal || 1;

  function toY(val: number) {
    return CHART_H - ((val - minVal) / range) * CHART_H;
  }

  const pointWidth = values.length > 1 ? chartWidth / (values.length - 1) : chartWidth;

  const currentScore = values[values.length - 1] ?? 0;
  const firstScore = values[0] ?? 0;
  const gained = Math.round(currentScore - firstScore);
  const gainPct = firstScore > 0 ? Math.round((gained / firstScore) * 100) : 0;

  // Metric breakdown: get latest values for each metric
  const latestEntry = entries[entries.length - 1];
  const BREAKDOWN_METRICS: MetricKey[] = ["technique", "power", "balance", "consistency", "mobility", "speed"];

  const s = StyleSheet.create({
    container:     { flex: 1, backgroundColor: C.background },
    header:        { paddingTop: topPad + 16, paddingHorizontal: 20, paddingBottom: 16 },
    title:         { fontSize: 28, fontFamily: "Archivo_800ExtraBold", color: C.textPrimary, letterSpacing: -0.5 },
    periodPill:    { borderWidth: 1, borderColor: "rgba(255,255,255,0.12)", borderRadius: 10, paddingHorizontal: 11, paddingVertical: 6 },
    periodText:    { fontFamily: "SpaceMono_700Bold", fontSize: 11, letterSpacing: 0.8, color: C.textSecondary },
    section:       { paddingHorizontal: 20, marginBottom: 16 },
    sectionTitle:  { fontSize: 15, fontFamily: "Inter_600SemiBold", color: C.textPrimary, marginBottom: 12 },
    card:          { backgroundColor: C.surface2, borderRadius: 20, borderWidth: 1, borderColor: "rgba(255,255,255,0.07)", padding: 16 },
    summaryRow:    { flexDirection: "row", gap: 10, marginBottom: 16, paddingHorizontal: 20 },
    summaryCard:   { flex: 1, backgroundColor: C.surface2, borderRadius: 18, padding: 14, borderWidth: 1, borderColor: "rgba(255,255,255,0.07)", alignItems: "center" },
    summaryValue:  { fontSize: 24, fontFamily: "Archivo_800ExtraBold", color: C.textPrimary, letterSpacing: -0.5 },
    summaryLabel:  { fontSize: 10, color: C.textSecondary, fontFamily: "SpaceMono_700Bold", marginTop: 3, letterSpacing: 0.5 },
    metricPicker:  { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 14 },
    metricChip:    { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: C.surface3, borderWidth: 1, borderColor: "rgba(255,255,255,0.07)" },
    metricChipText:{ fontSize: 12, fontFamily: "Inter_500Medium", color: C.textSecondary, textTransform: "capitalize" },
    chartLabels:   { flexDirection: "row", justifyContent: "space-between", marginTop: 10 },
    chartLabel:    { fontSize: 10, color: C.textSecondary, fontFamily: "Inter_400Regular" },
    barRow:        { marginBottom: 12 },
    barHeader:     { flexDirection: "row", justifyContent: "space-between", marginBottom: 5 },
    barLabel:      { fontSize: 13, fontFamily: "Inter_500Medium", color: C.textSecondary, textTransform: "capitalize" },
    barValue:      { fontSize: 12, fontFamily: "SpaceMono_700Bold", color: C.textPrimary },
    barTrack:      { height: 7, backgroundColor: "#1c2026", borderRadius: 4, overflow: "hidden" },
    achGrid:       { flexDirection: "row", flexWrap: "wrap", gap: 10 },
    achCard:       { width: "47%", flexGrow: 1, backgroundColor: C.surface2, borderRadius: 18, padding: 14, borderWidth: 1, borderColor: "rgba(255,255,255,0.07)", flexDirection: "row", alignItems: "center", gap: 10 },
    achCardLocked: { opacity: 0.45 },
    achIcon:       { fontSize: 26 },
    achTitle:      { fontSize: 13, fontFamily: "Inter_600SemiBold", color: C.textPrimary },
    achDesc:       { fontSize: 11, color: C.textSecondary, fontFamily: "Inter_400Regular", marginTop: 2 },
    achProgress:   { fontSize: 11, color: C.volt, fontFamily: "Inter_600SemiBold", marginTop: 3 },
    emptyCard:     { backgroundColor: C.surface2, borderRadius: 20, padding: 32, borderWidth: 1, borderColor: "rgba(255,255,255,0.07)", alignItems: "center", gap: 12 },
    emptyText:     { color: C.textSecondary, fontFamily: "Inter_400Regular", fontSize: 14, textAlign: "center" },
    emptyBtn:      { backgroundColor: C.volt, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 20 },
    emptyBtnText:  { color: C.ink, fontFamily: "Inter_600SemiBold", fontSize: 13 },
  });

  if (loading) {
    return (
      <View style={[s.container, { alignItems: "center", justifyContent: "center" }]}>
        <ActivityIndicator color={C.volt} size="large" />
      </View>
    );
  }

  const gradientId = `grad-${activeMetric}`;

  // Build SVG path strings
  const areaPath = values.length > 1
    ? [
        `M 0 ${toY(values[0]!)}`,
        ...values.slice(1).map((v, i) => `L ${(i + 1) * pointWidth} ${toY(v)}`),
        `L ${(values.length - 1) * pointWidth} ${CHART_H}`,
        `L 0 ${CHART_H}`,
        "Z",
      ].join(" ")
    : "";

  const linePath = values.length > 1
    ? values.map((v, i) => `${i === 0 ? "M" : "L"} ${i * pointWidth} ${toY(v)}`).join(" ")
    : "";

  return (
    <View style={s.container}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: bottomPad }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} tintColor={C.volt} />}
      >
        {/* Header */}
        <View style={[s.header, { flexDirection: "row", alignItems: "center", justifyContent: "space-between" }]}>
          <Text style={s.title}>Progress</Text>
          <View style={s.periodPill}>
            <Text style={s.periodText}>ALL TIME</Text>
          </View>
        </View>

        {entries.length === 0 ? (
          <View style={[s.section]}>
            <View style={s.emptyCard}>
              <Feather name="trending-up" size={32} color={C.textSecondary} />
              <Text style={s.emptyText}>Complete your first analysis to start tracking progress.</Text>
              <TouchableOpacity style={s.emptyBtn} onPress={() => router.push("/(tabs)/analyze")} activeOpacity={0.85}>
                <Text style={s.emptyBtnText}>Analyze a Video</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <>
            {/* Summary stats */}
            <View style={s.summaryRow}>
              <View style={s.summaryCard}>
                <Text style={s.summaryValue}>{Math.round(currentScore)}</Text>
                <Text style={s.summaryLabel}>AVG SCORE</Text>
              </View>
              <View style={s.summaryCard}>
                <Text style={[s.summaryValue, { color: gained >= 0 ? C.success : C.destructive }]}>
                  {gained >= 0 ? "+" : ""}{gained}
                </Text>
                <Text style={s.summaryLabel}>GAINED</Text>
              </View>
              <View style={s.summaryCard}>
                <Text style={[s.summaryValue, { color: C.volt }]}>{gainPct >= 0 ? "+" : ""}{gainPct}%</Text>
                <Text style={s.summaryLabel}>TREND</Text>
              </View>
            </View>

            {/* Trend chart */}
            <View style={s.section}>
              <View style={[s.card]}>
                <View style={{ flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 12 }}>
                  <View>
                    <Text style={{ fontFamily: "SpaceMono_700Bold", fontSize: 10, letterSpacing: 1, color: C.textSecondary }}>
                      {activeMetric.toUpperCase()} SCORE
                    </Text>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginTop: 4 }}>
                      <Text style={{ fontFamily: "Archivo_800ExtraBold", fontSize: 36, color: C.textPrimary, letterSpacing: -1 }}>
                        {Math.round(currentScore)}
                      </Text>
                      {gained !== 0 && (
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 3, backgroundColor: gained > 0 ? "rgba(198,255,58,0.14)" : "rgba(239,68,68,0.14)", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 }}>
                          <Feather name={gained > 0 ? "arrow-up" : "arrow-down"} size={12} color={gained > 0 ? C.volt : C.destructive} />
                          <Text style={{ fontFamily: "Inter_700Bold", fontSize: 12, color: gained > 0 ? C.volt : C.destructive }}>{Math.abs(gained)}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>

                <Svg width={chartWidth} height={CHART_H} style={{ display: "flex" }}>
                  <Defs>
                    <LinearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                      <Stop offset="0" stopColor={lineColor} stopOpacity={0.35} />
                      <Stop offset="1" stopColor={lineColor} stopOpacity={0} />
                    </LinearGradient>
                  </Defs>
                  {/* Area fill */}
                  {areaPath ? <Path d={areaPath} fill={`url(#${gradientId})`} /> : null}
                  {/* Line */}
                  {linePath ? <Path d={linePath} fill="none" stroke={lineColor} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" /> : null}
                  {/* Dots */}
                  {values.map((v, i) => (
                    <Circle key={i} cx={i * pointWidth} cy={toY(v)} r={i === values.length - 1 ? 5 : 3.5} fill={lineColor} />
                  ))}
                </Svg>

                <View style={s.chartLabels}>
                  {entries
                    .filter((_, i) => i === 0 || i === Math.floor(entries.length / 2) || i === entries.length - 1)
                    .map((e, i) => (
                      <Text key={i} style={s.chartLabel}>
                        {new Date(e.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </Text>
                    ))}
                </View>
              </View>

              {/* Metric selector */}
              <View style={[s.metricPicker, { marginTop: 14 }]}>
                {METRICS.map((m) => {
                  const active = activeMetric === m;
                  const clr = getMetricColor(m);
                  return (
                    <TouchableOpacity
                      key={m}
                      style={[s.metricChip, active && { backgroundColor: clr + "22", borderColor: clr }]}
                      onPress={() => setActiveMetric(m)}
                      activeOpacity={0.8}
                    >
                      <Text style={[s.metricChipText, active && { color: clr }]}>{m}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* This week */}
            <View style={s.section}>
              <View style={s.card}>
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                  <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 14, color: C.textPrimary }}>This week</Text>
                  <Text style={{ fontFamily: "Inter_400Regular", fontSize: 13, color: C.textSecondary }}>
                    {entries.filter((e) => {
                      const d = new Date(e.date);
                      const now = new Date();
                      const startOfWeek = new Date(now);
                      startOfWeek.setDate(now.getDate() - now.getDay());
                      return d >= startOfWeek;
                    }).length} sessions
                  </Text>
                </View>
                <WeekDots entries={entries} />
              </View>
            </View>

            {/* Metric breakdown */}
            {latestEntry && (
              <View style={s.section}>
                <Text style={s.sectionTitle}>Metric breakdown</Text>
                <View style={s.card}>
                  {BREAKDOWN_METRICS.map((m, idx) => {
                    const val = Math.round((latestEntry[METRIC_KEY_MAP[m]] as number) ?? 0);
                    if (!val) return null;
                    return (
                      <View key={m} style={[s.barRow, idx < BREAKDOWN_METRICS.length - 1 && { marginBottom: 14 }]}>
                        <View style={s.barHeader}>
                          <Text style={s.barLabel}>{m}</Text>
                          <Text style={s.barValue}>{val}</Text>
                        </View>
                        <View style={s.barTrack}>
                          <View style={{ width: `${val}%`, height: 7, backgroundColor: C.volt, borderRadius: 4 }} />
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}
          </>
        )}

        {/* Achievements */}
        {achievements.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Achievements</Text>
            <View style={s.achGrid}>
              {achievements.map((a) => (
                <View key={a.id} style={[s.achCard, !a.unlocked && s.achCardLocked]}>
                  <Text style={s.achIcon}>{a.icon}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={s.achTitle}>{a.title}</Text>
                    <Text style={s.achDesc}>{a.description}</Text>
                    {!a.unlocked && <Text style={s.achProgress}>{a.progress}/{a.total}</Text>}
                  </View>
                  {a.unlocked && <Feather name="check-circle" size={15} color={C.success} />}
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
