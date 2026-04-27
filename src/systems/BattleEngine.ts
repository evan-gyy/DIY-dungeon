import type {
  BattleContext, BattleUnit, BattleEnemyUnit, BattleResult,
  EnemyId, SkillId, StatusEffect, ItemId,
} from '../data/types';
import { SKILLS } from '../data/skills';
import { ENEMIES, getRandomEnemy } from '../data/enemies';
import { ITEMS } from '../data/items';
import { getPlayer, setPlayer } from '../state/GameState';
import { saveGame } from '../state/SaveSystem';
import { checkLevelUp, getRealmName } from '../state/LevelSystem';
import {
  applyStatus, removeStatus, hasStatus,
  getStatusValue, tickStatus, effectProcRate,
} from './StatusEffects';
import { selectEnemyAction } from './EnemyAI';
import { bus } from '../ui/events';

// ── module-level battle context ──
let _ctx: BattleContext | null = null;

export function getBattleContext(): BattleContext | null {
  return _ctx;
}

// ── damage formula (pure) ──
function calcDamage(
  atk: number, def: number, powerMul: number, defPen: number, critRate = 0,
): { damage: number; crit: boolean } {
  const baseDmg = Math.max(1, atk * powerMul - def * defPen);
  const crit = Math.random() < critRate / 100;
  const fluctuation = 0.9 + Math.random() * 0.2;
  const total = Math.floor(baseDmg * fluctuation * (crit ? 1.5 : 1));
  return { damage: Math.max(1, total), crit };
}

function _log(html: string): void {
  if (!_ctx) return;
  _ctx.log.push(html);
  bus.emit('battle:log-add', { html });
}

function _notifyUpdate(): void {
  if (!_ctx) return;
  const currentUnit = _ctx.turnOrder[_ctx.currentUnitIndex] ?? null;
  bus.emit('battle:updated', { round: _ctx.round, currentUnit });
}

// ── 获取存活单位 ──
function getAliveAllies(): BattleUnit[] {
  return _ctx?.allies.filter(u => u.alive) ?? [];
}

function getAliveEnemies(): BattleEnemyUnit[] {
  return _ctx?.enemies.filter(u => u.alive) ?? [];
}

// ── 构建回合顺序：1A-1B-2A-2B-3A-3B-4A-4B ──
function buildTurnOrder(): BattleUnit[] {
  const allies = getAliveAllies();
  const enemies = getAliveEnemies();
  const maxLen = Math.max(allies.length, enemies.length);
  const order: BattleUnit[] = [];
  for (let i = 0; i < maxLen; i++) {
    if (i < allies.length) order.push(allies[i]!);
    if (i < enemies.length) order.push(enemies[i]!);
  }
  return order;
}

// ── battle lifecycle ──

