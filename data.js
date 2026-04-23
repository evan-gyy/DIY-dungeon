// ============================================================
//  DATA.js — 游戏静态数据配置
// ============================================================

// ------- 门派基础属性加成 -------
const SECTS = {
  wudang:  { name: '武当派', color: '#5dade2', icon: '☯️', bonus: { mp: 30, agi: 5 },  intro: '内外兼修，以柔克刚，武当剑法天下闻名。' },
  emei:    { name: '峨眉派', color: '#f1948a', icon: '🌸', bonus: { atk: 5, mp: 20 },  intro: '剑指苍穹，玉手素笺，峨眉武学妙不可言。' },
  shaolin: { name: '少林派', color: '#f0b27a', icon: '🏯', bonus: { hp: 50, def: 8 },  intro: '禅武合一，铜皮铁骨，少林功夫博大精深。' },
  beggar:  { name: '丐帮',   color: '#a9cce3', icon: '🐉', bonus: { atk: 8, agi: 3 },  intro: '行走江湖，降龙十八掌威震四方。' },
  huashan: { name: '华山派', color: '#82e0aa', icon: '⚔️', bonus: { atk: 10, crit: 5 }, intro: '剑气凌云，华山论剑，气宗与剑宗各领风骚。' },
  demon:   { name: '魔教',   color: '#c39bd3', icon: '🌙', bonus: { atk: 15, hp: -20 }, intro: '乾坤大挪移，日月神教，绝世神功令群雄胆寒。' },
};

// ------- 传功长老数据 -------
const ELDERS = [
  {
    id: 'wudang_elder',
    sect: 'wudang',
    name: '武当传功长老',
    img: 'https://pub-cdb8eae73d584ab0b7d006c460518c76.r2.dev/picture/NPC/武当派-传功长老.png',
    intro: '老夫修炼武当内功四十载，愿将毕生所学倾囊相授，只求武当之名传遍江湖。',
    skills: ['taiji', 'mianzhang', 'zixiao', 'wudang_sword'],
  },
  {
    id: 'emei_elder',
    sect: 'emei',
    name: '峨眉传功长老',
    img: 'https://pub-cdb8eae73d584ab0b7d006c460518c76.r2.dev/picture/NPC/峨眉派-传功长老.png',
    intro: '峨眉剑法与掌法相辅相成，女弟子习之可发挥百分百威力，男子亦有八成之功。',
    skills: ['emei_sword', 'liing_palm', 'emei_poison', 'hundred_birds'],
  },
  {
    id: 'shaolin_elder',
    sect: 'shaolin',
    name: '少林传功长老',
    img: 'https://pub-cdb8eae73d584ab0b7d006c460518c76.r2.dev/picture/NPC/少林派-传功长老.png',
    intro: '阿弥陀佛，少林七十二绝技非一日之功，习武先修心，心正则功成。',
    skills: ['vajra_palm', 'luohan_fist', '72_arts', 'yijin_jing'],
  },
  {
    id: 'beggar_elder',
    sect: 'beggar',
    name: '丐帮传功长老',
    img: 'https://pub-cdb8eae73d584ab0b7d006c460518c76.r2.dev/picture/NPC/丐帮-传功长老.png',
    intro: '打狗棒法乃帮主秘传，降龙十八掌更是震古烁今，老夫只传有缘人。',
    skills: ['stick_art', 'dragon_palm', 'beggar_fist', 'mud_walk'],
  },
];

