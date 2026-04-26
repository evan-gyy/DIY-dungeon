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

// ── module-level battle context (null when no battle is active) ──
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
  bus.emit('battle:updated', { round: _ctx.round });
}

// ── battle lifecycle ──

function _endBattle(result: BattleResult): void {
  if (!_ctx) return;
  _ctx.state = result === 'win' ? 'win' : 'lose';

  const player = getPlayer();

  // scriptedDefeat: losing this battle advances story instead of game-over
  if (result !== 'win' && _ctx.enemy.scriptedDefeat) {
    const updated = { ...player, hp: 1, mp: 0 };
    setPlayer(updated);
    saveGame(updated);
    bus.emit('story:battle-end', { result: 'lose' });
    return;
  }

  if (result === 'win') {
    const e = _ctx.enemy;
    const expGain = e.reward.exp;
    const goldGain = e.reward.gold;

    // loot rolls
    const loot: ItemId[] = [];
    let updatedInventory = [...player.inventory];
    for (const entry of e.loot) {
      if (Math.random() < entry.chance) {
        loot.push(entry.id);
        const template = ITEMS[entry.id];
        if (template) {
          const existing = updatedInventory.find(i => i.id === entry.id);
          if (existing) {
            updatedInventory = updatedInventory.map(i =>
              i.id === entry.id ? { ...i, count: i.count + 1 } : i,
            );
          } else {
            updatedInventory.push({ ...template, count: 1 });
          }
        }
      }
    }

    // wudang quest flags
    const wudangMap: Partial<Record<number, 'wudangGateCleared' | 'wudangMidCleared' | 'wudangElderCleared'>> = {
      10: 'wudangGateCleared',
      11: 'wudangMidCleared',
      12: 'wudangElderCleared',
    };
    const wudangFlag = wudangMap[e.tier];

    let updated = {
      ...player,
      hp: _ctx.player.hp,
      mp: _ctx.player.mp,
      exp: player.exp + expGain,
      gold: player.gold + goldGain,
      inventory: updatedInventory,
      ...(wudangFlag && !player[wudangFlag] ? { [wudangFlag]: true } : {}),
    };

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
    bus.emit('battle:end', { result: 'win', expGain, goldGain, loot });
  } else {
    const updated = { ...player, hp: 1, mp: 0 };
    setPlayer(updated);
    saveGame(updated);
    bus.emit('battle:end', { result: 'lose', expGain: 0, goldGain: 0, loot: [] });
  }
}

function _endPlayerTurn(): void {
  if (!_ctx) return;
  // decrement all active cooldowns
  for (const key of Object.keys(_ctx.skillCooldowns) as SkillId[]) {
    const cd = _ctx.skillCooldowns[key] ?? 0;
    if (cd > 0) _ctx.skillCooldowns[key] = cd - 1;
  }
  _ctx.state = 'enemy_turn';
  setTimeout(() => _enemyTurn(), 400);
}

function _enemyTurn(): void {
  if (!_ctx || _ctx.state !== 'enemy_turn') return;

  if (hasStatus(_ctx.enemyStatus, 'stun') || hasStatus(_ctx.enemyStatus, 'knockback')) {
    _log(`😵 ${_ctx.enemy.name} 被控制，跳过本回合！`);
    _startPlayerTurn();
    return;
  }

  const chosen = selectEnemyAction(_ctx.enemy);

  if (chosen.hit === 0) {
    if (chosen.effect?.type === 'self_heal') {
      const heal = Math.floor(_ctx.enemy.maxHp * chosen.effect.value);
      _ctx.enemy.hp = Math.min(_ctx.enemy.maxHp, _ctx.enemy.hp + heal);
      _log(`💚 ${_ctx.enemy.name} 使用「${chosen.name}」，恢复 <span class="log-heal">${heal}</span> 点气血`);
    } else if (chosen.effect) {
      applyStatus(_ctx.enemyStatus, chosen.effect);
      _log(`✨ ${_ctx.enemy.name} 使用「${chosen.name}」获得增益`);
    }
  } else {
    const defDebuff   = getStatusValue(_ctx.playerStatus, 'weaken_def');
    const defBoostBuf = getStatusValue(_ctx.playerStatus, 'def_boost');
    const realPlayerDef = Math.max(0, _ctx.player.def - defDebuff) + defBoostBuf;

    for (let h = 0; h < chosen.hit; h++) {
      const evadeRate = getStatusValue(_ctx.playerStatus, 'evade');
      if (evadeRate > 0 && Math.random() < evadeRate) {
        _log(`🌀 你身法灵动，闪避了「${chosen.name}」！`);
        removeStatus(_ctx.playerStatus, 'evade');
        continue;
      }
      const { damage, crit } = calcDamage(_ctx.enemy.atk, realPlayerDef, chosen.powerMul, chosen.defPen, 0);
      _ctx.player.hp = Math.max(0, _ctx.player.hp - damage);
      _log(
        `${chosen.icon} ${_ctx.enemy.name} 使用「${chosen.name}」${chosen.hit > 1 ? ` 第${h + 1}击` : ''}：` +
        `对你造成 <span class="log-dmg">${damage}</span> 点伤害` +
        `${crit ? ' <span class="log-crit">暴击！</span>' : ''}`,
      );
    }

    if (chosen.effect && chosen.effect.type !== 'self_heal') {
      if (Math.random() < effectProcRate(chosen.effect.type)) {
        applyStatus(_ctx.playerStatus, chosen.effect);
        const effectDesc: Partial<Record<string, string>> = {
          stun:         `😵 你陷入眩晕！`,
          poison:       `☠️ 你中毒（${chosen.effect.value}/回合）`,
          strong_poison: `☠️ 你中剧毒（${chosen.effect.value}/回合）`,
          weaken_def:   `🔻 你的防御降低 ${chosen.effect.value} 点`,
        };
        _log(effectDesc[chosen.effect.type] ?? '附加效果触发');
      }
    }
  }

  _notifyUpdate();

  if (_ctx.player.hp <= 0) {
    setTimeout(() => _endBattle('lose'), 600);
    return;
  }
  setTimeout(() => _startPlayerTurn(), 500);
}

