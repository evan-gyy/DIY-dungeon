# DIY-Dungeon 完整重构方案

## Context

当前项目是一个约 4,770 行的纯 Vanilla HTML/CSS/JS 武侠 RPG 游戏。存在以下核心问题：
1. `main.js` 1,608 行单体文件，集中了状态、UI、流程、教程、存档所有逻辑
2. 全局 `G` 对象和 `Battle` 对象被所有模块随意 mutate，无封装
3. `battle.js` 与 `main.js` 深度耦合（互相调用对方的全局函数 + 读取对方全局变量）
4. 静态资源托管在 Cloudflare R2 公共 CDN URL（硬编码、无 CORS 限制、可被热链）
5. HTML 中大量 `onclick="function()"` 内联事件处理器

目标：用适合此类 Web 游戏的最现代工具栈重构，保留全部游戏内容和视觉风格。

---

## 推荐技术栈

| 工具 | 选择 | 理由 |
|------|------|------|
| 构建工具 | **Vite 6** (`npm create vite@latest -- --template vanilla-ts`) | 零配置 TS、HMR、自动 asset hash、Rollup 生产优化、Cloudflare Pages 原生支持 |
| 语言 | **TypeScript（strict mode）** | 游戏数据 Schema 编译期验证（技能/敌人/物品 ID 错误即时报错）|
| 状态 | **Module Singleton 模式**（无 Redux/Zustand/Pinia）| 游戏同时只有一个 Player，同步访问，不需要响应式框架 |
| 事件总线 | **mitt**（300 bytes）| 解耦 BattleEngine ↔ UI 的唯一跨模块通信需求 |
| 数据验证 | **Zod**（可选但推荐）| 存档向下兼容：老存档缺字段时 `.default()` 自动补全，不崩溃 |
| UI 框架 | **无框架（Vanilla DOM）** | 这是 DOM-based 文字游戏，不需要组件框架；保留现有模板字符串渲染方式 |
| CSS | **保持 style.css 不变** | CSS Variables 设计系统完整，金色/暗黑主题是视觉核心，不改 |
| 部署 | **Cloudflare Pages** | 已有 CF 账号、免费、全球 CDN、`vite build` 自动部署 |

**明确不采用**：React / Vue / Svelte（框架开销不必要）、Sass/Less（CSS Variables 已足够）、Immer（spread 语法替代即可）、Lodash、测试框架（重构期不加）。

---

## 新文件结构

