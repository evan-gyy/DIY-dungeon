# DIY-Dungeon 项目架构文档

> 本文档面向开发者和 AI Agent，描述当前项目的完整架构、各模块职责，以及接下来的开发方向。
> 最后更新：2026-05-23（v2.8 NPC中立互动+交友可见性+游说登庸多因素说服系统）

---

## 一、技术栈

| 工具 | 版本 | 用途 |
|------|------|------|
| Vite | 6.x | 构建工具，HMR，asset hash |
| TypeScript | strict mode | 全量类型覆盖，编译期检查游戏数据 ID |
| mitt | 300B | 跨模块事件总线（BattleEngine ↔ UI 解耦） |
| Zod | 3.x | 存档 Schema 验证 + 自动补全缺失字段 |
| Vanilla DOM | — | 无 UI 框架，模板字符串渲染 |
| CSS Variables | — | 金色/暗黑主题，`--color-gold`、`--color-panel` 等 |

---

## 二、文件结构

```
DIY-dungeon/
├── index.html                     HTML 骨架（9 个 screen div + 1 个 overlay，含 world tab 导航）
├── vite.config.ts
├── tsconfig.json                  strict: true
├── package.json
│
├── src/
│   ├── main.ts                    入口：DOMContentLoaded → init 全部模块
│   ├── style.css                  全局样式（CSS Variables + 动画 + 战斗/日常/关系/江湖态势/法器商店样式）
│   │
│   ├── data/                      纯数据层（不依赖 DOM 或状态）
│   │   ├── types.ts               **所有 TS 接口和 ID 联合类型**（单一来源，含沙盒字段）
│   │   ├── sandboxTypes.ts        沙盒类型定义（MissionDef/PromotionTrial/FactionAlignment/CourtRank/FactionOfficialRank/FactionDirective等）
│   │   ├── skills.ts              SKILLS: Record<SkillId, SkillData>（按门派/境界分层，炼气~渡劫六境）
│   │   ├── enemies.ts             ENEMIES: Record<EnemyId, EnemyTemplate>
│   │   ├── npcs.ts                NPC_DIALOGS: Record<NpcId, NpcDialogData>（含第三章新 NPC 对话树）
│   │   ├── npcStats.ts            NPC 数值卡数据库（34 个 NPC 初始属性 + 天赋系统，含门派掌门/长老/官员）
│   │   ├── items.ts               ITEMS + DEFAULT_INVENTORY
│   │   ├── fabao.ts               法宝系统：FABAO: Record<FabaoId, FabaoData>（6境×3类×3件=54件）
│   │   ├── realmConfig.ts         境界基础数值配置（基准值 + 大境界飞跃公式 + 主角天赋融入）
│   │   ├── worldMap.ts            世界地图节点配置（~35 个地点 + LocationAction 日常行动 + sect_learn_skill 行动）
│   │   ├── sectSkillTables.ts     🆕 各宗门技能表（WUDANG/SHAOLIN/RIYUE/EMEI/BEGGAR/QUANZHEN/KUNLUN/TANGMEN + SECT_SKILL_TABLES + getSkillRealm()）
│   │   ├── sects.ts               SECTS: Record<SectId, SectData>（含 alignment + culture 标签）
│   │   ├── titles.ts              🆕 称号定义：TITLES 池（15个称号 + 解锁条件 + 属性加成）
│   │   ├── story.ts               WUDANG_TIERS（关卡配置，遗留文件）
│   │   └── chapters/
│   │       ├── types.ts           ChapterData / CampScene 接口
│   │       ├── ch1.ts             第一章剧情节点 + 营地场景（~70 节点）
│   │       ├── ch2.ts             第二章剧情节点 + 营地场景（~200 节点，多段独立剧情）
│   │       ├── ch3.ts             第三章剧情节点 + 营地场景（~190 节点，10 个营地场景）
│   │       └── index.ts           CHAPTERS 注册表 + getChapter(n)
│   │
│   ├── state/                     状态层（依赖 data，不依赖 DOM）
│   │   ├── GameState.ts           PlayerState singleton：getPlayer / setPlayer
│   │   ├── SaveSystem.ts          saveGame / loadSave（🆕 v2 lz-string压缩 + 背包精简 + NPC属性动态重算 + v1自动迁移）
│   │   ├── LevelSystem.ts         修为系统：REALM_NAMES(80层制)、突破机制（canBreakThrough / breakThroughRealm）
│   │   └── schemas.ts             PlayerStateSchema（Zod，含所有字段的 .default()，支持旧存档兼容）
│   │
│   ├── systems/                   游戏逻辑（依赖 data + state，不依赖 DOM）— 22 个文件
│   │   ├── BattleEngine.ts        4v4 团队战引擎（initBattle / playerUseSkill / playerBasicAttack / 队友AI / 回合交替）
│   │   ├── StatusEffects.ts       applyStatus / tickStatus / getStatusValue
│   │   ├── EnemyAI.ts             enemyTurn / weightedRandom / predictAction
│   │   ├── TitleSystem.ts         🆕 称号系统（getActiveTitle / hasTitle / activateTitle / deactivateTitle / getTitleBonus）
│   │   ├── NpcBehavior.ts         NPC 行为引擎（5级优先级：疗伤→修炼60%→社交15%→门派任务15%→移动10%，行为结果写入 recentLog，含阵营加权移动 + NPC间16种互动动作池 + 🆕 NPC主动互动玩家含中性好感互动）
│   │   ├── NPCGenerator.ts        随机 NPC 生成器（门派中枢 + 城市游荡者 + 京城官员，三角金字塔 + 36天赋 + 天骄）
│   │   ├── NPCInteraction.ts      NPC 互动（对话/切磋/送礼）
│   │   ├── NPCManager.ts          NPC 槽位管理 / 指派任务 / 🆕 游说登庸多因素说服系统（势力实力+志向+性格+好感度）
│   │   ├── ActionSystem.ts        🆕 数值闭环引擎（statExp累计+属性升级+成功率公式+世界闭环）
│   │   ├── FactionAI.ts           🆕 势力议事引擎 v3（三轨指令：军务+江湖 + 朝廷属性亲和 + 随从加成/经验共享/参战 + 晋升判定 + statExp接入）
│   │   ├── NpcRelationship.ts     🆕 NPC 间友好度系统（性格兼容矩阵 + 同门加成 + 关系标签：好友/仇敌）
│   │   ├── Inventory.ts           addItem / removeItem / useItem
│   │   ├── PromotionSystem.ts     沙盒晋升（canPromote / executePromotion / getPromotionTrial）
│   │   ├── MissionSystem.ts       任务引擎（接取/追踪/完成/放弃/进度更新）
│   │   ├── FactionSystem.ts       势力外交引擎（tickFactionDiplomacy / getFactionRelation / 倾向匹配 + 文化相似度）
│   │   ├── FactionWarfare.ts      🆕 势力领土争夺（tryTriggerSiege / playerJoinSiege / resolveDelegatedSiege 3波车轮战 / 无主地占领 / 随从代战）
│   │   ├── SectManagement.ts      🆕 门派经营管理（19门派双属性：资源+稳定度 / NPC门派任务 / 月度议事决策 / 攻城消耗结算）
│   │   ├── WorldState.ts          世界演算引擎（门派资源演化 / 10 种世界事件 / 势力排名 / 个人日志 / 宗门加入）
│   │   ├── CourtSystem.ts         朝廷系统（品阶晋升 / 影响力计算）
│   │   ├── CourtEngine.ts         朝廷政务引擎（D100 掷骰 + 修正值判定）
│   │   ├── CourtMissionPool.ts    朝廷任务池（按品阶/类型分组）
│   │   ├── FabaoShop.ts           法器商店逻辑（商品池/按境界分组/购买）
│   │   └── BreakthroughPill.ts    突破丹系统（丹药替代剧情解锁突破）
│   │
│   ├── screens/                   UI 层（依赖全部下层模块）— 根级 8 个 + camp/ 13 个
│   │   ├── ScreenManager.ts       showScreen / getCurrentScreen
│   │   ├── MainMenu.ts            主菜单渲染
│   │   ├── SaveSelect.ts          存档槽选择（含沙盒字段显示）
│   │   ├── CharCreate.ts          角色创建（选立绘 + 输入姓名 + 沙盒字段初始化）
│   │   ├── Camp.ts                营地主容器（Tab 切换 + 侧边栏「附近的人」+ 地图弹窗 + 沙盒兼容初始化 + 时间推进 + 议事触发 + 地图栏身份徽章）
│   │   ├── camp/
│   │   │   ├── AttrPanel.ts       属性面板（修为突破按钮 + 宗门身份 + 贡献值 + 晋升进度/试炼按钮）
│   │   │   ├── BagPanel.ts        背包面板（24 格，使用道具）
│   │   │   ├── SkillPanel.ts      技能装配面板
│   │   │   ├── StoryPanel.ts      营地剧情面板（日常任务按地点动态读取 + 宗门习武入口 + 任务战斗按钮 + 沙盒 tick 调用 + 🆕 政务任务属性经验预览+检定提示）
│   │   │   ├── FabaoPanel.ts      法宝装备面板（三槽装备/卸下）
│   │   │   ├── RelationPanel.ts   人物关系面板（可折叠分类 + 好感度 + 🆕 鬼谷八荒式横版 NPC 详情弹窗：左侧立绘+境界光效，右侧属性含宗门/朝廷身份 + NPC交友关系标签）
│   │   │   ├── MissionPanel.ts    任务面板（接取/追踪/完成/放弃 + 🆕 属性经验成长预览，按轨道权重显示）
│   │   │   ├── WorldPanel.ts      江湖态势面板（势力排行/SVG外交关系图/玩家外交行动/个人日志/宗门加入/世界推演）
│   │   │   ├── CourtPanel.ts      朝廷面板（品阶/政务/影响力/文武双线）
│   │   │   ├── SectPanel.ts        🆕 师门身份面板（势力四维+贡献进度+晋升路线图）
│   │   │   ├── CouncilScreen.ts   🆕 月度议事 CG 全屏界面（掌门立绘+长老+对话气泡+rank分级选项+攻城参战入口）
│   │   │   ├── FabaoShopUI.ts     法器商店 UI 覆盖层（宗门/城市商店）
│   │   │   ├── SkillLearnOverlay.ts  🆕 宗门习武弹窗（按6境界分层显示本派技能，消耗贡献值学习）
│   │   │   └── SectLeaderPanel.ts   🆕 掌门管理面板（资源调配/招生纳贤/外交决策）
│   │   ├── DialogScreen.ts        NPC 对话树
│   │   ├── BattleScreen.ts        战斗 UI（4v4 团队战：多单位卡片 + 目标选择 + 技能栏 + 结算）
│   │   ├── StoryScreen.ts         VN 引擎（打字机 / 对话 / CG / 选择枝 / 战斗节点）
│   │   └── tutorial.ts            新手引导（mentor 气泡）
│   │
│   ├── audio/
│   │   └── AudioManager.ts        initAudio / switchMusic / toggleAudio
│   │
│   ├── fx/
│   │   └── Particles.ts           canvas 粒子背景动效
│   │
│   ├── utils/
│   │   └── npcPortrait.ts         NPC 立绘路径映射（按 NPC ID 解析图片路径）
│   │
│   └── ui/
│       ├── toast.ts               showToast(msg, duration?)
│       └── events.ts              mitt bus 实例 + GameEvents 类型映射
│
├── public/
│   └── picture/                   所有图片（Female-main / scene / maincharacter / NPC）
│
└── docs/
    ├── ARCHITECTURE.md            本文档
    ├── GAME_DESIGN.md             游戏设计文档（含沙盒模式详解）
    ├── TODO_LIST.md                开发待办清单
    ├── REALM_SKILL_FABAO_SYSTEM.md 境界-技能-法宝体系设计文档
    ├── CG_GENERATION_PLAN.md      CG 生成提示词
    └── chapters/
        ├── CHAPTER1_REDESIGN.md   第一章剧本
        ├── CHAPTER2_SCRIPT.md     第二章剧本
        ├── CHAPTER3_SCRIPT.md     第三章剧本
        ├── CHAPTER4_SCRIPT.md     第四章剧本（待接入）
        └── CHAPTER5_SCRIPT.md     第五章剧本（待接入）
```

> **注意**：`src/screens/LearnScreen.ts`（传功长老学技能）已删除。技能现在通过主线剧情 VN 授予，不再有独立的学功界面。`ScreenId` 中已移除 `'learn'`。

---

## 三、模块职责详解

### 3.1 数据层 (`src/data/`)

#### `types.ts` — 类型单一来源

所有 ID 联合类型在此集中定义，**任何新增敌人/技能/NPC 都必须先在此处加 ID**：

```typescript
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
  | 'wudang_yunkai' | 'wudang_songtao' | 'wudang_guiyuan';

export type EnemyId = 'training_dummy' | 'shadow_scout' | 'shadow_agent' | ...;
export type NpcId = 'mo_jiangqing' | 'liu_qinghan' | ...;

// Screen ID（已移除 'learn' 和 'depart'）
export type ScreenId =
  | 'main' | 'saveselect' | 'create' | 'story'
  | 'camp' | 'dialog' | 'battle';

// Camp Tab（'court'/'sect'/'mission'/'world' 为沙盒模式新增）
export type CampTabId = 'story' | 'attr' | 'bag' | 'skill' | 'fabao' | 'relation' | 'mission' | 'court' | 'sect' | 'world';
```

