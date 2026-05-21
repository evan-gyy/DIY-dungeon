// ============================================================
//  src/data/types.ts — 全局 TypeScript 类型定义
// ============================================================

// ──── ID 联合类型（所有 ID 都在这里集中定义）────

export type SectId =
  // 正道四大派
  | 'wudang' | 'emei' | 'shaolin' | 'beggar'
  // 中立/一流
  | 'huashan' | 'quanzhen' | 'kunlun' | 'tangmen' | 'qingcheng'
  // 中立/二流
  | 'kongtong' | 'diancang' | 'maoshan' | 'tiezhang'
  // 邪道/旁门
  | 'demon' | 'riyue' | 'wudu' | 'xuedao' | 'haisha'
  // 逍遥/特殊
  | 'xiaoyao'
  // 官府 & 叛军
  | 'imperial_court' | 'rebels'
  // 无门派
  | 'none';

export type CharId = 'male_good' | 'male_evil' | 'female_good' | 'female_evil';

export type SkillId =
  // 主角专属
  | 'yi_li_xin_jing'
  // 武当·外门（炼气期）
  | 'wudang_changquan' | 'yangqi_jue' | 'wudang_jianfa_basic' | 'wudang_qinggong'
  // 武当·内门（筑基期）
  | 'mianzhang' | 'wudang_sword' | 'zixiao' | 'wudang_huti' | 'wudang_lianjian'
  // 武当·真传（结丹期）
  | 'taiji' | 'taiji_jian' | 'liangyi_sword' | 'chunyang_gong' | 'wudang_zhenfa'
  // 武当·长老（元婴期）
  | 'taiji_shengong' | 'wudang_jianzhen' | 'chunyang_wuji' | 'sanfeng_yijian'
  // 武当·掌门级（化神期）
  | 'wudang_tianren' | 'wudang_hunypic' | 'wudang_taiqing' | 'wudang_zhenwu_jianyi'
  // 武当·入圣（渡劫期）
  | 'wudang_dao_jing' | 'wudang_xuankong' | 'wudang_taiyi' | 'wudang_wuji_dao_jian'
  // 峨眉派
  | 'emei_sword' | 'liing_palm' | 'emei_poison' | 'hundred_birds'
  // 少林派
  | 'luohan_fist' | 'vajra_palm' | 'yijin_jing' | '72_arts'
  // 丐帮
  | 'beggar_fist' | 'stick_art' | 'mud_walk' | 'dragon_palm'
  // 第三章：武当真传剑法
  | 'wudang_yunkai' | 'wudang_songtao' | 'wudang_guiyuan'
  // ── 少林派扩展（P6 Batch 1）──
  // 炼气
  | 'shaolin_chan_yi' | 'shaolin_tie_sha'
  // 筑基
  | 'shaolin_luohan_18' | 'shaolin_long_zhua' | 'shaolin_bei_ye'
  // 结丹
  | 'shaolin_hu_he' | 'shaolin_shi_zi_hou' | 'shaolin_prajna_zhang' | 'shaolin_bodhi_xin'
  // 元婴
  | 'shaolin_72_true' | 'shaolin_jinggang_shen' | 'shaolin_long_xiang' | 'shaolin_rulai_zhang'
  // 化神
  | 'shaolin_tianren' | 'shaolin_wushang_bodhi' | 'shaolin_prajna_great' | 'shaolin_six_pulse'
  // 渡劫
  | 'shaolin_nirvana' | 'shaolin_datura' | 'shaolin_tathagata' | 'shaolin_vajra_true'
  // ── 日月教（P6 Batch 1）──
  // 炼气
  | 'riyue_moon_palm' | 'riyue_shadow_step' | 'riyue_sun_qi' | 'riyue_dark_fist'
  // 筑基
  | 'riyue_lunar_palm' | 'riyue_shadow_guard' | 'riyue_sun_cultivation' | 'riyue_poison_fog' | 'riyue_moon_storm'
  // 结丹
  | 'riyue_eclipse' | 'riyue_shadow_clone' | 'riyue_dual_cultivate' | 'riyue_sun_moon_combo'
  // 元婴
  | 'riyue_qiankun_shift' | 'riyue_moon_goddess' | 'riyue_shadow_realm' | 'riyue_full_moon'
  // 化神
  | 'riyue_qiankun_true' | 'riyue_sacred_sun' | 'riyue_tianren' | 'riyue_sun_moon_divine'
  // 渡劫
  | 'riyue_nirvana' | 'riyue_void_moon' | 'riyue_dark_sun' | 'riyue_ultimate'
  // ── 峨眉派扩展（P6 Batch 2）──
  // 炼气
  | 'emei_chan_yi' | 'emei_flower_needle' | 'emei_cloud_step'
  // 筑基
  | 'emei_sword_breeze' | 'emei_jade_guard' | 'emei_iron_finger'
  // 结丹
  | 'emei_lotus_palm' | 'emei_swallow_sword' | 'emei_bell_sound'
  // 元婴
  | 'emei_nirvana' | 'emei_sword_phoenix' | 'emei_plum_heal'
  // ── 丐帮扩展（P6 Batch 2）──
  // 炼气
  | 'beggar_wine' | 'beggar_slap' | 'beggar_roll'
  // 筑基
  | 'beggar_kick' | 'beggar_iron_shirt' | 'beggar_storm_fist'
  // 结丹
  | 'beggar_18_subdue' | 'beggar_dog_storm' | 'beggar_roar'
  // 元婴
  | 'beggar_overlord' | 'beggar_dragon_roar' | 'beggar_chief_fist'
  // ── 全真教（P6 Batch 2）──
  // 炼气
  | 'quanzhen_sword' | 'quanzhen_qi' | 'quanzhen_fist' | 'quanzhen_step'
  // 筑基
  | 'quanzhen_sword_qian' | 'quanzhen_neidan' | 'quanzhen_beidou' | 'quanzhen_fu'
  // 结丹
  | 'quanzhen_sword_kun' | 'quanzhen_thunder' | 'quanzhen_7star_array' | 'quanzhen_sword_divide'
  // 元婴
  | 'quanzhen_dao_jing' | 'quanzhen_sword_lord' | 'quanzhen_shendan' | 'quanzhen_sword_star'
  // ── 昆仑派（P6 Batch 2）──
  // 炼气
  | 'kunlun_sword' | 'kunlun_ice_qi' | 'kunlun_frost_palm' | 'kunlun_snow_step'
  // 筑基
  | 'kunlun_sword_cold' | 'kunlun_ice_guard' | 'kunlun_blizzard' | 'kunlun_freeze'
  // 结丹
  | 'kunlun_sword_jiuxiao' | 'kunlun_glacier' | 'kunlun_snow_veil' | 'kunlun_sword_storm'
  // 元婴
  | 'kunlun_hanbing' | 'kunlun_sword_peak' | 'kunlun_jade_purity' | 'kunlun_sword_frozen'
  // ── 唐门（P6 Batch 2）──
  // 炼气
  | 'tang_needle' | 'tang_poison_qi' | 'tang_blade_basic' | 'tang_smoke'
  // 筑基
  | 'tang_dart' | 'tang_shadow_step' | 'tang_rain_needle' | 'tang_venom'
  // 结丹
  | 'tang_blade_adv' | 'tang_poison_mist' | 'tang_dart_storm' | 'tang_toxic_art'
  // 元婴
  | 'tang_blade_master' | 'tang_pear_flower' | 'tang_poison_secret' | 'tang_night_walker'
  // ── 华山派（P6 Batch 3）──
  // 炼气
  | 'huashan_sword_basic' | 'huashan_mountain_qi' | 'huashan_wind_step' | 'huashan_sword_flash'
  // 筑基
  | 'huashan_wind_sword' | 'huashan_sword_shield' | 'huashan_storm_sword' | 'huashan_sword_heart'
  // 结丹
  | 'huashan_lonely_sword' | 'huashan_sword_soul' | 'huashan_mountain_guard' | 'huashan_sword_9'
  // ── 崆峒派（P6 Batch 3）──
  // 炼气
  | 'kongtong_fist_basic' | 'kongtong_inner_qi' | 'kongtong_iron_arm' | 'kongtong_rock_fist'
  // 筑基
  | 'kongtong_storm_fist' | 'kongtong_body_guard' | 'kongtong_crush_palm' | 'kongtong_mountain_roar'
  // 结丹
  | 'kongtong_7_hurt' | 'kongtong_qi_shield' | 'kongtong_thunder_fist' | 'kongtong_titan_palm'
  // ── 青城派（P6 Batch 3）──
  // 炼气
  | 'qingcheng_sword_basic' | 'qingcheng_dao_qi' | 'qingcheng_crane_step' | 'qingcheng_wind_sword'
  // 筑基
  | 'qingcheng_cloud_sword' | 'qingcheng_mist_body' | 'qingcheng_sword_qi' | 'qingcheng_dao_heart'
  // 结丹
  | 'qingcheng_luofu_sword' | 'qingcheng_immortal_guard' | 'qingcheng_sword_storm' | 'qingcheng_taiji_sword'
  // ── 点苍派（P6 Batch 3）──
  // 炼气
  | 'diancang_sword_basic' | 'diancang_snake_qi' | 'diancang_mist_step' | 'diancang_viper_sword'
  // 筑基
  | 'diancang_double_sword' | 'diancang_snake_skin' | 'diancang_circling_sword' | 'diancang_southern_qi'
  // 结丹
  | 'diancang_sword_storm' | 'diancang_poison_soul' | 'diancang_shadow_sword' | 'diancang_king_cobra'
  // ── 铁掌帮（P6 Batch 3）──
  // 炼气
  | 'tiezhang_palm_basic' | 'tiezhang_iron_qi' | 'tiezhang_sand_palm' | 'tiezhang_hard_body'
  // 筑基
  | 'tiezhang_iron_palm' | 'tiezhang_water_step' | 'tiezhang_fire_palm' | 'tiezhang_steel_skin'
  // 结丹
  | 'tiezhang_crushing_palm' | 'tiezhang_mountain_body' | 'tiezhang_thunder_palm' | 'tiezhang_supreme_palm'
  // ── 茅山派（P6 Batch 4）──
  // 炼气
  | 'maoshan_talisman' | 'maoshan_ghost_qi' | 'maoshan_bind_ghost' | 'maoshan_tao_step'
  // 筑基
  | 'maoshan_5_thunder' | 'maoshan_exorcism' | 'maoshan_spirit_cage' | 'maoshan_taoist_heart'
  // ── 五毒教（P6 Batch 4）──
  // 炼气
  | 'wudu_poison_palm' | 'wudu_insect_qi' | 'wudu_scorpion_tail' | 'wudu_poison_skin'
  // 筑基
  | 'wudu_centipede_bite' | 'wudu_toad_breath' | 'wudu_spider_web' | 'wudu_5_poison_array'
  // ── 血刀门（P6 Batch 4）──
  // 炼气
  | 'xuedao_blade_basic' | 'xuedao_blood_qi' | 'xuedao_blood_slash' | 'xuedao_blood_thirst'
  // 筑基
  | 'xuedao_blood_rain' | 'xuedao_blood_armor' | 'xuedao_blood_craze' | 'xuedao_blood_sea'
  // ── 海沙派（P6 Batch 4）──
  // 炼气
  | 'haisha_palm_basic' | 'haisha_tide_qi' | 'haisha_sand_palm' | 'haisha_water_step'
  // 筑基
  | 'haisha_wave_palm' | 'haisha_sea_guard' | 'haisha_tsunami' | 'haisha_whirlpool'
  // ── 叛军（P7 补齐）──
  // 炼气
  | 'rebel_fist' | 'rebel_war_qi' | 'rebel_scout_step' | 'rebel_spear'
  // 筑基
  | 'rebel_iron_bone' | 'rebel_siege' | 'rebel_counter' | 'rebel_beacon'
  // 结丹
  | 'rebel_blood_war' | 'rebel_flanking' | 'rebel_rearguard' | 'rebel_war_sweep'
  // ── 朝廷（P7 补齐）──
  // 炼气
  | 'court_fist' | 'court_authority_qi' | 'court_cane' | 'court_ritual_step'
  // 筑基
  | 'court_censor' | 'court_silk_guard' | 'court_arrest' | 'court_spear'
  // 结丹
  | 'court_gold_seal' | 'court_envoy' | 'court_iron_shield' | 'court_grace'
  // 元婴
  | 'court_dragon_roar' | 'court_six_strike' | 'court_royal_blade' | 'court_heaven_sword'
  // ── 魔教（P7 补齐）──
  // 炼气
  | 'demon_claw' | 'demon_heart' | 'demon_soul_gaze' | 'demon_shadow_dodge'
  // 筑基
  | 'demon_drain' | 'demon_body' | 'demon_slash' | 'demon_confuse'
  // 结丹
  | 'demon_devour' | 'demon_realm' | 'demon_soul_enhance' | 'demon_purgatory'
  // ── 逍遥派（P7 补齐）──
  // 炼气
  | 'xiaoyao_fist' | 'xiaoyao_free_qi' | 'xiaoyao_wind_walk' | 'xiaoyao_flower_hand'
  // 筑基
  | 'xiaoyao_absorb' | 'xiaoyao_snow_palm' | 'xiaoyao_wander' | 'xiaoyao_void_heart'
  // 结丹
  | 'xiaoyao_silk_step' | 'xiaoyao_sun_palm' | 'xiaoyao_fate_seal' | 'xiaoyao_unity'
  ;