function _startPlayerTurn(): void {
  if (!_ctx) return;
  _ctx.round++;
  _ctx.state = 'player_turn';

  const pTick = tickStatus(_ctx.player, _ctx.playerStatus, true);
  pTick.logs.forEach(l => _log(l));
  if (pTick.killed) { _endBattle('lose'); return; }

  const eTick = tickStatus(_ctx.enemy, _ctx.enemyStatus, false);
  eTick.logs.forEach(l => _log(l));
  if (eTick.killed) { _endBattle('win'); return; }

  _notifyUpdate();
  _log(`── 第 ${_ctx.round} 回合 ──`);
}

// ============================================================
//  Public API
// ============================================================

export function initBattle(enemyId?: EnemyId): void {
  const player = getPlayer();
  const template = enemyId ? ENEMIES[enemyId] : getRandomEnemy(1);
  if (!template) throw new Error(`Unknown enemy: ${String(enemyId)}`);

  // Deep-copy enemy template; add fields BattleUnit requires that enemies don't have
  const enemy: BattleEnemyUnit = {
    ...(JSON.parse(JSON.stringify(template)) as typeof template),
    mp: 0,
    maxMp: 0,
    crit: 0,
  };

  const passiveSkills = player.skills.filter(id => SKILLS[id]?.type === 'passive');

  const playerUnit: BattleUnit = {
    name: player.name,
    hp: player.hp,
    maxHp: player.maxHp,
    mp: player.mp,
    maxMp: player.maxMp,
    atk: player.atk,
    def: player.def,
    agi: player.agi,
    crit: player.crit,
    charImg: player.charImg,
  };

  const playerStatus: StatusEffect[] = [];
  const enemyStatus: StatusEffect[] = [];

  // passive skills take effect immediately
  if (passiveSkills.includes('zixiao')) {
    applyStatus(playerStatus, { type: 'regen_mp', value: 6, duration: 999 });
  }
  if (passiveSkills.includes('72_arts')) {
    applyStatus(playerStatus, { type: 'def_boost', value: 20, duration: 999 });
  }
  const hasPrevision = passiveSkills.includes('yi_li_xin_jing');
  if (hasPrevision) {
    applyStatus(playerStatus, { type: 'regen_mp_pct', value: 10, duration: 999 });
  }

  _ctx = {
    state: 'player_turn',
    player: playerUnit,
    enemy,
    round: 0,
    log: [],
    skillCooldowns: {},
    playerStatus,
    enemyStatus,
    hasPrevision,
    pendingEvade: false,
  };

  bus.emit('battle:started', {
    playerName: player.name,
    playerImg: player.charImg,
    enemyName: enemy.name,
    enemyIcon: enemy.icon ?? '',
    enemyTier: enemy.tier,
  });

  _startPlayerTurn();
}

