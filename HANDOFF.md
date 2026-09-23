# Momo 1.3 Real AI Deployment Handoff

Last updated: 2026-09-23

## 1. 本轮目标与结论

目标是把 Craving SOS 部署到真实 Supabase + LLM 环境，完成 5 条线上 smoke、25 条真实 Eval、人工评分和一次真实 AI 迭代。

结论：**前端已准备通过 GitHub Pages 公开上线；Supabase 项目和 Edge Function 已创建，但真实 AI 与数据库验收仍未完成。** 当前缺少 `OPENAI_API_KEY`，数据库 migration 的直连过程也被远端连接异常阻塞，因此公开 Web 版暂以明确标注的 MOCK 模式运行，没有用 mock 冒充线上模型。

### 已创建的云端资源

- Supabase organization：`Momo AI`（`bbnaqcvebscghipmikif`）
- Supabase project：`momo-ai-test`（ref：`hwxvtqibbctfstwjkqvo`，Singapore，Free tier）
- Dashboard：<https://supabase.com/dashboard/project/hwxvtqibbctfstwjkqvo>
- Edge Function：`momo-ai`，状态 ACTIVE，JWT verification 开启
- GitHub repository：<https://github.com/tiancaixiaoy/momo-ai-companion>
- Web preview：<https://tiancaixiaoy.github.io/momo-ai-companion/>（当前为 MOCK 模式）
- 费用策略：目前只使用 Supabase Free tier；LLM 调用仍有 session 次数、上下文、输出 token 和 timeout 限制

## 2. 已完成

### 审计与安全

- 审计了 Supabase 配置、Expo 环境变量、Edge Function、Craving client、analytics、`.gitignore`、Git 状态和密钥模式。
- 未发现真实 OpenAI/Supabase secret 进入源码或 Git 跟踪文件。
- `.gitignore` 已忽略 `.env`、`.env.*`、Supabase 本地 secrets 和 `.temp`。
- 客户端只允许 Supabase URL 和 publishable key。OpenAI key 仍只能由 Edge Function 读取。

### 环境模式

- 新增 `MOCK` / `REAL_TEST` / `PRODUCTION_LIKE` 三种模式。
- SOS UI 会显示当前是 `MOCK` 还是 `LIVE AI`，避免把 mock 误当成真实模型。
- `REAL_TEST` / `PRODUCTION_LIKE` 如缺少云端配置会明确失败，不会静默 fallback 到 mock。

### 成本和技术保护

- 上下文仍限制为最近 4 顿、陪伴风格、目标和最近 6 条 SOS 消息。
- 客户端 timeout 15 秒，OpenAI 服务端 timeout 14 秒。
- 每个 session 最多 6 次 AI 请求；客户端和 Edge Function 双层检查。
- OpenAI 429 会保留为 429，timeout 返回 504，其他服务端错误使用统一安全文案。
- 服务端返回 model、prompt version 和 token usage，可用于估算每次干预成本。

### Analytics

- 9 个 SOS 核心事件先写本地，在 LIVE AI 模式同步到 Edge Function。
- Edge Function 对事件名使用 allowlist，不接收完整对话。
- 匿名 ID 保存在 AsyncStorage，可在 5–10 人测试周期内关联同一设备。
- [SOS_METRICS.sql](./docs/SOS_METRICS.sql) 可直接计算启动数、完成率、AI 成功率、平均延迟、feedback 分布和退出率。

### 测试工具

- [run_smoke.mjs](./eval/run_smoke.mjs)：5 条线上 smoke，检查 HTTP、延迟、JSON、state、action 和 follow-up。
- [run_eval.mjs](./eval/run_eval.mjs)：25 条真实 Eval，记录 input/expected/actual/response/action/model/prompt/latency/parse/technical status。
- Eval 和 smoke 的 anonymous ID 有独立前缀，指标 SQL 会从 REAL USER DATA 中排除它们。
- 两个脚本均已实际执行，因缺少 URL/key 返回 `SKIPPED`，没有伪造输出。

### GitHub Pages 发布准备

- 新增 GitHub Pages 自动部署工作流；main 分支更新会重新构建并发布。
- 新增 `build:web:pages`，将 Expo Web 的根路径资源改为项目路径兼容格式。
- 本地 TypeScript 和 GitHub Pages Web 构建均已通过。
- 公开版本暂固定为 MOCK 模式，待真实 AI 通过 smoke/eval 后再切换。

## 3. 尚未完成