export type EnemyId =
  | 'rogue_thug' | 'poison_woman' | 'beggar_disciple'
  | 'huashan_swordsman' | 'emei_nun' | 'shaolin_monk'
  | 'demon_vanguard' | 'demon_witch' | 'ancient_master'
  | 'wudang_gate_disciple' | 'wudang_mid_disciple' | 'wudang_elder_battle'
  | 'training_dummy' | 'shadow_scout' | 'shadow_agent'
  | 'zhao_dashi' | 'yamen_guard' | 'bandit_elite'
  | 'one_eye_leopard' | 'one_eye_leopard_drugged'
  // 第三章新增
  | 'forest_yao_beast' | 'blackmoon_scout_elite'
  | 'lu_chenzhou' | 'fang_zhonghe' | 'su_yunxiu' | 'ji_wushuang'
  ;

export type ItemId = 'hp_potion' | 'mp_potion' | 'exp_scroll' | 'iron_guard';

// ──── 法宝系统 ────

/** 法宝境界等级（对应八大境界） */
export type FabaoRealm = 'lianqi' | 'zhuji' | 'jiedan' | 'yuanying' | 'huashen' | 'dujie' | 'dacheng' | 'feisheng';

/** 法宝类型：武器(攻击) / 衣服(防御) / 饰品(增益) */
export type FabaoType = 'weapon' | 'armor' | 'accessory';

