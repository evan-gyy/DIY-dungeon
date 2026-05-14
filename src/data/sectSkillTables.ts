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

export const EMEI_SKILL_TABLE: Array<[number, SkillId]> = [
  [1,  'emei_sword'], [2, 'emei_chan_yi'], [3, 'emei_flower_needle'], [4, 'emei_cloud_step'],
  [11, 'liing_palm'], [12, 'emei_sword_breeze'], [13, 'emei_jade_guard'], [14, 'emei_iron_finger'],
  [21, 'emei_poison'], [22, 'emei_lotus_palm'], [23, 'emei_swallow_sword'], [24, 'emei_bell_sound'],
  [31, 'hundred_birds'], [32, 'emei_nirvana'], [33, 'emei_sword_phoenix'], [34, 'emei_plum_heal'],
];

export const BEGGAR_SKILL_TABLE: Array<[number, SkillId]> = [
  [1,  'beggar_fist'], [2, 'beggar_wine'], [3, 'beggar_slap'], [4, 'beggar_roll'],
  [11, 'stick_art'], [12, 'beggar_kick'], [13, 'beggar_iron_shirt'], [14, 'beggar_storm_fist'],
  [21, 'mud_walk'], [22, 'beggar_18_subdue'], [23, 'beggar_dog_storm'], [24, 'beggar_roar'],
  [31, 'dragon_palm'], [32, 'beggar_overlord'], [33, 'beggar_dragon_roar'], [34, 'beggar_chief_fist'],
];

export const QUANZHEN_SKILL_TABLE: Array<[number, SkillId]> = [
  [1,  'quanzhen_sword'], [2, 'quanzhen_qi'], [3, 'quanzhen_fist'], [4, 'quanzhen_step'],
  [11, 'quanzhen_sword_qian'], [12, 'quanzhen_neidan'], [13, 'quanzhen_beidou'], [14, 'quanzhen_fu'],
  [21, 'quanzhen_sword_kun'], [22, 'quanzhen_thunder'], [23, 'quanzhen_7star_array'], [24, 'quanzhen_sword_divide'],
  [31, 'quanzhen_dao_jing'], [32, 'quanzhen_sword_lord'], [33, 'quanzhen_shendan'], [34, 'quanzhen_sword_star'],
];

export const KUNLUN_SKILL_TABLE: Array<[number, SkillId]> = [
  [1,  'kunlun_sword'], [2, 'kunlun_ice_qi'], [3, 'kunlun_frost_palm'], [4, 'kunlun_snow_step'],
  [11, 'kunlun_sword_cold'], [12, 'kunlun_ice_guard'], [13, 'kunlun_blizzard'], [14, 'kunlun_freeze'],
  [21, 'kunlun_sword_jiuxiao'], [22, 'kunlun_glacier'], [23, 'kunlun_snow_veil'], [24, 'kunlun_sword_storm'],
  [31, 'kunlun_hanbing'], [32, 'kunlun_sword_peak'], [33, 'kunlun_jade_purity'], [34, 'kunlun_sword_frozen'],
];

export const TANGMEN_SKILL_TABLE: Array<[number, SkillId]> = [
  [1,  'tang_needle'], [2, 'tang_poison_qi'], [3, 'tang_blade_basic'], [4, 'tang_smoke'],
  [11, 'tang_dart'], [12, 'tang_shadow_step'], [13, 'tang_rain_needle'], [14, 'tang_venom'],
  [21, 'tang_blade_adv'], [22, 'tang_poison_mist'], [23, 'tang_dart_storm'], [24, 'tang_toxic_art'],
  [31, 'tang_blade_master'], [32, 'tang_pear_flower'], [33, 'tang_poison_secret'], [34, 'tang_night_walker'],
];

export const SECT_SKILL_TABLES: Partial<Record<SectId, Array<[number, SkillId]>>> = {
  wudang:   WUDANG_SKILL_TABLE,
  shaolin:  SHAOLIN_SKILL_TABLE,
  riyue:    RIYUE_SKILL_TABLE,
  emei:     EMEI_SKILL_TABLE,
  beggar:   BEGGAR_SKILL_TABLE,
  quanzhen: QUANZHEN_SKILL_TABLE,
  kunlun:   KUNLUN_SKILL_TABLE,
  tangmen:  TANGMEN_SKILL_TABLE,
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
