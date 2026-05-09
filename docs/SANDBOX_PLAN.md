# 沙盒模式设计文档 · SANDBOX_PLAN

> 版本：v1.0 | 日期：2026-05-09 | 设计参考：太阁立志传 × 三国志13 × 雪中悍刀行
> 基于 GAME_DESIGN.md / ARCHITECTURE.md 现有系统设计

---

## 〇、设计总纲

### 核心理念

> **"江湖不只有刀光剑影，庙堂之上亦有风云变幻"**

沙盒模式是一个**自由驱动的回合制个人养成模式**，玩家以"前朝太子"的隐秘身份在武林和朝廷两条线上同步发展，最终走向不同的结局。剧情模式提供线性叙事体验，沙盒模式则提供**自由探索 + 系统养成**的开放体验。

### 与剧情模式的关系

| 维度 | 剧情模式 | 沙盒模式 |
|------|---------|---------|
| 叙事方式 | 线性章节推进（VN 节点链） | 事件驱动（条件触发 + 自由探索） |
| 时间流 | 按剧情节拍推进 | **回合制日历**（每行动消耗时辰） |
| NPC | 剧本角色，出场/退场由剧情控制 | **自治智能体**，拥有独立日程、目标、好感度 |
| 玩家自由度 | 低（选择枝有限） | 高（每回合自由选择行动） |
| 进入条件 | 新游戏默认 | 完成第一章（入武当）后可在主菜单选择 |
| 数据共享 | 共享 `PlayerState` 基础字段 | 新增 `SandboxState` 扩展字段 |

**关键设计：沙盒模式的系统一旦完成，可反哺剧情模式。** 例如沙盒中完善的商店系统、NPC 日程系统可以直接在剧情模式的营地中复用。

---

## 一、回合制时间系统

### 1.1 基本单位

借鉴太阁立志传的"行动力"机制，但使用武侠世界的"时辰"概念：

| 单位 | 对应 | 说明 |
|------|------|------|
| **时辰** | 1 行动点 | 最小行动消耗单位 |
| **一日** | **6 时辰** | 卯时(6h)→巳时(10h)→午时(12h)→申时(16h)→酉时(18h)→亥时(22h) |
| **一月** | 30 日 | 每月初一/十五有特殊事件 |
| **一季** | 3 月 | 春/夏/秋/冬，影响可用行动和随机事件 |
| **一年** | 12 月 | 年末可触发"年度总结"评价事件 |

```
SandboxTimeState {
  year: number;          // 当前年份（初始：大宋嘉定元年 = 1208）
  month: number;         // 1-12
  day: number;           // 1-30
  hourSlot: number;      // 0-5（6 个时辰槽位）
  season: 'spring' | 'summer' | 'autumn' | 'winter';
}
```

### 1.2 时间流转规则

- 每次**玩家行动**消耗 1~3 时辰（取决于行动类型）
- 时辰耗尽（6/6）后自动进入"夜间"→ 强制休息 → 日期+1 → 时辰重置
- 休息时触发：NPC 行为 tick、随机事件判定、好感度衰减/增长
- **NPC 也按同节奏行动**：每日 NPC 同样执行 6 个时辰的行为（由 AI 自动调度）

### 1.3 与现有系统的对接

现有 `tickNpcBehaviors()` 每次 save/rest/travel 调用一次。沙盒模式改为：
- **每日结束时**调用 `tickNpcBehaviors()` 一次（等价于现在的"一回合"）
- 但内部拆分为 6 个时辰的行为调度（详见 NPC 日程系统）

---

## 二、双路线养成体系

### 2.1 设计哲学

借鉴三国志13 的"文武双全"设计，以及太阁立志传的"多身份发展"：

> 主角作为前朝太子，同时拥有**武林身份**（武当弟子）和**朝廷身份**（隐秘皇嗣）。
> 两条线齐头并进，互相影响，最终汇聚。

| 路线 | 武林路线 | 朝廷路线 |
|------|---------|---------|
| 身份 | 武当弟子 → 内门 → 真传 → 长老 → 掌门 | 隐秘太子 → 义士 → 名士 → 重臣 → 摄政/帝王 |
| 核心资源 | 修为、武学、法宝 | 声望、人脉、权势 |
| 成长方式 | 修炼、比武、历练 | 外交、情报、政务 |
| NPC 关系 | 门派同门、江湖侠客 | 官员、富商、谋士 |
| 活动地点 | 门派、野外、江湖据点 | 城市、府衙、朝廷 |

### 2.2 武林路线详细设计

#### 武林声望系统

```
WulinReputation {
  // 门派声望
  sectStanding: Record<SectId, number>;   // 各门派好感度 (-100 ~ 100)
  sectRank: SectRankId;                   // 门派内部等级
  
  // 江湖声望
  jianghuFame: number;                    // 江湖总名望 (0 ~ 10000)
  jianghuTitle: JianghuTitleId;           // 江湖称号
  alignment: number;                      // 正邪值 (-100 正 ~ 100 邪)
  
  // 武学成就
  martialInsight: number;                 // 武学感悟值
  realizedMartialArts: string[];          // 已领悟的武学奥义
}
```

