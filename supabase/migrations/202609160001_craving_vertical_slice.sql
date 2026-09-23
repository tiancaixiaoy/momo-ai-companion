alter table craving_sessions add column if not exists ai_state text check(ai_state in('physical_hunger','craving','emotional_trigger','post_overeating','unclear'));
alter table craving_sessions add column if not exists ai_confidence numeric check(ai_confidence between 0 and 1);
alter table craving_sessions add column if not exists helpful_feedback text check(helpful_feedback in('helpful','neutral','unhelpful'));
alter table craving_sessions add column if not exists prompt_version text;
alter table craving_sessions add column if not exists model_version text;
alter table craving_sessions add column if not exists response_latency_ms integer check(response_latency_ms>=0);

alter table analytics_events add column if not exists anonymous_user_id text;
alter table analytics_events add column if not exists session_id text;
alter table analytics_events add column if not exists scene text;
alter table analytics_events add column if not exists prompt_version text;
alter table analytics_events add column if not exists model_version text;
alter table analytics_events add column if not exists response_latency_ms integer;
alter table analytics_events add column if not exists feedback text;
alter table analytics_events add column if not exists error_type text;
create index if not exists analytics_sos_session_idx on analytics_events(scene,session_id,created_at);