/** 法宝颜色映射 */
export const REALM_COLORS: Record<FabaoRealm, { name: string; color: string; css: string; levelRange: [number, number] }> = {
  lianqi:   { name: '炼气', color: '白色', css: '#e8e8e8', levelRange: [1, 10] },
  zhuji:    { name: '筑基', color: '绿色', css: '#4caf50', levelRange: [11, 20] },
  jiedan:   { name: '结丹', color: '蓝色', css: '#42a5f5', levelRange: [21, 30] },
  yuanying: { name: '元婴', color: '紫色', css: '#ab47bc', levelRange: [31, 40] },
  huashen:  { name: '化神', color: '金色', css: '#ffd700', levelRange: [41, 50] },
  dujie:    { name: '渡劫', color: '红色', css: '#ef5350', levelRange: [51, 60] },
  dacheng:  { name: '大乘', color: '暗金', css: '#daa520', levelRange: [61, 70] },
  feisheng: { name: '飞升', color: '霞光', css: '#7b68ee', levelRange: [71, 80] },
};

/** 根据 level 获取对应境界 */
export function getRealmByLevel(level: number): FabaoRealm | null {
  if (level >= 1 && level <= 10) return 'lianqi';
  if (level >= 11 && level <= 20) return 'zhuji';
  if (level >= 21 && level <= 30) return 'jiedan';
  if (level >= 31 && level <= 40) return 'yuanying';
  if (level >= 41 && level <= 50) return 'huashen';
  if (level >= 51 && level <= 60) return 'dujie';
  if (level >= 61 && level <= 70) return 'dacheng';
  if (level >= 71 && level <= 80) return 'feisheng';
  return null;
}