`PlayerState` 接口也在此定义，包含所有玩家字段（`chapter`、`act`、`chapter2Route`、`equippedFabao`、`ownedFabao` 等）。

**🆕 0507 突破与宗门字段**：
```typescript
export interface PlayerState {
  // ...
  /** 已解锁突破的大境界列表（如 ['zhuji'] 表示筑基突破已解锁） */
  realmBreakUnlocked: string[];
  /** 宗门身份等级：'outer'=外门, 'inner'=内门, 'true'=真传, 'elder'=长老 */
  discipleRank: string;
  /** 第三章剧情标记（已废弃，改用 realmBreakUnlocked） */
  chapter3Breakthrough: boolean;
  // ...
}
```
- `realmBreakUnlocked`：剧情推进时添加目标大境界 ID，用于 `canBreakThrough()` 检查
- `discipleRank`：由剧情独立设置，不影响修为等级
- `chapter3Breakthrough`：保留兼容旧存档，新代码不再依赖此字段判断突破状态

#### `sandboxTypes.ts` — 沙盒类型定义（🆕 0507）

```typescript
// 任务系统
export interface MissionDef {
  id: string; name: string; ...
  enemyId?: string;  // 🆕 combat 类任务的战斗敌人 ID（对应 EnemyId）
}
export interface ActiveMission extends MissionDef { status: MissionStatus; progress: number; ... }

// 晋升系统
export interface PromotionTrial { id: string; targetRank: string; type: 'combat'|'teach'; enemyId?: EnemyId; ... }
export const PROMOTION_REQUIREMENTS: Record<string, { contributionRequired: number; trialId: string }>

// 势力外交
export const ALIGNMENT_AFFINITY: Record<FactionAlignment, Record<FactionAlignment, number>>
export const FACTION_DEFS: Record<string, FactionDef>

// 朝廷
export const COURT_RANK_ORDER: CourtRank[]  // 平民→秀才→...→宰相（10级）
export const COURT_RANK_LABEL: Record<CourtRank, string>

// 偷师（P5-1 待用）
export interface StealSkillConfig { sectId: string; baseSuccess: number; ... }
```

所有沙盒相关的类型、常量和接口统一在此定义，供 `PromotionSystem` / `MissionSystem` / `FactionSystem` / `CourtSystem` 等模块引用。

#### 法宝系统类型（新增）

```typescript
export type FabaoRealm = 'lianqi' | 'zhuji' | 'jiedan' | 'yuanying' | 'huashen' | 'dujie';
export type FabaoType = 'weapon' | 'armor' | 'accessory';

// 境界颜色映射（炼气白→筑基绿→结丹蓝→元婴紫→化神金→渡劫红）
export const REALM_COLORS: Record<FabaoRealm, { name: string; color: string; css: string; levelRange: [number, number] }>;

export function getRealmByLevel(level: number): FabaoRealm | null;

export interface FabaoData {
  id: FabaoId; name: string; icon: string;
  type: FabaoType; realm: FabaoRealm;
  color: string; colorCss: string; desc: string;
  atkBonus?: number; defBonus?: number; hpBonus?: number;
  specialEffect?: { type: string; value: number; desc: string };
  obtain: string; requireLevel: number;
}
```

`PlayerState` 新增字段：`equippedFabao: { weapon, armor, accessory }` + `ownedFabao: FabaoId[]`。

#### 战斗系统类型（4v4 团队战架构）

```typescript
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
  scriptedDefeat?: boolean;
  aiDesc: string;
}

export interface BattleContext {
  state: BattleStateEnum;
  units: BattleUnit[];              // 所有战斗单位（我方+敌方）
  allies: BattleUnit[];             // 我方存活单位引用
  enemies: BattleEnemyUnit[];       // 敌方存活单位引用
  currentUnitIndex: number;         // 当前行动单位在 turnOrder 中的索引
  turnOrder: BattleUnit[];          // 本回合行动顺序（1A-1B-2A-2B-3A-3B-4A-4B）
  round: number;
  log: string[];
  skillCooldowns: Partial<Record<SkillId, number>>;
  hasPrevision: boolean;
  pendingEvade: boolean;
  selectedTarget: BattleUnit | null; // 当前选中的目标
  teamBattle: boolean;              // 是否团队战（4v4）
  allyStatuses: Record<string, StatusEffect[]>;    // 友方状态效果 { unitId: StatusEffect[] }
  enemyStatuses: Record<string, StatusEffect[]>;   // 敌方状态效果 { unitId: StatusEffect[] }
}
```

**关键变更**：
- 从 `player`/`enemy` 单体结构改为 `allies[]`/`enemies[]` 多单位数组
- 状态效果从 `playerStatus`/`enemyStatus` 改为 `allyStatuses`/`enemyStatuses`（按 unitId 索引）
- 新增 `turnOrder` 回合顺序（交替穿插：1A-1B-2A-2B...）
- 新增 `selectedTarget` 目标选择机制
- 新增 `teamBattle` 标志区分单挑/团队战

#### `chapters/types.ts` — 章节数据结构

```typescript
interface CampScene {
  id: string;
  title: string;
  bg: string;
  npc: { name: string; sub: string; img: string } | null;
  desc: string;
  actionLabel: string;    // 按钮文字
  actionEvent: string;    // 传给 triggerStoryEvent() 的事件 ID
}

interface ChapterData {
  id: number;
  title: string;
  startNode: string;      // 章节首次进入时的起始 VN 节点
  storyNodes: Record<string, StoryNode>;   // 所有 VN 节点
  campScenes: Record<number, CampScene>;   // act 编号 → 营地场景
  finalAct: number;       // 章节首次完整看完后设置的 act 值
}
```

#### `chapters/index.ts` — 章节注册表

```typescript
export const CHAPTERS: Record<number, ChapterData> = { 1: CH1, 2: CH2, 3: CH3 };
export function getChapter(n: number): ChapterData { ... }
```

`getChapter(n)` 如果章节未注册会抛出清晰错误信息。添加新章节只需：新建 `ch{N}.ts` + 在此处注册。

**当前已注册章节**：第一章（CH1）、第二章（CH2）、第三章（CH3·内门风云）。

---

### 3.2 状态层 (`src/state/`)

#### `GameState.ts` — 单例玩家状态

```typescript
export function getPlayer(): PlayerState  // 未初始化时抛错
export function setPlayer(p: PlayerState): void
export function clearPlayer(): void
```

**修改状态的唯一方式**：`setPlayer({ ...getPlayer(), field: newValue })`，immutable spread，禁止直接 mutate。

#### `SaveSystem.ts` — 存档 I/O

```typescript
export function saveGame(p: PlayerState, slot?: number): void
export function loadSave(slot: number): PlayerState | null
export function loadAllSlots(): Array<{ slot: number; data: PlayerState } | null>
```

加载时通过 `PlayerStateSchema.safeParse()` 验证数据，自动补全缺失字段（向下兼容旧存档）。

#### `schemas.ts` — Zod Schema

`PlayerStateSchema` 镜像 `PlayerState` 接口，所有字段带 `.default()`。**新增 `PlayerState` 字段时必须同步在此加对应的 Zod 定义**，否则旧存档加载会丢失该字段。

**🆕 0507 突破与宗门 Schema**：
```typescript
// 🆕 突破解锁状态（旧存档兼容：默认为空数组）
realmBreakUnlocked: z.array(z.string()).default([]),
// 🆕 宗门身份（旧存档兼容：默认外门）
discipleRank: z.string().default('outer'),
```
旧存档加载时自动补全：`realmBreakUnlocked` 为空数组（无任何突破解锁），`discipleRank` 为 `'outer'`（外门弟子）。

**🆕 0429 新增 NPC 数据库 Schema**：
```typescript
npcDatabase: z.record(z.string(), z.object({
  id: z.string(), name: z.string(),
  talent: z.string().default('normal'),
  sect: z.string().default('wudang'),
  level: z.number().default(1), exp: z.number().default(0),
  hp: z.number(), maxHp: z.number(),
  mp: z.number(), maxMp: z.number(),
  atk: z.number(), def: z.number(), agi: z.number(), crit: z.number(),
  skills: z.array(z.string()).default([]),
  equippedFabao: z.object({ weapon: z.string().nullable().default(null), ... }),
  ownedFabao: z.array(z.string()).default([]),
})).default({})
```
旧存档加载时 `npcDatabase` 自动补全为空对象 `{}`，首次进入游戏时通过 `initNpcDatabase()` 初始化。

#### `LevelSystem.ts` — 10 层制修为系统

```typescript
export const REALM_NAMES = [
  '凡人',
  '炼气一层','炼气二层','炼气三层','炼气四层','炼气五层',
  '炼气六层','炼气七层','炼气八层','炼气九层','炼气十层',
  '筑基一层','筑基二层', ... // 直到飞升十层
];
```

**关键变更**：
- `level` 默认值从 `1` 改为 `0`（0=凡人，1=炼气一层）
- `REALM_NAMES` 从原来的大境界名称改为精确的 10 层制名称
- `checkLevelUp()` 中 `let lv = player.level || 0`

**🆕 大境界硬门槛**：
```typescript
export function isRealmMaxLevel(lv: number): boolean {
  return lv > 0 && lv % 10 === 0;
}
```
- 大境界第十层（10/20/30/40/50/60）满后，经验条卡满不再增长，不会自动晋级
- 必须通过对应剧情解锁 + 玩家主动点击突破按钮才能突破大境界

**🆕 0507 突破大境界系统**：

```typescript
// 大境界 ID 与名称映射
export const MAJOR_REALMS = ['lianqi', 'zhuji', 'jiedan', 'yuanying', 'huashen', 'dujie'] as const;
export const MAJOR_REALM_NAMES: Record<string, string> = {
  lianqi: '炼气', zhuji: '筑基', jiedan: '结丹',
  yuanying: '元婴', huashen: '化神', dujie: '渡劫',
};
export const REALM_START_LEVEL: Record<string, number> = {
  lianqi: 1, zhuji: 11, jiedan: 21, yuanying: 31, huashen: 41, dujie: 51,
};

// 根据 level 获取大境界 ID
export function getMajorRealmId(lv: number): string | null;

// 检查是否可以突破大境界（三个条件：满层 + 经验满 + 剧情已解锁）
export function canBreakThrough(player: PlayerState): BreakThroughResult;

// 执行突破大境界（消耗经验，跃升至下一境界第一层，重算属性）
export function breakThroughRealm(player: PlayerState): BreakThroughResult;
```

**突破流程**：
1. 玩家修炼到当前大境界第十层，经验条满（红色"已满"提示）
2. 推进剧情，剧情在 `realmBreakUnlocked` 中添加目标大境界 ID（如 `'zhuji'`）
3. 属性面板中经验条下方出现「⚡ 突破境界」红色按钮
4. 玩家点击按钮 → `breakThroughRealm()` 执行突破：
   - 经验归零，level 跃升至下一境界第一层
   - 调用 `calculateFinalStats(newLevel, [playerTalent])` 重算属性（含大境界断层增幅 + 天赋加成）
5. 特殊：凡人→炼气（level 0→1）无需剧情解锁，入武当自动突破

**与旧版的区别**：
- 旧版：剧情直接设置 `level`（如 `enter_chapter3` 设 `level: 11`），修为与剧情强绑定
- 新版：剧情仅设置 `realmBreakUnlocked: ['zhuji']` + `discipleRank: 'inner'`，不再设 level；玩家自主决定何时点击突破

**经验曲线（🆕 0429 优化）**：
```typescript
export function getExpForLevel(lv: number): number {
  // 统一公式 42 × lv^1.1，配合提升后的日常任务奖励
  // 确保演武切磋（+55）升任意一级最多约 20 次点击
  return Math.floor(42 * Math.pow(lv, 1.1));
}
```
- 旧公式：`50 × lv^1.5`（分段），炼气八层→九层需约 35 次切磋
- 新公式：`42 × lv^1.1`（统一），配合日常任务奖励提升，最多约 20 次点击升级

---

### 3.3 系统层 (`src/systems/`)

#### `BattleEngine.ts` — 4v4 团队战引擎

**不依赖任何 screen 模块**，完全通过 `bus.emit` 与 UI 解耦。

核心 API：
```typescript
export function initBattle(enemyId: EnemyId): void       // 开始战斗（支持单挑/团队战）
export function getBattleContext(): BattleContext | null
export function getCurrentUnit(): BattleUnit | null       // 获取当前行动单位
export function getTargetableEnemies(): BattleEnemyUnit[] // 获取可选目标
export function playerUseSkill(skillId: SkillId, targetId?: string): void
export function playerBasicAttack(targetId?: string): void
export function useHpPotion(): void
```

**回合流程**：
1. `buildTurnOrder()` 构建回合顺序：1A-1B-2A-2B-3A-3B-4A-4B（交替穿插）
2. 每个单位行动时检查 `alive`，跳过已死亡单位
3. 玩家控制单位（`isPlayer: true`）进入 `player_turn` 状态，等待输入
4. 非玩家友方单位（`side === 'ally' && !isPlayer`）自动执行队友 AI（`_allyTurn()`）
5. 敌方单位自动执行敌方 AI（`_enemyTurn()`）
6. 一方全部阵亡时结束战斗