function _endBattle(result: BattleResult): void {
  if (!_ctx) return;
  _ctx.state = result === 'win' ? 'win' : 'lose';

  const player = getPlayer();

  // scriptedDefeat check: any enemy with scriptedDefeat
  if (result !== 'win' && _ctx.enemies.some(e => e.scriptedDefeat)) {
    const updated = { ...player, hp: 1, mp: 0 };
    setPlayer(updated);
    saveGame(updated);
    bus.emit('story:battle-end', { result: 'lose' });
    return;
  }

  if (result === 'win') {
    let totalExp = 0;
    let totalGold = 0;
    const allLoot: ItemId[] = [];

    for (const e of _ctx.enemies) {
      totalExp += e.reward.exp;
      totalGold += e.reward.gold;
      for (const entry of e.loot) {
        if (Math.random() < entry.chance) allLoot.push(entry.id);
      }
    }

    let updatedInventory = [...player.inventory];
    for (const lootId of allLoot) {
      const template = ITEMS[lootId];
      if (!template) continue;
      const existing = updatedInventory.find(i => i.id === lootId);
      if (existing) {
        updatedInventory = updatedInventory.map(i =>
          i.id === lootId ? { ...i, count: i.count + 1 } : i,
        );
      } else {
        updatedInventory.push({ ...template, count: 1 });
      }
    }

    // wudang quest flags
    const wudangMap: Partial<Record<number, 'wudangGateCleared' | 'wudangMidCleared' | 'wudangElderCleared'>> = {
      10: 'wudangGateCleared',
      11: 'wudangMidCleared',
      12: 'wudangElderCleared',
    };

    // 保存主角的HP/MP（从player_main单位获取）
    const mainUnit = _ctx.allies.find(u => u.isPlayer);
    let updated = {
      ...player,
      hp: mainUnit?.hp ?? player.hp,
      mp: mainUnit?.mp ?? player.mp,
      exp: player.exp + totalExp,
      gold: player.gold + totalGold,
      inventory: updatedInventory,
    };

    // apply wudang flags from any enemy
    for (const e of _ctx.enemies) {
      const flag = wudangMap[e.tier];
      if (flag && !player[flag]) {
        updated = { ...updated, [flag]: true };
      }
    }

    const lvResult = checkLevelUp(updated);
    if (lvResult.leveled) {
      updated = lvResult.updatedPlayer;
      setTimeout(() => {
        const realmName = getRealmName(lvResult.newLevel);
        bus.emit('toast', {
          message: `🎉 修为突破！${lvResult.oldLevel} → ${lvResult.newLevel}层（${realmName}）！获得 ${lvResult.gainedPoints} 点修为点！`,
        });
        bus.emit('player:level-up', {
          oldLevel: lvResult.oldLevel,
          newLevel: lvResult.newLevel,
          gainedPoints: lvResult.gainedPoints,
        });
      }, 600);
    }

    setPlayer(updated);
    saveGame(updated);
    bus.emit('battle:end', { result: 'win', expGain: totalExp, goldGain: totalGold, loot: allLoot });
  } else {
    const updated = { ...player, hp: 1, mp: 0 };
    setPlayer(updated);
    saveGame(updated);
    bus.emit('battle:end', { result: 'lose', expGain: 0, goldGain: 0, loot: [] });
  }
}

// ── 推进到下一个行动单位 ──
function _advanceTurn(): void {
  if (!_ctx) return;

  // 清除已死亡单位
  _ctx.allies = _ctx.allies.filter(u => u.alive);
  _ctx.enemies = _ctx.enemies.filter(u => u.alive);

  // 检查胜负
  if (_ctx.enemies.length === 0) {
    _ctx.state = 'win';
    setTimeout(() => _endBattle('win'), 400);
    return;
  }
  if (_ctx.allies.length === 0 || _ctx.allies.every(u => !u.alive)) {
    _ctx.state = 'lose';
    setTimeout(() => _endBattle('lose'), 400);
    return;
  }

  // 推进索引
  _ctx.currentUnitIndex++;

  // 如果当前回合所有人都行动过了，开始新回合
  if (_ctx.currentUnitIndex >= _ctx.turnOrder.length) {
    _ctx.round++;
    _ctx.currentUnitIndex = 0;
    _ctx.turnOrder = buildTurnOrder();

    if (_ctx.turnOrder.length === 0) {
      _endBattle('lose');
      return;
    }

    // 新回合：tick状态效果
    _log(`── 第 ${_ctx.round} 回合 ──`);

    // tick all ally statuses
    for (const ally of _ctx.allies) {
      const allyStatuses = _ctx.allyStatuses[ally.id] ?? [];
      const tick = tickStatus(ally, allyStatuses, true);
      tick.logs.forEach(l => _log(l));
      if (tick.killed) {
        ally.alive = false;
        ally.hp = 0;
      }
    }

    // tick all enemy statuses
    for (const enemy of _ctx.enemies) {
      const enemyStatuses = _ctx.enemyStatuses[enemy.id] ?? [];
      const tick = tickStatus(enemy, enemyStatuses, false);
      tick.logs.forEach(l => _log(l));
      if (tick.killed) {
        enemy.alive = false;
        enemy.hp = 0;
      }
    }

    // 重新构建回合顺序（移除死亡单位）
    _ctx.turnOrder = buildTurnOrder();
    if (_ctx.turnOrder.length === 0) {
      _endBattle('lose');
      return;
    }

    // 递减冷却
    for (const key of Object.keys(_ctx.skillCooldowns) as SkillId[]) {
      const cd = _ctx.skillCooldowns[key] ?? 0;
      if (cd > 0) _ctx.skillCooldowns[key] = cd - 1;
    }
  }

  // 跳过已死亡的单位
  const nextUnit = _ctx.turnOrder[_ctx.currentUnitIndex];
  if (!nextUnit || !nextUnit.alive) {
    _advanceTurn();
    return;
  }

  // 检查当前单位是否被控制
  const statuses = _getUnitStatuses(nextUnit);
  if (hasStatus(statuses, 'stun') || hasStatus(statuses, 'knockback')) {
    _log(`😵 ${nextUnit.name} 被控制，跳过本回合！`);
    _advanceTurn();
    return;
  }

  _ctx.state = nextUnit.side === 'ally' ? 'player_turn' : 'enemy_turn';
  _notifyUpdate();

  if (nextUnit.side === 'enemy') {
    setTimeout(() => _enemyTurn(nextUnit as BattleEnemyUnit), 500);
  }
}