// ------- 技能库（战斗完整参数版）-------
// type: 'attack'|'support'|'control'|'passive'
// target: 'enemy'|'self'
// hit: 命中次数
// powerMul: 伤害倍率 (最终伤害 = atk * powerMul - def * defPen，再乘暴击)
// defPen: 防御穿透系数（0=完全无视防御，1=正常减防御）
// cooldown: 冷却回合数（0=无冷却）
// effect: 附带状态效果 { type, value, duration }
//   type: 'poison'|'stun'|'weaken_def'|'buff_atk'|'evade'|'regen_mp'|'knockback'|'def_boost'
// healPct: 回血比例（占自身maxHp，0-1）
const SKILLS = {

  /* ====================================================
     被动·弈理心经（主角初始技能）
  ==================================================== */
  yi_li_xin_jing: {
    id: 'yi_li_xin_jing', name: '弈理心经', icon: '♟️', type: 'passive', target: 'self',
    mp: 0, hit: 0, powerMul: 0, defPen: 0,
    cooldown: 0, effect: { type: 'regen_mp_pct', value: 10, duration: 99 },
    healPct: 0,
    desc: '【被动】棋道入心，每回合自动恢复10%最大内力。战斗中可预判敌人下一招，在技能栏右侧显示。',
    cost: { exp: 0 }, sect: '',
    battleTip: '被动·预判敌招+百分比回内',
  },

  /* ====================================================
     武当派 · 内功/剑法/太极
  ==================================================== */
  mianzhang: {
    id: 'mianzhang', name: '绵掌', icon: '🌊', type: 'attack', target: 'enemy',
    mp: 12, hit: 2, powerMul: 0.55, defPen: 0.8,
    cooldown: 0, effect: null, healPct: 0,
    desc: '双掌连推，借力打力，命中两次各造成55%攻击伤害。',
    cost: { exp: 80 }, sect: 'wudang',
    battleTip: '连击流·消耗低',
  },
  taiji: {
    id: 'taiji', name: '太极拳', icon: '☯️', type: 'control', target: 'enemy',
    mp: 20, hit: 1, powerMul: 0.4, defPen: 0.5,
    cooldown: 2, effect: { type: 'stun', value: 1, duration: 1 },
    healPct: 0,
    desc: '以柔克刚，造成40%攻击伤害，70%概率使敌方眩晕跳过下1回合。',
    cost: { exp: 100 }, sect: 'wudang',
    battleTip: '控制核心·高价值',
  },
  wudang_sword: {
    id: 'wudang_sword', name: '武当剑法', icon: '🗡️', type: 'attack', target: 'enemy',
    mp: 28, hit: 1, powerMul: 1.5, defPen: 0.6,
    cooldown: 1, effect: { type: 'weaken_def', value: 8, duration: 2 },
    healPct: 0,
    desc: '一剑三式凝而为一，造成150%攻击伤害，并降低敌方防御8点持续2回合。',
    cost: { exp: 150 }, sect: 'wudang',
    battleTip: '爆发·减防连招',
  },
  zixiao: {
    id: 'zixiao', name: '紫霄神功', icon: '⚡', type: 'passive', target: 'self',
    mp: 0, hit: 0, powerMul: 0, defPen: 0,
    cooldown: 0, effect: { type: 'regen_mp', value: 6, duration: 99 },
    healPct: 0,
    desc: '【被动】每回合自动恢复6点内力，不占行动。',
    cost: { exp: 200 }, sect: 'wudang',
    battleTip: '被动·内力引擎',
  },

  /* ====================================================
     峨眉派 · 剑法/指法/毒
  ==================================================== */
  emei_sword: {
    id: 'emei_sword', name: '峨眉剑法', icon: '🌸', type: 'attack', target: 'enemy',
    mp: 18, hit: 2, powerMul: 0.65, defPen: 0.9,
    cooldown: 0, effect: null, healPct: 0,
    desc: '轻灵双剑各击一次，各造成65%攻击伤害，穿透防御较高。',
    cost: { exp: 120 }, sect: 'emei',
    battleTip: '高穿透连击',
  },
  liing_palm: {
    id: 'liing_palm', name: '灵蛇掌', icon: '🐍', type: 'attack', target: 'enemy',
    mp: 25, hit: 1, powerMul: 0.9, defPen: 0.7,
    cooldown: 2, effect: { type: 'poison', value: 12, duration: 3 },
    healPct: 0,
    desc: '造成90%攻击伤害，并施毒3回合，每回合损失12点HP（不计防御）。',
    cost: { exp: 130 }, sect: 'emei',
    battleTip: '中毒·持续消耗',
  },
  emei_poison: {
    id: 'emei_poison', name: '七步断肠散', icon: '☠️', type: 'control', target: 'enemy',
    mp: 35, hit: 0, powerMul: 0, defPen: 0,
    cooldown: 3, effect: { type: 'strong_poison', value: 20, duration: 4 },
    healPct: 0,
    desc: '不造成直接伤害，施加强毒4回合，每回合损失20HP，并降低攻击力10%。',
    cost: { exp: 200 }, sect: 'emei',
    battleTip: '纯控·高毒叠加',
  },
  hundred_birds: {
    id: 'hundred_birds', name: '百鸟朝凤', icon: '🦅', type: 'support', target: 'self',
    mp: 32, hit: 0, powerMul: 0, defPen: 0,
    cooldown: 3, effect: { type: 'buff_atk', value: 15, duration: 2 },
    healPct: 0,
    desc: '聚气运功，自身攻击力提升15点持续2回合。',
    cost: { exp: 180 }, sect: 'emei',
    battleTip: '攻击增益·爆发前摇',
  },

  /* ====================================================
     少林派 · 拳法/棍法/金刚体
  ==================================================== */
  luohan_fist: {
    id: 'luohan_fist', name: '罗汉拳', icon: '🥊', type: 'attack', target: 'enemy',
    mp: 8, hit: 3, powerMul: 0.38, defPen: 0.6,
    cooldown: 0, effect: null, healPct: 0,
    desc: '连出三拳，每拳造成38%攻击伤害，内力消耗极省。',
    cost: { exp: 60 }, sect: 'shaolin',
    battleTip: '低消耗·三连击',
  },
  vajra_palm: {
    id: 'vajra_palm', name: '金刚掌', icon: '👊', type: 'attack', target: 'enemy',
    mp: 22, hit: 1, powerMul: 1.6, defPen: 0.3,
    cooldown: 1, effect: null, healPct: 0,
    desc: '全力一掌，造成160%攻击伤害，但防御穿透低（对高防敌人效果差）。',
    cost: { exp: 100 }, sect: 'shaolin',
    battleTip: '高爆发·打低防敌人',
  },
  yijin_jing: {
    id: 'yijin_jing', name: '易筋经', icon: '📿', type: 'support', target: 'self',
    mp: 28, hit: 0, powerMul: 0, defPen: 0,
    cooldown: 2, effect: null, healPct: 0.28,
    desc: '内功运转全身经脉，恢复自身28%最大HP。',
    cost: { exp: 180 }, sect: 'shaolin',
    battleTip: '中量回血·维持续航',
  },
  '72_arts': {
    id: '72_arts', name: '金刚护体', icon: '🏯', type: 'support', target: 'self',
    mp: 20, hit: 0, powerMul: 0, defPen: 0,
    cooldown: 3, effect: { type: 'def_boost', value: 20, duration: 3 },
    healPct: 0,
    desc: '运转少林金刚功，防御提升20点持续3回合。',
    cost: { exp: 300 }, sect: 'shaolin',
    battleTip: '防御增益·硬扛期',
  },

  /* ====================================================
     丐帮 · 棍法/降龙/步法
  ==================================================== */
  beggar_fist: {
    id: 'beggar_fist', name: '丐帮拳法', icon: '✊', type: 'attack', target: 'enemy',
    mp: 6, hit: 1, powerMul: 0.85, defPen: 0.7,
    cooldown: 0, effect: null, healPct: 0,
    desc: '野路子重拳，造成85%攻击伤害，内力消耗极低，适合持久消耗。',
    cost: { exp: 50 }, sect: 'beggar',
    battleTip: '性价比最高的普攻升级',
  },
  stick_art: {
    id: 'stick_art', name: '打狗棒法', icon: '🦯', type: 'attack', target: 'enemy',
    mp: 22, hit: 1, powerMul: 1.2, defPen: 0.8,
    cooldown: 1, effect: { type: 'knockback', value: 1, duration: 1 },
    healPct: 0,
    desc: '造成120%攻击伤害，60%概率使敌方跳过下1回合行动（击飞）。',
    cost: { exp: 200 }, sect: 'beggar',
    battleTip: '强控概率·高性能',
  },
  mud_walk: {
    id: 'mud_walk', name: '泥鳅步法', icon: '🌀', type: 'support', target: 'self',
    mp: 14, hit: 0, powerMul: 0, defPen: 0,
    cooldown: 2, effect: { type: 'evade', value: 0.5, duration: 1 },
    healPct: 0,
    desc: '身法奇诡，本回合后闪避率提升50%，可规避一次伤害。',
    cost: { exp: 100 }, sect: 'beggar',
    battleTip: '规避关键一击',
  },
  dragon_palm: {
    id: 'dragon_palm', name: '降龙十八掌', icon: '🐉', type: 'attack', target: 'enemy',
    mp: 45, hit: 1, powerMul: 2.2, defPen: 0.5,
    cooldown: 2, effect: null, healPct: 0,
    desc: '亢龙有悔！倾尽内力，造成220%攻击伤害，威力冠绝群雄。',
    cost: { exp: 350 }, sect: 'beggar',
    battleTip: '终极爆发·高冷却',
  },
};

