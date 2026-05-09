import { getPlayer, setPlayer, getDialogNpcId, setDialogNpcId, getDialogNode, setDialogNode, getCampTab } from '../state/GameState';
import { saveGame } from '../state/SaveSystem';
import { NPC_DIALOGS } from '../data/npcs';
import { SKILLS } from '../data/skills';
import { showToast } from '../ui/toast';
import { showScreen } from './ScreenManager';
import { renderCampTopbar } from './Camp';
import type { NpcId, SkillId } from '../data/types';
import {
  canRecommend, executeRecommend,
  canRecruit, executeRecruit,
} from '../systems/NPCManager';
import { getNpcStats } from '../systems/NpcBehavior';

export function openDialog(npcId: NpcId): void {
  const npcData = NPC_DIALOGS[npcId];
  if (!npcData) return;
  setDialogNpcId(npcId);

  let startNode = npcData.dialogs['start'] ? 'start' : Object.keys(npcData.dialogs)[0]!;
  const p = getPlayer();
  if (npcId === 'wudang_zhangsan') {
    if (p.wudangElderCleared)    startNode = 'mission_complete';
    else if (p.wudangMissionAccepted) startNode = 'mission_progress';
    else if (p.tutorialDone)     startNode = 'mission_offer';
  }
  setDialogNode(startNode);
  showScreen('dialog');
  renderDialog(npcId, startNode);
}

function renderDialog(npcId: NpcId, nodeId: string): void {
  const npcData = NPC_DIALOGS[npcId];
  if (!npcData) return;
  const node = npcData.dialogs[nodeId];
  if (!node) { closeDialog(); return; }
  setDialogNode(nodeId);

  const img = document.getElementById('dialog-npc-img') as HTMLImageElement | null;
  if (img) { img.src = npcData.img; img.onerror = () => { img.style.display = 'none'; }; }
  const speakerEl = document.getElementById('dialog-speaker');
  if (speakerEl) speakerEl.textContent = npcData.name;

  const contentEl = document.getElementById('dialog-content');
  if (contentEl) {
    const p = getPlayer();
    const rawText = node.text ?? '';
    const rendered = rawText.replace(
      /\$\{G\.player\?\.(\w+)\s*\?\s*'([^']*)'\s*:\s*'([^']*)'\}/g,
      (_: string, flag: string, truthy: string, falsy: string) =>
        (p as unknown as Record<string, unknown>)[flag] ? truthy : falsy,
    );
    typewriter(contentEl, rendered, 35, () => {});
  }

  renderChoices(npcId, nodeId);
}

function renderChoices(npcId: NpcId, nodeId: string): void {
  const npcData = NPC_DIALOGS[npcId];
  if (!npcData) return;
  const node = npcData.dialogs[nodeId];
  if (!node) return;

  const box = document.getElementById('dialog-choices');
  if (!box) return;
  box.innerHTML = '';

  for (const c of node.choices) {
    const btn = document.createElement('button');
    btn.className = 'dialog-choice-btn';
    btn.textContent = c.text;
    btn.addEventListener('click', () => {
      if (c.effect) applyDialogEffect(c.effect);
      if (c.next) renderDialog(npcId, c.next);
      else closeDialog();
    });
    box.appendChild(btn);
  }
}

function applyDialogEffect(effect: string): void {
  const p = getPlayer();

  // 🆕 沙盒：对话招募 NPC（格式：recruit:<npcDbId>）
  if (effect.startsWith('recruit:')) {
    const npcDbId = effect.slice('recruit:'.length);
    const stats = getNpcStats(npcDbId);
    const affection = p.npcAffection?.[npcDbId] ?? 0;
    if (stats) {
      const check = canRecruit(p, stats, affection);
      if (check.success) {
        const result = executeRecruit(p, npcDbId);
        const updated = {
          ...p,
          npcCollection: { ...p.npcCollection, ...result },
        };
        setPlayer(updated);
        saveGame(updated);
        showToast(`${stats.name}已成为你的随从！`);
      } else {
        showToast(check.message);
      }
    }
    return;
  }

  // 🆕 沙盒：对话推荐入宗（格式：recommend:<npcDbId>）
  if (effect.startsWith('recommend:')) {
    const npcDbId = effect.slice('recommend:'.length);
    const stats = getNpcStats(npcDbId);
    const affection = p.npcAffection?.[npcDbId] ?? 0;
    if (stats) {
      const check = canRecommend(p, stats, affection);
      if (check.success) {
        const result = executeRecommend(p, stats);
        const updated = {
          ...p,
          npcDatabase: { ...p.npcDatabase, [npcDbId]: result.npc },
          sectContribution: (p.sectContribution ?? 0) + result.contributionGain,
        };
        setPlayer(updated);
        saveGame(updated);
        showToast(`${stats.name}已加入${getSectShortName(p.sect)}！贡献 +${result.contributionGain}`);
      } else {
        showToast(check.message);
      }
    }
    return;
  }

  switch (effect) {
    case 'acceptMission': {
      const updated = { ...p, wudangMissionAccepted: true };
      setPlayer(updated);
      saveGame(updated);
      showToast('武当山任务已接受！');
      break;
    }
    case 'claimReward': {
      const skills = p.skills.includes('taiji') ? p.skills : [...p.skills, 'taiji' as SkillId];
      const updated = { ...p, skills, gold: p.gold + 100 };
      setPlayer(updated);
      saveGame(updated);
      showToast('获得武学残卷（太极拳）+ 100两！');
      break;
    }
  }
}

function getSectShortName(sect: string): string {
  const names: Record<string, string> = {
    wudang: '武当', emei: '峨眉', shaolin: '少林',
    beggar: '丐帮', huashan: '华山', demon: '魔教',
  };
  return names[sect] ?? sect;
}

export function closeDialog(): void {
  showScreen('camp');
  renderCampTopbar();
  import('./Camp').then(m => m.switchCampTab(getCampTab()));
}

function typewriter(el: HTMLElement, text: string, speed: number, cb: () => void): void {
  el.textContent = '';
  let i = 0;
  const timer = setInterval(() => {
    el.textContent += text[i] ?? '';
    i++;
    if (i >= text.length) { clearInterval(timer); cb(); }
  }, speed);
}
