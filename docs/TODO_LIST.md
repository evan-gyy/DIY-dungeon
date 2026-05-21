# DIY-Dungeon 开发待办清单

> 最后更新：2026-05-21 | 维护者：AI + 陆季喆
>
> **本文档是项目唯一的待办清单**，记录所有已完成、进行中和待开始的功能项。新增功能时先在此登记，完成后勾选。

---

## 一、沙盒地基 ✅ 全部完成

> 沙盒核心循环已完整：做日常 → 攒贡献 → 晋升 → 任务 → 更高阶任务。世界自动演化、朝廷双轨制、法器商店、门派经营、月度议事均已就位。

| 阶段 | 内容 | 状态 | 核心产出 |
|------|------|------|----------|
| P0-1 | 贡献值系统 | ✅ | `sectContribution` + `contributionLog` |
| P0-2 | 沙盒晋升（贡献+试炼） | ✅ | `PromotionSystem.ts` |
| P1-1 | 任务系统 + MissionPanel | ✅ | `MissionSystem.ts` |
| P1-2 | 势力倾向 + 外交 | ✅ | `FactionSystem.ts` |
| P2-1 | 大地图重构（14→35地点） | ✅ | `worldMap.ts` |
| P3 | 世界演算引擎 + WorldPanel | ✅ | `WorldState.ts` |
| P3-1 | NPC 系统增强 | ✅ | `NPCGenerator.ts` + `NPCInteraction.ts` |
| P3-2 | 朝廷系统 | ✅ | `CourtSystem.ts` + `CourtPanel.ts` |
| P3-3 | 法器商店 + 突破丹 | ✅ | `FabaoShop.ts` + `BreakthroughPill.ts` |
| v1.9 | 领土控制 + NPC关系标签 + 攻城 | ✅ | `FactionWarfare.ts` + `NpcRelationship.ts` |
| v2.0 | 门派经营 + 月度议事 + AI重构 | ✅ | `SectManagement.ts` + `CouncilScreen.ts` |
| P6 | 宗门技能树（21势力~324技能） | ✅ | `skills.ts` + `sectSkillTables.ts` |
| P7 | 地图扩展（35地点+拓扑连接） | ✅ | `worldMap.ts` + POS坐标表 |
| P8 | NPC天赋池 + 天骄 + 金字塔 | ✅ | `talents.ts` + `NPCGenerator.ts` |
| P9 | 势力全量激活（6→21势力） | ✅ | `FactionSystem.ts` + `WorldState.ts` |
| Direction A-K | 事件介入/外交可视化/AI v3/随从/繁荣度/力量分/遭遇/代战/技能校验 | ✅ | 全部完成 |
| v2.4 | 全宗门交互任务/师门面板/廷议修复/身份徽章 | ✅ | 14宗门battle+court双轨 |
| v2.5 | 存档压缩/statExp闭环/NPC世界响应/动态插值 | ✅ | lz-string + ActionSystem |
| v2.6 | 称号系统/NPC寿命与死亡/势力AI增强/掌门管理 | ✅ | TitleSystem + NpcBehavior + FactionWarfare + SectLeaderPanel |

---

## 二、待完成

### 高优先级 ⭐⭐⭐⭐

- [ ] **城池繁荣度 UI 可视化** — 地图上按 prosperity 颜色编码（绿=繁荣/红=凋敝），影响商品/NPC/税金（数据层已就位，缺 UI 渲染）
  - 涉及：`Camp.ts`（地图节点着色）、`style.css`（颜色梯度）
  - 预估：~60 行

- [ ] **偷师机制（P2-2）** — 玩家在敌对势力据点可偷学技能，成功率受 agi 和对方 garrison 影响
  - 涉及：`src/data/sandboxTypes.ts`（StealSkillConfig）、新建偷师 UI
  - 预估：~200 行

### 中优先级 ⭐⭐⭐

- [ ] **NPC 行为多样化** — 写日记/串门/探索等更多行为类型；玩家在 sidebar 能看到 NPC 当前正在做什么（已有 recentLog 基础）
  - 涉及：`NpcBehavior.ts`
  - 预估：~100 行

- [ ] **NPC 间高级关系** — 道侣/师徒/结义在 NPC 之间自然形成（目前仅主角↔NPC）
  - 涉及：`NpcRelationship.ts`
  - 预估：~150 行

- [ ] **悬赏系统（P5-2）** — 官府/门派发布通缉令，玩家可接取追捕
  - 涉及：`MissionSystem.ts`（新增 bounty 类型）、`WorldPanel.ts`（通缉榜 UI）
  - 预估：~180 行

### 低优先级 ⭐⭐

- [ ] **夺权事件（P4-5）** — 长老以上身份可以发起夺权，挑战现任掌门
  - 涉及：`SectManagement.ts`、`CouncilScreen.ts`
  - 预估：~200 行

- [ ] **掌门管理面板扩展** — 批量任命/撤职、设置门派政策、资源自动分配策略
  - 涉及：`SectLeaderPanel.ts`
  - 预估：~250 行

- [ ] **多回合 NPC 状态机** — NPC 执行持续多回合任务（如闭关3个月），而非每回合切换行为
  - 涉及：`NpcBehavior.ts`
  - 预估：~120 行

- [ ] **邮件/书信系统** — NPC 给玩家发信（邀请同行、求助、挑战书等）
  - 涉及：新建 UI 面板 + PlayerState 字段
  - 预估：~200 行

### 剧情相关

- [ ] 第四章代码接入
- [ ] 第五章代码接入
- [ ] 第三章 CG 图片生成 + NPC 专属立绘生成
- [ ] 法宝属性接入战斗引擎

