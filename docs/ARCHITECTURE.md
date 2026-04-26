# DIY-Dungeon 项目架构文档

> 本文档面向开发者和 AI Agent，描述当前项目的完整架构、各模块职责，以及如何进行修改和新章节开发。

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
├── index.html                     HTML 骨架（9 个 screen div，含所有 id/class）
├── vite.config.ts
├── tsconfig.json                  strict: true
├── package.json
│
├── src/
│   ├── main.ts                    入口：DOMContentLoaded → init 全部模块
│   ├── style.css                  全局样式（CSS Variables + 动画 keyframes）
│   │
│   ├── data/                      纯数据层（不依赖 DOM 或状态）
│   │   ├── types.ts               所有 TS 接口和 ID 联合类型（单一来源）
│   │   ├── skills.ts              SKILLS: Record<SkillId, SkillData>
│   │   ├── enemies.ts             ENEMIES: Record<EnemyId, EnemyTemplate>
│   │   ├── npcs.ts                NPC_DIALOGS: Record<NpcId, NpcDialogData>
│   │   ├── items.ts               ITEMS + DEFAULT_INVENTORY
│   │   ├── sects.ts               SECTS: Record<SectId, SectData>
│   │   ├── story.ts               WUDANG_TIERS（关卡配置，遗留文件）
│   │   └── chapters/
│   │       ├── types.ts           ChapterData / CampScene 接口
│   │       ├── ch1.ts             第一章剧情节点 + 营地场景
│   │       ├── ch2.ts             第二章剧情节点 + 营地场景
│   │       └── index.ts           CHAPTERS 注册表 + getChapter(n)
│   │
│   ├── state/                     状态层（依赖 data，不依赖 DOM）
│   │   ├── GameState.ts           PlayerState singleton：getPlayer / setPlayer
│   │   ├── SaveSystem.ts          saveGame / loadSave / loadAllSlots（Zod 验证）
│   │   ├── LevelSystem.ts         getExpForLevel / checkLevelUp / REALM_NAMES
│   │   └── schemas.ts             PlayerStateSchema（Zod，含所有字段的 .default()）
│   │
│   ├── systems/                   游戏逻辑（依赖 data + state，不依赖 DOM）
│   │   ├── BattleEngine.ts        initBattle / playerUseSkill / basicAttack
│   │   ├── StatusEffects.ts       applyStatus / tickStatus / getStatusValue
│   │   ├── EnemyAI.ts             enemyTurn / weightedRandom / predictAction
│   │   └── Inventory.ts           addItem / removeItem / useItem
│   │
│   ├── screens/                   UI 层（依赖全部下层模块）
│   │   ├── ScreenManager.ts       showScreen / getCurrentScreen
│   │   ├── MainMenu.ts            主菜单渲染
│   │   ├── SaveSelect.ts          存档槽选择
│   │   ├── CharCreate.ts          角色创建（选立绘 + 输入姓名）
│   │   ├── Camp.ts                营地主容器（Tab 切换 + 侧边栏）
│   │   ├── camp/
│   │   │   ├── AttrPanel.ts       属性面板（修炼点分配）
│   │   │   ├── BagPanel.ts        背包面板（24 格，使用道具）
│   │   │   ├── SkillPanel.ts      技能装配面板
│   │   │   └── StoryPanel.ts      营地剧情面板（故人相逢 Tab）
│   │   ├── DepartScreen.ts        出发/关卡选择
│   │   ├── DialogScreen.ts        NPC 对话树
│   │   ├── BattleScreen.ts        战斗 UI（HUD / 技能栏 / 结算）
│   │   ├── LearnScreen.ts         传功长老学技能
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
├── assets/
│   ├── picture/                   所有图片（maincharacter / NPC / Female-main / scene / random）
│   └── music/                     背景音乐（mainmusic2.mp3 / battlemusic1.mp3）
│
└── docs/
    ├── REFACTOR_PLAN.md           本文档
    ├── GAME_DESIGN.md             游戏设计文档
    └── chapters/
        ├── CHAPTER2_SCRIPT.md     第二章剧本原稿
        └── CHAPTER3_SCRIPT.md     第三章剧本原稿
```

---

## 三、模块职责详解

### 3.1 数据层 (`src/data/`)

#### `types.ts` — 类型单一来源

所有 ID 联合类型在此集中定义，**任何新增敌人/技能/NPC 都必须先在此处加 ID**：

```typescript
export type SkillId = 'yi_li_xin_jing' | 'mianzhang' | ...;
export type EnemyId = 'rogue_thug' | 'shadow_scout' | ...;
export type NpcId = 'mo_jiangqing' | 'liu_qinghan' | ...;
```

`PlayerState` 接口也在此定义，包含所有玩家字段（`chapter`、`act`、`chapter2Route` 等）。

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
export const CHAPTERS: Record<number, ChapterData> = { 1: CH1, 2: CH2 };
export function getChapter(n: number): ChapterData { ... }
```

`getChapter(n)` 如果章节未注册会抛出清晰错误信息。添加新章节只需：新建 `ch{N}.ts` + 在此处注册。

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

---

### 3.3 系统层 (`src/systems/`)

#### `BattleEngine.ts`

**不依赖任何 screen 模块**，完全通过 `bus.emit('battle:end', {...})` 与 UI 解耦。