export type FabaoId =
  // 炼气·白色武器
  | 'iron_sword' | 'bamboo_staff' | 'hunting_bow'
  // 炼气·白色衣服
  | 'cloth_robe' | 'leather_vest' | 'hemp_armor'
  // 炼气·白色饰品
  | 'wooden_ring' | 'copper_pendant' | 'talisman_paper'
  // 筑基·绿色武器
  | 'refined_sword' | 'jade_staff' | 'spirit_bow'
  // 筑基·绿色衣服
  | 'silk_robe' | 'iron_mail' | 'spirit_vest'
  // 筑基·绿色饰品
  | 'jade_ring' | 'silver_pendant' | 'spirit_talisman'
  // 结丹·蓝色武器
  | 'azure_sword' | 'crystal_staff' | 'storm_bow'
  // 结丹·蓝色衣服
  | 'azure_robe' | 'golden_mail' | 'frost_vest'
  // 结丹·蓝色饰品
  | 'sapphire_ring' | 'golden_pendant' | 'thunder_talisman'
  // 元婴·紫色武器
  | 'void_blade' | 'soul_staff' | 'starfall_bow'
  // 元婴·紫色衣服
  | 'void_robe' | 'dragon_mail' | 'star_vest'
  // 元婴·紫色饰品
  | 'amethyst_ring' | 'dragon_pendant' | 'void_talisman'
  // 化神·金色武器
  | 'celestial_sword' | 'dao_staff' | 'sun_bow'
  // 化神·金色衣服
  | 'celestial_robe' | 'divine_mail' | 'sun_vest'
  // 化神·金色饰品
  | 'divine_ring' | 'phoenix_pendant' | 'celestial_talisman'
  // 渡劫·红色武器
  | 'tribulation_blade' | 'immortal_staff' | 'heaven_bow'
  // 渡劫·红色衣服
  | 'tribulation_robe' | 'immortal_mail' | 'heaven_vest'
  // 渡劫·红色饰品
  | 'blood_ring' | 'immortal_pendant' | 'tribulation_talisman'
  // 大乘·暗金武器
  | 'saint_blade' | 'mahayana_staff' | 'nirvana_bow'
  // 大乘·暗金衣服
  | 'saint_robe' | 'mahayana_mail' | 'nirvana_vest'
  // 大乘·暗金饰品
  | 'saint_ring' | 'mahayana_pendant' | 'nirvana_talisman'
  // 飞升·霞光武器
  | 'ascension_blade' | 'immortal_sword' | 'heaven_breaker'
  // 飞升·霞光衣服
  | 'ascension_robe' | 'immortal_armor' | 'immortal_vest'
  // 飞升·霞光饰品
  | 'ascension_ring' | 'immortal_jade' | 'ascension_talisman';

export interface FabaoData {
  id: FabaoId;
  name: string;
  icon: string;
  type: FabaoType;         // weapon / armor / accessory
  realm: FabaoRealm;       // 境界等级
  color: string;           // 颜色名称
  colorCss: string;        // CSS 颜色值
  desc: string;
  // 主属性加成
  atkBonus?: number;       // 武器主加攻击
  defBonus?: number;       // 衣服主加防御
  hpBonus?: number;        // 衣服加气血
  // 饰品特殊效果
  specialEffect?: {
    type: string;          // 效果类型描述
    value: number;         // 效果数值
    desc: string;          // 效果描述
  };
  // 获取方式
  obtain: string;
  // 修为要求
  requireLevel: number;
}

