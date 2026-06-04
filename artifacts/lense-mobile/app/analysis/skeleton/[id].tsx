import React, { useRef, useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Dimensions,
  ScrollView,
  GestureResponderEvent,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { Video, ResizeMode, AVPlaybackStatus } from "expo-av";
import * as ScreenOrientation from "expo-screen-orientation";
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withRepeat,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { Circle, Line, Ellipse, Defs, RadialGradient, Stop } from "react-native-svg";
import Svg from "react-native-svg";

import { useColors } from "@/hooks/useColors";
import { useAnalyses } from "@/lib/analysesStore";

// ── Animated SVG primitives ────────────────────────────────────────────────
const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedLine   = Animated.createAnimatedComponent(Line);

// ── Pose definitions ───────────────────────────────────────────────────────
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

// Per-joint phase offset and motion amplitude
const JOINT_PHASE: Record<string, number> = {
  head: 0, neck: 0.3, spine1: 0.1, spine2: 0.6, spine3: 0.9,
  rShoulder: 1.2, lShoulder: 0.8, rElbow: 1.8, lElbow: 1.4,
  rWrist: 2.4, lWrist: 2.0, rHip: 0.5, lHip: 0.7,
  rKnee: 1.1, lKnee: 1.3, rAnkle: 1.7, lAnkle: 1.9,
};
const JOINT_AMP: Record<string, number> = {
  head: 0.5, neck: 0.35, spine1: 0.25, spine2: 0.45, spine3: 0.55,
  rShoulder: 0.6, lShoulder: 0.6, rElbow: 1.1, lElbow: 1.1,
  rWrist: 1.6, lWrist: 1.6, rHip: 0.45, lHip: 0.45,
  rKnee: 0.9, lKnee: 0.9, rAnkle: 1.3, lAnkle: 1.3,
};

const SVG_W = 320;
const SVG_H = 380;

// ── Risk helpers ────────────────────────────────────────────────────────────
function getRiskJoints(risks: { joint: string; risk: number }[]) {
  const map: Record<string, number> = {};
  risks.forEach(({ joint, risk }) => {
    const j = joint.toLowerCase();
    if (j.includes("lumbar") || j.includes("back") || j.includes("spine")) {
      map.spine2 = risk; map.spine3 = risk;
    }
    if (j.includes("knee")) {
      if (j.includes("left")) map.lKnee = risk;
      else if (j.includes("right")) map.rKnee = risk;
      else { map.lKnee = risk; map.rKnee = risk; }
    }
    if (j.includes("hip"))       { if (j.includes("left")) map.lHip = risk; else map.rHip = risk; }
    if (j.includes("shoulder"))  { if (j.includes("right")) map.rShoulder = risk; else map.lShoulder = risk; }
    if (j.includes("ankle"))     { map.rAnkle = risk; map.lAnkle = risk; }
    if (j.includes("wrist"))     { map.rWrist = risk; }
    if (j.includes("elbow"))     { map.rElbow = risk; }
  });
  return map;
}

function jColor(risk?: number) {
  if (!risk) return "#6c63ff";
  if (risk >= 50) return "#ef4444";
  if (risk >= 25) return "#f59e0b";
  return "#22c55e";
}
function jGlow(risk?: number) {
  if (!risk) return "#6c63ff44";
  if (risk >= 50) return "#ef444466";
  if (risk >= 25) return "#f59e0b55";
  return "#22c55e44";
}
function boneColor(riskA: number, riskB: number) {
  const m = Math.max(riskA, riskB);
  if (m >= 50) return "#ef444499";
  if (m >= 25) return "#f59e0b99";
  return "#6c63ffaa";
}

// ── Animated joint dot (Reanimated, runs on UI thread) ─────────────────────
function JointDot({
  bx, by, name, phase, risk,
}: {
  bx: number; by: number; name: string;
  phase: Animated.SharedValue<number>; risk?: number;
}) {
  const ph  = JOINT_PHASE[name] ?? 0;
  const amp = JOINT_AMP[name]   ?? 0.8;
  const isHead = name === "head";
  const r   = isHead ? 14 : 6;
  const color = jColor(risk);
  const glow  = jGlow(risk);

  const glowProps = useAnimatedProps(() => ({
    cx: bx + Math.sin(phase.value + ph) * amp,
    cy: by + Math.cos(phase.value * 0.7 + ph + 1) * amp * 0.6,
  }));
  const dotProps = useAnimatedProps(() => ({
    cx: bx + Math.sin(phase.value + ph) * amp,
    cy: by + Math.cos(phase.value * 0.7 + ph + 1) * amp * 0.6,
  }));

  return (
    <>
      <AnimatedCircle animatedProps={glowProps} r={r + 7} fill={glow} />
      <AnimatedCircle animatedProps={dotProps}  r={r} fill="#05050a" stroke={color} strokeWidth={2.5} />
    </>
  );
}

// ── Animated bone segment ──────────────────────────────────────────────────
function BoneSegment({
  ax, ay, bx, by, nameA, nameB, phase, riskA, riskB,
}: {
  ax: number; ay: number; bx: number; by: number;
  nameA: string; nameB: string;
  phase: Animated.SharedValue<number>;
  riskA: number; riskB: number;
}) {
  const phA = JOINT_PHASE[nameA] ?? 0;
  const phB = JOINT_PHASE[nameB] ?? 0;
  const ampA = JOINT_AMP[nameA] ?? 0.8;
  const ampB = JOINT_AMP[nameB] ?? 0.8;
  const color = boneColor(riskA, riskB);

  const lineProps = useAnimatedProps(() => ({
    x1: ax + Math.sin(phase.value + phA) * ampA,
    y1: ay + Math.cos(phase.value * 0.7 + phA + 1) * ampA * 0.6,
    x2: bx + Math.sin(phase.value + phB) * ampB,
    y2: by + Math.cos(phase.value * 0.7 + phB + 1) * ampB * 0.6,
  }));

  return (
    <AnimatedLine
      animatedProps={lineProps}
      stroke={color}
      strokeWidth={3.5}
      strokeLinecap="round"
    />
  );
}

// ── Utility: format mm:ss ───────────────────────────────────────────────────
function fmtTime(ms: number) {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

// ── Main screen ────────────────────────────────────────────────────────────
export default function SkeletonScreen() {
  const { id }        = useLocalSearchParams<{ id: string }>();
  const colors        = useColors();
  const insets        = useSafeAreaInsets();
  const router        = useRouter();
  const videoRef      = useRef<Video>(null);

  const { analyses, videoUris } = useAnalyses();
  const analysis = analyses.find((a) => a.id === id);
  const videoUri = id ? videoUris[id] : undefined;

  // ── Video playback state ──────────────────────────────────────────────
  const [isPlaying,       setIsPlaying]       = useState(true);
  const [positionMs,      setPositionMs]       = useState(0);
  const [durationMs,      setDurationMs]       = useState(1);
  const [scrubberWidth,   setScrubberWidth]    = useState(1);

  function onPlaybackUpdate(s: AVPlaybackStatus) {
    if (!s.isLoaded) return;
    setIsPlaying(s.isPlaying);
    setPositionMs(s.positionMillis ?? 0);
    setDurationMs(s.durationMillis ?? 1);
  }

  function togglePlay() {
    videoRef.current?.setStatusAsync({ shouldPlay: !isPlaying });
  }

  function handleScrubberTouch(e: GestureResponderEvent, finalSeek = false) {
    const x   = Math.max(0, e.nativeEvent.locationX);
    const pct = Math.min(1, x / scrubberWidth);
    const pos = pct * durationMs;
    // Pause while scrubbing for responsiveness
    if (!finalSeek) videoRef.current?.setStatusAsync({ shouldPlay: false });
    videoRef.current?.setPositionAsync(pos);
    if (finalSeek) videoRef.current?.setStatusAsync({ shouldPlay: isPlaying });
  }

  // ── Skeleton animation (Reanimated — UI thread) ───────────────────────
  const phase = useSharedValue(0);

  useEffect(() => {
    phase.value = withRepeat(
      withTiming(Math.PI * 2, { duration: 4000, easing: Easing.linear }),
      -1,
      false,
    );
  }, []);

  // ── Screen orientation ────────────────────────────────────────────────
  const [isLandscape, setIsLandscape] = useState(() => {
    const d = Dimensions.get("window");
    return d.width > d.height;
  });

  useEffect(() => {
    const sub = ScreenOrientation.addOrientationChangeListener((e) => {
      const o = e.orientationInfo.orientation;
      setIsLandscape(
        o === ScreenOrientation.Orientation.LANDSCAPE_LEFT ||
        o === ScreenOrientation.Orientation.LANDSCAPE_RIGHT,
      );
    });
    const dim = Dimensions.addEventListener("change", ({ window }) =>
      setIsLandscape(window.width > window.height),
    );
    return () => {
      ScreenOrientation.removeOrientationChangeListener(sub);
      dim.remove();
    };
  }, []);

  async function toggleOrientation() {
    if (isLandscape) {
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
    } else {
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE_RIGHT);
    }
  }

  useEffect(() => () => { ScreenOrientation.unlockAsync().catch(() => {}); }, []);

  // ── Layout ────────────────────────────────────────────────────────────
  const dims       = Dimensions.get("window");
  const screenW    = dims.width;
  const screenH    = dims.height;
  const topPad     = Platform.OS === "web" ? 67 : insets.top;

  const videoPanelW = isLandscape ? screenW * 0.58 : screenW;
  const videoPanelH = isLandscape ? screenH - 60 : Math.min(300, screenH * 0.38);

  const pose       = POSES[analysis?.sport ?? ""] ?? POSES.weightlifting;
  const riskJoints = analysis ? getRiskJoints(analysis.injuryRisks) : {};

  // ── Score helpers ─────────────────────────────────────────────────────
  const scoreKeys = ["technique", "power", "balance", "consistency"] as const;
  function scoreColor(v: number) {
    if (v >= 80) return "#22c55e";
    if (v >= 65) return "#6c63ff";
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

  const progress = durationMs > 0 ? positionMs / durationMs : 0;

  return (
    <View style={ss.container}>
      {/* ── Header ── */}
      <View style={[ss.header, { paddingTop: topPad + 8 }]}>
        <TouchableOpacity style={ss.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Feather name="chevron-left" size={18} color="#8888aa" />
        </TouchableOpacity>
        <Text style={ss.headerTitle} numberOfLines={1}>{pose.label}</Text>
        <TouchableOpacity style={ss.rotateBtn} onPress={toggleOrientation} activeOpacity={0.8}>
          <Feather name={isLandscape ? "smartphone" : "maximize"} size={13} color="#fff" />
          <Text style={ss.rotateBtnText}>{isLandscape ? "Portrait" : "Landscape"}</Text>
        </TouchableOpacity>
      </View>

      <View style={[ss.body, { flexDirection: isLandscape ? "row" : "column" }]}>

        {/* ── Video + skeleton panel ── */}
        <View style={[ss.videoPanel, { width: videoPanelW, height: isLandscape ? undefined : videoPanelH, flex: isLandscape ? 0 : undefined }]}>

          {videoUri ? (
            <Video
              ref={videoRef}
              source={{ uri: videoUri }}
              style={[ss.video, { width: videoPanelW, height: videoPanelH }]}
              resizeMode={ResizeMode.COVER}
              isLooping
              shouldPlay
              onPlaybackStatusUpdate={onPlaybackUpdate}
            />
          ) : (
            <View style={[ss.noVideo, { width: videoPanelW, height: videoPanelH }]}>
              <Feather name="video" size={36} color="#3a3a5c" />
              <Text style={ss.noVideoText}>Upload a video to see it here</Text>
            </View>
          )}

          {videoUri && <View style={ss.scrim} />}

          {/* ── Animated skeleton SVG overlay ── */}
          <Svg
            style={ss.svgOverlay}
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
              const pa = pose.joints[a];
              const pb = pose.joints[b];
              if (!pa || !pb) return null;
              return (
                <BoneSegment key={i}
                  ax={pa[0]} ay={pa[1]} bx={pb[0]} by={pb[1]}
                  nameA={a} nameB={b} phase={phase}
                  riskA={riskJoints[a] ?? 0}
                  riskB={riskJoints[b] ?? 0}
                />
              );
            })}

            {/* Animated joints */}
            {Object.entries(pose.joints).map(([name, [bx, by]]) => (
              <JointDot
                key={name}
                bx={bx} by={by} name={name}
                phase={phase}
                risk={riskJoints[name]}
              />
            ))}
          </Svg>

          {/* LIVE TRACKING badge */}
          <View style={ss.liveBadge}>
            <View style={ss.liveDot} />
            <Text style={ss.liveText}>LIVE TRACKING</Text>
          </View>

          {/* ── Video controls ── */}
          {videoUri && (
            <View style={ss.controls}>
              <TouchableOpacity onPress={togglePlay} style={ss.playBtn} activeOpacity={0.7}>
                <Feather name={isPlaying ? "pause" : "play"} size={16} color="#fff" />
              </TouchableOpacity>

              <Text style={ss.timeText}>{fmtTime(positionMs)}</Text>

              {/* Scrub bar */}
              <View
                style={ss.scrubBar}
                onLayout={(e) => setScrubberWidth(e.nativeEvent.layout.width)}
                onStartShouldSetResponder={() => true}
                onMoveShouldSetResponder={() => true}
                onResponderGrant={(e) => handleScrubberTouch(e, false)}
                onResponderMove={(e) => handleScrubberTouch(e, false)}
                onResponderRelease={(e) => handleScrubberTouch(e, true)}
              >
                <View style={[ss.scrubFill, { width: `${progress * 100}%` }]} />
                <View style={[ss.scrubThumb, { left: `${progress * 100}%` as any }]} />
              </View>

              <Text style={ss.timeText}>{fmtTime(durationMs)}</Text>
            </View>
          )}
        </View>

        {/* ── Score / risk panel ── */}
        <ScrollView style={ss.infoPanel} showsVerticalScrollIndicator={false}>
          <Text style={ss.poseLabel}>{pose.label}</Text>

          {scoreKeys.map((key) => {
            const val = analysis.scores[key];
            const c   = scoreColor(val);
            return (
              <View key={key} style={ss.scoreRow}>
                <Text style={ss.scoreLabel}>{key}</Text>
                <View style={ss.scoreBarBg}>
                  <View style={[ss.scoreBarFill, { width: `${val}%` as any, backgroundColor: c }]} />
                </View>
                <Text style={[ss.scoreNum, { color: c }]}>{val}</Text>
              </View>
            );
          })}

          {analysis.injuryRisks.length > 0 && (
            <>
              <View style={ss.divider} />
              <Text style={ss.riskTitle}>Joint Risk</Text>
              {analysis.injuryRisks.map((r, i) => {
                const c = r.risk >= 50 ? "#ef4444" : r.risk >= 25 ? "#f59e0b" : "#22c55e";
                return (
                  <View key={i} style={ss.riskItem}>
                    <View style={[ss.riskDot, { backgroundColor: c }]} />
                    <Text style={ss.riskText}>{r.joint}</Text>
                    <Text style={[ss.riskPct, { color: c }]}>{r.risk}%</Text>
                  </View>
                );
              })}
            </>
          )}

          <View style={ss.divider} />
          <View style={ss.legendRow}>
            {[
              { color: "#22c55e", label: "Good" },
              { color: "#f59e0b", label: "Caution 25–49%" },
              { color: "#ef4444", label: "High risk 50%+" },
            ].map((l) => (
              <View key={l.label} style={ss.legendItem}>
                <View style={[ss.legendDot, { backgroundColor: l.color }]} />
                <Text style={ss.legendText}>{l.label}</Text>
              </View>
            ))}
          </View>
          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </View>
  );
}

