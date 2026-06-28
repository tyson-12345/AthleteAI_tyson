import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Platform,
  StyleSheet,
  Alert,
  Modal,
  TextInput,
  Switch,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";

import { useAuth, useTier } from "@/lib/authContext";
import { useColors } from "@/hooks/useColors";
import { useTheme } from "@/lib/themeContext";

const SPORTS = [
  "Powerlifting", "Olympic Weightlifting", "Running", "Swimming",
  "Basketball", "Soccer", "Tennis", "Golf", "CrossFit",
  "Gymnastics", "Boxing", "Cycling", "Football", "Baseball",
  "Volleyball", "Martial Arts", "Other",
];

const LEVELS = ["Beginner", "Intermediate", "Advanced", "Elite"];

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, profile, logout, updateProfile } = useAuth();
  const tier = useTier();
  const C = useColors();
  const { isDark, toggleTheme } = useTheme();

  const [editModal, setEditModal] = useState<"name" | "sport" | "level" | "goal" | null>(null);
  const [editValue, setEditValue] = useState("");
  const [saving, setSaving] = useState(false);

  const topPad = Platform.OS === "web" ? 24 : insets.top + 8;
  const bottomPad = Platform.OS === "web" ? 34 + 84 : insets.bottom + 84 + 16;

  const displayName = profile?.name ?? user?.name ?? "Athlete";
  const initials = displayName.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2);

  function openEdit(field: typeof editModal, current: string) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEditValue(current);
    setEditModal(field);
  }

  async function saveEdit(overrideValue?: string) {
    const val = overrideValue ?? editValue.trim();
    if (!val) return;
    setSaving(true);
    try {
      if (editModal === "name") await updateProfile({ name: val });
      else if (editModal === "sport") await updateProfile({ sport: val.toLowerCase() });
      else if (editModal === "level") await updateProfile({ level: val.toLowerCase() as any });
      else if (editModal === "goal") await updateProfile({ weeklyGoal: Number(val) });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      Alert.alert("Couldn't save", "Please try again.");
    } finally {
      setSaving(false);
      setEditModal(null);
    }
  }

  const SPORT_DISPLAY = (profile?.sport ?? "Not set").replace(/\b\w/g, (c) => c.toUpperCase());
  const LEVEL_DISPLAY = (profile?.level ?? "Not set").replace(/\b\w/g, (c) => c.toUpperCase());

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: C.background },
    header: { paddingHorizontal: 20, paddingBottom: 16 },
    pageTitle: { fontFamily: "Archivo_800ExtraBold", fontSize: 28, color: C.textPrimary, letterSpacing: -0.5 },
    identityCard: { flexDirection: "row", alignItems: "center", gap: 16, marginHorizontal: 20, marginBottom: 16, backgroundColor: C.surface2, borderRadius: 20, padding: 16, borderWidth: 1, borderColor: C.border },
    avatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: C.volt + "26", alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: C.volt },
    avatarText: { fontFamily: "Archivo_800ExtraBold", fontSize: 22, color: C.volt },
    avatarEditBadge: { position: "absolute", bottom: -2, right: -2, width: 18, height: 18, borderRadius: 9, backgroundColor: C.volt, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: C.surface2 },
    nameText: { fontFamily: "Inter_700Bold", fontSize: 18, color: C.textPrimary },
    emailText: { fontFamily: "Inter_400Regular", fontSize: 13, color: C.textSecondary, marginTop: 2 },
    tierBadge: { alignSelf: "flex-start", backgroundColor: C.volt + "22", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, marginTop: 6 },
    tierText: { fontFamily: "SpaceMono_700Bold", fontSize: 10, letterSpacing: 1, color: C.volt },
    statsRow: { flexDirection: "row", gap: 10, paddingHorizontal: 20, marginBottom: 16 },
    statCard: { flex: 1, backgroundColor: C.surface2, borderRadius: 16, padding: 14, alignItems: "center", borderWidth: 1, borderColor: C.border },
    statValue: { fontFamily: "Archivo_800ExtraBold", fontSize: 20, color: C.textPrimary, letterSpacing: -0.5 },
    statLabel: { fontFamily: "SpaceMono_700Bold", fontSize: 9, letterSpacing: 1, color: C.textSecondary, marginTop: 4, textAlign: "center" },
    section: { paddingHorizontal: 20, marginBottom: 16 },
    sectionLabel: { fontFamily: "SpaceMono_700Bold", fontSize: 10, letterSpacing: 1.5, color: C.textTertiary, marginBottom: 10 },
    settingsCard: { backgroundColor: C.surface2, borderRadius: 18, borderWidth: 1, borderColor: C.border, overflow: "hidden" },
    settingsRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 14 },
    settingsRowBorder: { borderBottomWidth: 1, borderBottomColor: C.border },
    settingsIcon: { width: 34, height: 34, borderRadius: 10, backgroundColor: C.surface3, alignItems: "center", justifyContent: "center" },
    settingsLabel: { flex: 1, fontFamily: "Inter_500Medium", fontSize: 15, color: C.textPrimary },
    settingsValue: { fontSize: 12, fontFamily: "Inter_400Regular", color: C.textSecondary, marginTop: 1 },
    upgradeCard: { marginHorizontal: 20, marginBottom: 16, backgroundColor: C.volt, borderRadius: 18, padding: 16, flexDirection: "row", alignItems: "center", gap: 12 },
    upgradeTitle: { fontFamily: "Inter_700Bold", fontSize: 14, color: C.ink },
    upgradeSub: { fontFamily: "Inter_400Regular", fontSize: 12, color: "rgba(7,9,11,0.7)", marginTop: 1 },
    signOutBtn: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: C.surface2, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: C.border },
    signOutText: { fontFamily: "Inter_600SemiBold", fontSize: 15, color: C.destructive },
    modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "flex-end" },
    modalCard: { backgroundColor: C.surface2, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: "80%" },
    modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 20 },
    modalTitle: { fontFamily: "Inter_700Bold", fontSize: 17, color: C.textPrimary },
    modalInput: {
      backgroundColor: C.surface3, borderRadius: 12, borderWidth: 1,
      borderColor: C.border, paddingHorizontal: 16, paddingVertical: 14,
      color: C.textPrimary, fontSize: 15, fontFamily: "Inter_400Regular", marginBottom: 16,
    },
    modalSaveBtn: { backgroundColor: C.volt, borderRadius: 14, paddingVertical: 15, alignItems: "center" },
    modalSaveBtnText: { color: C.ink, fontSize: 15, fontFamily: "Inter_700Bold" },
    optionRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 14, paddingHorizontal: 4, borderBottomWidth: 1, borderBottomColor: C.border },
    optionText: { fontFamily: "Inter_500Medium", fontSize: 16, color: C.textSecondary },
    optionTextActive: { color: C.textPrimary, fontFamily: "Inter_600SemiBold" },
  });

  return (
    <View style={s.container}>
      {/* Edit modal */}
      <Modal visible={!!editModal} animationType="slide" transparent>
        <View style={s.modalOverlay}>
          <View style={[s.modalCard, { paddingBottom: insets.bottom + 24 }]}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>
                {editModal === "name" ? "Edit Name"
                  : editModal === "sport" ? "Change Sport"
                  : editModal === "level" ? "Change Level"
                  : "Weekly Goal"}
              </Text>
              <TouchableOpacity onPress={() => setEditModal(null)}>
                <Feather name="x" size={20} color={C.textSecondary} />
              </TouchableOpacity>
            </View>

            {(editModal === "name" || editModal === "goal") && (
              <>
                <TextInput
                  style={s.modalInput}
                  value={editValue}
                  onChangeText={setEditValue}
                  placeholder={editModal === "name" ? "Your name" : "e.g. 4"}
                  placeholderTextColor={C.textTertiary}
                  keyboardType={editModal === "goal" ? "number-pad" : "default"}
                  autoCapitalize={editModal === "name" ? "words" : "none"}
                  autoFocus
                  onSubmitEditing={() => saveEdit()}
                />
                <TouchableOpacity
                  style={[s.modalSaveBtn, saving && { opacity: 0.6 }]}
                  onPress={() => saveEdit()}
                  disabled={saving}
                  activeOpacity={0.85}
                >
                  <Text style={s.modalSaveBtnText}>{saving ? "Saving..." : "Save"}</Text>
                </TouchableOpacity>
              </>
            )}

            {editModal === "sport" && (
              <ScrollView showsVerticalScrollIndicator={false}>
                {SPORTS.map((sport) => {
                  const active = sport.toLowerCase() === profile?.sport;
                  return (
                    <TouchableOpacity
                      key={sport}
                      style={s.optionRow}
                      onPress={() => saveEdit(sport)}
                      activeOpacity={0.75}
                    >
                      <Text style={[s.optionText, active && s.optionTextActive]}>{sport}</Text>
                      {active && <Feather name="check" size={16} color={C.volt} />}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}

            {editModal === "level" && (
              <View>
                {LEVELS.map((level) => {
                  const active = level.toLowerCase() === profile?.level;
                  return (
                    <TouchableOpacity
                      key={level}
                      style={s.optionRow}
                      onPress={() => saveEdit(level)}
                      activeOpacity={0.75}
                    >
                      <Text style={[s.optionText, active && s.optionTextActive]}>{level}</Text>
                      {active && <Feather name="check" size={16} color={C.volt} />}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        </View>
      </Modal>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: bottomPad }}>
        {/* Header */}
        <View style={[s.header, { paddingTop: topPad }]}>
          <Text style={s.pageTitle}>Profile</Text>
        </View>

        {/* Identity card */}
        <View style={s.identityCard}>
          <TouchableOpacity
            style={s.avatar}
            onPress={() => openEdit("name", displayName)}
            activeOpacity={0.85}
          >
            <Text style={s.avatarText}>{initials}</Text>
            <View style={s.avatarEditBadge}>
              <Feather name="edit-2" size={9} color={C.ink} />
            </View>
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <TouchableOpacity onPress={() => openEdit("name", displayName)} activeOpacity={0.7}>
              <Text style={s.nameText}>{displayName}</Text>
            </TouchableOpacity>
            <Text style={s.emailText}>{user?.email ?? ""}</Text>
            <View style={s.tierBadge}>
              <Text style={s.tierText}>{tier === "pro" ? "⚡ Pro" : tier === "elite" ? "👑 Elite" : "Free"}</Text>
            </View>
          </View>
        </View>

        {/* Stats */}
        <View style={s.statsRow}>
          <View style={s.statCard}>
            <Text style={s.statValue}>{profile?.streakDays ?? 0}</Text>
            <Text style={s.statLabel}>DAY STREAK</Text>
          </View>
          <View style={s.statCard}>
            <Text style={s.statValue}>{profile?.weeklyProgress ?? 0}/{profile?.weeklyGoal ?? 3}</Text>
            <Text style={s.statLabel}>THIS WEEK</Text>
          </View>
          <TouchableOpacity style={s.statCard} onPress={() => openEdit("goal", String(profile?.weeklyGoal ?? 3))} activeOpacity={0.75}>
            <Text style={s.statValue}>{profile?.weeklyGoal ?? 3}</Text>
            <Text style={s.statLabel}>WEEKLY GOAL</Text>
            <Feather name="edit-2" size={9} color={C.textTertiary} style={{ marginTop: 3 }} />
          </TouchableOpacity>
        </View>

        {/* Training profile */}
        <View style={s.section}>
          <Text style={s.sectionLabel}>TRAINING PROFILE</Text>
          <View style={s.settingsCard}>
            <TouchableOpacity style={[s.settingsRow, s.settingsRowBorder]} onPress={() => openEdit("sport", profile?.sport ?? "")} activeOpacity={0.7}>
              <View style={s.settingsIcon}><Feather name="target" size={17} color={C.textSecondary} /></View>
              <View style={{ flex: 1 }}>
                <Text style={s.settingsLabel}>Sport</Text>
                <Text style={s.settingsValue}>{SPORT_DISPLAY}</Text>
              </View>
              <Feather name="chevron-right" size={16} color={C.textTertiary} />
            </TouchableOpacity>
            <TouchableOpacity style={s.settingsRow} onPress={() => openEdit("level", profile?.level ?? "")} activeOpacity={0.7}>
              <View style={s.settingsIcon}><Feather name="bar-chart-2" size={17} color={C.textSecondary} /></View>
              <View style={{ flex: 1 }}>
                <Text style={s.settingsLabel}>Level</Text>
                <Text style={s.settingsValue}>{LEVEL_DISPLAY}</Text>
              </View>
              <Feather name="chevron-right" size={16} color={C.textTertiary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Upgrade banner */}
        {tier === "free" && (
          <TouchableOpacity style={s.upgradeCard} onPress={() => router.push("/pricing")} activeOpacity={0.88}>
            <Feather name="zap" size={22} color={C.ink} />
            <View style={{ flex: 1 }}>
              <Text style={s.upgradeTitle}>Upgrade to Pro</Text>
              <Text style={s.upgradeSub}>AI Coach · Unlimited analyses · Priority support</Text>
            </View>
            <Feather name="chevron-right" size={18} color={C.ink} />
          </TouchableOpacity>
        )}

        {/* App settings */}
        <View style={s.section}>
          <Text style={s.sectionLabel}>APP</Text>
          <View style={s.settingsCard}>
            {/* Theme toggle */}
            <View style={[s.settingsRow, s.settingsRowBorder]}>
              <View style={s.settingsIcon}>
                <Feather name={isDark ? "moon" : "sun"} size={17} color={C.textSecondary} />
              </View>
              <Text style={s.settingsLabel}>{isDark ? "Dark Mode" : "Light Mode"}</Text>
              <Switch
                value={isDark}
                onValueChange={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  toggleTheme();
                }}
                trackColor={{ false: C.surface3, true: C.volt }}
                thumbColor={isDark ? C.ink : C.surface4}
                ios_backgroundColor={C.surface3}
              />
            </View>
            {[
              { icon: "bell" as const, label: "Notifications", onPress: () => Alert.alert("Notifications", "Notification settings coming soon.") },
              { icon: "shield" as const, label: "Privacy Policy", onPress: () => Alert.alert("Privacy", "Visit athleteai.app/privacy") },
              { icon: "help-circle" as const, label: "Help & Support", onPress: () => Alert.alert("Support", "Email us at support@athleteai.app") },
              { icon: "info" as const, label: "About AthleteAI", onPress: () => Alert.alert("AthleteAI", "Version 1.0.0\nBuilt with ❤️ for athletes.") },
            ].map((row, i, arr) => (
              <TouchableOpacity
                key={row.label}
                style={[s.settingsRow, i < arr.length - 1 && s.settingsRowBorder]}
                onPress={row.onPress}
                activeOpacity={0.7}
              >
                <View style={s.settingsIcon}>
                  <Feather name={row.icon} size={17} color={C.textSecondary} />
                </View>
                <Text style={s.settingsLabel}>{row.label}</Text>
                <Feather name="chevron-right" size={16} color={C.textTertiary} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Sign out */}
        <View style={s.section}>
          <TouchableOpacity
            style={s.signOutBtn}
            onPress={() => Alert.alert("Sign Out", "Are you sure you want to sign out?", [
              { text: "Cancel", style: "cancel" },
              { text: "Sign Out", style: "destructive", onPress: logout },
            ])}
            activeOpacity={0.8}
          >
            <Feather name="log-out" size={18} color={C.destructive} />
            <Text style={s.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
