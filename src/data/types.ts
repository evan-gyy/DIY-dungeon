// ============================================================
//  src/data/types.ts — 全局 TypeScript 类型定义
// ============================================================

// ──── ID 联合类型（所有 ID 都在这里集中定义）────

export type SectId = 'wudang' | 'emei' | 'shaolin' | 'beggar' | 'huashan' | 'demon';

export type CharId = 'male_good' | 'male_evil' | 'female_good' | 'female_evil';

export type SkillId =
  | 'yi_li_xin_jing'
  | 'mianzhang' | 'taiji' | 'wudang_sword' | 'zixiao'
  | 'wudang_changquan' | 'yangqi_jue' | 'wudang_jianfa_basic'
  | 'emei_sword' | 'liing_palm' | 'emei_poison' | 'hundred_birds'
  | 'luohan_fist' | 'vajra_palm' | 'yijin_jing' | '72_arts'
  | 'beggar_fist' | 'stick_art' | 'mud_walk' | 'dragon_palm';

export type EnemyId =
  | 'rogue_thug' | 'poison_woman' | 'beggar_disciple'
  | 'huashan_swordsman' | 'emei_nun' | 'shaolin_monk'
  | 'demon_vanguard' | 'demon_witch' | 'ancient_master'
  | 'wudang_gate_disciple' | 'wudang_mid_disciple' | 'wudang_elder_battle'
  | 'training_dummy' | 'shadow_scout' | 'shadow_agent'
  | 'zhao_dashi' | 'yamen_guard' | 'bandit_elite'
  | 'one_eye_leopard' | 'one_eye_leopard_drugged';

export type ItemId = 'hp_potion' | 'mp_potion' | 'exp_scroll' | 'iron_guard';

export type NpcId =
  | 'wudang_zhangsan' | 'emei_miejue' | 'shaolin_kongwen'
  | 'beggar_hong' | 'huashan_master' | 'demon_master'
  | 'mo_jiangqing' | 'liu_qinghan'
  | 'zhang_xuansu' | 'chen_jingxu' | 'zhou_boan'
  | 'song_zhiyuan' | 'gu_xiaosang' | 'lu_chengzhou' | 'shen_nishang';

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

export type CampTabId = 'story' | 'attr' | 'bag' | 'skill';

export type ScreenId =
  | 'main' | 'saveselect' | 'create' | 'story'
  | 'camp' | 'depart' | 'dialog' | 'learn' | 'battle';

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
  tutorialDone: boolean;
  chapter: number;
  act: number;
  wudangMissionAccepted: boolean;
  wudangGateCleared: boolean;
  wudangMidCleared: boolean;
  wudangElderCleared: boolean;
  chapter2Route: '' | 'hotblood' | 'wisdom';
  _slot: number;
  _savedAt?: string;
}

// ──── 战斗上下文 ────

export type BattleStateEnum = 'idle' | 'player_turn' | 'enemy_turn' | 'animating' | 'win' | 'lose';

export interface BattleUnit {
  name: string;
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
}

export interface BattleEnemyUnit extends BattleUnit {
  id: EnemyId;
  tier: number;
  actions: EnemyAction[];
  reward: { exp: number; gold: number };
  loot: LootEntry[];
  scriptedDefeat?: true;
}

export interface BattleContext {
  state: BattleStateEnum;
  player: BattleUnit;
  enemy: BattleEnemyUnit;
  round: number;
  log: string[];
  skillCooldowns: Partial<Record<SkillId, number>>;
  playerStatus: StatusEffect[];
  enemyStatus: StatusEffect[];
  hasPrevision: boolean;
  pendingEvade: boolean;
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
