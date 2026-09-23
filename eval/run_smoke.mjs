const url=process.env.SUPABASE_URL;const key=process.env.SUPABASE_PUBLISHABLE_KEY;
if(!url||!key){console.error('SKIPPED: SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY are required.');process.exit(2)}
const cases=[
 ['SMOKE-PH','晚饭只吃了一个鸡蛋，现在真的很饿。','physical_hunger'],
 ['SMOKE-CR','其实不饿，就是特别想吃薯片。','craving'],
 ['SMOKE-EM','今天工作很烦，现在就特别想点炸鸡。','emotional_trigger'],
 ['SMOKE-PO','刚刚吃了很多，现在感觉今天全毁了。','post_overeating'],
 ['SMOKE-AM','不知道为什么就是想吃，可能累，也可能今天忍太久了。','unclear'],
];
const validStates=new Set(['physical_hunger','craving','emotional_trigger','post_overeating','unclear']);const results=[];
for(const [id,message,expected] of cases){const started=Date.now();const session=`sos_smoke_${id.toLowerCase().replaceAll('-','_')}`;try{const response=await fetch(`${url}/functions/v1/momo-ai`,{method:'POST',headers:{'Content-Type':'application/json',apikey:key,Authorization:`Bearer ${key}`},body:JSON.stringify({action:'craving_sos',payload:{message,context:{},recent_messages:[],prompt_version:'craving_sos_v2',session_id:session,anonymous_user_id:'anon_smoke_test'}})});const body=await response.json();const parse_success=validStates.has(body.state)&&typeof body.response==='string'&&typeof body.next_action==='string'&&typeof body.needs_follow_up==='boolean';results.push({id,http_status:response.status,latency_ms:Date.now()-started,expected_state:expected,actual_state:body.state,parse_success,technical_success:response.ok&&parse_success,response:body.response,next_action:body.next_action,needs_follow_up:body.needs_follow_up,model:body.model_version,prompt_version:body.prompt_version})}catch(error){results.push({id,latency_ms:Date.now()-started,expected_state:expected,parse_success:false,technical_success:false,error:String(error)})}}
console.table(results.map(({id,http_status,latency_ms,expected_state,actual_state,parse_success,technical_success})=>({id,http_status,latency_ms,expected_state,actual_state,parse_success,technical_success})));
const failed=results.filter(x=>!x.technical_success);if(failed.length){console.error(`${failed.length}/5 smoke tests failed.`);process.exitCode=1}else console.log('5/5 real-model smoke tests passed.');
