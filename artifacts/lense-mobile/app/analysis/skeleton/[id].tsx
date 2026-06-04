import React, { useRef, useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  useWindowDimensions,
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
  withRepeat,
  withTiming,
  Easing,
  useAnimatedProps,
} from "react-native-reanimated";
import { Circle, Line } from "react-native-svg";
import Svg, { G } from "react-native-svg";

import { useAnalyses } from "@/lib/analysesStore";

// ─── Types ────────────────────────────────────────────────────────────────────
type Pt = readonly [number, number];
type Joints = Record<string, Pt>;

// ─── Math ─────────────────────────────────────────────────────────────────────
function calcAngle(a: Pt, v: Pt, b: Pt): number {
  const ax = a[0] - v[0], ay = a[1] - v[1];
  const bx = b[0] - v[0], by = b[1] - v[1];
  const dot = ax * bx + ay * by;
  const mag = Math.sqrt(ax * ax + ay * ay) * Math.sqrt(bx * bx + by * by);
  if (mag === 0) return 0;
  return Math.round((Math.acos(Math.min(1, Math.max(-1, dot / mag))) * 180) / Math.PI);
}

function fmtTime(ms: number) {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

// ─── Sport base poses ─────────────────────────────────────────────────────────
// One canonical pose per sport. Each joint is [x, y] in a 320×400 viewBox.
// The skeleton sits roughly centered on where an athlete appears in a typical
// training video (centered horizontally, upper-mid frame vertically).
// A very subtle breathing animation (±2-3 px) is applied on top via Reanimated
// so the overlay looks "live" without oscillating wildly.

const SPORT_POSES: Record<string, Joints> = {
  basketball: {
    // Triple-threat stance (crouched, ball low right side)
    head:      [160, 54],
    neck:      [160, 80],
    spine:     [158, 115],
    hip:       [152, 188],
    hipL:      [170, 190],
    shoulderR: [138, 108],
    shoulderL: [182, 106],
    elbowR:    [116, 152],
    elbowL:    [200, 134],
    wristR:    [132, 196],
    wristL:    [210, 108],
    kneeR:     [136, 264],
    kneeL:     [176, 260],
    ankleR:    [124, 336],
    ankleL:    [182, 332],
    toeR:      [110, 352],
    toeL:      [196, 348],
  },
  running: {
    // Mid-stride (drive phase)
    head:      [162, 46],
    neck:      [160, 72],
    spine:     [158, 106],
    hip:       [154, 175],
    hipL:      [172, 177],
    shoulderR: [138, 98],
    shoulderL: [184, 96],
    elbowR:    [112, 134],
    elbowL:    [208, 124],
    wristR:    [92,  168],
    wristL:    [228, 92],
    kneeR:     [166, 256],
    kneeL:     [148, 234],
    ankleR:    [184, 326],
    ankleL:    [120, 298],
    toeR:      [198, 346],
    toeL:      [105, 315],
  },
  weightlifting: {
    // Deadlift lockout (standing tall, bar at hips)
    head:      [160, 48],
    neck:      [160, 74],
    spine:     [161, 108],
    hip:       [156, 178],
    hipL:      [172, 180],
    shoulderR: [138, 102],
    shoulderL: [184, 100],
    elbowR:    [116, 146],
    elbowL:    [150, 148],
    wristR:    [104, 194],
    wristL:    [142, 196],
    kneeR:     [150, 258],
    kneeL:     [174, 260],
    ankleR:    [144, 332],
    ankleL:    [180, 334],
    toeR:      [130, 350],
    toeL:      [194, 352],
  },
  golf: {
    // Address position (bent at hips, arms hanging)
    head:      [162, 52],
    neck:      [160, 78],
    spine:     [160, 112],
    hip:       [156, 182],
    hipL:      [174, 184],
    shoulderR: [136, 104],
    shoulderL: [184, 102],
    elbowR:    [112, 150],
    elbowL:    [202, 150],
    wristR:    [140, 196],
    wristL:    [198, 196],
    kneeR:     [152, 258],
    kneeL:     [178, 256],
    ankleR:    [146, 332],
    ankleL:    [184, 330],
    toeR:      [132, 350],
    toeL:      [198, 348],
  },
};

function getPose(sport: string): Joints {
  return SPORT_POSES[sport] ?? SPORT_POSES.weightlifting;
}

// ─── Bone definitions ─────────────────────────────────────────────────────────
type BoneKind = "cyan" | "purple" | "dim";
const BONES: [string, string, BoneKind][] = [
  ["head",      "neck",      "dim"],
  ["neck",      "spine",     "purple"],
  ["spine",     "hip",       "purple"],
  ["spine",     "hipL",      "purple"],
  ["hip",       "hipL",      "purple"],
  ["neck",      "shoulderR", "purple"],
  ["neck",      "shoulderL", "purple"],
  ["shoulderR", "elbowR",    "cyan"],
  ["elbowR",    "wristR",    "cyan"],
  ["shoulderL", "elbowL",    "cyan"],
  ["elbowL",    "wristL",    "cyan"],
  ["hip",       "kneeR",     "cyan"],
  ["kneeR",     "ankleR",    "cyan"],
  ["ankleR",    "toeR",      "cyan"],
  ["hipL",      "kneeL",     "cyan"],
  ["kneeL",     "ankleL",    "cyan"],
  ["ankleL",    "toeL",      "cyan"],
];

const BONE_COLOR: Record<BoneKind, string> = {
  cyan:   "#06b6d4",
  purple: "#a78bfa",
  dim:    "#ffffff88",
};

// ─── Risk helpers ─────────────────────────────────────────────────────────────
function riskColor(r: number) {
  if (r >= 50) return "#ef4444";
  if (r >= 25) return "#f59e0b";
  if (r > 0)   return "#22c55e";
  return null;
}

// ─── Animated joint ───────────────────────────────────────────────────────────
// Each joint oscillates ±amp pixels around its base position.
// The phase offset staggers joints so they don't all pulse together.
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

function JointDot({
  bx, by, amp, phaseOffset, breathe, stroke,
}: {
  bx: number; by: number; amp: number; phaseOffset: number;
  breathe: Animated.SharedValue<number>; stroke: string;
}) {
  const props = useAnimatedProps(() => {
    const t = breathe.value + phaseOffset;
    return {
      cx: bx + Math.sin(t) * amp * 0.6,
      cy: by + Math.cos(t * 0.8) * amp,
    };
  });
  return (
    <>
      <AnimatedCircle animatedProps={props} r={9} fill={stroke + "28"} />
      <AnimatedCircle animatedProps={props} r={5.5} fill="#06060e" stroke={stroke} strokeWidth={2.5} />
    </>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function SkeletonScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { width: screenW, height: screenH } = useWindowDimensions(); // auto-updates on rotate
  const videoRef = useRef<Video>(null);

  const { analyses, videoUris } = useAnalyses();
  const analysis = analyses.find((a) => a.id === id);
  const videoUri = id ? videoUris[id] : undefined;

  const isLandscape = screenW > screenH;
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  // ── Video state ────────────────────────────────────────────────────────────
  const [isLoaded,      setIsLoaded]      = useState(false);
  const [isPlaying,     setIsPlaying]     = useState(true);
  const [positionMs,    setPositionMs]    = useState(0);
  const [durationMs,    setDurationMs]    = useState(1);
  const [scrubberWidth, setScrubberWidth] = useState(200);

  // Visual pct drives the scrubber display; a throttle lets us seek live
  const [displayPct, setDisplayPct] = useState(0);
  const lastSeekTime = useRef(0);
  const SEEK_THROTTLE = 120; // ms — seek at most ~8 fps during drag
  const isScrubbing = useRef(false);

  function onPlaybackUpdate(s: AVPlaybackStatus) {
    if (!s.isLoaded) { setIsLoaded(false); return; }
    setIsLoaded(true);
    if (!isScrubbing.current) {
      setIsPlaying(s.isPlaying ?? false);
      const pos = s.positionMillis ?? 0;
      setPositionMs(pos);
      setDisplayPct(durationMs > 1 ? pos / durationMs : 0);
    }
    if (s.durationMillis && s.durationMillis > 0) setDurationMs(s.durationMillis);
  }

  function togglePlay() {
    if (!isLoaded) return;
    videoRef.current?.setStatusAsync({ shouldPlay: !isPlaying }).catch(() => {});
  }

  function pctFromTouch(x: number) {
    return Math.max(0, Math.min(1, x / Math.max(1, scrubberWidth)));
  }

  function seekToPct(pct: number) {
    const pos = Math.floor(pct * durationMs);
    setPositionMs(pos);
    videoRef.current?.setPositionAsync(pos).catch(() => {});
  }

  function onScrubStart(e: GestureResponderEvent) {
    isScrubbing.current = true;
    const pct = pctFromTouch(e.nativeEvent.locationX);
    setDisplayPct(pct);
    // Pause while scrubbing for smoother frame-by-frame
    videoRef.current?.setStatusAsync({ shouldPlay: false }).catch(() => {});
    seekToPct(pct);
    lastSeekTime.current = Date.now();
  }

  function onScrubMove(e: GestureResponderEvent) {
    const pct = pctFromTouch(e.nativeEvent.locationX);
    setDisplayPct(pct); // always update UI immediately
    const now = Date.now();
    if (now - lastSeekTime.current >= SEEK_THROTTLE) {
      lastSeekTime.current = now;
      seekToPct(pct);   // throttled actual seek
    }
  }

  function onScrubEnd(e: GestureResponderEvent) {
    const pct = pctFromTouch(e.nativeEvent.locationX);
    setDisplayPct(pct);
    seekToPct(pct);
    isScrubbing.current = false;
    if (isPlaying) videoRef.current?.setStatusAsync({ shouldPlay: true }).catch(() => {});
  }

  // ── Orientation ────────────────────────────────────────────────────────────
  async function toggleOrientation() {
    try {
      if (isLandscape) await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
      else await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE_RIGHT);
    } catch {}
  }
  useEffect(() => () => { ScreenOrientation.unlockAsync().catch(() => {}); }, []);

  // ── Breathing animation (very subtle ±2px) ─────────────────────────────────
  const breathe = useSharedValue(0);
  useEffect(() => {
    breathe.value = withRepeat(
      withTiming(Math.PI * 2, { duration: 3600, easing: Easing.linear }),
      -1, false,
    );
  }, []);

  // ── Pose & risk ────────────────────────────────────────────────────────────
  const pose = useMemo(() => getPose(analysis?.sport ?? ""), [analysis?.sport]);

  const riskMap = useMemo<Record<string, number>>(() => {
    const map: Record<string, number> = {};
    if (!analysis) return map;
    analysis.injuryRisks.forEach(({ joint, risk }) => {
      const j = joint.toLowerCase();
      if (j.includes("lumbar") || j.includes("spine")) { map.spine = risk; }
      if (j.includes("knee"))     { map.kneeR = risk; map.kneeL = risk; }
      if (j.includes("hip"))      { map.hip = risk; map.hipL = risk; }
      if (j.includes("shoulder")) { map.shoulderR = risk; map.shoulderL = risk; }
      if (j.includes("ankle"))    { map.ankleR = risk; map.ankleL = risk; }
      if (j.includes("elbow"))    { map.elbowR = risk; map.elbowL = risk; }
      if (j.includes("wrist"))    { map.wristR = risk; map.wristL = risk; }
    });
    return map;
  }, [analysis]);

  // ── Joint angles ───────────────────────────────────────────────────────────
  const angles = useMemo(() => {
    const defs: [string, string, string, string][] = [
      ["Hip",   "spine",     "hip",   "kneeR"],
      ["Knee",  "hip",       "kneeR", "ankleR"],
      ["Elbow", "shoulderR", "elbowR","wristR"],
    ];
    return defs.map(([label, jA, vertex, jB]) => {
      const a = pose[jA], v = pose[vertex], b = pose[jB];
      if (!a || !v || !b) return null;
      return { label, vertex, deg: calcAngle(a, v, b), x: v[0], y: v[1] };
    }).filter(Boolean) as { label: string; vertex: string; deg: number; x: number; y: number }[];
  }, [pose]);

  // ── Derived dimensions ─────────────────────────────────────────────────────
  const videoPanelH = isLandscape ? screenH : Math.min(330, screenH * 0.44);
  const thumbLeft   = Math.max(0, scrubberWidth * displayPct - 7);

  const SVG_W = 320, SVG_H = 400;

  // Per-joint amplitude & phase so breathing looks organic
  const JOINT_AMP: Record<string, number> = {
    head:2.2, neck:1.4, spine:0.9, hip:1.0, hipL:1.0,
    shoulderR:1.6, shoulderL:1.6, elbowR:2.1, elbowL:2.1,
    wristR:2.8, wristL:2.8, kneeR:1.2, kneeL:1.2,
    ankleR:0.6, ankleL:0.6, toeR:0.4, toeL:0.4,
  };
  const JOINT_PHASE: Record<string, number> = {
    head:0, neck:0.3, spine:0.1, hip:0.5, hipL:0.7,
    shoulderR:1.2, shoulderL:0.8, elbowR:1.8, elbowL:1.4,
    wristR:2.4, wristL:2.0, kneeR:1.1, kneeL:1.3,
    ankleR:1.7, ankleL:1.9, toeR:2.0, toeL:2.2,
  };

  function jointStroke(name: string) {
    const rc = riskColor(riskMap[name] ?? 0);
    if (rc) return rc;
    return name.endsWith("R") || name.endsWith("L") ? "#06b6d4" : "#a78bfa";
  }

  const scoreKeys = ["technique", "power", "balance", "consistency"] as const;
  function scoreColor(v: number) { return v >= 80 ? "#22c55e" : v >= 65 ? "#a78bfa" : "#f59e0b"; }

  // ── Video + skeleton panel ─────────────────────────────────────────────────
  const VideoPanel = (
    <View style={{ width: screenW, height: videoPanelH, backgroundColor: "#06060e", overflow: "hidden", position: "relative" }}>
      {videoUri ? (
        <Video
          ref={videoRef}
          source={{ uri: videoUri }}
          style={{ position: "absolute", top: 0, left: 0, width: screenW, height: videoPanelH }}
          resizeMode={isLandscape ? ResizeMode.CONTAIN : ResizeMode.COVER}
          isLooping
          shouldPlay
          onPlaybackStatusUpdate={onPlaybackUpdate}
        />
      ) : (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <Feather name="video" size={40} color="#1e1e2e" />
          <Text style={{ color: "#3a3a5c", fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 10 }}>
            Upload a video to see pose tracking
          </Text>
        </View>
      )}

      {/* Subtle dark overlay so skeleton lines pop */}
      {videoUri && <View style={{ position: "absolute", inset: 0, backgroundColor: "rgba(4,4,12,0.35)" }} />}

      {/* ── Skeleton SVG ── */}
      <Svg
        style={{ position: "absolute", top: 0, left: 0 }}
        width={screenW}
        height={videoPanelH}
        viewBox={`0 0 ${SVG_W} ${SVG_H}`}
      >
        {/* Bones (static positions from base pose — no jitter) */}
        {BONES.map(([jA, jB, kind], i) => {
          const a = pose[jA], b = pose[jB];
          if (!a || !b) return null;
          const rc = riskColor(Math.max(riskMap[jA] ?? 0, riskMap[jB] ?? 0));
          const color = rc ?? BONE_COLOR[kind];
          return (
            <Line
              key={i}
              x1={a[0]} y1={a[1]}
              x2={b[0]} y2={b[1]}
              stroke={color}
              strokeWidth={kind === "dim" ? 2 : 3.5}
              strokeLinecap="round"
              strokeOpacity={0.9}
            />
          );
        })}

        {/* Joints (subtle breathing animation via Reanimated) */}
        {Object.entries(pose).map(([name, [bx, by]]) => (
          <G key={name}>
            <JointDot
              bx={bx} by={by}
              amp={JOINT_AMP[name] ?? 1}
              phaseOffset={JOINT_PHASE[name] ?? 0}
              breathe={breathe}
              stroke={jointStroke(name)}
            />
          </G>
        ))}
      </Svg>

      {/* Angle labels (RN views — easier than SVG foreignObject) */}
      {angles.map(({ label, vertex, deg, x, y }) => {
        const sx = screenW / SVG_W, sy = videoPanelH / SVG_H;
        const px = x * sx, py = y * sy;
        const ox = vertex === "elbowR" ? -54 : vertex === "kneeR" ? 10 : -48;
        const oy = vertex === "kneeR"  ?  10 : -34;
        const c  = deg < 100 ? "#ef4444" : deg < 130 ? "#f59e0b" : "#06b6d4";
        return (
          <View key={label} style={{ position: "absolute", left: px + ox, top: py + oy, backgroundColor: "rgba(6,6,14,0.90)", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: c + "77" }}>
            <Text style={{ fontSize: 14, fontFamily: "Inter_600SemiBold", color: c }}>{deg}°</Text>
          </View>
        );
      })}

      {/* POSE TRACKING badge */}
      <View style={{ position: "absolute", top: 10, left: 10, flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "#06060e99", borderRadius: 20, borderWidth: 1, borderColor: "#a78bfa44", paddingHorizontal: 10, paddingVertical: 4 }}>
        <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: "#22c55e" }} />
        <Text style={{ fontSize: 10, color: "#a78bfa", fontFamily: "Inter_600SemiBold", letterSpacing: 1 }}>POSE TRACKING</Text>
      </View>

      {/* Portrait button (landscape only) */}
      {isLandscape && (
        <TouchableOpacity onPress={toggleOrientation} style={{ position: "absolute", top: 10, right: 10 + (insets.right ?? 0), flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#6c63ff", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 }} activeOpacity={0.8}>
          <Feather name="smartphone" size={13} color="#fff" />
          <Text style={{ fontSize: 12, color: "#fff", fontFamily: "Inter_600SemiBold" }}>Portrait</Text>
        </TouchableOpacity>
      )}

      {/* Playback controls */}
      {videoUri && (
        <View style={ss.controls}>
          <TouchableOpacity onPress={togglePlay} style={ss.playBtn} activeOpacity={0.7}>
            <Feather name={isPlaying && !isScrubbing.current ? "pause" : "play"} size={16} color="#fff" />
          </TouchableOpacity>
          <Text style={ss.timeLabel}>{fmtTime(positionMs)}</Text>
          <View
            style={ss.scrubOuter}
            onLayout={(e) => setScrubberWidth(e.nativeEvent.layout.width)}
            onStartShouldSetResponder={() => true}
            onMoveShouldSetResponder={() => true}
            onResponderGrant={onScrubStart}
            onResponderMove={onScrubMove}
            onResponderRelease={onScrubEnd}
          >
            <View style={ss.scrubTrack} />
            <View style={[ss.scrubFill, { width: scrubberWidth * displayPct }]} />
            <View style={[ss.scrubThumb, { left: thumbLeft }]} />
          </View>
          <Text style={[ss.timeLabel, { textAlign: "right" }]}>{fmtTime(durationMs)}</Text>
        </View>
      )}
    </View>
  );

  if (!analysis) {
    return (
      <View style={{ flex: 1, backgroundColor: "#06060e", alignItems: "center", justifyContent: "center" }}>
        <TouchableOpacity onPress={() => router.back()} style={{ position: "absolute", top: topPad + 8, left: 20 }}>
          <Feather name="chevron-left" size={24} color="#8888aa" />
        </TouchableOpacity>
        <Text style={{ color: "#8888aa", fontFamily: "Inter_400Regular" }}>Analysis not found</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#06060e" }}>
      {!isLandscape && (
        <View style={[ss.header, { paddingTop: topPad + 8 }]}>
          <TouchableOpacity style={ss.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
            <Feather name="chevron-left" size={18} color="#8888aa" />
          </TouchableOpacity>
          <Text style={ss.headerTitle} numberOfLines={1} textBreakStrategy="simple">
            {analysis.sport} · Pose Analysis
          </Text>
          <TouchableOpacity style={ss.rotateBtn} onPress={toggleOrientation} activeOpacity={0.8}>
            <Feather name="maximize" size={13} color="#fff" />
            <Text style={ss.rotateBtnText}>Fullscreen</Text>
          </TouchableOpacity>
        </View>
      )}

      {isLandscape ? (
        VideoPanel
      ) : (
        <View style={{ flex: 1 }}>
          {VideoPanel}
          <ScrollView style={{ flex: 1, paddingHorizontal: 20, paddingTop: 18 }} showsVerticalScrollIndicator={false}>

            {/* Joint angle cards */}
            <Text style={ss.sectionTitle}>JOINT ANGLES</Text>
            <View style={{ flexDirection: "row", gap: 10, marginBottom: 20 }}>
              {angles.map(({ label, deg }) => {
                const c = deg < 100 ? "#ef4444" : deg < 130 ? "#f59e0b" : "#06b6d4";
                return (
                  <View key={label} style={{ flex: 1, backgroundColor: "#0d0d1a", borderRadius: 12, padding: 12, alignItems: "center", borderWidth: 1, borderColor: c + "44" }}>
                    <Text style={{ fontSize: 24, fontFamily: "Inter_700Bold", color: c }}>{deg}°</Text>
                    <Text style={{ fontSize: 10, color: "#8888aa", fontFamily: "Inter_400Regular", textTransform: "capitalize", marginTop: 3 }}>{label}</Text>
                  </View>
                );
              })}
            </View>

            {/* Scores */}
            <Text style={ss.sectionTitle}>PERFORMANCE</Text>
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
                <Text style={ss.sectionTitle}>JOINT RISK</Text>
                {analysis.injuryRisks.map((r, i) => {
                  const c = r.risk >= 50 ? "#ef4444" : r.risk >= 25 ? "#f59e0b" : "#22c55e";
                  return (
                    <View key={i} style={ss.riskRow}>
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
              {[{ c: "#06b6d4", l: "Limb bones" }, { c: "#a78bfa", l: "Spine/torso" }, { c: "#22c55e", l: "Good" }, { c: "#ef4444", l: "High risk" }].map((x) => (
                <View key={x.l} style={ss.legendItem}>
                  <View style={[ss.legendDot, { backgroundColor: x.c }]} />
                  <Text style={ss.legendText}>{x.l}</Text>
                </View>
              ))}
            </View>
            <View style={{ height: 50 }} />
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const ss = StyleSheet.create({
  header:       { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: "#18182a", gap: 12 },
  backBtn:      { width: 36, height: 36, borderRadius: 10, backgroundColor: "#111118", borderWidth: 1, borderColor: "#18182a", alignItems: "center", justifyContent: "center" },
  headerTitle:  { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#f0f0f8", flex: 1, textTransform: "capitalize" },
  rotateBtn:    { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#6c63ff", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  rotateBtnText:{ fontSize: 12, color: "#fff", fontFamily: "Inter_600SemiBold" },

  controls:     { position: "absolute", bottom: 0, left: 0, right: 0, flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 14, paddingVertical: 12, backgroundColor: "rgba(4,4,12,0.88)" },
  playBtn:      { width: 34, height: 34, borderRadius: 17, backgroundColor: "#6c63ff", alignItems: "center", justifyContent: "center" },
  timeLabel:    { fontSize: 11, color: "#c0c0d8", fontFamily: "Inter_400Regular", minWidth: 32 },
  scrubOuter:   { flex: 1, height: 28, position: "relative", justifyContent: "center" },
  scrubTrack:   { position: "absolute", left: 0, right: 0, height: 4, backgroundColor: "#2a2a44", borderRadius: 2 },
  scrubFill:    { position: "absolute", left: 0, height: 4, backgroundColor: "#6c63ff", borderRadius: 2 },
  scrubThumb:   { position: "absolute", width: 14, height: 14, borderRadius: 7, backgroundColor: "#ffffff", top: 7 },

  sectionTitle: { fontSize: 10, color: "#8888aa", fontFamily: "Inter_600SemiBold", letterSpacing: 1.5, marginBottom: 10 },
  scoreRow:     { flexDirection: "row", alignItems: "center", marginBottom: 11 },
  scoreLabel:   { fontSize: 12, color: "#8888aa", fontFamily: "Inter_400Regular", width: 88, textTransform: "capitalize" },
  scoreBarBg:   { flex: 1, height: 5, backgroundColor: "#18182a", borderRadius: 3, marginHorizontal: 10 },
  scoreBarFill: { height: 5, borderRadius: 3 },
  scoreNum:     { fontSize: 12, fontFamily: "Inter_600SemiBold", width: 26, textAlign: "right" },
  divider:      { height: 1, backgroundColor: "#18182a", marginVertical: 14 },
  riskRow:      { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  riskDot:      { width: 8, height: 8, borderRadius: 4 },
  riskText:     { fontSize: 12, color: "#8888aa", fontFamily: "Inter_400Regular", flex: 1 },
  riskPct:      { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  legendRow:    { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  legendItem:   { flexDirection: "row", alignItems: "center", gap: 5 },
  legendDot:    { width: 8, height: 8, borderRadius: 4 },
  legendText:   { fontSize: 10, color: "#8888aa", fontFamily: "Inter_400Regular" },
});