export type NpcId =
  | 'wudang_zhangsan' | 'emei_miejue' | 'shaolin_kongwen'
  | 'beggar_hong' | 'huashan_master' | 'demon_master'
  | 'mo_jiangqing' | 'liu_qinghan'
  | 'zhang_xuansu' | 'chen_jingxu' | 'zhou_boan'
  | 'song_zhiyuan' | 'gu_xiaosang' | 'lu_chengzhou' | 'shen_nishang'
  // 第三章新增 NPC
  | 'meng_wenyuan' | 'ye_ziyi' | 'ji_wushuang_npc' | 'su_yunxiu_npc' | 'fang_zhonghe_npc'
  // 🆕 沙盒：各派传功长老
  | 'shaolin_kongjian' | 'emei_jingxuan' | 'beggar_lu'
  | 'huashan_feng' | 'demon_yang'
  // 🆕 沙盒：城市官员
  | 'kaifeng_fuyin' | 'luoyang_zhifu' | 'changan_zhifu'
  | 'xiangyang_zhifu' | 'jiangling_zhifu' | 'chengdu_zhifu'
  | 'yangzhou_zhizhou' | 'suzhou_zhizhou' | 'hangzhou_zhifu'
  | 'dali_guoxiang'
  // 🆕 新门派掌门+长老
  | 'maoshan_zhangmen' | 'maoshan_elder'
  | 'kunlun_zhangmen' | 'kunlun_elder'
  | 'qingcheng_zhangmen' | 'qingcheng_elder'
  | 'tangmen_zhangmen' | 'tangmen_elder'
  | 'xiaoyao_zhangmen' | 'xiaoyao_elder'
  // 🆕 全真教
  | 'quanzhen_zhangmen' | 'quanzhen_elder' | 'quanzhen_qiuchuji'
  // 🆕 崆峒派
  | 'kongtong_zhangmen' | 'kongtong_elder'
  // 🆕 点苍派
  | 'diancang_zhangmen' | 'diancang_elder'
  // 🆕 新城市官员
  | 'jiangzhou_zhizhou' | 'tanzhou_zhifu' | 'guangzhou_shibosi'
  ;

export type ElderId = 'wudang_elder' | 'emei_elder' | 'shaolin_elder' | 'beggar_elder';

export type StatusType =
  | 'poison' | 'strong_poison'
  | 'stun' | 'knockback'
  | 'weaken_def'
  | 'buff_atk' | 'def_boost'
  | 'evade'
  | 'regen_mp' | 'regen_mp_pct'
  | 'self_heal';

export type SkillType = 'attack' | 'support' | 'control' | 'passive';
export type TargetType = 'enemy' | 'self';

export type CampTabId = 'story' | 'attr' | 'bag' | 'skill' | 'relation' | 'fabao' | 'mission' | 'court' | 'sect' | 'world' | 'sect_leader';

export type ScreenId =
  | 'main' | 'saveselect' | 'create' | 'story'
  | 'camp' | 'dialog' | 'battle';

export type BattleResult = 'win' | 'lose';

export type AttrKey = 'hp' | 'atk' | 'def' | 'agi' | 'mp';

// ──── 通用游戏数据结构 ────

export interface StatusEffect {
  type: StatusType;
  value: number;
  duration: number;
}

export interface SectData {
  name: string;
  color: string;
  icon: string;
  bonus: Partial<Record<'hp' | 'mp' | 'atk' | 'def' | 'agi' | 'crit', number>>;
  intro: string;
  /** 势力倾向：'righteous'|'neutral'|'unorthodox'|'chaotic'（沙盒扩展） */
  alignment?: string;
  /** 势力文化标签（沙盒扩展） */
  culture?: string[];
}

export interface ElderData {
  id: ElderId;
  sect: SectId;
  name: string;
  img: string;
  intro: string;
  skills: SkillId[];
}

export interface SkillData {
  id: SkillId;
  name: string;
  icon: string;
  type: SkillType;
  target: TargetType;
  mp: number;
  hit: number;
  powerMul: number;
  defPen: number;
  cooldown: number;
  effect: StatusEffect | null;
  healPct: number;
  desc: string;
  battleTip: string;
  cost: { exp: number };
  sect: SectId | '';
}

export interface EnemyAction {
  name: string;
  icon: string;
  powerMul: number;
  defPen: number;
  hit: number;
  mpCost: number;
  weight: number;
  effect: StatusEffect | null;
}

export interface LootEntry {
  id: ItemId;
  chance: number;
}

export interface EnemyTemplate {
  id: EnemyId;
  name: string;
  icon: string;
  tier: number;
  hp: number;
  maxHp: number;
  atk: number;
  def: number;
  agi: number;
  reward: { exp: number; gold: number };
  loot: LootEntry[];
  actions: EnemyAction[];
  aiDesc: string;
  scriptedDefeat?: true;
}

export interface ItemData {
  id: ItemId;
  name: string;
  icon: string;
  desc: string;
  effect: Partial<{ hp: number; mp: number; exp: number; def: number }>;
  equip?: true;
}

export interface InventoryItem extends ItemData {
  count: number;
}

