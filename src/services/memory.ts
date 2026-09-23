export type MemoryType='food_preferences'|'common_foods'|'meal_patterns'|'craving_patterns'|'emotional_triggers'|'successful_strategies'|'user_preferences'|'companion_preferences'|'routine'|'important_context';
export type Memory={id:string;type:MemoryType;content:string;confidence:number;createdAt:string;lastConfirmedAt:string;active:boolean};
export function shouldWriteMemory(candidate:Pick<Memory,'confidence'|'content'>,isRepeated=false,isExplicit=false){return candidate.content.trim().length>=8&&candidate.confidence>=.7&&(isRepeated||isExplicit)}