**队友 AI（🆕 0429 新增）**：
- `_allyTurn(ally)`：自动控制 NPC 队友行动
- 目标选择：HP 比例最低的敌人
- 技能选择：从 `ally.skills` 中筛选非被动/非辅助、MP 足够、无冷却的攻击技能，随机使用
- MP 不足时执行普通攻击
- 支持暴击判定、状态效果附加、死亡检测

**伤害公式**（不变）：
```
伤害 = max(1, atk × powerMul - def × defPen) × [0.9, 1.1] × (暴击 ? 1.5 : 1)
```

**scriptedDefeat**：检查所有敌方单位，任一有 `scriptedDefeat` 标志时，失败不 game over。

#### `EnemyAI.ts`

```typescript
export function selectEnemyAction(enemy: BattleEnemyUnit): EnemyAction
export function predictNextAction(enemy: BattleEnemyUnit): { icon: string; name: string }
```

适配多单位架构，AI 选择目标时遍历存活友方单位。

#### `NpcBehavior.ts` — NPC 动态行为引擎（🆕 v2.0 优先级重构 + v2.9 寿命系统）

**v2.0 重构**：从旧版「三选一 + 独立移动判定」改为 5 级优先级行为树 + NPC 间互动。

**🆕 v2.9 寿命与死亡**：
- 每 tick NPC 年龄增长（`age += 1/12` 月），`age >= maxAge` → 寿终正寝
- 争斗死亡：恶意互动（brawl/ambush/revenge）中大等级差（≥10）败方 5% 死亡
- 攻城战死亡：参战 NPC 2% 阵亡（玩家队友除外）
- 人口上限 80 存活 NPC，低于上限时自动生成替补（Lv.1~3 散修）
- 宗门季度纳新（每3月）：大中型宗门招收 1 名弟子，5% 天骄率
- NPC 主动互动玩家：好感高 → 赠礼/情报/同行，好感低 → 挑衅/谣言，🆕 中性好感(-29~59) → 寒暄/闲聊/搭话/小买卖（25%概率，性格影响效果）

```typescript
export function initNpcDatabase(): Record<string, NpcStats>   // 初始化 NPC 数据库（含初始位置+寿命计算）
export function getNpcStats(id: string): NpcStats | null       // 获取单个 NPC 数值
export function tickNpcBehaviors(): NpcTickResult[]            // 执行所有 NPC 行为 tick（5级优先级+年龄增长+死亡判定+替补生成）
export function getNpcsAtLocation(locId: LocationId): NpcStats[] // 获取指定地点的 NPC
export function tickNpcToNpcInteractions(): NpcInteractionResult[] // NPC 间自主互动（含争斗死亡判定）
export function tickNpcPlayerInteraction(): void               // 🆕 NPC 主动互动玩家
export function tickQuarterlySectRecruitment(): NpcTickResult[] // 🆕 宗门季度纳新
export function appendNpcLog(npcId: string, entry: string): void  // 追加 NPC 近期经历
```

**5 级优先级行为树**（每回合仅执行一项）：

| 优先级 | 行为 | 触发条件 | 概率 |
|--------|------|----------|------|
| 1 | 🩹 疗伤 | HP < 50% → 恢复 20-30% | 条件触发（跳过其他行为） |
| 2 | 🧘 修炼 | 含门派资源加成（±20%） | 60% |
| 3 | 💬 社交 | 记录为社交行为 | 15% |
| 4 | 📋 门派任务 | patrol(稳定度+3~8) / gather(资源+10~25) / train(exp+30%) | 15% |
| 5 | 🚶 移动 | 阵营加权：正道→友好据点(×3)，混乱→邪道据点(×1.8) | 10% |

**NPC 间自主互动**（`tickNpcToNpcInteractions`）：
- 按地点分组，同地点 NPC 两两配对
- 性格×阵营×友好度 多因素驱动：16 种互动动作池（交谈/赠礼/指点/相助/品茶/切磋/交换情报/交易/论道/挑衅/激斗/暗算/谣言/夺宝/复仇）
- 自动关系标签检测：好感≥60→好友、≤-60→仇敌

**NPC 天赋系统（P8）**：
- 36 天赋 × 5 层权重（绝世3%/上等11%/中等45%/下等28%/诅咒11%）
- 0.5% 天骄（强制 2 绝世 + 1 上等，修行×1.5，全属性+20%）
- `migrateNpcTalents()` 兼容旧存档 `talent` 单字段 → `talents[]` 数组

NPC 数据库含 ~34 个手写 NPC + ~500-800 随机生成 NPC，存储在 `PlayerState.npcDatabase` 中随存档持久化。

#### `realmConfig.ts` — 境界基础数值配置（🆕 0430 新增）

```typescript
export type MajorRealm = 'lianqi' | 'zhuji' | 'jiedan' | 'yuanying' | 'huashen' | 'dujie';

export function calculateBaseStats(level: number): BaseStats     // 计算指定等级的基础属性
export function calculateFinalStats(level: number, talents: TalentId[]): BaseStats & { crit: number }  // 含天赋加成
export function getMajorRealmByLevel(level: number): MajorRealm | null
export function validateRealmLeap(): { from: string; to: string; hpRatio: number; atkRatio: number }[]
```

**🆕 主角天赋属性系统**：
- 主角创建时 `playerTalent: 'dragon_vein'`（九霄龙脉：全属性+10%，修行速度×1.3，暴击+5%）
- `calculateFinalStats(level, [playerTalent])` 自动将天赋加成融入属性计算
- 第一章序幕结束、C3突破筑基等关键节点均使用此函数重算属性
- 主角天赋不在属性面板中展示（避免剧透），但实际属性已包含加成

**基准值**（各境界第 1 层）：

| 境界 | HP | MP | ATK | DEF | AGI |
|------|-----|-----|------|------|------|
| 炼气 | 100 | 30 | 15 | 8 | 10 |
| 筑基 | 230 | 65 | 35 | 20 | 18 |
| 结丹 | 500 | 140 | 75 | 45 | 28 |
| 元婴 | 1100 | 300 | 160 | 95 | 42 |
| 化神 | 2400 | 650 | 350 | 210 | 62 |
| 渡劫 | 5200 | 1400 | 760 | 460 | 90 |

**小层级增长**：每层 +10%（线性），大境界跨越时自动体现 100%~150% 断层增幅。

#### `worldMap.ts` — 世界地图节点配置（🆕 0430 新增，0501 更新，0510 扩展至35地点）

只保留门派/大城市级别地点，内部区域（武当内门、传功崖等）通过对话和剧情触发，不在地图上展示。

```typescript
export type LocationId =
  // 西北
  | 'kunlun_mountain' | 'kongtong_mountain' | 'liangzhou_city'
  // 关中
  | 'changan_city' | 'huashan_base' | 'zhongnan_mountain'
  // 北方
  | 'taiyuan_city' | 'heimu_cliff' | 'yanjing_city'
  // 中原
  | 'luoyang_city' | 'kaifeng_city' | 'shaolin_temple'
  // 湖广
  | 'xiangyang_city' | 'beggar_hq' | 'wudang_mountain'
  | 'jiangling_city' | 'wuchang_city'
  // 江南
  | 'yangzhou_city' | 'jinling_city' | 'maoshan_daoyuan'
  | 'jiangzhou_city' | 'suzhou_city' | 'hangzhou_city'
  | 'mingzhou_city' | 'xiaoyao_valley'
  // 蜀中
  | 'chengdu_city' | 'tangmen_estate' | 'chongqing_city'
  | 'emei_mountain' | 'qingcheng_mountain'
  // 岭南
  | 'tanzhou_city' | 'dali_city' | 'diancang_mountain'
  | 'fuzhou_city' | 'guangzhou_city';
```

共 ~35 个地点节点，基于宋朝真实地理。每个节点有 `connections` 定义相邻可移动地点，`unlockChapter` 控制解锁条件。

**🆕 地点可用行动（`actions` 字段）**：

每个 `MapLocation` 可定义 `actions?: LocationAction[]`，指定该地点可执行的日常任务：

```typescript
interface LocationAction {
  id: string; icon: string; name: string; desc: string;
  exp: number; gold: number; contribution?: number;
  unlockChapter?: number;
  unlockLevel?: number;
  sectTarget?: string;  // 仅指定宗门成员可见（如 'wudang'）
}
```

**`sect_learn_skill` 行动**（🆕 0510 新增）：

所有宗门据点均有此行动，点击弹出 `SkillLearnOverlay` 习武弹窗。该行动在 `StoryPanel.renderDailyTasks()` 中按 `sectTarget` 过滤，只有对应门派成员能看到。

| 宗门据点 | sectTarget | unlockChapter |
|---------|-----------|---------------|
| 武当山 | wudang | 2 |
| 少林寺 | shaolin | 2 |
| 峨眉山 | emei | 2 |
| 丐帮 | beggar | 2 |
| 茅山道院 | maoshan | 2 |
| 昆仑山 | kunlun | 2 |
| 青城山 | qingcheng | 2 |
| 唐家堡 | tangmen | 2 |
| 逍遥谷 | xiaoyao | 2 |
| 终南山（全真） | quanzhen | 2 |
| 崆峒山 | kongtong | 2 |
| 点苍山 | diancang | 2 |
| 黑木崖（日月教） | riyue | 3 |
| 华山 | huashan | 2 |

> ✅ **魔教（demon）** 已实装独立技能树（12技），与日月教（riyue）同为邪道但技能体系独立。

**当前各地点标准行动**：

| 地点 | 行动 | 经验 | 铜钱 | 解锁条件 |
|------|------|------|------|----------|
| 武当山 | 🪓 砍柴 | +20 | +5 | chapter≥2 |
| 武当山 | 💧 挑水 | +15 | +3 | chapter≥2 |
| 武当山 | 🧹 打扫大殿 | +18 | +4 | chapter≥2 |
| 武当山 | 📜 抄写道经 | +35 | +8 | chapter≥2 |
| 武当山 | 🌙 后山修炼 | +45 | 0 | chapter≥2, level≥2 |
| 武当山 | ⚔️ 演武切磋 | +55 | 0 | chapter≥2, level≥6 |
| 各大城市 | 🧘 城中静修 | +30 | 0 | chapter≥2 |

`doDailyTask(action)` 执行任务：增加经验/铜钱 → `checkLevelUp()` → 保存 → 15% 概率触发小概率事件。`renderDailyTasks()` 从当前地点的 `actions` 过滤可用/锁定任务并渲染，标题显示 `📋 日常修行 · {地点名}`。

**与旧版的关键区别**：
- 旧版：硬编码 `DAILY_TASKS` + `wudangOnlyTasks` 硬编码地点检查
- 新版：`WORLD_MAP[locId].actions` 动态读取，自然按地点过滤，无需额外检查

#### `sectSkillTables.ts` — 各宗门技能表（🆕 0510 新增）

从 `NpcBehavior.ts` 中独立出来的宗门技能表，供 `SkillLearnOverlay.ts` 和 `NpcBehavior.ts` 共用。

```typescript
// 每条记录：[所需等级, SkillId]（等级≥该值可学/可使用）
// 21 个势力全部拥有独立技能表（~324 技能），SECT_SKILL_TABLES 已全覆盖
export const WUDANG_SKILL_TABLE: Array<[number, SkillId]> = [
  [1, 'wudang_changquan'], [1, 'yangqi_jue'], [1, 'wudang_jianfa_basic'], [1, 'wudang_qinggong'],
  [11, 'mianzhang'], [11, 'wudang_sword'], [11, 'zixiao'], [11, 'wudang_huti'], [11, 'wudang_lianjian'],
  // ... 结丹/元婴/化神/渡劫各4技
];

// 共 21 张技能表：19宗门 + 叛军(rebel) + 朝廷(imperial_court) +
//                魔教(demon) + 逍遥派(xiaoyao)
export const SECT_SKILL_TABLES: Partial<Record<SectId, Array<[number, SkillId]>>> = {
  wudang: WUDANG_SKILL_TABLE, shaolin: SHAOLIN_SKILL_TABLE,
  // ... 共21项，全部已实装
};

// 根据等级返回境界信息（用于分层渲染）
export function getSkillRealm(level: number): {
  name: string;    // '炼气期'|'筑基期'|'结丹期'|'元婴期'|'化神期'|'渡劫期'
  cost: number;    // 贡献值消耗：20/50/100/200/400/800
  color: string;   // CSS 颜色变量
  range: [number, number];  // 等级范围
}
```

**境界贡献值消耗**：炼气 20 / 筑基 50 / 结丹 100 / 元婴 200 / 化神 400 / 渡劫 800。

#### `StatusEffects.ts`

状态效果按 `unitId` 索引存储（`allyStatuses` / `enemyStatuses`）。日志文本改为通用格式，不再区分 isPlayer。

---

### 3.4 Screen 层 (`src/screens/`)

#### `ScreenManager.ts`

```typescript
export function showScreen(id: ScreenId): void   // 切换激活的 screen div
export function getCurrentScreen(): ScreenId
```

HTML 中 8 个 screen div 同时存在（已移除 `screen-learn`），通过 CSS `.active` class 控制可见性。

#### `StoryScreen.ts` — VN 引擎

核心 API：
```typescript
export function runStoryIntro(startNodeId?: string, onFinish?: () => void): void
export function showStoryNode(nodeId: string): void
export function skipStoryIntro(): void
```

**节点类型与行为**：

