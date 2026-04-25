// ============================================================
//  MAIN.js — 游戏主控制器
// ============================================================

// ----------- 全局游戏状态 -----------
let G = {
  player: null,        // 当前存档的玩家对象
  currentScreen: 'main',
  campTab: 'attr',
  dialogNpcId: null,
  dialogNode: null,
  learnElderId: null,
};

// =========================================================
//  存档系统（多槽位版：3个存档槽）
// =========================================================
const SAVE_KEY = 'diy_dungeon_saves';
const MAX_SLOTS = 3;

function getAllSaves() {
  const raw = localStorage.getItem(SAVE_KEY);
  return raw ? JSON.parse(raw) : {};
}

function saveGame(slotIndex) {
  const saves = getAllSaves();
  saves['slot_' + slotIndex] = {
    ...G.player,
    _slot: slotIndex,
    _savedAt: new Date().toLocaleString('zh-CN'),
  };
  localStorage.setItem(SAVE_KEY, JSON.stringify(saves));
}

function loadSave(slotIndex) {
  const saves = getAllSaves();
  return saves['slot_' + slotIndex] || null;
}

function hasAnySave() {
  return Object.keys(getAllSaves()).length > 0;
}

function deleteSave(slotIndex) {
  const saves = getAllSaves();
  delete saves['slot_' + slotIndex];
  localStorage.setItem(SAVE_KEY, JSON.stringify(saves));
}

// 进入角色创建流程（指定存档槽）
let pendingSlot = null;

// ─── 手动存档（营地顶部按钮）───
function doSaveGame() {
  if (!G.player || G.player._slot == null) {
    showToast('存档槽位未知，请从主菜单进入游戏');
    return;
  }
  saveGame(G.player._slot);
  showToast('存档成功！');
}

// ─── 休息（营地顶部按钮）───
function doRest() {
  if (!G.player) return;
  const p = G.player;
  const beforeHp = p.hp;
  const beforeMp = p.mp;
  p.hp = p.maxHp;
  p.mp = p.maxMp;
  if (G.player._slot != null) saveGame(G.player._slot); else saveGame();
  renderCampTopbar();
  renderSidebar();
  showToast(`休息完毕！气血 ${beforeHp} → ${p.maxHp}，内力 ${beforeMp} → ${p.maxMp}`);
}

// ─── 修为突破升级系统 ───
// 境界名称（从第1层到第N层，第0层为凡人）
const REALM_NAMES = ['凡人', '炼气', '筑基', '结丹', '元婴', '化神', '渡劫', '大乘', '飞升', '天人', '不灭'];

function getExpForLevel(lv) {
  // 每级所需修为 = 50 * lv^1.5
  return Math.floor(50 * Math.pow(lv, 1.5));
}

function getRealmName(lv) {
  if (lv < REALM_NAMES.length) return REALM_NAMES[lv] || `第${lv}层`;
  return `第${lv}层`;
}

// 检查并处理升级，返回 { leveled, oldLevel, newLevel, gainedPoints }
function checkLevelUp(player) {
  let lv = player.level || 1;
  let exp = player.exp || 0;
  let gainedPoints = 0;
  let oldLv = lv;

  while (exp >= getExpForLevel(lv)) {
    exp -= getExpForLevel(lv);
    lv++;
    gainedPoints++;
  }

  if (gainedPoints > 0) {
    player.level = lv;
    player.exp = exp;
    player.cultivationPoints = (player.cultivationPoints || 0) + gainedPoints;
  }

  return { leveled: gainedPoints > 0, oldLevel: oldLv, newLevel: lv, gainedPoints };
}

// 应用修为点（永久属性加成，增益记录在 attrBoosts）
function spendCultivationPoint(attr) {
  const p = G.player;
  if (!p || (p.cultivationPoints || 0) <= 0) {
    showToast('修为点数不足！');
    return;
  }
  // 确保 attrBoosts 存在（兼容旧存档）
  if (!p.attrBoosts) p.attrBoosts = { hp: 0, atk: 0, def: 0, agi: 0, mp: 0 };
  const boosts = { hp: [30, '气血上限', 'maxHp'], atk: [5, '攻击力', 'atk'], def: [4, '防御力', 'def'], agi: [3, '速度', 'agi'], mp: [20, '内力上限', 'maxMp'] };
  const b = boosts[attr];
  if (!b) return;
  p.cultivationPoints--;
  p.attrBoosts[attr] += b[0];
  p[b[2]] = (p[b[2]] || 0) + b[0];
  if (attr === 'hp') { p.hp = Math.min(p.hp, p.maxHp); }
  if (attr === 'mp') { p.mp = Math.min(p.mp, p.maxMp); }
  if (G.player._slot != null) saveGame(G.player._slot); else saveGame();
  renderSidebar();
  renderAttrPanel(document.getElementById('camp-content'));
  showToast(`修为精进！${b[1]} +${b[0]}`);
}

// 计算某属性的总当前值（基础 + 修为增益）
function getTotalAttr(player, attr) {
  const baseMap = { hp: 'maxHp', mp: 'maxMp', atk: 'atk', def: 'def', agi: 'agi' };
  const base = player[baseMap[attr]] || 0;
  const boost = (player.attrBoosts && player.attrBoosts[attr]) || 0;
  return { base, boost, total: base };
}

// =========================================================
//  屏幕切换
// =========================================================
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const el = document.getElementById('screen-' + id);
  if (el) el.classList.add('active');
  G.currentScreen = id;
}

// =========================================================
//  消息提示
// =========================================================
let toastTimer = null;
function showToast(msg, dur = 2200) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), dur);
}

