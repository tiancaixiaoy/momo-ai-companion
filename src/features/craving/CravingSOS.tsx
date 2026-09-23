import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  CRAVING_PROMPT_VERSION,
  CravingAIError,
  requestCravingSupport,
} from "../../services/ai/craving";
import { getAnonymousUserId, trackSOS } from "../../services/analytics";
import { runtimeLabel } from "../../config/runtime";
import { CravingAIResponse, CravingMessage } from "./types";

const C = {
  bg: "#FFF9F1",
  card: "#FFF",
  pink: "#F49CAF",
  pale: "#FFF0F3",
  purple: "#E2D8FA",
  brown: "#4C3A35",
  muted: "#927D76",
  line: "#F0E3DC",
  sage: "#A9CDB5",
};
const quick = [
  ["🍚", "真的饿了", "我现在是真的饿了"],
  ["🍰", "就是很馋", "我不饿，但就是很馋"],
  ["😭", "心情不好", "我心情不好，现在很想吃东西"],
  ["😵‍💫", "压力很大", "我压力很大，现在想靠吃东西放松"],
  ["🥺", "刚刚吃多了", "我刚刚吃多了，感觉今天全毁了"],
  ["💭", "我也说不清", "我也不知道为什么想吃"],
];

export function CravingSOS({
  profile,
  meals,
  onComplete,
  onExit,
}: {
  profile: any;
  meals: Array<{ type: string; name: string; kcal: number }>;
  onComplete: () => void;
  onExit: () => void;
}) {
  const sessionId = useMemo(
    () => `sos_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    [],
  );
  const [input, setInput] = useState(""),
    [messages, setMessages] = useState<CravingMessage[]>([]),
    [answer, setAnswer] = useState<CravingAIResponse>(),
    [loading, setLoading] = useState(false),
    [error, setError] = useState<string>(),
    [feedback, setFeedback] = useState<string>(),
    [requestCount, setRequestCount] = useState(0);
  useEffect(() => {
    trackSOS("sos_open", {
      session_id: sessionId,
      prompt_version: CRAVING_PROMPT_VERSION,
    });
    return () => {};
  }, [sessionId]);
  const submit = async (text = input, followup = false) => {
    const message = text.trim();
    if (!message || loading) return;
    if (requestCount >= 6) {
      setError(
        "这次 SOS 已经聊了不少。先去做刚才的一小步，之后需要时再来找我。",
      );
      return;
    }
    setRequestCount((count) => count + 1);
    setInput("");
    setError(undefined);
    setLoading(true);
    const started = Date.now();
    await trackSOS(followup ? "sos_followup" : "sos_submit", {
      session_id: sessionId,
      prompt_version: CRAVING_PROMPT_VERSION,
    });
    await trackSOS("ai_request_start", {
      session_id: sessionId,
      prompt_version: CRAVING_PROMPT_VERSION,
    });
    try {
      const result = await requestCravingSupport({
        message,
        context: {
          goal: profile?.goal ? `目标体重 ${profile.goal}kg` : undefined,
          today_meals: meals.slice(-4),
          companion_style: profile?.style,
        },
        recent_messages: messages.slice(-6),
        session_id: sessionId,
        anonymous_user_id: await getAnonymousUserId(),
      });
      const latency = Date.now() - started;
      setMessages([
        ...messages,
        { role: "user", content: message },
        { role: "assistant", content: result.response },
      ]);
      setAnswer(result);
      await trackSOS("ai_response_success", {
        session_id: sessionId,
        prompt_version: result.prompt_version,
        model_version: result.model_version,
        response_latency: latency,
      });
    } catch (e) {
      const kind = e instanceof CravingAIError ? e.kind : "server";
      setError(
        kind === "not_configured"
          ? "真实 AI 服务还没配置好。你的内容没有丢，可以稍后重试。"
          : kind === "timeout"
            ? "我这次回得有点慢。我们先停一下，你可以重试一次。"
            : kind === "rate_limit"
              ? "现在回应的人有点多，过一小会儿再试就好。"
              : "这次没有连上。你可以重试，或者先去做一个很小的动作：离开食物一分钟，慢慢呼吸。",
      );
      await trackSOS("ai_response_fail", {
        session_id: sessionId,
        prompt_version: CRAVING_PROMPT_VERSION,
        response_latency: Date.now() - started,
        error_type: kind,
      });
    } finally {
      setLoading(false);
    }
  };
  const finish = async () => {
    await trackSOS("sos_complete", {
      session_id: sessionId,
      prompt_version: answer?.prompt_version || CRAVING_PROMPT_VERSION,
      model_version: answer?.model_version,
    });
    onComplete();
  };
  const exit = async () => {
    await trackSOS("sos_exit", {
      session_id: sessionId,
      prompt_version: answer?.prompt_version || CRAVING_PROMPT_VERSION,
      model_version: answer?.model_version,
    });
    onExit();
  };
  const rate = async (value: string) => {
    setFeedback(value);
    await trackSOS("helpful_feedback", {
      session_id: sessionId,
      prompt_version: answer?.prompt_version || CRAVING_PROMPT_VERSION,
      model_version: answer?.model_version,
      feedback: value,
    });
  };
  return (
    <KeyboardAvoidingView
      style={s.safe}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={s.top}>
        <Pressable onPress={exit}>
          <Text style={s.link}>退出</Text>
        </Pressable>
        <View>
          <Text style={s.title}>SOS · 我在呢</Text>
          <Text style={s.status}>● {runtimeLabel}</Text>
        </View>
        <Text style={{ fontSize: 28 }}>🐰</Text>
      </View>
      <ScrollView
        contentContainerStyle={s.content}
        keyboardShouldPersistTaps="handled"
      >
        {!answer && !loading && (
          <>
            <Text style={s.hero}>你现在是什么情况？</Text>
            <Text style={s.sub}>选一个最像的，或者直接说。</Text>
            <View style={s.grid}>
              {quick.map(([icon, label, text]) => (
                <Pressable
                  key={label}
                  style={s.option}
                  onPress={() => submit(text)}
                >
                  <Text style={s.icon}>{icon}</Text>
                  <Text style={s.optionText}>{label}</Text>
                </Pressable>
              ))}
            </View>
          </>
        )}
        {loading && (
          <View style={s.loading}>
            <Text style={{ fontSize: 64 }}>🐰</Text>
            <ActivityIndicator color={C.pink} size="large" />
            <Text style={s.hero}>我在想怎么陪你…</Text>
            <Text style={s.sub}>不需要做其他事，稍等一下就好。</Text>
          </View>
        )}
        {error && (
          <View style={s.error}>
            <Text style={s.cardTitle}>这次没能顺利回应</Text>
            <Text style={s.body}>{error}</Text>
            <Pressable style={s.secondary} onPress={() => setError(undefined)}>
              <Text style={s.secondaryText}>返回重试</Text>
            </Pressable>
          </View>
        )}
        {answer && !loading && (
          <>
            <View style={s.reply}>
              <Text style={s.eyebrow}>
                {stateLabel(answer.state)} ·{" "}
                {Math.round(answer.confidence * 100)}%
              </Text>
              <Text style={s.replyText}>{answer.response}</Text>
            </View>
            <View style={s.action}>
              <Text style={s.eyebrow}>现在只做这一小步</Text>
              <Text style={s.actionText}>{answer.next_action}</Text>
            </View>
            {answer.needs_follow_up && (
              <View>
                <Text style={s.label}>做完后，你也可以再告诉我一句</Text>
              </View>
            )}
            <View style={s.feedback}>
              <Text style={s.cardTitle}>这次有帮助吗？</Text>
              <View style={s.feedbackRow}>
                {[
                  ["helpful", "有帮助"],
                  ["neutral", "一般"],
                  ["unhelpful", "没帮助"],
                ].map(([value, label]) => (
                  <Pressable
                    key={value}
                    onPress={() => rate(value)}
                    style={[s.feedbackButton, feedback === value && s.selected]}
                  >
                    <Text style={s.optionText}>{label}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
            <Pressable style={s.primary} onPress={finish}>
              <Text style={s.primaryText}>好，我先去做</Text>
            </Pressable>
          </>
        )}
      </ScrollView>
      {!loading && !error && (!answer || answer.needs_follow_up) && (
        <View style={s.composer}>
          <TextInput
            value={input}
            onChangeText={setInput}
            multiline
            placeholder={
              answer ? "做完后告诉我一句…" : "例如：晚饭吃得少，现在真的很饿…"
            }
            placeholderTextColor="#AD9991"
            style={s.input}
          />
          <Pressable
            disabled={!input.trim()}
            onPress={() => submit(input, Boolean(answer))}
            style={[s.send, !input.trim() && { opacity: 0.4 }]}
          >
            <Text style={s.primaryText}>发送</Text>
          </Pressable>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}
function stateLabel(state: string) {
  return (
    (
      {
        physical_hunger: "可能是身体饿了",
        craving: "可能是食物冲动",
        emotional_trigger: "可能和情绪有关",
        post_overeating: "先回到照顾自己",
        unclear: "还需要一点线索",
      } as any
    )[state] || "我在听"
  );
}
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  top: {
    minHeight: 76,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: C.line,
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    color: C.brown,
    textAlign: "center",
  },
  status: { fontSize: 11, color: "#688A70", marginTop: 3, textAlign: "center" },
  link: { color: C.pink, fontWeight: "800" },
  content: { padding: 20, paddingBottom: 30, gap: 14 },
  hero: {
    fontSize: 25,
    fontWeight: "800",
    color: C.brown,
    textAlign: "center",
  },
  sub: { fontSize: 15, lineHeight: 23, color: C.muted, textAlign: "center" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 8 },
  option: {
    width: "48%",
    minHeight: 90,
    borderRadius: 20,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.line,
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
  },
  icon: { fontSize: 28, marginBottom: 6 },
  optionText: { fontSize: 14, fontWeight: "700", color: C.brown },
  loading: {
    minHeight: 430,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  error: { backgroundColor: C.pale, borderRadius: 22, padding: 20, gap: 12 },
  cardTitle: { fontSize: 17, fontWeight: "800", color: C.brown },
  body: { fontSize: 15, lineHeight: 23, color: C.brown },
  secondary: {
    height: 48,
    borderRadius: 16,
    backgroundColor: C.card,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryText: { fontWeight: "800", color: C.brown },
  reply: { backgroundColor: C.card, borderRadius: 24, padding: 20, gap: 10 },
  eyebrow: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.7,
    color: C.pink,
  },
  replyText: {
    fontSize: 19,
    lineHeight: 29,
    fontWeight: "700",
    color: C.brown,
  },
  action: { backgroundColor: C.purple, borderRadius: 22, padding: 20, gap: 9 },
  actionText: {
    fontSize: 18,
    lineHeight: 27,
    fontWeight: "800",
    color: C.brown,
  },
  label: { fontSize: 14, color: C.muted },
  feedback: { marginTop: 8, gap: 12 },
  feedbackRow: { flexDirection: "row", gap: 8 },
  feedbackButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 16,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.line,
    alignItems: "center",
    justifyContent: "center",
  },
  selected: { backgroundColor: C.pale, borderColor: C.pink },
  primary: {
    minHeight: 54,
    borderRadius: 18,
    backgroundColor: C.pink,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryText: { fontWeight: "800", color: "#fff" },
  composer: {
    padding: 12,
    backgroundColor: C.card,
    borderTopWidth: 1,
    borderTopColor: C.line,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
  },
  input: {
    flex: 1,
    minHeight: 48,
    maxHeight: 100,
    borderRadius: 18,
    backgroundColor: C.bg,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: C.brown,
  },
  send: {
    height: 48,
    borderRadius: 16,
    backgroundColor: C.pink,
    paddingHorizontal: 18,
    alignItems: "center",
    justifyContent: "center",
  },
});