// ------- NPC对话树 -------
const NPC_DIALOGS = {
  'wudang_zhangsan': {
    name: '张三丰',
    img: 'https://pub-cdb8eae73d584ab0b7d006c460518c76.r2.dev/picture/NPC/武当派-张三丰.png',
    sect: '武当派掌门',
    dialogs: {
      start: {
        text: '老道在此等候多时了。江湖风云变幻，你我有缘相遇，自当结交一番。',
        choices: [
          { text: '前辈，江湖近来可有异动？', next: 'wulin_news' },
          { text: '晚辈久仰真人大名，还望指点迷津。', next: 'guidance' },
          { text: '告辞。', next: null },
        ],
      },
      wulin_news: {
        text: '魔教近来动作频繁，据闻乾坤大挪移已练至第七层……老道心中甚是忧虑。此事非同小可，还需各大门派齐心协力方可应对。',
        choices: [
          { text: '魔教当真如此强盛？', next: 'about_demon' },
          { text: '晚辈愿为武林出力。', next: 'pledge' },
          { text: '告辞。', next: null },
        ],
      },
      guidance: {
        text: '练武之道，内外兼修。你需先将根基打牢，再求上层武学。切记：欲速则不达。',
        choices: [
          { text: '多谢指点，晚辈定当铭记。', next: 'end_good' },
          { text: '告辞。', next: null },
        ],
      },
      about_demon: {
        text: '魔教数十年卧薪尝胆，如今教主手握神功，其野心昭然若揭。武林五大门派须联手，方可保得苍生太平。',
        choices: [
          { text: '晚辈愿为武林出力。', next: 'pledge' },
          { text: '告辞。', next: null },
        ],
      },
      pledge: {
        text: '好！有志气！你我就此相约，待时机成熟，老道自会召集各派英雄，共商大计。你且回去准备，磨砺武艺，静待消息。',
        choices: [{ text: '告辞，晚辈定不辱命。', next: null }],
      },
      end_good: {
        text: '孺子可教。去吧，愿你在江湖上一路平安。',
        choices: [{ text: '告辞。', next: null }],
      },
      // ── 武当主线任务分支（教程完成后解锁）──
      mission_offer: {
        text: '少侠，看你根基已稳，老道有一事相托。<br><br>武当山中近日有<span style="color:#e74c3c">魔教探子</span>出没，似在窥探我派武学秘籍。<br>你若愿意，可代老道<span style="color:#e8c87a">踏平武当山三关</span>，将探子尽数驱逐。<br><br>三关分别为：<span class="hi">山门弟子</span>、<span class="hi">中庭弟子</span>、<span class="hi">传功长老</span>。<br>每过一关，敌手便更强一分。若能战胜传功长老，老道另有<span style="color:#e8c87a">武学残卷相赠</span>。',
        choices: [
          { text: '晚辈愿往武当山！', next: 'mission_accepted', effect: 'acceptMission' },
          { text: '容我回去准备一番。', next: null },
        ],
      },
      mission_accepted: {
        text: '好！老道已将武当山三关入口置于「踏入江湖」之中。<br><br>记住：<span class="hi">气血与内力</span>是战斗的根本，若感不支，可返回营地休整。<br>三关难度递增，切莫冒进。去吧！',
        choices: [{ text: '谨遵前辈吩咐！', next: null }],
      },
      mission_progress: {
        text: '武当山三关尚未完成，继续努力！<br><br>当前进度：<span style="color:#e8c87a">山门弟子</span>已通过 / <span style="color:#e8c87a">中庭弟子</span>待通过 / <span style="color:#e8c87a">传功长老</span>待通过<br><br>请到「踏入江湖」处继续挑战！',
        choices: [
          { text: '告辞，我继续闯关！', next: null },
        ],
      },
      mission_complete: {
        text: '少侠！好！好！好！<br><br>你连破三关，将魔教探子尽数驱逐，武当上下无不佩服！<br><br>这枚<span style="color:#e8c87a">武学残卷（太极拳）</span>乃老道毕生心血所悟，今日便赠予你。<br>望你善加修习，日后必成大器！',
        choices: [
          { text: '多谢前辈厚赐！', next: null, effect: 'claimReward' },
        ],
      },
    },
  },

  'emei_miejue': {
    name: '灭绝师太',
    img: 'https://pub-cdb8eae73d584ab0b7d006c460518c76.r2.dev/picture/NPC/峨眉派-灭绝师太.png',
    sect: '峨眉派掌门',
    dialogs: {
      start: {
        text: '你来此何事？峨眉清净之地，闲杂人等不得久留。',
        choices: [
          { text: '晚辈只是路过，向前辈请安。', next: 'polite' },
          { text: '听闻峨眉武学高深，晚辈心向往之。', next: 'study' },
          { text: '告辞。', next: null },
        ],
      },
      polite: {
        text: '峨眉弟子皆是女中豪杰，行走江湖自有规矩。你若无事，便请离开，莫要扰了清修。',
        choices: [
          { text: '多有打扰，告辞。', next: null },
        ],
      },
      study: {
        text: '峨眉剑法非本门弟子不传，然……你既然有此心，我倒可看看你的资质。你现下修为几何？',
        choices: [
          { text: '晚辈资质平平，但志在武学。', next: 'test' },
          { text: '告辞。', next: null },
        ],
      },
      test: {
        text: '……嗯，倒是有几分悟性。你若能完成一件事，我便许你旁听峨眉剑法的练习。',
        choices: [{ text: '前辈请说，晚辈定当竭力完成。', next: 'quest' }],
      },
      quest: {
        text: '丐帮弟子近日骚扰峨眉山脚村民，你若能替我峨眉出面，驱走此等无赖，便算过了我这一关。',
        choices: [
          { text: '晚辈领命。', next: null },
          { text: '此事晚辈尽力而为。', next: null },
        ],
      },
    },
  },

  'shaolin_kongwen': {
    name: '方丈空闻',
    img: 'https://pub-cdb8eae73d584ab0b7d006c460518c76.r2.dev/picture/NPC/少林派-方丈空闻.png',
    sect: '少林寺方丈',
    dialogs: {
      start: {
        text: '阿弥陀佛，施主远道而来，请入禅房一叙。少林寺向来广开山门，有缘者皆可结交。',
        choices: [
          { text: '多谢方丈相邀。近来江湖风云如何？', next: 'wulin' },
          { text: '晚辈希望能旁听少林武学。', next: 'study' },
          { text: '打扰了，晚辈告辞。', next: null },
        ],
      },
      wulin: {
        text: '江湖中人，各有因果。少林乃武学正宗，从不主动介入门派纷争，然若魔教危及苍生，少林自不会袖手旁观。',
        choices: [
          { text: '方丈高义，晚辈佩服。', next: 'end_monk' },
          { text: '告辞。', next: null },
        ],
      },
      study: {
        text: '少林七十二绝技，非少林弟子不传。然易筋经、罗汉拳等基础功法，有缘者可与传功长老切磋交流。施主若有心，可去找传功长老。',
        choices: [
          { text: '多谢方丈指点。', next: 'end_monk' },
          { text: '告辞。', next: null },
        ],
      },
      end_monk: {
        text: '阿弥陀佛，施主保重，愿你江湖路上，行善积德，平安归来。',
        choices: [{ text: '告辞。', next: null }],
      },
    },
  },

  'beggar_hong': {
    name: '洪七公',
    img: 'https://pub-cdb8eae73d584ab0b7d006c460518c76.r2.dev/picture/NPC/丐帮-洪七公.png',
    sect: '丐帮帮主',
    dialogs: {
      start: {
        text: '哈哈哈！好小子，瞧你眼神灵动，是个练武的料子！来来来，你这是第一次见着洪七公吧？',
        choices: [
          { text: '晚辈久仰洪前辈大名！', next: 'happy' },
          { text: '前辈请了，晚辈有礼了。', next: 'polite' },
          { text: '告辞。', next: null },
        ],
      },
      happy: {
        text: '哈哈哈，孺子可教！老叫花我最喜欢你这样的后生——有眼力劲儿！降龙十八掌天下第一，你有没有胆子学？',
        choices: [
          { text: '晚辈愿意学，但恐怕资质不够。', next: 'teach_cond' },
          { text: '当然！请前辈赐教！', next: 'teach_cond' },
          { text: '告辞。', next: null },
        ],
      },
      polite: {
        text: '嗯，礼数不错，但练武之人贵在一个"真"字！降龙十八掌这样的功夫，讲究的是正大光明，容不得半分虚伪。',
        choices: [
          { text: '晚辈受教了。', next: 'teach_cond' },
          { text: '告辞。', next: null },
        ],
      },
      teach_cond: {
        text: '你要学降龙十八掌，第一：不能以武犯禁；第二：不能以强凌弱；第三：要心怀侠义！做到了这三点，老叫花亲自传你！',
        choices: [{ text: '晚辈谨遵前辈教诲，定不辱使命！', next: null }],
      },
    },
  },

  'huashan_master': {
    name: '华山掌门',
    img: 'https://pub-cdb8eae73d584ab0b7d006c460518c76.r2.dev/picture/NPC/华山派-掌门.png',
    sect: '华山派掌门',
    dialogs: {
      start: {
        text: '华山一派，自古主张以剑问天下。你来此处，是剑道同好，还是别有所图？',
        choices: [
          { text: '晚辈仰慕华山剑法，特来拜访。', next: 'sword_talk' },
          { text: '路过此地，前辈请了。', next: 'pass_by' },
          { text: '告辞。', next: null },
        ],
      },
      sword_talk: {
        text: '华山剑法有气宗与剑宗之分——气宗以内力为根，剑宗以剑速制胜。你倾向哪一路？',
        choices: [
          { text: '气宗，内力雄厚方能御剑。', next: 'qi_sect' },
          { text: '剑宗，速度与技巧才是王道。', next: 'sword_sect' },
          { text: '告辞。', next: null },
        ],
      },
      pass_by: {
        text: '江湖路上多保重，华山地势险峻，近日有魔教探子出没，你且小心。',
        choices: [{ text: '多谢前辈提醒，告辞。', next: null }],
      },
      qi_sect: {
        text: '气宗之道，厚积薄发。内力修炼非一日之功，但一旦成就，天下无敌。你有此志向，甚好。',
        choices: [{ text: '多谢前辈指点。', next: null }],
      },
      sword_sect: {
        text: '剑宗讲究人剑合一，一剑出，快若闪电。习此道者天赋要求极高，你若资质上佳，来日可切磋一番。',
        choices: [{ text: '多谢前辈，晚辈告辞。', next: null }],
      },
    },
  },

  'demon_master': {
    name: '魔教教主',
    img: 'https://pub-cdb8eae73d584ab0b7d006c460518c76.r2.dev/picture/NPC/魔教-教主.png',
    sect: '魔教',
    dialogs: {
      start: {
        text: '……有趣，一个小小的武者，竟敢来见本教主。你究竟是何人？来此有何目的？',
        choices: [
          { text: '晚辈只是想了解教主的志向。', next: 'intention' },
          { text: '你算什么东西？！', next: 'angry' },
          { text: '……告辞。', next: null },
        ],
      },
      intention: {
        text: '志向？哈……本教主只有一个目标——让整个武林跪在日月神教旗下。正邪之分不过是弱者为自己失败找的借口。',
        choices: [
          { text: '那魔教与武林各派之争，如何才能终结？', next: 'end_war' },
          { text: '晚辈不认同此理。', next: 'disagree' },
          { text: '告辞。', next: null },
        ],
      },
      angry: {
        text: '……。（教主眼神如刀，寒意逼人）你有胆量，倒是少见。本教主欣赏你这份莽劲儿……暂且饶你一命。',
        choices: [
          { text: '……晚辈告辞。', next: null },
        ],
      },
      end_war: {
        text: '终结？只有一方彻底消灭另一方，才能终结。正邪之争延续数百年，有你们武林七侠的一天就有这场战争。（深深注视着你）……你想终结它吗？',
        choices: [
          { text: '晚辈会尽力而为。', next: null },
          { text: '告辞。', next: null },
        ],
      },
      disagree: {
        text: '不认同？（淡淡一笑）等你见识过真正的力量，你会改变想法的。去吧，等你羽翼丰满，我们再谈。',
        choices: [{ text: '告辞。', next: null }],
      },
    },
  },

  /* ── 第一章·剧情NPC（营地"江湖往事"触发）── */
  mo_jiangqing: {
    name: '墨绐青',
    img: 'picture/female-main/女国师.png',
    sect: '隐居村妇 / 前朝国师',
    dialogs: {
      first_meet: {
        text: '小家伙，今日气色不错。那群人的实力……超乎我预料，还好你跑出来了。',
        choices: [
          { text: '墨姐姐，那些人究竟是谁？', next: 'ask_enemy' },
          { text: '我没事，您别担心。', next: null },
        ],
      },
      ask_enemy: {
        text: '王朝的人。准确地说……是冲着我来的。你能跑出来，是因为他们还不知道你的真实身份。',
        choices: [
          { text: '我是什么身份？', next: 'ask_identity' },
          { text: '……先不说这个了。', next: null },
        ],
      },
      ask_identity: {
        text: '等你再大些，我会告诉你。现在……你只需要知道：我会一直护着你，无论发生什么。',
        choices: [{ text: '（点头）', next: null }],
      },
    },
  },

  liu_qinghan: {
    name: '柳清寒',
    img: 'picture/female-main/柳清寒.png',
    sect: '武当大师姐 / 命中妻子',
    dialogs: {
      first_meet: {
        text: '你还愣着干什么？伤口不处理好，会留疤的。',
        choices: [
          { text: '……谢谢师姐。', next: 'warm' },
          { text: '我自己能行。', next: 'cold' },
        ],
      },
      warm: {
        text: '……别谢。我只是在做师尊交代的事。',
        choices: [{ text: '（总觉得她有些奇怪）', next: null }],
      },
      cold: {
        text: '随你。',
        choices: [{ text: '……好吧。', next: null }],
      },
      later: {
        text: '……你走得那么慢，是在等我吗。',
        choices: [
          { text: '山路难行，我想确认师姐安全。', next: 'blush' },
          { text: '我在看风景。', next: 'deflect' },
        ],
      },
      blush: {
        text: '……我不需要你担心。',
        choices: [{ text: '（她的耳根似乎有些红）', next: null }],
      },
      deflect: {
        text: '……是吗。雪景确实不错。',
        choices: [{ text: '（她好像有些失落）', next: null }],
      },
    },
  },
};