**门派等级体系**（以武当为例）：

| 等级 | 名称 | 解锁条件 | 权限 |
|------|------|---------|------|
| 1 | 外门弟子 | 入门即有 | 基础日常、练功场 |
| 2 | 内门弟子 | 修为 11+，门派贡献 200+ | 内门典籍、高级练功 |
| 3 | 真传弟子 | 修为 21+，门派贡献 800+，师父推荐 | 真传武学、门派决策参与 |
| 4 | 堂主/护法 | 修为 31+，门派贡献 2000+ | 管理门派事务、收徒 |
| 5 | 长老 | 修为 41+，门派贡献 5000+ | 参与掌门选举 |
| 6 | 掌门 | 特殊事件链 | 全权管理门派 |

**江湖声望等级**：

| 名望值 | 称号 | 效果 |
|--------|------|------|
| 0~200 | 无名小卒 | — |
| 201~600 | 初露锋芒 | NPC 主动搭话概率+10% |
| 601~1500 | 江湖新秀 | 可参加地区武林大会 |
| 1501~3000 | 武林高手 | 可创建/加入武林联盟 |
| 3001~6000 | 一方豪杰 | 受邀参加江湖盟主大会 |
| 6001~10000 | 武林至尊 | 可竞选武林盟主 |

#### 武林路线可用行动

| 行动 | 时辰 | 地点要求 | 效果 | 解锁 |
|------|------|---------|------|------|
| 🧘 修炼 | 2 | 任意 | 获得修为经验 | 默认 |
| ⚔️ 切磋 | 1 | 有NPC的地点 | 修为经验 + 好感度变化 | 默认 |
| 📖 研读武学 | 2 | 门派/有藏书地点 | 武学感悟值 + 可能领悟技能 | 内门弟子+ |
| 🏔️ 闭关修炼 | 6(整日) | 门派/洞府 | 大量修为经验，可能顿悟突破 | 结丹+ |
| 🗡️ 行侠仗义 | 2 | 城市/野外 | 江湖声望+，随机战斗 | 默认 |
| 🏆 武林大会 | 特殊 | 特定城市 | 江湖声望大幅变化 | 季度事件 |
| 🤝 拜访门派 | 3 | 其他门派 | 跨门派好感度 + 可能学到新功法 | 筑基+ |
| 🎓 收徒/指导 | 2 | 门派 | 门派贡献 + NPC 好感 | 堂主+ |
| 📜 门派任务 | 2~3 | 门派分配 | 门派贡献 + 经验 + 金钱 | 内门+ |

### 2.3 朝廷路线详细设计

#### 朝廷声望系统

```
CourtReputation {
  // 朝廷身份
  courtRank: CourtRankId;                 // 官职等级
  imperialFavor: number;                  // 皇恩值 (0 ~ 100)
  
  // 政治资源
  influence: number;                      // 权势值
  intelligence: number;                   // 情报值
  treasury: number;                       // 私库（政治资金）
  
  // 人脉网络
  courtConnections: Record<string, number>; // 朝中人脉好感度
  spyNetwork: string[];                   // 情报网覆盖的地点
  
  // 身世揭示进度
  identityRevealProgress: number;         // 0-100，身份揭示进度
  loyalFollowers: string[];               // 效忠者（知晓真实身份的NPC）
}
```

**朝廷等级体系**：

| 等级 | 名称 | 获取方式 | 权限 |
|------|------|---------|------|
| 0 | 布衣 | 初始 | 无法进入府衙 |
| 1 | 义士 | 为民除害积累声望 | 可拜访官员，简单政务协助 |
| 2 | 名士 | 解决地方事件 + 官员推荐 | 可接受府衙委托，获得官府支持 |
| 3 | 县丞/参军 | 通过科举或军功 | 管理一县政务，调动少量兵力 |
| 4 | 知州/转运使 | 累积政绩 + 重大功勋 | 管理一州，经济/军事决策 |
| 5 | 重臣/枢密 | 极高声望 + 朝堂博弈 | 参与国策，调动大军 |
| 6 | 摄政/帝王 | 最终身世揭示 + 关键抉择 | 游戏终极路线分支 |

#### 朝廷路线可用行动

| 行动 | 时辰 | 地点要求 | 效果 | 解锁 |
|------|------|---------|------|------|
| 📋 处理政务 | 2 | 城市（有官职） | 权势+，金钱+，民心变化 | 县丞+ |
| 🕵️ 搜集情报 | 2 | 任意城市 | 情报值+，解锁隐藏信息 | 义士+ |
| 🤝 拜访官员 | 1 | 城市 | 人脉好感+ | 义士+ |
| 📜 上书言事 | 2 | 城市（有官职） | 皇恩/权势变化，可能触发事件 | 名士+ |
| 💰 经营产业 | 2 | 城市 | 金钱收入 | 义士+ |
| 🏰 巡视辖地 | 3 | 管辖区域 | 民心+，可能发现事件 | 县丞+ |
| ⚖️ 审理案件 | 2 | 城市（有官职） | 权势+/-，民心+/-（取决于判决） | 县丞+ |
| 🗡️ 剿匪平乱 | 3 | 野外/城市 | 军功+，声望+，战斗 | 义士+ |
| 🎭 朝堂博弈 | 特殊 | 特定事件 | 权势大幅变化 | 重臣+ |

