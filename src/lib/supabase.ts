import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {createClient,SupabaseClient} from '@supabase/supabase-js';

const url=process.env.EXPO_PUBLIC_SUPABASE_URL;
const publishableKey=process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY||process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const isCloudConfigured=Boolean(url&&publishableKey);
export const supabase:SupabaseClient|null=isCloudConfigured?createClient(url!,publishableKey!,{auth:{storage:AsyncStorage,autoRefreshToken:true,persistSession:true,detectSessionInUrl:false}}):null;

export function requireSupabase(){if(!supabase)throw new Error('cloud-not-configured');return supabase}