// ------- 默认角色初始属性 -------
function getDefaultStats(sect) {
  // 第一章：主角是凡人，尚未习武，属性极低
  // 入武当后（finishStoryIntro）会重置为门派标准属性
  const base = { hp: 80, maxHp: 80, mp: 20, maxMp: 20, atk: 8, def: 4, agi: 5, crit: 3, exp: 0, gold: 10, level: 0 };
  return base;
}

// ------- 初始背包道具 -------
const ITEMS = {
  hp_potion:  { id: 'hp_potion',  name: '红药丸',   icon: '🔴', desc: '恢复HP 50点。',   effect: { hp: 50 } },
  mp_potion:  { id: 'mp_potion',  name: '蓝药丸',   icon: '🔵', desc: '恢复MP 30点。',   effect: { mp: 30 } },
  exp_scroll: { id: 'exp_scroll', name: '武学秘籍', icon: '📜', desc: '获得经验值100点。', effect: { exp: 100 } },
  iron_guard: { id: 'iron_guard', name: '铁甲护心',  icon: '🛡️', desc: '装备后防御+10。',  effect: { def: 10 }, equip: true },
};

const DEFAULT_INVENTORY = [
  { ...ITEMS.hp_potion,  count: 5 },
  { ...ITEMS.mp_potion,  count: 3 },
  { ...ITEMS.exp_scroll, count: 1 },
  { ...ITEMS.iron_guard, count: 1 },
];

