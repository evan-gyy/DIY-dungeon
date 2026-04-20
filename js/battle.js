// ============================================================
//  BATTLE.js — 战斗引擎
//  设计参考：暗黑地牢（节奏感+状态压力）× 宝可梦（技能对策）
// ============================================================

// ===== 战斗状态机 =====
const BattleState = {
  IDLE:         'idle',
  PLAYER_TURN:  'player_turn',
  ENEMY_TURN:   'enemy_turn',
  ANIMATING:    'animating',
  WIN:          'win',
  LOSE:         'lose',
};

// ===== 战斗上下文 =====
let Battle = {
  state: BattleState.IDLE,
  player: null,       // 战斗用临时玩家对象（含状态buff）
  enemy:  null,       // 当前敌人
  round:  0,
  log:    [],         // 战斗日志栏
  skillCooldowns: {}, // { skillId: 剩余冷却回合 }
  playerStatus: [],   // 玩家身上的状态效果 [{ type, value, duration }]
  enemyStatus:  [],   // 敌人身上的状态效果
  onBattleEnd: null,  // 回调函数(result: 'win'|'lose')
  pendingEvade: false, // 玩家本回合是否有闪避
};

// ============================================================
//  核心：伤害计算公式
//
//  基础伤害 = max(1, atk * powerMul - def * defPen)
//  暴击判定：random < critRate → 伤害 × 1.5
//  浮动区间：× (0.9 ~ 1.1)
//  最终：floor(result)
// ============================================================
function calcDamage(atk, def, powerMul, defPen, critRate = 0) {
  const baseDmg = Math.max(1, atk * powerMul - def * defPen);
  const crit = Math.random() < (critRate / 100);
  const fluctuation = 0.9 + Math.random() * 0.2; // ±10% 浮动
  const total = Math.floor(baseDmg * fluctuation * (crit ? 1.5 : 1));
  return { damage: Math.max(1, total), crit };
}

// 获取某单位身上特定buff的当前value
function getStatusValue(statusList, type) {
  const s = statusList.find(x => x.type === type);
  return s ? s.value : 0;
}
function hasStatus(statusList, type) {
  return statusList.some(x => x.type === type);
}
function removeStatus(statusList, type) {
  const idx = statusList.findIndex(x => x.type === type);
  if (idx >= 0) statusList.splice(idx, 1);
}

// ============================================================
//  添加/叠加状态效果
// ============================================================
function applyStatus(statusList, effect) {
  if (!effect) return;
  const exist = statusList.find(x => x.type === effect.type);
  if (exist) {
    // 刷新持续时间（取最长），value 取最高
    exist.duration = Math.max(exist.duration, effect.duration);
    exist.value = Math.max(exist.value, effect.value);
  } else {
    statusList.push({ ...effect });
  }
}

// ============================================================
//  回合开始：处理持续效果（毒伤、MP回复、buff倒计时）
//  返回：{ logs: string[], killed: bool }
// ============================================================
function tickStatus(unit, statusList, isPlayer) {
  const logs = [];
  let killed = false;

  for (let i = statusList.length - 1; i >= 0; i--) {
    const s = statusList[i];

    if (s.type === 'poison' || s.type === 'strong_poison') {
      const dmg = s.value;
      unit.hp = Math.max(0, unit.hp - dmg);
      logs.push(`☠️ ${isPlayer ? '你' : unit.name} 中毒受到 <span class="log-dmg">${dmg}</span> 点毒伤`);
      if (unit.hp <= 0) { killed = true; }
    }

    if (s.type === 'regen_mp') {
      const val = s.value;
      unit.mp = Math.min(unit.maxMp || 100, unit.mp + val);
      logs.push(`💧 紫霄神功恢复 <span class="log-heal">${val}</span> 点内力`);
    }

    s.duration--;
    if (s.duration <= 0) {
      // buff消退提示（可选）
      statusList.splice(i, 1);
    }
  }

  return { logs, killed };
}