| 类型 | 触发方式 | 结束后 |
|------|---------|--------|
| `narration` | 打字机显示文本 | 点击/空格/回车进入 `next` |
| `dialogue` | 打字机显示对话 + 立绘 | 点击/空格/回车进入 `next` |
| `choice` | 显示选项按钮（无打字机） | 点击按钮进入对应 `next` |
| `cg` | 全屏背景图 + 延时 | `delay` ms 后自动进入 `next`（可点击跳过） |
| `flash` | 白色闪光动效 | 400ms 后进入 `next`（禁止点击） |
| `battle` | 调用 `initBattle()` 切到战斗 | 通过 `bus.on('battle:end')` 继续 |

**`finishStoryIntro()` 的两种行为**：
- 有 `onFinish` 回调：执行回调（第二章各段独立剧情使用此模式）
- 无回调（默认，第一章序幕）：应用武当入门属性（HP230/ATK30 等），设 `act = chapter.finalAct`，进入营地

#### `camp/StoryPanel.ts` — 营地事件派发（🆕 0501 重构）

`triggerStoryEvent(eventId)` 处理所有营地按钮点击。营地场景由 `getChapter(p.chapter).campScenes[p.act]` 确定，按钮点击触发对应 `actionEvent`。

**🆕 可重复日常任务系统（按地点动态读取）**：

日常任务不再使用硬编码的 `DAILY_TASKS` 数组，改为从 `WORLD_MAP[currentLocationId].actions` 动态读取。每个地点通过 `worldMap.ts` 的 `LocationAction` 接口定义可用行动：

```typescript
// src/data/worldMap.ts
interface LocationAction {
  id: string; icon: string; name: string; desc: string;
  exp: number; gold: number;
  unlockChapter?: number;
  unlockLevel?: number;
}
```

**当前各地点行动**：

| 地点 | 行动 | 经验 | 铜钱 | 解锁条件 |
|------|------|------|------|----------|
| 武当山 | 🪓 砍柴 | +20 | +5 | chapter≥2 |
| 武当山 | 💧 挑水 | +15 | +3 | chapter≥2 |
| 武当山 | 🧹 打扫大殿 | +18 | +4 | chapter≥2 |
| 武当山 | 📜 抄写道经 | +35 | +8 | chapter≥2 |
| 武当山 | 🌙 后山修炼 | +45 | 0 | chapter≥2, level≥2 |
| 武当山 | ⚔️ 演武切磋 | +55 | 0 | chapter≥2, level≥6 |
| 襄阳城 | 🧘 城中静修 | +30 | 0 | chapter≥2 |
| 江陵城 | 🧘 城中静修 | +30 | 0 | chapter≥2 |

`doDailyTask(action)` 执行任务：增加经验/铜钱 → `checkLevelUp()` → 保存 → 15% 概率触发小概率事件。`renderDailyTasks()` 从当前地点的 `actions` 过滤可用/锁定任务并渲染，标题显示 `📋 日常修行 · {地点名}`。

**与旧版的关键区别**：
- 旧版：硬编码 `DAILY_TASKS` + `wudangOnlyTasks` 硬编码地点检查
- 新版：`WORLD_MAP[locId].actions` 动态读取，自然按地点过滤，无需额外检查

**🆕 宗门习武入口（0510 新增）**：

`doDailyTask()` 处理 `sect_learn_skill` action：
```typescript
} else if (action.id === 'sect_learn_skill') {
  import('./SkillLearnOverlay').then(m => m.showSkillLearnOverlay());
  return;
}
```

`renderDailyTasks()` 中 `sect_learn_skill` 过滤：
```typescript
if (t.id === 'sect_learn_skill' && t.sectTarget && p.sect !== t.sectTarget) return false;
```

`sect_learn_skill` 被纳入 `isShop` 检查，渲染"进入 →"按钮，不显示"+0 EXP"字样。

**🆕 任务战斗按钮（0510 新增）**：

`renderDailyTasks()` 在日常行动区域末尾，若当前地点有 active 的 combat/escort 任务，追加"⚔️ 进行中任务"区块：
- 每个 combat 任务渲染一张 `.mission-fight-card` 卡片（橙色描边）
- 卡片上有"⚔️ 执行战斗"按钮，携带 `data-mission-fight=enemyId` 和 `data-mission-index`
- `bindDailyTaskButtons()` 注册点击事件：调用 `initBattle(enemyId)`，监听 `battle:end` → 胜利后 `updateMissionProgress('combat', locId)`

**已绑定的 combat 任务 enemyId 对照（`MissionSystem.ts`）**：

| 任务 ID | 地点 | enemyId |
|--------|------|---------|
| m_bandit_xyr | xiangyang_city | bandit_elite |
| m_bandit_jlr | jiangling_city | bandit_elite |
| m_hunt_fugitive | luoyang_city | one_eye_leopard |
| m_beggar_thugs | beggar_hq | rogue_thug |
| m_demon_scout | kaifeng_city | demon_vanguard |
| m_sword_rival | huashan_base | huashan_swordsman |

当前已有事件处理：

| eventId | 行为 |
|---------|------|
| `act1_chess` | openDialog('mo_jiangqing') |
| `act2_thunder` | 推进 act=2 |
| `act3_escape` | initBattle('shadow_scout') |
| `act4_snow` | openDialog('liu_qinghan') + 推进 act=4 |
| `enter_chapter2` | 设 chapter=2/act=0 → runStoryIntro('ch2_intro_0', callback) |
| `ch2_wendao` | 等级门(lv≥1) → VN → 授技能 + act=1 |
| `ch2_yeshou` | 等级门(lv≥2) → VN → 授技能 + act=2 |
| `ch2_shijian` | 等级门(lv≥6) → VN → act=3 |
| `ch2_xiasha` | 等级门(lv≥8) → VN → 晋升属性 + **设 discipleRank='inner'** + act=4 |
| `enter_chapter3` | 设 chapter=3/act=0 → runStoryIntro('ch3_break_0', callback) → **解锁筑基突破(realmBreakUnlocked)+设discipleRank='inner'**，不再直接设 level |
| `ch3_breakthrough` | VN → **解锁筑基突破(realmBreakUnlocked)+设discipleRank='inner'**，不再直接设 level |
| `ch3_giftshu` | VN → 赠宋知远手册 + act=2 |
| `ch3_baishi` | VN → 拜陈静虚为师 + act=3 |
| `ch3_shoujian` | 等级门(lv≥13) → VN → 授【云开】+ act=4 |
| `ch3_xiashan` | 等级门(lv≥15) → VN → 下山行侠 + 黑月教令牌 + act=5 |
| `ch3_fengmang` | 等级门(lv≥17) → VN → 试剑会 vs 陆沉舟 + act=6 |
| `ch3_hunyue` | VN → 婚约剧情 + act=7 |
| `ch3_duokui` | VN → 试剑会次日连战 + 夺魁 + act=8 |
| `ch3_zhenchuan` | VN → **设 discipleRank='true'（晋升真传弟子）** + act=9 |
| `ch3_chuzheng` | VN → 出征黑月教讨伐 |

> **🆕 0507 突破机制重构**：`enter_chapter3` 和 `ch3_breakthrough` 不再直接设置 `level`，改为设置 `realmBreakUnlocked: ['zhuji']` + `discipleRank: 'inner'`。玩家需在属性面板手动点击「⚡ 突破境界」按钮完成筑基突破。`ch2_xiasha` 设置 `discipleRank: 'inner'`（晋升内门），`ch3_zhenchuan` 设置 `discipleRank: 'true'`（晋升真传）。

#### `camp/AttrPanel.ts` — 属性面板（🆕 0507 更新）

`renderAttrPanel(content)` 渲染角色属性、修为进度、属性加点、突破境界按钮。

**🆕 宗门身份显示**：
```typescript
const rankLabels: Record<string, string> = { outer: '外门弟子', inner: '内门弟子', true: '真传弟子', elder: '长老' };
const rankLabel = rankLabels[p.discipleRank] || '外门弟子';
// 显示在角色名下方：sect.name · rankLabel · realmName
```

**🆕 突破境界按钮**：
- 满层时经验条显示红色"已满（需突破契机）"
- 当 `canBreakThrough(p).success === true` 时，经验条下方出现「⚡ 突破境界」红色按钮
- 点击按钮 → `breakThroughRealm(getPlayer())` → 更新属性 → 保存 → Toast 提示
- 突破后自动重渲染面板

#### `camp/RelationPanel.ts` — 人物关系面板（新增，0501 更新）

可折叠分类的人物关系面板：
- **🌸 女主角**：柳清寒、沈霓裳、趙沁微、墨绐青
- **☯️ 武当派**：张玄素、陈静虚、陆沉舟、顾小桑、宋知远、纪无双、苏云绣、方仲和、孟文渊、叶紫衣、周伯安（外门管事）

每人显示小立绘（56×84px）+ 好感度数值，一行四列布局。分类标题带有光效动画（左侧光条、图标浮动、箭头弹跳），引导玩家点击展开。未解锁角色显示灰色立绘 + "未解锁"标注（如趙沁微在第三章前未解锁，沈霓裳在第二章 act≥4 后解锁，纪无双/苏云绣/方仲和在第三章 act≥8 后解锁，孟文渊/叶紫衣在第三章 act≥9 后解锁）。

**🆕 NPC 状态弹窗（0513 鬼谷八荒式横版重设计）**：点击已解锁角色的立绘卡片，弹出该角色的详细状态面板。横版布局（720px）：左侧 240px 立绘面板带境界颜色光晕（`--realm-glow` CSS 变量），天骄 NPC 金色光效增强；右侧属性面板显示六大区块：身份标识（所属帮派 🏛️ + 朝廷地位 🏯）、修为境界（名称+经验进度条）、六维属性网格（HP/MP/ATK/DEF/AGI/暴击）、天赋标签（按品质着色）、装备法宝（3件横排）、好感度条+性格描述。支持关闭按钮、点击背景、ESC 键三种关闭方式。`showNpcStatsOverlay()` 已导出为 public API，供 `Camp.ts` 的 sidebar 复用。

#### `Camp.ts` — 营地主容器（🆕 0507 更新，0510 地图行为更新，0519 身份徽章+SectPanel路由）

**🆕 身份徽章（0519）**：`renderMapBar()` 在地图栏左侧渲染朝廷品阶（🏛️）和师门身份（🏯）两个徽章，始终可见。点击徽章调用 `switchCampTab()` 直接跳转对应面板。徽章通过 `getCourtRankLabelText()` / `getRankLabelText()` 获取标签文字。

**🆕 师门身份面板路由**：`switchCampTab('sect')` 调用 `renderSectPanel(content)`，展示势力四维、贡献进度、晋升路线图。

**🆕 旧存档兼容初始化**：
```typescript
export function enterCamp(): void {
  // ...
  // 🆕 旧存档兼容：初始化突破解锁和宗门身份
  if (!p.realmBreakUnlocked) {
    p = { ...p, realmBreakUnlocked: [] };
    needSave = true;
  }
  if (!p.discipleRank) {
    p = { ...p, discipleRank: 'outer' };
    needSave = true;
  }
  // ...
}
```
旧存档进入营地时自动补全 `realmBreakUnlocked`（空数组）和 `discipleRank`（`'outer'`），确保新系统字段存在。

**🆕 地图弹窗 — 点击不关闭（0510 更新）**：

点击地图节点移动后，地图**不自动关闭**，而是刷新重建（保持打开状态）。适合连续规划路线。

```typescript
// 点击节点前往（不自动关闭，旅行后刷新地图）
overlay.querySelectorAll<HTMLElement>('.s2m-node[data-dest]').forEach(node => {
  node.addEventListener('click', () => {
    const destId = node.dataset['dest'] as LocationId;
    if (!destId || destId === currentId) return;
    if (!WORLD_MAP[currentId]?.connections.includes(destId)) {
      showToast('需要从相邻地点逐步前往。');
      return;
    }
    travelToLocation(destId);
    showMapOverlay(); // 刷新地图（含新位置高亮和可达连线）
  });
});
```

`showMapOverlay()` 内部调用 `document.getElementById('map-overlay')?.remove()` 再重建，所以调用后地图以新位置重新渲染，不会看到旧地图残留。关闭按钮仍可手动关闭。

**🆕 地图 POS 坐标表（35地点）**：

```typescript
const POS: Record<string, { x: number; y: number }> = {
  kunlun_mountain: {x:2,y:8}, kongtong_mountain: {x:10,y:12}, liangzhou_city: {x:6,y:16},
  changan_city: {x:18,y:12}, huashan_base: {x:28,y:15}, zhongnan_mountain: {x:18,y:24},
  taiyuan_city: {x:44,y:10}, heimu_cliff: {x:51,y:5}, yanjing_city: {x:62,y:4},
  luoyang_city: {x:38,y:18}, kaifeng_city: {x:52,y:16}, shaolin_temple: {x:44,y:28},
  xiangyang_city: {x:32,y:42}, beggar_hq: {x:22,y:38}, wudang_mountain: {x:22,y:52},
  jiangling_city: {x:14,y:62}, wuchang_city: {x:30,y:58},
  yangzhou_city: {x:62,y:34}, jinling_city: {x:60,y:40}, maoshan_daoyuan: {x:67,y:36},
  jiangzhou_city: {x:50,y:54}, suzhou_city: {x:72,y:44}, hangzhou_city: {x:72,y:56},
  mingzhou_city: {x:82,y:57}, xiaoyao_valley: {x:76,y:50},
  chengdu_city: {x:4,y:72}, tangmen_estate: {x:8,y:64}, chongqing_city: {x:14,y:74},
  emei_mountain: {x:2,y:82}, qingcheng_mountain: {x:2,y:78},
  tanzhou_city: {x:32,y:74}, dali_city: {x:2,y:92}, diancang_mountain: {x:2,y:96},
  fuzhou_city: {x:76,y:74}, guangzhou_city: {x:55,y:88},
};
```

