// ============================================================
//  src/data/types.ts — 全局 TypeScript 类型定义
// ============================================================

// ──── ID 联合类型（所有 ID 都在这里集中定义）────

export type SectId = 'wudang' | 'emei' | 'shaolin' | 'beggar' | 'huashan' | 'demon';

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

/** 法宝境界等级（对应六大境界） */
export type FabaoRealm = 'lianqi' | 'zhuji' | 'jiedan' | 'yuanying' | 'huashen' | 'dujie';

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
};

/** 根据 level 获取对应境界 */
export function getRealmByLevel(level: number): FabaoRealm | null {
  if (level >= 1 && level <= 10) return 'lianqi';
  if (level >= 11 && level <= 20) return 'zhuji';
  if (level >= 21 && level <= 30) return 'jiedan';
  if (level >= 31 && level <= 40) return 'yuanying';
  if (level >= 41 && level <= 50) return 'huashen';
  if (level >= 51 && level <= 60) return 'dujie';
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
  | 'blood_ring' | 'immortal_pendant' | 'tribulation_talisman';

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

export type CampTabId = 'story' | 'attr' | 'bag' | 'skill' | 'relation' | 'fabao';

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

import type { NpcStats, TalentId } from './npcStats';
import type { LocationId } from './worldMap';

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
  chapter: number;
  act: number;
  wudangMissionAccepted: boolean;
  wudangGateCleared: boolean;
  wudangMidCleared: boolean;
  wudangElderCleared: boolean;
  chapter2Route: '' | 'hotblood' | 'wisdom';
  // 第三章剧情标记
  chapter3Breakthrough: boolean;       // 是否完成突破剧情
  master: string;                      // 师父 ID
  blackmoonToken: boolean;             // 是否获得黑月教令牌碎片
  luChenzhouRespect: number;           // 陆沉舟认可度
  songZhiyuanGrowth: boolean;          // 宋知远是否获得手册
  liuQinghanEngaged: boolean;          // 是否触发婚约剧情
  trialChampion: boolean;              // 是否夺得试剑会魁首
  trueDisciple: boolean;               // 是否晋升真传弟子
  blackmoonMissionStarted: boolean;    // 黑月教讨伐是否开始
  npcDatabase?: Record<string, NpcStats>; // NPC 数值卡数据库（可选，首次加载时初始化）
  // 世界地图系统
  currentLocationId: LocationId;       // 玩家当前所在地点
  // 主角天赋系统
  playerTalent: TalentId;              // 主角天赋（默认为 dragon_vein 九霄龙脉）
  _slot: number;
  _savedAt?: string;
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