// ============================================================
//  玩家使用技能
// ============================================================
function playerUseSkill(skillId) {
  if (Battle.state !== BattleState.PLAYER_TURN) return;
  const sk = SKILLS[skillId];
  if (!sk) return;

  // 检查冷却
  if ((Battle.skillCooldowns[skillId] || 0) > 0) {
    addBattleLog(`⏳ ${sk.name} 冷却中（还剩 ${Battle.skillCooldowns[skillId]} 回合）`);
    return;
  }
  // 检查MP
  if (Battle.player.mp < sk.mp) {
    addBattleLog(`💧 内力不足，无法使用 ${sk.name}（需要 ${sk.mp} 点）`);
    return;
  }
  // 眩晕检查
  if (hasStatus(Battle.playerStatus, 'stun') || hasStatus(Battle.playerStatus, 'knockback')) {
    addBattleLog(`😵 你被控制，跳过本回合行动！`);
    endPlayerTurn();
    return;
  }

  Battle.state = BattleState.ANIMATING;
  Battle.player.mp -= sk.mp;

  // 设置冷却
  if (sk.cooldown > 0) Battle.skillCooldowns[skillId] = sk.cooldown;

  const logs = [];

  if (sk.type === 'passive') {
    logs.push(`${sk.icon} 触发被动：${sk.name}`);
  } else if (sk.type === 'support' && sk.target === 'self') {
    // 回血
    if (sk.healPct > 0) {
      const heal = Math.floor(Battle.player.maxHp * sk.healPct);
      Battle.player.hp = Math.min(Battle.player.maxHp, Battle.player.hp + heal);
      logs.push(`💚 ${sk.name}：恢复 <span class="log-heal">${heal}</span> 点气血`);
    }
    // 增益效果
    if (sk.effect) {
      applyStatus(Battle.playerStatus, sk.effect);
      const buffDesc = {
        buff_atk: `攻击力 +${sk.effect.value}`,
        def_boost: `防御力 +${sk.effect.value}`,
        evade: `闪避率 +${Math.floor(sk.effect.value * 100)}%`,
      };
      logs.push(`✨ ${sk.name}：获得增益「${buffDesc[sk.effect.type] || sk.effect.type}」持续 ${sk.effect.duration} 回合`);
    }
  } else if (sk.type === 'control' || sk.type === 'attack') {
    // 计算实际ATK（含buff）
    const atkBuff = getStatusValue(Battle.playerStatus, 'buff_atk');
    const realAtk = Battle.player.atk + atkBuff;

    // 敌人防御（含减防debuff）
    const defDebuff = getStatusValue(Battle.enemyStatus, 'weaken_def');
    const enemyDef = Math.max(0, Battle.enemy.def - defDebuff);

    let totalDmg = 0;
    for (let h = 0; h < (sk.hit || 1); h++) {
      if (sk.hit === 0) break; // 纯控技能
      const { damage, crit } = calcDamage(realAtk, enemyDef, sk.powerMul, sk.defPen, Battle.player.crit);
      Battle.enemy.hp = Math.max(0, Battle.enemy.hp - damage);
      totalDmg += damage;
      logs.push(`${sk.icon} ${sk.name}${sk.hit > 1 ? ` 第${h + 1}击` : ''}：对 ${Battle.enemy.name} 造成 <span class="log-dmg">${damage}</span> 点伤害${crit ? ' <span class="log-crit">暴击！</span>' : ''}`);
    }

    // 附带效果
    if (sk.effect) {
      const proc = effectProcRate(sk.effect.type);
      if (Math.random() < proc) {
        applyStatus(Battle.enemyStatus, sk.effect);
        const effectDesc = {
          stun:        `😵 ${Battle.enemy.name} 陷入眩晕！`,
          knockback:   `💥 ${Battle.enemy.name} 被击飞！`,
          poison:      `☠️ ${Battle.enemy.name} 中毒（${sk.effect.value}/回合）`,
          strong_poison:`☠️ ${Battle.enemy.name} 中剧毒（${sk.effect.value}/回合）`,
          weaken_def:  `🔻 ${Battle.enemy.name} 防御降低 ${sk.effect.value} 点`,
        };
        logs.push(effectDesc[sk.effect.type] || `✨ 附加效果：${sk.effect.type}`);
      }
    }
  }

  logs.forEach(l => addBattleLog(l));
  renderBattleHUD();

  // 检查胜利
  if (Battle.enemy.hp <= 0) {
    setTimeout(() => endBattle('win'), 600);
    return;
  }

  // 短暂延迟后进入敌人回合
  setTimeout(() => endPlayerTurn(), 700);
}

