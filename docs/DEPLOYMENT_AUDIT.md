# Momo 1.3 Deployment Audit

Audit date: 2026-09-16

## Already Ready

- Expo / React Native / Web 共用 `EXPO_PUBLIC_*` 客户端变量。
- `src/lib/supabase.ts` 只读取 Supabase URL 和 publishable key，不包含服务端密钥。
- 客户端路径为 Client → Supabase Edge Function，没有直连 OpenAI。
- `momo-ai` 保留五类状态、strict JSON Schema、有限上下文和最大输出。
- 客户端有 15 秒 timeout；服务端 OpenAI 请求有 14 秒 timeout。
- 每个 SOS session 最多 6 次 AI 请求，客户端和 Edge Function 都执行限制。
- 25 条 Eval 和 5 条 smoke 已可直接调用远端 endpoint。
- analytics 只保留匿名 ID、session、事件、模型/prompt、延迟、反馈和错误类型，不保存真实用户对话。

## Missing

- 没有 Supabase CLI 登录：`projects list` 返回 `Access token not provided`。
- 没有 remote project ref，本地项目尚未 link。
- 没有可用的 Supabase URL / publishable key。
- 没有 Edge Function 中的 `DEEPSEEK_API_KEY`。
- `momo-ai` 尚未部署到远端。
- 5 条线上 smoke、25 条真实 Eval、人工评分和基于真实 bad case 的二次迭代尚未执行。
- 稳定 Web 托管地址尚未发布；LocalTunnel 只是临时前端预览。

## Security Risks

- 审计前 `.env` 未被完整忽略，现已修正为忽略 `.env` 和 `.env.*`，仅保留 `.env.example`。
- Git 跟踪文件和本地源码扫描未发现 OpenAI key、`sb_secret_` key 或 service-role 值。
- 当前整个 `momo/` 目录尚未进入 Git 历史，因此没有可供审计的项目级旧提交。
- Edge Function analytics 使用服务端自带的 `SUPABASE_SERVICE_ROLE_KEY`，该值不进入客户端。
- 内存型 Edge Function rate limit 是最小保护，不是全局分布式强限流；5–10 人测试 cohort 可接受，公开扩容前必须改为数据库或网关限流。

## Smallest Required Changes

1. 登录 Supabase CLI 并 link 一个 project。
2. push 现有 migrations。
3. 在 Edge Function secrets 设置 `DEEPSEEK_API_KEY` 和可选 `DEEPSEEK_MODEL`。
4. deploy `momo-ai`。
5. 创建本地 `.env.production-like`，设置 URL、publishable key 和 `EXPO_PUBLIC_AI_MODE=PRODUCTION_LIKE`。
6. 先运行 5 条 smoke，再运行 25 条 Eval。
7. 人工评分、选出 1–3 类最高影响 bad case，只修改一组可解释变量后重跑。
