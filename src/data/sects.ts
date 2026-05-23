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
  none:     { name: '散修',   color: '#888888', icon: '⬜', bonus: {},                    intro: '无门无派，自由江湖。',                                                              alignment: 'neutral',   culture: [] },
  // 🆕 P7 朝廷与叛军
  imperial_court: { name: '朝廷', color: '#FFD700', icon: '🏛️', bonus: { hp: 30, mp: 20 },  intro: '大宋正统，统御四方。科举入仕，封侯拜相，庙堂之上亦江湖。',                           alignment: 'neutral',   culture: ['imperial', 'order', 'power'] },
  rebels:         { name: '叛军', color: '#DC143C', icon: '⚔️', bonus: { atk: 12, agi: 8 }, intro: '前朝残余，光复旧国。燕云十六州，血旗不倒，一剑光寒十九州。',                            alignment: 'chaotic',  culture: ['rebel', 'restoration', 'loyalty'] },
  // 🆕 P9 五大新势力
  riyue:    { name: '日月教', color: '#9b59b6', icon: '🌑', bonus: { atk: 12, agi: 8 },   intro: '日月神教，乾坤大挪移威震天下。正邪之外，唯我独尊。',                                   alignment: 'chaotic',   culture: ['moon', 'sun', 'forbidden', 'power', 'shadow'] },
  tiezhang: { name: '铁掌帮', color: '#7f8c8d', icon: '✊', bonus: { atk: 10, def: 5 },   intro: '铁掌水上漂，裂石功冠绝江湖。称雄一方，行事霸道不留情面。',                              alignment: 'neutral', culture: ['fist', 'clan', 'water', 'brute-force'] },
  wudu:     { name: '五毒教', color: '#27ae60', icon: '🐍', bonus: { atk: 8, crit: 10 },  intro: '五毒俱全，以毒制毒。百草解药不入，无解奇毒令江湖闻之色变。',                            alignment: 'chaotic',   culture: ['poison', 'snake', 'ritual', 'gu-magic'] },
  xuedao:   { name: '血刀门', color: '#c0392b', icon: '🩸', bonus: { atk: 15, hp: -30 }, intro: '嗜血杀戮，以血祭刀。血刀老祖一刀江湖，令正道为之变色。',                                alignment: 'chaotic',   culture: ['blood', 'blade', 'chaos', 'slaughter'] },
  haisha:   { name: '海沙派', color: '#e67e22', icon: '🏴‍☠️', bonus: { atk: 8, agi: 5 }, intro: '南海海盗起家，海沙功路数刁钻。掌控南海航路，行商劫掠两不误。',                          alignment: 'chaotic', culture: ['sea', 'pirate', 'southern', 'mercenary'] },
};