// 效果触发概率
function effectProcRate(type) {
  const rates = {
    stun: 0.70, knockback: 0.60, poison: 1.0,
    strong_poison: 1.0, weaken_def: 1.0,
  };
  return rates[type] ?? 1.0;
}

// 结束玩家回合
function endPlayerTurn() {
  // 冷却计时 -1
  Object.keys(Battle.skillCooldowns).forEach(k => {
    if (Battle.skillCooldowns[k] > 0) Battle.skillCooldowns[k]--;
  });
  Battle.state = BattleState.ENEMY_TURN;
  setTimeout(() => enemyTurn(), 400);
}

// ============================================================
//  敌人AI回合
// ============================================================
function enemyTurn() {
  if (Battle.state !== BattleState.ENEMY_TURN) return;

  // 眩晕/击飞检查
  if (hasStatus(Battle.enemyStatus, 'stun') || hasStatus(Battle.enemyStatus, 'knockback')) {
    addBattleLog(`😵 ${Battle.enemy.name} 被控制，跳过本回合！`);
    startPlayerTurn();
    return;
  }

  // AI：加权随机选择行动
  const actions = Battle.enemy.actions;
  const totalWeight = actions.reduce((s, a) => s + a.weight, 0);
  let rand = Math.random() * totalWeight;
  let chosen = actions[0];
  for (const a of actions) {
    rand -= a.weight;
    if (rand <= 0) { chosen = a; break; }
  }

  const logs = [];

  if (chosen.hit === 0) {
    // 增益/自愈行动
    if (chosen.effect?.type === 'self_heal') {
      const heal = Math.floor(Battle.enemy.maxHp * chosen.effect.value);
      Battle.enemy.hp = Math.min(Battle.enemy.maxHp, Battle.enemy.hp + heal);
      logs.push(`💚 ${Battle.enemy.name} 使用「${chosen.name}」，恢复 <span class="log-heal">${heal}</span> 点气血`);
    } else if (chosen.effect) {
      applyStatus(Battle.enemyStatus, chosen.effect);
      logs.push(`✨ ${Battle.enemy.name} 使用「${chosen.name}」获得增益`);
    }
  } else {
    // 攻击行动
    const defDebuff = getStatusValue(Battle.playerStatus, 'weaken_def');
    let realPlayerDef = Math.max(0, Battle.player.def - defDebuff);

    // def_boost buff
    const defBoostBuff = getStatusValue(Battle.playerStatus, 'def_boost');
    realPlayerDef += defBoostBuff;

    for (let h = 0; h < chosen.hit; h++) {
      // 玩家闪避检查
      const evadeRate = getStatusValue(Battle.playerStatus, 'evade');
      if (evadeRate > 0 && Math.random() < evadeRate) {
        logs.push(`🌀 你身法灵动，闪避了「${chosen.name}」！`);
        removeStatus(Battle.playerStatus, 'evade');
        continue;
      }

      const { damage, crit } = calcDamage(Battle.enemy.atk, realPlayerDef, chosen.powerMul, chosen.defPen, 0);
      Battle.player.hp = Math.max(0, Battle.player.hp - damage);
      logs.push(`${chosen.icon} ${Battle.enemy.name} 使用「${chosen.name}」${chosen.hit > 1 ? ` 第${h+1}击` : ''}：对你造成 <span class="log-dmg">${damage}</span> 点伤害${crit ? ' <span class="log-crit">暴击！</span>' : ''}`);
    }

    // 附带效果
    if (chosen.effect && chosen.effect.type !== 'self_heal') {
      const proc = effectProcRate(chosen.effect.type);
      if (Math.random() < proc) {
        applyStatus(Battle.playerStatus, chosen.effect);
        const effectDesc = {
          stun:       `😵 你陷入眩晕！`,
          poison:     `☠️ 你中毒（${chosen.effect.value}/回合）`,
          strong_poison: `☠️ 你中剧毒（${chosen.effect.value}/回合）`,
          weaken_def: `🔻 你的防御降低 ${chosen.effect.value} 点`,
        };
        logs.push(effectDesc[chosen.effect.type] || '附加效果触发');
      }
    }
  }

  logs.forEach(l => addBattleLog(l));
  renderBattleHUD();

  // 检查失败
  if (Battle.player.hp <= 0) {
    setTimeout(() => endBattle('lose'), 600);
    return;
  }

  setTimeout(() => startPlayerTurn(), 500);
}

