import { getPlayer, setPlayer } from '../../state/GameState';
import { saveGame } from '../../state/SaveSystem';
import { NPC_DIALOGS } from '../../data/npcs';
import { getChapter } from '../../data/chapters/index';
import { showToast } from '../../ui/toast';
import { openDialog } from '../DialogScreen';
import { enterCamp, switchCampTab } from '../Camp';
import { checkLevelUp, getRealmName } from '../../state/LevelSystem';
import type { CampScene } from '../../data/chapters/types';
import type { SkillId } from '../../data/types';

// ── 可重复日常任务定义 ──
interface DailyTask {
  id: string;
  icon: string;
  name: string;
  desc: string;
  exp: number;
  gold: number;
  unlockChapter: number;  // 需要达到的章节
  unlockLevel: number;     // 需要达到的等级
}

const DAILY_TASKS: DailyTask[] = [
  { id: 'chop_wood', icon: '🪓', name: '砍柴',   desc: '山门外劈柴，练臂力也练心性', exp: 15, gold: 5,  unlockChapter: 2, unlockLevel: 0 },
  { id: 'carry_water', icon: '💧', name: '挑水',  desc: '去最远的山泉挑水，腿能废三天', exp: 10, gold: 3,  unlockChapter: 2, unlockLevel: 0 },
  { id: 'clean_hall', icon: '🧹', name: '打扫大殿', desc: '真武大殿除尘，心静则尘净',     exp: 12, gold: 4,  unlockChapter: 2, unlockLevel: 0 },
  { id: 'copy_scripture', icon: '📜', name: '抄写道经', desc: '静心抄写道藏，字字入心',     exp: 25, gold: 8,  unlockChapter: 2, unlockLevel: 0 },
  { id: 'pine_train', icon: '🌙', name: '后山修炼', desc: '老松树下打坐，月华入体',       exp: 30, gold: 0,  unlockChapter: 2, unlockLevel: 2 },
  { id: 'arena_spar', icon: '⚔️', name: '演武切磋', desc: '演武场与同门过招，实战精进',    exp: 35, gold: 0,  unlockChapter: 2, unlockLevel: 6 },
];

function doDailyTask(task: DailyTask): void {
  const p = getPlayer();
  const updated = {
    ...p,
    exp: p.exp + task.exp,
    gold: p.gold + task.gold,
  };
  const lvResult = checkLevelUp(updated);
  const finalPlayer = lvResult.leveled ? lvResult.updatedPlayer : updated;
  setPlayer(finalPlayer);
  saveGame(finalPlayer);

  let msg = `${task.icon} ${task.name}完成！经验 +${task.exp}`;
  if (task.gold > 0) msg += `，铜钱 +${task.gold}`;
  if (lvResult.leveled) {
    const realm = getRealmName(lvResult.newLevel);
    msg += `\n🎉 修为突破至 ${realm}！获得 ${lvResult.gainedPoints} 修为点！`;
  }
  showToast(msg);

  // 小概率随机事件
  const rand = Math.random();
  if (task.id === 'chop_wood' && rand < 0.15) {
    setTimeout(() => showToast('👤 宋知远偷懒被抓，讪笑着帮你劈了两捆柴。好感 +1'), 1500);
  } else if (task.id === 'carry_water' && rand < 0.15) {
    setTimeout(() => showToast('💬 顾小桑路过，悄悄告诉你陆沉舟最近在打听你的事。'), 1500);
  } else if (task.id === 'clean_hall' && rand < 0.15) {
    setTimeout(() => showToast('☯️ 张玄素掌门路过，微微颔首："心静则尘净。"'), 1500);
  } else if (task.id === 'copy_scripture' && rand < 0.15) {
    setTimeout(() => showToast('📖 陈静虚长老看到你的抄本，指点了几句。经验 +10'), 1500);
    const bonus = { ...finalPlayer, exp: finalPlayer.exp + 10 };
    setPlayer(bonus);
    saveGame(bonus);
  }

  // 刷新面板
  const content = document.getElementById('camp-content');
  if (content) renderStoryPanel(content);
}

