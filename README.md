# Momo — AI 减脂陪伴师 MVP 1.3

iOS-first Expo / React Native 可交互 MVP，全部用户界面使用简体中文。

## 运行

```bash
npm install
npm run ios
```

也可执行 `npm start` 后使用 Expo Go。

## 已打通

- 7 步 Onboarding 和个性化计划
- 今日、空腹、饮食卡槽和营养进度
- 拍照 / 相册 / 文字记录、识别确认和本地持久化
- AI 陪伴聊天、Craving SOS、情绪对话和 Release
- 历程、体重记录、Craving 统计和设置

AI 层位于 `src/services/ai/`，当前使用离线 mock provider。接入真实模型时请在服务端验证 structured output，并实现同一 `AIProvider` 接口。

## 1.1 新增

- 早安、午餐、进食窗口和晚间复盘的本地通知，支持独立开关
- 与 PRD 对齐的本地 Analytics 事件缓冲，最多保留最近 500 条
- AI Memory 类型和写入门槛
- Supabase 数据库迁移，包含饮食、体重、Craving、Memory、通知偏好和 RLS
- iOS 相机 / 相册用途说明以及 Expo Notifications 构建配置

Supabase 新项目可执行 `supabase/migrations/202609050001_initial_schema.sql` 创建初始结构。客户端目前仍优先使用本地数据，便于无账号演示。

## 1.2 云端接入

1. 在 `.env` 中填写 `EXPO_PUBLIC_SUPABASE_URL` 和 `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`。
2. 对 Supabase 项目依次执行 `supabase/migrations/` 下的迁移。
3. 通过 `supabase secrets set DEEPSEEK_API_KEY=... DEEPSEEK_MODEL=deepseek-flash` 配置服务端密钥。
4. 部署 AI 函数：`supabase functions deploy momo-ai`。

应用检测到云端配置后，`src/services/ai/` 会自动从离线 provider 切换到 Supabase Edge Function。认证、餐食、体重和 Craving 的云端仓储接口位于 `src/services/`。

OpenAI 密钥只由 Edge Function 读取，不会进入 Expo 客户端。饮食识别使用 Responses API 的 strict JSON Schema 输出。

## 1.3 Craving SOS Vertical Slice

- 首页 SOS 一步直达，支持快捷状态和自然语言
- 专用 `craving_sos_v2` 行为合约和五类结构化状态
- 上下文仅发送目标、最近餐食、陪伴风格和最近 6 条 SOS 消息
- 15 秒超时、网络/限流/非法格式降级和明确 loading 状态
- 结束时三档 helpful feedback
- SOS 专用埋点，默认不上报完整对话内容
- `eval/cases.json` 包含 25 条人工 Case，`npm run eval:sos` 运行真实模型回归

审计和迭代记录分别位于 `docs/CRAVING_SOS_AUDIT.md` 和 `eval/ITERATION.md`。Eval 输出必须标记为 `TEST DATA`，不得与真实用户指标混用。