// ============================================================
//  回合开始：tick状态 → 玩家行动
// ============================================================
function startPlayerTurn() {
  Battle.round++;
  Battle.state = BattleState.PLAYER_TURN;

  // tick 玩家状态
  const pTick = tickStatus(Battle.player, Battle.playerStatus, true);
  pTick.logs.forEach(l => addBattleLog(l));
  if (pTick.killed) { endBattle('lose'); return; }

  // tick 敌人状态
  const eTick = tickStatus(Battle.enemy, Battle.enemyStatus, false);
  eTick.logs.forEach(l => addBattleLog(l));
  if (eTick.killed) { endBattle('win'); return; }

  renderBattleHUD();
  renderSkillBar();
  addBattleLog(`── 第 ${Battle.round} 回合 ──`);
}

// ============================================================
//  战斗结束
// ============================================================
function endBattle(result) {
  Battle.state = result === 'win' ? BattleState.WIN : BattleState.LOSE;

  if (result === 'win') {
    const e = Battle.enemy;
    const expGain = e.reward.exp;
    const goldGain = e.reward.gold;

    // 战利品
    const loot = [];
    (e.loot || []).forEach(l => {
      if (Math.random() < l.chance) {
        loot.push(l.id);
        addItemToInventory(l.id);
      }
    });

    // 武当山任务进度标记
    const wudangFlags = { 10: 'wudangGateCleared', 11: 'wudangMidCleared', 12: 'wudangElderCleared' };
    if (wudangFlags[e.tier] && !G.player[wudangFlags[e.tier]]) {
      G.player[wudangFlags[e.tier]] = true;
    }

    // 同步回玩家存档（使用正确存档槽）
    G.player.hp   = Battle.player.hp;
    G.player.mp   = Battle.player.mp;
    G.player.exp  += expGain;
    G.player.gold += goldGain;

    // 修为突破检查
    const lvResult = checkLevelUp(G.player);
    if (lvResult.leveled) {
      const realmName = getRealmName(lvResult.newLevel);
      G.player.level = lvResult.newLevel;
      setTimeout(() => {
        showToast(`🎉 修为突破！${lvResult.oldLevel} → ${lvResult.newLevel}层（${realmName}）！获得 ${lvResult.gainedPoints} 点修为！`);
      }, 600);
    }

    if (G.player._slot != null) saveGame(G.player._slot);
    else saveGame();

    showBattleResult('win', { expGain, goldGain, loot, wudangFlag: wudangFlags[e.tier] });
  } else {
    // 失败：HP回到1，MP归0
    G.player.hp = 1;
    G.player.mp = 0;
    if (G.player._slot != null) saveGame(G.player._slot);
    else saveGame();
    showBattleResult('lose', {});
  }
}

function addItemToInventory(itemId) {
  const template = ITEMS[itemId];
  if (!template) return;
  const existing = G.player.inventory.find(i => i.id === itemId);
  if (existing) existing.count++;
  else G.player.inventory.push({ ...template, count: 1 });
}

// ============================================================
//  UI：战斗日志
// ============================================================
function addBattleLog(html) {
  Battle.log.push(html);
  const logEl = document.getElementById('battle-log');
  if (!logEl) return;
  const div = document.createElement('div');
  div.className = 'battle-log-entry';
  div.innerHTML = html;
  logEl.appendChild(div);
  logEl.scrollTop = logEl.scrollHeight;
}

