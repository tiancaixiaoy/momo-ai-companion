import {isCloudConfigured,requireSupabase} from '../../lib/supabase';
import {CravingAIResponse,CravingContext,CravingMessage} from '../../features/craving/types';
import {aiMode,isRealAI} from '../../config/runtime';

export const CRAVING_PROMPT_VERSION='craving_sos_v2';
export class CravingAIError extends Error{constructor(public kind:'not_configured'|'timeout'|'rate_limit'|'network'|'malformed'|'server',message:string){super(message)}}

function valid(value:any):value is CravingAIResponse{return value&&['physical_hunger','craving','emotional_trigger','post_overeating','unclear'].includes(value.state)&&typeof value.response==='string'&&typeof value.next_action==='string'&&typeof value.needs_follow_up==='boolean'&&typeof value.confidence==='number'}

export async function requestCravingSupport(input:{message:string;context:CravingContext;recent_messages:CravingMessage[];session_id:string;anonymous_user_id:string}):Promise<CravingAIResponse>{
 if(!isRealAI||!isCloudConfigured)throw new CravingAIError('not_configured',`${aiMode} 模式未连接真实 AI`);
 let timer:ReturnType<typeof setTimeout>|undefined;
 try{
  const timeout=new Promise<never>((_,reject)=>{timer=setTimeout(()=>reject(new CravingAIError('timeout','请求超时')),15000)});
  const request=requireSupabase().functions.invoke('momo-ai',{body:{action:'craving_sos',payload:{message:input.message,context:input.context,recent_messages:input.recent_messages.slice(-6),prompt_version:CRAVING_PROMPT_VERSION,session_id:input.session_id,anonymous_user_id:input.anonymous_user_id}}});
  const {data,error}=await Promise.race([request,timeout]);
  if(error){const status=(error as any)?.context?.status;if(status===429)throw new CravingAIError('rate_limit','请求过于频繁');throw new CravingAIError('server',error.message)}
  if(!valid(data))throw new CravingAIError('malformed','模型返回格式无效');
  return data;
 }catch(error){if(error instanceof CravingAIError)throw error;throw new CravingAIError('network',error instanceof Error?error.message:'network-error')}finally{if(timer)clearTimeout(timer)}
}
