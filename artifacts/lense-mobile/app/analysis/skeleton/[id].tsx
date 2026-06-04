import React, { useRef, useState, useEffect, useMemo } from "react";
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
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { Circle, Line, Ellipse, G } from "react-native-svg";
import Svg from "react-native-svg";

import { useAnalyses } from "@/lib/analysesStore";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────
type Pt = [number, number];
type Joints = Record<string, Pt>;
type PoseFrame = { t: number; joints: Joints };

// ─────────────────────────────────────────────────────────────
// Math helpers
// ─────────────────────────────────────────────────────────────
function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }

function lerpJoints(a: Joints, b: Joints, t: number): Joints {
  const out: Joints = {};
  for (const k in a) {
    if (b[k]) out[k] = [lerp(a[k][0], b[k][0], t), lerp(a[k][1], b[k][1], t)];
    else out[k] = [...a[k]];
  }
  return out;
}

function getPoseAt(frames: PoseFrame[], ms: number): Joints {
  if (frames.length === 0) return {};
  const last = frames[frames.length - 1].t;
  const loopMs = last > 0 ? ms % last : 0;
  for (let i = 0; i < frames.length - 1; i++) {
    const fa = frames[i], fb = frames[i + 1];
    if (loopMs >= fa.t && loopMs <= fb.t) {
      const t = (loopMs - fa.t) / (fb.t - fa.t);
      return lerpJoints(fa.joints, fb.joints, t);
    }
  }
  return { ...frames[frames.length - 1].joints };
}

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

// ─────────────────────────────────────────────────────────────
// Basketball pose keyframes  (320 × 400 viewBox, side profile)
// ~3 s loop: triple-threat → crossover → recovery
// ─────────────────────────────────────────────────────────────
const BBALL_FRAMES: PoseFrame[] = [
  // 0 ms: deep triple-threat (crouched)
  { t: 0, joints: {
    head:[170,50], neck:[168,76], spine:[162,108], hip:[158,178], hipL:[148,180],
    shoulderR:[148,105], shoulderL:[182,103],
    elbowR:[124,152], elbowL:[204,128],
    wristR:[138,196], wristL:[210,104],
    kneeR:[140,255], kneeL:[176,252],
    ankleR:[128,328], ankleL:[180,325],
    toeR:[115,346], toeL:[194,343],
  }},
  // 600 ms: start rising, ball coming up
  { t: 600, joints: {
    head:[172,44], neck:[170,70], spine:[165,103], hip:[160,170], hipL:[150,172],
    shoulderR:[150,100], shoulderL:[184,98],
    elbowR:[118,148], elbowL:[208,120],
    wristR:[134,192], wristL:[216,96],
    kneeR:[144,244], kneeL:[178,240],
    ankleR:[130,322], ankleL:[180,318],
    toeR:[116,342], toeL:[195,338],
  }},
  // 1200 ms: more upright
  { t: 1200, joints: {
    head:[173,38], neck:[171,64], spine:[167,98], hip:[163,162], hipL:[152,164],
    shoulderR:[152,95], shoulderL:[186,93],
    elbowR:[122,138], elbowL:[206,118],
    wristR:[130,180], wristL:[212,94],
    kneeR:[150,228], kneeL:[180,226],
    ankleR:[134,314], ankleL:[178,312],
    toeR:[118,334], toeL:[193,332],
  }},
  // 1800 ms: crossover — weight shift left, ball crossing low
  { t: 1800, joints: {
    head:[166,42], neck:[164,68], spine:[160,102], hip:[156,172], hipL:[145,174],
    shoulderR:[143,99], shoulderL:[178,97],
    elbowR:[116,158], elbowL:[198,150],
    wristR:[126,204], wristL:[188,196],
    kneeR:[132,260], kneeL:[172,258],
    ankleR:[118,332], ankleL:[176,330],
    toeR:[104,350], toeL:[191,348],
  }},
  // 2400 ms: ball at left hip, body twisting
  { t: 2400, joints: {
    head:[168,46], neck:[166,72], spine:[161,106], hip:[157,176], hipL:[146,178],
    shoulderR:[146,103], shoulderL:[180,101],
    elbowR:[120,156], elbowL:[166,172],
    wristR:[132,200], wristL:[152,214],
    kneeR:[138,258], kneeL:[174,256],
    ankleR:[124,330], ankleL:[178,328],
    toeR:[110,348], toeL:[192,346],
  }},
  // 3000 ms: back to triple-threat
  { t: 3000, joints: {
    head:[170,50], neck:[168,76], spine:[162,108], hip:[158,178], hipL:[148,180],
    shoulderR:[148,105], shoulderL:[182,103],
    elbowR:[124,152], elbowL:[204,128],
    wristR:[138,196], wristL:[210,104],
    kneeR:[140,255], kneeL:[176,252],
    ankleR:[128,328], ankleL:[180,325],
    toeR:[115,346], toeL:[194,343],
  }},
];