### 2.4 双线联动机制

**武林影响朝廷**：
- 武林声望高 → 朝廷更容易招揽你（被动获得官职推荐）
- 击败邪教/匪寇 → 军功积累，朝廷等级自然提升
- 门派掌门身份 → 朝廷对你的势力忌惮或拉拢

**朝廷影响武林**：
- 官府支持 → 门派资源增加（可获得朝廷赐予的珍稀法宝/药材）
- 权势过高 → 江湖人士疏远（武林好感度下降）
- 情报网 → 提前获知江湖动向（武林大会、门派冲突等）

**冲突与抉择**：
- 朝廷命你剿灭某门派 → 武林声望暴跌 vs 朝廷等级提升
- 江湖事件需要你出面 → 放弃政务 vs 放弃江湖义气
- 身份暴露风险：朝廷等级越高，身份暴露概率越大

---

## 三、NPC 系统重构

### 3.1 设计哲学

> 借鉴太阁立志传的 NPC 日程系统 + 三国志13 的羁绊系统。
> NPC 不再只是背景角色，而是拥有**独立意志、日程、目标**的"生活者"。

### 3.2 NPC 数据结构扩展

在现有 `NpcStats` 基础上扩展：

```
NpcProfile {
  // ── 继承现有字段 ──
  id, name, talent, sect, level, exp, hp, maxHp, mp, maxMp,
  atk, def, agi, crit, skills, equippedFabao, ownedFabao, currentLocationId
  
  // ── 新增：个性系统 ──
  personality: {
    disposition: 'righteous' | 'neutral' | 'villainous';  // 正邪倾向
    temperament: 'hot' | 'calm' | 'cunning' | 'naive';    // 性格气质
    ambition: number;      // 野心值 0-100
    loyalty: number;       // 忠诚度 0-100（对当前效力对象）
    greed: number;         // 贪婪度 0-100
  };
  
  // ── 新增：社交关系 ──
  relationships: Record<string, {
    affection: number;     // 好感度 -100 ~ 100
    trust: number;         // 信任度 0 ~ 100
    type: RelationType;    // 关系类型
  }>;
  
  // ── 新增：日程系统 ──
  schedule: {
    dailyRoutine: DailyAction[];  // 默认日程（6 时辰）
    currentGoal: NpcGoal | null;  // 当前目标
    goalProgress: number;         // 目标进度 0-100
  };
  
  // ── 新增：身份与职位 ──
  role: {
    sectRank: number;              // 门派等级
    courtRank: number;             // 朝廷官职（0=无）
    occupation: OccupationId;      // 职业身份
    affiliations: string[];        // 所属势力/组织
  };
  
  // ── 新增：经济 ──
  wealth: number;                  // 个人财富
  
  // ── 新增：AI 行为权重 ──
  behaviorWeights: {
    cultivate: number;    // 修炼倾向
    socialize: number;    // 社交倾向
    explore: number;      // 探索倾向
    ambition: number;     // 野心行动倾向（如谋求升职）
    trade: number;        // 经商倾向
  };
}
```

### 3.3 关系类型

```
RelationType =
  | 'master_disciple'     // 师徒
  | 'fellow_disciple'     // 同门
  | 'friend'              // 挚友
  | 'acquaintance'        // 相识
  | 'rival'               // 宿敌
  | 'lover'               // 恋人
  | 'spouse'              // 配偶
  | 'superior_subordinate' // 上下级
  | 'ally'                // 盟友
  | 'hostile'             // 敌对
```

### 3.4 NPC 日程系统（核心创新）

借鉴太阁立志传，每个 NPC 每日 6 个时辰各有行动计划：

```
DailyAction {
  hourSlot: number;          // 0-5 对应六个时辰
  action: NpcActionType;     // 行动类型
  location: LocationId;      // 行动地点
  interactable: boolean;     // 玩家是否可在此时与NPC互动
}

NpcActionType =
  | 'cultivate'              // 修炼
  | 'patrol'                 // 巡逻/办公
  | 'rest'                   // 休息
  | 'trade'                  // 买卖
  | 'teach'                  // 教学
  | 'study'                  // 研读
  | 'socialize'              // 社交（拜访其他NPC）
  | 'travel'                 // 移动中
  | 'mission'                // 执行任务
  | 'leisure'                // 闲逛
```

**日程生成规则**（按 NPC 身份自动生成）：

| 身份 | 典型日程 |
|------|---------|
| 掌门（张玄素） | 修炼→巡视→处理门务→修炼→会客→修炼 |
| 传功长老（陈静虚） | 修炼→教学→教学→修炼→研读→巡逻 |
| 内门弟子（陆沉舟） | 修炼→修炼→切磋→修炼→闲逛→社交 |
| 外门弟子（宋知远） | 日常→日常→修炼→闲逛→社交→休息 |
| 城市官员 | 办公→办公→巡视→办公→会客→休息 |
| 商人 | 买卖→买卖→闲逛→买卖→社交→休息 |

