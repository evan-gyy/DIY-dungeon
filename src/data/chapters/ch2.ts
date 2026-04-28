import type { StoryNode } from '../types';
import type { ChapterData } from './types';

// ── 节点一：入门 ──────────────────────────────────────────────
const INTRO_NODES: Record<string, StoryNode> = {
  ch2_intro_0: { type: 'narration', text: '（武当山在眼前耸立。山道蜿蜒，云雾在脚下流动。柳清寒一言不发地走在前面，步伐稳定，如她的剑。）', next: 'ch2_intro_1' },
  ch2_intro_1: { type: 'narration', text: '（踏入山门的那一刻，你忽然想起墨绐青说过的一句话——"去武当山。找一个叫柳清寒的人。她会等你。"）', next: 'ch2_intro_cg' },
  ch2_intro_cg: { type: 'cg', bg: 'picture/scene/C2-wudang-hall.png', delay: 3000, next: 'ch2_intro_2' },
  ch2_intro_2: { type: 'dialogue', speaker: '柳清寒', text: '掌门。人带到了。', portrait: 'picture/Female-main/柳清寒.png', bg: 'picture/scene/C2-wudang-hall.png', next: 'ch2_intro_3' },
  ch2_intro_3: { type: 'dialogue', speaker: '张玄素', text: '……墨绐青让你来的？', portrait: 'picture/NPC/张玄素.png', bg: 'picture/scene/C2-wudang-hall.png', next: 'ch2_intro_4' },
  ch2_intro_4: { type: 'dialogue', speaker: '我', text: '前辈认识墨姐姐？', bg: 'picture/scene/C2-wudang-hall.png', next: 'ch2_intro_5' },
  ch2_intro_5: { type: 'dialogue', speaker: '张玄素', text: '（沉默片刻，轻轻点头）她可好？', portrait: 'picture/NPC/张玄素.png', bg: 'picture/scene/C2-wudang-hall.png', next: 'ch2_intro_6' },
  ch2_intro_6: { type: 'dialogue', speaker: '我', text: '……我不知道。', bg: 'picture/scene/C2-wudang-hall.png', next: 'ch2_intro_7' },
  ch2_intro_7: { type: 'dialogue', speaker: '张玄素', text: '（沉默良久。大殿里只有香炉中檀香燃烧的细微声响）武当收徒，不问来处，只看去处。你既来了，便是武当的人。', portrait: 'picture/NPC/张玄素.png', bg: 'picture/scene/C2-wudang-hall.png', next: 'ch2_intro_8' },
  ch2_intro_8: { type: 'dialogue', speaker: '张玄素', text: '从今日起，你是武当外门弟子。日常杂务由周伯安安排，武学根基由陈静虚传授。至于能走到哪一步——', portrait: 'picture/NPC/张玄素.png', bg: 'picture/scene/C2-wudang-hall.png', next: 'ch2_intro_9' },
  ch2_intro_9: { type: 'dialogue', speaker: '张玄素', text: '……看你自己的造化。', portrait: 'picture/NPC/张玄素.png', bg: 'picture/scene/C2-wudang-hall.png', next: 'ch2_intro_10' },
  ch2_intro_10: { type: 'dialogue', speaker: '柳清寒', text: '（袖中手指微微收紧，始终没有看主角）……', portrait: 'picture/Female-main/柳清寒.png', bg: 'picture/scene/C2-wudang-hall.png', next: 'ch2_intro_11' },
  ch2_intro_11: { type: 'narration', text: '（走出大殿，外门弟子院在山道一侧。一排简陋的石屋，墙角有蛛网，窗格透进山风。）', next: 'ch2_intro_12' },
  ch2_intro_12: { type: 'dialogue', speaker: '宋知远', text: '嘿！你就是大师姐带上山的那位？我叫宋知远，住你隔壁！以后咱们就是邻居了！', portrait: 'picture/NPC/宋知远.png', bg: 'picture/scene/C2-outer-court.png', next: 'ch2_intro_13' },
  ch2_intro_13: { type: 'dialogue', speaker: '宋知远', text: '对了，明天卯时起床，先去周管事那儿领差事。别迟到——迟到的人会被派去挑最远山泉的水，来回一趟，腿能废三天。', portrait: 'picture/NPC/宋知远.png', bg: 'picture/scene/C2-outer-court.png', next: 'ch2_intro_14' },
  ch2_intro_14: { type: 'dialogue', speaker: '宋知远', text: '对了，隔壁的——你见过大师姐出手吗？听说她在雪地里三息杀了三个结丹高手？真的假的？', portrait: 'picture/NPC/宋知远.png', bg: 'picture/scene/C2-outer-court.png', next: 'ch2_intro_15' },
  ch2_intro_15: { type: 'dialogue', speaker: '我', text: '……真的。', bg: 'picture/scene/C2-outer-court.png', next: 'ch2_intro_16' },
  ch2_intro_16: { type: 'dialogue', speaker: '宋知远', text: '（眼睛瞪得溜圆，然后压低声音）我的天。那你可得小心点——内门的陆沉舟师兄，对大师姐……嗯，你懂的。他知道你是大师姐亲自带上山的，估计已经在惦记你了。', portrait: 'picture/NPC/宋知远.png', bg: 'picture/scene/C2-outer-court.png', next: 'ch2_intro_17' },
  ch2_intro_17: { type: 'narration', text: '（武当山……比棋舍热闹多了。）', next: 'ch2_intro_end' },
  ch2_intro_end: { type: 'narration', text: '【正式成为武当外门弟子。周伯安处可领取日常差事，积累经验和铜钱。请努力修炼，炼气一层后可向陈静虚长老聆听问道。】', next: 'END' },
};