// =========================================================
//  背景粒子
// =========================================================
function initParticles() {
  const canvas = document.getElementById('bg-canvas');
  const ctx = canvas.getContext('2d');
  let W, H, particles;

  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  function initP() {
    particles = Array.from({ length: 80 }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      r: Math.random() * 1.5 + 0.3,
      vx: (Math.random() - 0.5) * 0.3,
      vy: -Math.random() * 0.4 - 0.1,
      alpha: Math.random() * 0.5 + 0.1,
    }));
  }
  function draw() {
    ctx.clearRect(0, 0, W, H);
    particles.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(201,168,76,${p.alpha})`;
      ctx.fill();
      p.x += p.vx; p.y += p.vy;
      if (p.y < -5) { p.y = H + 5; p.x = Math.random() * W; }
    });
    requestAnimationFrame(draw);
  }
  resize(); initP(); draw();
  window.addEventListener('resize', () => { resize(); initP(); });
}

// =========================================================
//  音频控制
// =========================================================
let bgMusic = null;
let musicEnabled = true;
function initAudio() {
  bgMusic = document.getElementById('bgm');
  bgMusic.volume = 0.35;
  bgMusic.loop = true;
  document.getElementById('audio-control').addEventListener('click', () => {
    musicEnabled = !musicEnabled;
    if (musicEnabled) { bgMusic.play(); document.getElementById('audio-control').textContent = '♪ 音乐'; }
    else { bgMusic.pause(); document.getElementById('audio-control').textContent = '♪ 静音'; }
  });
}
function switchMusic(src) {
  if (!bgMusic) return;
  bgMusic.src = src;
  if (musicEnabled) bgMusic.play().catch(() => {});
}

// =========================================================
//  主菜单初始化（多存档版）
// =========================================================
function initMainMenu() {
  renderSaveSelectScreen();

  // 新建游戏 → 弹出存档选择
  document.getElementById('btn-newgame').addEventListener('click', () => {
    pendingSlot = null;
    renderSaveSelectScreen('new');
    showScreen('saveselect');
  });

  // 继续冒险 → 弹出存档选择
  document.getElementById('btn-continue').addEventListener('click', () => {
    renderSaveSelectScreen('load');
    showScreen('saveselect');
  });

  // 门派预览联动
  document.addEventListener('click', e => {
    if (e.target.classList.contains('sect-btn')) {
      const sect = e.target.dataset.sect;
      const s = SECTS[sect];
      const preview = document.getElementById('sect-preview');
      if (s) {
        const bonuses = Object.entries(s.bonus)
          .map(([k, v]) => `${({ hp: '气血', mp: '内力', atk: '攻击', def: '防御', agi: '速度', crit: '暴击率' }[k] || k)} ${v > 0 ? '+' : ''}${v}`)
          .join('　');
        preview.innerHTML = `<span style="color:var(--text-gold)">${s.icon} ${s.name}</span><br>${s.intro}<br><span style="color:#5dade2">${bonuses}</span>`;
      }
    }
  });
}

// =========================================================
//  存档选择界面
// =========================================================
function renderSaveSelectScreen(mode) {
  // mode: 'new' = 新建模式，'load' = 读取模式
  const saves = getAllSaves();
  const container = document.getElementById('saveselect-slots');
  if (!container) return;

  container.innerHTML = '';
  for (let i = 1; i <= MAX_SLOTS; i++) {
    const save = saves['slot_' + i];
    const isEmpty = !save;
    const div = document.createElement('div');
    div.className = 'save-slot-card panel ' + (isEmpty ? 'slot-empty' : 'slot-used');

    if (isEmpty) {
      div.innerHTML = `
        <div class="slot-number">存档位 ${i}</div>
        <div class="slot-empty-icon">＋</div>
        <div class="slot-empty-text">空</div>
      `;
      if (mode === 'new') {
        div.addEventListener('click', () => {
          pendingSlot = i;
          showScreen('create');
          renderCreateScreen();
        });
      }
    } else {
      const sect = SECTS[save.sect] || {};
      div.innerHTML = `
        <div class="slot-header">
          <span class="slot-name">${save.name}</span>
          <span class="slot-sect">${sect.icon || ''} ${sect.name || ''}</span>
        </div>
        <div class="slot-meta">
          <span>等级 Lv.${save.level || 1}</span>
          <span>💰 ${save.gold || 0}两</span>
        </div>
        <div class="slot-time">${save._savedAt || ''}</div>
        <div class="slot-actions">
          <button class="btn btn-sm slot-load-btn">进入</button>
          <button class="btn btn-sm btn-danger slot-del-btn">删除</button>
        </div>
      `;
      div.querySelector('.slot-load-btn').addEventListener('click', e => {
        e.stopPropagation();
        G.player = { ...save, _slot: i }; // 确保 _slot 与存档槽一致
        closeSaveSelect(false);
        enterCamp();
      });
      div.querySelector('.slot-del-btn').addEventListener('click', e => {
        e.stopPropagation();
        if (confirm(`确定删除存档「${save.name}」？此操作不可撤销。`)) {
          deleteSave(i);
          renderSaveSelectScreen(mode);
        }
      });
      if (mode === 'load') {
        div.addEventListener('click', () => {
          G.player = { ...save, _slot: i };
          closeSaveSelect(false);
          enterCamp();
        });
      }
    }
    container.appendChild(div);
  }
}

function closeSaveSelect(goToMain) {
  const el = document.getElementById('screen-saveselect');
  if (el) el.classList.remove('active');
  if (goToMain !== false) showScreen('main');
}

// =========================================================
//  屏幕2：角色创建
// =========================================================
let createState = { charId: null, sect: null };

function renderCreateScreen() {
  createState = { charId: null, sect: null };

  const chars = [
    { id: 'male_good',   label: '男·正派', img: 'https://pub-cdb8eae73d584ab0b7d006c460518c76.r2.dev/picture/maincharacter/male_good.png' },
    { id: 'male_evil',   label: '男·邪派', img: 'https://pub-cdb8eae73d584ab0b7d006c460518c76.r2.dev/picture/maincharacter/male_evil.png' },
    { id: 'female_good', label: '女·正派', img: 'https://pub-cdb8eae73d584ab0b7d006c460518c76.r2.dev/picture/maincharacter/female_good.png' },
    { id: 'female_evil', label: '女·邪派', img: 'https://pub-cdb8eae73d584ab0b7d006c460518c76.r2.dev/picture/maincharacter/female_evil.png' },
  ];

  // 角色立绘
  const grid = document.getElementById('char-select-grid');
  grid.innerHTML = '';
  chars.forEach(c => {
    const div = document.createElement('div');
    div.className = 'char-card';
    div.dataset.id = c.id;
    div.innerHTML = `<span class="selected-badge">已选</span><img src="${c.img}" alt="${c.label}" onerror="this.src='data:image/svg+xml,<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'160\\' height=\\'160\\'><rect fill=\\'%231a1a2e\\' width=\\'160\\' height=\\'160\\'/><text x=\\'80\\' y=\\'90\\' text-anchor=\\'middle\\' fill=\\'%23c9a84c\\' font-size=\\'14\\'>${c.label}</text></svg>'"><div class="char-label">${c.label}</div>`;
    div.addEventListener('click', () => {
      document.querySelectorAll('.char-card').forEach(el => el.classList.remove('selected'));
      div.classList.add('selected');
      createState.charId = c.id;
    });
    grid.appendChild(div);
  });

  // 门派已固定为武当，无需选择
  createState.sect = 'wudang';
}

function updateCreatePreview() {
  // 门派固定为武当，预览区在 HTML 中已写死
}

function confirmCreate() {
  const name = document.getElementById('char-name-input').value.trim();
  if (!name) { showToast('请先输入角色名字'); return; }
  if (!createState.charId) { showToast('请选择角色立绘'); return; }
  if (pendingSlot === null) { showToast('存档槽异常，请重新选择'); return; }

  // 主角默认武当派（第一章剧情决定，不再让玩家选择宗门）
  const defaultSect = 'wudang';
  const stats = getDefaultStats(defaultSect);
  G.player = {
    name,
    charId: createState.charId,
    charImg: `https://pub-cdb8eae73d584ab0b7d006c460518c76.r2.dev/picture/maincharacter/${createState.charId}.png`,
    sect: defaultSect,
    ...stats,
    maxMp: stats.maxMp || 100,  // 兼容旧存档
    skills: ['yi_li_xin_jing'], // 初始被动技能（弈理心经）
    equippedSkills: [null, null, null, null], // 上阵技能（最多4个）
    inventory: DEFAULT_INVENTORY.map(i => ({ ...i })),
    cultivationPoints: 0, // 修为突破点数
    attrBoosts: { hp: 0, atk: 0, def: 0, agi: 0, mp: 0 }, // 修为已投入的各属性加成
    tutorialDone: false,   // 新手引导未完成
    storyPhase: 0,         // 剧情阶段（0=未开始序幕）
    wudangMissionAccepted: false, // 武当主线任务
    wudangGateCleared: false,    // 武当第一关
    wudangMidCleared: false,     // 武当第二关
    wudangElderCleared: false,   // 武当第三关
  };
  saveGame(pendingSlot);
  showToast(`存档已创建，欢迎，${name}！`);
  closeSaveSelect(false); // false = 不切回主菜单，由 runStoryIntro 接管
  runStoryIntro();
}

// =========================================================
//  屏幕3：营地（主入口 enterCamp 在文件底部重写，此处保留占位注释）
// =========================================================

function renderCampTopbar() {
  const p = G.player;
  if (!p) return; // 防御
  document.getElementById('topbar-name').textContent = p.name || '—';
  const hpPct = Math.max(0, Math.min(100, (p.hp || 0) / (p.maxHp || 1) * 100));
  const mpPct = Math.max(0, Math.min(100, (p.mp || 0) / (p.maxMp || 1) * 100));
  document.getElementById('bar-hp').style.width = hpPct + '%';
  document.getElementById('bar-mp').style.width = mpPct + '%';
  document.getElementById('hp-val').textContent = `${p.hp || 0}/${p.maxHp || 1}`;
  document.getElementById('mp-val').textContent = `${p.mp || 0}/${p.maxMp || 1}`;
  document.getElementById('gold-val').textContent = `💰 ${p.gold || 0} 两`;
}

// 更新营地右侧栏：显示当前剧情NPC（由 renderStoryPanel 调用）
function renderSidebar() {
  const p = G.player;
  if (!p) return;
  // 每次进入营地时，同步显示当前阶段对应的剧情NPC
  const phase = getStoryPhase(p);
  const scene = STORY_SCENES[phase] || STORY_SCENES[0];
  updateStorySidebar(scene);
}

