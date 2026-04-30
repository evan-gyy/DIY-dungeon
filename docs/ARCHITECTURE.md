# DIY-Dungeon 项目架构文档

> 本文档面向开发者和 AI Agent，描述当前项目的完整架构、各模块职责，以及如何进行修改和新章节开发。
> 最后更新：2026-04-30（大境界硬门槛 + 主角天赋属性系统 + NPC面板修为进度 + 地图栏布局修复 + NPC天赋简化）

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
├── index.html                     HTML 骨架（8 个 screen div，含所有 id/class）
├── vite.config.ts
├── tsconfig.json                  strict: true
├── package.json
│
├── src/
│   ├── main.ts                    入口：DOMContentLoaded → init 全部模块
│   ├── style.css                  全局样式（CSS Variables + 动画 keyframes + 战斗/日常任务/人物关系样式）
│   │
│   ├── data/                      纯数据层（不依赖 DOM 或状态）
│   │   ├── types.ts               所有 TS 接口和 ID 联合类型（单一来源，含法宝系统类型）
│   │   ├── skills.ts              SKILLS: Record<SkillId, SkillData>（按门派/境界分层，炼气~渡劫六境）
│   │   ├── enemies.ts             ENEMIES: Record<EnemyId, EnemyTemplate>
│   │   ├── npcs.ts                NPC_DIALOGS: Record<NpcId, NpcDialogData>
│   │   ├── npcStats.ts            NPC 数值卡数据库（13 个 NPC 初始属性 + 天赋系统）
│   │   ├── items.ts               ITEMS + DEFAULT_INVENTORY
│   │   ├── fabao.ts               法宝系统：FABAO: Record<FabaoId, FabaoData>（6境×3类×3件=54件）
│   │   ├── realmConfig.ts         境界基础数值配置（🆕 0430：基准值 + 大境界飞跃公式）
│   │   ├── worldMap.ts            世界地图节点配置（🆕 0430：门派/大城市级别地点）
│   │   ├── sects.ts               SECTS: Record<SectId, SectData>
│   │   ├── story.ts               WUDANG_TIERS（关卡配置，遗留文件）
│   │   └── chapters/
│   │       ├── types.ts           ChapterData / CampScene 接口
│   │       ├── ch1.ts             第一章剧情节点 + 营地场景
│   │       ├── ch2.ts             第二章剧情节点 + 营地场景
│   │       ├── ch3.ts             第三章剧情节点 + 营地场景（✅ 已接入）
│   │       └── index.ts           CHAPTERS 注册表 + getChapter(n)（已注册 CH3）
│   │
│   ├── state/                     状态层（依赖 data，不依赖 DOM）
│   │   ├── GameState.ts           PlayerState singleton：getPlayer / setPlayer
│   │   ├── SaveSystem.ts          saveGame / loadSave / loadAllSlots（Zod 验证）
│   │   ├── LevelSystem.ts         getExpForLevel / checkLevelUp / REALM_NAMES（10层制）
│   │   └── schemas.ts             PlayerStateSchema（Zod，含所有字段的 .default()）
│   │
│   ├── systems/                   游戏逻辑（依赖 data + state，不依赖 DOM）
│   │   ├── BattleEngine.ts        initBattle / playerUseSkill / basicAttack（支持4v4团队战 + 队友AI）
│   │   ├── StatusEffects.ts       applyStatus / tickStatus / getStatusValue
│   │   ├── EnemyAI.ts             enemyTurn / weightedRandom / predictAction
│   │   ├── NpcBehavior.ts         NPC 行为引擎（🆕 0430：购买法器/学习技能/修炼/移动 四种行为统一回合）
│   │   └── Inventory.ts           addItem / removeItem / useItem
│   │
│   ├── screens/                   UI 层（依赖全部下层模块）
│   │   ├── ScreenManager.ts       showScreen / getCurrentScreen
│   │   ├── MainMenu.ts            主菜单渲染
│   │   ├── SaveSelect.ts          存档槽选择
│   │   ├── CharCreate.ts          角色创建（选立绘 + 输入姓名）
│   │   ├── Camp.ts                营地主容器（Tab 切换 + 侧边栏 + 地图弹窗 + 地点移动）
│   │   ├── camp/
│   │   │   ├── AttrPanel.ts       属性面板（修炼点分配）
│   │   │   ├── BagPanel.ts        背包面板（24 格，使用道具）
│   │   │   ├── SkillPanel.ts      技能装配面板
│   │   │   ├── StoryPanel.ts      营地剧情面板（人物活动 Tab，含日常任务地点限制）
│   │   │   ├── FabaoPanel.ts      法宝装备面板（🆕 0430：独立 Tab，三槽装备+选择器）
│   │   │   └── RelationPanel.ts   人物关系面板（可折叠分类 + 好感度 + NPC 状态弹窗）
│   │   ├── DialogScreen.ts        NPC 对话树
│   │   ├── BattleScreen.ts        战斗 UI（多单位卡片 + 目标选择 + 技能栏 + 结算）
│   │   ├── StoryScreen.ts         VN 引擎（打字机 / 对话 / CG / 选择枝）
│   │   └── tutorial.ts            新手引导（mentor 气泡）
│   │
│   ├── audio/
│   │   └── AudioManager.ts        initAudio / switchMusic / toggleAudio
│   │
│   ├── fx/
│   │   └── Particles.ts           canvas 粒子背景动效
│   │
│   └── ui/
│       ├── toast.ts               showToast(msg, duration?)
│       └── events.ts              mitt bus 实例 + GameEvents 类型映射
│
├── public/
│   └── picture/                   所有图片（Female-main / scene / maincharacter）
│
└── docs/
    ├── ARCHITECTURE.md            本文档
    ├── GAME_DESIGN.md             游戏设计文档
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

