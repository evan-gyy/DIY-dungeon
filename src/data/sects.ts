import type { SectId, SectData } from './types';

export const SECTS: Record<SectId, SectData> = {
  wudang:  { name: '武当派', color: '#5dade2', icon: '☯️', bonus: { mp: 30, agi: 5 },  intro: '内外兼修，以柔克刚，武当剑法天下闻名。', alignment: 'righteous', culture: ['taoist', 'sword', 'mountain', 'inner-peace'] },
  emei:    { name: '峨眉派', color: '#f1948a', icon: '🌸', bonus: { atk: 5, mp: 20 },  intro: '剑指苍穹，玉手素笺，峨眉武学妙不可言。', alignment: 'righteous', culture: ['buddhist', 'sword', 'mountain', 'female'] },
  shaolin: { name: '少林派', color: '#f0b27a', icon: '🏯', bonus: { hp: 50, def: 8 },  intro: '禅武合一，铜皮铁骨，少林功夫博大精深。', alignment: 'righteous', culture: ['buddhist', 'fist', 'temple', 'discipline'] },
  beggar:  { name: '丐帮',   color: '#a9cce3', icon: '🐉', bonus: { atk: 8, agi: 3 },  intro: '行走江湖，降龙十八掌威震四方。', alignment: 'righteous', culture: ['beggar', 'palm', 'street', 'loyalty'] },
  huashan: { name: '华山派', color: '#82e0aa', icon: '⚔️', bonus: { atk: 10, crit: 5 }, intro: '剑气凌云，华山论剑，气宗与剑宗各领风骚。', alignment: 'neutral',   culture: ['sword', 'mountain', 'rivalry'] },
  demon:   { name: '魔教',   color: '#c39bd3', icon: '🌙', bonus: { atk: 15, hp: -20 }, intro: '乾坤大挪移，日月神教，绝世神功令群雄胆寒。', alignment: 'chaotic',   culture: ['moon', 'shadow', 'forbidden', 'power'] },
  // 🆕 五大新宗门
  maoshan: { name: '茅山派', color: '#d4a574', icon: '🔮', bonus: { mp: 40, crit: 3 },  intro: '符箓驱邪，茅山道术三绝天下无双。', alignment: 'righteous', culture: ['taoist', 'talisman', 'ritual', 'exorcism'] },
  kunlun:  { name: '昆仑派', color: '#e0e0e0', icon: '🏔️', bonus: { atk: 10, def: 5 }, intro: '雪山绝巅，昆仑剑法如龙啸九天。', alignment: 'neutral',   culture: ['sword', 'mountain', 'remote', 'ascetic'] },
  qingcheng:{ name: '青城派', color: '#7dcea0', icon: '🌿', bonus: { agi: 5, crit: 5 },  intro: '青城天下幽，拳剑双绝蜀中称雄。', alignment: 'neutral',   culture: ['taoist', 'sword', 'fist', 'mountain'] },
  tangmen: { name: '唐门',   color: '#e74c3c', icon: '🕷️', bonus: { atk: 8, crit: 8 },  intro: '暗器无双，唐家堡毒步天下令人胆寒。', alignment: 'neutral',   culture: ['poison', 'hidden_weapons', 'clan', 'secrecy'] },
  xiaoyao: { name: '逍遥派', color: '#af7ac5', icon: '🦅', bonus: { mp: 30, agi: 8 },  intro: '乘天地之正，御六气之辩，逍遥于江湖之外。', alignment: 'neutral',   culture: ['carefree', 'unique', 'elite', 'hidden'] },
  // 🆕 三大新门派
  quanzhen: { name: '全真教', color: '#5b8c5a', icon: '⛰️', bonus: { mp: 35, def: 5 },  intro: '终南山下，全真祖庭。天罡北斗阵冠绝天下，道武双修以静制动。', alignment: 'righteous', culture: ['taoist', 'sword', 'formation', 'inner-alchemy'] },
  kongtong: { name: '崆峒派', color: '#c0392b', icon: '👊', bonus: { atk: 8, hp: 30 },  intro: '崆峒山上，裂石拳威震江湖。拳出如雷碎石如泥，非大毅力者不可修。', alignment: 'neutral',   culture: ['fist', 'mountain', 'diverse', 'stone-breaking'] },
  diancang: { name: '点苍派', color: '#2980b9', icon: '🗡️', bonus: { atk: 7, agi: 7 },  intro: '点苍山下，洱海之滨。剑法轻灵飘逸如苍山云雪，南疆第一剑派。', alignment: 'neutral',   culture: ['sword', 'mountain', 'remote', 'southern'] },
};