export function playerUseSkill(skillId: SkillId): void {
  if (!_ctx || _ctx.state !== 'player_turn') return;
  const sk = SKILLS[skillId];
  if (!sk) return;

  if ((_ctx.skillCooldowns[skillId] ?? 0) > 0) {
    _log(`⏳ ${sk.name} 冷却中（还剩 ${_ctx.skillCooldowns[skillId]} 回合）`);
    return;
  }
  if (_ctx.player.mp < sk.mp) {
    _log(`💧 内力不足，无法使用 ${sk.name}（需要 ${sk.mp} 点）`);
    return;
  }
  if (hasStatus(_ctx.playerStatus, 'stun') || hasStatus(_ctx.playerStatus, 'knockback')) {
    _log(`😵 你被控制，跳过本回合行动！`);
    _endPlayerTurn();
    return;
  }

  _ctx.state = 'animating';
  _ctx.player.mp -= sk.mp;
  if (sk.cooldown > 0) _ctx.skillCooldowns[skillId] = sk.cooldown;

  if (sk.type === 'passive') {
    _log(`${sk.icon} 触发被动：${sk.name}`);
  } else if (sk.type === 'support' && sk.target === 'self') {
    if (sk.healPct > 0) {
      const heal = Math.floor(_ctx.player.maxHp * sk.healPct);
      _ctx.player.hp = Math.min(_ctx.player.maxHp, _ctx.player.hp + heal);
      _log(`💚 ${sk.name}：恢复 <span class="log-heal">${heal}</span> 点气血`);
    }
    if (sk.effect) {
      applyStatus(_ctx.playerStatus, sk.effect);
      const buffDesc: Partial<Record<string, string>> = {
        buff_atk:  `攻击力 +${sk.effect.value}`,
        def_boost: `防御力 +${sk.effect.value}`,
        evade:     `闪避率 +${Math.floor(sk.effect.value * 100)}%`,
      };
      _log(`✨ ${sk.name}：获得增益「${buffDesc[sk.effect.type] ?? sk.effect.type}」持续 ${sk.effect.duration} 回合`);
    }
  } else if (sk.type === 'control' || sk.type === 'attack') {
    const atkBuff  = getStatusValue(_ctx.playerStatus, 'buff_atk');
    const realAtk  = _ctx.player.atk + atkBuff;
    const defDebuff = getStatusValue(_ctx.enemyStatus, 'weaken_def');
    const enemyDef  = Math.max(0, _ctx.enemy.def - defDebuff);

    for (let h = 0; h < (sk.hit || 1); h++) {
      if (sk.hit === 0) break;
      const { damage, crit } = calcDamage(realAtk, enemyDef, sk.powerMul, sk.defPen, _ctx.player.crit);
      _ctx.enemy.hp = Math.max(0, _ctx.enemy.hp - damage);
      _log(
        `${sk.icon} ${sk.name}${sk.hit > 1 ? ` 第${h + 1}击` : ''}：` +
        `对 ${_ctx.enemy.name} 造成 <span class="log-dmg">${damage}</span> 点伤害` +
        `${crit ? ' <span class="log-crit">暴击！</span>' : ''}`,
      );
    }

    if (sk.effect) {
      if (Math.random() < effectProcRate(sk.effect.type)) {
        applyStatus(_ctx.enemyStatus, sk.effect);
        const effectDesc: Partial<Record<string, string>> = {
          stun:         `😵 ${_ctx.enemy.name} 陷入眩晕！`,
          knockback:    `💥 ${_ctx.enemy.name} 被击飞！`,
          poison:       `☠️ ${_ctx.enemy.name} 中毒（${sk.effect.value}/回合）`,
          strong_poison: `☠️ ${_ctx.enemy.name} 中剧毒（${sk.effect.value}/回合）`,
          weaken_def:   `🔻 ${_ctx.enemy.name} 防御降低 ${sk.effect.value} 点`,
        };
        _log(effectDesc[sk.effect.type] ?? `✨ 附加效果：${sk.effect.type}`);
      }
    }
  }

  _notifyUpdate();

  if (_ctx.enemy.hp <= 0) {
    setTimeout(() => _endBattle('win'), 600);
    return;
  }
  setTimeout(() => _endPlayerTurn(), 700);
}

export function playerBasicAttack(): void {
  if (!_ctx || _ctx.state !== 'player_turn') return;
  if (hasStatus(_ctx.playerStatus, 'stun') || hasStatus(_ctx.playerStatus, 'knockback')) {
    _log(`😵 你被控制，跳过本回合行动！`);
    _endPlayerTurn();
    return;
  }
  _ctx.state = 'animating';

  const atkBuff  = getStatusValue(_ctx.playerStatus, 'buff_atk');
  const realAtk  = _ctx.player.atk + atkBuff;
  const defDebuff = getStatusValue(_ctx.enemyStatus, 'weaken_def');
  const enemyDef  = Math.max(0, _ctx.enemy.def - defDebuff);

  const { damage, crit } = calcDamage(realAtk, enemyDef, 1.0, 0.7, _ctx.player.crit);
  _ctx.enemy.hp = Math.max(0, _ctx.enemy.hp - damage);
  _log(
    `👊 普通攻击：对 ${_ctx.enemy.name} 造成 <span class="log-dmg">${damage}</span> 点伤害` +
    `${crit ? ' <span class="log-crit">暴击！</span>' : ''}`,
  );
  _notifyUpdate();

  if (_ctx.enemy.hp <= 0) { setTimeout(() => _endBattle('win'), 600); return; }
  setTimeout(() => _endPlayerTurn(), 600);
}

export function useHpPotion(): void {
  if (!_ctx || _ctx.state !== 'player_turn') return;
  const player = getPlayer();
  const idx = player.inventory.findIndex(i => i.id === 'hp_potion');
  if (idx < 0) return;

  const heal = 50;
  _ctx.player.hp = Math.min(_ctx.player.maxHp, _ctx.player.hp + heal);

  const updatedInventory = player.inventory
    .map((item, i) => i === idx ? { ...item, count: item.count - 1 } : item)
    .filter(item => item.count > 0);
  setPlayer({ ...player, inventory: updatedInventory });

  _log(`🔴 服下红药丸，恢复 <span class="log-heal">${heal}</span> 点气血`);
  _notifyUpdate();
}
