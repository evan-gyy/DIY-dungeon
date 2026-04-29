import { getPlayer, setPlayer, getCampTab, setCampTab } from '../state/GameState';
import { saveGame } from '../state/SaveSystem';
import { MUSIC, switchMusic } from '../audio/AudioManager';
import { showScreen } from './ScreenManager';
import { renderAttrPanel } from './camp/AttrPanel';
import { renderBagPanel } from './camp/BagPanel';
import { renderSkillPanel } from './camp/SkillPanel';
import { renderStoryPanel, updateStorySidebar } from './camp/StoryPanel';
import { renderRelationPanel } from './camp/RelationPanel';
import { getChapter } from '../data/chapters/index';
import { showToast } from '../ui/toast';
import { initNpcDatabase } from '../systems/NpcBehavior';
import type { CampTabId } from '../data/types';

export function renderCampTopbar(): void {
  const p = getPlayer();
  const hpPct = Math.max(0, Math.min(100, p.hp / p.maxHp * 100));
  const mpPct = Math.max(0, Math.min(100, p.mp / p.maxMp * 100));
  const el = (id: string) => document.getElementById(id);
  const setTxt = (id: string, v: string) => { const e = el(id); if (e) e.textContent = v; };
  setTxt('topbar-name', p.name);
  setTxt('hp-val', `${p.hp}/${p.maxHp}`);
  setTxt('mp-val', `${p.mp}/${p.maxMp}`);
  setTxt('gold-val', `💰 ${p.gold} 两`);
  const hpBar = el('bar-hp'); if (hpBar) (hpBar as HTMLElement).style.width = hpPct + '%';
  const mpBar = el('bar-mp'); if (mpBar) (mpBar as HTMLElement).style.width = mpPct + '%';
}

export function renderSidebar(): void {
  const p = getPlayer();
  const chapter = getChapter(p.chapter);
  const scene = chapter.campScenes[p.act] ?? chapter.campScenes[0]!;
  import('./camp/StoryPanel').then(m => {
    m.updateStorySidebar(scene);
  });
}

export function switchCampTab(tab: CampTabId): void {
  setCampTab(tab);
  document.querySelectorAll('.camp-nav-btn').forEach(b => {
    b.classList.toggle('active', (b as HTMLElement).dataset['tab'] === tab);
  });
  const content = document.getElementById('camp-content');
  if (!content) return;
  if (tab === 'attr')     renderAttrPanel(content);
  if (tab === 'bag')      renderBagPanel(content);
  if (tab === 'skill')    renderSkillPanel(content);
  if (tab === 'story')    renderStoryPanel(content);
  if (tab === 'relation') renderRelationPanel(content);
}

export function doRest(): void {
  const p = getPlayer();
  const before = { hp: p.hp, mp: p.mp };
  const updated = { ...p, hp: p.maxHp, mp: p.maxMp };
  setPlayer(updated);
  saveGame(updated);
  renderCampTopbar();
  showToast(`休息完毕！气血 ${before.hp} → ${updated.maxHp}，内力 ${before.mp} → ${updated.maxMp}`);
}

export function doSaveGame(): void {
  const p = getPlayer();
  saveGame(p);
  showToast('存档成功！');
}

export function enterCamp(): void {
  let p = getPlayer();
  if (!p) { showScreen('main'); return; }

  // 首次进入或旧存档：初始化 NPC 数值卡数据库
  if (!p.npcDatabase || Object.keys(p.npcDatabase).length === 0) {
    p = { ...p, npcDatabase: initNpcDatabase() };
    setPlayer(p);
    saveGame(p);
  }

  showScreen('camp');
  switchMusic(MUSIC.main);
  renderCampTopbar();
  renderSidebar();

  // re-bind nav buttons (clone trick prevents event stacking)
  document.querySelectorAll('.camp-nav-btn').forEach(btn => {
    const fresh = btn.cloneNode(true) as HTMLElement;
    btn.parentNode?.replaceChild(fresh, btn);
  });
  document.querySelectorAll<HTMLElement>('.camp-nav-btn').forEach(btn => {
    btn.addEventListener('click', () => switchCampTab(btn.dataset['tab'] as CampTabId));
  });

  if (!p.tutorialDone) {
    setTimeout(() => {
      import('./tutorial').then(m => m.showMentorGuide(0));
    }, 400);
  }

  switchCampTab('story');
}

export function checkSkillBeforeBattle(): boolean {
  const p = getPlayer();
  const equipped = p.equippedSkills.filter(Boolean);
  if (p.skills.length === 0) {
    showSkillReminder('learn_first');
    return false;
  }
  if (equipped.length === 0) {
    showSkillReminder('equip_first');
    return false;
  }
  return true;
}

function showSkillReminder(type: 'learn_first' | 'equip_first'): void {
  const textEl    = document.getElementById('skill-reminder-text');
  const actionsEl = document.getElementById('skill-reminder-actions');
  if (!textEl || !actionsEl) return;

  if (type === 'learn_first') {
    textEl.innerHTML = `<strong>且慢！</strong><br><br>你尚未学习任何武功，贸然踏入江湖恐怕凶多吉少。<br><br>请先推进<strong>「人物活动」</strong>中的主线剧情来获得武功。`;
    actionsEl.innerHTML = '';
    const goBtn = document.createElement('button');
    goBtn.className = 'mentor-action-btn primary';
    goBtn.textContent = '前往人物活动';
    goBtn.addEventListener('click', () => {
      closeSkillReminder();
      switchCampTab('story');
    });
    const forceBtn = document.createElement('button');
    forceBtn.className = 'mentor-action-btn';
    forceBtn.textContent = '强行进入';
    forceBtn.addEventListener('click', closeSkillReminder);
    actionsEl.append(goBtn, forceBtn);
  } else {
    textEl.innerHTML = `<strong>且慢！</strong><br><br>你已学习了武功，但<span class="hi">尚未装备到上阵栏</span>。<br>未装备的技能在战斗中无法使用。<br><br>请先前往<strong>「技能配置」</strong>处装备技能（最多4格）。`;
    actionsEl.innerHTML = '';
    const configBtn = document.createElement('button');
    configBtn.className = 'mentor-action-btn primary';
    configBtn.textContent = '去配置技能';
    configBtn.addEventListener('click', () => { closeSkillReminder(); switchCampTab('skill'); });
    const forceBtn = document.createElement('button');
    forceBtn.className = 'mentor-action-btn';
    forceBtn.textContent = '强行进入';
    forceBtn.addEventListener('click', closeSkillReminder);
    actionsEl.append(configBtn, forceBtn);
  }
  document.getElementById('skill-reminder')?.classList.remove('hidden');
}

function closeSkillReminder(): void {
  document.getElementById('skill-reminder')?.classList.add('hidden');
}