function switchCampTab(tab) {
  G.campTab = tab;
  document.querySelectorAll('.camp-nav-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
  const content = document.getElementById('camp-content');
  if (tab === 'attr')    renderAttrPanel(content);
  else if (tab === 'bag')    renderBagPanel(content);
  else if (tab === 'skill')  renderSkillPanel(content);
  else if (tab === 'story')  renderStoryPanel(content);
}

// ---- 属性面板 ----
function renderAttrPanel(content) {
  const p = G.player;
  const sect = SECTS[p.sect] || {};
  const lv = p.level || 1;
  const exp = p.exp || 0;
  const expNeeded = getExpForLevel(lv);
  const expPct = Math.min(100, Math.floor(exp / expNeeded * 100));
  const realmName = getRealmName(lv);
  const cultPt = p.cultivationPoints || 0;
  // 兼容旧存档
  if (!p.attrBoosts) p.attrBoosts = { hp: 0, atk: 0, def: 0, agi: 0, mp: 0 };
  const ab = p.attrBoosts;

  // 修为加点按钮
  const boostBtns = ['hp', 'atk', 'def', 'agi', 'mp'].map(attr => {
    const labels = { hp: ['❤️ 气血', '+30'], atk: ['⚔️ 攻击', '+5'], def: ['🛡️ 防御', '+4'], agi: ['⚡ 速度', '+3'], mp: ['💧 内力', '+20'] };
    const lbl = labels[attr];
    const disabled = cultPt <= 0 ? ' style="opacity:0.35;cursor:not-allowed;"' : '';
    return `<button class="btn btn-xs" onclick="spendCultivationPoint('${attr}')"${disabled}>${lbl[0]} ${lbl[1]}</button>`;
  }).join('');

  // 各属性值（含修为加成）
  const attrRows = [
    { key: 'hp',  icon: '❤️', name: '气血上限', base: p.maxHp, boost: ab.hp },
    { key: 'mp',  icon: '💧', name: '内力上限', base: p.maxMp, boost: ab.mp },
    { key: 'atk', icon: '⚔️', name: '攻击力',    base: p.atk,   boost: ab.atk },
    { key: 'def', icon: '🛡️', name: '防御力',    base: p.def,   boost: ab.def },
    { key: 'agi', icon: '⚡', name: '速度',      base: p.agi,   boost: ab.agi },
  ];

  content.innerHTML = `
    <div class="title-deco"><h2>角色属性</h2></div>
    <div style="display:flex;align-items:center;gap:16px;margin-bottom:20px;">
      <span style="font-size:36px;">${sect.icon || '⚔️'}</span>
      <div>
        <div style="font-size:18px;color:var(--text-gold);letter-spacing:3px;">${p.name}</div>
        <div style="font-size:12px;color:var(--text-dim);letter-spacing:2px;margin-top:4px;">${sect.name || ''} · ${realmName}</div>
        <div style="font-size:12px;color:var(--text-dim);margin-top:4px;line-height:1.6;">${sect.intro || ''}</div>
      </div>
    </div>

    <!-- 新手引导提示区 -->
    <div style="margin-bottom:20px;">
      ${cultPt > 0 ? `
      <div style="margin-bottom:10px;padding:10px 14px;background:rgba(155,89,182,0.12);border:1px solid rgba(155,89,182,0.4);border-radius:6px;font-size:12px;color:#c39bd3;letter-spacing:1px;line-height:1.8;">
        🎁 修为突破！可用修为点：<strong>${cultPt}</strong>，请在下方进行属性突破！突破后别忘了去「拜师学功」学习新武功，并检查「随身包裹」是否有可用的丹药！
      </div>` : ''}
      ${(p.skills || []).length === 0 ? `
      <div style="margin-bottom:10px;padding:10px 14px;background:rgba(231,76,60,0.1);border:1px solid rgba(231,76,60,0.3);border-radius:6px;font-size:12px;color:#e74c3c;letter-spacing:1px;">
        ⚠️ 尚未学习任何武功！请前往「拜师学功」学习武学，否则无法挑战江湖历练。
      </div>` : ''}
      ${(p.skills || []).length > 0 && (p.equippedSkills || []).filter(Boolean).length === 0 ? `
      <div style="margin-bottom:10px;padding:10px 14px;background:rgba(231,76,60,0.1);border:1px solid rgba(231,76,60,0.3);border-radius:6px;font-size:12px;color:#e74c3c;letter-spacing:1px;">
        ⚠️ 有 ${p.skills.length} 门武功未装备！请在「技能配置」中装备后出征。
      </div>` : ''}
    </div>

    <!-- 修为进度条 -->
    <div style="margin-bottom:20px;padding:12px 16px;background:rgba(255,255,255,0.03);border:1px solid var(--border-dim);border-radius:6px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
        <span style="font-size:12px;color:var(--text-dim);letter-spacing:2px;">📖 修为进度</span>
        <span style="font-size:12px;color:var(--text-gold);">${exp} / ${expNeeded}</span>
      </div>
      <div style="height:8px;background:#1a1a2e;border-radius:4px;overflow:hidden;">
        <div style="height:100%;width:${expPct}%;background:linear-gradient(90deg,#5dade2,#9b59b6);border-radius:4px;transition:width 0.3s;"></div>
      </div>
    </div>

    <!-- 修为加点区（需有修为点才显示） -->
    ${cultPt > 0 ? `
    <div style="margin-bottom:20px;padding:12px 16px;background:rgba(155,89,182,0.08);border:1px solid rgba(155,89,182,0.3);border-radius:6px;">
      <div style="font-size:12px;color:#9b59b6;letter-spacing:2px;margin-bottom:10px;">🆙 修为突破（可用：<strong>${cultPt}</strong> 点）</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;">${boostBtns}</div>
    </div>` : ''}

    <!-- 属性网格（显示基础值 + 修为加成） -->
    <div class="attr-grid">
      ${attrRows.map(a => `
        <div class="attr-card">
          <span class="attr-icon">${a.icon}</span>
          <div class="attr-info">
            <div class="attr-name">${a.name}</div>
            <div class="attr-value">${a.base}${a.boost > 0 ? ` <span style="color:#9b59b6;font-size:11px;">(+${a.boost})</span>` : ''}</div>
          </div>
        </div>`).join('')}
      <div class="attr-card"><span class="attr-icon">🎯</span><div class="attr-info"><div class="attr-name">暴击率</div><div class="attr-value">${p.crit}%</div></div></div>
      <div class="attr-card"><span class="attr-icon">⭐</span><div class="attr-info"><div class="attr-name">境界</div><div class="attr-value">Lv.${lv} ${realmName}</div></div></div>
      <div class="attr-card"><span class="attr-icon">💰</span><div class="attr-info"><div class="attr-name">金两</div><div class="attr-value">${p.gold}</div></div></div>
    </div>
  `;
}

// ---- 背包面板 ----
function renderBagPanel(content) {
  const p = G.player;
  const slots = 24;
  let html = `<div class="title-deco"><h2>随身包裹</h2></div><div class="bag-grid">`;
  for (let i = 0; i < slots; i++) {
    const item = p.inventory[i];
    if (item) {
      html += `<div class="item-slot" title="${item.name}：${item.desc}" onclick="useItem(${i})">
        ${item.icon}<span class="item-count">${item.count > 1 ? item.count : ''}</span>
      </div>`;
    } else {
      html += `<div class="item-slot empty"></div>`;
    }
  }
  html += '</div>';
  html += `<p style="font-size:12px;color:var(--text-dim);margin-top:12px;letter-spacing:1px;">点击物品可使用 / 装备</p>`;
  content.innerHTML = html;
}

function useItem(idx) {
  const p = G.player;
  const item = p.inventory[idx];
  if (!item) return;
  if (item.equip) {
    if (item.effect.def) p.def += item.effect.def;
    if (item.effect.atk) p.atk += item.effect.atk;
    p.inventory.splice(idx, 1);
    showToast(`已装备 ${item.name}，防御 +${item.effect.def || 0}`);
  } else {
    const eff = item.effect;
    if (eff.hp) { p.hp = Math.min(p.maxHp, p.hp + eff.hp); }
    if (eff.mp) { p.mp = Math.min(p.maxMp, p.mp + eff.mp); }
    if (eff.exp) { p.exp += eff.exp; }
    item.count--;
    if (item.count <= 0) p.inventory.splice(idx, 1);
    showToast(`使用 ${item.name} ${eff.hp ? `，气血 +${eff.hp}` : ''}${eff.mp ? `，内力 +${eff.mp}` : ''}${eff.exp ? `，经验 +${eff.exp}` : ''}`);
  }
  if (G.player && G.player._slot != null) saveGame(G.player._slot); else saveGame();
  renderCampTopbar();
  renderSidebar();
  renderBagPanel(document.getElementById('camp-content'));
}

// ---- 技能面板 ----
function renderSkillPanel(content) {
  const p = G.player;
  const typeTag = { attack: '攻击', support: '辅助', control: '控制', passive: '被动' };
  const typeClass = { attack: 'tag-attack', support: 'tag-support', control: 'tag-control', passive: 'tag-passive' };

  let equippedHtml = '<div class="skill-slots">';
  for (let i = 0; i < 4; i++) {
    const skId = p.equippedSkills[i];
    const sk = skId ? SKILLS[skId] : null;
    equippedHtml += `<div class="skill-equip-slot ${sk ? '' : 'empty'}" title="${sk ? sk.name : '空槽'}" onclick="toggleEquipSkill('${skId || ''}',${i})">
      ${sk ? sk.icon : '＋'}
      <span class="slot-label">${sk ? sk.name : '空槽'}</span>
    </div>`;
  }
  equippedHtml += '</div>';

  let listHtml = '<div class="skill-list">';
  if (p.skills.length === 0) {
    listHtml += `<p style="color:var(--text-dim);font-size:13px;padding:20px 0;letter-spacing:1px;">尚未学会任何武功，前往「学功」处跟传功长老学习吧。</p>`;
  } else {
    // 先显示被动技能（不可装备，始终生效）
    const passives = p.skills.filter(id => SKILLS[id]?.type === 'passive');
    const actives = p.skills.filter(id => SKILLS[id]?.type !== 'passive');
    if (passives.length > 0) {
      listHtml += `<div style="font-size:11px;color:#8e44ad;letter-spacing:2px;margin-bottom:6px;">── 被动天赋（始终生效，无需装备） ──</div>`;
      passives.forEach(skId => {
        const sk = SKILLS[skId];
        if (!sk) return;
        listHtml += `<div class="skill-item" style="border-color:rgba(142,68,173,0.3);">
          <span class="skill-icon">${sk.icon}</span>
          <div class="skill-info">
            <div class="skill-name">${sk.name}</div>
            <div class="skill-desc">${sk.desc}</div>
          </div>
          <span class="skill-tag tag-passive">被动</span>
          <span class="skill-mp">永久</span>
        </div>`;
      });
    }
    if (actives.length > 0) {
      listHtml += `<div style="font-size:11px;color:var(--text-dim);letter-spacing:2px;margin-top:12px;margin-bottom:6px;">── 主动武学（点击装备/卸下） ──</div>`;
      actives.forEach(skId => {
        const sk = SKILLS[skId];
        if (!sk) return;
        const equipped = p.equippedSkills.includes(skId);
        listHtml += `<div class="skill-item ${equipped ? 'equipped' : ''}" onclick="toggleEquipSkillById('${skId}')">
          <span class="skill-icon">${sk.icon}</span>
          <div class="skill-info">
            <div class="skill-name">${sk.name} ${equipped ? '✓' : ''}</div>
            <div class="skill-desc">${sk.desc}</div>
          </div>
          <span class="skill-tag ${typeClass[sk.type] || ''}">${typeTag[sk.type] || sk.type}</span>
          <span class="skill-mp">${sk.mp > 0 ? '💧' + sk.mp : '被动'}</span>
        </div>`;
      });
    }
  }
  listHtml += '</div>';

  content.innerHTML = `
    <div class="title-deco"><h2>技能配置</h2></div>
    <p style="font-size:12px;color:var(--text-dim);letter-spacing:1px;margin-bottom:8px;">点击技能可装备/卸下（最多4个上阵技能）</p>
    <p style="font-size:12px;color:var(--text-dim);letter-spacing:1px;margin-bottom:16px;">📜 当前武学经验：<strong style="color:#5dade2;">${p.exp}</strong> 点</p>
    ${equippedHtml}
    <div class="title-deco" style="margin-top:8px;margin-bottom:8px;"><h2 style="font-size:15px;">已学武功</h2></div>
    ${listHtml}
  `;
}

function toggleEquipSkillById(skId) {
  const p = G.player;
  const idx = p.equippedSkills.indexOf(skId);
  if (idx >= 0) {
    p.equippedSkills[idx] = null;
    showToast(`已卸下 ${SKILLS[skId]?.name}`);
  } else {
    const empty = p.equippedSkills.indexOf(null);
    if (empty < 0) { showToast('技能栏已满（最多4格），请先卸下一个技能'); return; }
    p.equippedSkills[empty] = skId;
    showToast(`已装备 ${SKILLS[skId]?.name}`);
  }
  if (G.player && G.player._slot != null) saveGame(G.player._slot); else saveGame();
  renderSkillPanel(document.getElementById('camp-content'));
}

function toggleEquipSkill(skId, slotIdx) {
  if (!skId) return;
  const p = G.player;
  if (!p) return;
  p.equippedSkills[slotIdx] = null;
  showToast(`已卸下技能`);
  if (G.player && G.player._slot != null) saveGame(G.player._slot); else saveGame();
  renderSkillPanel(document.getElementById('camp-content'));
}

// ---- 踏入江湖·选关面板 ----
// ---- 踏入江湖·选关面板（渲染到 #depart-content）----
function renderDepartPanel() {
  const content = document.getElementById('depart-content');
  if (!content) return;
  const p = G.player;
  const equippedCount = (p.equippedSkills || []).filter(Boolean).length;
  const learnedCount = p.skills ? p.skills.length : 0;
  const hasSkills = learnedCount > 0;
  const hasEquipped = equippedCount > 0;

  // 技能状态提示
  const skillHint = !hasSkills
    ? `<p style="font-size:13px;color:#e74c3c;margin-bottom:12px;letter-spacing:1px;">⚠ 你尚未学习任何武功，<strong>请先前往「拜师学功」</strong>！</p>`
    : !hasEquipped
    ? `<p style="font-size:13px;color:#e74c3c;margin-bottom:12px;letter-spacing:1px;">⚠ 你有 ${learnedCount} 门武功未装备，<strong>请先在「技能配置」中装备</strong>！</p>`
    : `<p style="font-size:12px;color:#27ae60;margin-bottom:12px;letter-spacing:1px;">✓ 已装备 ${equippedCount} 个技能，状态良好，可放心出征。</p>`;

  // 武当山进度条（解锁后显示）
  const wudangProgress = p.wudangMissionAccepted ? `
    <div style="margin-bottom:12px;padding:10px 14px;background:rgba(93,173,226,0.08);border:1px solid rgba(93,173,226,0.25);border-radius:6px;">
      <div style="font-size:12px;color:#5dade2;letter-spacing:2px;margin-bottom:6px;">☯️ 武当山进度</div>
      <div style="display:flex;gap:16px;font-size:11px;letter-spacing:1px;">
        <span style="color:${p.wudangGateCleared ? '#27ae60' : '#888'}">${p.wudangGateCleared ? '✅' : '⬜'} 山门</span>
        <span style="color:${p.wudangMidCleared ? '#27ae60' : p.wudangGateCleared ? '#888' : '#888'}">${p.wudangMidCleared ? '✅' : p.wudangGateCleared ? '⬜' : '🔒'} 前山</span>
        <span style="color:${p.wudangElderCleared ? '#27ae60' : p.wudangMidCleared ? '#888' : '#888'}">${p.wudangElderCleared ? '✅' : p.wudangMidCleared ? '⬜' : '🔒'} 大殿</span>
      </div>
    </div>` : '';

  // 武当山关卡卡片
  const wudangCards = p.wudangMissionAccepted ? WUDANG_TIERS.map((enc, i) => {
    const clearedFlags = ['wudangGateCleared', 'wudangMidCleared', 'wudangElderCleared'];
    const cleared = !!p[clearedFlags[i]];
    const locked = i > 0 && !p[clearedFlags[i - 1]];
    const icons = ['🌄', '⛰️', '🏛️'];
    const locationNames = ['山门', '前山', '大殿'];
    return `<div class="encounter-card ${cleared ? 'cleared-card' : ''} ${locked ? 'locked-card' : ''}"
                 data-tier="${enc.tier}" ${locked ? 'title="需先通过前一关"' : ''}>
      <span class="enc-icon">${icons[i]}</span>
      <div>
        <div class="enc-label">武当山 · ${locationNames[i]}${cleared ? ' ✅' : locked ? ' 🔒' : ''}</div>
        <div class="enc-desc">${enc.desc}</div>
      </div>
    </div>`;
  }).join('') : '';

  // 武当山未解锁提示
  const wudangLockedHint = !p.wudangMissionAccepted ? `
    <div style="margin-bottom:16px;padding:12px 16px;background:rgba(255,255,255,0.03);border:1px dashed var(--border-dim);border-radius:6px;font-size:12px;color:var(--text-dim);letter-spacing:1px;text-align:center;">
      🔒 武当山主线暂未解锁，请先与武当派「张三丰」对话，开启武当之路。
    </div>` : '';

  content.innerHTML = `
    ${skillHint}

    <!-- 武当山主线分区 -->
    ${wudangLockedHint}
    ${wudangProgress}
    ${wudangCards ? `<div class="encounter-grid wudang-grid">${wudangCards}</div>` : ''}

    <!-- 江湖历练分区 -->
    <div class="title-deco" style="margin-top:24px;"><h2>江 湖 历 练</h2></div>
    <p style="font-size:12px;color:var(--text-dim);letter-spacing:1px;margin-bottom:12px;">江湖散修在此出没，挑战后可积累武学经验。</p>
    <div class="encounter-grid">
      ${ENCOUNTER_TIERS.map((enc, i) => `
        <div class="encounter-card" data-tier="${enc.tier}">
          <span class="enc-icon">${['⚔️','🔥','💀'][i]}</span>
          <div>
            <div class="enc-label">${enc.label}</div>
            <div class="enc-desc">${enc.desc}</div>
          </div>
          <span class="enc-tier-badge tier-${enc.tier}">${['练习', '普通', '困难'][i]}</span>
        </div>
      `).join('')}
    </div>
  `;

  // 动态绑定点击
  content.querySelectorAll('.encounter-card[data-tier]').forEach(card => {
    card.addEventListener('click', () => {
      const tier = parseInt(card.dataset.tier);
      if (card.classList.contains('locked-card')) { showToast('请先通过前一关！'); return; }
      if (tier < 10) { if (!checkSkillBeforeBattle()) return; }
      const enemy = getRandomEnemy(tier);
      startBattle(enemy.id);
    });
  });
}

function showDepartScreen() {
  showScreen('depart');
  renderDepartPanel();
}

// ---- 学功入口 ----
function renderLearnEntrance(content) {
  content.innerHTML = `
    <div class="title-deco"><h2>拜师学功</h2></div>
    <p style="font-size:13px;color:var(--text-dim);letter-spacing:1px;margin-bottom:20px;">向各大门派传功长老学习独门武学，提升战力。</p>
    <button class="btn" onclick="showScreen('learn');renderLearnScreen()">前往传功长老处</button>
  `;
}

// =========================================================
// 营地剧情交互面板「江湖往事」
// =========================================================
// 剧情阶段定义：key = storyPhase 值，value = 场景数据
// storyPhase: 0=第一章·寒斋棋声, 1=惊雷入梦, 2=暗道夺命, 3=雪中惊鸿
const STORY_SCENES = {
  // 第一幕·寒斋棋声：古村石屋，墨绐青教学棋理（默认阶段）
  0: {
    id: 'act1_chess',
    title: '第一章 · 寒斋棋声',
    bg: 'picture/scene/古村棋舍.png',         // AI生成的CG背景
    npc: {
      name: '墨绐青',
      sub: '隐居村妇 / 前朝国师',
      img: 'picture/Female-main/女国师.png',   // 墨绐青立绘
    },
    desc: '小石屋内，窗外雪意未消。一盘残局，一盏油灯，她等你多时了。',
    actionLabel: '聆听教诲',
    actionEvent: 'act1_chess',
  },
  // 第二幕·惊雷入梦：雷雨将至，黑白供奉逼近
  1: {
    id: 'act2_thunder',
    title: '第一章 · 惊雷入梦',
    bg: 'picture/scene/古村棋舍.png',         // 同场景，剧情推进后替换
    npc: {
      name: '墨绐青',
      sub: '隐居村妇 / 前朝国师',
      img: 'picture/Female-main/女国师.png',
    },
    desc: '天色骤变，雷声隐隐。她忽然起身，目光如电——',
    actionLabel: '追问变故',
    actionEvent: 'act2_thunder',
  },
  // 第三幕·暗道夺命：逃亡战斗
  2: {
    id: 'act3_escape',
    title: '第一章 · 暗道夺命',
    bg: 'picture/scene/暗道.png',              // 待生成
    npc: null,                                  // 暗道中无NPC立绘
    desc: '暗道幽深，身后杀机逼近。你必须闯过这道关卡。',
    actionLabel: '进入暗道',
    actionEvent: 'act3_escape',
  },
  // 第四幕·雪中惊鸿：柳清寒救场
  3: {
    id: 'act4_snow',
    title: '第一章 · 雪中惊鸿',
    bg: 'picture/scene/武当雪夜.png',          // 待生成
    npc: {
      name: '柳清寒',
      sub: '武当大师姐 / 命中妻子',
      img: 'picture/Female-main/柳清寒.png',   // 柳清寒立绘
    },
    desc: '风雪漫天，一道白衣身影立于山门之前——',
    actionLabel: '上前相见',
    actionEvent: 'act4_snow',
  },
};

// 当前剧情阶段（兼容旧存档，未定义的默认从第一幕开始）
function getStoryPhase(p) {
  if (p.storyPhase == null || p.storyPhase === undefined) return 0;
  return p.storyPhase;
}

// ---- 渲染营地剧情交互面板 ----
function renderStoryPanel(content) {
  const p = G.player;
  const phase = getStoryPhase(p);
  const scene = STORY_SCENES[phase] || STORY_SCENES[0];

  // 侧边栏同步更新当前NPC
  updateStorySidebar(scene);

  // 章节标题
  const chapterBadge = `<div style="margin-bottom:16px;display:flex;align-items:center;gap:12px;">
    <span style="font-size:11px;color:var(--text-dim);letter-spacing:3px;padding:3px 10px;background:rgba(201,168,76,0.1);border:1px solid rgba(201,168,76,0.3);border-radius:20px;">${scene.title}</span>
  </div>`;

  // NPC立绘区（居中大立绘）
  const npcHtml = scene.npc ? `
    <div class="story-npc-portrait">
      <img src="${scene.npc.img}" alt="${scene.npc.name}"
           onerror="this.src='picture/Female-main/柳清寒.png'"
           class="story-npc-img">
      <div class="story-npc-name">${scene.npc.name}</div>
      <div class="story-npc-sub">${scene.npc.sub}</div>
    </div>` : '';

  // 场景描述
  const descHtml = `<div class="story-desc">${scene.desc}</div>`;

  // 剧情触发按钮
  const actionHtml = `
    <div class="story-action-area">
      <button class="btn story-action-btn" onclick="triggerStoryEvent('${scene.actionEvent}')">
        ▶ ${scene.actionLabel}
      </button>
    </div>`;

  content.innerHTML = `
    <div class="story-scene-wrap">
      <!-- 场景背景 -->
      <div class="story-scene-bg">
        <img src="${scene.bg}" alt="场景"
             onerror="this.style.display='none'"
             style="width:100%;height:100%;object-fit:cover;border-radius:8px;opacity:0.5;">
        <div class="story-scene-overlay"></div>
      </div>
      <!-- 场景内容层 -->
      <div class="story-scene-content">
        ${chapterBadge}
        ${descHtml}
        ${npcHtml}
        ${actionHtml}
      </div>
    </div>
  `;
}

// 更新营地右侧栏的剧情NPC
function updateStorySidebar(scene) {
  const imgEl = document.getElementById('sidebar-npc-img');
  const nameEl = document.getElementById('sidebar-npc-name');
  const subEl = document.getElementById('sidebar-npc-sub');
  if (!scene.npc) return;
  if (imgEl) imgEl.src = scene.npc.img;
  if (nameEl) nameEl.textContent = scene.npc.name;
  if (subEl) subEl.textContent = scene.npc.sub;
}

// 触发剧情事件（由剧情按钮调用）
// 后续扩展：按 actionEvent 分发到具体剧情脚本
function triggerStoryEvent(eventId) {
  // 示例：act1_chess → 打开墨绐青对话
  if (eventId === 'act1_chess') {
    // TODO: 接入墨绐青对话数据（NPC_DIALOGS['mo_jiangqing']）
    if (NPC_DIALOGS['mo_jiangqing']) {
      openDialog('mo_jiangqing');
    } else {
      showToast('墨绐青的对话正在酝酿中…');
    }
  } else if (eventId === 'act2_thunder') {
    // 第二幕：切换到暗道阶段
    if (G.player) { G.player.storyPhase = 2; }
    showToast('突变发生——必须立刻离开！');
    renderStoryPanel(document.getElementById('camp-content'));
  } else if (eventId === 'act3_escape') {
    // 暗道战斗 → 触发教学战
    startBattle('shadow_assassin'); // TODO: 定义敌人ID
  } else if (eventId === 'act4_snow') {
    // TODO: 接入柳清寒对话数据（NPC_DIALOGS['liu_qinghan']）
    if (NPC_DIALOGS['liu_qinghan']) {
      openDialog('liu_qinghan');
    } else {
      showToast('柳清寒的对话正在酝酿中…');
    }
  } else {
    showToast('剧情即将到来…');
  }
}

// =========================================================
//  屏幕4：学习技能
// =========================================================
function renderLearnScreen() {
  const container = document.getElementById('elder-list');
  container.innerHTML = '';
  ELDERS.forEach(elder => {
    const div = document.createElement('div');
    div.className = `elder-card ${G.learnElderId === elder.id ? 'active' : ''}`;
    div.innerHTML = `
      <img src="${elder.img}" alt="${elder.name}" onerror="this.style.display='none'">
      <div><div class="elder-name">${elder.name}</div><div class="elder-sect">${SECTS[elder.sect]?.name || ''}</div></div>
    `;
    div.addEventListener('click', () => {
      document.querySelectorAll('.elder-card').forEach(e => e.classList.remove('active'));
      div.classList.add('active');
      G.learnElderId = elder.id;
      renderElderDetail(elder);
    });
    container.appendChild(div);
  });

  // 默认选第一个
  if (ELDERS.length > 0 && !G.learnElderId) {
    G.learnElderId = ELDERS[0].id;
    container.firstChild.classList.add('active');
    renderElderDetail(ELDERS[0]);
  } else if (G.learnElderId) {
    const elder = ELDERS.find(e => e.id === G.learnElderId);
    if (elder) renderElderDetail(elder);
  }
}

function renderElderDetail(elder) {
  const p = G.player;
  const detail = document.getElementById('learn-detail');

  // 当前武学经验显示
  const expHtml = `<div style="display:flex;align-items:center;gap:12px;padding:10px 20px;background:rgba(0,0,0,0.3);border-bottom:1px solid var(--border-dim);font-size:13px;color:var(--text-dim);letter-spacing:1px;">
    <span>📜 当前武学经验：<strong style="color:#5dade2;">${p.exp}</strong> 点</span>
    <span style="color:var(--border-dim);">|</span>
    <span>已学武功：<strong style="color:var(--text-gold);">${p.skills.length}</strong> 门</span>
  </div>`;

  let skillsHtml = '';
  elder.skills.forEach(skId => {
    const sk = SKILLS[skId];
    if (!sk) return;
    const learned = p.skills.includes(skId);
    const typeTag = { attack: '攻击', support: '辅助', control: '控制', passive: '被动' };
    skillsHtml += `
      <div class="learn-skill-card ${learned ? 'learned' : ''}">
        <div class="lsc-top">
          <span class="lsc-icon">${sk.icon}</span>
          <span class="lsc-name">${sk.name}</span>
          <span class="skill-tag tag-${sk.type || 'attack'}" style="margin-left:auto;">${typeTag[sk.type] || ''}</span>
        </div>
        <div class="lsc-desc">${sk.desc}</div>
        <div class="lsc-cost">消耗：武学经验 ${sk.cost.exp} 点</div>
        <button class="${learned ? 'lsc-btn learned-btn' : 'lsc-btn'}" ${learned ? 'disabled' : `onclick="learnSkill('${skId}','${elder.id}')"`}>
          ${learned ? '✓ 已习得' : '传功学习'}
        </button>
      </div>
    `;
  });

  detail.innerHTML = `
    ${expHtml}
    <div class="learn-npc-header">
      <img src="${elder.img}" alt="${elder.name}" onerror="this.style.display='none'">
      <div>
        <div style="font-size:16px;color:var(--text-gold);letter-spacing:3px;">${elder.name}</div>
        <div style="font-size:12px;color:var(--text-dim);margin-top:4px;">${SECTS[elder.sect]?.name || ''}</div>
        <div class="npc-intro">${elder.intro}</div>
      </div>
    </div>
    <div class="learn-skill-grid">${skillsHtml}</div>
  `;
}

function learnSkill(skId, elderId) {
  const p = G.player;
  const sk = SKILLS[skId];
  if (!sk) return;
  if (p.skills.includes(skId)) { showToast('已经习得此武功'); return; }
  if (p.exp < sk.cost.exp) { showToast(`经验不足，需要 ${sk.cost.exp} 点武学经验（当前：${p.exp}）`); return; }
  p.exp -= sk.cost.exp;
  p.skills.push(skId);
  if (G.player && G.player._slot != null) saveGame(G.player._slot); else saveGame();
  showToast(`成功习得「${sk.name}」！`);
  renderSidebar();
  const elder = ELDERS.find(e => e.id === elderId);
  if (elder) renderElderDetail(elder);
}

// =========================================================
//  屏幕5：NPC对话
// =========================================================
function openDialog(npcId) {
  const npcData = NPC_DIALOGS[npcId];
  if (!npcData) return;
  G.dialogNpcId = npcId;
  // 根据玩家任务进度决定从哪个节点开始
  let startNode = 'start';
  if (npcId === 'wudang_zhangsan' && G.player) {
    if (G.player.wudangElderCleared) startNode = 'mission_complete';
    else if (G.player.wudangMissionAccepted) startNode = 'mission_progress';
    else if (G.player.tutorialDone) startNode = 'mission_offer';
  }
  G.dialogNode = startNode;
  showScreen('dialog');
  renderDialog(npcData, startNode);
}

function renderDialog(npcData, nodeId) {
  const node = npcData.dialogs[nodeId];
  if (!node) { closeDialog(); return; }
  G.dialogNode = nodeId;

  const img = document.getElementById('dialog-npc-img');
  img.src = npcData.img;
  img.onerror = () => { img.style.display = 'none'; };
  document.getElementById('dialog-speaker').textContent = npcData.name;

  // 渲染对话文本（支持简单模板）
  const contentEl = document.getElementById('dialog-content');
  const rawText = (node.text || '');
  const renderedText = rawText
    .replace(/\$\{G\.player\?\.(\w+)\s*\?\s*'([^']*)'\s*:\s*'([^']*)'\}/g,
      (_, flag, truthy, falsy) => (G.player && G.player[flag]) ? truthy : falsy);
  typewriter(contentEl, renderedText, 35, () => {});
  // 立刻渲染选项
  renderChoices(npcData, node.choices);
}

function renderChoices(npcData, choices) {
  const box = document.getElementById('dialog-choices');
  box.innerHTML = '';
  choices.forEach(c => {
    const btn = document.createElement('button');
    btn.className = 'dialog-choice-btn';
    btn.textContent = c.text;
    btn.addEventListener('click', () => {
      if (c.effect) applyDialogEffect(c.effect);
      if (c.next) renderDialog(npcData, c.next);
      else closeDialog();
    });
    box.appendChild(btn);
  });
}

function applyDialogEffect(effect) {
  if (!G.player) return;
  switch (effect) {
    case 'acceptMission':
      G.player.wudangMissionAccepted = true;
      if (G.player._slot != null) saveGame(G.player._slot);
      showToast('武当山任务已接受！');
      break;
    case 'claimReward':
      // 给予太极拳技能（如果尚未学会）
      if (!G.player.skills.includes('taiji')) {
        G.player.skills.push('taiji');
      }
      G.player.gold = (G.player.gold || 0) + 100;
      G.player.wudangMissionComplete = true;
      if (G.player._slot != null) saveGame(G.player._slot);
      showToast('获得武学残卷（太极拳）+ 100两！');
      break;
  }
}

// =========================================================
//  电影序列引擎（开场序幕·第一章）
// =========================================================
let _storyNodeId = 'start';
let _storyAutoTimer = null;
let _storyWaiting = false; // 等待用户点击
let _storyBattleWinCallback = null;
let _storyBattleLoseCallback = null;

function runStoryIntro() {
  // 创建角色后进入序幕
  _storyNodeId = 'start';
  showScreen('story');
  const storyBg = document.getElementById('story-bg');
  if (storyBg) { storyBg.classList.remove('visible'); storyBg.style.backgroundImage = ''; }
  // 绑定点击继续（安全检查）
  const storyOverlay = document.getElementById('story-overlay');
  if (storyOverlay) storyOverlay.onclick = _storyHandleClick;
  document.getElementById('story-continue-hint').classList.add('hidden');
  showStoryNode('start');
}

function _storyHandleClick(e) {
  if (e.target.closest('.story-skip-btn')) return;
  if (e.target.closest('.story-choice-btn')) return;
  // 打字动画还在运行：先显示完当前文字，不跳转
  if (_storyAutoTimer) {
    clearInterval(_storyAutoTimer);
    _storyAutoTimer = null;
    // 安全检查：确保 node.text 有效才显示
    const node = STORY_INTRO[_storyNodeId];
    if (node && node.text != null) {
      let text = String(node.text || '');
      if (node.speaker === '我' && G.player) text = text.replace('%s%', G.player.name || '少年');
      const textEl = document.getElementById('story-dialogue-text') || document.getElementById('story-narration-text');
      if (textEl) textEl.textContent = text;
    }
    document.getElementById('story-continue-hint').classList.remove('hidden');
    return;
  }
  // 打字完成，才跳转到 next
  const node = STORY_INTRO[_storyNodeId];
  if (!node) return;
  if (node.next) showStoryNode(node.next);
  else if (node.choices) { /* 选项节点，等待点击 */ }
}

function showStoryNode(nodeId) {
  if (nodeId === 'END') { finishStoryIntro(); return; }
  const node = STORY_INTRO[nodeId];
  if (!node) { finishStoryIntro(); return; }
  _storyNodeId = nodeId;
  document.getElementById('story-continue-hint').classList.add('hidden');
  document.getElementById('story-narration-mode').classList.add('hidden');
  document.getElementById('story-dialogue-mode').classList.add('hidden');
  if (_storyAutoTimer) { clearInterval(_storyAutoTimer); _storyAutoTimer = null; }

  if (node.type === 'narration') {
    _showStoryNarration(node);
  } else if (node.type === 'dialogue') {
    _showStoryDialogue(node);
  } else if (node.type === 'cg') {
    _showStoryCG(node);
  } else if (node.type === 'flash') {
    _doFlash(node.next);
  } else if (node.type === 'choice') {
    _showStoryChoices(node);
  } else if (node.type === 'battle') {
    _startStoryBattle(node);
  } else {
    // 未知类型：安全跳转，不留空白
    if (node.next) showStoryNode(node.next);
    else finishStoryIntro();
  }
}

function _showStoryNarration(node) {
  const el = document.getElementById('story-narration-mode');
  const textEl = document.getElementById('story-narration-text');
  el.classList.remove('hidden');
  _typeText(textEl, node.text, 28, () => {
    document.getElementById('story-continue-hint').classList.remove('hidden');
    _storyWaiting = false;
    if (node.next) { _storyWaiting = true; /* 点击继续 */ }
    else { _storyWaiting = true; }
  });
  _storyWaiting = true;
}

function _showStoryDialogue(node) {
  const el = document.getElementById('story-dialogue-mode');
  el.classList.remove('hidden');
  // 处理玩家名字中的 %s%
  let displayText = node.text;
  if (node.speaker === '我' && G.player) {
    displayText = displayText.replace('%s%', G.player.name || '少年');
  }
  // 说话者名称
  document.getElementById('story-speaker-name').textContent = node.speaker;
  // 立绘（安全检查）
  const portraitEl = document.getElementById('story-char-portrait');
  if (portraitEl) {
    if (node.portrait) {
      portraitEl.src = node.portrait;
      portraitEl.style.display = 'block';
      portraitEl.onerror = () => { portraitEl.style.display = 'none'; };
    } else {
      portraitEl.style.display = 'none';
    }
  }
  // 背景图
  if (node.bg) {
    const bg = document.getElementById('story-bg');
    bg.style.backgroundImage = `url('${node.bg}')`;
    bg.classList.add('visible');
  }
  // 对话文字
  const textEl = document.getElementById('story-dialogue-text');
  _typeText(textEl, displayText, 25, () => {
    document.getElementById('story-continue-hint').classList.remove('hidden');
    _storyWaiting = false;
    _storyWaiting = true;
  });
  _storyWaiting = true;
  // 清空选项
  document.getElementById('story-choices-area').innerHTML = '';
}

function _showStoryCG(node) {
  const bg = document.getElementById('story-bg');
  bg.style.backgroundImage = `url('${node.bg}')`;
  bg.classList.remove('visible');
  // 先淡出
  setTimeout(() => {
    bg.classList.add('visible');
    _storyAutoTimer = setTimeout(() => {
      if (node.next) showStoryNode(node.next);
    }, node.delay || 3000);
  }, 200);
}

function _doFlash(next) {
  const bg = document.getElementById('story-bg');
  bg.style.backgroundImage = '';
  bg.style.background = '#ffffff';
  bg.classList.add('visible');
  setTimeout(() => {
    bg.classList.remove('visible');
    bg.style.background = '';
    setTimeout(() => {
      if (next) showStoryNode(next);
    }, 300);
  }, 400);
}

function _showStoryChoices(node) {
  const area = document.getElementById('story-choices-area');
  area.innerHTML = '';
  node.choices.forEach(choice => {
    const btn = document.createElement('button');
    btn.className = 'story-choice-btn';
    btn.textContent = choice.text;
    btn.onclick = () => {
      if (_storyAutoTimer) { clearInterval(_storyAutoTimer); _storyAutoTimer = null; }
      showStoryNode(choice.next);
    };
    area.appendChild(btn);
  });
  _storyWaiting = false;
  document.getElementById('story-continue-hint').classList.add('hidden');
}

function _startStoryBattle(node) {
  _storyBattleWinCallback = () => {
    if (node.nextOnWin) showStoryNode(node.nextOnWin);
  };
  _storyBattleLoseCallback = () => {
    if (node.nextOnLose) showStoryNode(node.nextOnLose);
    else if (node.nextOnWin) showStoryNode(node.nextOnWin);
  };
  // 触发战斗
  if (typeof startBattle === 'function') {
    startBattle(node.enemyId);
  } else {
    // 敌人未定义时，直接跳过
    showToast('（暗道已通过）');
    if (node.nextOnWin) showStoryNode(node.nextOnWin);
  }
}

function skipStoryIntro() {
  // 跳过序幕，直接进入营地
  if (_storyAutoTimer) { clearInterval(_storyAutoTimer); _storyAutoTimer = null; }
  finishStoryIntro();
}

function finishStoryIntro() {
  // 序幕结束：标记剧情完成，进入营地
  // 入武当后，主角从凡人属性升级为门派标准属性
  if (G.player) {
    G.player.storyPhase = 3; // 第一章完成，进入营地后的阶段
    G.player.tutorialDone = true;
    // 凡人→武当弟子：属性重置为门派标准
    const wudangStats = {
      hp: 230, maxHp: 230, mp: 130, maxMp: 130,
      atk: 30, def: 15, agi: 15, crit: 5,
      level: 1,  // 炼气入门
    };
    Object.assign(G.player, wudangStats);
    // 入武当后不自动学技能——技能需通过拜师学功或剧情获得
    if (G.player._slot != null) saveGame(G.player._slot);
  }
  enterCamp();
}

function _typeText(el, text, speed, cb) {
  // 安全防护：确保 text 是有效字符串
  if (el) el.textContent = '';
  if (text == null) { if (cb) cb(); return; }
  text = String(text);
  let i = 0;
  _storyAutoTimer = setInterval(() => {
    if (el && i < text.length) {
      el.textContent += text[i];
      i++;
    }
    if (i >= text.length) { clearInterval(_storyAutoTimer); _storyAutoTimer = null; if (cb) cb(); }
  }, speed);
}

function closeDialog() {
  // 营地内对话关闭后，回到营地
  showScreen('camp');
  renderCampTopbar();
  renderSidebar();
  if (G.campTab === 'map') {
    // 刷新选关面板
    const dc = document.getElementById('camp-content');
    if (dc) renderDepartPanel();
  } else if (G.campTab === 'story') {
    renderStoryPanel(document.getElementById('camp-content'));
  }
}

function typewriter(el, text, speed, cb) {
  el.textContent = '';
  let i = 0;
  const timer = setInterval(() => {
    el.textContent += text[i];
    i++;
    if (i >= text.length) { clearInterval(timer); if (cb) cb(); }
  }, speed);
}

// =========================================================
//  初始化入口
// =========================================================
window.addEventListener('DOMContentLoaded', () => {
  initParticles();
  initAudio();
  initMainMenu(); // 初始化主菜单按钮

  // 返回按钮
  document.getElementById('btn-back-create').addEventListener('click', () => {
    pendingSlot = null;
    closeSaveSelect();
  });
  // btn-back-learn 已移除（screen-learn 已删除）
  document.getElementById('btn-confirm-create').addEventListener('click', confirmCreate);
  document.getElementById('btn-close-dialog').addEventListener('click', closeDialog);

  // 营地右上角返回
  document.getElementById('btn-camp-back').addEventListener('click', () => {
    showScreen('main');
    switchMusic('https://pub-cdb8eae73d584ab0b7d006c460518c76.r2.dev/music/mainmusic2.mp3');
  });

  // 尝试自动播放BGM
  setTimeout(() => {
    bgMusic.play().catch(() => {});
  }, 500);

  // 战斗回合数实时显示
  const origStartPlayerTurn = window.startPlayerTurn;
  // 覆盖 battle.js 中的 startPlayerTurn 以更新UI回合显示
  // 通过 battle.js 内部直接处理，无需再覆盖
});

// =========================================================
//  新手引导系统（张三丰导师指引）
// =========================================================
const MENTOR_STEPS = [
  {
    step: '第一步',
    text: `<strong>${G.player?.name || '少侠'}，欢迎来到武当。</strong><br><br>
      老夫张三丰，武当派祖师。<br>
      看你初入江湖，特来指点一二。`,
    actions: [{ label: '愿听前辈教诲', action: 'next', primary: true }],
  },
  {
    step: '第二步',
    text: `先打开你的<strong>随身包裹</strong>看看。<br><br>
      你背包里有一面<span class="hi">玄铁盾牌</span>，可在战斗前装备，提升防御；<br>
      还有一份<span class="hi">武学残卷</span>，可在「拜师学功」处学习武功。`,
    actions: [
      { label: '查看随身包裹', action: 'goto_bag', primary: true },
      { label: '跳过引导', action: 'skip', primary: false },
    ],
  },
  {
    step: '第三步',
    text: `很好！盾牌可在<strong>随身包裹</strong>中装备。<br><br>
      接下来，前往<strong>拜师学功</strong>处学习你的第一门武功吧。<br>
      武当的传功长老会传授你入门武学。`,
    actions: [
      { label: '前往拜师学功', action: 'goto_learn', primary: true },
      { label: '稍后再说', action: 'skip', primary: false },
    ],
  },
  {
    step: '第四步',
    text: `很好！学到的武功需要<strong>装备到技能栏</strong>才能在战斗中使用。<br><br>
      返回营地后，点击<strong>「技能配置」</strong>，将武功拖入上阵栏（共4格）。<br>
      <span class="hi">习得而不装备，等于不会。</span>`,
    actions: [
      { label: '返回营地配置技能', action: 'goto_skills', primary: true },
      { label: '跳过引导', action: 'skip', primary: false },
    ],
  },
  {
    step: '第五步',
    text: `很好！你已掌握了入门之道。<br><br>
      踏入江湖前，务必确保技能已装备。江湖险恶，<span class="hi">有备无患</span>。<br><br>
      老夫去也，愿你名扬四海！`,
    actions: [{ label: '谢前辈指点！', action: 'close', primary: true }],
  },
];

let mentorStepIndex = 0;
let mentorShownThisSession = false; // 会话级防护：本次进入营地后不再重复触发
let mentorPendingAction = null; // 存储引导期间用户切换tab的状态

function showMentorGuide(stepIndex) {
  // 会话级防护：完成或跳过后不再显示
  if (mentorShownThisSession) return;

  if (stepIndex >= MENTOR_STEPS.length) {
    // 所有步骤完成：立即标记并保存
    G.player.tutorialDone = true;
    if (G.player._slot != null) saveGame(G.player._slot);
    mentorShownThisSession = true;
    closeMentorGuide();
    return;
  }
  mentorStepIndex = stepIndex;
  const step = MENTOR_STEPS[stepIndex];
  document.getElementById('mentor-step-label').textContent = step.step;
  document.getElementById('mentor-text').innerHTML = step.text;

  const actionsEl = document.getElementById('mentor-actions');
  actionsEl.innerHTML = '';
  step.actions.forEach(a => {
    const btn = document.createElement('button');
    btn.className = 'mentor-action-btn' + (a.primary ? ' primary' : '');
    btn.textContent = a.label;
    btn.addEventListener('click', () => handleMentorAction(a.action));
    actionsEl.appendChild(btn);
  });

  document.getElementById('mentor-guide').classList.remove('hidden');
}

function handleMentorAction(action) {
  switch (action) {
    case 'next':
      showMentorGuide(mentorStepIndex + 1);
      break;
    case 'goto_bag':
      mentorPendingAction = 'bag';
      closeMentorGuide();
      switchCampTab('bag');
      break;
    case 'goto_learn':
      mentorPendingAction = 'learn';
      closeMentorGuide();
      showScreen('learn');
      renderLearnScreen();
      break;
    case 'goto_skills':
      mentorPendingAction = 'skills';
      closeMentorGuide();
      switchCampTab('skill');
      break;
    case 'skip':
    case 'close':
      // 跳过/关闭：立即标记并保存
      G.player.tutorialDone = true;
      if (G.player._slot != null) saveGame(G.player._slot);
      mentorShownThisSession = true;
      closeMentorGuide();
      break;
  }
}

function closeMentorGuide() {
  document.getElementById('mentor-guide').classList.add('hidden');
  // 如果是引导中点击跳过或完成，标记完成
  if (mentorStepIndex > 0 || mentorPendingAction === null) {
    // 已经显示过引导，这次不是中途退出，不需要处理
  }
}

// =========================================================
//  踏入江湖前技能提醒
// =========================================================
function checkSkillBeforeBattle() {
  const p = G.player;
  const equipped = (p.equippedSkills || []).filter(Boolean);
  const learned = p.skills || [];

  // 没有任何技能 → 强制提醒
  if (learned.length === 0) {
    showSkillReminder('learn_first');
    return false;
  }
  // 有技能但没装备 → 提醒装备
  if (equipped.length === 0) {
    showSkillReminder('equip_first');
    return false;
  }
  // 技能都已装备 → 正常进入
  return true;
}

function showSkillReminder(type) {
  const textEl = document.getElementById('skill-reminder-text');
  const actionsEl = document.getElementById('skill-reminder-actions');
  if (type === 'learn_first') {
    textEl.innerHTML = `<strong>且慢！</strong><br><br>
      你尚未学习任何武功，贸然踏入江湖恐怕凶多吉少。<br><br>
      请先前往<strong>「拜师学功」</strong>处学习一门武功。`;
    actionsEl.innerHTML = `
      <button class="mentor-action-btn primary" onclick="closeSkillReminder();showScreen('learn');renderLearnScreen();">前往学功</button>
      <button class="mentor-action-btn" onclick="closeSkillReminder()">强行进入</button>`;
  } else {
    textEl.innerHTML = `<strong>且慢！</strong><br><br>
      你已学习了武功，但<span class="hi">尚未装备到上阵栏</span>。<br>
      未装备的技能在战斗中无法使用。<br><br>
      请先前往<strong>「技能配置」</strong>处装备技能（最多4格）。`;
    actionsEl.innerHTML = `
      <button class="mentor-action-btn primary" onclick="closeSkillReminder();switchCampTab('skill');">去配置技能</button>
      <button class="mentor-action-btn" onclick="closeSkillReminder()">强行进入</button>`;
  }
  document.getElementById('skill-reminder').classList.remove('hidden');
}

function closeSkillReminder() {
  document.getElementById('skill-reminder').classList.add('hidden');
}

// ─── 营地重新进入时重绑导航（防止多次addEventListener叠加）───
function enterCamp() {
  // 防御：如果没有存档，直接返回主菜单
  if (!G.player) {
    showScreen('main');
    return;
  }

  // 注意：不重置 mentorShownThisSession —— 依赖 tutorialDone=true 永久屏蔽
  showScreen('camp');
  switchMusic('https://pub-cdb8eae73d584ab0b7d006c460518c76.r2.dev/music/mainmusic2.mp3');
  renderCampTopbar();
  renderSidebar();

  // 移除旧事件，重新绑定（防止多次叠加）
  document.querySelectorAll('.camp-nav-btn').forEach(btn => {
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);
  });
  document.querySelectorAll('.camp-nav-btn').forEach(btn => {
    btn.addEventListener('click', () => switchCampTab(btn.dataset.tab));
  });

  // 新手引导：首次进入营地（tutorialDone=false）时触发，且会话内不重复
  if (!G.player.tutorialDone) {
    setTimeout(() => showMentorGuide(0), 400);
  }

  // 默认显示"江湖往事"剧情tab
  switchCampTab('story');
}