// ============================================================
//  敌人数据库
//  设计原则（参考暗黑地牢 + Pokémon 数值逻辑）：
//  · 玩家初始：ATK 30~45，DEF 15~23，HP 200~250
//  · 伤害公式：dmg = max(1, atk*powerMul - def*defPen*(0.6~1.0))
//  · 难度梯队：
//    - tier1（江湖喽啰）：HP 60~120，ATK 18~25，DEF 6~12
//    - tier2（武林好手）：HP 150~240，ATK 28~38，DEF 14~20
//    - tier3（一流高手）：HP 320~500，ATK 45~65，DEF 22~35
//  · 每个敌人有 2~3 个招式，AI 按权重随机选择
// ============================================================
const ENEMIES = {

  /* ────── Tier 1：江湖喽啰 ────── */
  rogue_thug: {
    id: 'rogue_thug', name: '山贼流氓', icon: '🗡️', tier: 1,
    hp: 80, maxHp: 80, atk: 20, def: 8, agi: 6,
    reward: { exp: 40, gold: 8 },
    loot: [{ id: 'hp_potion', chance: 0.4 }],
    actions: [
      { name: '乱刀', icon: '🗡️', powerMul: 0.9, defPen: 0.7, hit: 1, mpCost: 0, weight: 50, effect: null },
      { name: '猛冲', icon: '💨', powerMul: 1.2, defPen: 0.5, hit: 1, mpCost: 0, weight: 30, effect: null },
      { name: '防守', icon: '🛡️', powerMul: 0,   defPen: 0,   hit: 0, mpCost: 0, weight: 20, effect: { type: 'def_boost', value: 6, duration: 1 } },
    ],
    aiDesc: '普攻流，偶尔加防',
  },
  poison_woman: {
    id: 'poison_woman', name: '毒门女侠', icon: '🐍', tier: 1,
    hp: 65, maxHp: 65, atk: 18, def: 6, agi: 10,
    reward: { exp: 45, gold: 10 },
    loot: [{ id: 'mp_potion', chance: 0.4 }],
    actions: [
      { name: '飞针',   icon: '🎯', powerMul: 0.7, defPen: 0.9, hit: 1, mpCost: 0, weight: 40, effect: null },
      { name: '毒针',   icon: '☠️', powerMul: 0.3, defPen: 1.0, hit: 1, mpCost: 0, weight: 40, effect: { type: 'poison', value: 8, duration: 2 } },
      { name: '闪步',   icon: '🌀', powerMul: 0,   defPen: 0,   hit: 0, mpCost: 0, weight: 20, effect: { type: 'evade', value: 0.4, duration: 1 } },
    ],
    aiDesc: '毒dot流，善用闪避',
  },
  beggar_disciple: {
    id: 'beggar_disciple', name: '丐帮弟子', icon: '🦯', tier: 1,
    hp: 90, maxHp: 90, atk: 22, def: 10, agi: 7,
    reward: { exp: 38, gold: 6 },
    loot: [],
    actions: [
      { name: '棒打', icon: '🦯', powerMul: 1.0, defPen: 0.7, hit: 1, mpCost: 0, weight: 60, effect: null },
      { name: '扫堂腿', icon: '🦵', powerMul: 0.7, defPen: 0.8, hit: 1, mpCost: 0, weight: 40, effect: { type: 'stun', value: 1, duration: 1 } },
    ],
    aiDesc: '稳定输出，偶尔眩晕',
  },

  /* ────── Tier 2：武林好手 ────── */
  huashan_swordsman: {
    id: 'huashan_swordsman', name: '华山剑客', icon: '⚔️', tier: 2,
    hp: 180, maxHp: 180, atk: 34, def: 16, agi: 14,
    reward: { exp: 90, gold: 22 },
    loot: [{ id: 'exp_scroll', chance: 0.25 }],
    actions: [
      { name: '剑气斩',  icon: '⚡', powerMul: 1.1, defPen: 0.8, hit: 1, mpCost: 0, weight: 40, effect: null },
      { name: '连环剑',  icon: '🗡️', powerMul: 0.6, defPen: 0.9, hit: 2, mpCost: 0, weight: 35, effect: null },
      { name: '内力蓄势', icon: '🌀', powerMul: 0, defPen: 0, hit: 0, mpCost: 0, weight: 25,
        effect: { type: 'buff_atk', value: 12, duration: 2 } },
    ],
    aiDesc: '连击+蓄势爆发',
  },
  emei_nun: {
    id: 'emei_nun', name: '峨眉师姐', icon: '🌸', tier: 2,
    hp: 160, maxHp: 160, atk: 30, def: 18, agi: 16,
    reward: { exp: 85, gold: 20 },
    loot: [{ id: 'hp_potion', chance: 0.35 }],
    actions: [
      { name: '峨眉剑', icon: '🌸', powerMul: 0.75, defPen: 0.85, hit: 2, mpCost: 0, weight: 45, effect: null },
      { name: '银丝毒',  icon: '🐍', powerMul: 0.4,  defPen: 0.7,  hit: 1, mpCost: 0, weight: 35,
        effect: { type: 'poison', value: 10, duration: 3 } },
      { name: '疗伤',    icon: '💚', powerMul: 0, defPen: 0, hit: 0, mpCost: 0, weight: 20,
        effect: { type: 'self_heal', value: 0.2, duration: 1 } },
    ],
    aiDesc: '连击+毒+自愈',
  },
  shaolin_monk: {
    id: 'shaolin_monk', name: '少林武僧', icon: '🏯', tier: 2,
    hp: 230, maxHp: 230, atk: 32, def: 22, agi: 8,
    reward: { exp: 95, gold: 24 },
    loot: [{ id: 'iron_guard', chance: 0.15 }],
    actions: [
      { name: '金刚拳',  icon: '👊', powerMul: 1.3, defPen: 0.4, hit: 1, mpCost: 0, weight: 45, effect: null },
      { name: '铁布衫',  icon: '🏯', powerMul: 0,   defPen: 0,   hit: 0, mpCost: 0, weight: 30,
        effect: { type: 'def_boost', value: 15, duration: 2 } },
      { name: '扫地腿',  icon: '🦵', powerMul: 0.8, defPen: 0.6, hit: 1, mpCost: 0, weight: 25,
        effect: { type: 'stun', value: 1, duration: 1 } },
    ],
    aiDesc: '高防高HP，周期加防',
  },

  /* ────── Tier 3：一流高手 ────── */
  demon_vanguard: {
    id: 'demon_vanguard', name: '魔教锋卫', icon: '🌙', tier: 3,
    hp: 380, maxHp: 380, atk: 55, def: 28, agi: 18,
    reward: { exp: 220, gold: 55 },
    loot: [{ id: 'exp_scroll', chance: 0.5 }, { id: 'mp_potion', chance: 0.4 }],
    actions: [
      { name: '乾坤一击',   icon: '🌙', powerMul: 1.8, defPen: 0.6, hit: 1, mpCost: 0, weight: 35, effect: null },
      { name: '日月神功',   icon: '⚡', powerMul: 1.0, defPen: 0.8, hit: 2, mpCost: 0, weight: 35, effect: null },
      { name: '魔功护体',   icon: '🌀', powerMul: 0,   defPen: 0,   hit: 0, mpCost: 0, weight: 20,
        effect: { type: 'def_boost', value: 18, duration: 2 } },
      { name: '摄魂术',     icon: '👁️', powerMul: 0.3, defPen: 1.0, hit: 1, mpCost: 0, weight: 10,
        effect: { type: 'weaken_def', value: 12, duration: 2 } },
    ],
    aiDesc: 'BOSS级·全能威胁',
  },
  demon_witch: {
    id: 'demon_witch', name: '魔教妖女', icon: '🔮', tier: 3,
    hp: 320, maxHp: 320, atk: 48, def: 20, agi: 24,
    reward: { exp: 200, gold: 50 },
    loot: [{ id: 'hp_potion', chance: 0.6 }, { id: 'exp_scroll', chance: 0.4 }],
    actions: [
      { name: '蛊毒幻术',  icon: '🔮', powerMul: 0.5, defPen: 1.0, hit: 1, mpCost: 0, weight: 30,
        effect: { type: 'strong_poison', value: 18, duration: 3 } },
      { name: '媚功',      icon: '💜', powerMul: 0,   defPen: 0,   hit: 0, mpCost: 0, weight: 25,
        effect: { type: 'weaken_def', value: 15, duration: 3 } },
      { name: '血爪',      icon: '🩸', powerMul: 1.4, defPen: 0.7, hit: 1, mpCost: 0, weight: 30, effect: null },
      { name: '魅影闪',    icon: '✨', powerMul: 0,   defPen: 0,   hit: 0, mpCost: 0, weight: 15,
        effect: { type: 'evade', value: 0.6, duration: 1 } },
    ],
    aiDesc: '毒+减防+高速',
  },
  ancient_master: {
    id: 'ancient_master', name: '江湖隐士', icon: '🧙', tier: 3,
    hp: 450, maxHp: 450, atk: 62, def: 32, agi: 12,
    reward: { exp: 280, gold: 70 },
    loot: [{ id: 'exp_scroll', chance: 0.8 }, { id: 'iron_guard', chance: 0.3 }],
    actions: [
      { name: '九阳神掌',  icon: '🌟', powerMul: 2.0, defPen: 0.5, hit: 1, mpCost: 0, weight: 30, effect: null },
      { name: '混元功',    icon: '🌀', powerMul: 0.8, defPen: 0.9, hit: 3, mpCost: 0, weight: 30, effect: null },
      { name: '调息',      icon: '💫', powerMul: 0,   defPen: 0,   hit: 0, mpCost: 0, weight: 20,
        effect: { type: 'self_heal', value: 0.15, duration: 1 } },
      { name: '封脉一指',  icon: '☝️', powerMul: 0.5, defPen: 0.8, hit: 1, mpCost: 0, weight: 20,
        effect: { type: 'stun', value: 1, duration: 2 } },
    ],
    aiDesc: '终极BOSS·平衡型',
  },

  /* ────── 武当山第一关：山门弟子（tier:10）────── */
  wudang_gate_disciple: {
    id: 'wudang_gate_disciple', name: '武当山门弟子', icon: '☯️', tier: 10,
    hp: 90, maxHp: 90, atk: 22, def: 10, agi: 8,
    reward: { exp: 60, gold: 15 },
    loot: [],
    actions: [
      { name: '武当长拳', icon: '👊', powerMul: 0.85, defPen: 0.7, hit: 1, mpCost: 0, weight: 60, effect: null },
      { name: '养气式',   icon: '🧘', powerMul: 0,   defPen: 0,   hit: 0, mpCost: 0, weight: 40,
        effect: { type: 'self_heal', value: 0.1, duration: 1 } },
    ],
    aiDesc: '武当入门弟子·稳健型',
  },

  /* ────── 武当山第二关：中庭弟子（tier:11）────── */
  wudang_mid_disciple: {
    id: 'wudang_mid_disciple', name: '武当中庭弟子', icon: '⚔️', tier: 11,
    hp: 160, maxHp: 160, atk: 30, def: 14, agi: 10,
    reward: { exp: 100, gold: 25 },
    loot: [{ id: 'mp_potion', chance: 0.3 }],
    actions: [
      { name: '太极剑',    icon: '☯️', powerMul: 1.0, defPen: 0.6, hit: 1, mpCost: 0, weight: 50, effect: null },
      { name: '绵掌',      icon: '🌊', powerMul: 0.6, defPen: 0.8, hit: 2, mpCost: 0, weight: 30, effect: null },
      { name: '静心调息',  icon: '💫', powerMul: 0,   defPen: 0,   hit: 0, mpCost: 0, weight: 20,
        effect: { type: 'self_heal', value: 0.12, duration: 1 } },
    ],
    aiDesc: '武当精锐·攻守兼备',
  },

  /* ────── 武当山第三关：传功长老（tier:12）────── */
  wudang_elder_battle: {
    id: 'wudang_elder_battle', name: '武当传功长老', icon: '🧓', tier: 12,
    hp: 350, maxHp: 350, atk: 45, def: 22, agi: 12,
    reward: { exp: 200, gold: 50 },
    loot: [{ id: 'skill_scroll', chance: 0.5 }, { id: 'taiji_manual', chance: 0.3 }],
    actions: [
      { name: '太极拳',    icon: '☯️', powerMul: 1.3, defPen: 0.4, hit: 1, mpCost: 0, weight: 40,
        effect: { type: 'stun', value: 1, duration: 1 } },
      { name: '太极剑',    icon: '⚔️', powerMul: 1.1, defPen: 0.5, hit: 1, mpCost: 0, weight: 35, effect: null },
      { name: '运劲吐纳',  icon: '💫', powerMul: 0,   defPen: 0,   hit: 0, mpCost: 0, weight: 25,
        effect: { type: 'self_heal', value: 0.15, duration: 1 } },
    ],
    aiDesc: '武当传功长老·太极拳',
  },

  /* ────── 第一章·教学战：木制机关人 ────── */
  training_dummy: {
    id: 'training_dummy', name: '木制机关人', icon: '🤖', tier: 0,
    hp: 60, maxHp: 60, atk: 8, def: 4, agi: 3,
    reward: { exp: 10, gold: 0 },
    loot: [],
    actions: [
      { name: '木拳', icon: '👊', powerMul: 0.8, defPen: 0.7, hit: 1, mpCost: 0, weight: 70, effect: null },
      { name: '卡顿', icon: '⚙️', powerMul: 0,   defPen: 0,   hit: 0, mpCost: 0, weight: 30, effect: { type: 'def_boost', value: 2, duration: 1 } },
    ],
    aiDesc: '教学机关·极弱',
  },

  /* ────── 第一章·暗道蜘蛛：凡人水平 ────── */
  shadow_scout: {
    id: 'shadow_scout', name: '暗道蛛', icon: '🕷️', tier: 0,
    hp: 55, maxHp: 55, atk: 10, def: 3, agi: 6,
    reward: { exp: 15, gold: 3 },
    loot: [],
    actions: [
      { name: '蛛丝缠绕', icon: '🕸️', powerMul: 0.9, defPen: 0.7, hit: 1, mpCost: 0, weight: 50, effect: null },
      { name: '毒牙刺',   icon: '🦷', powerMul: 1.1, defPen: 0.8, hit: 1, mpCost: 0, weight: 30, effect: { type: 'poison', value: 2, duration: 2 } },
      { name: '退缩',     icon: '💨', powerMul: 0,   defPen: 0,   hit: 0, mpCost: 0, weight: 20, effect: { type: 'evade', value: 0.3, duration: 1 } },
    ],
    aiDesc: '暗道蜘蛛·凡人水平·弱敌',
  },

  /* ────── 第一章·暗道出口：密探高手·注定战败 ────── */
  shadow_agent: {
    id: 'shadow_agent', name: '密探高手', icon: '🥷', tier: 2,
    hp: 180, maxHp: 180, atk: 35, def: 15, agi: 12,
    reward: { exp: 0, gold: 0 },  // 注定战败，不给奖励
    loot: [],
    actions: [
      { name: '锁喉刀', icon: '🗡️', powerMul: 1.4, defPen: 0.6, hit: 1, mpCost: 0, weight: 40, effect: null },
      { name: '连环斩', icon: '⚔️', powerMul: 0.7, defPen: 0.8, hit: 2, mpCost: 0, weight: 35, effect: null },
      { name: '密探杀招', icon: '💀', powerMul: 2.0, defPen: 0.4, hit: 1, mpCost: 0, weight: 25, effect: { type: 'stun', value: 1, duration: 1 } },
    ],
    aiDesc: '密探精锐·结丹水平·注定战败敌人',
    scriptedDefeat: true,  // 标记：注定战败，不触发Game Over
  },
};

