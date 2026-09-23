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

结构和本地回归检查通过。当前开发环境没有 Supabase/OpenAI 密钥，因此尚未生成真实模型评分，也没有伪造通过结果。配置后执行 `npm run eval:sos`，完成 25 条真实回归并在此补充 bad case 统计。