**重要设计**：NPC 的日程受当前目标（`currentGoal`）驱动。例如：
- 陆沉舟目标="试剑会夺魁" → 日程变为：切磋→修炼→修炼→修炼→切磋→修炼
- 宋知远目标="下山历练" → 日程变为：准备→移动→探索→探索→移动→休息

### 3.5 NPC 目标系统

```
NpcGoal {
  id: string;
  type: 'cultivation' | 'social' | 'exploration' | 'political' | 'personal';
  description: string;
  conditions: GoalCondition[];        // 完成条件
  priority: number;                   // 优先级 1-10
  deadline?: { month: number; day: number };  // 截止日期（可选）
}
```

**示例 NPC 目标**：

| NPC | 目标 | 类型 | 条件 |
|-----|------|------|------|
| 柳清寒 | 突破结丹瓶颈 | cultivation | level 达到 30 |
| 陆沉舟 | 证明自己不输纪无双 | social | 切磋胜 纪无双 3 次 |
| 宋知远 | 炼气十层 | cultivation | level 达到 10 |
| 陈静虚 | 查明黑月教动向 | exploration | 获得 3 条黑月教情报 |
| 张玄素 | 维护武当声望 | political | 武当声望不低于 80 |

### 3.6 NPC 互动方式

玩家与 NPC 的互动不再仅限于固定对话树，而是根据**时间、地点、关系、身份**动态生成：

#### 互动菜单（到达有 NPC 的地点后可触发）

| 互动类型 | 条件 | 效果 | 灵感来源 |
|---------|------|------|---------|
| 💬 **对话** | 好感度 ≥ -20 | 获取信息/增减好感 | 太阁·会话 |
| ⚔️ **切磋** | NPC 为武者 | 修为经验 + 好感度变化 | 三国志13·一骑讨 |
| 🎁 **赠礼** | 拥有合适物品 | 好感度+（取决于物品匹配度） | 太阁·赠物 |
| 📖 **请教武学** | 好感度 ≥ 40，NPC 修为 > 玩家 | 可能学到技能碎片 | 太阁·修行 |
| 🤝 **结交/结拜** | 好感度 ≥ 70，互动次数 ≥ 10 | 建立"挚友"关系 | 三国志13·绊 |
| 🗡️ **邀请同行** | 好感度 ≥ 60，NPC 无关键任务 | NPC 加入队伍（临时/永久） | 太阁·同道 |
| 📜 **委托任务** | 门派等级 ≥ 3 或 官职 ≥ 3 | 派遣 NPC 执行任务 | 三国志13·委任 |
| 🏛️ **讨论门派/朝政** | NPC 参与相关事务 | 影响门派/朝廷决策 | 三国志13·评定 |
| 💕 **表白/约会** | 好感度 ≥ 80，特定女主 | 推进感情线 | — |

#### 对话系统改造

现有对话树（`NPC_DIALOGS`）改造为**上下文感知对话**：

```
ContextualDialogEntry {
  id: string;
  conditions: {                     // 触发条件
    minAffection?: number;
    maxAffection?: number;
    playerMinLevel?: number;
    timeOfDay?: number[];           // 哪些时辰可触发
    location?: LocationId[];        // 在哪些地点可触发
    requiredFlags?: string[];       // 需要的状态标记
    npcGoal?: string;               // NPC 当前目标匹配
    season?: string;
  };
  priority: number;                 // 相同条件下的优先级
  dialog: DialogNode;               // 复用现有 DialogNode 结构
  effects?: {                       // 对话结束后效果
    affection?: number;
    trust?: number;
    flags?: string[];               // 设置状态标记
    items?: ItemId[];               // 获得/失去物品
    info?: string;                  // 获取情报
  };
  repeatable: boolean;              // 是否可重复触发
  cooldownDays?: number;            // 冷却天数
}
```

---

## 四、地点系统扩展

### 4.1 地点功能层级

现有 `WORLD_MAP` 只有 10 个大地点。沙盒模式在此基础上引入**子地点**概念：

```
SubLocation {
  id: string;
  parentLocation: LocationId;       // 所属大地点
  name: string;
  icon: string;
  description: string;
  type: 'training' | 'shop' | 'residence' | 'office' | 'wilderness' | 'special';
  availableActions: ActionId[];     // 可用行动
  npcsPresent?: string[];           // 常驻 NPC
  unlockCondition?: { chapter?: number; level?: number; quest?: string };
}
```

### 4.2 各地点子场景设计

#### 武当山（wudang_mountain）子地点

| 子地点 | 类型 | 功能 | 常驻 NPC |
|--------|------|------|---------|
| ⛩️ 山门 | special | 门派入口，迎客 | 周伯安 |
| 🏛️ 真武大殿 | training | 门派集会，大事件 | 张玄素（午时） |
| 🏔️ 传功崖 | training | 高级修炼、拜师学艺 | 陈静虚（教学时段） |
| ⚔️ 演武场 | training | 切磋、比武 | 内门弟子轮换 |
| 📚 藏经阁 | training | 研读武学典籍 | — |
| 🌲 后山老松 | training | 打坐修炼 | — |
| 🏠 弟子居所 | residence | 休息、NPC 社交 | 各弟子（夜间） |
| 🍵 知客堂 | shop | 门派内部交易 | NPC 轮换 |

