import React, { useRef, useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Dimensions,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { Video, ResizeMode } from "expo-av";
import * as ScreenOrientation from "expo-screen-orientation";
import Svg, {
  Line,
  Circle,
  G,
  Ellipse,
  Text as SvgText,
  Defs,
  RadialGradient,
  Stop,
} from "react-native-svg";

import { useColors } from "@/hooks/useColors";
import { useAnalyses } from "@/lib/analysesStore";

// ── Pose definitions (base joint positions in a 320×380 viewport) ──
const POSES: Record<string, {
  label: string;
  joints: Record<string, [number, number]>;
  bones: [string, string][];
}> = {
  weightlifting: {
    label: "Deadlift Position",
    joints: {
      head:      [148, 48],  neck:      [152, 74],
      rShoulder: [134, 100], lShoulder: [170, 102],
      rElbow:    [110, 142], lElbow:    [148, 148],
      rWrist:    [100, 192], lWrist:    [138, 198],
      spine1:    [158, 110], spine2:    [172, 148],
      spine3:    [186, 180], rHip:      [196, 208],
      lHip:      [204, 210], rKnee:     [204, 272],
      lKnee:     [214, 274], rAnkle:    [200, 335],
      lAnkle:    [210, 337],
    },
    bones: [
      ["head","neck"],["neck","spine1"],
      ["spine1","rShoulder"],["spine1","lShoulder"],
      ["rShoulder","rElbow"],["rElbow","rWrist"],
      ["lShoulder","lElbow"],["lElbow","lWrist"],
      ["spine1","spine2"],["spine2","spine3"],
      ["spine3","rHip"],["spine3","lHip"],
      ["rHip","rKnee"],["rKnee","rAnkle"],
      ["lHip","lKnee"],["lKnee","lAnkle"],
    ],
  },
  basketball: {
    label: "Jump Shot",
    joints: {
      head:      [160, 35],  neck:      [160, 62],
      rShoulder: [130, 92],  lShoulder: [190, 92],
      rElbow:    [110, 140], lElbow:    [210, 118],
      rWrist:    [128, 188], lWrist:    [230, 80],
      rHip:      [148, 185], lHip:      [172, 185],
      rKnee:     [134, 248], lKnee:     [178, 244],
      rAnkle:    [128, 318], lAnkle:    [185, 316],
    },
    bones: [
      ["head","neck"],["neck","rShoulder"],["neck","lShoulder"],
      ["rShoulder","rElbow"],["rElbow","rWrist"],
      ["lShoulder","lElbow"],["lElbow","lWrist"],
      ["rShoulder","rHip"],["lShoulder","lHip"],["rHip","lHip"],
      ["rHip","rKnee"],["rKnee","rAnkle"],
      ["lHip","lKnee"],["lKnee","lAnkle"],
    ],
  },
  running: {
    label: "Sprint Drive Phase",
    joints: {
      head:      [165, 40],  neck:      [162, 66],
      rShoulder: [140, 94],  lShoulder: [182, 94],
      rElbow:    [110, 128], lElbow:    [210, 118],
      rWrist:    [90, 160],  lWrist:    [230, 88],
      rHip:      [155, 185], lHip:      [175, 185],
      rKnee:     [170, 260], lKnee:     [145, 232],
      rAnkle:    [188, 330], lAnkle:    [118, 295],
    },
    bones: [
      ["head","neck"],["neck","rShoulder"],["neck","lShoulder"],
      ["rShoulder","rElbow"],["rElbow","rWrist"],
      ["lShoulder","lElbow"],["lElbow","lWrist"],
      ["rShoulder","rHip"],["lShoulder","lHip"],["rHip","lHip"],
      ["rHip","rKnee"],["rKnee","rAnkle"],
      ["lHip","lKnee"],["lKnee","lAnkle"],
    ],
  },
  golf: {
    label: "Impact Position",
    joints: {
      head:      [152, 50],  neck:      [156, 76],
      rShoulder: [132, 108], lShoulder: [180, 102],
      rElbow:    [112, 152], lElbow:    [202, 148],
      rWrist:    [140, 192], lWrist:    [196, 192],
      rHip:      [165, 210], lHip:      [182, 208],
      rKnee:     [162, 272], lKnee:     [186, 268],
      rAnkle:    [156, 338], lAnkle:    [192, 334],
    },
    bones: [
      ["head","neck"],["neck","rShoulder"],["neck","lShoulder"],
      ["rShoulder","rElbow"],["rElbow","rWrist"],
      ["lShoulder","lElbow"],["lElbow","lWrist"],
      ["rShoulder","rHip"],["lShoulder","lHip"],["rHip","lHip"],
      ["rHip","rKnee"],["rKnee","rAnkle"],
      ["lHip","lKnee"],["lKnee","lAnkle"],
    ],
  },
};

const SVG_W = 320;
const SVG_H = 380;

// Per-joint phase offsets so motion is independent, naturalistic
const JOINT_PHASES: Record<string, number> = {
  head: 0, neck: 0.3, spine1: 0.1, spine2: 0.6, spine3: 0.9,
  rShoulder: 1.2, lShoulder: 0.8, rElbow: 1.8, lElbow: 1.4,
  rWrist: 2.4, lWrist: 2.0, rHip: 0.5, lHip: 0.7,
  rKnee: 1.1, lKnee: 1.3, rAnkle: 1.7, lAnkle: 1.9,
};

// Animate amplitude per joint (extremities move more)
const JOINT_AMP: Record<string, number> = {
  head: 0.6, neck: 0.4, spine1: 0.3, spine2: 0.5, spine3: 0.6,
  rShoulder: 0.7, lShoulder: 0.7, rElbow: 1.2, lElbow: 1.2,
  rWrist: 1.8, lWrist: 1.8, rHip: 0.5, lHip: 0.5,
  rKnee: 1.0, lKnee: 1.0, rAnkle: 1.4, lAnkle: 1.4,
};

function getRiskJoints(injuryRisks: { joint: string; risk: number }[]): Record<string, number> {
  const map: Record<string, number> = {};
  injuryRisks.forEach((r) => {
    const j = r.joint.toLowerCase();
    if (j.includes("lumbar") || j.includes("back") || j.includes("spine")) {
      map["spine2"] = r.risk; map["spine3"] = r.risk;
    }
    if (j.includes("knee")) {
      if (j.includes("left")) map["lKnee"] = r.risk;
      else if (j.includes("right")) map["rKnee"] = r.risk;
      else { map["lKnee"] = r.risk; map["rKnee"] = r.risk; }
    }
    if (j.includes("hip")) {
      if (j.includes("left")) map["lHip"] = r.risk;
      else map["rHip"] = r.risk;
    }
    if (j.includes("shoulder")) {
      if (j.includes("right")) map["rShoulder"] = r.risk;
      else map["lShoulder"] = r.risk;
    }
    if (j.includes("ankle")) { map["rAnkle"] = r.risk; map["lAnkle"] = r.risk; }
    if (j.includes("wrist")) { map["rWrist"] = r.risk; }
    if (j.includes("elbow")) { map["rElbow"] = r.risk; }
  });
  return map;
}

function jointColor(risk: number | undefined) {
  if (risk === undefined) return "#6c63ff";
  if (risk >= 50) return "#ef4444";
  if (risk >= 25) return "#f59e0b";
  return "#22c55e";
}
function jointGlow(risk: number | undefined) {
  if (risk === undefined) return "#6c63ff44";
  if (risk >= 50) return "#ef444466";
  if (risk >= 25) return "#f59e0b55";
  return "#22c55e44";
}

export default function SkeletonScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const { analyses, videoUris } = useAnalyses();
  const analysis = analyses.find((a) => a.id === id);
  const videoUri = id ? videoUris[id] : undefined;

  // ── Screen orientation ──
  const [isLandscape, setIsLandscape] = useState(() => {
    const { width, height } = Dimensions.get("window");
    return width > height;
  });

  useEffect(() => {
    const sub = ScreenOrientation.addOrientationChangeListener((e) => {
      const o = e.orientationInfo.orientation;
      setIsLandscape(
        o === ScreenOrientation.Orientation.LANDSCAPE_LEFT ||
        o === ScreenOrientation.Orientation.LANDSCAPE_RIGHT
      );
    });
    // Also update on mount via Dimensions
    const dimSub = Dimensions.addEventListener("change", ({ window }) => {
      setIsLandscape(window.width > window.height);
    });
    return () => {
      ScreenOrientation.removeOrientationChangeListener(sub);
      dimSub.remove();
    };
  }, []);

  async function toggleOrientation() {
    if (isLandscape) {
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
    } else {
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE_RIGHT);
    }
  }

  // Unlock when leaving screen
  useEffect(() => {
    return () => {
      ScreenOrientation.unlockAsync().catch(() => {});
    };
  }, []);

  // ── Animated skeleton (phase-driven wobble) ──
  const phaseRef = useRef(0);
  const [animTick, setAnimTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      phaseRef.current += 0.04; // ~24 fps smooth
      setAnimTick((t) => t + 1);
    }, 42);
    return () => clearInterval(interval);
  }, []);

  const pose = POSES[analysis?.sport ?? ""] ?? POSES.weightlifting;
  const riskJoints = analysis ? getRiskJoints(analysis.injuryRisks) : {};

  // Compute animated joint positions
  const animatedJoints = useCallback((): Record<string, [number, number]> => {
    const phase = phaseRef.current;
    const result: Record<string, [number, number]> = {};
    for (const [name, [bx, by]] of Object.entries(pose.joints)) {
      const ph = JOINT_PHASES[name] ?? 0;
      const amp = JOINT_AMP[name] ?? 0.8;
      const dx = Math.sin(phase + ph) * amp;
      const dy = Math.cos(phase * 0.7 + ph + 1) * amp * 0.6;
      result[name] = [bx + dx, by + dy];
    }
    return result;
  }, [pose, animTick]); // animTick triggers re-compute

  const dims = Dimensions.get("window");
  const screenW = dims.width;
  const screenH = dims.height;
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const videoPanelW = isLandscape ? screenW * 0.58 : screenW;
  const videoPanelH = isLandscape ? screenH : Math.min(300, screenH * 0.38);

  const scoreKeys = ["technique", "power", "balance", "consistency"] as const;
  function getScoreColor(s: number) {
    if (s >= 80) return "#22c55e";
    if (s >= 65) return "#6c63ff";
    return "#f59e0b";
  }

  if (!analysis) {
    return (
      <View style={{ flex: 1, backgroundColor: "#050508", alignItems: "center", justifyContent: "center" }}>
        <TouchableOpacity onPress={() => router.back()} style={{ position: "absolute", top: topPad + 8, left: 20 }}>
          <Feather name="chevron-left" size={24} color="#8888aa" />
        </TouchableOpacity>
        <Feather name="alert-circle" size={32} color="#3a3a5c" />
        <Text style={{ color: "#8888aa", fontFamily: "Inter_400Regular", marginTop: 10 }}>Analysis not found</Text>
      </View>
    );
  }

  const joints = animatedJoints();

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#050508" },
    header: {
      flexDirection: "row", alignItems: "center",
      paddingTop: topPad + 8, paddingHorizontal: 20, paddingBottom: 12,
      borderBottomWidth: 1, borderBottomColor: "#1e1e2e", gap: 12, zIndex: 10,
    },
    backBtn: {
      width: 36, height: 36, borderRadius: 10,
      backgroundColor: "#111118", borderWidth: 1, borderColor: "#1e1e2e",
      alignItems: "center", justifyContent: "center",
    },
    headerTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#f0f0f8", flex: 1 },
    rotateBtn: {
      flexDirection: "row", alignItems: "center", gap: 6,
      backgroundColor: "#6c63ff", borderRadius: 20,
      paddingHorizontal: 12, paddingVertical: 6,
    },
    rotateBtnText: { fontSize: 12, color: "#fff", fontFamily: "Inter_600SemiBold" },
    body: { flex: 1, flexDirection: isLandscape ? "row" : "column" },
    videoPanel: {
      width: videoPanelW, height: videoPanelH,
      backgroundColor: "#07070c", position: "relative", overflow: "hidden",
    },
    video: { position: "absolute", top: 0, left: 0, width: videoPanelW, height: videoPanelH },
    noVideoScrim: {
      position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: "#07070c", alignItems: "center", justifyContent: "center",
    },
    noVideoText: { color: "#3a3a5c", fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 8 },
    scrim: {
      position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: "rgba(5,5,10,0.45)",
    },
    svgOverlay: { position: "absolute", top: 0, left: 0 },
    trackingBadge: {
      position: "absolute", top: 10, left: 10,
      flexDirection: "row", alignItems: "center", gap: 5,
      backgroundColor: "rgba(108,99,255,0.85)", borderRadius: 20,
      paddingHorizontal: 10, paddingVertical: 4,
    },
    trackingDot: {
      width: 6, height: 6, borderRadius: 3, backgroundColor: "#22c55e",
    },
    trackingText: { fontSize: 10, color: "#fff", fontFamily: "Inter_600SemiBold" },
    infoPanel: { flex: 1, padding: 20 },
    poseLabel: {
      fontSize: 11, color: "#6c63ff", fontFamily: "Inter_600SemiBold",
      textTransform: "uppercase", letterSpacing: 1, marginBottom: 16,
    },
    scoreRow: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
    scoreLabel: { fontSize: 12, color: "#8888aa", fontFamily: "Inter_400Regular", width: 90, textTransform: "capitalize" },
    scoreBarBg: { flex: 1, height: 6, backgroundColor: "#1e1e2e", borderRadius: 3, marginHorizontal: 10 },
    scoreBarFill: { height: 6, borderRadius: 3 },
    scoreNum: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: "#f0f0f8", width: 28, textAlign: "right" },
    divider: { height: 1, backgroundColor: "#1e1e2e", marginVertical: 14 },
    riskTitle: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: "#f0f0f8", marginBottom: 10 },
    riskItem: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
    riskDot: { width: 8, height: 8, borderRadius: 4 },
    riskText: { fontSize: 12, color: "#8888aa", fontFamily: "Inter_400Regular", flex: 1 },
    riskPct: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
    legendRow: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 14 },
    legendItem: { flexDirection: "row", alignItems: "center", gap: 5 },
    legendDot: { width: 8, height: 8, borderRadius: 4 },
    legendText: { fontSize: 10, color: "#8888aa", fontFamily: "Inter_400Regular" },
  });

  return (
    <View style={s.container}>
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Feather name="chevron-left" size={18} color="#8888aa" />
        </TouchableOpacity>
        <Text style={s.headerTitle} numberOfLines={1}>
          {pose.label}
        </Text>
        <TouchableOpacity style={s.rotateBtn} onPress={toggleOrientation} activeOpacity={0.8}>
          <Feather name={isLandscape ? "smartphone" : "maximize"} size={13} color="#fff" />
          <Text style={s.rotateBtnText}>{isLandscape ? "Portrait" : "Landscape"}</Text>
        </TouchableOpacity>
      </View>

      <View style={s.body}>
        {/* ── Video + animated skeleton overlay ── */}
        <View style={s.videoPanel}>
          {videoUri ? (
            <Video
              source={{ uri: videoUri }}
              style={s.video}
              resizeMode={ResizeMode.COVER}
              isLooping
              shouldPlay
            />
          ) : (
            <View style={s.noVideoScrim}>
              <Feather name="video" size={36} color="#3a3a5c" />
              <Text style={s.noVideoText}>Upload a video to see it here</Text>
            </View>
          )}

          {videoUri && <View style={s.scrim} />}

          {/* Animated SVG skeleton */}
          <Svg
            style={s.svgOverlay}
            width={videoPanelW}
            height={videoPanelH}
            viewBox={`0 0 ${SVG_W} ${SVG_H}`}
          >
            <Defs>
              <RadialGradient id="bg" cx="50%" cy="50%" r="50%">
                <Stop offset="0%" stopColor="#6c63ff" stopOpacity="0.07" />
                <Stop offset="100%" stopColor="#050508" stopOpacity="0" />
              </RadialGradient>
            </Defs>
            <Ellipse cx={SVG_W / 2} cy={SVG_H / 2} rx={140} ry={175} fill="url(#bg)" />

            {/* Animated bones */}
            {pose.bones.map(([a, b], i) => {
              const pa = joints[a];
              const pb = joints[b];
              if (!pa || !pb) return null;
              const maxRisk = Math.max(riskJoints[a] ?? 0, riskJoints[b] ?? 0);
              const bc = maxRisk >= 50 ? "#ef444499" : maxRisk >= 25 ? "#f59e0b99" : "#6c63ffaa";
              return (
                <Line key={i}
                  x1={pa[0]} y1={pa[1]} x2={pb[0]} y2={pb[1]}
                  stroke={bc} strokeWidth={3.5} strokeLinecap="round"
                />
              );
            })}

            {/* Animated joints */}
            {Object.entries(joints).map(([name, [x, y]]) => {
              const risk = riskJoints[name];
              const color = jointColor(risk);
              const glow = jointGlow(risk);
              const isHead = name === "head";
              const r = isHead ? 14 : 6;
              return (
                <G key={name}>
                  <Circle cx={x} cy={y} r={r + 7} fill={glow} />
                  <Circle cx={x} cy={y} r={r} fill="#05050a" stroke={color} strokeWidth={2.5} />
                  {risk !== undefined && risk >= 50 && (
                    <Circle cx={x} cy={y} r={r + 13} fill="none"
                      stroke="#ef4444" strokeWidth={1} strokeDasharray="4 4" />
                  )}
                  {risk !== undefined && risk >= 25 && !isHead && (
                    <SvgText x={x + 11} y={y - 8} fontSize={9} fill={color} fontWeight="600">
                      {risk}%
                    </SvgText>
                  )}
                </G>
              );
            })}
          </Svg>

          {/* Live tracking badge */}
          <View style={s.trackingBadge}>
            <View style={s.trackingDot} />
            <Text style={s.trackingText}>LIVE TRACKING</Text>
          </View>
        </View>

        {/* ── Score / risk panel ── */}
        <ScrollView style={s.infoPanel} showsVerticalScrollIndicator={false}>
          <Text style={s.poseLabel}>{pose.label}</Text>

          {scoreKeys.map((key) => {
            const val = analysis.scores[key];
            const c = getScoreColor(val);
            return (
              <View key={key} style={s.scoreRow}>
                <Text style={s.scoreLabel}>{key}</Text>
                <View style={s.scoreBarBg}>
                  <View style={[s.scoreBarFill, { width: `${val}%` as any, backgroundColor: c }]} />
                </View>
                <Text style={[s.scoreNum, { color: c }]}>{val}</Text>
              </View>
            );
          })}

          {analysis.injuryRisks.length > 0 && (
            <>
              <View style={s.divider} />
              <Text style={s.riskTitle}>Joint Risk</Text>
              {analysis.injuryRisks.map((r, i) => {
                const c = r.risk >= 50 ? "#ef4444" : r.risk >= 25 ? "#f59e0b" : "#22c55e";
                return (
                  <View key={i} style={s.riskItem}>
                    <View style={[s.riskDot, { backgroundColor: c }]} />
                    <Text style={s.riskText}>{r.joint}</Text>
                    <Text style={[s.riskPct, { color: c }]}>{r.risk}%</Text>
                  </View>
                );
              })}
            </>
          )}

          <View style={s.divider} />
          <View style={s.legendRow}>
            {[
              { color: "#22c55e", label: "Good" },
              { color: "#f59e0b", label: "Caution 25–49%" },
              { color: "#ef4444", label: "High risk 50%+" },
            ].map((l) => (
              <View key={l.label} style={s.legendItem}>
                <View style={[s.legendDot, { backgroundColor: l.color }]} />
                <Text style={s.legendText}>{l.label}</Text>
              </View>
            ))}
          </View>
          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </View>
  );
}
