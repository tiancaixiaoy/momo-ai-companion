import * as Notifications from 'expo-notifications';

export type ReminderKey='morning'|'lunch'|'window'|'reflection';
export type ReminderPreferences=Record<ReminderKey,boolean>;
export const defaultReminderPreferences:ReminderPreferences={morning:false,lunch:false,window:false,reflection:false};

Notifications.setNotificationHandler({handleNotification:async()=>({shouldPlaySound:false,shouldSetBadge:false,shouldShowBanner:true,shouldShowList:true})});

const reminders:{key:ReminderKey;hour:number;minute:number;title:string;body:string}[]=[
  {key:'morning',hour:8,minute:15,title:'Momo 🐰',body:'早呀～起床先喝杯水吧 ♡'},
  {key:'lunch',hour:12,minute:15,title:'Momo 🐰',body:'午饭吃什么啦？拍给我看看 👀'},
  {key:'window',hour:17,minute:50,title:'Momo 🐰',body:'今天的进食窗口还有40分钟～'},
  {key:'reflection',hour:21,minute:30,title:'Momo 🐰',body:'今天过得怎么样？要不要和我复盘30秒？'},
];

export async function applyReminderPreferences(preferences:ReminderPreferences){
  const enabled=Object.values(preferences).some(Boolean);
  if(enabled){const permission=await Notifications.requestPermissionsAsync();if(permission.status!=='granted')throw new Error('permission-denied')}
  await Notifications.cancelAllScheduledNotificationsAsync();
  for(const item of reminders.filter(r=>preferences[r.key])){
    await Notifications.scheduleNotificationAsync({content:{title:item.title,body:item.body,data:{kind:item.key}},trigger:{type:Notifications.SchedulableTriggerInputTypes.DAILY,hour:item.hour,minute:item.minute}});
  }
}