#### 襄阳城（xiangyang_city）子地点

| 子地点 | 类型 | 功能 | 常驻 NPC |
|--------|------|------|---------|
| 🏛️ 府衙 | office | 处理政务、拜访官员 | 知府/官员 |
| 🏪 集市 | shop | 买卖物品、法宝 | 商人 |
| 🍜 酒楼/客栈 | special | 打听消息、江湖人相遇 | 随机 NPC |
| ⚔️ 比武台 | training | 公开比武、挑战 | 随机武者 |
| 🏥 医馆 | shop | 恢复、购买药品 | 药商 |
| 🔨 铁匠铺 | shop | 法宝锻造/强化 | 铁匠 |
| 📜 书院 | training | 研读、科举准备 | 文人 |
| 🏘️ 市井 | wilderness | 行侠仗义、随机事件 | — |

#### 江陵城（jiangling_city）子地点

| 子地点 | 类型 | 功能 | 常驻 NPC |
|--------|------|------|---------|
| 🏛️ 知州府 | office | 政务、外交 | 官员 |
| 🚢 码头 | shop | 贸易、远行 | 商人/旅客 |
| 🏯 兵营 | training | 军事训练 | 军官 |
| 🎭 勾栏瓦舍 | special | 收集情报、文艺切磋 | 各色人等 |

### 4.3 商店系统

```
ShopData {
  id: string;
  name: string;
  location: LocationId;
  subLocation: string;
  type: 'weapon' | 'armor' | 'medicine' | 'general' | 'fabao';
  inventory: ShopItem[];
  restockCycle: number;             // 补货周期（天）
  priceModifier: number;            // 价格系数（1.0 = 基准价）
  ownerNpcId?: string;              // 店主 NPC
}

ShopItem {
  itemId: ItemId | FabaoId;
  basePrice: number;
  stock: number;                    // 当前库存
  maxStock: number;
  restockAmount: number;
}
```

---

## 五、事件系统

### 5.1 事件分类

| 类型 | 触发方式 | 示例 |
|------|---------|------|
| **定时事件** | 到达特定日期 | 武林大会（每年秋季）、门派庆典 |
| **条件事件** | 满足特定条件 | 修为达到结丹→触发"突破试炼" |
| **随机事件** | 每日随机判定 | 路遇劫匪、偶遇高人 |
| **连锁事件** | 前置事件完成后 | 击败黑月教据点→朝廷注意到你 |
| **NPC 驱动事件** | NPC 目标/关系触发 | 柳清寒好感度达 80→"月下练剑"事件 |

### 5.2 事件数据结构

```
SandboxEvent {
  id: string;
  title: string;
  description: string;
  type: 'scheduled' | 'conditional' | 'random' | 'chain' | 'npc_driven';
  
  // 触发条件
  trigger: {
    date?: { month: number; day: number };     // 定时
    conditions?: EventCondition[];              // 条件
    randomChance?: number;                      // 随机概率（每日判定）
    prerequisiteEvents?: string[];              // 前置事件
    npcConditions?: { npcId: string; minAffection?: number; flag?: string };
  };
  
  // 事件内容（复用现有 VN 节点 或 自定义处理）
  content: {
    storyNodes?: Record<string, StoryNode>;     // VN 演出
    choices?: EventChoice[];                     // 玩家选择
    battle?: { enemyId: EnemyId; allies?: string[] };
  };
  
  // 结果
  outcomes: EventOutcome[];
  
  repeatable: boolean;
  cooldownDays?: number;
}
```

### 5.3 核心事件设计

#### 定期事件

| 事件 | 时间 | 内容 | 影响 |
|------|------|------|------|
| 🏆 武当试剑会 | 每年秋·九月 | 武当内部比武大会 | 门派排名、声望变化 |
| 🏆 武林大会 | 每两年·春·三月 | 各门派代表汇聚，比武论道 | 江湖声望、门派声望 |
| 🎊 门派庆典 | 每年·十一月 | 掌门训话、封赏 | 门派贡献奖励 |
| 📜 朝廷科举 | 每三年·春·三月 | 文试（有官职路线） | 朝廷等级提升 |
| 🌙 中秋夜话 | 八月十五 | 与好感度最高的 NPC 赏月对话 | 好感度+、特殊对话 |
| 🧧 新年 | 正月初一 | 年度总结 + NPC 拜年 | 全体好感度小幅回升 |

#### 条件事件示例

| 事件 | 条件 | 内容 |
|------|------|------|
| 身世浮现 | 朝廷声望 ≥ 名士 + 特定情报 | 发现前朝遗物→身份暴露风险 |
| 门派危机 | 武当声望 < 50 + 黑月教势力 > 60 | 黑月教偷袭→保卫武当战役 |
| 武学顿悟 | 武学感悟 ≥ 500 + 修为 ≥ 结丹 | 领悟独创武学→创建自创招式 |
| 情报泄露 | 朝廷等级 ≥ 3 + 身世进度 > 50 | 有人盯上你→派系角力事件链 |
| 师父考验 | 好感度(陈静虚) ≥ 70 + 修为 ≥ 20 | 陈静虚传授独门心法 |