// ──── NPC 对话树 ────

export interface DialogChoice {
  text: string;
  next: string | null;
  effect?: string;
}

export interface DialogNode {
  text: string;
  choices: DialogChoice[];
}

export interface NpcDialogData {
  name: string;
  img: string;
  sect: string;
  dialogs: Record<string, DialogNode>;
}

// ──── 剧情脚本节点 ────

export type StoryNodeType = 'narration' | 'dialogue' | 'choice' | 'cg' | 'flash' | 'battle';

export interface BaseStoryNode {
  type: StoryNodeType;
}

export interface NarrationNode extends BaseStoryNode {
  type: 'narration';
  text: string;
  next: string;
}

export interface DialogueNode extends BaseStoryNode {
  type: 'dialogue';
  speaker: string;
  text: string;
  portrait?: string;
  bg?: string;
  next: string;
}

export interface ChoiceNode extends BaseStoryNode {
  type: 'choice';
  choices: Array<{ text: string; next: string }>;
}

export interface CgNode extends BaseStoryNode {
  type: 'cg';
  bg: string;
  delay: number;
  next: string;
}

export interface FlashNode extends BaseStoryNode {
  type: 'flash';
  next: string;
}

export interface BattleStoryNode extends BaseStoryNode {
  type: 'battle';
  enemyId: EnemyId;
  nextOnWin: string;
  nextOnLose?: string;
  /** 团队战：我方队友定义（不含主角，主角自动加入） */
  teamAllies?: Array<{
    name: string; hp: number; maxHp: number; mp: number; maxMp: number;
    atk: number; def: number; agi: number; crit: number;
    charImg?: string; icon?: string; skills: SkillId[];
  }>;
  /** 团队战：敌方 ID 列表（覆盖 enemyId，支持多个敌人） */
  teamEnemies?: EnemyId[];
}

export type StoryNode =
  | NarrationNode
  | DialogueNode
  | ChoiceNode
  | CgNode
  | FlashNode
  | BattleStoryNode;

// ──── 玩家状态 ────

export interface AttrBoosts {
  hp: number;
  atk: number;
  def: number;
  agi: number;
  mp: number;
}

import type { NpcStats } from './npcStats';
import type { TalentId } from './realmConfig';
import type { LocationId } from './worldMap';
import type { NpcCollection } from './sandboxTypes';
import type { WorldStateData, ChronicleData } from '../systems/WorldState';