// ── 节点二：问道（炼气一层 = lv2）────────────────────────────
const WENDAO_NODES: Record<string, StoryNode> = {
  ch2_wendao_0: { type: 'cg', bg: 'picture/scene/C2-cliff.png', delay: 2500, next: 'ch2_wendao_1' },
  ch2_wendao_1: { type: 'narration', text: '（传功崖。一方平整的青石台，三面悬崖，云雾在脚下翻涌。陈静虚负手而立，一根枯枝插在腰间。）', next: 'ch2_wendao_2' },
  ch2_wendao_2: { type: 'dialogue', speaker: '陈静虚', text: '来了？周伯安说你根骨平平。我看了三天——你挑水时脚步比旁人稳，砍柴时落斧的角度每次都在调整。根骨是差了些。但脑子不笨。', portrait: 'picture/NPC/陈静虚.png', bg: 'picture/scene/C2-cliff.png', next: 'ch2_wendao_3' },
  ch2_wendao_3: { type: 'dialogue', speaker: '陈静虚', text: '武当武学，根基在"松沉"二字。外门弟子入门，先学两样——', portrait: 'picture/NPC/陈静虚.png', bg: 'picture/scene/C2-cliff.png', next: 'ch2_wendao_4' },
  ch2_wendao_4: { type: 'dialogue', speaker: '陈静虚', text: '【武当长拳】。不是让你打人，是让你学会怎么站。拳到七分，力留三分。打出去的不是拳头，是你脚下的根。', portrait: 'picture/NPC/陈静虚.png', bg: 'picture/scene/C2-cliff.png', next: 'ch2_wendao_5' },
  ch2_wendao_5: { type: 'dialogue', speaker: '陈静虚', text: '【养气诀】。不是让你练内功，是让你学会怎么呼吸。吸气如抽丝，呼气如推山。', portrait: 'picture/NPC/陈静虚.png', bg: 'picture/scene/C2-cliff.png', next: 'ch2_wendao_6' },
  ch2_wendao_6: { type: 'dialogue', speaker: '陈静虚', text: '我只教一遍。看好了。', portrait: 'picture/NPC/陈静虚.png', bg: 'picture/scene/C2-cliff.png', next: 'ch2_wendao_7' },
  ch2_wendao_7: { type: 'narration', text: '（他缓缓出拳，动作极慢，但每一寸移动都带着一种沉凝感。山风掠过他的袖口，纹丝不动。）', next: 'ch2_wendao_8' },
  ch2_wendao_8: { type: 'dialogue', speaker: '陈静虚', text: '（收势）练吧。什么时候一拳打出能让这片叶子不飘走，就算入门了。', portrait: 'picture/NPC/陈静虚.png', bg: 'picture/scene/C2-cliff.png', next: 'ch2_wendao_9' },
  ch2_wendao_9: { type: 'dialogue', speaker: '顾小桑', text: '哟，新来的，陈长老亲自教你？你面子不小。我当年入门的时候，陈长老只丢给我一本破册子，说了句"自己看"就走了。', portrait: 'picture/NPC/顾小桑.png', bg: 'picture/scene/C2-cliff.png', next: 'ch2_wendao_10' },
  ch2_wendao_10: { type: 'dialogue', speaker: '顾小桑', text: '（压低声音）对了，你知道为什么陈长老亲自教你吗？因为你是大师姐带上山的人。武当上下都在看——看大师姐的眼光到底怎么样。所以——加油吧，新来的。', portrait: 'picture/NPC/顾小桑.png', bg: 'picture/scene/C2-cliff.png', next: 'ch2_wendao_11' },
  ch2_wendao_11: { type: 'narration', text: '（都在看……吗。那便让他们看吧。）', next: 'ch2_wendao_end' },
  ch2_wendao_end: { type: 'narration', text: '【获得技能：武当长拳、养气诀。继续修炼，炼气二层后可在后山与柳清寒相遇。】', next: 'END' },
};

