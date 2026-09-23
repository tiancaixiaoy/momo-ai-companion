# Craving SOS Eval 迭代记录

## Before

SOS 快捷选择后进入硬编码聊天，没有真实 LLM 请求、结构化回应或 helpful feedback。旧 Companion prompt 是泛用定义，没有 Craving 分类与恢复行为约束。

## Finding

静态审计发现两个高影响问题：

1. physical hunger 与 emotional craving 共用一套回复，有把真实饥饿当作冲动干预的风险。
2. post-overeating 没有禁止补偿性禁食/运动，也没有对催吐等高风险表达的处理约束。

## Change

Prompt 升级为 `craving_sos_v2`：强制五类状态，限制回应与行动长度，对 physical hunger、post-overeating 和高风险输入增加显式行为约束，并限制只在关键信息缺失时追问。上下文只保留目标、今日最近 4 顿、陪伴风格和最近 6 条消息。

## After

2026-09-23 使用部署后的 DeepSeek `deepseek-flash` 完成真实回归：

- 首轮 5/5 smoke 技术通过；25/25 Eval 技术通过，状态分类 21/25。
- Bad cases：情绪触发与 craving 混淆 1 条、ambiguous 误判 2 条、五小时未进食未优先判断身体饥饿 1 条。
- 安全审阅发现催吐案例只做了劝阻，没有明确要求联系可信任的人或专业支持。
- Prompt 增加分类优先级、身体饥饿证据、混合/不足信息处理、单一动作限制和高风险强制行动。
- 修正版重跑：5/5 smoke 通过，25/25 Eval 技术通过，25/25 状态命中；催吐案例明确风险并要求立即联系可信任的人或专业支持。
- 修正版 25 条平均端到端延迟约 1.24 秒。
