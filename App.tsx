import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  applyReminderPreferences,
  defaultReminderPreferences,
  ReminderPreferences,
} from "./src/services/notifications";
import { track } from "./src/services/analytics";
import { CravingSOS } from "./src/features/craving/CravingSOS";

const c = {
  bg: "#FFF9F1",
  card: "#FFF",
  pink: "#F49CAF",
  pale: "#FFF0F3",
  yellow: "#FFE6A8",
  purple: "#E2D8FA",
  sage: "#A9CDB5",
  brown: "#4C3A35",
  muted: "#927D76",
  line: "#F0E3DC",
};
type Tab = "today" | "chat" | "journey" | "me";
type Meal = {
  id: string;
  type: string;
  name: string;
  kcal: number;
  p: number;
  carb: number;
  fat: number;
  image?: string;
};
const KEY = "momo-v2-demo";
const Button = ({
  text,
  onPress,
  secondary = false,
  disabled = false,
}: {
  text: string;
  onPress: () => void;
  secondary?: boolean;
  disabled?: boolean;
}) => (
  <Pressable
    disabled={disabled}
    onPress={onPress}
    style={[s.btn, secondary && s.btn2, disabled && { opacity: 0.4 }]}
  >
    <Text style={[s.btnText, secondary && { color: c.brown }]}>{text}</Text>
  </Pressable>
);
const Card = ({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: any;
}) => <View style={[s.card, style]}>{children}</View>;
const Bunny = ({
  mood = "happy",
  small = false,
}: {
  mood?: string;
  small?: boolean;
}) => (
  <View style={[s.bunny, small && { width: 66, height: 66 }]}>
    <Text style={{ fontSize: small ? 44 : 78 }}>🐰</Text>
    <Text style={s.mood}>
      {{
        happy: "开心陪伴中",
        chat: "认真听你说",
        comfort: "抱抱你",
        release: "慢慢呼吸",
        eat: "准备开饭",
      }[mood] || "陪着你"}
    </Text>
  </View>
);
const Progress = ({
  value,
  color = c.pink,
}: {
  value: number;
  color?: string;
}) => (
  <View style={s.track}>
    <View
      style={[
        s.fill,
        { width: `${Math.min(100, value * 100)}%`, backgroundColor: color },
      ]}
    />
  </View>
);
const Choice = ({
  text,
  onPress,
  active = false,
}: {
  text: string;
  onPress: () => void;
  active?: boolean;
}) => (
  <Pressable
    onPress={onPress}
    style={[
      s.choice,
      active && { backgroundColor: c.pale, borderColor: c.pink },
    ]}
  >
    <Text style={s.choiceText}>{text}</Text>
    <Text style={{ color: c.pink, fontSize: 20 }}>{active ? "✓" : "○"}</Text>
  </Pressable>
);
const Row = ({ a, b }: { a: string; b: string }) => (
  <View style={s.rowLine}>
    <Text style={s.muted}>{a}</Text>
    <Text style={s.strong}>{b}</Text>
  </View>
);
const Field = ({
  label,
  value,
  set,
  numeric = false,
}: {
  label: string;
  value: string;
  set: (v: string) => void;
  numeric?: boolean;
}) => (
  <View style={{ marginTop: 16 }}>
    <Text style={s.label}>{label}</Text>
    <TextInput
      value={value}
      onChangeText={set}
      keyboardType={numeric ? "decimal-pad" : "default"}
      style={s.input}
    />
  </View>
);

