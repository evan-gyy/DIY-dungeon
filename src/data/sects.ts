import type { SectId, SectData } from './types';

export const SECTS: Record<SectId, SectData> = {
  wudang:  { name: '武当派', color: '#5dade2', icon: '☯️', bonus: { mp: 30, agi: 5 },  intro: '内外兼修，以柔克刚，武当剑法天下闻名。' },
  emei:    { name: '峨眉派', color: '#f1948a', icon: '🌸', bonus: { atk: 5, mp: 20 },  intro: '剑指苍穹，玉手素笺，峨眉武学妙不可言。' },
  shaolin: { name: '少林派', color: '#f0b27a', icon: '🏯', bonus: { hp: 50, def: 8 },  intro: '禅武合一，铜皮铁骨，少林功夫博大精深。' },
  beggar:  { name: '丐帮',   color: '#a9cce3', icon: '🐉', bonus: { atk: 8, agi: 3 },  intro: '行走江湖，降龙十八掌威震四方。' },
  huashan: { name: '华山派', color: '#82e0aa', icon: '⚔️', bonus: { atk: 10, crit: 5 }, intro: '剑气凌云，华山论剑，气宗与剑宗各领风骚。' },
  demon:   { name: '魔教',   color: '#c39bd3', icon: '🌙', bonus: { atk: 15, hp: -20 }, intro: '乾坤大挪移，日月神教，绝世神功令群雄胆寒。' },
};