**🆕 右侧 sidebar「附近的人」**：

`renderSidebar()` 不再是显示剧情 NPC 大立绘，而是显示**当前地点所有 NPC 的小立绘卡片**（一行两个，56×84px，与人物关系面板风格一致）：

- 从 `npcDatabase` 中过滤 `currentLocationId === 当前地点` 的 NPC
- 每个 NPC 卡片显示：立绘 + 名字 + 修为 + 地点标签
- 点击 NPC 卡片弹出 `showNpcStatsOverlay()` 详细状态面板
- NPC 随回合移动到其他地点后，sidebar 实时更新（在 `travelToLocation`/`doRest`/`doSaveGame` 后调用 `renderSidebar()`）
- 没有 NPC 时显示"此地暂无他人"

NPC 立绘路径通过 `getNpcImageMap()` 维护，与 `RelationPanel.ts` 中的图片路径保持一致。

#### `camp/FabaoPanel.ts` — 法宝装备面板（🆕 0430 独立）

法宝从人物关系中独立出来，作为左侧导航的独立 Tab（🔮 法宝装备）。提供三槽（武器/衣服/饰品）装备界面，点击槽位弹出法宝选择器，支持装备/卸下操作。法宝数据来自 `src/data/fabao.ts`（54件，6境×3类×3件）。

#### `camp/SkillLearnOverlay.ts` — 宗门习武弹窗（🆕 0510 新增）

```typescript
export function showSkillLearnOverlay(): void
```

**功能**：
- 检查 `p.sect`，从 `SECT_SKILL_TABLES[sect]` 获取本派技能表
- 按6境界分层渲染技能列表（炼气/筑基/结丹/元婴/化神/渡劫）
- 每个技能显示：icon / 名字 / 境界色标 / 贡献值消耗 / 已学/可学/条件未满足 状态
- 学习条件：境界等级达到 + 贡献值足够 + 未已学习
- 点击"学习"按钮：`sectContribution -= cost` → `p.skills.push(skId)` → `saveGame()` → 重新打开弹窗
- 宗门为 `'none'` 或 `SECT_SKILL_TABLES` 无此宗门时：Toast 提示（黑月教 demon 属此情况）

**CSS 类（`style.css` 中 `slp-*` 前缀）**：

| 类名 | 用途 |
|------|------|
| `.slp-tier` | 境界分组容器 |
| `.slp-tier-header` | 境界标题（颜色对应境界） |
| `.slp-skill-card` | 单个技能卡片（状态变体：`.available`/`.learned`/`.locked`/`.poor`） |
| `.slp-skill-icon` | 技能图标 |
| `.slp-skill-info` | 技能名称+描述 |
| `.slp-badge` | 状态徽章（状态变体：`.learned`/`.locked`/`.poor`） |
| `.slp-learn-btn` | 学习按钮（金色描边，hover 上浮效果） |

#### `DialogScreen.ts` — NPC 对话树

```typescript
export function openDialog(npcId: NpcId): void
```

从 `NPC_DIALOGS` 读取对话树，起始节点首选 `'start'`，若不存在则取第一个键。对话树节点支持 `choices` 数组实现分支。

#### `BattleScreen.ts` — 战斗 UI

**多单位卡片布局**：
- 我方单位渲染在 `#battle-allies`，敌方在 `#battle-enemies`
- 每个单位显示头像/图标、名称、HP/MP 条、状态徽章
- 当前行动单位有金色脉冲边框高亮
- 可选目标有红色边框 + hover 效果
- 点击敌方单位选择目标，再点击技能释放

**🆕 单敌自动选中（0510 更新）**：
- 普通攻击和攻击/控制技能点击时，若 `getTargetableEnemies().length === 1`，自动填充 `_selectedTargetId` 并立即触发攻击/技能
- 多敌情况仍需手动点击选目标
- 沙盒任务战斗（单敌场景）受益最大，无需额外点击

**技能栏**：
- 动态渲染当前控制单位的可用技能
- 显示技能图标、名称、MP 消耗、冷却状态
- 服药按钮显示剩余数量
- 弈理心经预判显示第一个存活敌人的预测行动

---

### 3.5 沙盒模块（`src/systems/` + `src/screens/camp/`）

> 沙盒系统作为**独立模块叠加**在现有剧情系统之上。所有沙盒文件不依赖 DOM，通过总线与 UI 解耦。

#### 核心引擎

| 文件 | 职责 | 核心 API |
|------|------|----------|
| `PromotionSystem.ts` | 沙盒晋升逻辑 | `canPromote()`, `executePromotion()`, `getPromotionTrial()`, `getContributionProgress()` |
| `MissionSystem.ts` | 任务系统引擎 | `acceptMission()`, `updateMissionProgress()`, `completeMission()`, `abandonMission()`, 🆕 `baseExpForDifficulty()`（导出供 UI 层预览属性经验） |
| `FactionSystem.ts` | 势力外交引擎 | `tickFactionDiplomacy()`, `getFactionRelation()`, `getFactionTrust()`, `getFactionAlignment()`, `playerDiplomaticAction()`, `getAllRelationsSnapshot()` |
| `FactionAI.ts` | 🆕 势力议事引擎 v3 | `factionAITick()`, `factionCouncil()`, `claimBestDirective()`, `computeStatPercentile()`, `getFactionDirectives()`, `getNpcOfficial()`, `getFollowerCombatBonus()`, `getFollowerCourtBonus()`, `shareExpWithFollowers()`, `shareCombatGrowthWithFollowers()`, `getFollowerBattleParticipants()`, `tickFollowerDirectiveClaim()`, `getActiveDirectivesForPlayer()`，🆕 recruit 招募指令模板 |
| `SectManagement.ts` | 门派经营+统一据点 | `initSectState()`, `updateSectState()`, `computeSectPower()`, `tickSectNaturalChange()`, **`initSettlements()`**, **`tickSettlements()`**, **`getSettlement()`**, **`getSectSettlement()`**, `updateSettlement()` |
| `CourtSystem.ts` | 朝廷晋升系统 | `canPromoteCourt()` (v2: 属性门+功绩消耗), `executeCourtPromotion()`, `getSplitFocusMultiplier()` |
| `WorldState.ts` | 世界演算引擎 | `initWorldState()`, `tickWorldState()`, `getFactionRankings()`, `addChronicleEntry()`, `joinSect()`, `contributeToFaction()` |
| `CourtSystem.ts` | 朝廷品阶系统 | `getCourtRank()`, `calculateInfluence()`, `getAvailableCourtActions()` |
| `CourtEngine.ts` | 朝廷政务引擎 | `executeCourtAction()`, D100 掷骰 + 修正值判定（成功/大成功/失败） |
| `CourtMissionPool.ts` | 朝廷任务池 | 按品阶/类型分组的政务行动数据 |
| `FabaoShop.ts` | 法器商店逻辑 | `getShopItems()`, `buyFabao()`, `canAfford()`, 宗门店/城市店商品池 |
| `BreakthroughPill.ts` | 突破丹系统 | `useBreakthroughPill()`, `getAvailablePills()`, 丹药替代剧情解锁突破 |
| `NPCGenerator.ts` | 随机 NPC 生成 | `generateSectNPCs()`, `generateCityNPCs()`, `generateCapitalNPCs()`, 门派性别规则 |
| `NPCInteraction.ts` | NPC 互动 | `interactNpc()`, `giftToNpc()`, `sparWithNpc()` |
| `NPCManager.ts` | NPC 管理 + 游说登庸 | `assignNpcToSlot()`, `getNpcBySlot()`, NPC 槽位分配，🆕 `canPersuadeNpc()`（多因素说服）/ `executePersuadeNpc()` |
| `NpcRelationship.ts` | 🆕 NPC 间友好度 | `initAllNpcRelationships()`, `changeNpcAffection()`, `getAffectionTier()`, `getNpcNpcRelationTag()` |
| `TitleSystem.ts` | 🆕 称号系统 | `getActiveTitle()`, `hasTitle()`, `activateTitle()`, `deactivateTitle()`, `getTitleBonus()` — 返回倍率加成（atkMul/defMul/agiMul/hpMul/mpMul/critBonus/cultivationMul） |
| `FactionWarfare.ts` | 🆕 领土争夺 | `tryTriggerSiege()`, `playerJoinSiege()`, `resolveDelegatedSiege()`, 3波车轮战攻城 / 无主地占领 / 随从代战 / 领土控制 / 世界新闻 / 🆕 正邪交战概率翻倍 / 🆕 大势力战力加成（城数+资源+稳定度） / 🆕 领土易主时招降本地NPC |
| `SectManagement.ts` | 🆕 门派经营 | `initSectState()`, `tickSectNaturalChange()`, `executeSectTask()`, `generateCouncilProposal()`, `executeCouncilDecision()` |

#### 沙盒 UI 面板（`src/screens/camp/`）

| 文件 | 对应 Tab | 功能 |
|------|---------|------|
| `MissionPanel.ts` | 📋 当前任务 | 任务列表（接取/追踪/完成/放弃）+ 🆕 属性经验成长预览（`formatTrackStatGains` 按轨道权重计算） |
| `WorldPanel.ts` | 🌏 江湖态势 | 势力排行+详情卡片+个人日志+宗门加入+推演按钮 |
| `CourtPanel.ts` | 🏛️ 朝廷 | 品阶显示+政务行动+影响力进度+文武双线选择 |
| `FabaoShopUI.ts` | 覆盖层弹窗 | 法器商店 UI（宗门店/城市店，按境界分组浏览购买） |
| `SkillLearnOverlay.ts` | 🆕 覆盖层弹窗 | 宗门习武 UI：按6境界分层显示本派技能，消耗贡献值学习 |
| `CouncilScreen.ts` | 🆕 CG全屏覆盖层 | 月度议事 UI：掌门立绘+长老+对话气泡+rank分级选项+攻城参战入口 |
| `SectLeaderPanel.ts` | 🆕 掌门大殿 | 掌门管理界面：资源调配（资源→稳定度/繁荣度）+ 招生纳贤（消耗资源招募NPC弟子）+ 外交决策（宣战/求和/结盟） |

#### 沙盒数据流

```
做日常任务 / 旅行 / 休息
  → 增加 sectContribution / exp / gold
  → tickNpcBehaviors()（NPC 5级优先级行为 + NPC间互动）
  → tickSectNaturalChange()（门派资源+稳定度自然变化）
  → tickWorldState()（每 3 回合触发世界演算）
  → tryTriggerSiege()（势力自动攻城）
  → advanceTurn()（回合推进 → 月初触发月度议事检查）
  → tickFactionDiplomacy()（势力外交检查）
  → updateMissionProgress()（推进活跃任务进度）
  → contributeToFaction()（为所属宗门贡献资源）
  → addChronicleEntry()（写入个人日志）
  → checkLevelUp()（检查修为晋升）
  → 保存 → 刷新 UI（AttrPanel/MissionPanel/WorldPanel/Camp sidebar）
```

> **关键原则**：沙盒 tick 全部在 `doDailyTask()` 中串行触发，不额外增加玩家的操作负担。玩家只需正常砍柴修炼，沙盒世界自动演化。

---

## 四、事件总线

`src/ui/events.ts` 导出 mitt bus 实例，类型化事件：

```typescript
export type GameEvents = {
  'battle:started': {
    allies: BattleUnit[];
    enemies: BattleUnit[];
    teamBattle: boolean;
  };
  'battle:log-add': { html: string };
  'battle:updated': { round: number; currentUnit: BattleUnit | null };
  'battle:end': {
    result: BattleResult;
    expGain: number;
    goldGain: number;
    loot: ItemId[];
  };
  'story:battle-end': { result: BattleResult };
  'player:level-up': { oldLevel: number; newLevel: number };
};
```

**关键变更**：
- `battle:started` 从单体 `playerName/playerImg/enemyName...` 改为 `allies[]/enemies[]/teamBattle`
- `battle:updated` 新增 `currentUnit` 字段，用于 UI 高亮当前行动单位

使用方式：
```typescript
import { bus } from '../ui/events';
bus.emit('battle:end', { result: 'win', expGain: 100, goldGain: 20, loot: [] });
bus.on('battle:end', ({ result }) => { ... });
```

---

## 五、如何添加新章节

以添加**第三章**为例，步骤如下：

### Step 1：更新 `src/data/types.ts`

添加新章节所需的所有新 ID（TypeScript 编译期会验证所有引用）：

```typescript
// 新技能
export type SkillId = ... | 'new_skill_id';

// 新敌人
export type EnemyId = ... | 'new_enemy_id';

// 新 NPC
export type NpcId = ... | 'new_npc_id';

// 新分支字段（如有）
export interface PlayerState {
  ...
  chapter3Route: '' | 'route_a' | 'route_b';
}
```

### Step 2：更新 `src/state/schemas.ts`

同步新增 Zod 字段（确保旧存档向下兼容）：

