import type { SectId, SkillId } from './types';

export const WUDANG_SKILL_TABLE: Array<[number, SkillId]> = [
  [1,  'wudang_changquan'], [2, 'yangqi_jue'], [3, 'wudang_jianfa_basic'], [4, 'wudang_qinggong'],
  [11, 'mianzhang'], [12, 'wudang_sword'], [13, 'zixiao'], [14, 'wudang_huti'], [15, 'wudang_lianjian'],
  [21, 'taiji'], [22, 'taiji_jian'], [23, 'liangyi_sword'], [24, 'chunyang_gong'], [25, 'wudang_zhenfa'],
];

export const SHAOLIN_SKILL_TABLE: Array<[number, SkillId]> = [
  [1,  'luohan_fist'], [2, 'shaolin_chan_yi'], [3, 'vajra_palm'], [4, 'shaolin_tie_sha'],
  [11, 'yijin_jing'], [12, '72_arts'], [13, 'shaolin_luohan_18'], [14, 'shaolin_long_zhua'], [15, 'shaolin_bei_ye'],
  [21, 'shaolin_hu_he'], [22, 'shaolin_shi_zi_hou'], [23, 'shaolin_prajna_zhang'], [24, 'shaolin_bodhi_xin'],
  [31, 'shaolin_72_true'], [32, 'shaolin_jinggang_shen'], [33, 'shaolin_long_xiang'], [34, 'shaolin_rulai_zhang'],
  [41, 'shaolin_tianren'], [42, 'shaolin_wushang_bodhi'], [43, 'shaolin_prajna_great'], [44, 'shaolin_six_pulse'],
  [51, 'shaolin_nirvana'], [52, 'shaolin_datura'], [53, 'shaolin_tathagata'], [54, 'shaolin_vajra_true'],
];

export const RIYUE_SKILL_TABLE: Array<[number, SkillId]> = [
  [1,  'riyue_moon_palm'], [2, 'riyue_sun_qi'], [3, 'riyue_dark_fist'], [4, 'riyue_shadow_step'],
  [11, 'riyue_lunar_palm'], [12, 'riyue_sun_cultivation'], [13, 'riyue_moon_storm'], [14, 'riyue_poison_fog'], [15, 'riyue_shadow_guard'],
  [21, 'riyue_eclipse'], [22, 'riyue_dual_cultivate'], [23, 'riyue_sun_moon_combo'], [24, 'riyue_shadow_clone'],
  [31, 'riyue_qiankun_shift'], [32, 'riyue_moon_goddess'], [33, 'riyue_shadow_realm'], [34, 'riyue_full_moon'],
  [41, 'riyue_qiankun_true'], [42, 'riyue_sacred_sun'], [43, 'riyue_tianren'], [44, 'riyue_sun_moon_divine'],
  [51, 'riyue_nirvana'], [52, 'riyue_void_moon'], [53, 'riyue_dark_sun'], [54, 'riyue_ultimate'],
];

export const SECT_SKILL_TABLES: Partial<Record<SectId, Array<[number, SkillId]>>> = {
  wudang:  WUDANG_SKILL_TABLE,
  shaolin: SHAOLIN_SKILL_TABLE,
  riyue:   RIYUE_SKILL_TABLE,
};

/** 获取技能所在的境界层（用于学习费用计算） */
export function getSkillRealm(level: number): {
  name: string; cost: number; color: string; range: string;
} {
  if (level <= 10)  return { name: '炼气', cost: 20,  color: '#e8e8e8', range: '1-10' };
  if (level <= 20)  return { name: '筑基', cost: 50,  color: '#4caf50', range: '11-20' };
  if (level <= 30)  return { name: '结丹', cost: 100, color: '#42a5f5', range: '21-30' };
  if (level <= 40)  return { name: '元婴', cost: 200, color: '#ab47bc', range: '31-40' };
  if (level <= 50)  return { name: '化神', cost: 400, color: '#ffd700', range: '41-50' };
  return              { name: '渡劫', cost: 800, color: '#ff7043', range: '51-60' };
}
