import { getPlayer, setPlayer } from '../state/GameState';
import { saveGame } from '../state/SaveSystem';
import { switchCampTab } from './Camp';
import { showToast } from '../ui/toast';

const MENTOR_STEPS = [
  {
    step: '第一步',
    text: `<strong>欢迎来到武当。</strong><br><br>老夫张三丰，武当派祖师。<br>看你初入江湖，特来指点一二。`,
    actions: [{ label: '愿听前辈教诲', action: 'next', primary: true }],
  },
  {
    step: '第二步',
    text: `先打开你的<strong>随身包裹</strong>看看。<br><br>
      你背包里有一面<span class="hi">玄铁盾牌</span>，可在战斗前装备，提升防御；<br>
      剧情中获得的技能会自动加入你的技能列表。`,
    actions: [
      { label: '查看随身包裹', action: 'goto_bag', primary: true },
      { label: '跳过引导',    action: 'skip',     primary: false },
    ],
  },
  {
    step: '第三步',
    text: `很好！你通过剧情获得的武功需要<strong>装备到技能栏</strong>才能在战斗中使用。<br><br>
      点击<strong>「技能配置」</strong>，将武功拖入上阵栏（共4格）。<br>
      <span class="hi">习得而不装备，等于不会。</span>`,
    actions: [
      { label: '去配置技能', action: 'goto_skills', primary: true },
      { label: '跳过引导',   action: 'skip',        primary: false },
    ],
  },
  {
    step: '第四步',
    text: `很好！你已掌握了入门之道。<br><br>
      点击顶部<span class="hi">「地图」</span>可查看江湖世界，前往各处历练。<br>
      江湖险恶，<span class="hi">有备无患</span>。<br><br>
      老夫去也，愿你名扬四海！`,
    actions: [{ label: '谢前辈指点！', action: 'close', primary: true }],
  },
];

let _stepIndex = 0;
let _shownThisSession = false;

export function showMentorGuide(stepIndex: number): void {
  if (_shownThisSession) return;
  if (stepIndex >= MENTOR_STEPS.length) {
    const p = getPlayer();
    setPlayer({ ...p, tutorialDone: true });
    saveGame(getPlayer());
    _shownThisSession = true;
    closeMentorGuide();
    return;
  }
  _stepIndex = stepIndex;
  const step = MENTOR_STEPS[stepIndex]!;
  const labelEl   = document.getElementById('mentor-step-label');
  const textEl    = document.getElementById('mentor-text');
  const actionsEl = document.getElementById('mentor-actions');
  if (!labelEl || !textEl || !actionsEl) return;

  labelEl.textContent = step.step;
  textEl.innerHTML    = step.text;
  actionsEl.innerHTML = '';

  for (const a of step.actions) {
    const btn = document.createElement('button');
    btn.className = 'mentor-action-btn' + (a.primary ? ' primary' : '');
    btn.textContent = a.label;
    btn.addEventListener('click', () => handleMentorAction(a.action));
    actionsEl.appendChild(btn);
  }
  document.getElementById('mentor-guide')?.classList.remove('hidden');
}

function handleMentorAction(action: string): void {
  switch (action) {
    case 'next':
      showMentorGuide(_stepIndex + 1);
      break;
    case 'goto_bag':
      closeMentorGuide();
      switchCampTab('bag');
      break;
    case 'goto_skills':
      closeMentorGuide();
      switchCampTab('skill');
      break;
    case 'skip':
    case 'close': {
      const p = getPlayer();
      setPlayer({ ...p, tutorialDone: true });
      saveGame(getPlayer());
      _shownThisSession = true;
      closeMentorGuide();
      break;
    }
  }
}

function closeMentorGuide(): void {
  document.getElementById('mentor-guide')?.classList.add('hidden');
}