// ── 节点三：夜授（炼气二层 = lv3）────────────────────────────
const YESHOU_NODES: Record<string, StoryNode> = {
  ch2_yeshou_0: { type: 'narration', text: '（夜已深。你在床上翻来覆去睡不着，索性起身去了后山。）', next: 'ch2_yeshou_1' },
  ch2_yeshou_1: { type: 'narration', text: '（后山的老松树下，积雪映着月光，白得晃眼。你正打算练一遍今天学的拳法——却看见树下已经站了一个人。）', next: 'ch2_yeshou_cg' },
  ch2_yeshou_cg: { type: 'cg', bg: 'picture/scene/C2-night-pine.png', delay: 2500, next: 'ch2_yeshou_2' },
  ch2_yeshou_2: { type: 'dialogue', speaker: '柳清寒', text: '……这么晚不睡。明天卯时的差事不做了？', portrait: 'picture/Female-main/柳清寒.png', bg: 'picture/scene/C2-night-pine.png', next: 'ch2_yeshou_3' },
  ch2_yeshou_3: { type: 'dialogue', speaker: '我', text: '师姐？你怎么在这里？', bg: 'picture/scene/C2-night-pine.png', next: 'ch2_yeshou_4' },
  ch2_yeshou_4: { type: 'dialogue', speaker: '柳清寒', text: '……路过。', portrait: 'picture/Female-main/柳清寒.png', bg: 'picture/scene/C2-night-pine.png', next: 'ch2_yeshou_5' },
  ch2_yeshou_5: { type: 'narration', text: '（她肩头积着薄霜——显然不是"路过"。）', next: 'ch2_yeshou_6' },
  ch2_yeshou_6: { type: 'dialogue', speaker: '柳清寒', text: '陈长老教你的长拳，练得如何了？', portrait: 'picture/Female-main/柳清寒.png', bg: 'picture/scene/C2-night-pine.png', next: 'ch2_yeshou_7' },
  ch2_yeshou_7: { type: 'dialogue', speaker: '我', text: '还在练。陈长老说，一拳打出能让枯叶不飘走，才算入门。', bg: 'picture/scene/C2-night-pine.png', next: 'ch2_yeshou_8' },
  ch2_yeshou_8: { type: 'dialogue', speaker: '柳清寒', text: '长拳是根基。但光有根基不够。外门弟子要等到炼气五层才能学剑。……太慢了。', portrait: 'picture/Female-main/柳清寒.png', bg: 'picture/scene/C2-night-pine.png', next: 'ch2_yeshou_9' },
  ch2_yeshou_9: { type: 'dialogue', speaker: '柳清寒', text: '我只教一遍。看好了。', portrait: 'picture/Female-main/柳清寒.png', bg: 'picture/scene/C2-night-pine.png', next: 'ch2_yeshou_10' },
  ch2_yeshou_10: { type: 'narration', text: '（月光下，那道剑光不快——甚至可以说很慢。但每一剑的轨迹都干净得像用尺子量过。刺、挑、抹、带——四个基本剑式，在她手中有一种说不出的韵律。）', next: 'ch2_yeshou_11' },
  ch2_yeshou_11: { type: 'dialogue', speaker: '柳清寒', text: '武当剑法，不在快，在准。一剑出去，要知道它落在哪里。不知道——就不要出剑。', portrait: 'picture/Female-main/柳清寒.png', bg: 'picture/scene/C2-night-pine.png', next: 'ch2_yeshou_12' },
  ch2_yeshou_12: { type: 'dialogue', speaker: '我', text: '师姐。你为什么……对我这么好？', bg: 'picture/scene/C2-night-pine.png', next: 'ch2_yeshou_13' },
  ch2_yeshou_13: { type: 'dialogue', speaker: '柳清寒', text: '……师尊交代的。', portrait: 'picture/Female-main/柳清寒.png', bg: 'picture/scene/C2-night-pine.png', next: 'ch2_yeshou_14' },
  ch2_yeshou_14: { type: 'narration', text: '（她走了。但主角注意到——她走的方向绕了一圈，从外门弟子院的方向折返回去。像是确认他安全回到了屋子，才放心离开。）', next: 'ch2_yeshou_15' },
  ch2_yeshou_15: { type: 'narration', text: '（师尊交代的……吗。师尊到底交代了多少事。）', next: 'ch2_yeshou_end' },
  ch2_yeshou_end: { type: 'narration', text: '【获得技能：武当剑法·基础（提前解锁，正常需炼气五层）。柳清寒好感度+10。继续修炼，炼气六层后可参加外门小比。】', next: 'END' },
};