// ============================================================
//  UI：渲染战斗HUD（血条 / 状态图标）
// ============================================================
function renderBattleHUD() {
  const p = Battle.player;
  const e = Battle.enemy;
  // 防御：若战斗未初始化，直接退出（避免在营地界面误触发）
  if (!p || !e) return;

  // 玩家HP/MP
  const pHpPct = Math.max(0, p.hp / p.maxHp * 100);
  const pMpPct = Math.max(0, p.mp / (p.maxMp || 100) * 100);
  setEl('battle-player-hp-bar', el => el.style.width = pHpPct + '%');
  setEl('battle-player-hp-val', el => el.textContent = `${Math.max(0, p.hp)} / ${p.maxHp}`);
  setEl('battle-player-mp-bar', el => el.style.width = pMpPct + '%');
  setEl('battle-player-mp-val', el => el.textContent = `${Math.max(0, p.mp)} / ${p.maxMp || 100}`);

  // 敌人HP
  const eHpPct = Math.max(0, e.hp / e.maxHp * 100);
  setEl('battle-enemy-hp-bar', el => el.style.width = eHpPct + '%');
  setEl('battle-enemy-hp-val', el => el.textContent = `${Math.max(0, e.hp)} / ${e.maxHp}`);

  // 玩家状态标签
  renderStatusBadges('battle-player-status', Battle.playerStatus);
  renderStatusBadges('battle-enemy-status', Battle.enemyStatus);
}

function setEl(id, fn) {
  const el = document.getElementById(id);
  if (el) fn(el);
}

function renderStatusBadges(containerId, statusList) {
  const el = document.getElementById(containerId);
  if (!el) return;
  const icons = { stun: '😵眩晕', knockback: '💥击飞', poison: '☠️毒', strong_poison: '☠️剧毒',
    weaken_def: '🔻减防', buff_atk: '⚔️攻强', def_boost: '🛡️防强', evade: '🌀闪', regen_mp: '💧回蓝' };
  el.innerHTML = statusList.map(s =>
    `<span class="status-badge">${icons[s.type] || s.type}×${s.duration}</span>`
  ).join('');
}

// ============================================================
//  UI：渲染技能栏
// ============================================================
function renderSkillBar() {
  const bar = document.getElementById('skill-bar');
  if (!bar) return;
  // 防御：若玩家不存在则只显示空栏
  if (!G.player) {
    bar.innerHTML = '<span style="color:#666;font-size:12px;padding:8px;">请先创建角色</span>';
    return;
  }
  const equipped = G.player.equippedSkills || [null, null, null, null];
  bar.innerHTML = '';

  // 普通攻击（永远可用）
  const basicBtn = document.createElement('button');
  basicBtn.className = 'skill-btn skill-btn-basic';
  basicBtn.innerHTML = `<span class="skill-btn-icon">👊</span><span class="skill-btn-name">普通攻击</span><span class="skill-btn-mp">0 MP</span>`;
  basicBtn.onclick = () => playerBasicAttack();
  bar.appendChild(basicBtn);

  equipped.forEach(skId => {
    const sk = skId ? SKILLS[skId] : null;
    const btn = document.createElement('button');
    const cd = skId ? (Battle.skillCooldowns[skId] || 0) : 0;
    const noMp = sk && Battle.player.mp < sk.mp;
    btn.className = `skill-btn ${!sk ? 'skill-btn-empty' : ''} ${cd > 0 ? 'skill-btn-cd' : ''} ${noMp ? 'skill-btn-nomb' : ''}`;

    if (!sk) {
      btn.innerHTML = `<span class="skill-btn-icon">—</span><span class="skill-btn-name">空槽</span>`;
      btn.disabled = true;
    } else if (sk.type === 'passive') {
      btn.innerHTML = `<span class="skill-btn-icon">${sk.icon}</span><span class="skill-btn-name">${sk.name}</span><span class="skill-btn-mp">被动</span>`;
      btn.disabled = true;
      btn.classList.add('skill-btn-passive');
    } else {
      btn.innerHTML = `
        <span class="skill-btn-icon">${sk.icon}</span>
        <span class="skill-btn-name">${sk.name}</span>
        <span class="skill-btn-mp">${sk.mp} MP</span>
        ${cd > 0 ? `<span class="skill-btn-cd-overlay">CD:${cd}</span>` : ''}
      `;
      btn.disabled = cd > 0 || noMp || Battle.state !== BattleState.PLAYER_TURN;
      btn.onclick = () => playerUseSkill(skId);
      btn.title = sk.battleTip || sk.desc;
    }
    bar.appendChild(btn);
  });

  // 使用物品按钮（简化：使用背包第一个HP药）
  const potionCount = (G.player.inventory.find(i => i.id === 'hp_potion') || { count: 0 }).count;
  const potionBtn = document.createElement('button');
  potionBtn.className = `skill-btn skill-btn-item ${potionCount === 0 ? 'skill-btn-nomb' : ''}`;
  potionBtn.innerHTML = `<span class="skill-btn-icon">🔴</span><span class="skill-btn-name">服药</span><span class="skill-btn-mp">×${potionCount}</span>`;
  potionBtn.disabled = potionCount === 0 || Battle.state !== BattleState.PLAYER_TURN;
  potionBtn.onclick = () => useHpPotionInBattle();
  bar.appendChild(potionBtn);
}