function renderDailyTasks(): string {
  const p = getPlayer();
  const availableTasks = DAILY_TASKS.filter(t => p.chapter >= t.unlockChapter && p.level >= t.unlockLevel);
  const lockedTasks = DAILY_TASKS.filter(t => !(p.chapter >= t.unlockChapter && p.level >= t.unlockLevel));

  if (availableTasks.length === 0 && p.chapter < 2) {
    return `<div class="daily-tasks-section">
      <div class="daily-tasks-header">📋 日常修行</div>
      <p style="font-size:12px;color:var(--text-dim);text-align:center;padding:16px;">完成第一章序幕后解锁日常任务。</p>
    </div>`;
  }

  const availableHtml = availableTasks.map(t => {
    const goldHtml = t.gold > 0 ? '<span>+' + t.gold + ' 💰</span>' : '';
    return '<button class="daily-task-btn" data-task-id="' + t.id + '">' +
      '<span class="daily-task-icon">' + t.icon + '</span>' +
      '<div class="daily-task-info">' +
      '<div class="daily-task-name">' + t.name + '</div>' +
      '<div class="daily-task-desc">' + t.desc + '</div>' +
      '</div>' +
      '<div class="daily-task-reward">' +
      '<span>+' + t.exp + ' EXP</span>' +
      goldHtml +
      '</div>' +
      '</button>';
  }).join('');

  let lockedHtml = '';
  if (lockedTasks.length > 0) {
    const label = '<div class="daily-tasks-locked-label">🔒 待解锁</div>';
    const cards = lockedTasks.map(t => {
      let unlockText: string;
      if (t.unlockChapter > p.chapter) {
        unlockText = '第' + t.unlockChapter + '章解锁';
      } else if (t.unlockLevel > 0) {
        unlockText = '需 炼气' + t.unlockLevel + '层';
      } else {
        unlockText = '需 外门弟子';
      }
      return '<div class="daily-task-btn locked">' +
        '<span class="daily-task-icon" style="opacity:0.3;">' + t.icon + '</span>' +
        '<div class="daily-task-info">' +
        '<div class="daily-task-name" style="color:var(--text-dim);">' + t.name + '</div>' +
        '<div class="daily-task-desc">' + t.desc + '</div>' +
        '</div>' +
        '<div class="daily-task-reward" style="color:var(--text-dim);">' + unlockText + '</div>' +
        '</div>';
    }).join('');
    lockedHtml = label + cards;
  }

  return `<div class="daily-tasks-section">
    <div class="daily-tasks-header">📋 日常修行</div>
    <div class="daily-tasks-grid">${availableHtml}${lockedHtml}</div>
  </div>`;
}

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
    ${renderDailyTasks()}
    <div class="story-section-divider">
      <span class="story-section-label">━━━ 📖 主线剧情 ━━━</span>
    </div>
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

  // 绑定日常任务按钮
  content.querySelectorAll<HTMLElement>('.daily-task-btn:not(.locked)').forEach(btn => {
    btn.addEventListener('click', () => {
      const taskId = btn.dataset['taskId'];
      const task = DAILY_TASKS.find(t => t.id === taskId);
      if (task) doDailyTask(task);
    });
  });
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
    if (p.level < 1) {
      showToast('需要达到炼气一层方可问道。请先通过日常任务积累经验。');
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
    if (p.level < 2) {
      showToast('需要达到炼气二层方可夜遇柳清寒。');
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
    if (p.level < 6) {
      showToast('需要达到炼气六层方可参加外门小比。');
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
    if (p.level < 8) {
      showToast('需要达到炼气八层方可参加外门试炼考。');
      return;
    }
    import('../StoryScreen').then(m => {
      m.runStoryIntro('ch2_xiasha_0', () => {
        const fresh = getPlayer();
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

  // ── 章节过渡：第二章 → 第三章 ──
  } else if (eventId === 'enter_chapter3') {
    const p = getPlayer();
    const updated = { ...p, chapter: 3, act: 0 };
    setPlayer(updated);
    saveGame(updated);
    import('../StoryScreen').then(m => {
      m.runStoryIntro('ch3_break_0', () => {
        const fresh = getPlayer();
        // 突破筑基：属性大幅提升
        const promotion = {
          level: 11, // 筑基一层
          maxHp: fresh.maxHp + 50, hp: Math.min(fresh.hp + 50, fresh.maxHp + 50),
          maxMp: fresh.maxMp + 25, mp: Math.min(fresh.mp + 25, fresh.maxMp + 25),
          atk: fresh.atk + 8, def: fresh.def + 5,
          chapter3Breakthrough: true,
        };
        const updated2 = { ...fresh, ...promotion, act: 1 };
        setPlayer(updated2);
        saveGame(updated2);
        enterCamp();
      });
    });

  // ── 第三章事件 ──
  } else if (eventId === 'ch3_breakthrough') {
    const p = getPlayer();
    import('../StoryScreen').then(m => {
      m.runStoryIntro('ch3_break_0', () => {
        const fresh = getPlayer();
        const promotion = {
          level: 11,
          maxHp: fresh.maxHp + 50, hp: Math.min(fresh.hp + 50, fresh.maxHp + 50),
          maxMp: fresh.maxMp + 25, mp: Math.min(fresh.mp + 25, fresh.maxMp + 25),
          atk: fresh.atk + 8, def: fresh.def + 5,
          chapter3Breakthrough: true,
        };
        const updated = { ...fresh, ...promotion, act: 1 };
        setPlayer(updated);
        saveGame(updated);
        enterCamp();
      });
    });

  } else if (eventId === 'ch3_giftshu') {
    const p = getPlayer();
    import('../StoryScreen').then(m => {
      m.runStoryIntro('ch3_gift_0', () => {
        const fresh = getPlayer();
        const updated = { ...fresh, act: 2, songZhiyuanGrowth: true };
        setPlayer(updated);
        saveGame(updated);
        enterCamp();
      });
    });

  } else if (eventId === 'ch3_baishi') {
    const p = getPlayer();
    import('../StoryScreen').then(m => {
      m.runStoryIntro('ch3_baishi_0', () => {
        const fresh = getPlayer();
        const updated = { ...fresh, act: 3, master: 'chen_jingxu' };
        setPlayer(updated);
        saveGame(updated);
        enterCamp();
      });
    });

  } else if (eventId === 'ch3_shoujian') {
    const p = getPlayer();
    if (p.level < 13) {
      showToast('需要达到筑基三层方可学习真传剑法。');
      return;
    }
    import('../StoryScreen').then(m => {
      m.runStoryIntro('ch3_jian_0', () => {
        const fresh = getPlayer();
        const skills = fresh.skills.includes('wudang_yunkai' as SkillId)
          ? fresh.skills
          : [...fresh.skills, 'wudang_yunkai' as SkillId];
        const updated = { ...fresh, act: 4, skills };
        setPlayer(updated);
        saveGame(updated);
        enterCamp();
      });
    });

  } else if (eventId === 'ch3_xiashan') {
    const p = getPlayer();
    if (p.level < 15) {
      showToast('需要达到筑基五层方可带队下山行侠。');
      return;
    }
    import('../StoryScreen').then(m => {
      m.runStoryIntro('ch3_xiashan_0', () => {
        const fresh = getPlayer();
        const updated = { ...fresh, act: 5, blackmoonToken: true };
        setPlayer(updated);
        saveGame(updated);
        enterCamp();
      });
    });

  } else if (eventId === 'ch3_fengmang') {
    const p = getPlayer();
    if (p.level < 17) {
      showToast('需要达到筑基七层方可参加内门试剑会。');
      return;
    }
    import('../StoryScreen').then(m => {
      m.runStoryIntro('ch3_feng_0', () => {
        const fresh = getPlayer();
        const updated = { ...fresh, act: 6, luChenzhouRespect: 40 };
        setPlayer(updated);
        saveGame(updated);
        enterCamp();
      });
    });

  } else if (eventId === 'ch3_hunyue') {
    const p = getPlayer();
    import('../StoryScreen').then(m => {
      m.runStoryIntro('ch3_hun_0', () => {
        const fresh = getPlayer();
        const updated = { ...fresh, act: 7, liuQinghanEngaged: true };
        setPlayer(updated);
        saveGame(updated);
        enterCamp();
      });
    });

  } else if (eventId === 'ch3_duokui') {
    const p = getPlayer();
    import('../StoryScreen').then(m => {
      m.runStoryIntro('ch3_duo_0', () => {
        const fresh = getPlayer();
        const updated = { ...fresh, act: 8, trialChampion: true };
        setPlayer(updated);
        saveGame(updated);
        enterCamp();
      });
    });

  } else if (eventId === 'ch3_zhenchuan') {
    const p = getPlayer();
    import('../StoryScreen').then(m => {
      m.runStoryIntro('ch3_zhen_0', () => {
        const fresh = getPlayer();
        const updated = { ...fresh, act: 9, trueDisciple: true };
        setPlayer(updated);
        saveGame(updated);
        enterCamp();
      });
    });

  } else if (eventId === 'ch3_chuzheng') {
    const p = getPlayer();
    import('../StoryScreen').then(m => {
      m.runStoryIntro('ch3_chu_0', () => {
        const fresh = getPlayer();
        const updated = { ...fresh, blackmoonMissionStarted: true };
        saveGame(updated);
        enterCamp();
      });
    });

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