// ── 节点四：试剑（炼气六层 = lv7）────────────────────────────
const SHIJIAN_NODES: Record<string, StoryNode> = {
  ch2_shijian_0: { type: 'narration', text: '（外门弟子院内，周伯安宣布半年一度的外门小比今日开始。演武场青石铺地，外门弟子围成一圈，内门弟子在另一侧观礼。）', next: 'ch2_shijian_1' },
  ch2_shijian_1: { type: 'dialogue', speaker: '周伯安', text: '各位外门弟子——规矩照旧：抽签配对，点到为止。胜者记功，败者——败者也没什么，回去多挑几桶水就是了。', portrait: 'picture/NPC/周伯安.png', bg: 'picture/scene/C2-arena.png', next: 'ch2_shijian_2' },
  ch2_shijian_2: { type: 'dialogue', speaker: '宋知远', text: '（凑过来）隔壁的，注意看那边——陆沉舟在看你。', portrait: 'picture/NPC/宋知远.png', bg: 'picture/scene/C2-arena.png', next: 'ch2_shijian_3' },
  ch2_shijian_3: { type: 'narration', text: '（内门弟子队列中，一个腰佩长剑的冷峻青年正盯着他。目光平静，但那种平静本身就像一种审视。）', next: 'ch2_shijian_4' },
  ch2_shijian_4: { type: 'dialogue', speaker: '周伯安', text: '第一场——宋知远，对顾小桑！', portrait: 'picture/NPC/周伯安.png', bg: 'picture/scene/C2-arena.png', next: 'ch2_shijian_5' },
  ch2_shijian_5: { type: 'narration', text: '（宋知远被顾小桑三招放倒，全场大笑。）', next: 'ch2_shijian_6' },
  ch2_shijian_6: { type: 'dialogue', speaker: '周伯安', text: '第三场——[主角名]，对赵大石！', portrait: 'picture/NPC/周伯安.png', bg: 'picture/scene/C2-arena.png', next: 'ch2_shijian_7' },
  ch2_shijian_7: { type: 'dialogue', speaker: '宋知远', text: '（捂着腰）隔壁的！揍他！赵大石就是力气大，下盘不稳——我刚才帮你观察了！', portrait: 'picture/NPC/宋知远.png', bg: 'picture/scene/C2-arena.png', next: 'ch2_shijian_battle' },
  ch2_shijian_battle: { type: 'battle', enemyId: 'zhao_dashi', nextOnWin: 'ch2_shijian_win', nextOnLose: 'ch2_shijian_lose' },

  ch2_shijian_win: { type: 'dialogue', speaker: '周伯安', text: '（眉毛微挑，笑容里多了一丝意外）哦？入门时日不长，能胜赵大石——不错，不错。', portrait: 'picture/NPC/周伯安.png', bg: 'picture/scene/C2-arena.png', next: 'ch2_shijian_lu_0' },
  ch2_shijian_lose: { type: 'dialogue', speaker: '周伯安', text: '输给赵大石不丢人。他那身力气，外门里能正面扛住的不超过三个。下次努力。', portrait: 'picture/NPC/周伯安.png', bg: 'picture/scene/C2-arena.png', next: 'ch2_shijian_lu_0' },

  ch2_shijian_lu_0: { type: 'dialogue', speaker: '陆沉舟', text: '等一下。', portrait: 'picture/NPC/陆沉舟.png', bg: 'picture/scene/C2-arena.png', next: 'ch2_shijian_lu_1' },
  ch2_shijian_lu_1: { type: 'dialogue', speaker: '陆沉舟', text: '你就是大师姐带上山的那个人？大师姐的眼光……我向来信服。但武当不是靠关系就能立足的地方。', portrait: 'picture/NPC/陆沉舟.png', bg: 'picture/scene/C2-arena.png', next: 'ch2_shijian_lu_2' },
  ch2_shijian_lu_2: { type: 'dialogue', speaker: '陆沉舟', text: '外门试炼考——如果你能通过，我会亲自在演武场等你。到时候——让我看看，大师姐到底看中了你什么。', portrait: 'picture/NPC/陆沉舟.png', bg: 'picture/scene/C2-arena.png', next: 'ch2_shijian_lu_3' },
  ch2_shijian_lu_3: { type: 'dialogue', speaker: '顾小桑', text: '（等陆沉舟走远才出声）陆师兄这个人，傲归傲，但从不欺负弱者。他既然说要亲自试你——说明他已经把你当回事了。', portrait: 'picture/NPC/顾小桑.png', bg: 'picture/scene/C2-arena.png', next: 'ch2_shijian_end' },
  ch2_shijian_end: { type: 'narration', text: '【外门小比完成。继续修炼，炼气八层后可参加外门试炼考——下山除匪。】', next: 'END' },
};