// Running frames
const RUN_FRAMES: PoseFrame[] = [
  { t: 0, joints: {
    head:[165,40], neck:[163,66], spine:[160,100], hip:[156,168], hipL:[168,170],
    shoulderR:[141,93], shoulderL:[183,91],
    elbowR:[112,130], elbowL:[212,118],
    wristR:[92,164], wristL:[230,88],
    kneeR:[168,255], kneeL:[148,232],
    ankleR:[185,325], ankleL:[120,298],
    toeR:[200,345], toeL:[105,315],
  }},
  { t: 500, joints: {
    head:[167,38], neck:[165,64], spine:[162,98], hip:[158,165], hipL:[170,167],
    shoulderR:[143,91], shoulderL:[185,89],
    elbowR:[220,124], elbowL:[108,136],
    wristR:[238,90], wristL:[90,170],
    kneeR:[148,236], kneeL:[170,258],
    ankleR:[120,302], ankleL:[188,328],
    toeR:[105,320], toeL:[204,348],
  }},
  { t: 1000, joints: {
    head:[165,40], neck:[163,66], spine:[160,100], hip:[156,168], hipL:[168,170],
    shoulderR:[141,93], shoulderL:[183,91],
    elbowR:[112,130], elbowL:[212,118],
    wristR:[92,164], wristL:[230,88],
    kneeR:[168,255], kneeL:[148,232],
    ankleR:[185,325], ankleL:[120,298],
    toeR:[200,345], toeL:[105,315],
  }},
];

// Weightlifting frames (deadlift)
const LIFT_FRAMES: PoseFrame[] = [
  { t: 0, joints: {
    head:[162,52], neck:[160,78], spine:[164,112], hip:[166,185], hipL:[178,187],
    shoulderR:[138,105], shoulderL:[184,103],
    elbowR:[112,148], elbowL:[148,152],
    wristR:[100,194], wristL:[138,198],
    kneeR:[170,258], kneeL:[184,260],
    ankleR:[162,332], ankleL:[194,334],
    toeR:[148,350], toeL:[210,352],
  }},
  { t: 800, joints: {
    head:[164,46], neck:[162,72], spine:[166,105], hip:[168,178], hipL:[180,180],
    shoulderR:[140,98], shoulderL:[186,96],
    elbowR:[114,140], elbowL:[150,144],
    wristR:[102,186], wristL:[140,190],
    kneeR:[172,248], kneeL:[186,250],
    ankleR:[162,330], ankleL:[194,332],
    toeR:[148,348], toeL:[210,350],
  }},
  { t: 1600, joints: {
    head:[164,38], neck:[163,63], spine:[165,96], hip:[166,162], hipL:[178,164],
    shoulderR:[140,90], shoulderL:[188,88],
    elbowR:[116,130], elbowL:[148,132],
    wristR:[104,168], wristL:[140,170],
    kneeR:[166,225], kneeL:[182,227],
    ankleR:[160,310], ankleL:[192,312],
    toeR:[146,330], toeL:[208,332],
  }},
  { t: 2400, joints: {
    head:[162,52], neck:[160,78], spine:[164,112], hip:[166,185], hipL:[178,187],
    shoulderR:[138,105], shoulderL:[184,103],
    elbowR:[112,148], elbowL:[148,152],
    wristR:[100,194], wristL:[138,198],
    kneeR:[170,258], kneeL:[184,260],
    ankleR:[162,332], ankleL:[194,334],
    toeR:[148,350], toeL:[210,352],
  }},
];

