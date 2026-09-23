# Craving SOS Current-state Audit

## 审计时的真实状态

| 能力 | 审计结果 |
|---|---|
| SOS 入口 | 已有，但今日页先跳转 Chat，需再点一次 SOS |
| 快捷状态 | 已有静态选项 |
| 自然语言 | 原 Chat 可输入，但与 SOS 语义不相连 |
| 真实 LLM | Cloud Provider 已有雏形，SOS 未调用 |
| SOS 结构化输出 | 不存在 |
| 有限上下文 | 不存在 |
| Loading / timeout / malformed / rate limit | 不存在 |
| Helpful feedback | 不存在 |
| SOS 埋点 | 部分通用事件，不符合本轮字段要求 |
| Eval | 不存在 |

## 最小改动

1. 保留现有 Provider 和 App 结构，新增 Craving 专用请求合约。
2. 仅替换 Chat 中的 SOS 子流程，不重构其他页面。
3. Edge Function 新增 `craving_sos` action 和 strict JSON Schema。
4. 新增专用的无敏感内容埋点、三档反馈和 25 条 Eval。

## 当前限制

代码已具备真实模型路径，但本机未配置 Supabase URL/publishable key，Edge Function 也无可验证的 OpenAI secret。因此本轮不声称真实线上请求已成功，只有配置并部署后才能达成最终的 real-model 验收。
