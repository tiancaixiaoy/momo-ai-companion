import {AIProvider} from './types';
// 无后端密钥时使用可离线演示的 provider。真实 provider 实现同一接口即可替换。
export const mockAI:AIProvider={
 async analyzeFood(){return{meal_name:'牛肉面',items:[{name:'牛肉面',amount_description:'约一碗',calories:520,protein_g:27,carbs_g:72,fat_g:18,confidence:.72}],total_calories:520,protein_g:27,carbs_g:72,fat_g:18,confidence:.72}},
 async companionReply(){return'我在听。我们先一起把眼前这一小步照顾好 ♡'},async extractMemories(){return[]}
};