// 普通攻击
function playerBasicAttack() {
  if (Battle.state !== BattleState.PLAYER_TURN) return;
  if (hasStatus(Battle.playerStatus, 'stun') || hasStatus(Battle.playerStatus, 'knockback')) {
    addBattleLog(`😵 你被控制，跳过本回合行动！`);
    endPlayerTurn(); return;
  }
  Battle.state = BattleState.ANIMATING;
  const atkBuff = getStatusValue(Battle.playerStatus, 'buff_atk');
  const realAtk = Battle.player.atk + atkBuff;
  const defDebuff = getStatusValue(Battle.enemyStatus, 'weaken_def');
  const enemyDef = Math.max(0, Battle.enemy.def - defDebuff);
  const { damage, crit } = calcDamage(realAtk, enemyDef, 1.0, 0.7, Battle.player.crit);
  Battle.enemy.hp = Math.max(0, Battle.enemy.hp - damage);
  addBattleLog(`👊 普通攻击：对 ${Battle.enemy.name} 造成 <span class="log-dmg">${damage}</span> 点伤害${crit ? ' <span class="log-crit">暴击！</span>' : ''}`);
  renderBattleHUD();
  if (Battle.enemy.hp <= 0) { setTimeout(() => endBattle('win'), 600); return; }
  setTimeout(() => endPlayerTurn(), 600);
}

// 战斗中使用回血药
function useHpPotionInBattle() {
  if (Battle.state !== BattleState.PLAYER_TURN) return;
  const idx = G.player.inventory.findIndex(i => i.id === 'hp_potion');
  if (idx < 0) return;
  const heal = 50;
  Battle.player.hp = Math.min(Battle.player.maxHp, Battle.player.hp + heal);
  G.player.inventory[idx].count--;
  if (G.player.inventory[idx].count <= 0) G.player.inventory.splice(idx, 1);
  addBattleLog(`🔴 服下红药丸，恢复 <span class="log-heal">${heal}</span> 点气血`);
  renderBattleHUD();
  renderSkillBar();
  // 用药不消耗行动（设计选择：消耗行动改为保留行动均可调整）
  // setTimeout(() => endPlayerTurn(), 300);
}