// Golf frames
const GOLF_FRAMES: PoseFrame[] = [
  { t: 0, joints: {
    head:[160,48], neck:[158,74], spine:[162,108], hip:[164,180], hipL:[176,182],
    shoulderR:[136,102], shoulderL:[182,98],
    elbowR:[110,148], elbowL:[200,148],
    wristR:[138,192], wristL:[196,192],
    kneeR:[160,256], kneeL:[184,252],
    ankleR:[152,330], ankleL:[192,326],
    toeR:[138,348], toeL:[207,344],
  }},
  { t: 1000, joints: {
    head:[162,44], neck:[160,70], spine:[161,103], hip:[162,174], hipL:[175,176],
    shoulderR:[130,96], shoulderL:[186,102],
    elbowR:[100,140], elbowL:[208,156],
    wristR:[88,112], wristL:[198,194],
    kneeR:[162,252], kneeL:[184,250],
    ankleR:[154,326], ankleL:[192,324],
    toeR:[140,344], toeL:[207,342],
  }},
  { t: 2000, joints: {
    head:[160,48], neck:[158,74], spine:[162,108], hip:[164,180], hipL:[176,182],
    shoulderR:[136,102], shoulderL:[182,98],
    elbowR:[110,148], elbowL:[200,148],
    wristR:[138,192], wristL:[196,192],
    kneeR:[160,256], kneeL:[184,252],
    ankleR:[152,330], ankleL:[192,326],
    toeR:[138,348], toeL:[207,344],
  }},
];

function getFrames(sport: string): PoseFrame[] {
  if (sport === "basketball") return BBALL_FRAMES;
  if (sport === "running")    return RUN_FRAMES;
  if (sport === "golf")       return GOLF_FRAMES;
  return LIFT_FRAMES;
}