```
DIY-dungeon/
├── index.html                   (清理 onclick，保留全部 ID/class/结构)
├── vite.config.ts
├── tsconfig.json               (strict: true, noUncheckedIndexedAccess: true)
├── package.json
├── src/
│   ├── main.ts                  (入口：DOMContentLoaded → init 全部 screen)
│   │
│   ├── data/
│   │   ├── types.ts             (所有 TS 接口：PlayerState, SkillData, EnemyTemplate...)
│   │   ├── skills.ts            (SKILLS: Record<SkillId, SkillData> — 含 30+ 技能)
│   │   ├── enemies.ts           (ENEMIES: Record<EnemyId, EnemyTemplate>)
│   │   ├── npcs.ts              (NPC_DIALOGS: Record<string, NpcDialog>)
│   │   ├── items.ts             (ITEMS + DEFAULT_INVENTORY)
│   │   ├── sects.ts             (SECTS: Record<SectId, SectData>)
│   │   └── story.ts             (STORY_INTRO nodes + WUDANG_TIERS)
│   │
│   ├── state/
│   │   ├── GameState.ts         (PlayerState singleton：getPlayer/setPlayer/clearPlayer)
│   │   ├── SaveSystem.ts        (saveGame/loadSave/loadAllSlots — Zod schema validate)
│   │   └── LevelSystem.ts       (getExpForLevel, checkLevelUp, REALM_NAMES)
│   │
│   ├── systems/
│   │   ├── BattleEngine.ts      (纯战斗逻辑：initBattle/playerUseSkill/basicAttack)
│   │   ├── StatusEffects.ts     (applyStatus/tickStatus/getStatusValue)
│   │   ├── EnemyAI.ts           (enemyTurn, weightedRandom, predictAction)
│   │   └── Inventory.ts         (addItem/removeItem/useItem 纯逻辑)
│   │
│   ├── screens/
│   │   ├── ScreenManager.ts     (showScreen, getCurrentScreen — 保留 CSS .active 机制)
│   │   ├── MainMenu.ts          (initMainMenu, renderMainMenu)
│   │   ├── SaveSelect.ts        (renderSaveSelect)
│   │   ├── CharCreate.ts        (renderCreateScreen, confirmCreate)
│   │   ├── Camp.ts              (initCampScreen, enterCamp, switchCampTab)
│   │   ├── camp/
│   │   │   ├── AttrPanel.ts     (renderAttrPanel — 属性/修炼点)
│   │   │   ├── BagPanel.ts      (renderBagPanel — 24格背包)
│   │   │   ├── SkillPanel.ts    (renderSkillPanel — 技能装配)
│   │   │   └── StoryPanel.ts    (renderStoryPanel — 营地剧情/NPC)
│   │   ├── DepartScreen.ts      (renderDepartPanel — 关卡选择)
│   │   ├── DialogScreen.ts      (openDialog/renderDialog — NPC 对话树)
│   │   ├── BattleScreen.ts      (BattleUI：renderHUD/renderSkillBar/showResult)
│   │   ├── LearnScreen.ts       (renderLearnPanel — 传功长老/学技能)
│   │   └── StoryScreen.ts       (VN 引擎：showStoryNode/typewriter)
│   │
│   ├── audio/
│   │   └── AudioManager.ts      (initAudio, switchMusic, toggleAudio)
│   │
│   ├── fx/
│   │   └── Particles.ts         (canvas 粒子背景动效)
│   │
│   ├── ui/
│   │   ├── toast.ts             (showToast)
│   │   ├── tutorial.ts          (MENTOR_STEPS, showMentorGuide)
│   │   └── events.ts            (mitt bus 实例 + 类型化 GameEvents map)
│   │
│   └── style.css                (直接移入，import './style.css' 在 main.ts)
│
└── assets/
    ├── picture/                  (所有图片移入 —— 见「资源安全」章节)
    │   ├── maincharacter/
    │   ├── NPC/
    │   ├── Female-main/
    │   ├── scene/
    │   └── random/
    └── music/
        ├── mainmusic2.mp3
        └── battlemusic1.mp3
```

---

## 关键架构决策

### 1. 状态管理：Module Singleton

```typescript
// src/state/GameState.ts
const _ctx: GameContext = { player: null, campTab: 'story', ... };

export function getPlayer(): PlayerState {
  if (!_ctx.player) throw new Error('No active player');
  return _ctx.player;
}
export function setPlayer(p: PlayerState): void { _ctx.player = p; }
```

- 调用方用 `import { getPlayer, setPlayer } from '../state/GameState'`，不再有全局 `G`
- 修改状态：`setPlayer({ ...getPlayer(), hp: newHp })` — spread 替代 in-place mutation
- TypeScript 强制 null check：用 `getPlayerOrNull()` 处理未登录场景

### 2. Battle ↔ UI 解耦：mitt 事件总线

```typescript
// src/ui/events.ts
export type GameEvents = {
  'battle:end': { result: 'win'|'lose'; expGain: number; goldGain: number; loot: ItemId[] };
  'story:battle-callback': { result: 'win'|'lose' };
  'player:level-up': { oldLevel: number; newLevel: number };
};
export const bus = mitt<GameEvents>();

// BattleEngine.ts (发射，不 import 任何 screen 文件)
bus.emit('battle:end', { result, expGain, goldGain, loot });

// BattleScreen.ts (监听，init 时绑定一次)
bus.on('battle:end', ({ result, ... }) => showBattleResult(result, ...));

// StoryScreen.ts (监听，处理剧情内战斗回调)
bus.on('battle:end', (e) => { if (activeStoryBattle) continueStory(e.result); });
```

