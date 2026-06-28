import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
  Alert,
  Animated,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { chat as chatApi, type ChatRecord, ApiError } from "@/lib/api";
import { useCanAccessFeature } from "@/lib/authContext";
import { useColors } from "@/hooks/useColors";

const QUICK_PROMPTS = [
  "How do I improve my technique?",
  "What's my biggest weakness?",
  "Give me a drill for today",
  "How do I prevent injury?",
  "Explain my latest scores",
];

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const canChat = useCanAccessFeature("aiChat");
  const C = useColors();

  const [messages, setMessages] = useState<ChatRecord[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const inputRef = useRef<TextInput>(null);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 + 84 : insets.bottom + 84 + 4;

  const loadHistory = useCallback(async () => {
    if (!canChat) { setLoading(false); return; }
    try {
      const { messages: msgs } = await chatApi.history();
      setMessages(msgs);
    } catch {
      // ignore network errors — show empty state
    } finally {
      setLoading(false);
    }
  }, [canChat]);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  async function sendMessage(text?: string) {
    const content = (text ?? input).trim();
    if (!content || sending) return;
    setInput("");

    const optimistic: ChatRecord = {
      id: `tmp-${Date.now()}`,
      role: "user",
      content,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);
    setSending(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      const { userMessage, assistantMessage } = await chatApi.send(content);
      setMessages((prev) => [
        ...prev.filter((m) => m.id !== optimistic.id),
        userMessage,
        assistantMessage,
      ]);
    } catch (e) {
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
      if (e instanceof ApiError && e.code === "UPGRADE_REQUIRED") {
        router.push("/pricing");
      } else {
        Alert.alert("Couldn't send message", "Please check your connection and try again.");
      }
    } finally {
      setSending(false);
    }
  }

  async function handleLongPress(msg: ChatRecord) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await Clipboard.setStringAsync(msg.content);
    setCopiedId(msg.id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  function handleClear() {
    Alert.alert(
      "Clear conversation",
      "This will delete your entire chat history with Atlas. This can't be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: async () => {
            await chatApi.clear();
            setMessages([]);
          },
        },
      ]
    );
  }

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: C.background },
    header: {
      paddingHorizontal: 20, paddingBottom: 14,
      borderBottomWidth: 1, borderBottomColor: C.border,
      flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    },
    headerLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
    coachAvatar: {
      width: 40, height: 40, borderRadius: 20,
      backgroundColor: C.volt + "26",
      alignItems: "center", justifyContent: "center",
    },
    headerTitle: { fontSize: 16, fontFamily: "Inter_700Bold", color: C.textPrimary },
    headerSub: { fontSize: 12, color: C.success, fontFamily: "Inter_400Regular" },
    clearBtn: { padding: 8 },
    paywall: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 },
    paywallIcon: {
      width: 72, height: 72, borderRadius: 36,
      backgroundColor: C.volt + "1F",
      alignItems: "center", justifyContent: "center", marginBottom: 20,
    },
    paywallTitle: { fontSize: 22, fontFamily: "Archivo_800ExtraBold", color: C.textPrimary, textAlign: "center", marginBottom: 10 },
    paywallSub: { fontSize: 14, color: C.textSecondary, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20, marginBottom: 28 },
    upgradeBtn: {
      backgroundColor: C.volt, borderRadius: 14,
      paddingVertical: 14, paddingHorizontal: 32,
      flexDirection: "row", alignItems: "center", gap: 8,
    },
    upgradeBtnText: { color: C.ink, fontSize: 15, fontFamily: "Inter_700Bold" },
    coachDot: {
      width: 26, height: 26, borderRadius: 13,
      backgroundColor: C.volt + "1F",
      alignItems: "center", justifyContent: "center",
      alignSelf: "flex-end", marginRight: 8,
    },
    msgRow: { paddingHorizontal: 16, paddingVertical: 4, flexDirection: "row", alignItems: "flex-end" },
    bubble: { maxWidth: "78%", borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10 },
    userBubble: { alignSelf: "flex-end", backgroundColor: C.volt, borderBottomRightRadius: 4, marginLeft: "auto" as any },
    assistantBubble: {
      alignSelf: "flex-start", backgroundColor: C.surface2,
      borderBottomLeftRadius: 4, borderWidth: 1, borderColor: C.border,
    },
    userText: { color: C.ink, fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 20 },
    assistantText: { color: C.textPrimary, fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 20 },
    copiedLabel: { fontSize: 10, color: C.textTertiary, fontFamily: "Inter_500Medium", marginTop: 4, textAlign: "right" },
    typingBubble: {
      backgroundColor: C.surface2, borderRadius: 18, borderBottomLeftRadius: 4,
      borderWidth: 1, borderColor: C.border,
      paddingHorizontal: 16, paddingVertical: 14,
      flexDirection: "row", alignItems: "center", gap: 5,
    },
    typingDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: C.textSecondary },
    quickPromptsRow: { paddingBottom: 10, paddingTop: 4 },
    quickChip: {
      backgroundColor: C.surface2, borderRadius: 20,
      paddingHorizontal: 14, paddingVertical: 8,
      borderWidth: 1, borderColor: C.border,
    },
    quickChipText: { fontSize: 13, color: C.textPrimary, fontFamily: "Inter_400Regular" },
    inputRow: {
      flexDirection: "row", alignItems: "flex-end", gap: 10,
      paddingHorizontal: 16, paddingTop: 10,
      borderTopWidth: 1, borderTopColor: C.border, backgroundColor: C.background,
    },
    textInput: {
      flex: 1, backgroundColor: C.surface2, borderRadius: 22,
      paddingHorizontal: 16, paddingTop: 10, paddingBottom: 10,
      color: C.textPrimary, fontSize: 14, fontFamily: "Inter_400Regular",
      borderWidth: 1, borderColor: C.border, maxHeight: 100,
    },
    sendBtn: {
      width: 42, height: 42, borderRadius: 21,
      backgroundColor: C.volt, alignItems: "center", justifyContent: "center",
    },
    sendBtnDisabled: { backgroundColor: C.surface3 },
  });

  if (!canChat) {
    return (
      <View style={s.container}>
        <View style={[s.header, { paddingTop: topPad + 16 }]}>
          <View style={s.headerLeft}>
            <View style={s.coachAvatar}>
              <Feather name="cpu" size={20} color={C.volt} />
            </View>
            <View>
              <Text style={s.headerTitle}>Atlas AI Coach</Text>
              <Text style={[s.headerSub, { color: C.textSecondary }]}>Pro feature</Text>
            </View>
          </View>
        </View>
        <View style={s.paywall}>
          <View style={s.paywallIcon}>
            <Feather name="lock" size={32} color={C.volt} />
          </View>
          <Text style={s.paywallTitle}>Unlock Your AI Coach</Text>
          <Text style={s.paywallSub}>
            Get personalized coaching powered by Claude AI. Discuss your form, get drill recommendations, and improve faster.
          </Text>
          <TouchableOpacity style={s.upgradeBtn} onPress={() => router.push("/pricing")} activeOpacity={0.85}>
            <Feather name="zap" size={16} color={C.ink} />
            <Text style={s.upgradeBtnText}>Upgrade to Pro</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const canSend = input.trim().length > 0 && !sending;
  const showQuickPrompts = messages.length === 0 && !sending;

  return (
    <KeyboardAvoidingView
      style={s.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
    >
      {/* Header */}
      <View style={[s.header, { paddingTop: topPad + 16 }]}>
        <View style={s.headerLeft}>
          <View style={s.coachAvatar}>
            <Feather name="cpu" size={20} color={C.volt} />
          </View>
          <View>
            <Text style={s.headerTitle}>Atlas AI Coach</Text>
            <Text style={s.headerSub}>● Online</Text>
          </View>
        </View>
        {messages.length > 0 && (
          <TouchableOpacity style={s.clearBtn} onPress={handleClear}>
            <Feather name="trash-2" size={18} color={C.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={C.volt} />
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const isUser = item.role === "user";
            const isCopied = copiedId === item.id;
            return (
              <TouchableWithoutFeedback onLongPress={() => handleLongPress(item)}>
                <View style={s.msgRow}>
                  {!isUser && (
                    <View style={s.coachDot}>
                      <Feather name="cpu" size={12} color={C.volt} />
                    </View>
                  )}
                  <View style={[s.bubble, isUser ? s.userBubble : s.assistantBubble]}>
                    <Text style={isUser ? s.userText : s.assistantText}>{item.content}</Text>
                    {isCopied && (
                      <Text style={s.copiedLabel}>Copied!</Text>
                    )}
                  </View>
                </View>
              </TouchableWithoutFeedback>
            );
          }}
          ListEmptyComponent={
            <View style={{ padding: 32, alignItems: "center", gap: 12 }}>
              <View style={{ width: 72, height: 72, borderRadius: 22, backgroundColor: C.volt + "1A", alignItems: "center", justifyContent: "center" }}>
                <Feather name="message-circle" size={32} color={C.volt} />
              </View>
              <Text style={{ fontFamily: "Archivo_800ExtraBold", fontSize: 22, color: C.textPrimary, textAlign: "center", letterSpacing: -0.5 }}>
                Ask Atlas anything
              </Text>
              <Text style={{ color: C.textSecondary, fontFamily: "Inter_400Regular", fontSize: 14, textAlign: "center", lineHeight: 20 }}>
                Form feedback, drill recommendations, recovery tips — your AI coach is here.
              </Text>
            </View>
          }
          ListFooterComponent={
            <>
              {sending && (
                <View style={[s.msgRow, { paddingBottom: 4 }]}>
                  <View style={s.coachDot}>
                    <Feather name="cpu" size={12} color={C.volt} />
                  </View>
                  <View style={s.typingBubble}>
                    <View style={s.typingDot} />
                    <View style={[s.typingDot, { opacity: 0.6 }]} />
                    <View style={[s.typingDot, { opacity: 0.3 }]} />
                  </View>
                </View>
              )}
              <View style={{ height: 12 }} />
            </>
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: 12, paddingBottom: 8, flexGrow: 1 }}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />
      )}

      {/* Quick prompts */}
      {showQuickPrompts && (
        <View style={s.quickPromptsRow}>
          <FlatList
            data={QUICK_PROMPTS}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={s.quickChip}
                onPress={() => sendMessage(item)}
                activeOpacity={0.75}
              >
                <Text style={s.quickChipText}>{item}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      {/* Input row */}
      <View style={[s.inputRow, { paddingBottom: 10 + bottomInset }]}>
        <TextInput
          ref={inputRef}
          style={s.textInput}
          value={input}
          onChangeText={setInput}
          placeholder="Ask your AI coach..."
          placeholderTextColor={C.textTertiary}
          multiline
          returnKeyType="send"
          onSubmitEditing={() => sendMessage()}
          blurOnSubmit={false}
          editable={!sending}
        />
        <TouchableOpacity
          style={[s.sendBtn, !canSend && s.sendBtnDisabled]}
          onPress={() => sendMessage()}
          disabled={!canSend}
          activeOpacity={0.8}
        >
          {sending ? (
            <ActivityIndicator color={C.ink} size="small" />
          ) : (
            <Feather name="send" size={16} color={canSend ? C.ink : C.textTertiary} />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