// ── Static styles (no colors dependency needed here) ──────────────────────
const ss = StyleSheet.create({
  container:    { flex: 1, backgroundColor: "#050508" },
  header:       { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: "#1e1e2e", gap: 12 },
  backBtn:      { width: 36, height: 36, borderRadius: 10, backgroundColor: "#111118", borderWidth: 1, borderColor: "#1e1e2e", alignItems: "center", justifyContent: "center" },
  headerTitle:  { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#f0f0f8", flex: 1 },
  rotateBtn:    { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#6c63ff", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  rotateBtnText:{ fontSize: 12, color: "#fff", fontFamily: "Inter_600SemiBold" },
  body:         { flex: 1 },
  videoPanel:   { backgroundColor: "#07070c", position: "relative", overflow: "hidden", flex: 1 },
  video:        { position: "absolute", top: 0, left: 0 },
  noVideo:      { backgroundColor: "#07070c", alignItems: "center", justifyContent: "center" },
  noVideoText:  { color: "#3a3a5c", fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 8 },
  scrim:        { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(5,5,10,0.42)" },
  svgOverlay:   { position: "absolute", top: 0, left: 0 },
  liveBadge:    { position: "absolute", top: 10, left: 10, flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "rgba(108,99,255,0.85)", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  liveDot:      { width: 6, height: 6, borderRadius: 3, backgroundColor: "#22c55e" },
  liveText:     { fontSize: 10, color: "#fff", fontFamily: "Inter_600SemiBold" },
  // Video controls
  controls:     { position: "absolute", bottom: 0, left: 0, right: 0, flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: "rgba(5,5,12,0.78)" },
  playBtn:      { width: 32, height: 32, borderRadius: 16, backgroundColor: "#6c63ff", alignItems: "center", justifyContent: "center" },
  timeText:     { fontSize: 11, color: "#8888aa", fontFamily: "Inter_400Regular", width: 34, textAlign: "center" },
  scrubBar:     { flex: 1, height: 28, justifyContent: "center", position: "relative" },
  scrubFill:    { height: 4, backgroundColor: "#6c63ff", borderRadius: 2 },
  scrubThumb:   { position: "absolute", width: 14, height: 14, borderRadius: 7, backgroundColor: "#fff", top: 7, marginLeft: -7 },
  // Score panel
  infoPanel:    { flex: 1, padding: 20 },
  poseLabel:    { fontSize: 11, color: "#6c63ff", fontFamily: "Inter_600SemiBold", textTransform: "uppercase", letterSpacing: 1, marginBottom: 16 },
  scoreRow:     { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  scoreLabel:   { fontSize: 12, color: "#8888aa", fontFamily: "Inter_400Regular", width: 90, textTransform: "capitalize" },
  scoreBarBg:   { flex: 1, height: 6, backgroundColor: "#1e1e2e", borderRadius: 3, marginHorizontal: 10 },
  scoreBarFill: { height: 6, borderRadius: 3 },
  scoreNum:     { fontSize: 12, fontFamily: "Inter_600SemiBold", color: "#f0f0f8", width: 28, textAlign: "right" },
  divider:      { height: 1, backgroundColor: "#1e1e2e", marginVertical: 14 },
  riskTitle:    { fontSize: 13, fontFamily: "Inter_600SemiBold", color: "#f0f0f8", marginBottom: 10 },
  riskItem:     { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  riskDot:      { width: 8, height: 8, borderRadius: 4 },
  riskText:     { fontSize: 12, color: "#8888aa", fontFamily: "Inter_400Regular", flex: 1 },
  riskPct:      { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  legendRow:    { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 14 },
  legendItem:   { flexDirection: "row", alignItems: "center", gap: 5 },
  legendDot:    { width: 8, height: 8, borderRadius: 4 },
  legendText:   { fontSize: 10, color: "#8888aa", fontFamily: "Inter_400Regular" },
});