// Camp Tab（新增 'relation' 和 'fabao'）
export type CampTabId = 'story' | 'attr' | 'bag' | 'skill' | 'fabao' | 'relation';
```

`PlayerState` 接口也在此定义，包含所有玩家字段（`chapter`、`act`、`chapter2Route`、`equippedFabao`、`ownedFabao` 等）。

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
- 必须通过对应剧情/试炼才能突破大境界（如炼气十层→筑基一层需完成C3突破剧情）
- 属性面板中满层经验条显示红色"已满（需突破契机）"提示

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

#### `NpcBehavior.ts` — NPC 动态行为引擎（🆕 0430 重构）

NPC 每回合（存档/休息/地点移动时）执行以下行为判定：

```typescript
export function initNpcDatabase(): Record<string, NpcStats>   // 初始化 NPC 数据库（含初始位置）
export function getNpcStats(id: string): NpcStats | null       // 获取单个 NPC 数值
export function tickNpcBehaviors(): NpcTickResult[]            // 执行所有 NPC 行为 tick
export function getNpcsAtLocation(locId: LocationId): NpcStats[] // 获取指定地点的 NPC
```

**回合行为模型**：
- **主要行为（三选一）**：购买法器 / 学习技能 / 修炼，三者随机选一项执行
- **移动（独立判定）**：在主要行为之后，额外独立判定是否移动（35%基础概率）
- 同一回合内NPC可能既修炼升级又移动到新地点

| 行为 | 触发条件 | 概率 | 结果分布 |
|------|----------|------|----------|
| 🗡️ 购买法器 | NPC 三件法器未全部装备 | 40% | 20%淘到宝(高一阶) / 30%同阶 / 50%来晚了 |
| 📖 学习技能 | NPC 未学满同级技能 | 30% | 50%成功领悟 / 50%领悟失败 |
| 🧘 修炼 | 剩余概率补齐至 100% | 可变 | 10%天人合一(+30exp) / 80%修行(+15exp) / 10%走火入魔(+5exp) |
| 🚶 移动 | 独立判定（前3项之后） | 35%基础 | 随机移动到相邻地点 |

**🆕 NPC天赋简化**：
- 仅柳清寒保留专属天赋 `sword_heart_frost`（剑心·寒：修行速度×1.6，身法+15%，攻击+10%）
- 主角保留 `dragon_vein`（九霄龙脉：修行速度×1.3，全属性+10%，暴击+5%），不在面板展示
- 其余所有NPC天赋统一为 `normal`（无特殊），属性由 `calculateFinalStats` 按普通人基准计算
- 天赋数据定义保留在 `npcStats.ts` 中供后续扩展

NPC 数据库包含 13 个角色的初始数值卡（`src/data/npcStats.ts`），每个 NPC 的 `currentLocationId` 字段记录其当前位置，存储在 `PlayerState.npcDatabase` 中，随存档持久化。

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

#### `worldMap.ts` — 世界地图节点配置（🆕 0430 新增）

只保留门派/大城市级别地点，内部区域（武当内门、传功崖等）通过对话和剧情触发，不在地图上展示。

```typescript
export type LocationId =
  | 'wudang_mountain' | 'xiangyang_city' | 'jiangling_city'
  | 'longyin_village' | 'han_river' | 'cangling_mountain'
  | 'blackmoon_ruins' | 'shaolin_temple' | 'emei_mountain' | 'beggar_hq';