export interface PlayerState {
  name: string;
  charId: CharId;
  charImg: string;
  sect: SectId;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  atk: number;
  def: number;
  agi: number;
  crit: number;
  exp: number;
  gold: number;
  level: number;
  skills: SkillId[];
  equippedSkills: [SkillId | null, SkillId | null, SkillId | null, SkillId | null];
  inventory: InventoryItem[];
  cultivationPoints: number;
  attrBoosts: AttrBoosts;
  // 法宝装备槽：武器 / 衣服 / 饰品
  equippedFabao: { weapon: FabaoId | null; armor: FabaoId | null; accessory: FabaoId | null };
  ownedFabao: FabaoId[];  // 已拥有的法宝
  tutorialDone: boolean;
  /** 游戏模式：'story'=剧情模式, 'sandbox'=沙盒模式 */
  gameMode: 'story' | 'sandbox';
  chapter: number;
  act: number;
  wudangMissionAccepted: boolean;
  wudangGateCleared: boolean;
  wudangMidCleared: boolean;
  wudangElderCleared: boolean;
  chapter2Route: '' | 'hotblood' | 'wisdom';
  // 第三章剧情标记
  chapter3Breakthrough: boolean;       // 是否完成突破剧情（已废弃，改用 realmBreakUnlocked）
  master: string;                      // 师父 ID
  blackmoonToken: boolean;             // 是否获得黑月教令牌碎片
  luChenzhouRespect: number;           // 陆沉舟认可度
  songZhiyuanGrowth: boolean;          // 宋知远是否获得手册
  liuQinghanEngaged: boolean;          // 是否触发婚约剧情
  trialChampion: boolean;              // 是否夺得试剑会魁首
  trueDisciple: boolean;               // 是否晋升真传弟子
  blackmoonMissionStarted: boolean;    // 黑月教讨伐是否开始
  npcDatabase?: Record<string, NpcStats>; // NPC 数值卡数据库（可选，首次加载时初始化）
  /** 🆕 NPC 好感度字典：key=NPC的npcDbId，value=好感度数值 */
  npcAffection: Record<string, number>;
  /** 🆕 P8: NPC 间友好度字典：key=`${idA}__${idB}`(A<B字典序)，value=-100~100 */
  npcRelationship: Record<string, number>;
  /** 🆕 NPC 间关系标签：key同友好度字典，value=关系标签数组（如['lover','sworn_brother']） */
  npcRelationshipLabels: Record<string, string[]>;
  // 🆕 突破与宗门系统（沙盒模式预留）
  /** 已解锁突破的大境界列表（如 ['zhuji'] 表示筑基突破已解锁） */
  realmBreakUnlocked: string[];
  /** 宗门身份等级：'outer'=外门, 'inner'=内门, 'true'=真传, 'elder'=长老 */
  discipleRank: string;
  /** 🆕 庙堂身份（庙堂之上）：'commoner'=平民, 'xiucai'=秀才, ... 'zaixiang'=宰相 */
  courtRank: string;
  /** 🆕 朝廷四维属性 */
  courtStats: { strategy: number; eloquence: number; charisma: number; scholarship: number };
  /** 🆕 战斗属性经验值（积累足够经验→属性+1） */
  combatStatExp: { atk: number; def: number; agi: number; crit: number };
  /** 🆕 朝廷属性经验值（积累足够经验→属性+1） */
  courtStatExp: { strategy: number; eloquence: number; charisma: number; scholarship: number };
  /** 🆕 朝廷影响力（朝廷的"修为"） */
  influence: number;
  /** 🆕 朝廷路线（null=未选择） */
  courtPath: 'wen' | 'wu' | null;
  /** 🆕 职业路线选择（文官+江湖 / 武官+江湖，null=未选择，一旦选定不可更改） */
  playerCareer: 'wen' | 'wu' | null;
  /** 🆕 上一行动领域（用于分心惩罚） */
  lastActionType: 'martial' | 'court' | 'idle';
  // 🆕 沙盒：宗门贡献值系统
  /** 宗门贡献值 */
  sectContribution: number;
  /** 贡献值变动日志 */
  contributionLog: Array<{ amount: number; source: string; reason: string; timestamp: number }>;
  // 🆕 沙盒：晋升系统
  /** 已完成的晋升试炼 ID 列表 */
  completedTrials: string[];
  /** 声望值（0-1000，预留后续扩展） */
  reputation: number;
  /** 🆕 NPC 收纳（已招募的随从 + 指派任务） */
  npcCollection: NpcCollection;
  /** 🆕 沙盒：当前接取的主命任务列表 */
  activeMissions: Array<{ defId: string; status: string; acceptedAt: number; progress: number; progressMax: number }>;
  /** 🆕 沙盒：势力外交关系（outer: factionId, inner: targetFactionId → relation data） */
  factionRelations: Record<string, Record<string, { relation: string; trust: number; lastEvent?: string; lastEventTurn?: number }>>;
  /** 🆕 沙盒：外交回合计数（内部） */
  diplomacyTickCounter: number;
  /** 🆕 沙盒：江湖态势数据（势力资源、回合、世界事件） */
  worldState?: WorldStateData;
  /** 🆕 沙盒：个人日志（修行历程） */
  chronicle?: ChronicleData;
  // 世界地图系统
  currentLocationId: LocationId;       // 玩家当前所在地点
  // 主角天赋系统
  playerTalent: TalentId;              // 主角天赋（默认为 dragon_vein 九霄龙脉）
  /** 🆕 主角与 NPC 的关系标签：key=NPC的npcDbId，value=关系类型数组 */
  npcRelations?: Record<string, PlayerNpcRelation[]>;
  /** 🆕 势力领土控制：key=LocationId，value=控制该地的SectId（'none'=无主） */
  territoryControl?: Record<LocationId, SectId>;
  /** 🆕 江湖传闻列表（最近10条） */
  worldNews?: WorldNewsItem[];
  /** 🆕 领土攻城冷却：key=LocationId，value=下次可被攻打的回合数 */
  siegeCooldown?: Record<string, number>;
  // 🆕 时间系统：10回合=1月
  gameMonth: number;         // 当前游戏月份（从1开始）
  turnInMonth: number;       // 本月内的回合数（0-9）
  councilCooldown: number;   // 下次议事可触发的 month 数（防止重复触发）
  /** 🆕 偷师冷却：key="steal_<SectId>"，value=上次偷师的 month */
  stealCooldowns: Record<string, number>;
  /** 🆕 累计击杀数 */
  killCount: number;
  /** 🆕 偷师成功次数 */
  stealSuccessCount: number;
  /** 🆕 已获得的称号列表 */
  playerTitles: Array<{ titleId: string; acquiredAt: number }>;
  /** 🆕 当前激活的称号 ID（cosmetic 称号可叠加显示） */
  activeTitle: string | null;
  /** 🆕 悬赏板 */
  bountyBoard: Array<{
    id: string; targetName: string; targetLevel: number;
    targetLocation: string; issuer: string; issuerName: string;
    crime: string; rewardGold: number; rewardRep: number;
    difficulty: string; generatedAt: number; expiresAt: number;
  }>;
  /** 🆕 当前接取的悬赏 ID */
  activeBountyId: string | null;
  /** 🆕 上次刷新悬赏的月份 */
  lastBountyRefresh: number;
  // 🆕 门派经营：每个门派的资源与稳定度
  sectState: Record<string, SectStateData>;
  // 🆕 P7 城池繁荣度（已被 settlementState 取代，保留兼容旧档）
  cityProsperity?: Record<string, number>;
  // 🆕 统一据点属性：城市和门派共用同一套属性框架
  settlementState?: Record<string, import('./sandboxTypes').SettlementAttributes>;
  // 🆕 P7 势力力量分
  sectPower?: Record<string, number>;
  // 🆕 P7 江湖大事件冷却
  grandEventCooldown?: number;
  // 🆕 P7 玩家大事件选择历史
  grandEventHistory?: Array<{ eventId: string; choice: string; month: number }>;
  // 🆕 P7 势力联盟
  coalitions?: Array<{
    name: string;
    targetSect: string;
    members: string[];
    formedMonth: number;
    expireMonth: number;
  }>;
  // 🆕 P10: 门派政务指令池（key=factionId, value=待执行的指令列表）
  factionDirectives?: Record<string, Array<{
    id: string;
    type: string;
    factionId: string;
    label: string;
    description: string;
    targetLocation?: LocationId;
    targetSect?: SectId;
    priority: number;
    statAffinity: { atk: number; def: number; agi: number; crit: number };
    progressNeeded: number;
    currentProgress: number;
    assignedNpcId?: string;
    claimedByPlayer?: boolean;
    completed: boolean;
    rewardDescription: string;
    createdAtMonth: number;
    expiresAtMonth: number;
  }>>;
  // 🆕 P10: NPC 政务记录（key=npcId）
  factionOfficials?: Record<string, {
    npcId: string;
    factionId: SectId;
    rank: string;
    contribution: number;
    directivesDoneThisMonth: number;
  }>;
  _slot: number;
  _savedAt?: string;
}