- 修复 Supabase 数据库直连失败并 push 4 个 migrations。
- 设置 `OPENAI_API_KEY` / `OPENAI_MODEL`。
- 5/5 线上 smoke 成功。
- 25/25 真实 Eval 完成。
- 人工评分和真实 bad case 汇总。
- 根据真实 bad case 完成一次 prompt/context 迭代及重跑。
- invalid key、function 500、malformed JSON、断网、429、空响应和 unexpected state 的真实线上 failure test。
- 将稳定 Web 地址从 MOCK 切换为经 smoke/eval 验收的 `PRODUCTION_LIKE` 构建。

## 4. 现存问题

1. **数据库部署阻塞**：`supabase db push` 连续失败，Management API 可登录，但直连 `db.hwxvtqibbctfstwjkqvo.supabase.co` 时连接被远端终止；migration 尚未应用。
2. **模型密钥缺失**：Edge Function 已部署，但尚未设置 `OPENAI_API_KEY`，真实 AI 调用不可用。
3. **密钥处置要求**：一次 CLI 查询曾把 legacy anon/service-role JWT 输出到本机任务日志；公开测试前必须在 Supabase 中禁用或轮换 legacy keys。不得把这些值写入 Git 或前端。
4. **无法声称真实 AI DoD 完成**：还没有真实 smoke、真实 Eval 或 bad-case 迭代结果。
5. **限流边界**：Edge Function 内存限流不在多实例间共享，只适合小 cohort。
6. **匿名身份边界**：清理浏览器/App 存储会生成新 ID；当前不做跨设备关联。

## 5. 接下来怎么做

### A. 需要项目拥有者提供的密钥

```bash
cd "/Users/wuqimahei/Documents/ChatGPT/项目/momo"
npx supabase@latest secrets set OPENAI_API_KEY=<SECRET> OPENAI_MODEL=<APPROVED_MODEL>
```

请勿把 secret 发到聊天、写入 `.env` 或提交到 Git。

### B. 部署

```bash
npx supabase@latest db push --linked
```

在本地建立不会被 Git 跟踪的 `.env.production-like`：

```text
EXPO_PUBLIC_SUPABASE_URL=https://<PROJECT_REF>.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
EXPO_PUBLIC_AI_MODE=PRODUCTION_LIKE
```

### C. 验收顺序

```bash
SUPABASE_URL=https://<PROJECT_REF>.supabase.co \
SUPABASE_PUBLISHABLE_KEY=sb_publishable_... \
npm run smoke:sos

SUPABASE_URL=https://<PROJECT_REF>.supabase.co \
SUPABASE_PUBLISHABLE_KEY=sb_publishable_... \
npm run eval:sos
```

1. 只有 5/5 smoke 通过才连接客户端。
2. 用 [rubric.md](./eval/rubric.md) 完成 25 条人工评分。
3. 统计 bad case，选择影响最高的 1–3 类。
4. 只修改 prompt、context 或 follow-up 中一组变量。
5. 更新 [ITERATION.md](./eval/ITERATION.md) 并重跑 smoke + 25 Eval。
6. 运行全部 failure tests。
7. 最后使用 production-like env 导出 Web，部署稳定测试 URL。

## 6. 本轮已执行的验证

- Supabase CLI version: `2.117.0`
- Supabase project: created, linked, ACTIVE_HEALTHY
- Edge Function: deployed, ACTIVE
- Database migrations: blocked by terminated direct Postgres connection
- OpenAI secret: not configured
- Secret pattern scan: no real key found
- Smoke runner: executed, correctly returned `SKIPPED` without credentials
- 25-case Eval runner: executed, correctly returned `SKIPPED` without credentials
- TypeScript: passed
- iOS bundle: passed, 2.2 MB
- Web bundle: passed, 811 KB
- GitHub Pages deployment: passed; public index returned HTTP 200
- Eval dataset integrity: passed, 25 cases

## 7. Definition of Done 状态

| DoD | 状态 |
|---|---|
| 5 个线上 smoke 真实调用 LLM | ❌ Blocked |
| `momo-ai` Edge Function 部署 | ✅ Active |
| Client 调用线上 Function | ❌ Blocked |
| 25 条真实 Eval | ❌ Blocked |
| 真实 Bad Case 分析 | ❌ Blocked |
| 基于真实 Eval 的一次迭代 | ❌ Blocked |
| 核心 SOS 事件云端写入 | ⚠️ Code ready, unverified |
| 主要错误路径真实测试 | ❌ Blocked |

本轮不应标记为上线验收完成。拥有 Supabase 项目权限后，按第 5 节继续即可。