// ============================================================
//  战斗结果界面
// ============================================================
function showBattleResult(result, data) {
  const overlay = document.getElementById('battle-result-overlay');
  const title   = document.getElementById('battle-result-title');
  const detail  = document.getElementById('battle-result-detail');
  const btn     = document.getElementById('battle-result-btn');

  overlay.classList.remove('hidden');

  if (result === 'win') {
    title.textContent = '胜利！';
    title.style.color = '#e8c87a';
    const lootDesc = data.loot && data.loot.length > 0
      ? data.loot.map(id => ITEMS[id]?.name || id).join('、')
      : '无';

    // 武当山特殊关卡提示
    const tierMsgs = {
      10: '<br><span style="color:#5dade2;">☯️ 第一关「山门弟子」已通过！</span>',
      11: '<br><span style="color:#5dade2;">☯️ 第二关「中庭弟子」已通过！</span>',
      12: '<br><span style="color:#e8c87a;">☯️ 武当山三关全部通关！回去向张三丰复命领取奖励！</span>',
    };
    const wudangFlagIndex = ['wudangGateCleared', 'wudangMidCleared', 'wudangElderCleared'].indexOf(data.wudangFlag);
    const tierMsg = wudangFlagIndex >= 0 ? tierMsgs[[10, 11, 12][wudangFlagIndex]] || '' : '';

    detail.innerHTML = `
      获得经验：<span style="color:#e8c87a">+${data.expGain}</span><br>
      获得金两：<span style="color:#e8c87a">+${data.goldGain}</span><br>
      战利品：${lootDesc}${tierMsg}
    `;
    btn.textContent = '返回营地';
  } else {
    title.textContent = '落败…';
    title.style.color = '#e74c3c';
    detail.innerHTML = `气血告罄，侥幸逃得性命。<br>气血剩余 1 点，内力耗尽，速速回营地调养。`;
    btn.textContent = '回营地休整';
  }

  btn.onclick = () => {
    overlay.classList.add('hidden');
    enterCamp();
    renderCampTopbar();
    renderSidebar();
    // 若有修为突破，立即刷新属性面板（方便点修为）
    const lvResult = checkLevelUp(G.player);
    if (lvResult.leveled) {
      renderAttrPanel(document.getElementById('camp-content'));
    }
  };
}

// ============================================================
//  启动战斗
// ============================================================
function startBattle(enemyId) {
  const template = enemyId ? ENEMIES[enemyId] : getRandomEnemy(1);
  const enemy = JSON.parse(JSON.stringify(template));

  // 初始化被动技能效果
  const passiveSkills = (G.player.skills || []).filter(id => SKILLS[id]?.type === 'passive');

  Battle = {
    state: BattleState.PLAYER_TURN,
    player: {
      ...G.player,
      hp: G.player.hp,
      mp: G.player.mp,
      maxHp: G.player.maxHp,
      maxMp: G.player.maxMp || 100,
    },
    enemy,
    round: 0,
    log: [],
    skillCooldowns: {},
    playerStatus: [],
    enemyStatus: [],
    pendingEvade: false,
  };

  // 被动：紫霄神功 → 每回合自动添加regen_mp状态
  if (passiveSkills.includes('zixiao')) {
    applyStatus(Battle.playerStatus, { type: 'regen_mp', value: 6, duration: 999 });
  }
  // 被动：金刚护体 → 战斗开始即有def_boost
  if (passiveSkills.includes('72_arts')) {
    applyStatus(Battle.playerStatus, { type: 'def_boost', value: 20, duration: 999 });
  }

  showScreen('battle');
  switchMusic('https://pub-cdb8eae73d584ab0b7d006c460518c76.r2.dev/music/battlemusic1.mp3');

  // 渲染敌人信息
  setEl('battle-enemy-name', el => el.textContent = enemy.name);
  setEl('battle-enemy-icon', el => el.textContent = enemy.icon);
  setEl('battle-enemy-tier', el => {
    const labels = ['', '江湖喽啰', '武林好手', '一流高手'];
    el.textContent = labels[enemy.tier] || '';
  });

  // 渲染玩家信息
  setEl('battle-player-name', el => el.textContent = G.player.name);
  setEl('battle-player-img', el => { el.src = G.player.charImg; });

  // 清空日志
  const logEl = document.getElementById('battle-log');
  if (logEl) logEl.innerHTML = '';

  // 隐藏结果遮罩
  const overlay = document.getElementById('battle-result-overlay');
  if (overlay) overlay.classList.add('hidden');

  renderBattleHUD();
  renderSkillBar();
  startPlayerTurn();
}