**BattleEngine 不再 import 任何 screen 文件**，完全解耦。

### 3. Screen 渲染模式（保留模板字符串，消除 onclick）

每个 screen 模块导出三个函数：

```typescript
// initXxxScreen() — 在 main.ts DOMContentLoaded 时调用一次，绑定静态事件
// renderXxxScreen(container) — 每次显示时调用，重绘内容
// enterXxx() — 带上下文进入某 screen

// 事件绑定方式：data-* 属性 + 统一委托
// HTML: <button data-spend-attr="hp">+</button>
// JS:   container.querySelectorAll('[data-spend-attr]').forEach(btn => btn.addEventListener(...))
```

这消除了全部 `onclick="..."` 内联处理器，同时保留了现有模板字符串渲染逻辑（95% 不变）。

### 4. 数据类型化（data.ts → typed records）

```typescript
// src/data/types.ts — 所有 ID 为 union type
export type SkillId = 'yi_li_xin_jing' | 'taiji' | 'mianzhang' | ... ;  // 30+ 值
export type EnemyId = 'rogue_thug' | 'poison_woman' | ... ;
export type StatusType = 'poison' | 'stun' | 'weaken_def' | 'buff_atk' | ... ;

// src/data/skills.ts
export const SKILLS: Record<SkillId, SkillData> = {
  taiji: { id: 'taiji', type: 'control', hit: 1, powerMul: 0.4, ... }
  // 缺字段 → 编译错误；错误 ID → 编译错误
};
```

技能/敌人/物品引用错误在编译期报错，不再运行时静默失败。

### 5. Vite asset 导入（消除硬编码 URL）

```typescript
// src/data/story.ts
import sceneChessHouse from '../assets/picture/scene/古村棋舍.png';
// Vite 在 build 时输出 /assets/古村棋舍.abc123.png（自动 hash）

// src/audio/AudioManager.ts
import battleMusicSrc from '../assets/music/battlemusic1.mp3';
const bgMusic = new Audio(battleMusicSrc);  // 不再有硬编码 R2 URL
```

---

## 静态资源安全方案

### 当前问题
- `battle.js` 内硬编码 `https://pub-xxxx.r2.dev/music/battlemusic1.mp3`
- R2 Bucket 完全公开：任何人可直接访问、热链接，源 URL 暴露在 JS 源码中

### 推荐方案：资源入库 + Cloudflare Pages 统一托管

**估算资源体积**：
- ~50 张图片 × ~200KB = ~10MB
- 2 个 MP3 × ~6MB = ~12MB
- 合计约 **22MB** —— 完全在 GitHub 单仓库可接受范围内（< 100MB 限制）

**操作步骤**：
1. 从 `.gitignore` 移除 `*.png` 和 `*.mp3`
2. 把 `music/` 和 `picture/` 移入 `assets/` 目录
3. 更新所有引用为 Vite `import` 语句（Vite 自动 hash + CDN 路径）
4. 删除 R2 bucket（不再需要）
5. 部署到 Cloudflare Pages → 资源走 Cloudflare CDN，受同源策略保护

**若未来有超大资源（视频 / 高清 CG 包）**，通过 Cloudflare Pages Functions 代理 R2：
```javascript
// functions/assets/[[path]].js
export async function onRequest({ request, env }) {
  const referer = request.headers.get('Referer') ?? '';
  if (!referer.startsWith('https://your-domain.com'))
    return new Response('Forbidden', { status: 403 });
  const obj = await env.ASSETS_BUCKET.get(url.pathname.replace('/assets/', ''));
  return new Response(obj.body, { headers: { 'Content-Type': obj.httpMetadata.contentType } });
}
```

---

## 部署方案

**Cloudflare Pages**（推荐）：
```bash
# Build command: npm run build
# Output directory: dist
# 自动部署：push to main → CF Pages 触发构建
```
- 免费 tier：每月 500 次构建，无限请求，全球 CDN
- 已有 CF 账号（R2 bucket），零新平台依赖
- 游戏 URL：`diy-dungeon.pages.dev`（或自定义域名）

