import type { StatusEffect, StatusType, BattleUnit } from '../data/types';

// 添加或刷新状态效果
export function applyStatus(statusList: StatusEffect[], effect: StatusEffect): void {
  const exist = statusList.find(x => x.type === effect.type);
  if (exist) {
    exist.duration = Math.max(exist.duration, effect.duration);
    exist.value = Math.max(exist.value, effect.value);
  } else {
    statusList.push({ ...effect });
  }
}

export function removeStatus(statusList: StatusEffect[], type: StatusType): void {
  const idx = statusList.findIndex(x => x.type === type);
  if (idx >= 0) statusList.splice(idx, 1);
}

export function hasStatus(statusList: StatusEffect[], type: StatusType): boolean {
  return statusList.some(x => x.type === type);
}

export function getStatusValue(statusList: StatusEffect[], type: StatusType): number {
  return statusList.find(x => x.type === type)?.value ?? 0;
}

// 回合开始时处理所有持续效果
export interface TickResult {
  logs: string[];
  killed: boolean;
}

export function tickStatus(
  unit: BattleUnit,
  statusList: StatusEffect[],
  isPlayer: boolean,
): TickResult {
  const logs: string[] = [];
  let killed = false;

  for (let i = statusList.length - 1; i >= 0; i--) {
    const s = statusList[i];
    if (!s) continue;

    if (s.type === 'poison' || s.type === 'strong_poison') {
      const dmg = s.value;
      unit.hp = Math.max(0, unit.hp - dmg);
      logs.push(`☠️ ${unit.name} 中毒受到 <span class="log-dmg">${dmg}</span> 点毒伤`);
      if (unit.hp <= 0) killed = true;
    }

    if (s.type === 'regen_mp') {
      const val = s.value;
      unit.mp = Math.min(unit.maxMp, unit.mp + val);
      logs.push(`💧 ${unit.name} 恢复 <span class="log-heal">${val}</span> 点内力`);
    }

    if (s.type === 'regen_mp_pct') {
      const val = Math.max(1, Math.floor(unit.maxMp * s.value / 100));
      unit.mp = Math.min(unit.maxMp, unit.mp + val);
      logs.push(`♟️ ${unit.name} 弈理心经恢复 <span class="log-heal">${val}</span> 点内力`);
    }

    if (s.type === 'self_heal') {
      const healAmt = Math.max(1, Math.floor(unit.maxHp * s.value));
      unit.hp = Math.min(unit.maxHp, unit.hp + healAmt);
      logs.push(`💚 ${unit.name} 运功疗伤，恢复 <span class="log-heal">${healAmt}</span> 点气血`);
    }

    s.duration--;
    if (s.duration <= 0) {
      statusList.splice(i, 1);
    }
  }

  return { logs, killed };
}

// 获取状态效果触发概率
export function effectProcRate(type: StatusType): number {
  const rates: Partial<Record<StatusType, number>> = {
    stun: 0.7,
    knockback: 0.6,
    poison: 0.85,
    strong_poison: 0.9,
    weaken_def: 0.9,
    buff_atk: 1.0,
    def_boost: 1.0,
    evade: 1.0,
    regen_mp: 1.0,
    regen_mp_pct: 1.0,
    self_heal: 1.0,
  };
  return rates[type] ?? 0.8;
}