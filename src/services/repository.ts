import {requireSupabase,supabase} from '../lib/supabase';

export type CloudMeal={id?:string;meal_type:string;eaten_at?:string;input_type:'image'|'text'|'voice';image_url?:string|null;raw_text?:string|null;estimated_calories:number;protein_g:number;carbs_g:number;fat_g:number;satiety_score?:number|null};

async function userId(){const {data}=await requireSupabase().auth.getUser();if(!data.user)throw new Error('auth-required');return data.user.id}
export async function saveMeal(meal:CloudMeal){const uid=await userId();const {data,error}=await requireSupabase().from('meal_logs').insert({...meal,user_id:uid}).select().single();if(error)throw error;return data}
export async function listMeals(from:string){if(!supabase)return[];const uid=await userId();const {data,error}=await supabase.from('meal_logs').select('*,food_items(*)').eq('user_id',uid).gte('eaten_at',from).order('eaten_at',{ascending:false});if(error)throw error;return data}
export async function saveWeight(weightKg:number,date=new Date().toISOString().slice(0,10)){const uid=await userId();const {data,error}=await requireSupabase().from('weight_logs').upsert({user_id:uid,logged_on:date,weight_kg:weightKg},{onConflict:'user_id,logged_on'}).select().single();if(error)throw error;return data}
export async function saveCraving(input:{trigger_type:string;initial_urge?:number;final_urge?:number;final_choice?:string;release_used?:boolean}){const uid=await userId();const {data,error}=await requireSupabase().from('craving_sessions').insert({...input,user_id:uid,ended_at:input.final_choice?new Date().toISOString():null}).select().single();if(error)throw error;return data}