// ── 获取单位的状态效果列表 ──
function _getUnitStatuses(unit: BattleUnit): StatusEffect[] {
  if (!_ctx) return [];
  const map = unit.side === 'ally' ? _ctx.allyStatuses : _ctx.enemyStatuses;
  return map[unit.id] ?? [];
}

function _setUnitStatuses(unit: BattleUnit, statuses: StatusEffect[]): void {
  if (!_ctx) return;
  if (unit.side === 'ally') {
    _ctx.allyStatuses[unit.id] = statuses;
  } else {
    _ctx.enemyStatuses[unit.id] = statuses;
  }
}

// ── 敌方回合 ──
function _enemyTurn(enemy: BattleEnemyUnit): void {
  if (!_ctx || _ctx.state !== 'enemy_turn') return;

  const statuses = _getUnitStatuses(enemy);
  if (hasStatus(statuses, 'stun') || hasStatus(statuses, 'knockback')) {
    _log(`😵 ${enemy.name} 被控制，跳过本回合！`);
    _advanceTurn();
    return;
  }

  const chosen = selectEnemyAction(enemy);
  // 选择目标：随机选一个存活的友方单位
  const aliveAllies = getAliveAllies();
  const target = aliveAllies[Math.floor(Math.random() * aliveAllies.length)];
  if (!target) { _advanceTurn(); return; }

  if (chosen.hit === 0) {
    if (chosen.effect?.type === 'self_heal') {
      const heal = Math.floor(enemy.maxHp * chosen.effect.value);
      enemy.hp = Math.min(enemy.maxHp, enemy.hp + heal);
      _log(`💚 ${enemy.name} 使用「${chosen.name}」，恢复 <span class="log-heal">${heal}</span> 点气血`);
    } else if (chosen.effect) {
      const selfStatuses = _getUnitStatuses(enemy);
      applyStatus(selfStatuses, chosen.effect);
      _setUnitStatuses(enemy, selfStatuses);
      _log(`✨ ${enemy.name} 使用「${chosen.name}」获得增益`);
    }
  } else {
    const targetStatuses = _getUnitStatuses(target);
    const defDebuff   = getStatusValue(targetStatuses, 'weaken_def');
    const defBoostBuf = getStatusValue(targetStatuses, 'def_boost');
    const realTargetDef = Math.max(0, target.def - defDebuff) + defBoostBuf;

    for (let h = 0; h < chosen.hit; h++) {
      const evadeRate = getStatusValue(targetStatuses, 'evade');
      if (evadeRate > 0 && Math.random() < evadeRate) {
        _log(`🌀 ${target.name} 身法灵动，闪避了「${chosen.name}」！`);
        removeStatus(targetStatuses, 'evade');
        continue;
      }
      const { damage, crit } = calcDamage(enemy.atk, realTargetDef, chosen.powerMul, chosen.defPen, 0);
      target.hp = Math.max(0, target.hp - damage);
      _log(
        `${chosen.icon} ${enemy.name} 使用「${chosen.name}」${chosen.hit > 1 ? ` 第${h + 1}击` : ''}：` +
        `对 ${target.name} 造成 <span class="log-dmg">${damage}</span> 点伤害` +
        `${crit ? ' <span class="log-crit">暴击！</span>' : ''}`,
      );
    }

    if (target.hp <= 0) {
      target.alive = false;
      _log(`💀 ${target.name} 倒下！`);
    }

    if (chosen.effect && chosen.effect.type !== 'self_heal') {
      if (Math.random() < effectProcRate(chosen.effect.type)) {
        applyStatus(targetStatuses, chosen.effect);
        _setUnitStatuses(target, targetStatuses);
        const effectDesc: Partial<Record<string, string>> = {
          stun:         `😵 ${target.name} 陷入眩晕！`,
          poison:       `☠️ ${target.name} 中毒（${chosen.effect.value}/回合）`,
          strong_poison: `☠️ ${target.name} 中剧毒（${chosen.effect.value}/回合）`,
          weaken_def:   `🔻 ${target.name} 防御降低 ${chosen.effect.value} 点`,
        };
        _log(effectDesc[chosen.effect.type] ?? '附加效果触发');
      }
    }
  }

  _notifyUpdate();
  setTimeout(() => _advanceTurn(), 500);
}

