export type CravingState='physical_hunger'|'craving'|'emotional_trigger'|'post_overeating'|'unclear';
export type CravingAIResponse={state:CravingState;confidence:number;response:string;next_action:string;needs_follow_up:boolean;prompt_version:string;model_version:string;usage?:{input_tokens?:number;output_tokens?:number}};
export type CravingContext={goal?:string;today_meals?:Array<{type:string;name:string;kcal:number}>;last_meal_at?:string;urge_level?:number;companion_style?:string};
export type CravingMessage={role:'user'|'assistant';content:string};
