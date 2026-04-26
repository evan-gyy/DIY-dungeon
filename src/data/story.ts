import type { StoryNode } from './types';

export const STORY_INTRO: Record<string, StoryNode> = {

  // ── 序幕：封印之梦 ──
  start:      { type: 'narration', text: '（黑暗中，火焰的噼啪声由远及近……）', next: 'dream_1' },
  dream_1:    { type: 'narration', text: '我又做梦了。梦里全是火。', next: 'dream_2' },
  dream_2:    { type: 'narration', text: '宫殿在燃烧，城墙在崩塌。有人在尖叫。', next: 'flash_1' },
  flash_1:    { type: 'flash', next: 'cg_fentian' },
  cg_fentian: { type: 'cg', bg: 'picture/scene/C1-fencheng.png', delay: 3500, next: 'dream_3' },
  dream_3:    { type: 'narration', text: '（火焰中，仿佛有一道金色的龙影翻涌——）', next: 'dream_4' },
  dream_4:    { type: 'narration', text: '（然后一切归于寂静。）', next: 'dream_5' },
  dream_5:    { type: 'narration', text: '（……醒来时，窗外是安静的白雪。）', next: 'dream_6' },
  dream_6:    { type: 'narration', text: '（这是我记事以来的第六个冬天。身边的墨姐姐说，我从前的记忆，已经被一场大病夺走了。）', next: 'chess_0' },

  // ── 第一幕：棋声 ──
  chess_0:  { type: 'dialogue', speaker: '墨绐青', text: '醒醒。棋还没下完呢，你就睡着了。', portrait: 'picture/Female-main/墨绐青.png', bg: 'picture/scene/C1-muwu.png', next: 'chess_1' },
  chess_1:  { type: 'dialogue', speaker: '我', text: '……墨姐姐，我又做那个梦了。', bg: 'picture/scene/C1-muwu.png', next: 'chess_2' },
  chess_2:  { type: 'dialogue', speaker: '墨绐青', text: '（手指微顿，随即恢复如常）梦而已。来，看这一手——', portrait: 'picture/Female-main/墨绐青.png', bg: 'picture/scene/C1-muwu.png', next: 'chess_3' },
  chess_3:  { type: 'dialogue', speaker: '墨绐青', text: '你这手"断"下得太急了。棋盘如战场，最忌心浮气躁。你把自己唯一的退路堵死了。', portrait: 'picture/Female-main/墨绐青.png', bg: 'picture/scene/C1-muwu.png', next: 'chess_4' },
  chess_4:  { type: 'dialogue', speaker: '我', text: '可是……我心里总觉得有一团火，像藏着一柄剑，想破开这棋盘。', bg: 'picture/scene/C1-muwu.png', next: 'chess_5' },
  chess_5:  { type: 'dialogue', speaker: '墨绐青', text: '……剑是杀器，亦是劫。我只盼你这辈子……只需懂得如何落子，无需懂得如何杀心。', portrait: 'picture/Female-main/墨绐青.png', bg: 'picture/scene/C1-muwu.png', next: 'chess_skill' },
  chess_skill: { type: 'narration', text: '📖 获得被动技能【弈理心经】Lv.1\n效果：每回合自动恢复3点内力。非战斗对话中，有概率洞察对方真实意图。', next: 'chess_choice' },

  chess_choice: {
    type: 'choice',
    choices: [
      { text: '「墨姐姐，你下棋这么厉害，以前是做什么的？」', next: 'choice_a' },
      { text: '「我总觉得……好像忘了什么很重要的事」', next: 'choice_b' },
      { text: '「棋下完了，我想出去走走」', next: 'choice_c' },
    ],
  },
  choice_a: { type: 'dialogue', speaker: '墨绐青', text: '我啊……以前也是个爱下棋的人。只不过下着下着，棋盘越来越大，棋局也越来越复杂。现在嘛，只想安安静静在这小村子里……等你再大些，或许就懂了。', portrait: 'picture/Female-main/墨绐青.png', bg: 'picture/scene/C1-muwu.png', next: 'chess_train' },
  choice_b: { type: 'dialogue', speaker: '墨绐青', text: '……忘了？\n忘了便忘了吧。有些事，记得太清楚，反而是负担。\n你现在这样，就很好。', portrait: 'picture/Female-main/墨绐青.png', bg: 'picture/scene/C1-muwu.png', next: 'chess_train' },
  choice_c: { type: 'narration', text: '（你起身看向窗外。雪还在下，和每年冬天一样安静。）', next: 'chess_train' },

  chess_train:  { type: 'dialogue', speaker: '墨绐青', text: '虽说只教你下棋……但最基本的自保之力，总归要有的。', portrait: 'picture/Female-main/墨绐青.png', bg: 'picture/scene/C1-muwu.png', next: 'chess_train2' },
  chess_train2: { type: 'dialogue', speaker: '墨绐青', text: '（推来一具木制机关人）来，试试看。用你在棋局中学到的——看准时机，再落子。', portrait: 'picture/Female-main/墨绐青.png', bg: 'picture/scene/C1-muwu.png', next: 'battle_training' },
  battle_training: { type: 'battle', enemyId: 'training_dummy', nextOnWin: 'chess_after' },
  chess_after:  { type: 'dialogue', speaker: '墨绐青', text: '……不错。你的直觉倒是不差。记住，棋盘上的每一步都有代价。真正的战场也是一样。', portrait: 'picture/Female-main/墨绐青.png', bg: 'picture/scene/C1-muwu.png', next: 'thunder_0' },

  // ── 第二幕：惊雷 ──
  thunder_0:  { type: 'narration', text: '（数刻后。窗外天色骤暗，乌云压顶。）', next: 'thunder_1' },
  thunder_1:  { type: 'narration', text: '（轰隆——！！两股不属于天雷的恐怖气息从天而降！）', next: 'thunder_2' },
  thunder_2:  { type: 'dialogue', speaker: '墨绐青', text: '（猛然起身，面色骤变）', portrait: 'picture/Female-main/墨绐青.png', bg: 'picture/scene/C1-muwu.png', next: 'thunder_3' },
  thunder_3:  { type: 'dialogue', speaker: '墨绐青', text: '（语速飞快）听我说。这石屋下面有一条暗道，通往武当方向。你现在就走。', portrait: 'picture/Female-main/墨绐青.png', bg: 'picture/scene/C1-muwu.png', next: 'thunder_4' },
  thunder_4:  { type: 'dialogue', speaker: '我', text: '姐姐？发生什么事了？！', bg: 'picture/scene/C1-muwu.png', next: 'thunder_5' },
  thunder_5:  { type: 'dialogue', speaker: '墨绐青', text: '不要问。沿着暗道一直走，不要回头，不要停。', portrait: 'picture/Female-main/墨绐青.png', bg: 'picture/scene/C1-muwu.png', next: 'thunder_6' },
  thunder_6:  { type: 'dialogue', speaker: '我', text: '可是——', bg: 'picture/scene/C1-muwu.png', next: 'thunder_7' },
  thunder_7:  { type: 'dialogue', speaker: '墨绐青', text: '（打断）去武当山。找一个叫柳清寒的人。她会等你。', portrait: 'picture/Female-main/墨绐青.png', bg: 'picture/scene/C1-muwu.png', next: 'thunder_8' },
  thunder_8:  { type: 'dialogue', speaker: '我', text: '柳清寒是谁？', bg: 'picture/scene/C1-muwu.png', next: 'thunder_9' },
  thunder_9:  { type: 'dialogue', speaker: '墨绐青', text: '（指尖轻点主角额心，注入清凉气息）你以后会知道的——快走！', portrait: 'picture/Female-main/墨绐青.png', bg: 'picture/scene/C1-muwu.png', next: 'thunder_10' },
  thunder_10: { type: 'narration', text: '（推开石床，暗门缓缓开启。）', next: 'thunder_11' },
  thunder_11: { type: 'narration', text: '（轰隆！！！石屋剧烈晃动，碎石纷纷落下！）', next: 'thunder_12' },
  thunder_12: { type: 'dialogue', speaker: '墨绐青', text: '（将主角推入暗道）去——！', portrait: 'picture/Female-main/墨绐青.png', bg: 'picture/scene/C1-muwu.png', next: 'thunder_13' },
  thunder_13: { type: 'narration', text: '⚠️ 紧急事件！📍 暗道已开启——不要回头！', next: 'thunder_14' },
  thunder_14: { type: 'narration', text: '（石门在身后轰然落下。头顶传来法术碰撞的轰鸣，然后是爆炸声——）', next: 'thunder_15' },
  thunder_15: { type: 'narration', text: '（然后是漫长的寂静。）', next: 'thunder_16' },
  thunder_16: { type: 'narration', text: '（不能停。不能回头。她说了——一直走。）', next: 'tunnel_0' },

  // ── 第三幕：暗道 ──
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

  // ── 柳清寒登场 ──
  liu_appear:  { type: 'narration', text: '（嗤——！一把细剑破风而来，钉入密探头目脚前三寸雪地！不见人，先见剑。）', next: 'liu_appear2' },
  liu_appear2: { type: 'narration', text: '（白雪映墨色道袍，女子从风雪中缓步走出。剑已拔起，寒光未散。）', next: 'liu_0' },
  liu_0: { type: 'dialogue', speaker: '密探高手', text: '武当的人？劝你不要多管闲事。', next: 'liu_1' },
  liu_1: { type: 'dialogue', speaker: '柳清寒', text: '住手。', next: 'liu_2' },
  liu_2: { type: 'dialogue', speaker: '密探高手', text: '你我都是结丹境，谁生谁死还不得而知。少管王朝的事——', next: 'liu_3' },
  liu_3: { type: 'narration', text: '（柳清寒没有再说话。剑光一闪——第一人倒下。密探们甚至没看清她何时出剑。）', next: 'liu_4' },
  liu_4: { type: 'narration', text: '（第二人拔刀格挡，剑锋已从肋下穿过。第三人转身欲逃，一道剑气穿透后心。）', next: 'liu_5' },
  liu_5: { type: 'narration', text: '（三息之间，三名密探尽数倒在雪中。雪地上没有一丝多余的剑痕。）', next: 'liu_6' },
  liu_6: { type: 'narration', text: '（柳清寒收剑入鞘，面无表情。仿佛方才不过是拂去肩头落雪。）', next: 'snow_0' },

  // ── 第四幕：雪中惊鸿 ──
  snow_0:  { type: 'cg', bg: 'picture/scene/C1-xueye.png', delay: 3500, next: 'snow_1' },
  snow_1:  { type: 'narration', text: '（她走过来，蹲下身——动作利落，没有一丝多余。伸手拂去他肩头的雪花。手指在触到肩头的一瞬，微微颤了一下，但很快收回。）', next: 'snow_2' },
  snow_2:  { type: 'dialogue', speaker: '我', text: '……你是谁?', next: 'snow_3' },
  snow_3:  { type: 'dialogue', speaker: '柳清寒', text: '柳清寒。武当弟子。', portrait: 'picture/Female-main/柳清寒.png', next: 'snow_4' },
  snow_4:  { type: 'dialogue', speaker: '我', text: '你认识墨姐姐？她让我来找你。', next: 'snow_5' },
  snow_5:  { type: 'dialogue', speaker: '柳清寒', text: '……嗯。', portrait: 'picture/Female-main/柳清寒.png', next: 'snow_6' },
  snow_6:  { type: 'dialogue', speaker: '我', text: '她还好吗？上面的爆炸声——', next: 'snow_7' },
  snow_7:  { type: 'dialogue', speaker: '柳清寒', text: '（沉默片刻）……先上山。', portrait: 'picture/Female-main/柳清寒.png', next: 'snow_8' },
  snow_8:  { type: 'dialogue', speaker: '我', text: '……', next: 'snow_9' },
  snow_9:  { type: 'dialogue', speaker: '柳清寒', text: '能走吗？', portrait: 'picture/Female-main/柳清寒.png', next: 'snow_10' },
  snow_10: { type: 'narration', text: '（她站起身，没有伸手去扶。转身向山上走去——却刻意放慢了脚步。）', next: 'snow_11' },
  snow_11: { type: 'dialogue', speaker: '柳清寒', text: '雪夜山路难行。', portrait: 'picture/Female-main/柳清寒.png', next: 'snow_12' },
  snow_12: { type: 'dialogue', speaker: '柳清寒', text: '……跟上。', portrait: 'picture/Female-main/柳清寒.png', next: 'ending_0' },

  // ── 尾声 ──
  ending_0: { type: 'cg', bg: 'picture/scene/C1-xueye.png', delay: 4000, next: 'ending_1' },
  ending_1: { type: 'narration', text: '风雪漫漫，山道崎岖。她的背影在雪幕中若隐若现，不曾回头，却始终没有走远。', next: 'ending_2' },
  ending_2: { type: 'narration', text: '（从此，少年踏入武当，以江湖入世。）', next: 'ending_3' },
  ending_3: { type: 'narration', text: '（他不问来路，不问归途。他只知道——这一步迈出，便再无回头。）', next: 'ending_4' },
  ending_4: { type: 'narration', text: '（那盘未下完的残局，终将由他亲手落子。）', next: 'ending_5' },
  ending_5: { type: 'narration', text: '── 第一章·完 ──\n🏔️ 解锁：武当山营地\n👤 营地NPC：柳清寒', next: 'END' },
};