---

## 三、给新 AI 的开发指引

> 如果另一个 AI 接手开发，请遵循以下原则。

### 核心理念

1. **沙盒 = 游戏本体（地基）**：沙盒不是"可选的平行模式"，而是整个游戏的底层框架。剧情只是叠加在地基上的"作弊层"。

2. **在现有代码上叠加，不要重写**：
   - `skills.ts` 扩展字典，不要重命名已有 ID
   - `worldMap.ts` 在现有节点上新增，不要删除已有地点
   - `NPCGenerator.ts` 保留固定 NPC 逻辑，扩展随机生成
   - 所有新增 Zod Schema 字段必须带 `.default()`

3. **不要修改主线剧情代码**（`src/data/chapters/ch1.ts`~`ch3.ts`、`src/data/npcs.ts`）。黑月教是剧情专属势力，不要替换或删除。日月教是独立新增的沙盒势力。

4. **TypeScript strict mode**：所有新 ID 必须先在 `src/data/types.ts` 联合类型中声明，再在其他文件中使用。

### 类型修改步骤

```
1. src/data/types.ts → 在对应联合类型中添加新 ID
2. src/data/*.ts → 添加实际数据定义
3. src/state/schemas.ts → 如果影响 PlayerState，同步更新 Zod Schema（带 .default()）
4. tsc --noEmit → 编译检查，确保零报错
5. npm run dev → 启动游戏，手动验证功能
```

### 常见改动速查

| 改动类型 | 必改文件 | 可能影响 |
|---------|---------|---------|
| 新增技能 | `types.ts`（SkillId）、`skills.ts`、`sectSkillTables.ts` | `NpcBehavior.ts` |
| 新增地点 | `types.ts`（LocationId）、`worldMap.ts`、`Camp.ts`（POS） | `NPCGenerator.ts` |
| 新增任务 | `sandboxTypes.ts`（MissionDef）、`MissionSystem.ts` | `StoryPanel.ts` |
| 新增 PlayerState 字段 | `types.ts`、`schemas.ts`（Zod .default()） | `SaveSystem.ts` |
| 新增屏幕/面板 | `types.ts`（ScreenId/CampTabId）、`index.html`、对应 `.ts` | `Camp.ts` |
| 新增敌人 | `types.ts`（EnemyId）、`enemies.ts` | `BattleEngine.ts` |
| 新增 NPC | `npcStats.ts`（NPC_STATS_INIT）、`npcs.ts`（对话树） | `NpcBehavior.ts` |

### 文档参考

| 文档 | 用途 |
|------|------|
| `GAME_DESIGN.md` | 完整游戏设计，含世界观/境界/战斗/沙盒/江湖线-朝廷线双轨/待开发清单 |
| `ARCHITECTURE.md` | 项目结构/模块职责/修改指南/关键注意事项 |
| `TODO_LIST.md` | 本文档，待办清单（聚焦未完成内容） |
| `REALM_SKILL_FABAO_SYSTEM.md` | 境界-技能-法宝体系详细设计 |
| `CG_GENERATION_PLAN.md` | CG 立绘生成提示词 |
| `docs/chapters/` | 各章剧本 |

### 当前开发状态

- **已完成**：沙盒核心循环 / v1.9 / v2.0 / v2.4 / v2.5 / v2.6 / P6-P9 / Direction A-K / 称号系统 / NPC寿命-死亡 / 势力AI增强 / 掌门管理面板
- **进行中**：无
- **下一步（按优先级）**：城池繁荣度 UI 可视化 → 偷师机制 → NPC 行为多样化 → NPC 间高级关系 → 悬赏系统

---

## 四、已完成方向速览

> 以下方向全部完成，仅保留摘要供参考。详细架构见 [ARCHITECTURE.md](./ARCHITECTURE.md)。

| 方向 | 内容 | 状态 |
|------|------|------|
| A 势力全量激活 | 21势力（19宗门+叛军+朝廷）全量接入 | ✅ |
| B 势力AI v3 | 三轨指令（军务+江湖+朝廷亲和）+ 随从系统 | ✅ |
| C 世界事件介入 | 5种可介入事件 + 挂起机制 + 急讯横幅 | ✅ |
| D 外交可视化 | SVG 21势力关系图 + 节点交互 | ✅ |
| E 玩家主动外交 | 遣使/宣战/同盟/求和四行动 | ✅ |
| F 城池繁荣度 | prosperity 字段 + 月度tick + 势力贡献公式 | ✅ |
| G 势力力量分统一 | computeSectPower 统一评分 + 攻城/外交权重接入 | ✅ |
| H 大地图随机遭遇 | 旅行20%触发4类事件（山贼/秘境/商人/传闻） | ✅ |
| I NPC行为可见性 | tick行为写入recentLog + sidebar展示 | ✅ |
| J 三波制攻城/随从代战 | 城门→街道→决战 + resolveDelegatedSiege | ✅ |
| K 技能平衡验证 | validateSkills 运行时检查~324技能 | ✅ |
| 称号系统 | ~15称号 + 解锁条件 + 属性倍率加成 | ✅ |
| NPC寿命与死亡 | age/maxAge/isAlive + 争斗/攻城死亡 + 人口平衡 | ✅ |
| 势力AI增强 | 正邪交战×2.0 + 大势力加成 + 招降 + recruit指令 | ✅ |
| 掌门管理面板 | 资源调配 + 招生纳贤 + 外交决策 | ✅ |

---

*本文档由 AI 与陆季喆共同维护，随项目演进持续更新。*
