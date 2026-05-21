// ============================================================
//  src/systems/StealSkillSystem.ts — 偷师系统
// ============================================================
//  玩家可在其他宗门据点尝试偷学该门派的技能。
//  成功则获得技能，失败/被发现则承受惩罚。
// ============================================================

import type { PlayerState } from '../data/types';
import type { SectId } from '../data/types';
import type { SkillId } from '../data/types';
import type { StealSkillResult } from '../data/sandboxTypes';
import { SKILLS } from '../data/skills';
import { SECTS } from '../data/sects';
import { isSectBase } from './SectManagement';
import { getPlayer, setPlayer } from '../state/GameState';

// ──── 配置 ────

const CFG = {
  baseSuccessRate: 0.25,
  agiPerPoint: 0.005,
  levelPerLevel: 0.008,
  baseDetectionRate: 0.45,
  agiDetectionReduction: 0.004,
  maxSkillQuality: 'advanced' as const,
  trustLossOnDetected: 20,
  trustLossOnSuspicious: 6,
  cooldownMonths: 3,
  minPlayerLevel: 5,
  maxStealableSkills: 25,
};

// ──── 核心逻辑 ────

/** 获取某个宗门可偷学的技能列表 */
export function getStealableSkills(targetSect: SectId): SkillId[] {
  const pool: SkillId[] = [];
  for (const [id, skill] of Object.entries(SKILLS)) {
    if (skill.sect !== targetSect) continue;
    if (skill.cost.exp === 0) continue;
    pool.push(id as SkillId);
  }
  return pool.slice(0, CFG.maxStealableSkills);
}

/** 获取偷师成功率 */
export function getStealSuccessRate(player: PlayerState): number {
  const agiBonus = (player.agi ?? 10) * CFG.agiPerPoint;
  const levelBonus = (player.level ?? 1) * CFG.levelPerLevel;
  return Math.min(0.85, CFG.baseSuccessRate + agiBonus + levelBonus);
}

/** 获取被发现概率 */
export function getDetectionRate(player: PlayerState): number {
  const agiReduction = (player.agi ?? 10) * CFG.agiDetectionReduction;
  return Math.max(0.10, CFG.baseDetectionRate - agiReduction);
}

/** 检查是否可以偷师 */
export function canAttemptSteal(
  player: PlayerState,
  targetSect: SectId,
): { allowed: boolean; reason: string } {
  if (!player.sect || player.sect === 'none') {
    return { allowed: false, reason: '无门无派的散修无处可偷。' };
  }
  if (targetSect === 'none' || targetSect === 'imperial_court' || targetSect === 'rebels') {
    return { allowed: false, reason: '朝廷和叛军没有武学可偷。' };
  }
  if (targetSect === player.sect) {
    return { allowed: false, reason: '不能偷自己宗门的技能。' };
  }
  if ((player.level ?? 1) < CFG.minPlayerLevel) {
    return { allowed: false, reason: `等级不足（需 ≥ ${CFG.minPlayerLevel}）。` };
  }

  const pool = getStealableSkills(targetSect);
  if (pool.length === 0) {
    return { allowed: false, reason: `${SECTS[targetSect]?.name ?? targetSect}没有可偷学的技能。` };
  }

  const playerSkills = new Set(player.skills ?? []);
  const unlearned = pool.filter(s => !playerSkills.has(s));
  if (unlearned.length === 0) {
    return { allowed: false, reason: `你已经学会了${SECTS[targetSect]?.name ?? targetSect}所有可偷学的技能。` };
  }

  // 冷却检查
  const cooldownKey = `steal_${targetSect}`;
  const cooldowns = player.stealCooldowns ?? {};
  const lastAttempt = cooldowns[cooldownKey] ?? 0;
  const currentMonth = player.gameMonth ?? 0;
  if (currentMonth - lastAttempt < CFG.cooldownMonths && lastAttempt > 0) {
    const remaining = CFG.cooldownMonths - (currentMonth - lastAttempt);
    return { allowed: false, reason: `上次偷师${SECTS[targetSect]?.name ?? targetSect}距今不足${CFG.cooldownMonths}个月（还需等${remaining}个月）。` };
  }

  return { allowed: true, reason: '' };
}