// ============================================================
//  Public API
// ============================================================

/** 初始化1v1战斗 */
export function initBattle(enemyId?: EnemyId): void {
  const player = getPlayer();
  const template = enemyId ? ENEMIES[enemyId] : getRandomEnemy(1);
  if (!template) throw new Error(`Unknown enemy: ${String(enemyId)}`);

  const enemy: BattleEnemyUnit = {
    id: 'enemy_0',
    name: template.name,
    side: 'enemy',
    hp: template.hp, maxHp: template.hp,
    mp: 0, maxMp: 0,
    atk: template.atk, def: template.def, agi: template.agi, crit: 0,
    icon: template.icon,
    skills: [],
    isPlayer: false,
    alive: true,
    enemyId: template.id,
    tier: template.tier,
    actions: JSON.parse(JSON.stringify(template.actions)),
    reward: { ...template.reward },
    loot: JSON.parse(JSON.stringify(template.loot)),
    scriptedDefeat: template.scriptedDefeat,
  };

  const passiveSkills = player.skills.filter(id => SKILLS[id]?.type === 'passive');
  const hasPrevision = passiveSkills.includes('yi_li_xin_jing');

  const playerUnit: BattleUnit = {
    id: 'player_main',
    name: player.name,
    side: 'ally',
    hp: player.hp, maxHp: player.maxHp,
    mp: player.mp, maxMp: player.maxMp,
    atk: player.atk, def: player.def, agi: player.agi, crit: player.crit,
    charImg: player.charImg,
    skills: player.skills,
    isPlayer: true,
    alive: true,
  };

  const allyStatuses: Record<string, StatusEffect[]> = {};
  const enemyStatuses: Record<string, StatusEffect[]> = {};

  // apply passives to player
  const pStatus: StatusEffect[] = [];
  if (passiveSkills.includes('zixiao')) {
    applyStatus(pStatus, { type: 'regen_mp', value: 8, duration: 999 });
  }
  if (hasPrevision) {
    applyStatus(pStatus, { type: 'regen_mp_pct', value: 10, duration: 999 });
  }
  allyStatuses['player_main'] = pStatus;
  enemyStatuses['enemy_0'] = [];

  _ctx = {
    state: 'player_turn',
    units: [playerUnit, enemy],
    allies: [playerUnit],
    enemies: [enemy],
    currentUnitIndex: 0,
    turnOrder: [playerUnit, enemy],
    round: 0,
    log: [],
    skillCooldowns: {},
    hasPrevision,
    pendingEvade: false,
    selectedTarget: null,
    teamBattle: false,
    allyStatuses,
    enemyStatuses,
  };

  bus.emit('battle:started', {
    allies: [playerUnit],
    enemies: [enemy],
    teamBattle: false,
  });

  _log(`── 第 1 回合 ──`);
  _notifyUpdate();
}

