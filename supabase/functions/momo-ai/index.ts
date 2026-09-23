const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};
const foodSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "meal_name",
    "items",
    "total_calories",
    "protein_g",
    "carbs_g",
    "fat_g",
    "confidence",
  ],
  properties: {
    meal_name: { type: "string" },
    items: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "name",
          "amount_description",
          "calories",
          "protein_g",
          "carbs_g",
          "fat_g",
          "confidence",
        ],
        properties: {
          name: { type: "string" },
          amount_description: { type: "string" },
          calories: { type: "number" },
          protein_g: { type: "number" },
          carbs_g: { type: "number" },
          fat_g: { type: "number" },
          confidence: { type: "number", minimum: 0, maximum: 1 },
        },
      },
    },
    total_calories: { type: "number" },
    protein_g: { type: "number" },
    carbs_g: { type: "number" },
    fat_g: { type: "number" },
    confidence: { type: "number", minimum: 0, maximum: 1 },
  },
};
const cravingSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "state",
    "confidence",
    "response",
    "next_action",
    "needs_follow_up",
  ],
  properties: {
    state: {
      type: "string",
      enum: [
        "physical_hunger",
        "craving",
        "emotional_trigger",
        "post_overeating",
        "unclear",
      ],
    },
    confidence: { type: "number", minimum: 0, maximum: 1 },
    response: { type: "string" },
    next_action: { type: "string" },
    needs_follow_up: { type: "boolean" },
  },
};
const cravingInstructions = `你是 Momo 的 Craving SOS 支持引擎，不是泛用聊天机器人。
目标：识别用户当前状态，并给一个立即能做的小动作。
分类只能是 physical_hunger、craving、emotional_trigger、post_overeating、unclear。
要求：
- response 最多 60 个中文字，不复述用户已说的话，不科普，不评判。
- next_action 最多 45 个中文字，只给一个低门槛、当下可执行的动作。
- 如果是 physical_hunger，不要鼓励忍饿，建议正常进食或组合加餐。
- 如果是 post_overeating，明确否定“今天全毁了”，不建议补偿性禁食或运动。
- 只在缺少会改变建议的关键信息时设 needs_follow_up=true；不得为拉长对话而追问。
- 必须使用简体中文，语气自然、稳定。
- 如用户提及自伤、催吐、泻药、昏厥等高风险，优先建议立即联系专业人员或紧急服务。`;
const sessionRequests = new Map<string, { count: number; expires: number }>();
const allowedEvents = new Set([
  "sos_open", "sos_submit", "ai_request_start", "ai_response_success",
  "ai_response_fail", "sos_followup", "sos_complete", "sos_exit", "helpful_feedback",
]);

function checkSessionLimit(sessionId: string) {
  const now = Date.now();
  const current = sessionRequests.get(sessionId);
  if (!current || current.expires < now) {
    sessionRequests.set(sessionId, { count: 1, expires: now + 30 * 60 * 1000 });
    return true;
  }
  if (current.count >= 6) return false;
  current.count += 1;
  return true;
}

async function storeAnalytics(payload: any) {
  if (!allowedEvents.has(payload?.event_name)) throw new Error("invalid-event");
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) throw new Error("analytics-not-configured");
  const clean = {
    event_name: payload.event_name,
    properties: {},
    anonymous_user_id: String(payload.anonymous_user_id || "").slice(0, 80),
    session_id: String(payload.session_id || "").slice(0, 80),
    scene: "craving_sos",
    prompt_version: String(payload.prompt_version || "").slice(0, 80),
    model_version: payload.model_version ? String(payload.model_version).slice(0, 80) : null,
    response_latency_ms: Number.isFinite(payload.response_latency) ? payload.response_latency : null,
    feedback: ["helpful", "neutral", "unhelpful"].includes(payload.feedback) ? payload.feedback : null,
    error_type: payload.error_type ? String(payload.error_type).slice(0, 80) : null,
  };
  const response = await fetch(`${url}/rest/v1/analytics_events`, {
    method: "POST",
    headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json", Prefer: "return=minimal" },
    body: JSON.stringify(clean),
  });
  if (!response.ok) throw new Error(`analytics-${response.status}`);
}