---

## 迁移策略：大爆炸重写（Big-Bang Rewrite）

选择全量重写而非渐进迁移，原因：
- 所有模块共享全局 `G` 和 `Battle`，无法独立迁移单个模块
- HTML 中 `onclick` 调用全局函数，渐进迁移期间会产生新旧函数同名冲突
- 总代码量约 5k 行，3 天可完成

**Day 1（纯数据和状态层，无 DOM）**：
1. `npm create vite@latest diy-dungeon -- --template vanilla-ts`
2. 编写 `src/data/types.ts` — 从 `data.js` 提取所有 ID union types
3. 移植 `data.js` → `src/data/skills.ts` + `enemies.ts` + `npcs.ts` + `items.ts` + `sects.ts` + `story.ts`
4. 编写 `src/state/GameState.ts` + `SaveSystem.ts` + `LevelSystem.ts`
5. 运行 `tsc --noEmit` 验证零类型错误

**Day 2（游戏逻辑层）**：
1. 移植 `battle.js` → `BattleEngine.ts` + `StatusEffects.ts` + `EnemyAI.ts`（纯函数，无 DOM）
2. 接入 `mitt` 事件总线，替换所有跨模块回调
3. 移植 `AudioManager.ts`、`Particles.ts`、`ScreenManager.ts`
4. 移植全部 screen 渲染函数（Camp 各 Panel、Battle UI、Story VN 引擎、Dialog 系统）

**Day 3（集成和部署）**：
1. 编写 `src/main.ts` 入口（`DOMContentLoaded` → `init*` 全部 screen）
2. 清理 `index.html`（移除所有 `onclick`，保留结构）
3. 将 `style.css` 移入 `src/`，在 `main.ts` 中 `import './style.css'`
4. 将图片/音频移入 `assets/`，更新所有 import
5. 端到端测试全部 9 个 Screen 的核心流程
6. `vite build` + 部署到 Cloudflare Pages

---

## 需保留不变的内容

- `css/style.css` — 金色/暗黑配色、CSS 变量、全部动画 keyframes（仅移动到 `src/style.css`）
- `index.html` — 9 个 screen 的 HTML 结构、所有 `id` 和 `class`（仅移除 `onclick`）
- 战斗伤害公式：`max(1, atk×powerMul - def×defPen) × [0.9,1.1] × (crit?1.5:1)`
- `STORY_INTRO` 所有中文剧情节点（内容不变，仅加类型）
- 粒子动效、打字机效果、音乐切换逻辑

---

## 验证清单

- [ ] `npm run build` 零 TypeScript 编译错误
- [ ] 主菜单 → 新游戏 → 创角 → 开场剧情 → 营地完整流程
- [ ] 营地四个 Tab（属性/背包/技能/故人相逢）正常渲染
- [ ] 踏入江湖 → 选关卡 → 战斗 → 胜/负结算 → 返回营地
- [ ] 技能学习（4 大长老 + 经验消耗）
- [ ] NPC 对话树（6 个 NPC，含分支）
- [ ] 存档 3 槽位存/读/删
- [ ] 音乐切换（主界面 ↔ 战斗）
- [ ] 武当山剧情副本（3 关）
- [ ] Cloudflare Pages 部署后资源路径均为相对路径，无 R2 URL

---

## 关键文件引用

- `d:\Work\DIY-dungeon\js\battle.js` — 最难解耦的模块，从此处 `endBattle` 函数入手
- `d:\Work\DIY-dungeon\js\main.js` — 单体文件，VN 引擎（~L1118-1346）、Tutorial（~L1406-1528）、Camp 面板（~L414-900）是三大分割点
- `d:\Work\DIY-dungeon\js\data.js` — 数据 schema 来源，用于生成 `types.ts` 的全部 union types
- `d:\Work\DIY-dungeon\index.html` — 保留结构，移除所有 `onclick`
- `d:\Work\DIY-dungeon\css\style.css` — 整体移入 `src/`，不修改内容