```typescript
chapter3Route: z.enum(['', 'route_a', 'route_b']).default(''),
```

### Step 3：添加新敌人到 `src/data/enemies.ts`

```typescript
new_enemy_id: {
  id: 'new_enemy_id',
  name: '敌人名',
  icon: '⚔️',
  tier: 3,
  hp: 200, maxHp: 200,
  atk: 40, def: 20, agi: 18,
  reward: { exp: 150, gold: 50 },
  loot: [],
  actions: [
    { name: '普通攻击', icon: '⚔️', powerMul: 1.0, defPen: 0.2, hit: 1, mpCost: 0, weight: 3, effect: null },
  ],
  aiDesc: 'AI 行为描述',
},
```

### Step 4：添加新技能到 `src/data/skills.ts`

```typescript
new_skill_id: {
  id: 'new_skill_id', name: '技能名', icon: '⚡',
  type: 'attack', target: 'enemy',
  mp: 20, hit: 1, powerMul: 1.5, defPen: 0.3,
  cooldown: 2, effect: null, healPct: 0,
  desc: '技能描述', battleTip: '提示文字',
  cost: { exp: 800 }, sect: 'wudang',
},
```

### Step 5：添加新 NPC 到 `src/data/npcs.ts`

```typescript
new_npc_id: {
  name: 'NPC名',
  img: 'picture/Female-main/xxx.png',
  sect: '武当',
  dialogs: {
    first_meet: {
      text: '对话内容',
      choices: [{ text: '选项文字', next: null }],
    },
  },
},
```

注意：NPC 起始对话节点名称不必须是 `'start'`，`openDialog()` 会自动取第一个键。

### Step 6：新建 `src/data/chapters/ch3.ts`

```typescript
import type { StoryNode } from '../types';
import type { ChapterData } from './types';

const STORY_NODES: Record<string, StoryNode> = {
  ch3_intro_0: { type: 'narration', text: '...', next: 'ch3_intro_1' },
  ch3_intro_1: {
    type: 'dialogue',
    speaker: '某人',
    text: '...',
    portrait: 'picture/Female-main/xxx.png',
    bg: 'picture/scene/C3-xxx.png',
    next: 'ch3_choice_0',
  },
  ch3_choice_0: {
    type: 'choice',
    choices: [
      { text: '选项A', next: 'ch3_route_a' },
      { text: '选项B', next: 'ch3_route_b' },
    ],
  },
  ch3_route_a: { type: 'narration', text: '...', next: 'END' },
  ch3_route_b: { type: 'narration', text: '...', next: 'END' },
};

export const CH3: ChapterData = {
  id: 3,
  title: '第三章 · 标题',
  startNode: 'ch3_intro_0',
  storyNodes: STORY_NODES,
  campScenes: {
    0: {
      id: 'ch3_act0',
      title: '第三章 · 场景标题',
      bg: 'picture/scene/C3-xxx.png',
      npc: { name: 'NPC名', sub: '副标题', img: 'picture/Female-main/xxx.png' },
      desc: '场景描述文字',
      actionLabel: '按钮文字',
      actionEvent: 'ch3_first_event',
    },
    // 继续添加 act 1, 2, 3...
  },
  finalAct: 3,   // 章节首次完成后 act 设为此值
};
```

**VN 节点编写规则**：
- 节点 ID 建议用 `ch3_` 前缀避免与其他章节冲突
- 节点路径以 `'END'` 结尾触发 `finishStoryIntro()`
- `battle` 节点的 `nextOnLose` 可省略（默认同 `nextOnWin`）
- `choice` 节点无需 `next` 字段，按钮点击直接跳转到 `choices[i].next`

### Step 7：注册到 `src/data/chapters/index.ts`

```typescript
import { CH3 } from './ch3';

export const CHAPTERS: Record<number, ChapterData> = {
  1: CH1,
  2: CH2,
  3: CH3,   // ← 加这一行
};
```

### Step 8：在 `src/screens/camp/StoryPanel.ts` 添加事件处理

在 `triggerStoryEvent()` 函数内添加新的 `else if` 分支：

```typescript
} else if (eventId === 'ch3_first_event') {
  const p = getPlayer();
  if (p.level < 12) {
    showToast('需要达到筑基二层方可触发。');
    return;
  }
  import('../StoryScreen').then(m => {
    m.runStoryIntro('ch3_first_0', () => {
      const fresh = getPlayer();
      const updated = { ...fresh, act: 1 };
      setPlayer(updated);
      saveGame(updated);
      enterCamp();
    });
  });
} else if (eventId === 'enter_chapter3') {
  const p = getPlayer();
  const updated = { ...p, chapter: 3, act: 0 };
  setPlayer(updated);
  saveGame(updated);
  import('../StoryScreen').then(m => {
    m.runStoryIntro('ch3_intro_0', () => {
      saveGame(getPlayer());
      enterCamp();
    });
  });
```

**第二章 → 第三章过渡**：在 `ch2.ts` 的最后一个 campScene（如 act=4）中设置 `actionEvent: 'enter_chapter3'`。

---

## 六、VN 引擎使用模式详解

### 6.1 单次线性剧情（章节首次进入，第一章模式）

```typescript
runStoryIntro();  // 无参数
```

`finishStoryIntro` 默认行为：应用武当入门属性，设 `act = chapter.finalAct`，进入营地。

### 6.2 多段独立剧情（第二章模式）

每段剧情通过 `runStoryIntro(startNodeId, onFinish)` 触发，`onFinish` 负责推进 `act` 和授予技能：

```typescript
import('../StoryScreen').then(m => {
  m.runStoryIntro('ch2_wendao_0', () => {
    const fresh = getPlayer();
    const skills = fresh.skills.includes('wudang_changquan' as SkillId)
      ? fresh.skills
      : [...fresh.skills, 'wudang_changquan' as SkillId];
    const updated = { ...fresh, act: 1, skills };
    setPlayer(updated);
    saveGame(updated);
    enterCamp();
  });
});
```

### 6.3 战斗节点后继续剧情

在 `storyNodes` 中定义 `battle` 类型节点，`StoryScreen.ts` 内部自动处理战斗结果：

```typescript
boss_fight: {
  type: 'battle',
  enemyId: 'one_eye_leopard',
  nextOnWin: 'after_victory',
  nextOnLose: 'after_defeat',    // 省略时同 nextOnWin
}
```

### 6.4 路线分支保存

在 `onFinish` 回调中将选择结果写入 `PlayerState`：

```typescript
const updated = { ...fresh, chapter2Route: 'hotblood' as const, act: 4 };
```

---

## 七、关卡（等级门控）系统

营地剧情事件通过 `p.level` 检查等级门控。level 从 0 开始：0=凡人，1=炼气一层，2=炼气二层……

| 境界描述 | 等级要求 | 检查代码 |
|---------|---------|---------|
| 凡人 | lv = 0 | — |
| 炼气一层 | lv ≥ 1 | `p.level < 1` |
| 炼气二层 | lv ≥ 2 | `p.level < 2` |
| 炼气六层 | lv ≥ 6 | `p.level < 6` |
| 炼气八层 | lv ≥ 8 | `p.level < 8` |
| 筑基二层 | lv ≥ 12 | `p.level < 12` |

境界名称在 `src/state/LevelSystem.ts` 的 `REALM_NAMES` 数组中定义（10层制），渲染时通过 `REALM_NAMES[p.level]` 获取。

---

## 八、常见修改场景

### 修改营地场景文案或按钮文字

直接修改对应章节文件的 `campScenes`，例如 `src/data/chapters/ch1.ts`：
```typescript
3: {
  desc: '新的描述文字',
  actionLabel: '新按钮',
  // ...其他字段保持不变
}
```

### 给现有 NPC 添加新对话

在 `src/data/npcs.ts` 中找到对应 NPC，在 `dialogs` 里添加新节点，并在已有节点的 `choices` 中链接过去：
```typescript
second_meet: {
  text: '第二次见面的对话',
  choices: [{ text: '告别', next: null }],
},
```
然后在某个已有节点中加：`{ text: '问另一件事', next: 'second_meet' }`。

### 添加新物品

1. 在 `types.ts` 的 `ItemId` 联合类型中加新 ID
2. 在 `src/data/items.ts` 的 `ITEMS` 中添加物品数据
3. 如需出现在初始背包，修改 `DEFAULT_INVENTORY`

### 添加新法宝

1. 在 `types.ts` 的 `FabaoId` 联合类型中加新 ID
2. 在 `src/data/fabao.ts` 中按境界分组添加 `FabaoData`
3. 通过剧情/战斗掉落/商店接入获取逻辑（`ownedFabao.push(newId)`）

### 修改战斗伤害公式

核心公式在 `src/systems/BattleEngine.ts`：
```
伤害 = max(1, atk × powerMul - def × defPen) × [0.9, 1.1] × (暴击 ? 1.5 : 1)
```

### 添加新状态效果

1. 在 `types.ts` 的 `StatusType` 联合类型中加新类型
2. 在 `src/systems/StatusEffects.ts` 中实现效果逻辑
3. 在技能的 `effect` 字段或敌人行动的 `effect` 字段中使用

### 添加新人物关系到 RelationPanel

在 `src/screens/camp/RelationPanel.ts` 的 `getRelationData()` 函数中添加新角色条目，设置 `unlocked` 条件。

---

## 九、关键注意事项

1. **`story-choices-area` 在 `story-dialogue-mode` 内部**：在 HTML 结构中，选择枝区域是对话模式的子元素。`showStoryNode()` 首先隐藏所有 mode，因此 `_showChoices()` 必须主动调用 `dialogMode?.classList.remove('hidden')`，否则按钮不可见（全黑 bug 的根因）。

2. **键盘事件生命周期**：`runStoryIntro` 绑定 keydown 监听，`finishStoryIntro` / `skipStoryIntro` 时解绑。多次调用 `runStoryIntro` 时会先清除旧监听器，避免堆积。

3. **存档向下兼容**：每次在 `PlayerState` 加新字段，**必须同步更新 `schemas.ts`**，且新字段必须有合理的 `.default()` 值。否则旧存档加载时该字段为 `undefined`，可能导致运行时崩溃。

4. **TypeScript ID 验证**：所有游戏数据 ID（`EnemyId`、`SkillId` 等）都是 union type。引用不存在的 ID 会在 `tsc --noEmit` 时报编译错误，不会静默失败。每次新增 ID 时先加 `types.ts`，再加对应数据。

5. **动态 import 模式**：`StoryPanel.ts` 中触发剧情时使用 `import('../StoryScreen').then(m => ...)` 懒加载，避免循环依赖（`StoryScreen` 依赖 `Camp`，`Camp` 又依赖 `StoryPanel`）。

6. **NPC 对话起始节点**：`openDialog()` 首选 `'start'` 键；若不存在则取 `Object.keys(dialogs)[0]`。建议统一使用 `'first_meet'` 或 `'start'` 作为入口节点名。

7. **第三章新增 NPC 对话**（`src/data/npcs.ts`）：
   - `ji_wushuang_npc`（纪无双）：沉静如水，用剑对话
   - `su_yunxiu_npc`（苏云绣）：促狭爱开玩笑，使双剑
   - `fang_zhonghe_npc`（方仲和）：敦厚老实，使重剑
   - `meng_wenyuan`（孟文渊）：武痴，几乎不说话
   - `ye_ziyi`（叶紫衣）：武痴+话痨，爱讨论剑法细节

7. **`scriptedDefeat` 标志**：若敌人模板设置 `scriptedDefeat: true`，战斗引擎会在该敌人 HP 降到阈值时触发"脚本性失败"（敌人假装被打败），用于剧情需要的必胜或必败战斗。在团队战架构下，检查所有敌方单位中是否有 `scriptedDefeat`。

8. **战斗单位 ID 命名约定**：我方单位用 `player_main`、`ally_1`、`ally_2`、`ally_3`；敌方单位用 `enemy_0`、`enemy_1`...。`id` 用于状态效果索引和 UI 渲染 key。

9. **已删除 LearnScreen 和 DepartScreen**：技能不再通过独立学功界面获取，改为在主线剧情 VN 的 `onFinish` 回调中授予。`ScreenId` 中已移除 `'learn'` 和 `'depart'`。DepartScreen（选关界面）已废弃，营地顶部按钮改为「地图」弹窗。

10. **营地导航变更**：`江湖往事` Tab 改名为 `人物活动`；新增 `人物关系` 和 `法宝装备` Tab；移除 `拜师学功` 按钮。新手引导中"前往学功"改为"前往人物活动"。顶部「🗡️ 踏入江湖」按钮改为「🗺️ 地图」，点击弹出世界地图弹窗。地图导航栏精简为只显示当前地点名称，移除描述文字和附近城市按钮（移动统一通过地图弹窗进行）。

11. **NPC 动态系统（🆕 v2.0 优先级重构）**：`tickNpcBehaviors()` 在存档/休息/地点移动时调用，遍历 `PlayerState.npcDatabase` 中所有 NPC 执行 5 级优先级行为判定（疗伤→修炼60%→社交15%→门派任务15%→移动10%）。修炼受门派资源加成影响（±20%）。移动为阵营加权（正道→友好据点，混乱→邪道领地）。同地点 NPC 间触发 16 种自主互动（交谈/赠礼/切磋/挑衅等），自动形成好友/仇敌关系标签。NPC 天赋为 36 天赋池 × 5 层权重，含 0.5% 天骄。