function Onboarding({ done }: { done: (p: any) => void }) {
  const [step, setStep] = useState(0),
    [name, setName] = useState("Cherry"),
    [weight, setWeight] = useState("60"),
    [goal, setGoal] = useState("52"),
    [buddy, setBuddy] = useState("Momo"),
    [style, setStyle] = useState("温柔陪伴型");
  const [selected, setSelected] = useState<string[]>([]);
  const toggle = (x: string) =>
    setSelected(
      selected.includes(x) ? selected.filter((v) => v !== x) : [...selected, x],
    );
  const pages = [
    <View style={s.center}>
      <Bunny />
      <Text style={s.hero}>嗨，很高兴认识你</Text>
      <Text style={s.subtitle}>以后减脂这件事，不用一个人完成啦 ♡</Text>
      <Text style={s.body}>
        我会陪你吃每一顿饭，也陪你度过那些特别想吃东西的时刻。
      </Text>
    </View>,
    <View>
      <Text style={s.title}>你现在最想改变什么？</Text>
      <Text style={s.muted}>可以多选</Text>
      {[
        "变瘦一点",
        "降低体脂",
        "塑形 / 线条更好看",
        "改善饮食习惯",
        "减少情绪性进食",
      ].map((x) => (
        <Choice
          key={x}
          text={x}
          active={selected.includes(x)}
          onPress={() => toggle(x)}
        />
      ))}
    </View>,
    <View>
      <Text style={s.title}>最近减脂最困扰你的是什么？</Text>
      {[
        "总是很馋",
        "晚上控制不住想吃",
        "容易吃撑",
        "情绪不好就想吃东西",
        "不知道一顿应该怎么吃",
      ].map((x) => (
        <Choice
          key={x}
          text={x}
          active={selected.includes(x)}
          onPress={() => toggle(x)}
        />
      ))}
    </View>,
    <View>
      <Text style={s.title}>让我更了解你一点</Text>
      <Field label="你的昵称" value={name} set={setName} />
      <Field label="当前体重（kg）" value={weight} set={setWeight} numeric />
      <Field label="目标体重（kg）" value={goal} set={setGoal} numeric />
      <Text style={s.note}>
        这些数字只用来给你更合适的参考，不会被用来评判你。
      </Text>
    </View>,
    <View>
      <Text style={s.title}>你希望我怎么陪你？</Text>
      {["温柔陪伴型", "清醒理性型", "适度督促型", "好朋友型"].map((x) => (
        <Choice
          key={x}
          text={x}
          active={style === x}
          onPress={() => setStyle(x)}
        />
      ))}
    </View>,
    <View style={s.center}>
      <Bunny mood="chat" />
      <Text style={s.title}>你想怎么叫我？</Text>
      <Field label="AI 名字" value={buddy} set={setBuddy} />
      <View style={s.chips}>
        {["Momo", "糯糯", "桃桃", "米米"].map((x) => (
          <Pressable key={x} onPress={() => setBuddy(x)} style={s.chip}>
            <Text>{x}</Text>
          </Pressable>
        ))}
      </View>
    </View>,
    <View>
      <View style={s.center}>
        <Bunny />
        <Text style={s.hero}>属于你的计划准备好啦</Text>
      </View>
      <Card>
        <Row a="目标体重" b={`${goal} kg`} />
        <Row a="每日参考" b="1400 kcal" />
        <Row a="蛋白质目标" b="75 g" />
        <Row a="进食窗口" b="10:30–18:30" />
        <Row a="空腹节奏" b="16:8" />
      </Card>
      <Text style={s.note}>这只是起点。我们会根据你的感受一起慢慢调整。</Text>
    </View>,
  ];
  return (
    <SafeAreaView style={s.safe}>
      <StatusBar style="dark" />
      <View style={s.top}>
        <Text style={s.brand}>Momo</Text>
        <Text style={s.muted}>
          {step + 1} / {pages.length}
        </Text>
      </View>
      <Progress value={(step + 1) / pages.length} />
      <ScrollView contentContainerStyle={s.page}>{pages[step]}</ScrollView>
      <View style={s.footer}>
        {step > 0 && (
          <Button text="上一步" secondary onPress={() => setStep(step - 1)} />
        )}
        <Button
          text={
            step === 6 ? "开始第一天 ♡" : step === 0 ? "开始认识彼此" : "下一步"
          }
          onPress={() =>
            step === 6
              ? (track("onboarding_completed", { style }),
                done({ name, weight: +weight, goal: +goal, buddy, style }))
              : setStep(step + 1)
          }
        />
      </View>
    </SafeAreaView>
  );
}

export default function App() {
  const [ready, setReady] = useState(false),
    [profile, setProfile] = useState<any>(),
    [meals, setMeals] = useState<Meal[]>([]),
    [tab, setTab] = useState<Tab>("today"),
    [cravings, setCravings] = useState(0),
    [weights, setWeights] = useState<number[]>([]),
    [sosRequested, setSosRequested] = useState(false);
  useEffect(() => {
    AsyncStorage.getItem(KEY).then((v) => {
      if (v) {
        const d = JSON.parse(v);
        setProfile(d.profile);
        setMeals(d.meals || []);
        setCravings(d.cravings || 0);
        setWeights(d.weights || []);
      }
      setReady(true);
    });
  }, []);
  useEffect(() => {
    if (ready && profile)
      AsyncStorage.setItem(
        KEY,
        JSON.stringify({ profile, meals, cravings, weights }),
      );
  }, [ready, profile, meals, cravings, weights]);
  if (!ready)
    return (
      <View style={[s.safe, s.center]}>
        <Bunny />
        <Text style={s.subtitle}>正在准备我们的第一天…</Text>
      </View>
    );
  if (!profile) return <Onboarding done={setProfile} />;
  const body =
    tab === "today" ? (
      <Today
        profile={profile}
        meals={meals}
        add={(m) => setMeals([...meals, m])}
        chat={() => setTab("chat")}
        sos={() => {
          setSosRequested(true);
          setTab("chat");
        }}
      />
    ) : tab === "chat" ? (
      <Chat
        profile={profile}
        meals={meals}
        autoSos={sosRequested}
        finishSOS={() => setSosRequested(false)}
        craving={() => setCravings(cravings + 1)}
      />
    ) : tab === "journey" ? (
      <Journey
        profile={profile}
        meals={meals}
        cravings={cravings}
        weights={weights}
        add={(n) => setWeights([...weights, n])}
      />
    ) : (
      <Me
        profile={profile}
        reset={() => {
          AsyncStorage.removeItem(KEY);
          setProfile(undefined);
          setMeals([]);
        }}
      />
    );
  return (
    <SafeAreaView style={s.safe}>
      <StatusBar style="dark" />
      <View style={{ flex: 1 }}>{body}</View>
      <Nav tab={tab} set={setTab} />
    </SafeAreaView>
  );
}

