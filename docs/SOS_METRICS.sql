-- REAL USER DATA only. Exclude anonymous_user_id values used by smoke/eval.
with sos as (
  select * from analytics_events
  where scene='craving_sos'
    and coalesce(anonymous_user_id,'') not like 'anon_smoke_%'
    and coalesce(anonymous_user_id,'') not like 'anon_eval_%'
)
select
  count(*) filter(where event_name='sos_open') as sos_starts,
  round(count(*) filter(where event_name='sos_complete')::numeric/nullif(count(*) filter(where event_name='sos_open'),0),3) as completion_rate,
  round(count(*) filter(where event_name='ai_response_success')::numeric/nullif(count(*) filter(where event_name in('ai_response_success','ai_response_fail')),0),3) as ai_success_rate,
  round(avg(response_latency_ms) filter(where event_name='ai_response_success')) as avg_response_latency_ms,
  round(count(*) filter(where event_name='sos_exit')::numeric/nullif(count(*) filter(where event_name='sos_open'),0),3) as exit_rate,
  count(*) filter(where event_name='helpful_feedback' and feedback='helpful') as helpful,
  count(*) filter(where event_name='helpful_feedback' and feedback='neutral') as neutral,
  count(*) filter(where event_name='helpful_feedback' and feedback='unhelpful') as unhelpful
from sos;