// ── 节点五~七：下山·抉择·惊鸿（炼气八层 = lv9）─────────────
const XIASHA_NODES: Record<string, StoryNode> = {
  // 节点五：下山
  ch2_xiasha_0: { type: 'dialogue', speaker: '周伯安', text: '外门试炼考的规矩你们应该听说过。武当山下清河镇，近日屡遭土匪劫掠。掌门有令——本次试炼考，便是下山除匪。', portrait: 'picture/NPC/周伯安.png', bg: 'picture/scene/C2-arena.png', next: 'ch2_xiasha_1' },
  ch2_xiasha_1: { type: 'dialogue', speaker: '周伯安', text: '炼气八层及以上弟子，两人一组。完成者——晋升筑基，入内门。', portrait: 'picture/NPC/周伯安.png', bg: 'picture/scene/C2-arena.png', next: 'ch2_xiasha_2' },
  ch2_xiasha_2: { type: 'dialogue', speaker: '周伯安', text: '分组如下——顾小桑，[主角名]。你们一组。', portrait: 'picture/NPC/周伯安.png', bg: 'picture/scene/C2-arena.png', next: 'ch2_xiasha_3' },
  ch2_xiasha_3: { type: 'dialogue', speaker: '顾小桑', text: '（眼睛一亮，朝主角挤了挤眼）嘿，搭档。看来咱俩有缘。', portrait: 'picture/NPC/顾小桑.png', bg: 'picture/scene/C2-arena.png', next: 'ch2_xiasha_4' },
  ch2_xiasha_4: { type: 'narration', text: '（武当山道，秋叶铺满石阶。两人并肩下山，远处清河镇的轮廓隐约可见。）', next: 'ch2_xiasha_5' },
  ch2_xiasha_5: { type: 'dialogue', speaker: '顾小桑', text: '终于下山了！我在武当待了四年，这还是头一回离开山门。你呢？上山之前，你去过别的地方吗？', portrait: 'picture/NPC/顾小桑.png', bg: 'picture/scene/C2-road.png', next: 'ch2_xiasha_6' },
  ch2_xiasha_6: { type: 'dialogue', speaker: '我', text: '……只待过一个村子。很小。只有一间石屋，一盘棋。', bg: 'picture/scene/C2-road.png', next: 'ch2_xiasha_7' },
  ch2_xiasha_7: { type: 'dialogue', speaker: '顾小桑', text: '（识趣地没有追问）好嘞！天黑前要到清河镇！', portrait: 'picture/NPC/顾小桑.png', bg: 'picture/scene/C2-road.png', next: 'ch2_xiasha_town_cg' },
  ch2_xiasha_town_cg: { type: 'cg', bg: 'picture/scene/C2-qinghe-town.png', delay: 2500, next: 'ch2_xiasha_8' },
  ch2_xiasha_8: { type: 'dialogue', speaker: '顾小桑', text: '这镇子……怎么死气沉沉的？大白天的，店铺都不开门？', portrait: 'picture/NPC/顾小桑.png', bg: 'picture/scene/C2-qinghe-town.png', next: 'ch2_xiasha_9' },
  ch2_xiasha_9: { type: 'dialogue', speaker: '老妇人', text: '你们是武当来的？快走吧，别多管闲事。你们去问问县衙的人——问他们，土匪为什么每次都能提前知道哪家有粮、哪家有银。', bg: 'picture/scene/C2-qinghe-town.png', next: 'ch2_xiasha_10' },
  ch2_xiasha_10: { type: 'dialogue', speaker: '顾小桑', text: '……这话里有话啊。', portrait: 'picture/NPC/顾小桑.png', bg: 'picture/scene/C2-qinghe-town.png', next: 'ch2_xiasha_11' },
  ch2_xiasha_11: { type: 'dialogue', speaker: '我', text: '先去县衙。', bg: 'picture/scene/C2-qinghe-town.png', next: 'ch2_xiasha_12' },
  ch2_xiasha_12: { type: 'narration', text: '（两日调查后，你们发现：土匪每次劫掠都精准避开县衙粮仓，县令王守仁与苍岭山匪首"独眼豹"私下有往来，县衙库房中存有大量来路不明的物资。）', next: 'ch2_xiasha_13' },
  ch2_xiasha_13: { type: 'narration', text: '（深夜，你独自潜入县衙库房，在一口上了锁的木箱中发现了一本暗账——上面详细记录了县令与土匪的分赃明细。正在此时，烛光亮起。）', next: 'ch2_xiasha_14' },
  ch2_xiasha_14: { type: 'dialogue', speaker: '王守仁', text: '武当的小兄弟，深夜造访本县库房——这恐怕不太合规矩吧？', bg: 'picture/scene/C2-qinghe-town.png', next: 'ch2_xiasha_15' },
  ch2_xiasha_15: { type: 'dialogue', speaker: '王守仁', text: '土匪的事，本县已经和苍岭山那边谈妥了。你呢——', bg: 'picture/scene/C2-qinghe-town.png', next: 'ch2_xiasha_16' },
  ch2_xiasha_16: { type: 'dialogue', speaker: '王守仁', text: '（取出一张银票，轻轻放在木箱上）拿着这个。本县再给你出具一份剿匪完成的凭证。你回武当交了差，升你的筑基，做你的内门弟子。至于清河镇的事——到此为止。对大家都好。', bg: 'picture/scene/C2-qinghe-town.png', next: 'ch2_xiasha_choice' },

  // 节点六：抉择
  ch2_xiasha_choice: {
    type: 'choice',
    choices: [
      { text: '（将银票在烛火上点燃）这钱——你留着买棺材吧。', next: 'ch2_hotblood_0' },
      { text: '（拿起银票收入怀中）……王大人说得对。有些事，不懂比懂了好。', next: 'ch2_wisdom_0' },
    ],
  },

  // ── 热血路线 ──
  ch2_hotblood_0: { type: 'dialogue', speaker: '王守仁', text: '……敬酒不吃吃罚酒。来人！武当弟子夜闯县衙，盗取库银——给我拿下！', bg: 'picture/scene/C2-qinghe-town.png', next: 'ch2_hotblood_1' },
  ch2_hotblood_1: { type: 'dialogue', speaker: '顾小桑', text: '（从窗外翻身而入，长剑已经出鞘）我就知道你会选这条路。——不过，正合我意！', portrait: 'picture/NPC/顾小桑.png', bg: 'picture/scene/C2-qinghe-town.png', next: 'ch2_hotblood_battle' },
  ch2_hotblood_battle: { type: 'battle', enemyId: 'yamen_guard', nextOnWin: 'ch2_hotblood_2', nextOnLose: 'ch2_hotblood_2' },
  ch2_hotblood_2: { type: 'dialogue', speaker: '顾小桑', text: '痛快！在山上憋了四年，终于能真刀真枪干一场了！不过——王守仁跑了。他肯定去苍岭山通风报信了。', portrait: 'picture/NPC/顾小桑.png', bg: 'picture/scene/C2-qinghe-town.png', next: 'ch2_hotblood_3' },
  ch2_hotblood_3: { type: 'dialogue', speaker: '我', text: '让他去。正好——一网打尽。', bg: 'picture/scene/C2-qinghe-town.png', next: 'ch2_to_mountain' },

  // ── 智取路线 ──
  ch2_wisdom_0: { type: 'narration', text: '（你沉默了片刻。然后——你笑了。那种笑法，和墨绐青在棋盘上落下一枚杀招时的表情一模一样。）', next: 'ch2_wisdom_1' },
  ch2_wisdom_1: { type: 'dialogue', speaker: '王守仁', text: '识时务者为俊杰。小兄弟前途无量。凭证明日一早差人送到你们客栈。至于苍岭山那边——你们去走个过场便是。', bg: 'picture/scene/C2-qinghe-town.png', next: 'ch2_wisdom_2' },
  ch2_wisdom_2: { type: 'dialogue', speaker: '顾小桑', text: '你——你居然收了他的钱？！那可是赃款！我还以为你跟别人不一样——', portrait: 'picture/NPC/顾小桑.png', bg: 'picture/scene/C2-qinghe-town.png', next: 'ch2_wisdom_3' },
  ch2_wisdom_3: { type: 'dialogue', speaker: '我', text: '小桑。你知道下棋的时候，最危险的是什么吗？', bg: 'picture/scene/C2-qinghe-town.png', next: 'ch2_wisdom_4' },
  ch2_wisdom_4: { type: 'dialogue', speaker: '我', text: '（取出暗账）是让对手以为——你已经入了他的局。银票上的编号，对应的是县衙公款账户。三日后，独眼豹和王守仁会在山寨碰头。那时候——人赃并获。', bg: 'picture/scene/C2-qinghe-town.png', next: 'ch2_wisdom_5' },
  ch2_wisdom_5: { type: 'dialogue', speaker: '顾小桑', text: '（张了张嘴，然后笑了——那种发自内心的、佩服的笑）……你这人，平时闷声不响的，肚子里全是主意啊。行——听你的。三日之后，苍岭山。', portrait: 'picture/NPC/顾小桑.png', bg: 'picture/scene/C2-qinghe-town.png', next: 'ch2_to_mountain' },

  // ── 节点七：惊鸿 ──
  ch2_to_mountain: { type: 'cg', bg: 'picture/scene/C2-bandit-lair.png', delay: 2000, next: 'ch2_jinghong_0' },
  ch2_jinghong_0: { type: 'dialogue', speaker: '顾小桑', text: '（压低声音）守卫比预想的多。正门至少六个。怎么打？', portrait: 'picture/NPC/顾小桑.png', bg: 'picture/scene/C2-bandit-lair.png', next: 'ch2_jinghong_1' },
  ch2_jinghong_1: { type: 'dialogue', speaker: '独眼豹', text: '武当的小崽子？就你们两个？哈哈哈哈——老子还以为武当至少会派个筑基期的来！', bg: 'picture/scene/C2-bandit-lair.png', next: 'ch2_jinghong_2' },
  ch2_jinghong_2: { type: 'dialogue', speaker: '顾小桑', text: '有什么好笑的——上！', portrait: 'picture/NPC/顾小桑.png', bg: 'picture/scene/C2-bandit-lair.png', next: 'ch2_jinghong_battle1' },
  ch2_jinghong_battle1: {
    type: 'battle', enemyId: 'bandit_elite',
    nextOnWin: 'ch2_jinghong_3', nextOnLose: 'ch2_jinghong_3',
    teamAllies: [{
      name: '顾小桑', hp: 180, maxHp: 180, mp: 60, maxMp: 60,
      atk: 28, def: 14, agi: 16, crit: 5,
      charImg: 'picture/NPC/顾小桑.png',
      skills: ['wudang_changquan' as import('../types').SkillId, 'wudang_jianfa_basic' as import('../types').SkillId],
    }],
    teamEnemies: ['bandit_elite' as import('../types').EnemyId, 'bandit_elite' as import('../types').EnemyId, 'bandit_elite' as import('../types').EnemyId, 'bandit_elite' as import('../types').EnemyId],
  },
  ch2_jinghong_3: { type: 'dialogue', speaker: '独眼豹', text: '……看来老子小看你们了。不过——晚了！', bg: 'picture/scene/C2-bandit-lair.png', next: 'ch2_jinghong_4' },
  ch2_jinghong_4: { type: 'narration', text: '（他拿起桌上的瓷瓶，倒出三粒暗红药丸，一口吞下。他的身体开始剧烈颤抖，肌肉膨胀，青筋暴起，独眼中泛起不正常的血红。一股远超炼气期的气息从他体内爆发出来。）', next: 'ch2_jinghong_5' },
  ch2_jinghong_5: { type: 'dialogue', speaker: '顾小桑', text: '这是——筑基期的气息？！不对——这不是正常突破，是邪药！', portrait: 'picture/NPC/顾小桑.png', bg: 'picture/scene/C2-bandit-lair.png', next: 'ch2_jinghong_6' },
  ch2_jinghong_6: { type: 'dialogue', speaker: '独眼豹', text: '苍岭山的秘药——燃血丹。一盏茶内，老子就是筑基期。你们两个炼气期的小崽子——拿什么跟老子打？！', bg: 'picture/scene/C2-bandit-lair.png', next: 'ch2_jinghong_boss' },
  ch2_jinghong_boss: {
    type: 'battle', enemyId: 'one_eye_leopard_drugged',
    nextOnWin: 'ch2_jinghong_shen', nextOnLose: 'ch2_jinghong_shen',
    teamAllies: [{
      name: '顾小桑', hp: 180, maxHp: 180, mp: 60, maxMp: 60,
      atk: 28, def: 14, agi: 16, crit: 5,
      charImg: 'picture/NPC/顾小桑.png',
      skills: ['wudang_changquan' as import('../types').SkillId, 'wudang_jianfa_basic' as import('../types').SkillId],
    }],
    teamEnemies: ['one_eye_leopard_drugged' as import('../types').EnemyId],
  },
  ch2_jinghong_shen: { type: 'narration', text: '（——轰隆！不是雷声。是一道真正的雷电，从天而降，劈穿了山寨大厅的屋顶！一道纤细的身影从破洞中落下，稳稳站在主角和独眼豹之间。）', next: 'ch2_jinghong_7' },
  ch2_jinghong_7: { type: 'dialogue', speaker: '沈霓裳', text: '武当的人？一个炼气八层，带着另一个炼气八层——跑来打筑基期的土匪？你们武当的人，都这么不要命吗？', portrait: 'picture/Female-main/沈霓裳.png', bg: 'picture/scene/C2-bandit-lair.png', next: 'ch2_jinghong_8' },
  ch2_jinghong_8: { type: 'dialogue', speaker: '沈霓裳', text: '茅山，沈霓裳。路过清河镇，听说苍岭山有土匪用邪药害人——茅山派管的就是这种事。', portrait: 'picture/Female-main/沈霓裳.png', bg: 'picture/scene/C2-bandit-lair.png', next: 'ch2_jinghong_9' },
  ch2_jinghong_9: { type: 'dialogue', speaker: '沈霓裳', text: '燃血丹。以活人精血为引，配以苍岭山毒瘴炼制。服用者短期内修为暴涨，但药效过后经脉尽断。这种东西——不该存在于世上。', portrait: 'picture/Female-main/沈霓裳.png', bg: 'picture/scene/C2-bandit-lair.png', next: 'ch2_jinghong_10' },
  ch2_jinghong_10: { type: 'dialogue', speaker: '独眼豹', text: '茅山的小丫头也来多管闲事？好——那就一起死！', bg: 'picture/scene/C2-bandit-lair.png', next: 'ch2_jinghong_victory' },
  ch2_jinghong_victory: { type: 'narration', text: '（雷火与剑光交织，独眼豹在两人联手之下逐渐不支。燃血丹的副作用开始加速——他的皮肤开始龟裂，渗出暗红色的血雾，轰然倒地。）', next: 'ch2_jinghong_11' },
  ch2_jinghong_11: { type: 'dialogue', speaker: '沈霓裳', text: '（收雷剑，冷冷地看着独眼豹）燃血丹的持续时间，取决于服用者的气血。你这些年用邪药催出来的修为——不过是借来的命。现在，该还了。', portrait: 'picture/Female-main/沈霓裳.png', bg: 'picture/scene/C2-bandit-lair.png', next: 'ch2_jinghong_12' },
  ch2_jinghong_12: { type: 'dialogue', speaker: '沈霓裳', text: '（回头看主角）你——叫什么名字？', portrait: 'picture/Female-main/沈霓裳.png', bg: 'picture/scene/C2-bandit-lair.png', next: 'ch2_jinghong_13' },
  ch2_jinghong_13: { type: 'dialogue', speaker: '沈霓裳', text: '奇怪。刚才我的雷法击中独眼豹的时候——你体内的气息，有一瞬间和我的雷法产生了共鸣。那种感觉……不像是一个炼气期的人该有的。你身上——藏着什么？', portrait: 'picture/Female-main/沈霓裳.png', bg: 'picture/scene/C2-bandit-lair.png', next: 'ch2_jinghong_14' },
  ch2_jinghong_14: { type: 'dialogue', speaker: '我', text: '……我不知道。', bg: 'picture/scene/C2-bandit-lair.png', next: 'ch2_jinghong_15' },
  ch2_jinghong_15: { type: 'dialogue', speaker: '沈霓裳', text: '（盯着他看了三秒，然后笑了——带着挑衅）有意思。我叫沈霓裳，茅山派。记住了——下次见面，我想看看你的真本事。不是这种被筑基期压着打的狼狈样子——是你真正该有的样子。', portrait: 'picture/Female-main/沈霓裳.png', bg: 'picture/scene/C2-bandit-lair.png', next: 'ch2_jinghong_16' },
  ch2_jinghong_16: { type: 'narration', text: '（雷光一闪，沈霓裳已掠出山寨大厅，只留下一句话在空气中回荡："后会有期，武当的——别死太早了！"）', next: 'ch2_jinghong_return' },

  // 返回武当·晋升
  ch2_jinghong_return: { type: 'cg', bg: 'picture/scene/C2-wudang-hall.png', delay: 2000, next: 'ch2_jinghong_17' },
  ch2_jinghong_17: { type: 'dialogue', speaker: '张玄素', text: '（翻阅暗账，沉默良久）……清河镇的事，不止是土匪。王朝治下，县令与匪勾结，百姓苦不堪言——这不是个例。你们做得很好。不只是除了匪——还查出了根。', portrait: 'picture/NPC/张玄素.png', bg: 'picture/scene/C2-wudang-hall.png', next: 'ch2_jinghong_18' },
  ch2_jinghong_18: { type: 'dialogue', speaker: '陈静虚', text: '下山一趟，拳法没退步，剑法反而精进了。……不错。', portrait: 'picture/NPC/陈静虚.png', bg: 'picture/scene/C2-wudang-hall.png', next: 'ch2_jinghong_19' },
  ch2_jinghong_19: { type: 'dialogue', speaker: '张玄素', text: '陈长老说你根骨平平。但根骨，从来不是武当最看重的东西。武当看重的是——心性。', portrait: 'picture/NPC/张玄素.png', bg: 'picture/scene/C2-wudang-hall.png', next: 'ch2_jinghong_20' },
  ch2_jinghong_20: { type: 'dialogue', speaker: '张玄素', text: '外门弟子[主角名]，试炼考合格。自今日起——晋升筑基，入内门。', portrait: 'picture/NPC/张玄素.png', bg: 'picture/scene/C2-wudang-hall.png', next: 'ch2_jinghong_21' },
  ch2_jinghong_21: { type: 'narration', text: '（后山老松树下。夕阳西下，积雪已化，松枝上新发了嫩芽。你独自站在树下，手里捏着一枚黑子——那是从古村棋舍带出来的唯一一件东西。）', next: 'ch2_jinghong_22' },
  ch2_jinghong_22: { type: 'dialogue', speaker: '柳清寒', text: '……恭喜。', portrait: 'picture/Female-main/柳清寒.png', bg: 'picture/scene/C2-night-pine.png', next: 'ch2_jinghong_23' },
  ch2_jinghong_23: { type: 'dialogue', speaker: '我', text: '师姐。墨姐姐她——还活着吗？', bg: 'picture/scene/C2-night-pine.png', next: 'ch2_jinghong_24' },
  ch2_jinghong_24: { type: 'dialogue', speaker: '柳清寒', text: '……活着。但她在的地方——你现在还去不了。', portrait: 'picture/Female-main/柳清寒.png', bg: 'picture/scene/C2-night-pine.png', next: 'ch2_jinghong_25' },
  ch2_jinghong_25: { type: 'dialogue', speaker: '我', text: '……要多强？', bg: 'picture/scene/C2-night-pine.png', next: 'ch2_jinghong_26' },
  ch2_jinghong_26: { type: 'dialogue', speaker: '柳清寒', text: '至少——化神。', portrait: 'picture/Female-main/柳清寒.png', bg: 'picture/scene/C2-night-pine.png', next: 'ch2_jinghong_27' },
  ch2_jinghong_27: { type: 'dialogue', speaker: '柳清寒', text: '不过，不急。她会等的。——我也在等。', portrait: 'picture/Female-main/柳清寒.png', bg: 'picture/scene/C2-night-pine.png', next: 'ch2_jinghong_end' },
  ch2_jinghong_end: { type: 'narration', text: '（化神……好。墨姐姐，等我。这盘棋——我还没下完。）\n\n── 第二章·武当问道·完 ──', next: 'END' },
};