12. **队友 AI 触发条件**：在 `_advanceTurn()` 中，当 `nextUnit.side === 'ally' && !nextUnit.isPlayer` 时触发 `_allyTurn()`。队友 AI 不依赖独立的 `AllyAI.ts` 文件，而是直接内嵌在 `BattleEngine.ts` 中。

13. **境界数值系统（🆕 0430）**：`realmConfig.ts` 提供统一的属性计算系统。`calculateBaseStats(level)` 根据等级自动计算基础属性（基准值 + 每层 10% 线性增长），`calculateFinalStats(level, talents)` 叠加天赋乘数。大境界跨越自动体现 100%~150% 断层增幅。**主角天赋 `dragon_vein` 已融入属性计算**（全属性+10%），但不在面板展示。大境界第十层满后经验条卡满，需完成剧情突破。

14. **世界地图系统（🆕 0430，0510 扩展至35地点）**：`worldMap.ts` 定义 ~35 个门派/大城市级别地点节点，基于宋朝真实地理。玩家通过营地顶部地图栏或地图弹窗在相邻地点间移动。`Camp.ts` 的 `POS` 坐标表已覆盖全部35地点（x/y 百分比坐标）。**点击地图节点移动后地图不自动关闭**，而是刷新重建，便于连续规划路线。NPC 位置存储在 `npcDatabase[].currentLocationId` 中，随回合自动变化。

15. **🆕 日常任务地点化（0501 重构）**：日常任务不再使用硬编码的 `DAILY_TASKS` 数组 + `wudangOnlyTasks` 检查，改为从 `WORLD_MAP[currentLocationId].actions` 动态读取。每个地点的 `actions` 字段定义该地点可执行的日常任务。玩家移动到不同地点时，日常任务列表自动切换。新增城市「城中静修」行动（+30经验）。`renderDailyTasks()` 标题显示 `📋 日常修行 · {地点名}`。

16. **NPC 状态弹窗（🆕 0430，0513 鬼谷八荒式横版重设计）**：`RelationPanel.ts` 中点击已解锁角色的立绘卡片，弹出 `npc-stats-overlay` 弹窗，横版布局（720px）：左侧 240px 立绘面板带境界颜色光晕（`--realm-glow` CSS 变量），天骄 NPC 金色光效增强；右侧属性面板显示六大区块：身份标识（所属帮派 🏛️ + 朝廷地位 🏯）、修为境界（名称+经验进度条）、六维属性网格（HP/MP/ATK/DEF/AGI/暴击）、天赋标签（按品质着色）、装备法宝（3件横排）、好感度条+性格描述。支持关闭按钮、点击背景、ESC 键关闭。`showNpcStatsOverlay()` 已导出，被 `Camp.ts` 的 sidebar 复用。

17. **法宝独立面板（🆕 0430）**：法宝装备从人物关系面板中独立出来，作为左侧导航的 `fabao` Tab（🔮 法宝装备）。`FabaoPanel.ts` 提供三槽装备界面，复用原有的法宝选择器逻辑。

18. **🆕 右侧 sidebar「附近的人」（0501 新增）**：`Camp.ts` 的 `renderSidebar()` 显示当前地点所有 NPC 的小立绘卡片（一行两个，56×84px）。NPC 数据来自 `npcDatabase`，按 `currentLocationId` 过滤。点击卡片弹出 NPC 状态弹窗。NPC 随回合移动到其他地点后 sidebar 实时更新。旧版剧情 NPC 大立绘 (`sidebar-story-npc`) 已废弃。

19. **🆕 突破机制重构（0507）**：修为等级与宗门身份完全解耦。剧情不再直接设置 `level`，而是：
    - 通过 `realmBreakUnlocked` 解锁大境界突破权限（如 `['zhuji']`）
    - 通过 `discipleRank` 独立设置宗门身份（`'outer'`/`'inner'`/`'true'`/`'elder'`）
    - 玩家在属性面板手动点击「⚡ 突破境界」按钮，调用 `breakThroughRealm()` 完成突破
    - 突破条件三要素：满层（`isRealmMaxLevel`）+ 经验满 + 剧情已解锁（`canBreakThrough`）
    - `LevelSystem.ts` 新增：`MAJOR_REALMS`、`getMajorRealmId()`、`canBreakThrough()`、`breakThroughRealm()`
    - `AttrPanel.ts` 新增：满层时显示「⚡ 突破境界」按钮，显示宗门身份
    - `StoryPanel.ts` 变更：`enter_chapter3`/`ch3_breakthrough` 不再设 level，改为设 `realmBreakUnlocked`+`discipleRank`；`ch2_xiasha` 设 `discipleRank: 'inner'`；`ch3_zhenchuan` 设 `discipleRank: 'true'`
    - `Camp.ts` 变更：`enterCamp()` 旧存档兼容初始化 `realmBreakUnlocked` 和 `discipleRank`
    - `schemas.ts` 新增：`realmBreakUnlocked: z.array(z.string()).default([])`、`discipleRank: z.string().default('outer')`
    - 为沙盒模式预留：未来可通过宗门任务 + 突破丹替代剧情解锁

20. **🆕 0509 沙盒地基论**：**沙盒模式是整个游戏的底层框架（地基），剧情模式是叠加在地基上的"作弊层"**。这不是两个平行模式，而是同一套系统的两种使用方式：沙盒路径是真实成长（贡献+试炼），剧情节点相当于作弊指令直接改数值。所有开发应以沙盒为基础进行，剧情在此基础上扩展。

21. **🆕 宗门习武 UI（0510 新增）**：玩家在本门派据点（宗门地图节点）可见"📖 习武学功"日常行动。点击后弹出 `SkillLearnOverlay`，按6境界展示本派技能，消耗贡献值学习。技能表数据由 `sectSkillTables.ts` 统一管理（武当/少林/日月教/峨眉/丐帮/全真/昆仑/唐门已实装，其余待填充）。`SECT_SKILL_TABLES` 是宗门 ID → 技能等级表的映射，`NpcBehavior.ts` 和 `SkillLearnOverlay.ts` 共用此表。

22. **🆕 任务地图战斗联动（0510 新增）**：接取 combat/escort 类任务后，前往对应地点，日常行动区会出现"⚔️ 进行中任务"卡片（`.mission-fight-card` CSS 类，橙色描边）。点击"执行战斗"按钮直接触发战斗，胜利后自动推进任务进度。`MissionDef` 接口新增 `enemyId?: string` 字段，6个 combat 任务均已设置对应敌人 ID。

23. **🆕 单敌自动选中（0510 新增）**：战斗中若场上只有1个存活敌人，点击普通攻击或攻击/控制技能时自动选中该敌人并立即触发攻击，无需额外点击。多敌情况仍需手动点击选目标。实现位于 `BattleScreen.ts` 的 `basicBtn` 和装备技能按钮 click handler 中。

24. **魔教（demon）宗门习武（已实装）**：魔教已拥有独立技能树（12技：`demon_claw` ~ `demon_purgatory`），`SECT_SKILL_TABLES` 已含 `demon` 键。叛军（rebels）/朝廷（imperial_court）/逍遥派（xiaoyao）亦已实装完整技能表。21 势力全技能树覆盖完成。

25. **🆕 NPC 详情弹窗横版重设计（0513）**：`RelationPanel.ts` 的 `showNpcStatsOverlay()` 和 `style.css` 的 `.npc-stats-overlay-inner` 从竖版（380px）改为鬼谷八荒式横版布局（720px、flex row）。左侧 240px 固定宽度立绘面板（`.npc-stats-left`），右侧属性面板（`.npc-stats-right`）包含六大区块。境界光晕通过 CSS `--realm-glow` 变量传递（8 境界→8 颜色），天骄 NPC 新增金色增强光效（`.tianjiao` 类）。身份标签横向排列（`.npc-stats-identity-tag.sect` 金色 + `.court` 绿色）。天赋标签按品质分色（`.legendary`/`.superior`/`.common`/`.inferior`/`.cursed`）。响应式断点 600px 回退竖版。

26. **🆕 P9 势力全量激活（0518）**：`ALL_FACTIONS` 扩展至 21 势力（含 riyue/tiezhang/wudu/xuedao/haisha/imperial_court/rebels）。`FactionSystem.ts` 的 `tickFactionDiplomacy()` 遍历全部 21 势力；`WorldState.ts` 的 `getFactionRankings()` 按层级+最高修为排序展示 21 势力；`NPCGenerator.ts` 的 `SECT_HUBS` 全部 21 势力有据点。`SECT_TIER` 记录 22 条（含 none）。`sects.ts` 的 `SECTS` 对象含全部 22 个键，每个势力有 `alignment`/`culture` 属性。

27. **🆕 世界事件玩家介入 Direction C（0518）**：`WorldEvent` 接口新增 `interactable?: boolean`/`acceptLabel?: string` 字段，5 种事件（武林大会/匪患侵扰/疫病蔓延/魔教渗透/古墓出土）标记为 `interactable: true`。`WorldStateData` 新增 `pendingWorldEvent?: { eventId, turn }` 字段（`schemas.ts` 同步）。`tickWorldState()` 对可介入事件不立即生效，改为写入 `pendingWorldEvent` 并返回 `{ isPending: true }`；已有 pending 事件时跳过新触发。`resolveWorldEvent(accept)` 消费 pending 事件并按 accept 决定是否给予奖励。`getPendingWorldEventDef()` 供 UI 查询完整事件定义。`WorldPanel.ts` 渲染顶部急讯横幅（`.wp-pending-event`），含「参与」/「置之不理」按钮；`StoryPanel.ts` 在 `isPending` 时提示玩家前往 WorldPanel 查看。

28. **🆕 NPC 行为可见性 Direction I（0518）**：`NpcBehavior.ts` 新增 `npcActivityLabel(result)` 和 `writeActivityLog(n, entry)` 两个内部函数。每次 `tickNpcBehaviors()` 执行后将行为结果写入对应 NPC 的 `recentLog` 数组（最多 20 条，相同相邻条去重）。`Camp.ts` 的 `renderSidebar()` 读取 `npc.recentLog?.at(-1)` 并在 NPC 卡片底部展示（`.nearby-npc-activity` CSS 类，绿色斜体小字）。

29. **🆕 外交可视化+玩家外交 Direction D+E（0519）**：`WorldPanel.ts` 新增 SVG 关系图（21 势力节点按地理坐标排列，trust 颜色编码连线，玩家节点金色脉冲高亮）。点击节点弹出外交行动菜单（遣使修好/宣战/缔结同盟/求和），职级+信任+资源三重检查。`FactionSystem.ts` 新增 `playerDiplomaticAction()`（执外交行动+扣成本+更新关系）、`getAvailableDiplomacyActions()`（计算可用按钮列表）、`getAllRelationsSnapshot()`（对外提供全图关系快照）。`style.css` 新增 `.dg-*` 15个 CSS 类。

30. **🆕 势力议事引擎 v2 + 政务官阶 P10（0519）**：`FactionAI.ts` 从 v1（260行，单议案直接结算）重写为 v2（~540行，指令池架构）。核心流程：`factionCouncil()` 按 6 模板(攻城/经商/外交/发展/守备/侦察)加权生成 `FactionDirective` → 存入 `PlayerState.factionDirectives` → NPC 按属性匹配度认领 → 执行进度(NPC属性×指令亲和度) → 完成结算 → 贡献积累 → 晋升判定。`sandboxTypes.ts` 新增 `FactionOfficialRank`(6级官阶)/`FactionOfficial`/`FactionDirective`/`FactionDirectiveType`/`FactionRankConfig`/晋升配置等 12 个类型。晋升使用 `computeStatPercentile()` 计算 NPC 在势力内相对排名（如"agi 排前 50%"），不使用绝对值门褬。指令 3 月过期自动清理。

31. **🆕 全宗门交互式任务（0519）**：`worldMap.ts` 的 14 个宗门据点全部新增 `battleConfig`（战斗任务）和 `courtConfig`（交互式对话任务）。战斗任务调用 `launchTaskBattle()` → `calculateFinalStats()` 按玩家等级+难度平衡生成敌人。交互任务使用 D100 掷骰的 `showCourtTaskDialog()`，纳入了属性检定和成功/失败分支。

32. **🆕 廷议可及性修复（0519）**：`SectManagement.ts` 的 `SECT_BASES` 新增 `kaifeng_city: 'imperial_court'` 和 `yanjing_city: 'rebels'`。`Camp.ts` 的 `checkCouncilTrigger()` 改为先检查玩家所属宗门（不再要求必须在据点），在据点则直接开议事、不在则信使通知。

33. **🆕 师门身份面板 SectPanel（0519）**：新建 `src/screens/camp/SectPanel.ts`，提供江湖线职业生涯面板：势力四维（资源/稳定/繁荣/力量分）、贡献值进度条+晋升按钮（扣除贡献值提升 `discipleRank`）、完整进阶路线图（外门→内门→真传→长老→副掌门→掌门）。`CampTabId` 新增 `'sect'`，`index.html` 新增对应导航按钮。

34. **🆕 身份徽章（0519）**：`index.html` 地图栏新增 `map-court-rank-badge` 和 `map-sect-rank-badge` 两个 span。`Camp.ts` 的 `renderMapBar()` 实时渲染朝廷品阶（🏛️）和师门身份（🏯）徽章。点击徽章调用 `switchCampTab()` 跳转对应面板。`style.css` 新增 `.map-rank-badge` / `.court-rank-badge` / `.sect-rank-badge` 样式。