---

## 六、经济系统

### 6.1 货币

| 货币 | 用途 | 来源 |
|------|------|------|
| 铜钱 | 日常消费、购买物品 | 日常任务、战斗、经商 |
| 银两 | 中高端消费、法宝交易 | 门派任务、朝廷俸禄、经商 |
| 门派贡献 | 门派内部兑换、晋升 | 门派任务、教学、比武 |

**换算**：100 铜钱 = 1 银两

### 6.2 经商系统（可选行动）

```
TradeRoute {
  from: LocationId;
  to: LocationId;
  goods: string;
  buyPrice: number;
  sellPrice: number;
  risk: number;              // 被劫概率
  travelDays: number;
}
```

不同城市有**价格差异**，玩家可以通过买卖货物赚取差价。但路上可能遇到劫匪（触发战斗）。

---

## 七、势力系统

### 7.1 势力定义

沙盒模式中，世界由多个势力组成，各势力有自己的领地、资源和目标：

| 势力 | 类型 | 领地 | 态度 |
|------|------|------|------|
| 武当派 | 正派门派 | 武当山 | 中立偏正 |
| 少林寺 | 正派门派 | 少林寺 | 正派 |
| 峨眉派 | 正派门派 | 峨眉山 | 正派 |
| 丐帮 | 正派帮会 | 丐帮总舵 | 正派 |
| 黑月教 | 邪教 | 黑月教遗址 + 暗处据点 | 邪恶 |
| 宋朝朝廷 | 政权 | 各城市 | 中立 |
| 地方豪强 | 地方势力 | 各地分布 | 中立/自利 |

### 7.2 势力动态

势力之间会发生**自动博弈**，形成动态的世界局势：

```
FactionState {
  id: string;
  name: string;
  territory: LocationId[];
  strength: number;          // 势力值
  treasury: number;          // 财力
  reputation: number;        // 声望
  relations: Record<string, number>;  // 与其他势力的关系值
  leader: string;            // 首领 NPC ID
  members: string[];         // 成员 NPC ID
  currentStrategy: 'expand' | 'defend' | 'develop' | 'diplomacy';
}
```

每月结算时势力自动行动：
- 扩张：向相邻领地施加影响
- 防守：加强己方领地
- 发展：提升势力值和财力
- 外交：改变与其他势力的关系

---

## 八、数据层连接关系

### 8.1 新增文件规划

```
src/data/
├── sandbox/
│   ├── sandboxTypes.ts         // 沙盒模式所有新增类型定义
│   ├── subLocations.ts         // 子地点数据
│   ├── shops.ts                // 商店数据
│   ├── sandboxEvents.ts        // 沙盒事件数据
│   ├── npcSchedules.ts         // NPC 日程模板
│   ├── npcGoals.ts             // NPC 目标模板
│   ├── contextDialogs.ts       // 上下文对话数据
│   ├── factions.ts             // 势力数据
│   ├── courtRanks.ts           // 朝廷等级数据
│   └── tradeGoods.ts           // 贸易物品数据

src/state/
├── SandboxState.ts             // 沙盒模式状态管理
└── schemas.ts                  // 更新 Zod Schema

src/systems/
├── SandboxTimeSystem.ts        // 时间系统
├── NpcScheduler.ts             // NPC 日程调度器（重构 NpcBehavior.ts）
├── EventEngine.ts              // 事件引擎
├── FactionEngine.ts            // 势力动态引擎
├── ReputationSystem.ts         // 声望系统
└── TradeSystem.ts              // 贸易系统

src/screens/
├── SandboxHub.ts               // 沙盒模式主界面（替代/扩展 Camp.ts）
├── sandbox/
│   ├── ActionPanel.ts          // 行动选择面板
│   ├── TimeBar.ts              // 时间状态栏
│   ├── NpcInteractPanel.ts     // NPC 互动面板
│   ├── ReputationPanel.ts      // 声望面板（武林+朝廷双栏）
│   ├── ShopScreen.ts           // 商店界面
│   ├── FactionPanel.ts         // 势力动态面板
│   └── EventLog.ts             // 事件日志
```

### 8.2 数据依赖关系图

