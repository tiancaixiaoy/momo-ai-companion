export type AIMode='MOCK'|'REAL_TEST'|'PRODUCTION_LIKE';
const requested=(process.env.EXPO_PUBLIC_AI_MODE||'MOCK').toUpperCase();
export const aiMode:AIMode=requested==='REAL_TEST'||requested==='PRODUCTION_LIKE'?requested:'MOCK';
export const isRealAI=aiMode!=='MOCK';
export const runtimeLabel=aiMode==='MOCK'?'开发模式 · MOCK':aiMode==='REAL_TEST'?'真实测试 · LIVE AI':'验收环境 · LIVE AI';