/** 执行偷师 */
export function executeSteal(
  player: PlayerState,
  targetSect: SectId,
): StealSkillResult {
  const check = canAttemptSteal(player, targetSect);
  if (!check.allowed) {
    return { success: false, message: check.reason, detected: false };
  }

  const pool = getStealableSkills(targetSect);
  const playerSkills = new Set(player.skills ?? []);
  const unlearned = pool.filter(s => !playerSkills.has(s));
  if (unlearned.length === 0) {
    return { success: false, message: '没有可偷学的技能。', detected: false };
  }

  const successRate = getStealSuccessRate(player);
  const detectionRate = getDetectionRate(player);
  const roll = Math.random();
  const detectRoll = Math.random();

  const success = roll < successRate;
  const detected = detectRoll < detectionRate;
  const sectName = SECTS[targetSect]?.name ?? targetSect;

  const chosenSkill = unlearned[Math.floor(Math.random() * unlearned.length)]!;
  const skillName = SKILLS[chosenSkill]?.name ?? chosenSkill;

  // 更新冷却
  const cooldownKey = `steal_${targetSect}`;
  const stealCooldowns = { ...(player.stealCooldowns ?? {}), [cooldownKey]: player.gameMonth ?? 0 };

  if (success && !detected) {
    const newSkills = [...(player.skills ?? []), chosenSkill];
    const newStealCount = (player.stealSuccessCount ?? 0) + 1;
    setPlayer({ ...player, skills: newSkills, stealCooldowns, stealSuccessCount: newStealCount });
    return {
      success: true,
      skillId: chosenSkill,
      message: `偷师成功！神不知鬼不觉地学会了${sectName}的「${skillName}」。`,
      detected: false,
    };
  }

  if (success && detected) {
    const newSkills = [...(player.skills ?? []), chosenSkill];
    const trustLoss = CFG.trustLossOnDetected;
    const newStealCount = (player.stealSuccessCount ?? 0) + 1;
    applyTrustPenalty(targetSect, trustLoss);
    setPlayer({ ...player, skills: newSkills, stealCooldowns, stealSuccessCount: newStealCount });
    return {
      success: true,
      skillId: chosenSkill,
      message: `虽然偷学到了${sectName}的「${skillName}」，但被发现了！${sectName}对你的信任下降。`,
      detected: true,
      penalty: { hostilityIncrease: trustLoss, bountyAmount: 500 },
    };
  }

  if (!success && detected) {
    const trustLoss = CFG.trustLossOnDetected;
    applyTrustPenalty(targetSect, trustLoss);
    setPlayer({ ...player, stealCooldowns });
    return {
      success: false,
      message: `偷师失败，被${sectName}弟子当场抓获！${sectName}对你的信任大幅下降。`,
      detected: true,
      penalty: {
        hostilityIncrease: trustLoss,
        bountyAmount: 800,
        expelledFromSect: Math.random() < 0.3 && player.sect !== targetSect,
      },
    };
  }

  // 失败但未被发现
  const trustLoss = CFG.trustLossOnSuspicious;
  applyTrustPenalty(targetSect, trustLoss);
  setPlayer({ ...player, stealCooldowns });
  return {
    success: false,
    message: `偷师未果，虽然没被当场抓获，但${sectName}弟子起了疑心。`,
    detected: false,
    penalty: { hostilityIncrease: trustLoss },
  };
}

// ──── 辅助 ────

/** 降低与目标宗门的信任度（通过 factionRelations） */
function applyTrustPenalty(sectId: SectId, amount: number): void {
  const p = getPlayer();
  if (!p.sect) return;
  const relations = { ...p.factionRelations };
  const playerSectRel = { ...(relations[p.sect] ?? {}) };
  const current = playerSectRel[sectId];
  const newTrust = Math.max(1, (current?.trust ?? 50) - amount);
  playerSectRel[sectId] = {
    relation: current?.relation ?? 'neutral',
    trust: newTrust,
    lastEvent: `偷师被抓`,
    lastEventTurn: p.gameMonth ?? 0,
  };
  relations[p.sect] = playerSectRel;
  setPlayer({ ...p, factionRelations: relations });
}

/** 检查当前地点是否可以偷师 */
export function getStealTargetAtLocation(locationId: string): SectId | undefined {
  const sectId = isSectBase(locationId as any);
  if (!sectId) return undefined;
  const p = getPlayer();
  if (sectId === p.sect) return undefined;
  if (sectId === 'none' || sectId === 'imperial_court' || sectId === 'rebels') return undefined;
  return sectId;
}