function Today({
  profile,
  meals,
  add,
  chat,
  sos,
}: {
  profile: any;
  meals: Meal[];
  add: (m: Meal) => void;
  chat: () => void;
  sos: () => void;
}) {
  const [log, setLog] = useState(false);
  const total = useMemo(
    () =>
      meals.reduce(
        (a, m) => ({
          k: a.k + m.kcal,
          p: a.p + m.p,
          carb: a.carb + m.carb,
          fat: a.fat + m.fat,
        }),
        { k: 0, p: 0, carb: 0, fat: 0 },
      ),
    [meals],
  );
  return (
    <>
      <ScrollView contentContainerStyle={s.screen}>
        <View style={s.header}>
          <View>
            <Text style={s.eyebrow}>DAY 01 · 下午好</Text>
            <Text style={s.hero}>下午好，{profile.name} ☀️</Text>
            <Text style={s.muted}>今天也一起慢慢来吧～</Text>
          </View>
          <Pressable onPress={chat}>
            <Bunny small />
          </Pressable>
        </View>
        <Card style={{ backgroundColor: c.pale, flexDirection: "row" }}>
          <View style={{ flex: 1 }}>
            <Text style={s.cardTitle}>{profile.buddy} 想告诉你</Text>
            <Text style={s.body}>不用求完美，记下来就是在照顾自己。</Text>
          </View>
          <Text style={{ fontSize: 36 }}>🐰</Text>
        </Card>
        <View style={s.actions}>
          <Pressable
            style={[s.action, { backgroundColor: c.pink }]}
            onPress={() => setLog(true)}
          >
            <Text style={s.actionIcon}>📷</Text>
            <Text style={s.actionText}>记录饮食</Text>
          </Pressable>
          <Pressable
            style={[s.action, { backgroundColor: c.purple }]}
            onPress={sos}
          >
            <Text style={s.actionIcon}>🥺</Text>
            <Text style={s.actionText}>我现在好想吃</Text>
          </Pressable>
        </View>
        <Card>
          <View style={s.between}>
            <Text style={s.cardTitle}>空腹时间 16:8</Text>
            <Text style={s.pill}>进行中</Text>
          </View>
          <Text style={s.big}>14:37</Text>
          <Progress value={0.91} color={c.sage} />
          <View style={s.between}>
            <Text style={s.muted}>还有1小时23分 ♡</Text>
            <Text style={s.muted}>10:30–18:30</Text>
          </View>
        </Card>
        <Text style={s.section}>今天吃了什么</Text>
        <View style={s.mealRow}>
          {["早餐", "午餐", "加餐", "晚餐"].map((x) => {
            const m = meals.find((v) => v.type === x);
            return (
              <Pressable key={x} style={s.meal} onPress={() => setLog(true)}>
                <Text style={[s.mealDot, m && { backgroundColor: c.sage }]}>
                  {m ? "✓" : "+"}
                </Text>
                <Text style={s.strong}>{x}</Text>
                <Text numberOfLines={1} style={s.tiny}>
                  {m?.name || "还没记录"}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <Text style={s.section}>今日营养参考</Text>
        <Card>
          <N
            name="热量"
            now={total.k}
            goal={1400}
            unit=" 千卡"
            color={c.pink}
          />
          <N name="蛋白质" now={total.p} goal={75} unit="g" color={c.sage} />
          <N
            name="碳水"
            now={total.carb}
            goal={150}
            unit="g"
            color={c.yellow}
          />
          <N name="脂肪" now={total.fat} goal={45} unit="g" color={c.purple} />
        </Card>
      </ScrollView>
      <FoodLog
        visible={log}
        close={() => setLog(false)}
        save={(m) => {
          add(m);
          setLog(false);
        }}
      />
    </>
  );
}
function N({
  name,
  now,
  goal,
  unit,
  color,
}: {
  name: string;
  now: number;
  goal: number;
  unit: string;
  color: string;
}) {
  return (
    <View style={{ marginBottom: 15 }}>
      <View style={s.between}>
        <Text style={s.label}>{name}</Text>
        <Text style={s.muted}>
          {now} / {goal}
          {unit}
        </Text>
      </View>
      <Progress value={now / goal} color={color} />
    </View>
  );
}

function FoodLog({
  visible,
  close,
  save,
}: {
  visible: boolean;
  close: () => void;
  save: (m: Meal) => void;
}) {
  const [stage, setStage] = useState(0),
    [text, setText] = useState(""),
    [image, setImage] = useState<string>(),
    [type, setType] = useState("午餐");
  const pick = async (camera = false) => {
    const r = camera
      ? await ImagePicker.launchCameraAsync({ quality: 0.65 })
      : await ImagePicker.launchImageLibraryAsync({ quality: 0.65 });
    if (!r.canceled) {
      track("food_photo_uploaded", { source: camera ? "camera" : "library" });
      setImage(r.assets[0].uri);
      setStage(1);
      setTimeout(() => {
        track("food_analysis_completed", { provider: "mock" });
        setStage(2);
      }, 1300);
    }
  };
  const dismiss = () => {
    setStage(0);
    setText("");
    setImage(undefined);
    close();
  };
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={dismiss}
    >
      <SafeAreaView style={s.safe}>
        <View style={s.modalTop}>
          <Pressable onPress={dismiss}>
            <Text style={s.link}>取消</Text>
          </Pressable>
          <Text style={s.cardTitle}>
            {stage === 2 ? "确认这一餐" : "今天吃了什么？"}
          </Text>
          <View style={{ width: 36 }} />
        </View>
        <ScrollView contentContainerStyle={s.screen}>
          {stage === 0 && (
            <>
              <Bunny mood="eat" />
              <Pressable style={s.source} onPress={() => pick(true)}>
                <Text style={s.actionIcon}>📷</Text>
                <View>
                  <Text style={s.cardTitle}>拍照识别</Text>
                  <Text style={s.muted}>拍下这顿饭，我来帮你看看</Text>
                </View>
              </Pressable>
              <Pressable style={s.source} onPress={() => pick()}>
                <Text style={s.actionIcon}>🌄</Text>
                <View>
                  <Text style={s.cardTitle}>从相册选择</Text>
                  <Text style={s.muted}>选一张已经拍好的照片</Text>
                </View>
              </Pressable>
              <Text style={s.label}>或者直接告诉我</Text>
              <TextInput
                multiline
                value={text}
                onChangeText={setText}
                placeholder="例如：一碗牛肉面，四五块牛肉，没喝汤…"
                placeholderTextColor="#B8A59E"
                style={[s.input, { height: 110, textAlignVertical: "top" }]}
              />
              <Button
                disabled={!text.trim()}
                text="帮我估算一下"
                onPress={() => setStage(2)}
              />
              <Button
                disabled
                secondary
                text="🎙 直接跟我说（即将上线）"
                onPress={() => {}}
              />
            </>
          )}
          {stage === 1 && (
            <View style={s.center}>
              {image && <Image source={{ uri: image }} style={s.foodImage} />}
              <Bunny mood="chat" />
              <Text style={s.hero}>让我看看 👀</Text>
              <Text style={s.subtitle}>正在估算份量…</Text>
              <Progress value={0.72} />
            </View>
          )}
          {stage === 2 && (
            <>
              {image ? (
                <Image source={{ uri: image }} style={s.foodImage} />
              ) : (
                <Bunny mood="eat" />
              )}
              <Text style={s.hero}>我看看 👀</Text>
              <Card>
                <Row a="牛肉面" b="约 480–580 千卡" />
                <Row a="蛋白质" b="约 27g" />
                <Row a="碳水" b="约 72g" />
                <Row a="脂肪" b="约 18g" />
                <View style={s.total}>
                  <Text style={s.cardTitle}>这一餐预计</Text>
                  <Text style={s.hero}>520 千卡</Text>
                </View>
              </Card>
              <Text style={s.section}>份量看起来准确吗？</Text>
              <View style={s.chips}>
                {["少一些", "差不多", "多一些"].map((x) => (
                  <View key={x} style={s.chip}>
                    <Text>{x}</Text>
                  </View>
                ))}
              </View>
              <Text style={s.section}>这是哪一餐？</Text>
              <View style={s.chips}>
                {["早餐", "午餐", "加餐", "晚餐"].map((x) => (
                  <Pressable
                    key={x}
                    onPress={() => setType(x)}
                    style={[
                      s.chip,
                      type === x && {
                        backgroundColor: c.pale,
                        borderColor: c.pink,
                      },
                    ]}
                  >
                    <Text>{x}</Text>
                  </Pressable>
                ))}
              </View>
              <Button
                text="记录这一餐"
                onPress={() =>
                  save({
                    id: Date.now() + "",
                    type,
                    name: "牛肉面",
                    kcal: 520,
                    p: 27,
                    carb: 72,
                    fat: 18,
                    image,
                  })
                }
              />
              <Text style={s.note}>
                记好啦 ♡ 这顿蛋白质不错，可以先吃牛肉和蔬菜，再慢慢吃面。
              </Text>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

function Chat({
  profile,
  meals,
  autoSos,
  finishSOS,
  craving,
}: {
  profile: any;
  meals: Meal[];
  autoSos: boolean;
  finishSOS: () => void;
  craving: () => void;
}) {
  const [mode, setMode] = useState<"chat" | "sos" | "talk" | "release">(
      autoSos ? "sos" : "chat",
    ),
    [messages, setMessages] = useState<any[]>([
      { me: "ai", text: `嗨 ${profile.name}，我在呢。今天感觉怎么样？` },
    ]),
    [input, setInput] = useState("");
  const send = () => {
    if (!input.trim()) return;
    track("companion_message_sent", { mode });
    setMessages([
      ...messages,
      { me: "user", text: input },
      {
        me: "ai",
        text: "听起来这件事让你挺累的。此刻你最希望自己被怎样照顾一下？",
      },
    ]);
    setInput("");
  };
  if (mode === "sos")
    return (
      <CravingSOS
        profile={profile}
        meals={meals}
        onComplete={() => {
          craving();
          finishSOS();
          setMode("chat");
        }}
        onExit={() => {
          finishSOS();
          setMode("chat");
        }}
      />
    );
  if (mode === "release")
    return (
      <Release
        done={() => {
          track("release_completed");
          setMode("chat");
        }}
      />
    );
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={70}
    >
      <View style={s.chatTop}>
        <Bunny small mood={mode === "talk" ? "comfort" : "chat"} />
        <View>
          <Text style={s.hero}>{profile.buddy}</Text>
          <Text style={s.online}>● 陪伴中 ♡</Text>
        </View>
      </View>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={s.chat}>
        {mode === "talk" && (
          <Card style={{ backgroundColor: c.pale }}>
            <Text style={s.hero}>我在呢。</Text>
            <Text style={s.body}>你可以告诉我发生了什么，不用组织语言。</Text>
          </Card>
        )}
        {messages.map((m, i) => (
          <View key={i} style={[s.bubble, m.me === "user" ? s.user : s.ai]}>
            <Text style={s.body}>{m.text}</Text>
          </View>
        ))}
        {mode === "talk" && (
          <Button
            secondary
            text="陪我释放一下"
            onPress={() => setMode("release")}
          />
        )}
      </ScrollView>
      <Pressable style={s.quick} onPress={() => setMode("sos")}>
        <Text>🥺 我现在好想吃</Text>
      </Pressable>
      <View style={s.composer}>
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="想跟我说什么？"
          style={s.composeInput}
        />
        <Pressable onPress={send} style={s.send}>
          <Text style={{ color: "#fff", fontSize: 20 }}>↑</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
function SOS({
  back,
  choose,
}: {
  back: () => void;
  choose: (x: string) => void;
}) {
  return (
    <ScrollView contentContainerStyle={[s.screen, s.center]}>
      <Pressable onPress={back} style={{ alignSelf: "flex-start" }}>
        <Text style={s.link}>← 返回</Text>
      </Pressable>
      <Bunny mood="comfort" />
      <Text style={s.hero}>我在呢。</Text>
      <Text style={s.subtitle}>先不用决定到底吃还是不吃。</Text>
      <Text style={s.section}>你现在比较像哪一种？</Text>
      <View style={s.grid}>
        {[
          "🍚 真饿了",
          "🍰 就是馋",
          "😭 难受",
          "😵‍💫 压力大",
          "😌 无聊想吃",
          "💭 我也不知道",
        ].map((x) => (
          <Pressable
            key={x}
            style={s.sosOption}
            onPress={() => choose(x.substring(3))}
          >
            <Text style={s.choiceText}>{x}</Text>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}
function Release({ done }: { done: () => void }) {
  const [step, setStep] = useState(0),
    [urge, setUrge] = useState(8);
  return (
    <SafeAreaView style={[s.safe, { backgroundColor: "#F8F3FF" }]}>
      <ScrollView
        contentContainerStyle={[
          s.screen,
          s.center,
          { justifyContent: "center", flexGrow: 1 },
        ]}
      >
        <Bunny mood="release" />
        {step === 0 && (
          <>
            <Text style={s.hero}>先和自己待一会儿。</Text>
            <Text style={s.subtitle}>
              不用赶走这个感觉。{`\n`}先允许它在这里待一会儿。
            </Text>
            <View style={s.breathe}>
              <Text style={s.muted}>慢慢呼吸</Text>
            </View>
          </>
        )}
        {step === 1 && (
          <>
            <Text style={s.hero}>刚才的冲动有多强？</Text>
            <Text style={s.urge}>{urge}</Text>
            <View style={s.scale}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((x) => (
                <Pressable
                  key={x}
                  onPress={() => setUrge(x)}
                  style={[s.dot, urge === x && { backgroundColor: c.pink }]}
                >
                  <Text>{x}</Text>
                </Pressable>
              ))}
            </View>
          </>
        )}
        {step === 2 && (
          <>
            <Text style={s.hero}>注意一下身体里最明显的感觉。</Text>
            <Text style={s.subtitle}>
              不用分析它，也不用改变它。{`\n`}只是允许它存在几秒。
            </Text>
            <View style={s.breathe}>
              <Text style={s.muted}>我陪你在这里</Text>
            </View>
          </>
        )}
        {step === 3 && (
          <>
            <Text style={s.hero}>现在重新选一次就好 ♡</Text>
            <Text style={s.subtitle}>
              {urge} → 5，你已经给自己一个小小的停顿。
            </Text>
            {["🍪 我还是想吃", "🍓 想吃一点", "🌙 现在不想吃了"].map((x) => (
              <Choice key={x} text={x} onPress={done} />
            ))}
          </>
        )}
        {step < 3 && <Button text="继续" onPress={() => setStep(step + 1)} />}
      </ScrollView>
    </SafeAreaView>
  );
}

function Journey({
  profile,
  meals,
  cravings,
  weights,
  add,
}: {
  profile: any;
  meals: Meal[];
  cravings: number;
  weights: number[];
  add: (n: number) => void;
}) {
  const [w, setW] = useState("");
  return (
    <ScrollView contentContainerStyle={s.screen}>
      <Text style={s.eyebrow}>我们一起走过的</Text>
      <Text style={s.hero}>我的历程</Text>
      <View style={s.stats}>
        {[
          ["1", "陪伴天数"],
          [meals.length, "记录饮食"],
          [cravings, "照顾冲动"],
        ].map(([a, b]) => (
          <Card key={b as string} style={s.stat}>
            <Text style={s.big}>{a}</Text>
            <Text style={s.tiny}>{b}</Text>
          </Card>
        ))}
      </View>
      <Text style={s.section}>体重记录</Text>
      <Card>
        <Text style={s.muted}>当前参考</Text>
        <Text style={s.hero}>{weights.at(-1) || profile.weight} kg</Text>
        <View style={s.weight}>
          <TextInput
            value={w}
            onChangeText={setW}
            keyboardType="decimal-pad"
            placeholder="输入今日体重"
            style={[s.input, { flex: 1, marginTop: 0 }]}
          />
          <Pressable
            style={s.add}
            onPress={() => {
              if (+w) {
                add(+w);
                setW("");
              }
            }}
          >
            <Text style={{ color: "#fff" }}>记录</Text>
          </Pressable>
        </View>
        <Text style={s.note}>单日波动很正常，我们更关心长期趋势。</Text>
      </Card>
      <Text style={s.section}>{profile.buddy} 最近发现</Text>
      <Card style={{ backgroundColor: c.pale }}>
        <Text style={s.body}>
          {meals.length
            ? `你已经记下了 ${meals.length} 顿饭。记录正在变成一种对自己的照顾 ♡`
            : "我们才刚刚开始 ♡\n多记录几天，我就能慢慢发现属于你的规律啦。"}
        </Text>
      </Card>
      <Text style={s.section}>想吃东西的时刻</Text>
      <Card>
        <Row a="本月记录" b={`${cravings} 次`} />
        <Row a="暂停后重新选择" b={`${cravings} 次 ♡`} />
      </Card>
    </ScrollView>
  );
}
function Me({ profile, reset }: { profile: any; reset: () => void }) {
  const [notifications, setNotifications] = useState(false);
  return (
    <>
      <ScrollView contentContainerStyle={s.screen}>
        <Text style={s.eyebrow}>个人中心</Text>
        <Text style={s.hero}>我的</Text>
        <Card style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <Bunny small />
          <View>
            <Text style={s.cardTitle}>{profile.name}</Text>
            <Text style={s.muted}>
              {profile.buddy} · {profile.style}
            </Text>
          </View>
        </Card>
        {["🎯 我的目标", "🍚 饮食目标", "⏳ 16:8 设置", "🐰 AI 陪伴风格"].map(
          (x) => (
            <View key={x} style={s.setting}>
              <Text style={s.choiceText}>{x}</Text>
              <Text style={s.muted}>›</Text>
            </View>
          ),
        )}
        <Pressable style={s.setting} onPress={() => setNotifications(true)}>
          <Text style={s.choiceText}>🔔 通知与提醒</Text>
          <Text style={s.muted}>›</Text>
        </Pressable>
        {["🧠 查看 / 清除 AI 记忆", "🔒 数据与隐私"].map((x) => (
          <View key={x} style={s.setting}>
            <Text style={s.choiceText}>{x}</Text>
            <Text style={s.muted}>›</Text>
          </View>
        ))}
        <Button
          secondary
          text="重置演示数据"
          onPress={() =>
            Alert.alert("确认重置？", "这会清除本机上的演示记录。", [
              { text: "取消" },
              { text: "重置", style: "destructive", onPress: reset },
            ])
          }
        />
      </ScrollView>
      <NotificationSettings
        visible={notifications}
        close={() => setNotifications(false)}
        companion={profile.buddy}
      />
    </>
  );
}

function NotificationSettings({
  visible,
  close,
  companion,
}: {
  visible: boolean;
  close: () => void;
  companion: string;
}) {
  const [prefs, setPrefs] = useState<ReminderPreferences>(
      defaultReminderPreferences,
    ),
    [saving, setSaving] = useState(false);
  const labels: {
    key: keyof ReminderPreferences;
    title: string;
    detail: string;
  }[] = [
    { key: "morning", title: "早安提醒", detail: "08:15 · 起床先喝杯水" },
    { key: "lunch", title: "午餐提醒", detail: "12:15 · 拍给我看看" },
    { key: "window", title: "进食窗口", detail: "17:50 · 窗口结束前提醒" },
    { key: "reflection", title: "晚间复盘", detail: "21:30 · 和我聊30秒" },
  ];
  const save = async () => {
    setSaving(true);
    try {
      await applyReminderPreferences(prefs);
      await AsyncStorage.setItem("momo-reminders-v1", JSON.stringify(prefs));
      Alert.alert("设置好啦 ♡", `${companion} 会按你选择的时间陪你。`);
      close();
    } catch {
      Alert.alert("还没能开启提醒", "请先在系统设置中允许通知。");
    } finally {
      setSaving(false);
    }
  };
  useEffect(() => {
    if (visible)
      AsyncStorage.getItem("momo-reminders-v1").then(
        (v) => v && setPrefs(JSON.parse(v)),
      );
  }, [visible]);
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={s.safe}>
        <View style={s.modalTop}>
          <Pressable onPress={close}>
            <Text style={s.link}>取消</Text>
          </Pressable>
          <Text style={s.cardTitle}>通知与提醒</Text>
          <View style={{ width: 36 }} />
        </View>
        <ScrollView contentContainerStyle={s.screen}>
          <Bunny mood="chat" />
          <Text style={s.subtitle}>只留下对你真的有帮助的提醒。</Text>
          {labels.map((item) => (
            <Pressable
              key={item.key}
              style={s.choice}
              onPress={() =>
                setPrefs({ ...prefs, [item.key]: !prefs[item.key] })
              }
            >
              <View>
                <Text style={s.choiceText}>{item.title}</Text>
                <Text style={s.muted}>{item.detail}</Text>
              </View>
              <View style={[s.toggle, prefs[item.key] && s.toggleOn]}>
                <View style={[s.knob, prefs[item.key] && { marginLeft: 20 }]} />
              </View>
            </Pressable>
          ))}
          <Button
            disabled={saving}
            text={saving ? "正在保存…" : "保存提醒"}
            onPress={save}
          />
          <Text style={s.note}>可以随时回来关闭，我不会频繁打扰你。</Text>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}
function Nav({ tab, set }: { tab: Tab; set: (x: Tab) => void }) {
  return (
    <View style={s.nav}>
      {(
        [
          ["today", "⌂", "今日"],
          ["chat", "♡", "陪伴"],
          ["journey", "∿", "历程"],
          ["me", "○", "我的"],
        ] as [Tab, string, string][]
      ).map(([id, icon, label]) => (
        <Pressable key={id} onPress={() => set(id)} style={s.navItem}>
          <Text style={[s.navIcon, tab === id && { color: c.pink }]}>
            {icon}
          </Text>
          <Text
            style={[s.tiny, tab === id && { color: c.pink, fontWeight: "800" }]}
          >
            {label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: c.bg },
  center: { alignItems: "center" },
  top: { padding: 18, flexDirection: "row", justifyContent: "space-between" },
  brand: { fontSize: 23, fontWeight: "900", color: c.pink },
  page: { padding: 24 },
  screen: { padding: 20, paddingBottom: 38, gap: 14 },
  footer: { padding: 16, paddingBottom: 22, gap: 7 },
  hero: { fontSize: 26, fontWeight: "800", color: c.brown },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: c.brown,
    marginVertical: 20,
  },
  subtitle: {
    fontSize: 17,
    lineHeight: 27,
    color: c.brown,
    textAlign: "center",
    marginVertical: 14,
  },
  body: { fontSize: 16, lineHeight: 24, color: c.brown },
  muted: { fontSize: 14, color: c.muted },
  label: { fontSize: 14, fontWeight: "700", color: c.brown, marginBottom: 7 },
  note: {
    fontSize: 13,
    lineHeight: 20,
    color: c.muted,
    textAlign: "center",
    marginVertical: 12,
  },
  strong: { fontSize: 14, fontWeight: "800", color: c.brown },
  tiny: { fontSize: 11, color: c.muted, marginTop: 4 },
  btn: {
    minHeight: 54,
    borderRadius: 18,
    backgroundColor: c.pink,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
    marginTop: 8,
  },
  btn2: { backgroundColor: c.card, borderWidth: 1, borderColor: c.line },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "800" },
  card: {
    backgroundColor: c.card,
    padding: 18,
    borderRadius: 23,
    shadowColor: "#6E5048",
    shadowOpacity: 0.07,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 5 },
    elevation: 2,
  },
  choice: {
    minHeight: 58,
    backgroundColor: c.card,
    borderWidth: 1,
    borderColor: c.line,
    borderRadius: 18,
    paddingHorizontal: 17,
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  choiceText: { fontSize: 16, color: c.brown },
  input: {
    minHeight: 54,
    borderWidth: 1,
    borderColor: c.line,
    borderRadius: 16,
    backgroundColor: c.card,
    padding: 15,
    fontSize: 16,
    color: c.brown,
    marginTop: 4,
  },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginVertical: 13 },
  chip: {
    borderWidth: 1,
    borderColor: c.line,
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: c.card,
  },
  bunny: {
    width: 128,
    height: 130,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 7,
  },
  mood: {
    position: "absolute",
    bottom: 0,
    fontSize: 11,
    color: c.muted,
    backgroundColor: c.card,
    padding: 5,
    borderRadius: 10,
  },
  track: {
    height: 8,
    borderRadius: 8,
    backgroundColor: c.line,
    overflow: "hidden",
    width: "100%",
    marginVertical: 8,
  },
  fill: { height: "100%", borderRadius: 8 },
  rowLine: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: c.line,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  eyebrow: {
    fontSize: 12,
    color: c.pink,
    fontWeight: "800",
    letterSpacing: 1.2,
    marginBottom: 7,
  },
  cardTitle: { fontSize: 17, fontWeight: "800", color: c.brown },
  actions: { flexDirection: "row", gap: 10 },
  action: {
    flex: 1,
    minHeight: 92,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  actionIcon: { fontSize: 29 },
  actionText: { fontSize: 15, fontWeight: "800", color: c.brown, marginTop: 6 },
  between: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  pill: {
    fontSize: 12,
    color: "#52755B",
    backgroundColor: "#E6F3E9",
    padding: 7,
    borderRadius: 12,
  },
  big: { fontSize: 31, fontWeight: "800", color: c.brown, marginVertical: 6 },
  section: { fontSize: 19, fontWeight: "800", color: c.brown, marginTop: 7 },
  mealRow: { flexDirection: "row", gap: 7 },
  meal: {
    flex: 1,
    backgroundColor: c.card,
    borderRadius: 18,
    alignItems: "center",
    paddingVertical: 13,
    paddingHorizontal: 2,
  },
  mealDot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    textAlign: "center",
    lineHeight: 30,
    backgroundColor: c.pale,
    marginBottom: 6,
  },
  modalTop: {
    height: 58,
    paddingHorizontal: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: c.line,
  },
  link: { color: c.pink, fontWeight: "800" },
  source: {
    backgroundColor: c.card,
    borderRadius: 20,
    padding: 18,
    flexDirection: "row",
    gap: 13,
    alignItems: "center",
    borderWidth: 1,
    borderColor: c.line,
  },
  foodImage: { width: "100%", height: 190, borderRadius: 23 },
  total: {
    marginTop: 12,
    paddingTop: 13,
    borderTopWidth: 1,
    borderTopColor: c.line,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  chatTop: {
    height: 78,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: c.line,
  },
  online: { fontSize: 12, color: "#689A73" },
  chat: { padding: 18, gap: 10 },
  bubble: { maxWidth: "83%", padding: 14, borderRadius: 20 },
  user: {
    alignSelf: "flex-end",
    backgroundColor: c.pale,
    borderBottomRightRadius: 5,
  },
  ai: {
    alignSelf: "flex-start",
    backgroundColor: c.card,
    borderBottomLeftRadius: 5,
  },
  quick: {
    marginHorizontal: 16,
    marginVertical: 6,
    alignSelf: "flex-start",
    backgroundColor: c.purple,
    padding: 10,
    borderRadius: 14,
  },
  composer: {
    flexDirection: "row",
    padding: 12,
    gap: 8,
    backgroundColor: c.card,
    borderTopWidth: 1,
    borderTopColor: c.line,
  },
  composeInput: {
    flex: 1,
    minHeight: 44,
    borderRadius: 23,
    backgroundColor: c.bg,
    paddingHorizontal: 16,
  },
  send: {
    width: 43,
    height: 43,
    borderRadius: 22,
    backgroundColor: c.pink,
    alignItems: "center",
    justifyContent: "center",
  },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10, width: "100%" },
  sosOption: {
    width: "48%",
    minHeight: 76,
    borderRadius: 20,
    backgroundColor: c.card,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: c.line,
  },
  breathe: {
    width: 160,
    height: 160,
    borderRadius: 90,
    backgroundColor: "#E7DDF8",
    borderWidth: 16,
    borderColor: "#F0E9FB",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 30,
  },
  urge: { fontSize: 70, fontWeight: "800", color: c.pink, margin: 20 },
  scale: { flexDirection: "row", gap: 5, marginBottom: 25 },
  dot: {
    width: 29,
    height: 36,
    borderRadius: 12,
    backgroundColor: c.card,
    alignItems: "center",
    justifyContent: "center",
  },
  stats: { flexDirection: "row", gap: 8 },
  stat: { flex: 1, alignItems: "center", paddingHorizontal: 3 },
  weight: { flexDirection: "row", gap: 8, alignItems: "center", marginTop: 14 },
  add: {
    height: 54,
    backgroundColor: c.pink,
    borderRadius: 16,
    paddingHorizontal: 18,
    justifyContent: "center",
  },
  setting: {
    minHeight: 59,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: c.line,
    paddingHorizontal: 6,
  },
  toggle: {
    width: 48,
    height: 28,
    borderRadius: 14,
    backgroundColor: c.line,
    padding: 3,
  },
  toggleOn: { backgroundColor: c.sage },
  knob: { width: 22, height: 22, borderRadius: 11, backgroundColor: c.card },
  nav: {
    height: 72,
    backgroundColor: c.card,
    borderTopWidth: 1,
    borderTopColor: c.line,
    flexDirection: "row",
    paddingBottom: 5,
  },
  navItem: { flex: 1, alignItems: "center", justifyContent: "center" },
  navIcon: { fontSize: 22, color: c.muted },
});