function outputText(response: any) {
  if (typeof response.output_text === "string") return response.output_text;
  for (const item of response.output || [])
    for (const part of item.content || [])
      if (part.type === "output_text") return part.text;
  throw new Error("empty-model-output");
}
async function callDeepSeek(body: unknown) {
  const key = Deno.env.get("DEEPSEEK_API_KEY");
  if (!key) throw new Error("missing-deepseek-key");
  const response = await fetch("https://api.deepseek.com/responses", {
    method: "POST",
    signal: AbortSignal.timeout(14000),
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (response.status === 429) throw new Error("rate-limit");
  if (!response.ok) throw new Error(`deepseek-${response.status}`);
  return response.json();
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const { action, payload } = await req.json();
    const model = Deno.env.get("DEEPSEEK_MODEL") || "deepseek-flash";
    if (action === "analytics_event") {
      await storeAnalytics(payload);
      return Response.json({ ok: true }, { headers: cors });
    }
    if (action === "food_analysis") {
      const content: any[] = [
        {
          type: "input_text",
          text: `识别这顿饮食并估算常见食用份量。用中文命名。不确定时降低 confidence。用户描述：${payload?.text || "无"}`,
        },
      ];
      if (payload?.imageBase64)
        content.push({
          type: "input_image",
          image_url: `data:image/jpeg;base64,${payload.imageBase64}`,
          detail: "low",
        });
      const result = await callDeepSeek({
        model,
        store: false,
        reasoning: { effort: "none" },
        input: [{ role: "user", content }],
        text: {
          format: {
            type: "json_schema",
            name: "food_analysis",
            schema: foodSchema,
          },
        },
        max_output_tokens: 1200,
      });
      return Response.json(JSON.parse(outputText(result)), { headers: cors });
    }
    if (action === "companion_reply") {
      const result = await callDeepSeek({
        model,
        store: false,
        reasoning: { effort: "none" },
        instructions:
          "你是长期陪伴用户进行饮食管理的 AI Companion。回复使用简体中文，短、自然、具体，不评判食物，不使用失败或破戒等语言。每次最多问一个核心问题。",
        input: JSON.stringify(payload),
        text: { verbosity: "low" },
        max_output_tokens: 300,
      });
      return Response.json({ reply: outputText(result) }, { headers: cors });
    }
    if (action === "craving_sos") {
      const sessionId = String(payload?.session_id || "");
      if (!/^sos_[a-zA-Z0-9_]+$/.test(sessionId) || !checkSessionLimit(sessionId))
        return Response.json({ error: "rate-limit" }, { status: 429, headers: cors });
      const clean = {
        message: String(payload?.message || "").slice(0, 800),
        context: payload?.context || {},
        recent_messages: Array.isArray(payload?.recent_messages)
          ? payload.recent_messages.slice(-6)
          : [],
      };
      const result = await callDeepSeek({
        model,
        store: false,
        reasoning: { effort: "none" },
        instructions: cravingInstructions,
        input: JSON.stringify(clean),
        text: {
          format: {
            type: "json_schema",
            name: "craving_sos_response",
            schema: cravingSchema,
          },
        },
        max_output_tokens: 350,
      });
      const parsed = JSON.parse(outputText(result));
      return Response.json(
        {
          ...parsed,
          prompt_version: payload?.prompt_version || "craving_sos_v2",
          model_version: model,
          usage: {
            input_tokens: result.usage?.input_tokens,
            output_tokens: result.usage?.output_tokens,
          },
        },
        { headers: cors },
      );
    }
    if (action === "memory_extract")
      return Response.json({ memories: [] }, { headers: cors });
    return Response.json(
      { error: "unknown-action" },
      { status: 400, headers: cors },
    );
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : "server-error";
    if (message === "rate-limit")
      return Response.json({ error: "rate-limit" }, { status: 429, headers: cors });
    if (message.includes("Timeout") || message.includes("timed out"))
      return Response.json({ error: "timeout" }, { status: 504, headers: cors });
    return Response.json(
      { error: "暂时没能理解，请稍后再试。" },
      { status: 500, headers: cors },
    );
  }
});
declare const Deno: {
  env: { get(name: string): string | undefined };
  serve(handler: (request: Request) => Response | Promise<Response>): void;
};