```
┌─────────────────────────────────────────────────────────┐
│                    PlayerState (扩展)                     │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────┐   │
│  │ SandboxTime  │  │ WulinReputa- │  │ CourtReputa-  │   │
│  │ State        │  │ tion         │  │ tion          │   │
│  └──────┬───────┘  └──────┬───────┘  └───────┬───────┘   │
│         │                 │                   │           │
└─────────┼─────────────────┼───────────────────┼───────────┘
          │                 │                   │
    ┌─────▼─────┐     ┌────▼────┐        ┌─────▼─────┐
    │ TimeSystem │     │Reputa-  │        │ Faction-  │
    │ (每日结算)  │     │tionSys  │        │ Engine    │
    └─────┬─────┘     └────┬────┘        └─────┬─────┘
          │                │                   │
    ┌─────▼─────┐     ┌────▼─────┐       ┌────▼─────┐
    │NpcScheduler│────►│EventEngine│◄─────│ Faction- │
    │(NPC日程)   │     │ (事件系统) │       │ State    │
    └─────┬─────┘     └────┬─────┘       └──────────┘
          │                │
    ┌─────▼─────┐     ┌────▼──────┐
    │NpcProfile │     │ Context-  │
    │(NPC 数据)  │────►│ Dialogs   │
    └───────────┘     └───────────┘
          │
    ┌─────▼──────────────────────────┐
    │ 现有系统 (复用)                  │
    │ ├── BattleEngine.ts            │
    │ ├── LevelSystem.ts             │
    │ ├── realmConfig.ts             │
    │ ├── worldMap.ts (扩展子地点)     │
    │ ├── skills.ts / fabao.ts       │
    │ └── SaveSystem.ts (扩展 Schema) │
    └────────────────────────────────┘
```

### 8.3 与现有 PlayerState 的对接

```
// 新增到 PlayerState 接口
interface PlayerState {
  // ... 现有字段保持不变 ...
  
  // 沙盒模式标记
  gameMode: 'story' | 'sandbox';
  
  // 沙盒模式数据（仅 sandbox 模式下有值）
  sandboxData?: {
    time: SandboxTimeState;
    wulinReputation: WulinReputation;
    courtReputation: CourtReputation;
    eventLog: EventLogEntry[];
    completedEvents: string[];
    activeQuests: Quest[];
    factionStates: Record<string, FactionState>;
    visitedSubLocations: string[];
    tradeHistory: TradeRecord[];
    npcInteractionCooldowns: Record<string, number>;  // NPC互动冷却（天数）
  };
}
```

---

## 九、UI 设计概要

### 9.1 沙盒主界面布局

```
┌──────────────────────────────────────────────────────┐
│ 【顶部状态栏】                                         │
│ 角色名 ❤️HP ⚡MP 💰金钱 | 📅大宋嘉定元年·三月十五 午时 │
│ ⏰ [●●●○○○] 3/6 时辰已用 | 🗺️地图 💾存档 🌙休息        │
├──────────┬───────────────────────────────────────────┤
│ 【左侧】  │ 【主面板（根据选择切换）】                     │
│           │                                           │
│ 📊 身份   │  ┌─────────────────────────────────────┐  │
│ ⚔️ 行动   │  │ 当前面板内容                          │  │
│ 👥 人物   │  │                                      │  │
│ 📦 背包   │  │ （行动面板 / NPC互动 / 声望 / 商店    │  │
│ 🏛️ 势力   │  │   / 事件日志 等）                     │  │
│ 📜 事件   │  │                                      │  │
│ 🏆 声望   │  │                                      │  │
│           │  └─────────────────────────────────────┘  │
│           │                                           │
├──────────┼───────────────────────────────────────────┤
│ 【侧边栏】│ 📍当前地点：武当山·传功崖                     │
│ 附近的人  │ 🕐 当前时辰：午时（12:00）                    │
│ 柳清寒 ⚔️ │ 📌 NPC：陈静虚（教学中）、顾小桑（修炼中）     │
│ 陈静虚 📖 │                                            │
│ 宋知远 😴 │                                            │
└──────────┴───────────────────────────────────────────┘
```

### 9.2 行动面板

行动面板根据当前地点和玩家状态动态显示可用行动：

```
┌─────────────────────────────────────────┐
│  📍 武当山 · 演武场                       │
│                                          │
│  ═══ 可用行动（剩余 3 时辰） ═══          │
│                                          │
│  🧘 修炼（2时辰）     ⚔️ 切磋（1时辰）    │
│  📖 研读典籍（2时辰）  🗡️ 行侠仗义（2时辰）│
│  🤝 拜访NPC（1时辰）   📜 门派任务（2时辰） │
│                                          │
│  ═══ 武林 / 朝廷 特有行动 ═══            │
│  🏆 备战试剑会        📋 处理政务          │
│                                          │
│  [☀️ 结束今日]                            │
└─────────────────────────────────────────┘
```

### 9.3 声望双栏面板

```
┌──────────────────┬──────────────────┐
│ ⚔️ 武林声望       │ 🏛️ 朝廷声望      │
│                  │                  │
│ 称号：江湖新秀    │ 官职：义士        │
│ 名望：850/1500   │ 权势：120         │
│ ████████░░ 57%   │ ██████░░░░ 40%   │
│                  │                  │
│ 正邪：偏正(+30)   │ 皇恩：25/100     │
│                  │                  │
│ 【门派声望】       │ 【人脉网络】      │
│ 武当：85 ❤️       │ 襄阳知府：40     │
│ 少林：20          │ 江陵转运使：15    │
│ 峨眉：30          │                  │
│ 丐帮：45          │ 【身世进度】      │
│                  │ ██░░░░░░░░ 15%   │
└──────────────────┴──────────────────┘
```

---

## 十、开发优先级与阶段规划

### Phase 1：核心骨架（最高优先）

**目标**：搭建沙盒模式的最小可玩循环。