// 按难度获取随机敌人
function getRandomEnemy(tier) {
  const pool = Object.values(ENEMIES).filter(e => e.tier === tier);
  const template = pool[Math.floor(Math.random() * pool.length)];
  // 深拷贝，避免状态污染
  return JSON.parse(JSON.stringify(template));
}

// 战斗遭遇配置（营地→出发时使用）
const ENCOUNTER_TIERS = [
  { label: '街头混战（练习）', tier: 1, count: 1, desc: '适合初出茅庐，积累武学经验。' },
  { label: '武林争斗（普通）', tier: 2, count: 1, desc: '有一定危险，需合理运用技能。' },
  { label: '江湖强敌（困难）', tier: 3, count: 1, desc: '顶尖高手，务必做好充分准备。' },
];

// ═══════════════════════════════════════════════════════════════
// 电影序幕引擎 — 第一章剧情脚本（待按新剧本重写）
// ═══════════════════════════════════════════════════════════════
// 详见 CHAPTER1_REDESIGN.md
// ═══════════════════════════════════════════════════════════════

const STORY_INTRO = {

  // ════════════════════════════════════════════
  //  序幕：封印之梦
  // ════════════════════════════════════════════
  start:   { type: 'narration', text: '（黑暗中，火焰的噼啪声由远及近……）', next: 'dream_1' },
  dream_1: { type: 'narration', text: '我又做梦了。梦里全是火。', next: 'dream_2' },
  dream_2: { type: 'narration', text: '宫殿在燃烧，城墙在崩塌。有人在尖叫。', next: 'flash_1' },
  flash_1: { type: 'flash', next: 'cg_fentian' },
  cg_fentian: { type: 'cg', bg: 'picture/scene/焚天.png', delay: 3500, next: 'dream_3' },
  dream_3: { type: 'narration', text: '（火焰中，仿佛有一道金色的龙影翻涌——）', next: 'dream_4' },
  dream_4: { type: 'narration', text: '（然后一切归于寂静。）', next: 'dream_5' },
  dream_5: { type: 'narration', text: '（……醒来时，窗外是安静的白雪。）', next: 'dream_6' },
  dream_6: { type: 'narration', text: '（这是我记事以来的第六个冬天。身边的墨姐姐说，我从前的记忆，已经被一场大病夺走了。）', next: 'chess_0' },

  // ════════════════════════════════════════════
  //  第一幕：棋声
  // ════════════════════════════════════════════
  chess_0:  { type: 'dialogue', speaker: '墨绐青', text: '醒醒。棋还没下完呢，你就睡着了。', portrait: 'picture/Female-main/女国师.png', bg: 'picture/scene/木屋.png', next: 'chess_1' },
  chess_1:  { type: 'dialogue', speaker: '我', text: '……墨姐姐，我又做那个梦了。', bg: 'picture/scene/木屋.png', next: 'chess_2' },
  chess_2:  { type: 'dialogue', speaker: '墨绐青', text: '（手指微顿，随即恢复如常）梦而已。来，看这一手——', portrait: 'picture/Female-main/女国师.png', bg: 'picture/scene/木屋.png', next: 'chess_3' },
  chess_3:  { type: 'dialogue', speaker: '墨绐青', text: '你这手"断"下得太急了。棋盘如战场，最忌心浮气躁。你把自己唯一的退路堵死了。', portrait: 'picture/Female-main/女国师.png', bg: 'picture/scene/木屋.png', next: 'chess_4' },
  chess_4:  { type: 'dialogue', speaker: '我', text: '可是……我心里总觉得有一团火，像藏着一柄剑，想破开这棋盘。', bg: 'picture/scene/木屋.png', next: 'chess_5' },
  chess_5:  { type: 'dialogue', speaker: '墨绐青', text: '……剑是杀器，亦是劫。我只盼你这辈子……只需懂得如何落子，无需懂得如何杀心。', portrait: 'picture/Female-main/女国师.png', bg: 'picture/scene/木屋.png', next: 'chess_skill' },
  chess_skill: { type: 'narration', text: '📖 获得被动技能【弈理心经】Lv.1\n效果：每回合自动恢复3点内力。非战斗对话中，有概率洞察对方真实意图。', next: 'chess_choice' },

  // 三选一
  chess_choice: {
    type: 'choice',
    choices: [
      { text: '「墨姐姐，你下棋这么厉害，以前是做什么的？」', next: 'choice_a' },
      { text: '「我总觉得……好像忘了什么很重要的事」', next: 'choice_b' },
      { text: '「棋下完了，我想出去走走」', next: 'choice_c' },
    ],
  },
  choice_a: { type: 'dialogue', speaker: '墨绐青', text: '我啊……以前也是个爱下棋的人。只不过下着下着，棋盘越来越大，棋局也越来越复杂。现在嘛，只想安安静静在这小村子里……等你再大些，或许就懂了。', portrait: 'picture/Female-main/女国师.png', bg: 'picture/scene/木屋.png', next: 'chess_train' },
  choice_b: { type: 'dialogue', speaker: '墨绐青', text: '……忘了？\n忘了便忘了吧。有些事，记得太清楚，反而是负担。\n你现在这样，就很好。', portrait: 'picture/Female-main/女国师.png', bg: 'picture/scene/木屋.png', next: 'chess_train' },
  choice_c: { type: 'narration', text: '（你起身看向窗外。雪还在下，和每年冬天一样安静。）', next: 'chess_train' },

  // 教学战斗
  chess_train:   { type: 'dialogue', speaker: '墨绐青', text: '虽说只教你下棋……但最基本的自保之力，总归要有的。', portrait: 'picture/Female-main/女国师.png', bg: 'picture/scene/木屋.png', next: 'chess_train2' },
  chess_train2:  { type: 'dialogue', speaker: '墨绐青', text: '（推来一具木制机关人）来，试试看。用你在棋局中学到的——看准时机，再落子。', portrait: 'picture/Female-main/女国师.png', bg: 'picture/scene/木屋.png', next: 'battle_training' },
  battle_training: { type: 'battle', enemyId: 'training_dummy', nextOnWin: 'chess_after' },
  chess_after:   { type: 'dialogue', speaker: '墨绐青', text: '……不错。你的直觉倒是不差。记住，棋盘上的每一步都有代价。真正的战场也是一样。', portrait: 'picture/Female-main/女国师.png', bg: 'picture/scene/木屋.png', next: 'thunder_0' },

  // ════════════════════════════════════════════
  //  第二幕：惊雷
  // ════════════════════════════════════════════
  thunder_0:  { type: 'narration', text: '（数刻后。窗外天色骤暗，乌云压顶。）', next: 'thunder_1' },
  thunder_1:  { type: 'narration', text: '（轰隆——！！两股不属于天雷的恐怖气息从天而降！）', next: 'thunder_2' },
  thunder_2:  { type: 'dialogue', speaker: '墨绐青', text: '（猛然起身，面色骤变）', portrait: 'picture/Female-main/女国师.png', bg: 'picture/scene/木屋.png', next: 'thunder_3' },
  thunder_3:  { type: 'dialogue', speaker: '墨绐青', text: '（语速飞快）听我说。这石屋下面有一条暗道，通往武当方向。你现在就走。', portrait: 'picture/Female-main/女国师.png', bg: 'picture/scene/木屋.png', next: 'thunder_4' },
  thunder_4:  { type: 'dialogue', speaker: '我', text: '姐姐？发生什么事了？！', bg: 'picture/scene/木屋.png', next: 'thunder_5' },
  thunder_5:  { type: 'dialogue', speaker: '墨绐青', text: '不要问。沿着暗道一直走，不要回头，不要停。', portrait: 'picture/Female-main/女国师.png', bg: 'picture/scene/木屋.png', next: 'thunder_6' },
  thunder_6:  { type: 'dialogue', speaker: '我', text: '可是——', bg: 'picture/scene/木屋.png', next: 'thunder_7' },
  thunder_7:  { type: 'dialogue', speaker: '墨绐青', text: '（打断）去武当山。找一个叫柳清寒的人。她会等你。', portrait: 'picture/Female-main/女国师.png', bg: 'picture/scene/木屋.png', next: 'thunder_8' },
  thunder_8:  { type: 'dialogue', speaker: '我', text: '柳清寒是谁？', bg: 'picture/scene/木屋.png', next: 'thunder_9' },
  thunder_9:  { type: 'dialogue', speaker: '墨绐青', text: '（指尖轻点主角额心，注入清凉气息）你以后会知道的——快走！', portrait: 'picture/Female-main/女国师.png', bg: 'picture/scene/木屋.png', next: 'thunder_10' },
  thunder_10: { type: 'narration', text: '（推开石床，暗门缓缓开启。）', next: 'thunder_11' },
  thunder_11: { type: 'narration', text: '（轰隆！！！石屋剧烈晃动，碎石纷纷落下！）', next: 'thunder_12' },
  thunder_12: { type: 'dialogue', speaker: '墨绐青', text: '（将主角推入暗道）去——！', portrait: 'picture/Female-main/女国师.png', bg: 'picture/scene/木屋.png', next: 'thunder_13' },
  thunder_13: { type: 'narration', text: '⚠️ 紧急事件！📍 暗道已开启——不要回头！', next: 'thunder_14' },
  thunder_14: { type: 'narration', text: '（石门在身后轰然落下。头顶传来法术碰撞的轰鸣，然后是爆炸声——）', next: 'thunder_15' },
  thunder_15: { type: 'narration', text: '（然后是漫长的寂静。）', next: 'thunder_16' },
  thunder_16: { type: 'narration', text: '（不能停。不能回头。她说了——一直走。）', next: 'tunnel_0' },

  // ════════════════════════════════════════════
  //  第三幕：暗道·逃亡
  // ════════════════════════════════════════════
  tunnel_0:  { type: 'narration', text: '暗道狭长潮湿，石壁刻满古老图腾。随着深入，图腾隐隐发出微光……', next: 'tunnel_1' },
  tunnel_1:  { type: 'narration', text: '主角不由自主伸手触碰——指尖传来微微的酥麻感。随即消退。', next: 'tunnel_2' },
  tunnel_2:  { type: 'narration', text: '（前方暗处传来窸窣声——是什么东西在石壁上爬行！）', next: 'tunnel_3' },
  tunnel_3:  { type: 'narration', text: '（一只硕大的暗道蛛挡在前路，泛着幽绿毒光的复眼直直盯着你！）', next: 'battle_scout' },
  battle_scout: { type: 'battle', enemyId: 'shadow_scout', nextOnWin: 'tunnel_4' },
  tunnel_4:  { type: 'narration', text: '（暗道尽头——刺眼的白光。主角踉跄冲出出口，漫天风雪扑面而来。）', next: 'tunnel_5' },
  tunnel_5:  { type: 'narration', text: '（还没站稳，一道黑影已从风雪中逼近！）', next: 'tunnel_6' },
  tunnel_6:  { type: 'dialogue', speaker: '密探高手', text: '果然从这里出来了。国师已是强弩之末——你，跟我们走。', next: 'tunnel_7' },
  tunnel_7:  { type: 'narration', text: '⚠️ 敌人远强于你！这是一场无法获胜的战斗——', next: 'battle_agent' },
  battle_agent: { type: 'battle', enemyId: 'shadow_agent', nextOnWin: 'defeat_0', nextOnLose: 'defeat_0' },
  defeat_0:  { type: 'narration', text: '（主角被击倒在地。长刀架在颈侧，寒气入骨。）', next: 'defeat_1' },
  defeat_1:  { type: 'narration', text: '（……要死在这里了吗？墨姐姐让我来找的那个人……在哪里？）', next: 'liu_appear' },

  // 柳清寒登场
  liu_appear: { type: 'narration', text: '（嗤——！一把细剑破风而来，钉入密探头目脚前三寸雪地！不见人，先见剑。）', next: 'liu_appear2' },
  liu_appear2: { type: 'narration', text: '（白雪映墨色道袍，女子从风雪中缓步走出。剑已拔起，寒光未散。）', next: 'liu_0' },
  liu_0: { type: 'dialogue', speaker: '密探高手', text: '武当的人？劝你不要多管闲事。', next: 'liu_1' },
  liu_1: { type: 'dialogue', speaker: '柳清寒', text: '住手。', next: 'liu_2' },
  liu_2: { type: 'dialogue', speaker: '密探高手', text: '你我都是结丹境，谁生谁死还不得而知。少管王朝的事——', next: 'liu_3' },
  liu_3: { type: 'narration', text: '（柳清寒没有再说话。剑光一闪——第一人倒下。密探们甚至没看清她何时出剑。）', next: 'liu_4' },
  liu_4: { type: 'narration', text: '（第二人拔刀格挡，剑锋已从肋下穿过。第三人转身欲逃，一道剑气穿透后心。）', next: 'liu_5' },
  liu_5: { type: 'narration', text: '（三息之间，三名密探尽数倒在雪中。雪地上没有一丝多余的剑痕。）', next: 'liu_6' },
  liu_6: { type: 'narration', text: '（柳清寒收剑入鞘，面无表情。仿佛方才不过是拂去肩头落雪。）', next: 'snow_0' },

  // ════════════════════════════════════════════
  //  第四幕：雪中惊鸿
  // ════════════════════════════════════════════
  snow_0:   { type: 'cg', bg: 'picture/scene/武当雪夜.png', delay: 3500, next: 'snow_1' },
  snow_1:   { type: 'narration', text: '（她走过来，蹲下身——动作利落，没有一丝多余。伸手拂去他肩头的雪花。手指在触到肩头的一瞬，微微颤了一下，但很快收回。）', next: 'snow_2' },
  snow_2:   { type: 'dialogue', speaker: '我', text: '……你是谁?', next: 'snow_3' },
  snow_3:   { type: 'dialogue', speaker: '柳清寒', text: '柳清寒。武当弟子。', portrait: 'picture/Female-main/柳清寒.png', next: 'snow_4' },
  snow_4:   { type: 'dialogue', speaker: '我', text: '你认识墨姐姐？她让我来找你。', next: 'snow_5' },
  snow_5:   { type: 'dialogue', speaker: '柳清寒', text: '……嗯。', portrait: 'picture/Female-main/柳清寒.png', next: 'snow_6' },
  snow_6:   { type: 'dialogue', speaker: '我', text: '她还好吗？上面的爆炸声——', next: 'snow_7' },
  snow_7:   { type: 'dialogue', speaker: '柳清寒', text: '（沉默片刻）……先上山。', portrait: 'picture/Female-main/柳清寒.png', next: 'snow_8' },
  snow_8:   { type: 'dialogue', speaker: '我', text: '……', next: 'snow_9' },
  snow_9:   { type: 'dialogue', speaker: '柳清寒', text: '能走吗？', portrait: 'picture/Female-main/柳清寒.png', next: 'snow_10' },
  snow_10:  { type: 'narration', text: '（她站起身，没有伸手去扶。转身向山上走去——却刻意放慢了脚步。）', next: 'snow_11' },
  snow_11:  { type: 'dialogue', speaker: '柳清寒', text: '雪夜山路难行。', portrait: 'picture/Female-main/柳清寒.png', next: 'snow_12' },
  snow_12:  { type: 'dialogue', speaker: '柳清寒', text: '……跟上。', portrait: 'picture/Female-main/柳清寒.png', next: 'ending_0' },

  // ════════════════════════════════════════════
  //  尾声：江湖入世
  // ════════════════════════════════════════════
  ending_0: { type: 'cg', bg: 'picture/scene/武当雪夜.png', delay: 4000, next: 'ending_1' },
  ending_1: { type: 'narration', text: '风雪漫漫，山道崎岖。她的背影在雪幕中若隐若现，不曾回头，却始终没有走远。', next: 'ending_2' },
  ending_2: { type: 'narration', text: '（从此，少年踏入武当，以江湖入世。）', next: 'ending_3' },
  ending_3: { type: 'narration', text: '（他不问来路，不问归途。他只知道——这一步迈出，便再无回头。）', next: 'ending_4' },
  ending_4: { type: 'narration', text: '（那盘未下完的残局，终将由他亲手落子。）', next: 'ending_5' },
  ending_5: { type: 'narration', text: '── 第一章·完 ──\n🏔️ 解锁：武当山营地\n👤 营地NPC：柳清寒', next: 'END' },
};

// 武当山主线关卡（完成张三丰任务后解锁）
const WUDANG_TIERS = [
  { label: '武当山 · 山门', tier: 10, desc: '武当山门弟子镇守，试探你的根基。' },
  { label: '武当山 · 前山', tier: 11, desc: '武当前山险道，精锐弟子严阵以待。' },
  { label: '武当山 · 大殿', tier: 12, desc: '武当真武大殿，传功长老亲自出手！' },
];