const STORY_NODES: Record<string, StoryNode> = {
  ...INTRO_NODES,
  ...WENDAO_NODES,
  ...YESHOU_NODES,
  ...SHIJIAN_NODES,
  ...XIASHA_NODES,
};

export const CH2: ChapterData = {
  id: 2,
  title: '第二章 · 武当问道',
  startNode: 'ch2_intro_0',
  storyNodes: STORY_NODES,
  campScenes: {
    0: {
      id: 'ch2_camp_0',
      title: '武当外门弟子院',
      bg: 'picture/scene/C2-outer-court.png',
      npc: { name: '陈静虚', sub: '传功长老·元婴五层', img: 'picture/NPC/陈静虚.png' },
      desc: '石屋简陋，窗格透进山风。周伯安在院中分派差事，宋知远靠在门框上走神。修炼之路漫漫，炼气一层方可向传功长老问道。',
      actionLabel: '向陈静虚长老问道',
      actionEvent: 'ch2_wendao',
    },
    1: {
      id: 'ch2_camp_1',
      title: '传功崖·练功处',
      bg: 'picture/scene/C2-cliff.png',
      npc: { name: '顾小桑', sub: '外门师姐·炼气五层', img: 'picture/NPC/顾小桑.png' },
      desc: '武当长拳与养气诀已在心中。三面悬崖的传功崖，是修炼的好去处。月夜将至，炼气二层后后山将有人等候。',
      actionLabel: '深夜前往后山',
      actionEvent: 'ch2_yeshou',
    },
    2: {
      id: 'ch2_camp_2',
      title: '外门弟子院·月下',
      bg: 'picture/scene/C2-night-pine.png',
      npc: { name: '柳清寒', sub: '武当大师姐', img: 'picture/Female-main/柳清寒.png' },
      desc: '武当剑法基础已习。那道月下剑影，不知何时又会出现。演武场小比将至，炼气六层后可向周管事报名。',
      actionLabel: '参加外门小比',
      actionEvent: 'ch2_shijian',
    },
    3: {
      id: 'ch2_camp_3',
      title: '演武场·整装待发',
      bg: 'picture/scene/C2-arena.png',
      npc: { name: '陆沉舟', sub: '内门师兄·筑基八层', img: 'picture/NPC/陆沉舟.png' },
      desc: '小比已毕，陆沉舟的目光如刀。下山试炼考在即，炼气八层后可向周伯安报名外门试炼考。',
      actionLabel: '报名外门试炼考',
      actionEvent: 'ch2_xiasha',
    },
    4: {
      id: 'ch2_camp_4',
      title: '武当内门',
      bg: 'picture/scene/C2-wudang-hall.png',
      npc: { name: '沈霓裳', sub: '茅山派·雷法传人', img: 'picture/Female-main/沈霓裳.png' },
      desc: '苍岭山匪患已除，清河镇重归宁静。你已晋升筑基，踏入内门。那道消失在雷光中的背影，终将再次出现。\n\n第三章即将开启……',
      actionLabel: '踏入内门',
      actionEvent: 'enter_chapter3',
    },
  },
  finalAct: 4,
};