35. **🆕 存档压缩与优化（0520）**：引入 `lz-string` npm 包实现 Base64 压缩。背包仅存 `{id, count}`（重建自 `ITEMS` 字典）。NPC 战斗属性（maxHp/maxMp/atk/def/agi/crit）不再存储——读档时从 level+talents 调用 `calculateFinalStats()` 动态重算。存档格式升级至 v2（`{version:2, slots:{slot_1:"base64..."}}`），自动迁移 v1 旧存档。预估体积减少 ~70%。

36. **🆕 属性经验值系统 ActionSystem（0520）**：新建 `src/systems/ActionSystem.ts`。`PlayerState` 和 `NpcStats` 新增 `combatStatExp`（atk/def/agi/crit）和 `courtStatExp`（strategy/eloquence/charisma/scholarship）。公式：`statExpNeeded = (currentStat + 1) * 100`。任务完成时按 `statAffinity` 权重分配经验，经验满 → 属性 +1。成功率公式：`successRate = 50 + (stat - difficulty) * 5`（钳制 10-90%）。`FactionAI.ts` 的 `settleDirective()` 已接入 `grantNpcStatExp()`。

37. **🆕 NPC 世界响应层（0520）**：`NpcBehavior.ts` 新增 `applyWorldResponse(npcId)`。每 tick 随机 20% NPC 受世界状态影响：据点治安 >80 → NPC 安居+经验；治安 <25 → 被劫-气血；繁荣度 >80 → 见闻+经验；势力资源 >400 → 获赐法器；势力稳定 <30 → 心力交瘁。效果写入 `recentLog`。

38. **🆕 议事动态数据插值（0520）**：`CouncilScreen.ts` 新增 `interpolateWorldData(text)`，支持 `{{topSect}}` `{{playerSect}}` `{{sectResources}}` `{{sectStability}}` `{{playerContrib}}` 模板标记，自动替换为实时游戏数据。议事发言从静态模板变为动态世界快照。

39. **🆕 称号系统（0521）**：`src/data/titles.ts` 定义 ~15 个称号（剑术大师/钢筋铁骨/疾风快剑/博学鸿儒/龙骧将军/暗影行者/求道真人等），各有解锁条件（combat_win_30 / def_streak_10 / agi_above_40 / scholarship_above_30 / court_rank_3 / steal_success_5 / realm_huashen 等）和属性加成（atkMul/defMul/agiMul/hpMul/mpMul/critBonus/cultivationMul）。`TitleSystem.ts` 提供 `getActiveTitle()`/`hasTitle()`/`activateTitle()`/`deactivateTitle()`/`getTitleBonus()`。玩家可在 `AttrPanel.ts` 中从已解锁称号自由选择一个激活，激活后属性即时更新（金色加值显示）。`PlayerState` 新增 `activeTitle: string | null` + `unlockedTitles: string[]`。

40. **🆕 NPC 寿命与死亡系统（0521）**：`NpcStats` 新增 `age`/`maxAge`/`isAlive` 字段。寿命公式按境界分层：凡人 60-80 / 炼气 120-180 / 筑基 250-400 / 结丹 500-800 / 元婴 1000-1500 / 化神 2000-3000 / 渡劫+ 5000-8000。`initNpcDatabase()` 为手写 NPC 自动计算寿命。每 tick 年龄 +1/12 月，`age >= maxAge` → 寿终正寝。争斗死亡：恶意互动大等级差(≥10)败方 5% 死亡。攻城死亡：参战 NPC 2% 阵亡。人口上限 80，低于上限时自动生成 Lv.1~3 替补散修。季度纳新（每3月）中大型宗门招 1 弟子，5% 天骄率。NPC 主动互动玩家（好感高→赠礼/情报/同行，好感低→挑衅/谣言）。

41. **🆕 势力 AI 增强（0521）**：
    - **正邪交战概率翻倍**：`tryTriggerSiege()` 中攻守双方 alignment 不同（righteous vs chaotic）→ 攻城概率 ×2.0；chaotic 弱势方 ×1.5
    - **大势力攻城加成**：`calcTeamPower()` 接受可选 `factionId` 参数，控制城数 ≥3（×1.1）/≥6（×1.2），资源 ≥300（×1.05），稳定度 ≥70（×1.05），可叠加
    - **领土易主招降**：`tryRecruitLocalNpcs()` 按 NPC 性格（upright 抗拒/cunning 接受/power 主动投靠）+ 关系判定是否加入新势力
    - **招募指令**：`FactionDirectiveType` 新增 `'recruit'`，FactionAI 指令模板增加招募无宗门 NPC 的指令，NPC 到达目标后进行魅力检定
    - **掌门管理面板**：`SectLeaderPanel.ts` 提供资源调配（资源→稳定度/繁荣度）、招生纳贤（招募外门/精英/随机弟子）、外交决策（宣战/求和/结盟）三大功能

42. **🆕 NpcStats 缺省寿命处理**：`NPC_STATS_INIT` 类型为 `Omit<NpcStats, 'exp' | 'age' | 'maxAge' | 'isAlive'>`，手写 NPC 定义无需填写寿命字段——由 `initNpcDatabase()` 在初始化时根据 level 调用 `getMaxAgeForLevel()` 和 `getRandomInitialAge()` 自动计算。`NPCGenerator.ts` 的 `_generateNpc()` 同步产出寿命字段。`SectLeaderPanel.ts` 招募新 NPC 时也需赋值这三个字段。

43. **🆕 NPC 中性互动（v2.8）**：`tickNpcPlayerInteraction()` 原先只对极端好感（≥60 或 ≤-30）或特殊关系 NPC 触发互动。现在新增 `else` 分支处理中性好感 NPC（-29~59，无道侣/师徒关系）：4 种互动类型（寒暄/闲聊/搭话/小买卖），触发概率 25%（原 20%）。性格影响：`kind`/`gentle` NPC 寒暄好感+2，其余+1。详见 `NpcBehavior.ts:1190-1224`。

44. **🆕 NPC 交友可见性（v2.8）**：`RelationPanel.ts` 新增 `renderNpcSocialRelations()` 函数，遍历 `PlayerState.npcRelationship` 查找与当前 NPC 好感 ≥60（好友）或 ≤-60（仇敌）的其他 NPC，在 NPC 详情弹窗的"关系"区渲染彩色标签（蓝=好友，红=仇敌）。最多显示 4 好友 + 3 仇敌，超出显示"...等人"。`style.css` 新增 `.npc-social-*` 6 个 CSS 类。

45. **🆕 玩家游说登庸多因素说服（v2.8）**：`NPCManager.ts` 新增 `canPersuadeNpc()` / `executePersuadeNpc()`。说服系统考虑四个维度：(1) 势力实力比 → `(ratio-1.0)×25` 钳制 [-20, 30]；(2) 志向-文化契合 → 每匹配 culture tag +8，钳制 [-25, 25]；(3) 性格权重 → 6种性格各有 powerWeight/affinityWeight/alignmentWeight，加权计算 personalityCompat；(4) 好感度 → `(affection-30)÷3.5` 上限 +20。总分 ≥10 成功。`RelationPanel.ts` 的推荐入宗按钮升级为"游说加入XX"，tooltip 显示各因素详情。

---

## 十、待扩展模块 🆕 0510

> 以下是下一步开发的核心任务，按优先级排列。所有扩展都是**在现有代码基础上叠加**，不重写已有系统。

### 10.1 P6：宗门技能树扩展（✅ 已完成）

**当前状态**：21 个势力（19 宗门 + 叛军 + 朝廷）全部拥有独立技能树，总计 ~324 个专属技能。`SECT_SKILL_TABLES` 已包含全部21势力的完整映射。NPCGenerator 已导入全局技能表，所有势力 NPC 均可获得本门技能。

**已完成批次**：
1. **Batch 1**：少林（25技）+ 日月教（25技）—— 50技能 ✅
2. **Batch 2**：峨眉 + 丐帮 + 全真 + 昆仑 + 唐门（各16技）—— 80技能 ✅
3. **Batch 3**：华山 + 崆峒 + 青城 + 点苍 + 铁掌帮（各12技）—— 60技能 ✅
4. **Batch 4**：茅山 + 五毒 + 血刀 + 海沙（各8技）—— 32技能 ✅
5. **Batch 5**：叛军（12技）+ 朝廷（16技）+ 魔教（12技）+ 逍遥派（12技）—— 52技能 ✅

**涉及文件**：`src/data/skills.ts`、`src/data/types.ts`、`src/data/sectSkillTables.ts`、`src/systems/NPCGenerator.ts`、`src/data/npcStats.ts`

### 10.2 P7：地图扩展（✅ 已完成）

**当前状态（0510）**：`src/data/worldMap.ts` 已扩展至 ~35 个地点，`Camp.ts` 的 POS 坐标表覆盖全部35地点。所有宗门据点已添加 `sect_learn_skill` 行动。

**已完成内容**：

| 类别 | 数量 | 详情 |
|------|---------|------|
| 大城市新增 | 9 | 燕京、太原、金陵、武昌、重庆、明州、广州、凉州、福州 |
| 宗门据点新增 | 8 | 黑木崖（日月教）、终南山（全真）、昆仑山（昆仑）、唐家堡（唐门）、崆峒山、青城山、点苍山、华山 |
| 其他 | — | 地图点击不关闭（旅行后刷新）；地图节点图标按类型显示 |

**残余工作**：WorldPanel 势力排行适配 17 宗门（已可显示，待完善排序逻辑）。

> **⚠️ 旁门左道（茅山/五毒/血刀/海沙）**不设独立地图节点，通过世界事件和剧情触发访问。铁掌帮、华山、黑木崖已有据点。

### 10.3 P8：NPC 三角金字塔 + 天赋池 + 天骄系统（✅ 已完成）

**当前状态**：已实装。`NPCGenerator.ts` 按宗门层级三角金字塔生成 NPC，每人随机3天赋从36天赋池按5层权重抽取，0.5% NPC 标记为天骄（🌟金色名字）。NPC间友好度地基已建立。

**涉及文件**：

| 文件 | 改动说明 |
|------|---------|
| `src/data/talents.ts` | **新建**：36天赋定义 + 权重配置（5层：绝世3%/上等11%/中等45%/下等28%/诅咒11%） |
| `src/data/types.ts` | 新增 `TalentId`、`TalentTier`、`TalentData` 类型；`NpcStats` 新增 `talents: TalentId[]`、`isTianjiao: boolean` 字段 |
| `src/state/schemas.ts` | 同步 Zod Schema：npcDatabase 中每个 NPC 新增 `talents`、`isTianjiao` 字段 |
| `src/systems/NPCGenerator.ts` | **核心改造**：三角金字塔生成（按宗门 tier + 性别规则）；`generateSectNPCs(sectId, tier)` → 掌门+传功固定 + 其余随机；3天赋随机 + 天骄标记 |
| `src/systems/NpcBehavior.ts` | 天赋影响修行速度/战斗属性；天骄行为倾向特殊 |
| `src/data/realmConfig.ts` | `calculateFinalStats()` 支持传入 `talentIds[]` 数组，叠加天赋加成 |
| `src/screens/camp/RelationPanel.ts` | NPC 弹窗显示天赋列表 + 天骄🌟标记 |
| `src/screens/Camp.ts` | 侧边栏「附近的人」天骄金色高亮 |
| `src/style.css` | 新增 `.npc-tianjiao` 金色样式 |

### 10.4 开发总览：给新 AI 的指引

> **重要**：以下原则是给接手开发的新 AI 的强制性指引，确保开发方向一致。

1. **沙盒是地基，不是平行模式**。所有新系统都应在沙盒底层上构建。剧情代码可直接修改 PlayerState 字段（作弊），但核心循环必须通过沙盒机制自主推进。

2. **在现有代码上叠加，不要重写**。
   - `skills.ts` 扩展现有 SKILLS 字典，不要重命名已有 ID
   - `worldMap.ts` 在现有 14 节点基础上新增，不要删除已有地点
   - `NPCGenerator.ts` 保留现有固定 NPC 生成逻辑，扩展随机部分
   - 新增 Zod Schema 字段必须带 `.default()`，确保旧存档兼容

3. **不要修改主线剧情代码**。黑月教是剧情专属势力，不要将其替换或删除。日月教是新增的独立邪道宗門。

4. **TypeScript strict mode**：所有新增 ID 必须先在 `src/data/types.ts` 的联合类型中声明，再在其他文件中使用。`tsc --noEmit` 会验证所有引用。

5. **开发顺序建议**：P6 ✅ → P7 ✅ → P8 ✅ → v2.0修复 ✅ → P9 ✅ → Direction C ✅ → Direction I ✅ → Direction D+E ✅ → Direction B+P10 v3 ✅ → 朝廷晋升属性门 ✅ → 任务中途事件 ✅ → 指令进行UI ✅ → 统一据点属性 ✅ → G(势力力量分攻城集成) ✅ → H(大地图随机遭遇) ✅ → J(派随从代战) ✅ → K(技能校验) ✅ → 称号系统 ✅ → NPC寿命/死亡 ✅ → 势力AI增强 ✅ → 城池繁荣度 UI 可视化。详细待办清单见 [TODO_LIST.md](./TODO_LIST.md)。