/** 初始化团队战（4v4 或 2v3 等） */
export function initTeamBattle(
  allyDefs: Array<{ name: string; hp: number; maxHp: number; mp: number; maxMp: number; atk: number; def: number; agi: number; crit: number; charImg?: string; icon?: string; skills: SkillId[]; isPlayer: boolean }>,
  enemyIds: EnemyId[],
): void {
  const player = getPlayer();
  const hasPrevision = player.skills.includes('yi_li_xin_jing' as SkillId);

  const allies: BattleUnit[] = allyDefs.map((def, i) => ({
    id: def.isPlayer ? 'player_main' : `ally_${i}`,
    name: def.name,
    side: 'ally' as const,
    hp: def.hp, maxHp: def.maxHp,
    mp: def.mp, maxMp: def.maxMp,
    atk: def.atk, def: def.def, agi: def.agi, crit: def.crit,
    charImg: def.charImg, icon: def.icon,
    skills: def.skills,
    isPlayer: def.isPlayer,
    alive: true,
  }));

  const enemies: BattleEnemyUnit[] = enemyIds.map((eid, i) => {
    const t = ENEMIES[eid];
    if (!t) throw new Error(`Unknown enemy: ${eid}`);
    return {
      id: `enemy_${i}`,
      name: t.name,
      side: 'enemy' as const,
      hp: t.hp, maxHp: t.hp,
      mp: 0, maxMp: 0,
      atk: t.atk, def: t.def, agi: t.agi, crit: 0,
      icon: t.icon,
      skills: [],
      isPlayer: false,
      alive: true,
      enemyId: t.id,
      tier: t.tier,
      actions: JSON.parse(JSON.stringify(t.actions)),
      reward: { ...t.reward },
      loot: JSON.parse(JSON.stringify(t.loot)),
      scriptedDefeat: t.scriptedDefeat,
    };
  });

  const allyStatuses: Record<string, StatusEffect[]> = {};
  const enemyStatuses: Record<string, StatusEffect[]> = {};

  // apply passives to player
  for (const ally of allies) {
    const statuses: StatusEffect[] = [];
    if (ally.isPlayer) {
      const passiveSkills = player.skills.filter(id => SKILLS[id]?.type === 'passive');
      if (passiveSkills.includes('zixiao')) {
        applyStatus(statuses, { type: 'regen_mp', value: 8, duration: 999 });
      }
      if (hasPrevision) {
        applyStatus(statuses, { type: 'regen_mp_pct', value: 10, duration: 999 });
      }
    }
    allyStatuses[ally.id] = statuses;
  }

  for (const enemy of enemies) {
    enemyStatuses[enemy.id] = [];
  }

  const turnOrder = buildTurnOrderFrom(allies, enemies);

  _ctx = {
    state: 'player_turn',
    units: [...allies, ...enemies],
    allies,
    enemies,
    currentUnitIndex: 0,
    turnOrder,
    round: 1,
    log: [],
    skillCooldowns: {},
    hasPrevision,
    pendingEvade: false,
    selectedTarget: null,
    teamBattle: true,
    allyStatuses,
    enemyStatuses,
  };

  bus.emit('battle:started', {
    allies,
    enemies,
    teamBattle: true,
  });

  _log(`── 第 1 回合 ──`);
  _notifyUpdate();
}

function buildTurnOrderFrom(allies: BattleUnit[], enemies: BattleEnemyUnit[]): BattleUnit[] {
  const maxLen = Math.max(allies.length, enemies.length);
  const order: BattleUnit[] = [];
  for (let i = 0; i < maxLen; i++) {
    if (i < allies.length) order.push(allies[i]!);
    if (i < enemies.length) order.push(enemies[i]!);
  }
  return order;
}

