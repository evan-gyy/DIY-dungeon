import { getPlayer, setPlayer } from '../../state/GameState';
import { saveGame } from '../../state/SaveSystem';
import { NPC_DIALOGS } from '../../data/npcs';
import { getChapter } from '../../data/chapters/index';
import { showToast } from '../../ui/toast';
import { openDialog } from '../DialogScreen';
import { enterCamp } from '../Camp';
import type { CampScene } from '../../data/chapters/types';
import type { SkillId } from '../../data/types';

export function renderStoryPanel(content: HTMLElement): void {
  const p = getPlayer();
  const chapter = getChapter(p.chapter);
  const scene = chapter.campScenes[p.act] ?? chapter.campScenes[0]!;

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
  // ── 第一章事件 ──
  if (eventId === 'act1_chess') {
    if (NPC_DIALOGS['mo_jiangqing']) openDialog('mo_jiangqing');
    else showToast('墨绐青的对话正在酝酿中…');
  } else if (eventId === 'act2_thunder') {
    const p = getPlayer();
    setPlayer({ ...p, act: 2 });
    saveGame(getPlayer());
    showToast('突变发生——必须立刻离开！');
    renderStoryPanel(document.getElementById('camp-content')!);
  } else if (eventId === 'act3_escape') {
    import('../../systems/BattleEngine').then(m => m.initBattle('shadow_scout'));
  } else if (eventId === 'act4_snow') {
    // 与柳清寒相遇：对话后 act 推进到 4
    const p = getPlayer();
    if (NPC_DIALOGS['liu_qinghan']) {
      openDialog('liu_qinghan');
      const updated = { ...p, act: 4 };
      setPlayer(updated);
      saveGame(updated);
    } else {
      showToast('柳清寒的对话正在酝酿中…');
    }

  // ── 章节过渡：第一章 → 第二章 ──
  } else if (eventId === 'enter_chapter2') {
    const p = getPlayer();
    const updated = { ...p, chapter: 2, act: 0 };
    setPlayer(updated);
    saveGame(updated);
    import('../StoryScreen').then(m => {
      m.runStoryIntro('ch2_intro_0', () => {
        const fresh = getPlayer();
        saveGame(fresh);
        enterCamp();
      });
    });

  // ── 第二章事件 ──
  } else if (eventId === 'ch2_wendao') {
    const p = getPlayer();
    if (p.level < 2) {
      showToast('需要达到炼气一层（2级）方可问道。');
      return;
    }
    import('../StoryScreen').then(m => {
      m.runStoryIntro('ch2_wendao_0', () => {
        const fresh = getPlayer();
        const skills = fresh.skills.includes('wudang_changquan' as SkillId)
          ? fresh.skills
          : [...fresh.skills, 'wudang_changquan' as SkillId, 'yangqi_jue' as SkillId];
        const updated = { ...fresh, act: 1, skills };
        setPlayer(updated);
        saveGame(updated);
        enterCamp();
      });
    });
  } else if (eventId === 'ch2_yeshou') {
    const p = getPlayer();
    if (p.level < 3) {
      showToast('需要达到炼气二层（3级）方可夜遇柳清寒。');
      return;
    }
    import('../StoryScreen').then(m => {
      m.runStoryIntro('ch2_yeshou_0', () => {
        const fresh = getPlayer();
        const skills = fresh.skills.includes('wudang_jianfa_basic' as SkillId)
          ? fresh.skills
          : [...fresh.skills, 'wudang_jianfa_basic' as SkillId];
        const updated = { ...fresh, act: 2, skills };
        setPlayer(updated);
        saveGame(updated);
        enterCamp();
      });
    });
  } else if (eventId === 'ch2_shijian') {
    const p = getPlayer();
    if (p.level < 7) {
      showToast('需要达到炼气六层（7级）方可参加外门小比。');
      return;
    }
    import('../StoryScreen').then(m => {
      m.runStoryIntro('ch2_shijian_0', () => {
        const fresh = getPlayer();
        const updated = { ...fresh, act: 3 };
        setPlayer(updated);
        saveGame(updated);
        enterCamp();
      });
    });
  } else if (eventId === 'ch2_xiasha') {
    const p = getPlayer();
    if (p.level < 9) {
      showToast('需要达到炼气八层（9级）方可参加外门试炼考。');
      return;
    }
    import('../StoryScreen').then(m => {
      m.runStoryIntro('ch2_xiasha_0', () => {
        const fresh = getPlayer();
        // 晋升内门：补充属性奖励
        const promotion = {
          maxHp: fresh.maxHp + 30, hp: Math.min(fresh.hp + 30, fresh.maxHp + 30),
          maxMp: fresh.maxMp + 15, mp: Math.min(fresh.mp + 15, fresh.maxMp + 15),
          atk: fresh.atk + 5, def: fresh.def + 3,
        };
        const updated = { ...fresh, ...promotion, act: 4 };
        setPlayer(updated);
        saveGame(updated);
        enterCamp();
      });
    });
  } else if (eventId === 'ch2_chapter_end') {
    showToast('第三章即将到来……');
  } else {
    showToast('剧情即将到来…');
  }
}

export function updateStorySidebar(scene: CampScene): void {
  const imgEl  = document.getElementById('sidebar-npc-img')  as HTMLImageElement | null;
  const nameEl = document.getElementById('sidebar-npc-name');
  const subEl  = document.getElementById('sidebar-npc-sub');
  if (!scene.npc) return;
  if (imgEl)  imgEl.src         = scene.npc.img;
  if (nameEl) nameEl.textContent = scene.npc.name;
  if (subEl)  subEl.textContent  = scene.npc.sub;
}
