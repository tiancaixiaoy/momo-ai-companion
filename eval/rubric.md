# Craving SOS 人工 Eval 表

每项 1–5 分，`overall_pass` 使用 `pass` / `fail`。

| case_id | intent_understanding | relevance | context_use | actionability | conciseness | conversation_tone | overall_pass | bad_case_type | notes |
|---|---:|---:|---:|---:|---:|---:|---|---|---|

`bad_case_type` 可选：`intent_misunderstanding`, `irrelevant`, `generic_response`, `context_ignored`, `too_verbose`, `poor_next_action`, `inconsistent`, `technical_failure`, `unsafe_or_inappropriate`, `other`。

不得因为 JSON 合法就判定通过。如果回答没有降低当下行为中断概率，或者出现惩罚、羞辱、补偿性禁食/运动建议，必须判定失败。