/** 获取当前行动单位 */
export function getCurrentUnit(): BattleUnit | null {
  if (!_ctx) return null;
  return _ctx.turnOrder[_ctx.currentUnitIndex] ?? null;
}

/** 获取可选的敌方目标列表 */
export function getTargetableEnemies(): BattleEnemyUnit[] {
  return getAliveEnemies();
}

/** 玩家使用技能 */
export function playerUseSkill(skillId: SkillId, targetId?: string): void {
  if (!_ctx || _ctx.state !== 'player_turn') return;
  const currentUnit = getCurrentUnit();
  if (!currentUnit || !currentUnit.isPlayer) return;

  const sk = SKILLS[skillId];
  if (!sk) return;

  if ((_ctx.skillCooldowns[skillId] ?? 0) > 0) {
    _log(`⏳ ${sk.name} 冷却中（还剩 ${_ctx.skillCooldowns[skillId]} 回合）`);
    return;
  }
  if (currentUnit.mp < sk.mp) {
    _log(`💧 内力不足，无法使用 ${sk.name}（需要 ${sk.mp} 点）`);
    return;
  }

  _ctx.state = 'animating';
  currentUnit.mp -= sk.mp;
  if (sk.cooldown > 0) _ctx.skillCooldowns[skillId] = sk.cooldown;

  // 确定目标：辅助/自我技能不需要敌方目标
  let target: BattleUnit | null = null;
  const isSelfTarget = sk.type === 'support' && sk.target === 'self';

  if (!isSelfTarget) {
    if (targetId) {
      target = _ctx.enemies.find(e => e.id === targetId && e.alive) ?? null;
    }
    if (!target) {
      target = getAliveEnemies()[0] ?? null;
    }
    if (!target) { _advanceTurn(); return; }
  }

  if (sk.type === 'passive') {
    _log(`${sk.icon} 触发被动：${sk.name}`);
  } else if (sk.type === 'support' && sk.target === 'self') {
    if (sk.healPct > 0) {
      const heal = Math.floor(currentUnit.maxHp * sk.healPct);
      currentUnit.hp = Math.min(currentUnit.maxHp, currentUnit.hp + heal);
      _log(`💚 ${sk.name}：恢复 <span class="log-heal">${heal}</span> 点气血`);
    }
    if (sk.effect) {
      const selfStatuses = _getUnitStatuses(currentUnit);
      applyStatus(selfStatuses, sk.effect);
      _setUnitStatuses(currentUnit, selfStatuses);
      const buffDesc: Partial<Record<string, string>> = {
        buff_atk:  `攻击力 +${sk.effect.value}`,
        def_boost: `防御力 +${sk.effect.value}`,
        evade:     `闪避率 +${Math.floor(sk.effect.value * 100)}%`,
      };
      _log(`✨ ${sk.name}：获得增益「${buffDesc[sk.effect.type] ?? sk.effect.type}」持续 ${sk.effect.duration} 回合`);
    }
  } else if (sk.type === 'control' || sk.type === 'attack') {
    const atkBuff  = getStatusValue(_getUnitStatuses(currentUnit), 'buff_atk');
    const realAtk  = currentUnit.atk + atkBuff;
    const targetStatuses = _getUnitStatuses(target);
    const defDebuff = getStatusValue(targetStatuses, 'weaken_def');
    const enemyDef  = Math.max(0, target.def - defDebuff);

    for (let h = 0; h < (sk.hit || 1); h++) {
      if (sk.hit === 0) break;
      const { damage, crit } = calcDamage(realAtk, enemyDef, sk.powerMul, sk.defPen, currentUnit.crit);
      target.hp = Math.max(0, target.hp - damage);
      _log(
        `${sk.icon} ${sk.name}${sk.hit > 1 ? ` 第${h + 1}击` : ''}：` +
        `对 ${target.name} 造成 <span class="log-dmg">${damage}</span> 点伤害` +
        `${crit ? ' <span class="log-crit">暴击！</span>' : ''}`,
      );
    }

    if (target.hp <= 0) {
      target.alive = false;
      _log(`💀 ${target.name} 倒下！`);
    }

    if (sk.effect && target.alive) {
      if (Math.random() < effectProcRate(sk.effect.type)) {
        applyStatus(targetStatuses, sk.effect);
        _setUnitStatuses(target, targetStatuses);
        const effectDesc: Partial<Record<string, string>> = {
          stun:         `😵 ${target.name} 陷入眩晕！`,
          knockback:    `💥 ${target.name} 被击飞！`,
          poison:       `☠️ ${target.name} 中毒（${sk.effect.value}/回合）`,
          strong_poison: `☠️ ${target.name} 中剧毒（${sk.effect.value}/回合）`,
          weaken_def:   `🔻 ${target.name} 防御降低 ${sk.effect.value} 点`,
        };
        _log(effectDesc[sk.effect.type] ?? `✨ 附加效果：${sk.effect.type}`);
      }
    }
  }

  _notifyUpdate();

  // 检查战斗是否结束
  if (_ctx.enemies.every(e => !e.alive)) {
    setTimeout(() => _endBattle('win'), 600);
    return;
  }
  setTimeout(() => _advanceTurn(), 600);
}