```

共 10 个地点节点，基于宋朝真实地理（武当山→襄阳→江陵 三角格局）。每个节点有 `connections` 定义相邻可移动地点，`unlockChapter` 控制解锁条件。

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

#### `camp/StoryPanel.ts` — 营地事件派发

`triggerStoryEvent(eventId)` 处理所有营地按钮点击。营地场景由 `getChapter(p.chapter).campScenes[p.act]` 确定，按钮点击触发对应 `actionEvent`。

**可重复日常任务系统**：

面板上方常驻显示可重复日常任务，使用 `DailyTask` 接口定义：

```typescript
interface DailyTask {
  id: string; icon: string; name: string; desc: string;
  exp: number; gold: number;
  unlockChapter: number;  // 需要达到的章节
  unlockLevel: number;     // 需要达到的等级
}
```

已定义 6 个日常任务（`DAILY_TASKS`）：

| 任务 | 经验 | 铜钱 | 解锁条件 |
|------|------|------|----------|
| 🪓 砍柴 | +15 | +5 | 第二章（chapter≥2） |
| 💧 挑水 | +10 | +3 | 第二章（chapter≥2） |
| 🧹 打扫大殿 | +12 | +4 | 第二章（chapter≥2） |
| 📜 抄写道经 | +25 | +8 | 第二章（chapter≥2） |
| 🌙 后山修炼 | +30 | 0 | 第二章 + 炼气二层（level≥2） |
| ⚔️ 演武切磋 | +35 | 0 | 第二章 + 炼气六层（level≥6） |

`doDailyTask(task)` 执行任务：先检查地点（武当山专属任务仅限 `wudang_mountain` 进行）→ 增加经验/铜钱 → `checkLevelUp()` → 保存 → 15% 概率触发小概率事件（宋知远偷懒/顾小桑小道消息/张玄素对话/陈静虚指点）。`renderDailyTasks()` 渲染可用的和锁定的任务按钮，在 `renderStoryPanel()` 的最顶部渲染。

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
| `ch2_xiasha` | 等级门(lv≥8) → VN → 晋升属性 + act=4 |
| `enter_chapter3` | 设 chapter=3/act=0 → runStoryIntro('ch3_break_0', callback) → calculateFinalStats(11) 突破筑基 + act=1 |
| `ch3_breakthrough` | VN → calculateFinalStats(11) 突破筑基 + act=1 |
| `ch3_giftshu` | VN → 赠宋知远手册 + act=2 |
| `ch3_baishi` | VN → 拜陈静虚为师 + act=3 |
| `ch3_shoujian` | 等级门(lv≥13) → VN → 授【云开】+ act=4 |
| `ch3_xiashan` | 等级门(lv≥15) → VN → 下山行侠 + 黑月教令牌 + act=5 |
| `ch3_fengmang` | 等级门(lv≥17) → VN → 试剑会 vs 陆沉舟 + act=6 |
| `ch3_hunyue` | VN → 婚约剧情 + act=7 |
| `ch3_duokui` | VN → 试剑会次日连战 + 夺魁 + act=8 |
| `ch3_zhenchuan` | VN → 晋升真传弟子 + act=9 |
| `ch3_chuzheng` | VN → 出征黑月教讨伐 |

#### `camp/RelationPanel.ts` — 人物关系面板（新增）

可折叠分类的人物关系面板：
- **🌸 女主角**：柳清寒、沈霓裳、趙沁微、墨绐青
- **☯️ 武当派**：张玄素、陈静虚、陆沉舟、顾小桑、宋知远、纪无双、苏云绣、方仲和、孟文渊、叶紫衣、周伯安（外门管事）

每人显示小立绘（56×84px）+ 好感度数值，一行四列布局。分类标题带有光效动画（左侧光条、图标浮动、箭头弹跳），引导玩家点击展开。未解锁角色显示灰色立绘 + "未解锁"标注（如趙沁微在第三章前未解锁，沈霓裳在第二章 act≥4 后解锁，纪无双/苏云绣/方仲和在第三章 act≥8 后解锁，孟文渊/叶紫衣在第三章 act≥9 后解锁）。

**🆕 NPC 状态弹窗**：点击已解锁角色的立绘卡片，弹出该角色的详细状态面板，显示修为、修为进度（经验条）、天赋、HP/MP/ATK/DEF/AGI/暴击、装备法宝等信息。支持关闭按钮、点击背景、ESC 键三种关闭方式。修为进度条在满层时显示红色"已满（等待突破契机）"。

#### `camp/FabaoPanel.ts` — 法宝装备面板（🆕 0430 独立）

法宝从人物关系中独立出来，作为左侧导航的独立 Tab（🔮 法宝装备）。提供三槽（武器/衣服/饰品）装备界面，点击槽位弹出法宝选择器，支持装备/卸下操作。法宝数据来自 `src/data/fabao.ts`（54件，6境×3类×3件）。

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

**技能栏**：
- 动态渲染当前控制单位的可用技能
- 显示技能图标、名称、MP 消耗、冷却状态
- 服药按钮显示剩余数量
- 弈理心经预判显示第一个存活敌人的预测行动

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

11. **NPC 动态系统（🆕 0430 重构）**：`tickNpcBehaviors()` 在存档/休息/地点移动时调用，遍历 `PlayerState.npcDatabase` 中所有 NPC 执行行为判定。每回合从购买法器/学习技能/修炼中**三选一**作为主要行为，然后**独立判定**是否移动（35% 基础概率）。NPC 的修为提升会更新其 level 和属性，影响后续战斗中的队友强度。NPC 天赋已简化：仅柳清寒保留 `sword_heart_frost`，其余统一为 `normal`。

12. **队友 AI 触发条件**：在 `_advanceTurn()` 中，当 `nextUnit.side === 'ally' && !nextUnit.isPlayer` 时触发 `_allyTurn()`。队友 AI 不依赖独立的 `AllyAI.ts` 文件，而是直接内嵌在 `BattleEngine.ts` 中。

13. **境界数值系统（🆕 0430）**：`realmConfig.ts` 提供统一的属性计算系统。`calculateBaseStats(level)` 根据等级自动计算基础属性（基准值 + 每层 10% 线性增长），`calculateFinalStats(level, talents)` 叠加天赋乘数。大境界跨越自动体现 100%~150% 断层增幅。**主角天赋 `dragon_vein` 已融入属性计算**（全属性+10%），但不在面板展示。大境界第十层满后经验条卡满，需完成剧情突破。

14. **世界地图系统（🆕 0430）**：`worldMap.ts` 定义 10 个门派/大城市级别地点节点，基于宋朝真实地理。玩家通过营地顶部地图栏或地图弹窗在相邻地点间移动。NPC 位置存储在 `npcDatabase[].currentLocationId` 中，随回合自动变化。

15. **日常任务地点限制（🆕 0430）**：砍柴、挑水、打扫大殿、抄写道经、后山修炼、演武切磋 6 个日常任务仅限在武当山（`wudang_mountain`）进行。在其他地点点击任务会提示"此任务只能在武当山进行"。

16. **NPC 状态弹窗（🆕 0430）**：`RelationPanel.ts` 中点击已解锁角色的立绘卡片，弹出 `npc-stats-overlay` 弹窗，显示该 NPC 的完整数值（修为、修为进度条、天赋、HP/MP/ATK/DEF/AGI/暴击、装备法宝）。支持关闭按钮、点击背景、ESC 键关闭。修为进度条直观展示NPC的晋升情况。

17. **法宝独立面板（🆕 0430）**：法宝装备从人物关系面板中独立出来，作为左侧导航的 `fabao` Tab（🔮 法宝装备）。`FabaoPanel.ts` 提供三槽装备界面，复用原有的法宝选择器逻辑。