```typescript
export function initBattle(enemyId: EnemyId): void    // 开始战斗（切到 battle screen）
```

内部通过 `bus.emit` 广播结果，`BattleScreen.ts` 和 `StoryScreen.ts` 各自监听处理。

---

### 3.4 Screen 层 (`src/screens/`)

#### `ScreenManager.ts`

```typescript
export function showScreen(id: ScreenId): void   // 切换激活的 screen div
export function getCurrentScreen(): ScreenId
```

HTML 中 9 个 screen div 同时存在，通过 CSS `.active` class 控制可见性。

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

当前已有事件处理：

| eventId | 行为 |
|---------|------|
| `act1_chess` | openDialog('mo_jiangqing') |
| `act2_thunder` | 推进 act=2 |
| `act3_escape` | initBattle('shadow_scout') |
| `act4_snow` | openDialog('liu_qinghan') + 推进 act=4 |
| `enter_chapter2` | 设 chapter=2/act=0 → runStoryIntro('ch2_intro_0', callback) |
| `ch2_wendao` | 等级门(lv≥2) → VN → 授技能 + act=1 |
| `ch2_yeshou` | 等级门(lv≥3) → VN → 授技能 + act=2 |
| `ch2_shijian` | 等级门(lv≥7) → VN → act=3 |
| `ch2_xiasha` | 等级门(lv≥9) → VN → 晋升属性 + act=4 |
| `ch2_chapter_end` | showToast("第三章即将到来") |

#### `DialogScreen.ts` — NPC 对话树

```typescript
export function openDialog(npcId: NpcId): void
```

从 `NPC_DIALOGS` 读取对话树，起始节点首选 `'start'`，若不存在则取第一个键。对话树节点支持 `choices` 数组实现分支。

---

## 四、事件总线

`src/ui/events.ts` 导出 mitt bus 实例，类型化事件：

```typescript
export type GameEvents = {
  'battle:end': { result: BattleResult; expGain: number; goldGain: number; loot: ItemId[] };
  'story:battle-end': { result: BattleResult };
  'player:level-up': { oldLevel: number; newLevel: number };
};
```

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
    showToast('需要达到某某境界方可触发。');
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

营地剧情事件通过 `p.level` 检查等级门控：

| 境界描述 | 等级要求 | 检查代码 |
|---------|---------|---------|
| 炼气一层 | lv ≥ 2 | `p.level < 2` |
| 炼气二层 | lv ≥ 3 | `p.level < 3` |
| 炼气六层 | lv ≥ 7 | `p.level < 7` |
| 炼气八层 | lv ≥ 9 | `p.level < 9` |

境界名称在 `src/state/LevelSystem.ts` 的 `REALM_NAMES` 数组中定义，渲染时通过 `REALM_NAMES[p.level]` 获取。

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

### 修改战斗伤害公式

核心公式在 `src/systems/BattleEngine.ts`：
```
伤害 = max(1, atk × powerMul - def × defPen) × [0.9, 1.1] × (暴击 ? 1.5 : 1)
```

### 添加新状态效果

1. 在 `types.ts` 的 `StatusType` 联合类型中加新类型
2. 在 `src/systems/StatusEffects.ts` 中实现效果逻辑
3. 在技能的 `effect` 字段或敌人行动的 `effect` 字段中使用

---

## 九、关键注意事项

1. **`story-choices-area` 在 `story-dialogue-mode` 内部**：在 HTML 结构中，选择枝区域是对话模式的子元素。`showStoryNode()` 首先隐藏所有 mode，因此 `_showChoices()` 必须主动调用 `dialogMode?.classList.remove('hidden')`，否则按钮不可见（全黑 bug 的根因）。

2. **键盘事件生命周期**：`runStoryIntro` 绑定 keydown 监听，`finishStoryIntro` / `skipStoryIntro` 时解绑。多次调用 `runStoryIntro` 时会先清除旧监听器，避免堆积。

3. **存档向下兼容**：每次在 `PlayerState` 加新字段，**必须同步更新 `schemas.ts`**，且新字段必须有合理的 `.default()` 值。否则旧存档加载时该字段为 `undefined`，可能导致运行时崩溃。

4. **TypeScript ID 验证**：所有游戏数据 ID（`EnemyId`、`SkillId` 等）都是 union type。引用不存在的 ID 会在 `tsc --noEmit` 时报编译错误，不会静默失败。每次新增 ID 时先加 `types.ts`，再加对应数据。

5. **动态 import 模式**：`StoryPanel.ts` 中触发剧情时使用 `import('../StoryScreen').then(m => ...)` 懒加载，避免循环依赖（`StoryScreen` 依赖 `Camp`，`Camp` 又依赖 `StoryPanel`）。

6. **NPC 对话起始节点**：`openDialog()` 首选 `'start'` 键；若不存在则取 `Object.keys(dialogs)[0]`。建议统一使用 `'first_meet'` 或 `'start'` 作为入口节点名。

7. **`scriptedDefeat` 标志**：若敌人模板设置 `scriptedDefeat: true`，战斗引擎会在该敌人 HP 降到阈值时触发"脚本性失败"（敌人假装被打败），用于剧情需要的必胜或必败战斗。