/** 普通攻击 */
export function playerBasicAttack(targetId?: string): void {
  if (!_ctx || _ctx.state !== 'player_turn') return;
  const currentUnit = getCurrentUnit();
  if (!currentUnit || !currentUnit.isPlayer) return;

  _ctx.state = 'animating';

  let target: BattleUnit | null = null;
  if (targetId) {
    target = _ctx.enemies.find(e => e.id === targetId && e.alive) ?? null;
  }
  if (!target) {
    target = getAliveEnemies()[0] ?? null;
  }
  if (!target) { _advanceTurn(); return; }

  const atkBuff  = getStatusValue(_getUnitStatuses(currentUnit), 'buff_atk');
  const realAtk  = currentUnit.atk + atkBuff;
  const targetStatuses = _getUnitStatuses(target);
  const defDebuff = getStatusValue(targetStatuses, 'weaken_def');
  const enemyDef  = Math.max(0, target.def - defDebuff);

  const { damage, crit } = calcDamage(realAtk, enemyDef, 1.0, 0.7, currentUnit.crit);
  target.hp = Math.max(0, target.hp - damage);
  _log(
    `👊 普通攻击：对 ${target.name} 造成 <span class="log-dmg">${damage}</span> 点伤害` +
    `${crit ? ' <span class="log-crit">暴击！</span>' : ''}`,
  );

  if (target.hp <= 0) {
    target.alive = false;
    _log(`💀 ${target.name} 倒下！`);
  }

  _notifyUpdate();

  if (_ctx.enemies.every(e => !e.alive)) {
    setTimeout(() => _endBattle('win'), 600);
    return;
  }
  setTimeout(() => _advanceTurn(), 600);
}

/** 使用药品 */
export function useHpPotion(): void {
  if (!_ctx || _ctx.state !== 'player_turn') return;
  const currentUnit = getCurrentUnit();
  if (!currentUnit || !currentUnit.isPlayer) return;

  const player = getPlayer();
  const idx = player.inventory.findIndex(i => i.id === 'hp_potion');
  if (idx < 0) return;

  const heal = 50;
  currentUnit.hp = Math.min(currentUnit.maxHp, currentUnit.hp + heal);

  const updatedInventory = player.inventory
    .map((item, i) => i === idx ? { ...item, count: item.count - 1 } : item)
    .filter(item => item.count > 0);
  setPlayer({ ...player, inventory: updatedInventory });

  _log(`🔴 服下红药丸，恢复 <span class="log-heal">${heal}</span> 点气血`);
  _notifyUpdate();
}