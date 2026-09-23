import {requireSupabase} from '../../lib/supabase';
import {AIProvider,FoodAnalysis} from './types';

async function invoke<T>(action:string,payload:unknown){const {data,error}=await requireSupabase().functions.invoke('momo-ai',{body:{action,payload}});if(error)throw error;return data as T}
export const cloudAI:AIProvider={
 analyzeFood(input){return invoke<FoodAnalysis>('food_analysis',input)},
 async companionReply(input){const data=await invoke<{reply:string}>('companion_reply',input);return data.reply},
 async extractMemories(input){const data=await invoke<{memories:unknown[]}>('memory_extract',input);return data.memories},
};
