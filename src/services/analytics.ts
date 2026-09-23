import AsyncStorage from '@react-native-async-storage/async-storage';
import {isCloudConfigured,supabase} from '../lib/supabase';
import {isRealAI} from '../config/runtime';

export type AnalyticsEvent=
  |'onboarding_completed'|'home_opened'|'food_log_started'|'food_photo_uploaded'
  |'food_analysis_completed'|'meal_saved'|'companion_message_sent'|'craving_sos_opened'
  |'craving_type_selected'|'release_started'|'release_completed'|'craving_final_choice'
  |'weight_logged'|'journey_opened'|'notification_opened'
  |'sos_open'|'sos_submit'|'ai_request_start'|'ai_response_success'|'ai_response_fail'
  |'sos_followup'|'sos_complete'|'sos_exit'|'helpful_feedback';

const KEY='momo-analytics-v1';
export async function track(name:AnalyticsEvent,properties:Record<string,unknown>={}){
  const current=JSON.parse((await AsyncStorage.getItem(KEY))||'[]');
  current.push({name,properties,at:new Date().toISOString()});
  await AsyncStorage.setItem(KEY,JSON.stringify(current.slice(-500)));
}
export async function getAnalyticsEvents(){return JSON.parse((await AsyncStorage.getItem(KEY))||'[]')}

export async function getAnonymousUserId(){let id=await AsyncStorage.getItem('momo-anonymous-id');if(!id){id=`anon_${Date.now()}_${Math.random().toString(36).slice(2,9)}`;await AsyncStorage.setItem('momo-anonymous-id',id)}return id}
export async function trackSOS(event_name:AnalyticsEvent,input:{session_id:string;prompt_version:string;model_version?:string;response_latency?:number;feedback?:string;error_type?:string}){
 const event={anonymous_user_id:await getAnonymousUserId(),session_id:input.session_id,scene:'craving_sos',prompt_version:input.prompt_version,model_version:input.model_version,response_latency:input.response_latency,feedback:input.feedback,error_type:input.error_type};
 await track(event_name,event);
 if(isRealAI&&isCloudConfigured&&supabase){try{await supabase.functions.invoke('momo-ai',{body:{action:'analytics_event',payload:{event_name,...event}}})}catch{/* Local event remains the reliable fallback. */}}
}