/** NPC 志向类型（P8：驱动 NPC 自主行为） */
export type NpcAmbition = 'content' | 'master' | 'power' | 'rebel' | 'avenger';

/** 主角与 NPC 的关系类型 */
export type PlayerNpcRelation = 'lover' | 'sworn_brother' | 'master' | 'student' | 'friend' | 'enemy';

/** 关系标签的中文显示 */
export const PLAYER_NPC_RELATION_LABEL: Record<PlayerNpcRelation, { label: string; icon: string; color: string }> = {
  lover:         { label: '道侣',   icon: '💕', color: '#FF69B4' },
  sworn_brother: { label: '结义',   icon: '🤝', color: '#FFD700' },
  master:        { label: '师父',   icon: '👨‍🏫', color: '#9A7CFF' },
  student:       { label: '徒弟',   icon: '📚', color: '#78BE00' },
  friend:        { label: '好友',   icon: '💚', color: '#4CAF50' },
  enemy:         { label: '仇敌',   icon: '💢', color: '#FD1430' },
};

/** 门派状态数据（资源 + 稳定度） */
export interface SectStateData {
  resources: number;  // 经济资源 0-1000
  stability: number;  // 稳定度 0-100
  prosperity: number; // 繁荣度 0-100（P7 新增）
}

/** 江湖传闻条目 */
export interface WorldNewsItem {
  text: string;
  turn: number;
  leftTime: number; // 展示剩余回合数
}

// ──── 战斗上下文 ────

export type BattleStateEnum = 'idle' | 'player_turn' | 'enemy_turn' | 'animating' | 'win' | 'lose';

export type TeamSide = 'ally' | 'enemy';

export interface BattleUnit {
  id: string;           // 唯一标识（如 'player_main', 'ally_1', 'enemy_0'）
  name: string;
  side: TeamSide;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  atk: number;
  def: number;
  agi: number;
  crit: number;
  icon?: string;
  charImg?: string;
  skills: SkillId[];    // 该单位可用的技能
  isPlayer: boolean;    // 是否由玩家直接控制
  alive: boolean;
}

export interface BattleEnemyUnit extends BattleUnit {
  side: 'enemy';
  enemyId: EnemyId;
  tier: number;
  actions: EnemyAction[];
  reward: { exp: number; gold: number };
  loot: LootEntry[];
  scriptedDefeat?: true;
}

export interface BattleContext {
  state: BattleStateEnum;
  units: BattleUnit[];              // 所有战斗单位（我方+敌方）
  allies: BattleUnit[];             // 我方存活单位引用
  enemies: BattleEnemyUnit[];       // 敌方存活单位引用
  currentUnitIndex: number;         // 当前行动单位在 turnOrder 中的索引
  turnOrder: BattleUnit[];          // 本回合行动顺序
  round: number;
  log: string[];
  skillCooldowns: Partial<Record<SkillId, number>>;
  hasPrevision: boolean;
  pendingEvade: boolean;
  selectedTarget: BattleUnit | null; // 当前选中的目标
  teamBattle: boolean;              // 是否团队战（4v4）
  allyStatuses: Record<string, StatusEffect[]>;    // 友方单位状态效果 { unitId: StatusEffect[] }
  enemyStatuses: Record<string, StatusEffect[]>;   // 敌方单位状态效果 { unitId: StatusEffect[] }
}

// ──── 遭遇配置 ────

export interface EncounterTier {
  label: string;
  tier: number;
  desc: string;
}

export interface WudangTier {
  label: string;
  tier: number;
  desc: string;
}

// ──── 存档系统 ────

export type SaveSlots = Record<string, PlayerState>;
