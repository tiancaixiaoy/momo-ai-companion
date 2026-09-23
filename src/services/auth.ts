import {requireSupabase,supabase} from '../lib/supabase';

export async function getSession(){return supabase?(await supabase.auth.getSession()).data.session:null}
export async function signInWithEmail(email:string,password:string){const {data,error}=await requireSupabase().auth.signInWithPassword({email:email.trim(),password});if(error)throw error;return data.session}
export async function signUpWithEmail(email:string,password:string){const {data,error}=await requireSupabase().auth.signUp({email:email.trim(),password});if(error)throw error;return data.session}
export async function signOut(){const {error}=await requireSupabase().auth.signOut();if(error)throw error}
