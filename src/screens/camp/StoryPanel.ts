import { getPlayer, setPlayer } from '../../state/GameState';
import { saveGame } from '../../state/SaveSystem';
import { NPC_DIALOGS } from '../../data/npcs';
import { showToast } from '../../ui/toast';
import { openDialog } from '../DialogScreen';

// ── story scene config (data not in NPC_DIALOGS — lives here as UI config) ──
interface StoryScene {
  id: string;
  title: string;
  bg: string;
  npc: { name: string; sub: string; img: string } | null;
  desc: string;
  actionLabel: string;
  actionEvent: string;
}

const STORY_SCENES: Record<number, StoryScene> = {
  0: {
    id: 'act1_chess', title: '第一章 · 寒斋棋声',
    bg: 'picture/scene/C1-muwu.png',
    npc: { name: '墨绐青', sub: '隐居村妇 / 前朝国师', img: 'picture/Female-main/墨绐青.png' },
    desc: '小石屋内，窗外雪意未消。一盘残局，一盏油灯，她等你多时了。',
    actionLabel: '聆听教诲', actionEvent: 'act1_chess',
  },
  1: {
    id: 'act2_thunder', title: '第一章 · 惊雷入梦',
    bg: 'picture/scene/C1-muwu.png',
    npc: { name: '墨绐青', sub: '隐居村妇 / 前朝国师', img: 'picture/Female-main/墨绐青.png' },
    desc: '天色骤变，雷声隐隐。她忽然起身，目光如电——',
    actionLabel: '追问变故', actionEvent: 'act2_thunder',
  },
  2: {
    id: 'act3_escape', title: '第一章 · 暗道夺命',
    bg: 'picture/scene/C1-didao.png',
    npc: null,
    desc: '暗道幽深，身后杀机逼近。你必须闯过这道关卡。',
    actionLabel: '进入暗道', actionEvent: 'act3_escape',
  },
  3: {
    id: 'act4_snow', title: '第一章 · 雪中惊鸿',
    bg: 'picture/scene/C1-xueye.png',
    npc: { name: '柳清寒', sub: '武当大师姐 / 命中妻子', img: 'picture/Female-main/柳清寒.png' },
    desc: '风雪漫天，一道白衣身影立于山门之前——',
    actionLabel: '上前相见', actionEvent: 'act4_snow',
  },
};

export function renderStoryPanel(content: HTMLElement): void {
  const p = getPlayer();
  const phase = p.storyPhase ?? 0;
  const scene = STORY_SCENES[phase] ?? STORY_SCENES[0]!;

  updateStorySidebar(scene);

  const npcHtml = scene.npc ? `
    <div class="story-npc-portrait">
      <img src="${scene.npc.img}" alt="${scene.npc.name}" onerror="this.style.display='none'" class="story-npc-img">
      <div class="story-npc-name">${scene.npc.name}</div>
      <div class="story-npc-sub">${scene.npc.sub}</div>
    </div>` : '';

  content.innerHTML = `
    <div class="story-scene-wrap">
      <div class="story-scene-bg">
        <img src="${scene.bg}" alt="场景" onerror="this.style.display='none'"
             style="width:100%;height:100%;object-fit:cover;border-radius:8px;opacity:0.5;">
        <div class="story-scene-overlay"></div>
      </div>
      <div class="story-scene-content">
        <div style="margin-bottom:16px;display:flex;align-items:center;gap:12px;">
          <span style="font-size:11px;color:var(--text-dim);letter-spacing:3px;padding:3px 10px;background:rgba(201,168,76,0.1);border:1px solid rgba(201,168,76,0.3);border-radius:20px;">${scene.title}</span>
        </div>
        <div class="story-desc">${scene.desc}</div>
        ${npcHtml}
        <div class="story-action-area">
          <button class="btn story-action-btn" id="story-action-btn">▶ ${scene.actionLabel}</button>
        </div>
      </div>
    </div>
  `;

  content.querySelector('#story-action-btn')?.addEventListener('click', () => triggerStoryEvent(scene.actionEvent));
}

function triggerStoryEvent(eventId: string): void {
  if (eventId === 'act1_chess') {
    if (NPC_DIALOGS['mo_jiangqing']) openDialog('mo_jiangqing');
    else showToast('墨绐青的对话正在酝酿中…');
  } else if (eventId === 'act2_thunder') {
    const p = getPlayer();
    setPlayer({ ...p, storyPhase: 2 });
    saveGame(getPlayer());
    showToast('突变发生——必须立刻离开！');
    renderStoryPanel(document.getElementById('camp-content')!);
  } else if (eventId === 'act3_escape') {
    import('../../systems/BattleEngine').then(m => m.initBattle('shadow_scout'));
  } else if (eventId === 'act4_snow') {
    if (NPC_DIALOGS['liu_qinghan']) openDialog('liu_qinghan');
    else showToast('柳清寒的对话正在酝酿中…');
  } else {
    showToast('剧情即将到来…');
  }
}

export function updateStorySidebar(scene: StoryScene): void {
  const imgEl  = document.getElementById('sidebar-npc-img')  as HTMLImageElement | null;
  const nameEl = document.getElementById('sidebar-npc-name');
  const subEl  = document.getElementById('sidebar-npc-sub');
  if (!scene.npc) return;
  if (imgEl)  imgEl.src         = scene.npc.img;
  if (nameEl) nameEl.textContent = scene.npc.name;
  if (subEl)  subEl.textContent  = scene.npc.sub;
}