// ─────────────────────────────────────────────────────────────
// Bone definitions  [jointA, jointB, color-variant]
// cyan = limbs, purple = torso/spine, white = head
// ─────────────────────────────────────────────────────────────
type BoneColor = "cyan" | "purple" | "white";
const BONES: [string, string, BoneColor][] = [
  ["head",      "neck",      "white"],
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

const BONE_COLORS: Record<BoneColor, string> = {
  cyan:   "#06b6d4",
  purple: "#a78bfa",
  white:  "#ffffff99",
};

// Key angles to display: [label, jA, vertex, jB, offset-x, offset-y]
type AngleDef = [string, string, string, string];
const ANGLE_DEFS: AngleDef[] = [
  ["hip",  "spine",  "hip",   "kneeR"],
  ["knee", "hip",    "kneeR", "ankleR"],
  ["elbow","shoulderR","elbowR","wristR"],
];

// ─────────────────────────────────────────────────────────────
// Risk colour helpers
// ─────────────────────────────────────────────────────────────
function riskColor(r?: number) {
  if (!r) return undefined;
  if (r >= 50) return "#ef4444";
  if (r >= 25) return "#f59e0b";
  return "#22c55e";
}

// ─────────────────────────────────────────────────────────────
// Main screen
// ─────────────────────────────────────────────────────────────
export default function SkeletonScreen() {
  const { id }   = useLocalSearchParams<{ id: string }>();
  const insets   = useSafeAreaInsets();
  const router   = useRouter();
  const videoRef = useRef<Video>(null);

  const { analyses, videoUris } = useAnalyses();
  const analysis = analyses.find((a) => a.id === id);
  const videoUri = id ? videoUris[id] : undefined;

  // ── Video state ────────────────────────────────────────────
  const [isLoaded,      setIsLoaded]      = useState(false);
  const [isPlaying,     setIsPlaying]     = useState(true);
  const [positionMs,    setPositionMs]    = useState(0);
  const [durationMs,    setDurationMs]    = useState(3000);
  const [scrubberWidth, setScrubberWidth] = useState(200);
  const [scrubVisualPct, setScrubVisualPct] = useState<number | null>(null);
  const isScrubbing = useRef(false);

  function onPlaybackUpdate(s: AVPlaybackStatus) {
    if (!s.isLoaded) { setIsLoaded(false); return; }
    setIsLoaded(true);
    if (!isScrubbing.current) {
      setIsPlaying(s.isPlaying ?? false);
      setPositionMs(s.positionMillis ?? 0);
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

  function onScrubStart(e: GestureResponderEvent) {
    isScrubbing.current = true;
    videoRef.current?.setStatusAsync({ shouldPlay: false }).catch(() => {});
    setScrubVisualPct(pctFromTouch(e.nativeEvent.locationX));
  }
  function onScrubMove(e: GestureResponderEvent) {
    setScrubVisualPct(pctFromTouch(e.nativeEvent.locationX));
  }
  function onScrubEnd(e: GestureResponderEvent) {
    const pct = pctFromTouch(e.nativeEvent.locationX);
    setScrubVisualPct(null);
    const pos = Math.floor(pct * durationMs);
    setPositionMs(pos);
    videoRef.current?.setPositionAsync(pos)
      .then(() => { if (isPlaying) videoRef.current?.setStatusAsync({ shouldPlay: true }).catch(() => {}); })
      .catch(() => {});
    isScrubbing.current = false;
  }

  // ── Pose driven by video time ──────────────────────────────
  const frames = useMemo(() => getFrames(analysis?.sport ?? ""), [analysis?.sport]);

  // The effective time for pose lookup:
  // while scrubbing use the visual pct × duration, otherwise use positionMs
  const poseMs = scrubVisualPct !== null ? scrubVisualPct * durationMs : positionMs;
  const joints = useMemo(() => getPoseAt(frames, poseMs), [frames, poseMs]);

  // ── Computed joint angles ──────────────────────────────────
  const angles = useMemo(() => {
    return ANGLE_DEFS.map(([label, jA, vertex, jB]) => {
      const a = joints[jA], v = joints[vertex], b = joints[jB];
      if (!a || !v || !b) return null;
      return { label, vertex, deg: calcAngle(a, v, b), x: v[0], y: v[1] };
    }).filter(Boolean) as { label: string; vertex: string; deg: number; x: number; y: number }[];
  }, [joints]);

  // ── Risk map ───────────────────────────────────────────────
  const riskMap: Record<string, number> = useMemo(() => {
    const map: Record<string, number> = {};
    if (!analysis) return map;
    analysis.injuryRisks.forEach(({ joint, risk }) => {
      const j = joint.toLowerCase();
      if (j.includes("lumbar") || j.includes("spine")) { map.spine = risk; map.hip = Math.max(map.hip ?? 0, risk * 0.6); }
      if (j.includes("knee"))  { map.kneeR = risk; map.kneeL = risk; }
      if (j.includes("hip"))   { map.hip = risk; }
      if (j.includes("shoulder")) { map.shoulderR = risk; map.shoulderL = risk; }
      if (j.includes("ankle")) { map.ankleR = risk; map.ankleL = risk; }
      if (j.includes("elbow")) { map.elbowR = risk; map.elbowL = risk; }
      if (j.includes("wrist")) { map.wristR = risk; map.wristL = risk; }
    });
    return map;
  }, [analysis]);

  // ── Glow pulse (Reanimated) ────────────────────────────────
  const glow = useSharedValue(0.4);
  useEffect(() => {
    glow.value = withRepeat(withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) }), -1, true);
  }, []);
  const glowStyle = useAnimatedStyle(() => ({ opacity: glow.value }));

  // ── Orientation ────────────────────────────────────────────
  const [isLandscape, setIsLandscape] = useState(() => {
    const d = Dimensions.get("window");
    return d.width > d.height;
  });
  useEffect(() => {
    const sub = ScreenOrientation.addOrientationChangeListener((e) => {
      const o = e.orientationInfo.orientation;
      setIsLandscape(o === ScreenOrientation.Orientation.LANDSCAPE_LEFT || o === ScreenOrientation.Orientation.LANDSCAPE_RIGHT);
    });
    const dim = Dimensions.addEventListener("change", ({ window }) => setIsLandscape(window.width > window.height));
    return () => { ScreenOrientation.removeOrientationChangeListener(sub); dim.remove(); };
  }, []);
  async function toggleOrientation() {
    try {
      if (isLandscape) await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
      else await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE_RIGHT);
    } catch {}
  }
  useEffect(() => () => { ScreenOrientation.unlockAsync().catch(() => {}); }, []);

  // ── Dimensions ────────────────────────────────────────────
  const dims     = Dimensions.get("window");
  const screenW  = dims.width;
  const screenH  = dims.height;
  const topPad   = Platform.OS === "web" ? 67 : insets.top;
  const videoPanelH = isLandscape ? screenH : Math.min(320, screenH * 0.42);

  const progress  = scrubVisualPct !== null ? scrubVisualPct : (durationMs > 0 ? positionMs / durationMs : 0);
  const thumbLeft = Math.max(0, scrubberWidth * progress - 7);

  const scoreKeys = ["technique", "power", "balance", "consistency"] as const;
  function scoreColor(v: number) { return v >= 80 ? "#22c55e" : v >= 65 ? "#a78bfa" : "#f59e0b"; }

  const SVG_W = 320, SVG_H = 400;

  // ── Video + skeleton panel ─────────────────────────────────
  const VideoPanel = (
    <View style={{ width: screenW, height: videoPanelH, backgroundColor: "#08080f", position: "relative", overflow: "hidden" }}>
      {videoUri ? (
        <Video
          ref={videoRef}
          source={{ uri: videoUri }}
          style={{ position: "absolute", top: 0, left: 0, width: screenW, height: videoPanelH }}
          resizeMode={ResizeMode.COVER}
          isLooping
          shouldPlay
          onPlaybackStatusUpdate={onPlaybackUpdate}
        />
      ) : (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <Feather name="video" size={36} color="#2a2a3c" />
          <Text style={{ color: "#3a3a5c", fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 8 }}>
            Upload a video to see pose tracking
          </Text>
        </View>
      )}

      {/* Dim overlay */}
      {videoUri && <View style={{ position: "absolute", inset: 0, backgroundColor: "rgba(5,5,12,0.38)" }} />}

      {/* ── Skeleton SVG (pose-tracked) ── */}
      <Svg
        style={{ position: "absolute", top: 0, left: 0 }}
        width={screenW}
        height={videoPanelH}
        viewBox={`0 0 ${SVG_W} ${SVG_H}`}
      >
        {/* Bones */}
        {BONES.map(([jA, jB, colorKey], i) => {
          const a = joints[jA], b = joints[jB];
          if (!a || !b) return null;
          const rc = riskColor(Math.max(riskMap[jA] ?? 0, riskMap[jB] ?? 0));
          const color = rc ?? BONE_COLORS[colorKey];
          return (
            <Line
              key={i}
              x1={a[0]} y1={a[1]}
              x2={b[0]} y2={b[1]}
              stroke={color}
              strokeWidth={colorKey === "white" ? 2 : 3.5}
              strokeLinecap="round"
              strokeOpacity={0.92}
            />
          );
        })}

        {/* Joints */}
        {Object.entries(joints).map(([name, [x, y]]) => {
          const rc = riskColor(riskMap[name]);
          const isHead = name === "head";
          const r = isHead ? 12 : 5.5;
          const stroke = rc ?? (name.includes("R") || name.includes("L") && !name.startsWith("h") ? "#06b6d4" : "#a78bfa");
          return (
            <G key={name}>
              <Circle cx={x} cy={y} r={r + 6} fill={stroke + "33"} />
              <Circle cx={x} cy={y} r={r} fill="#06060e" stroke={stroke} strokeWidth={2.5} />
              {isHead && <Circle cx={x} cy={y} r={3} fill="#ffffff" />}
            </G>
          );
        })}

        {/* Joint angle labels */}
        {angles.map(({ label, vertex, deg, x, y }) => {
          const offsetX = vertex === "elbowR" ? -40 : 8;
          const offsetY = vertex === "kneeR"  ?  12 : -18;
          const angleColor = deg < 100 ? "#ef4444" : deg < 130 ? "#f59e0b" : "#06b6d4";
          return (
            <G key={label}>
              {/* Badge background (drawn as rect-ish with the SVG foreignObject would be complex; use circle + text) */}
              <Circle cx={x + offsetX + 20} cy={y + offsetY + 6} r={18} fill="#0c0c18" fillOpacity={0.88} />
              {/* Degree number */}
            </G>
          );
        })}
      </Svg>

      {/* Angle labels rendered as RN Views (easier than SVG foreignObject) */}
      {angles.map(({ label, vertex, deg, x, y }) => {
        const svgScaleX = screenW / SVG_W;
        const svgScaleY = videoPanelH / SVG_H;
        const px = x * svgScaleX;
        const py = y * svgScaleY;
        const ox = vertex === "elbowR" ? -52 : 10;
        const oy = vertex === "kneeR"  ?  14 : -34;
        const angleColor = deg < 100 ? "#ef4444" : deg < 130 ? "#f59e0b" : "#06b6d4";
        return (
          <View key={label} style={{ position: "absolute", left: px + ox, top: py + oy, backgroundColor: "rgba(8,8,20,0.88)", borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3, borderWidth: 1, borderColor: angleColor + "66" }}>
            <Text style={{ fontSize: 13, fontFamily: "Inter_600SemiBold", color: angleColor }}>{deg}°</Text>
          </View>
        );
      })}

      {/* LIVE badge */}
      <View style={{ position: "absolute", top: 10, left: 10, flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "#a78bfa22", borderRadius: 20, borderWidth: 1, borderColor: "#a78bfa55", paddingHorizontal: 10, paddingVertical: 4 }}>
        <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: "#22c55e" }} />
        <Text style={{ fontSize: 10, color: "#a78bfa", fontFamily: "Inter_600SemiBold", letterSpacing: 1 }}>POSE TRACKING</Text>
      </View>

      {/* Landscape: Portrait button */}
      {isLandscape && (
        <TouchableOpacity onPress={toggleOrientation} style={{ position: "absolute", top: 10, right: 10, flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#6c63ff", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 }} activeOpacity={0.8}>
          <Feather name="smartphone" size={13} color="#fff" />
          <Text style={{ fontSize: 12, color: "#fff", fontFamily: "Inter_600SemiBold" }}>Portrait</Text>
        </TouchableOpacity>
      )}

      {/* Playback controls */}
      {videoUri && (
        <View style={ss.controls}>
          <TouchableOpacity onPress={togglePlay} style={ss.playBtn} activeOpacity={0.7}>
            <Feather name={isPlaying ? "pause" : "play"} size={16} color="#fff" />
          </TouchableOpacity>
          <Text style={ss.timeLeft}>{fmtTime(positionMs)}</Text>
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
            <View style={[ss.scrubFill, { width: scrubberWidth * progress }]} />
            <View style={[ss.scrubThumb, { left: thumbLeft }]} />
          </View>
          <Text style={ss.timeRight}>{fmtTime(durationMs)}</Text>
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
      {/* Header — hidden in landscape */}
      {!isLandscape && (
        <View style={[ss.header, { paddingTop: topPad + 8 }]}>
          <TouchableOpacity style={ss.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
            <Feather name="chevron-left" size={18} color="#8888aa" />
          </TouchableOpacity>
          <Text style={ss.headerTitle} numberOfLines={1}>{analysis.sport} · Pose Analysis</Text>
          <TouchableOpacity style={ss.rotateBtn} onPress={toggleOrientation} activeOpacity={0.8}>
            <Feather name="maximize" size={13} color="#fff" />
            <Text style={ss.rotateBtnText}>Fullscreen</Text>
          </TouchableOpacity>
        </View>
      )}

      {isLandscape ? VideoPanel : (
        <View style={{ flex: 1 }}>
          {VideoPanel}
          <ScrollView style={{ flex: 1, paddingHorizontal: 20, paddingTop: 18 }} showsVerticalScrollIndicator={false}>
            {/* Angle summary */}
            <Text style={ss.sectionTitle}>JOINT ANGLES</Text>
            <View style={{ flexDirection: "row", gap: 10, marginBottom: 18 }}>
              {angles.map(({ label, deg }) => {
                const c = deg < 100 ? "#ef4444" : deg < 130 ? "#f59e0b" : "#06b6d4";
                return (
                  <View key={label} style={{ flex: 1, backgroundColor: "#0f0f1a", borderRadius: 12, padding: 12, alignItems: "center", borderWidth: 1, borderColor: c + "44" }}>
                    <Text style={{ fontSize: 22, fontFamily: "Inter_700Bold", color: c }}>{deg}°</Text>
                    <Text style={{ fontSize: 10, color: "#8888aa", fontFamily: "Inter_400Regular", textTransform: "capitalize", marginTop: 2 }}>{label}</Text>
                  </View>
                );
              })}
            </View>

            {/* Scores */}
            <Text style={ss.sectionTitle}>PERFORMANCE SCORES</Text>
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

            {/* Injury risks */}
            {analysis.injuryRisks.length > 0 && (
              <>
                <View style={ss.divider} />
                <Text style={ss.sectionTitle}>JOINT RISK</Text>
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

            {/* Legend */}
            <View style={ss.divider} />
            <View style={ss.legendRow}>
              {[{ color: "#06b6d4", label: "Limb bones" }, { color: "#a78bfa", label: "Spine / torso" }, { color: "#22c55e", label: "Good range" }, { color: "#ef4444", label: "High risk" }].map((l) => (
                <View key={l.label} style={ss.legendItem}>
                  <View style={[ss.legendDot, { backgroundColor: l.color }]} />
                  <Text style={ss.legendText}>{l.label}</Text>
                </View>
              ))}
            </View>
            <View style={{ height: 48 }} />
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const ss = StyleSheet.create({
  header:        { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: "#1a1a28", gap: 12 },
  backBtn:       { width: 36, height: 36, borderRadius: 10, backgroundColor: "#111118", borderWidth: 1, borderColor: "#1a1a28", alignItems: "center", justifyContent: "center" },
  headerTitle:   { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#f0f0f8", flex: 1, textTransform: "capitalize" },
  rotateBtn:     { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#6c63ff", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  rotateBtnText: { fontSize: 12, color: "#fff", fontFamily: "Inter_600SemiBold" },
  // Controls
  controls:      { position: "absolute", bottom: 0, left: 0, right: 0, flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 14, paddingVertical: 12, backgroundColor: "rgba(5,5,12,0.86)" },
  playBtn:       { width: 34, height: 34, borderRadius: 17, backgroundColor: "#6c63ff", alignItems: "center", justifyContent: "center" },
  timeLeft:      { fontSize: 11, color: "#c0c0d8", fontFamily: "Inter_400Regular", minWidth: 32 },
  timeRight:     { fontSize: 11, color: "#c0c0d8", fontFamily: "Inter_400Regular", minWidth: 32, textAlign: "right" },
  scrubOuter:    { flex: 1, height: 28, position: "relative", justifyContent: "center" },
  scrubTrack:    { position: "absolute", left: 0, right: 0, height: 4, backgroundColor: "#2a2a44", borderRadius: 2 },
  scrubFill:     { position: "absolute", left: 0, height: 4, backgroundColor: "#6c63ff", borderRadius: 2 },
  scrubThumb:    { position: "absolute", width: 14, height: 14, borderRadius: 7, backgroundColor: "#ffffff", top: 7 },
  // Portrait info panel
  sectionTitle:  { fontSize: 10, color: "#8888aa", fontFamily: "Inter_600SemiBold", letterSpacing: 1.5, marginBottom: 10 },
  scoreRow:      { flexDirection: "row", alignItems: "center", marginBottom: 11 },
  scoreLabel:    { fontSize: 12, color: "#8888aa", fontFamily: "Inter_400Regular", width: 88, textTransform: "capitalize" },
  scoreBarBg:    { flex: 1, height: 5, backgroundColor: "#1a1a28", borderRadius: 3, marginHorizontal: 10 },
  scoreBarFill:  { height: 5, borderRadius: 3 },
  scoreNum:      { fontSize: 12, fontFamily: "Inter_600SemiBold", width: 26, textAlign: "right" },
  divider:       { height: 1, backgroundColor: "#1a1a28", marginVertical: 14 },
  riskItem:      { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  riskDot:       { width: 8, height: 8, borderRadius: 4 },
  riskText:      { fontSize: 12, color: "#8888aa", fontFamily: "Inter_400Regular", flex: 1 },
  riskPct:       { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  legendRow:     { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  legendItem:    { flexDirection: "row", alignItems: "center", gap: 5 },
  legendDot:     { width: 8, height: 8, borderRadius: 4 },
  legendText:    { fontSize: 10, color: "#8888aa", fontFamily: "Inter_400Regular" },
});