| 任务 | 涉及文件 | 说明 |
|------|---------|------|
| 沙盒类型定义 | `sandboxTypes.ts` | 所有新增类型、接口 |
| 时间系统 | `SandboxTimeSystem.ts` | 日历 + 时辰消耗 + 日结算 |
| 沙盒状态管理 | `SandboxState.ts` + `schemas.ts` | 状态存储与 Zod Schema |
| 沙盒主界面 | `SandboxHub.ts` | 顶栏 + 侧边栏 + Tab切换骨架 |
| 行动面板 | `ActionPanel.ts` | 基础行动列表（修炼/切磋/移动） |
| 时间栏 | `TimeBar.ts` | 时辰显示 + 休息/结算按钮 |
| 模式切换 | `MainMenu.ts` 修改 | 主菜单增加"沙盒模式"入口 |

### Phase 2：NPC 系统升级

**目标**：NPC 从"背景数据"升级为"可交互的生活者"。

| 任务 | 涉及文件 | 说明 |
|------|---------|------|
| NPC 日程系统 | `NpcScheduler.ts` + `npcSchedules.ts` | 替代/扩展现有 `NpcBehavior.ts` |
| NPC 互动面板 | `NpcInteractPanel.ts` | 对话/切磋/赠礼/请教等交互菜单 |
| 上下文对话 | `contextDialogs.ts` | 基于条件的动态对话数据 |
| 子地点系统 | `subLocations.ts` + worldMap 扩展 | 大地点内部的功能区域 |
| NPC 目标系统 | `npcGoals.ts` | NPC 自主目标设定与追踪 |

### Phase 3：双路线体系

**目标**：实现武林 + 朝廷双线养成。

| 任务 | 涉及文件 | 说明 |
|------|---------|------|
| 声望系统 | `ReputationSystem.ts` | 武林声望 + 朝廷声望计算 |
| 声望面板 | `ReputationPanel.ts` | 双栏 UI |
| 门派等级系统 | `courtRanks.ts` + 类型扩展 | 门派内等级 + 朝廷官职 |
| 朝廷行动 | 行动面板扩展 | 处理政务、情报搜集等 |
| 联动机制 | 各系统交叉 | 武林↔朝廷的互相影响 |

### Phase 4：事件与内容

**目标**：填充沙盒世界的事件和内容。

| 任务 | 涉及文件 | 说明 |
|------|---------|------|
| 事件引擎 | `EventEngine.ts` | 事件触发、处理、结算 |
| 核心事件 | `sandboxEvents.ts` | 定时/条件/随机事件数据 |
| 商店系统 | `TradeSystem.ts` + `shops.ts` | 购买/出售/价格波动 |
| 商店界面 | `ShopScreen.ts` | 商店 UI |
| 势力系统 | `FactionEngine.ts` + `factions.ts` | 势力动态博弈 |

### Phase 5：打磨与平衡

**目标**：数值平衡、内容丰富度、用户体验优化。

| 任务 | 说明 |
|------|------|
| 数值平衡 | 行动收益、时间消耗、NPC成长速度调优 |
| 更多事件 | 丰富随机事件、NPC事件、季节事件 |
| 结局系统 | 根据双线发展，设计多种结局 |
| UI 美化 | 动画、音效、视觉反馈 |
| 存档兼容 | 确保剧情↔沙盒存档的互转 |

---

## 十一、关键设计决策记录

### Q1：沙盒模式和剧情模式存档是否共用？

**A**：共用 `PlayerState`，但沙盒模式有独立的 `sandboxData` 字段。`gameMode` 字段区分当前模式。玩家可以在特定节点从剧情模式"毕业"进入沙盒（如完成第一章后），也可以直接新建沙盒存档。

### Q2：NPC 数据库是否复用现有的 npcDatabase？

**A**：复用并扩展。现有 `NpcStats` 接口保持向下兼容，新增字段通过可选属性（`?`）添加。Zod Schema 中新增字段均带 `.default()` 确保旧存档兼容。

### Q3：子地点是否显示在世界地图上？

**A**：不显示。子地点是大地点内部的功能区域，进入大地点后在主面板中以列表/图标形式展示，玩家点击切换。这与现有"移动统一通过地图弹窗"的设计一致。

### Q4：时辰系统是否影响剧情模式？

**A**：暂不影响。剧情模式保持现有的 act/chapter 推进方式。但未来可以在剧情模式的"自由时间"中嵌入时辰系统（如两个剧情节点之间可以自由行动 3 天）。

### Q5：如何处理太阁立志传中的"在路上"概念？

**A**：地点间移动消耗 1~3 时辰（取决于距离），途中有随机事件概率。与现有的 `travelToLocation()` 对接，额外加入时间消耗和事件判定。

### Q6：朝廷路线会不会与武侠主题冲突？

**A**：不会。主角的"前朝太子"设定天然连接朝廷线。而且参考《雪中悍刀行》，武侠和庙堂并非矛盾——世子徐凤年既是天下第一高手，也是北凉王。我们的设计让两条线互相增益而非互斥，玩家可以侧重其中一条或平衡发展。

---

*文档由 AI 基于太阁立志传、三国志13、雪中悍刀行 等作品的设计理念，结合现有代码架构编写。*
