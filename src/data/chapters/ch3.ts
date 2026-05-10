import type { StoryNode, SkillId } from '../types';
import type { ChapterData } from './types';

// ── 节点一：突破（第二章结束后·营地休息触发）─────────────────────
const BREAKTHROUGH_NODES: Record<string, StoryNode> = {
  ch3_break_0: { type: 'narration', text: '（从苍岭山回来后，你体内的气息便一直躁动不安。）\n\n（独眼豹那一掌的力道、沈霓裳雷法中蕴含的天地之力、生死之间的那一次格挡——这些都不是白费的。）\n\n（你盘膝坐在床上，闭目凝神。炼气十层的瓶颈，像一道即将被洪水冲垮的堤坝。）', next: 'ch3_break_1' },
  ch3_break_1: { type: 'narration', text: '（但突破大境界，最忌外力干扰。你需要一个人——在你最脆弱的时候，守着这扇门。）', next: 'ch3_break_cg' },
  ch3_break_cg: { type: 'cg', bg: 'picture/scene/C3-neimen_xiaowu.png', delay: 2500, next: 'ch3_break_2' },
  ch3_break_2: { type: 'dialogue', speaker: '柳清寒', text: '……你的气息乱了。\n\n突破大境界，不能没有护法。', portrait: 'picture/Female-main/柳清寒.png', bg: 'picture/scene/C3-neimen_xiaowu.png', next: 'ch3_break_3' },
  ch3_break_3: { type: 'dialogue', speaker: '我', text: '师姐？这么晚了——', bg: 'picture/scene/C3-neimen_xiaowu.png', next: 'ch3_break_4' },
  ch3_break_4: { type: 'narration', text: '（她没有回答，径直走进来，反手关上了门。走到书案旁，在椅子上坐下。动作依旧利落，但坐下之后——她的手指不自觉地绞住了袖口。）', next: 'ch3_break_5' },
  ch3_break_5: { type: 'dialogue', speaker: '我', text: '师姐。你为什么——总是对我这么好？', bg: 'picture/scene/C3-neimen_xiaowu.png', next: 'ch3_break_6' },
  ch3_break_6: { type: 'dialogue', speaker: '柳清寒', text: '……师尊交代的。', portrait: 'picture/Female-main/柳清寒.png', bg: 'picture/scene/C3-neimen_xiaowu.png', next: 'ch3_break_7' },
  ch3_break_7: { type: 'dialogue', speaker: '我', text: '又是师尊。', bg: 'picture/scene/C3-neimen_xiaowu.png', next: 'ch3_break_8' },
  ch3_break_8: { type: 'dialogue', speaker: '柳清寒', text: '……专心突破。不要说话。', portrait: 'picture/Female-main/柳清寒.png', bg: 'picture/scene/C3-neimen_xiaowu.png', next: 'ch3_break_9' },
  ch3_break_9: { type: 'narration', text: '（她转回去，背挺得笔直。但那本剑谱——她盯了半天的剑谱——是倒着放的。）\n\n剑谱拿倒了都没发现……师姐，你到底在想什么。', next: 'ch3_break_10' },
  ch3_break_10: { type: 'narration', text: '（你闭上眼。体内的气息如潮水般涌动。）\n\n（炼气十层——那是外门弟子的终点，也是内门的起点。气息在丹田中凝聚、旋转、压缩——然后，轰然炸开！）', next: 'ch3_break_11' },
  ch3_break_11: { type: 'narration', text: '（不知过了多久。体内的气息终于平复下来，如一条驯服的河流在经脉中缓缓流淌。）\n\n（你睁开眼——发现柳清寒还坐在那里。姿势和刚才一模一样，背依旧挺得笔直。但她的眼睛——在月光下，那双眼睛里有太多还没来得及藏起来的情绪。）', next: 'ch3_break_12' },
  ch3_break_12: { type: 'dialogue', speaker: '我', text: '师姐。我突破了。', bg: 'picture/scene/C3-neimen_xiaowu.png', next: 'ch3_break_13' },
  ch3_break_13: { type: 'narration', text: '（她站起身，向门口走去。走到门口，手已经搭上了门闩——却忽然停住了。）', next: 'ch3_break_14' },
  ch3_break_14: { type: 'dialogue', speaker: '柳清寒', text: '……恭喜你。', portrait: 'picture/Female-main/柳清寒.png', bg: 'picture/scene/C3-neimen_xiaowu.png', next: 'ch3_break_15' },
  ch3_break_15: { type: 'dialogue', speaker: '我', text: '师姐。以后——不用偷偷在后山等我了。想教我剑法，直接来就好。', bg: 'picture/scene/C3-neimen_xiaowu.png', next: 'ch3_break_16' },
  ch3_break_16: { type: 'dialogue', speaker: '柳清寒', text: '……我没有偷偷。', portrait: 'picture/Female-main/柳清寒.png', bg: 'picture/scene/C3-neimen_xiaowu.png', next: 'ch3_break_end' },
  ch3_break_end: { type: 'narration', text: '（她推开门，快步走入夜色之中。步伐依旧利落——但主角分明看见，她在跨出门槛的那一刻，耳根红得像要烧起来。）\n\n没有偷偷……吗。那上次在后山站到肩头积霜的人——是谁。\n\n🎉 突破大境界：炼气十层 → 筑基一层！\n📖 柳清寒好感度 +15', next: 'END' },
};

// ── 节点二：赠书（筑基一层·自动触发）───────────────────────────
const GIFTSHU_NODES: Record<string, StoryNode> = {
  ch3_gift_0: { type: 'dialogue', speaker: '宋知远', text: '隔壁的！听说你突破筑基了？内门弟子了？！\n\n我的天——你才入门多久？我在这儿蹲了三年还是炼气三层——人比人气死人啊！', portrait: 'picture/NPC/宋知远.png', bg: 'picture/scene/C2-outer-court.png', next: 'ch3_gift_1' },
  ch3_gift_1: { type: 'dialogue', speaker: '我', text: '这个给你。', bg: 'picture/scene/C2-outer-court.png', next: 'ch3_gift_2' },
  ch3_gift_2: { type: 'dialogue', speaker: '宋知远', text: '这是——你的突破心得？从炼气一层到筑基的每一步？\n\n……隔壁的，你知道这种东西在外面能卖多少钱吗？', portrait: 'picture/NPC/宋知远.png', bg: 'picture/scene/C2-outer-court.png', next: 'ch3_gift_3' },
  ch3_gift_3: { type: 'dialogue', speaker: '我', text: '不值钱。只是我自己瞎琢磨的。', bg: 'picture/scene/C2-outer-court.png', next: 'ch3_gift_4' },
  ch3_gift_4: { type: 'dialogue', speaker: '宋知远', text: '……你这个人。明明已经是内门弟子了，还惦记着我这种万年炼气三层的废物。\n\n——谢了。', portrait: 'picture/NPC/宋知远.png', bg: 'picture/scene/C2-outer-court.png', next: 'ch3_gift_5' },
  ch3_gift_5: { type: 'dialogue', speaker: '宋知远', text: '等着吧，隔壁的。等我突破筑基，就去内门找你。到时候——咱们再比一场！不过你得让我三招——不对，十招！', portrait: 'picture/NPC/宋知远.png', bg: 'picture/scene/C2-outer-court.png', next: 'ch3_gift_end' },
  ch3_gift_end: { type: 'narration', text: '（他把手册小心地收入怀中，然后恢复了那副嬉皮笑脸的样子。）\n\n📖 宋知远好感度 +20\n🎁 宋知远获得【突破心得手册】（未来宋知远突破概率大幅提升）', next: 'END' },
};

// ── 节点三：拜师（筑基一层·自动触发）───────────────────────────
const BAISHI_NODES: Record<string, StoryNode> = {
  ch3_baishi_0: { type: 'narration', text: '（武当传功崖。陈静虚负手立于崖边，依旧是那件打了补丁的灰布道袍，腰间插着枯枝。但今日——他身边多了一个人。）', next: 'ch3_baishi_1' },
  ch3_baishi_1: { type: 'dialogue', speaker: '陈静虚', text: '筑基了。比我想的快。\n\n苍岭山的战斗，我听说了一些。以炼气八层对抗服了邪药的筑基期——蠢。', portrait: 'picture/NPC/陈静虚.png', bg: 'picture/scene/C2-cliff.png', next: 'ch3_baishi_2' },
  ch3_baishi_2: { type: 'dialogue', speaker: '陈静虚', text: '——但蠢得不错。武当不需要聪明人。需要的是——该蠢的时候，敢蠢的人。', portrait: 'picture/NPC/陈静虚.png', bg: 'picture/scene/C2-cliff.png', next: 'ch3_baishi_3' },
  ch3_baishi_3: { type: 'dialogue', speaker: '陈静虚', text: '你是近年武当第二快突破筑基的弟子了。', portrait: 'picture/NPC/陈静虚.png', bg: 'picture/scene/C2-cliff.png', next: 'ch3_baishi_4' },
  ch3_baishi_4: { type: 'dialogue', speaker: '我', text: '师父——那最快的是谁？', bg: 'picture/scene/C2-cliff.png', next: 'ch3_baishi_5' },
  ch3_baishi_5: { type: 'dialogue', speaker: '陈静虚', text: '正是清寒。而她——很快会成为武当最快突破金丹的弟子。', portrait: 'picture/NPC/陈静虚.png', bg: 'picture/scene/C2-cliff.png', next: 'ch3_baishi_6' },
  ch3_baishi_6: { type: 'narration', text: '（你不禁看向柳清寒。她没有闪躲，迎上你的目光——那双清冷的眼睛里，没有炫耀，没有骄傲，只有一种安静的、笃定的鼓励。仿佛在说：你也可以。）', next: 'ch3_baishi_7' },
  ch3_baishi_7: { type: 'dialogue', speaker: '陈静虚', text: '内门弟子，需择一位长老为师。我门下弟子不多——你若愿意，今日便行拜师礼。', portrait: 'picture/NPC/陈静虚.png', bg: 'picture/scene/C2-cliff.png', next: 'ch3_baishi_8' },
  ch3_baishi_8: { type: 'narration', text: '（你毫不犹豫，单膝跪地，抱拳。）', next: 'ch3_baishi_9' },
  ch3_baishi_9: { type: 'dialogue', speaker: '我', text: '弟子[主角名]，拜见师父。', bg: 'picture/scene/C2-cliff.png', next: 'ch3_baishi_10' },
  ch3_baishi_10: { type: 'dialogue', speaker: '陈静虚', text: '……嗯。起来吧。', portrait: 'picture/NPC/陈静虚.png', bg: 'picture/scene/C2-cliff.png', next: 'ch3_baishi_11' },
  ch3_baishi_11: { type: 'dialogue', speaker: '柳清寒', text: '……师弟。', portrait: 'picture/Female-main/柳清寒.png', bg: 'picture/scene/C2-cliff.png', next: 'ch3_baishi_12' },
  ch3_baishi_12: { type: 'dialogue', speaker: '陈静虚', text: '清寒入内门时，也是我教的。以后——你们便是同门了。', portrait: 'picture/NPC/陈静虚.png', bg: 'picture/scene/C2-cliff.png', next: 'ch3_baishi_13' },
  ch3_baishi_13: { type: 'narration', text: '（陈静虚先行离开。传功崖上只剩你和柳清寒两人。云雾在脚下翻涌，远处七十二峰如黛。）', next: 'ch3_baishi_14' },
  ch3_baishi_14: { type: 'dialogue', speaker: '柳清寒', text: '师父很少夸人。他说你"蠢得不错"——已经是极高的评价了。', portrait: 'picture/Female-main/柳清寒.png', bg: 'picture/scene/C2-cliff.png', next: 'ch3_baishi_15' },
  ch3_baishi_15: { type: 'dialogue', speaker: '我', text: '师姐，你当初拜师的时候，师父说了什么？', bg: 'picture/scene/C2-cliff.png', next: 'ch3_baishi_16' },
  ch3_baishi_16: { type: 'dialogue', speaker: '柳清寒', text: '……他说我"太聪明，反而不好"。然后让我去后山劈了三个月的柴。', portrait: 'picture/Female-main/柳清寒.png', bg: 'picture/scene/C2-cliff.png', next: 'ch3_baishi_17' },
  ch3_baishi_17: { type: 'dialogue', speaker: '柳清寒', text: '对了。师父的课——每周三次，卯时，传功崖。……别迟到。', portrait: 'picture/Female-main/柳清寒.png', bg: 'picture/scene/C2-cliff.png', next: 'ch3_baishi_end' },
  ch3_baishi_end: { type: 'narration', text: '（她走了。但主角注意到——她说"别迟到"的时候，语气和当初在后山说"跟上"一模一样。）\n\n师姐的关心，永远藏在最短的句子里。\n\n👤 拜入陈静虚门下\n📖 柳清寒好感度 +10（同门身份确认）\n📋 解锁可重复任务：随师父修行', next: 'END' },
};

// ── 节点四：授剑（筑基三层触发）─────────────────────────────
const SHOUJIAN_NODES: Record<string, StoryNode> = {
  ch3_jian_0: { type: 'narration', text: '（传功崖。陈静虚手持一柄真剑——不是枯枝。剑身狭长，在晨光中泛着幽蓝的寒芒。）', next: 'ch3_jian_1' },
  ch3_jian_1: { type: 'dialogue', speaker: '陈静虚', text: '筑基三层。根基已稳，可以学真东西了。\n\n武当剑法，外门学的是架势。内门学的——是剑意。', portrait: 'picture/NPC/陈静虚.png', bg: 'picture/scene/C2-cliff.png', next: 'ch3_jian_2' },
  ch3_jian_2: { type: 'narration', text: '（他缓缓举起长剑。动作不快，但剑尖所指之处，崖边的云雾竟然自动向两侧分开——仿佛被一道无形的力量劈开。）', next: 'ch3_jian_3' },
  ch3_jian_3: { type: 'dialogue', speaker: '陈静虚', text: '武当真传剑法，共三式——\n\n【云开】。剑出如晨曦破雾，专破护体真气。\n【松涛】。剑势连绵如松涛起伏，攻中带守。\n【归元】。万剑归宗，将所有剑意凝于一剑。', portrait: 'picture/NPC/陈静虚.png', bg: 'picture/scene/C2-cliff.png', next: 'ch3_jian_4' },
  ch3_jian_4: { type: 'narration', text: '（演示：陈静虚三式连出。第一剑劈开云雾，第二剑化作连绵剑影，第三剑——所有的剑影骤然合一，崖边一块巨石无声无息地裂成两半。）', next: 'ch3_jian_5' },
  ch3_jian_5: { type: 'dialogue', speaker: '陈静虚', text: '三式之中，先学【云开】。什么时候一剑能劈开崖下的云雾——再来找我学第二式。', portrait: 'picture/NPC/陈静虚.png', bg: 'picture/scene/C2-cliff.png', next: 'ch3_jian_end' },
  ch3_jian_end: { type: 'narration', text: '⚔️ 获得技能：【武当剑法·云开】（筑基期·破防技）\n📋 后续技能需达到筑基五层+【云开】熟练度满', next: 'END' },
};

// ── 节点五：下山（筑基五层触发）─────────────────────────────
const XIASHAN_NODES: Record<string, StoryNode> = {
  ch3_xiashan_0: { type: 'dialogue', speaker: '周伯安', text: '哟，内门的来了。正好——这批外门弟子要下山去青石村收妖，缺个带队的。你筑基五层了，带他们走一趟？', portrait: 'picture/NPC/周伯安.png', bg: 'picture/scene/C2-outer-court.png', next: 'ch3_xiashan_1' },
  ch3_xiashan_1: { type: 'dialogue', speaker: '周伯安', text: '不是什么大事——青石村附近最近有妖兽出没，伤了几个村民。外门弟子没见过血，得有个人镇场子。', portrait: 'picture/NPC/周伯安.png', bg: 'picture/scene/C2-outer-court.png', next: 'ch3_xiashan_2' },
  ch3_xiashan_2: { type: 'dialogue', speaker: '外门弟子·林小石', text: '师、师兄好！我叫林小石，炼气二层——请师兄多多关照！', bg: 'picture/scene/C2-outer-court.png', next: 'ch3_xiashan_3' },
  ch3_xiashan_3: { type: 'dialogue', speaker: '我', text: '……走吧。路上说。', bg: 'picture/scene/C2-outer-court.png', next: 'ch3_xiashan_cg' },
  ch3_xiashan_cg: { type: 'cg', bg: 'picture/scene/C3-qingshicun.png', delay: 2500, next: 'ch3_xiashan_4' },
  ch3_xiashan_4: { type: 'dialogue', speaker: '外门弟子·林小石', text: '师兄……那、那是什么？', bg: 'picture/scene/C3-qingshicun.png', next: 'ch3_xiashan_5' },
  ch3_xiashan_5: { type: 'dialogue', speaker: '我', text: '别怕。记住陈长老教的——肩松则力沉。深呼吸。然后——出剑。', bg: 'picture/scene/C3-qingshicun.png', next: 'ch3_xiashan_battle' },
  ch3_xiashan_battle: { type: 'battle', enemyId: 'forest_yao_beast', nextOnWin: 'ch3_xiashan_6', nextOnLose: 'ch3_xiashan_6', teamAllies: [{ name: '林小石', hp: 60, maxHp: 60, mp: 10, maxMp: 10, atk: 12, def: 6, agi: 6, crit: 2, icon: '🗡️', skills: ['wudang_changquan' as SkillId] }, { name: '外门弟子·苏小妹', hp: 55, maxHp: 55, mp: 12, maxMp: 12, atk: 10, def: 5, agi: 8, crit: 3, icon: '🌸', skills: ['wudang_changquan' as SkillId] }] },
  ch3_xiashan_6: { type: 'dialogue', speaker: '外门弟子·林小石', text: '我、我活下来了！师兄你看见了吗？我刚才那一剑——', bg: 'picture/scene/C3-qingshicun.png', next: 'ch3_xiashan_7' },
  ch3_xiashan_7: { type: 'narration', text: '（回武当的路上，经过一片废弃的山神庙——你忽然停下了脚步。）', next: 'ch3_xiashan_8' },
  ch3_xiashan_8: { type: 'dialogue', speaker: '我', text: '……有人。', bg: 'picture/scene/C3-shanmiao.png', next: 'ch3_xiashan_9' },
  ch3_xiashan_9: { type: 'dialogue', speaker: '黑月教探子', text: '武当的人？哼——这青石村的妖兽，是我们放养的试验品。你们杀了我们的妖兽——总得留下点什么。', bg: 'picture/scene/C3-shanmiao.png', next: 'ch3_xiashan_10' },
  ch3_xiashan_10: { type: 'dialogue', speaker: '我', text: '武当，陈静虚门下。——[主角名]。', bg: 'picture/scene/C3-shanmiao.png', next: 'ch3_xiashan_boss' },
  ch3_xiashan_boss: { type: 'battle', enemyId: 'blackmoon_scout_elite', nextOnWin: 'ch3_xiashan_11', nextOnLose: 'ch3_xiashan_11' },
  ch3_xiashan_11: { type: 'dialogue', speaker: '黑月教探子', text: '……武当陈静虚门下……我记住了。下次见面——就是你的死期。', bg: 'picture/scene/C3-shanmiao.png', next: 'ch3_xiashan_end' },
  ch3_xiashan_end: { type: 'narration', text: '（两人捏碎一道符咒，化作黑烟消失。）\n\n……黑月教在青石村放养妖兽。这不是偶然。回去禀报掌门。\n\n✅ 下山行侠·完成\n🎁 获得物品：黑月教令牌碎片（剧情道具·后续主线触发）\n📈 外门弟子好感度大幅提升', next: 'END' },
};

// ── 节点六：锋芒（筑基七层触发·试剑会第一轮 vs 陆沉舟）─────────
const FENGMANG_NODES: Record<string, StoryNode> = {
  ch3_feng_0: { type: 'narration', text: '（武当演武场。三年一度的内门试剑会。张玄素坐于高台，五位长老分列两侧。内门弟子齐聚，外门弟子在远处围观——宋知远挤在最前面，手里还攥着那本手册。）', next: 'ch3_feng_1' },
  ch3_feng_1: { type: 'dialogue', speaker: '周伯安', text: '内门试剑会——开始。规矩照旧：抽签配对，点到为止。前三名——可入藏经阁自选一门武学。', portrait: 'picture/NPC/周伯安.png', bg: 'picture/scene/C2-arena.png', next: 'ch3_feng_2' },
  ch3_feng_2: { type: 'dialogue', speaker: '宋知远', text: '隔壁的！加油！让内门的人看看你的厉害！', portrait: 'picture/NPC/宋知远.png', bg: 'picture/scene/C2-arena.png', next: 'ch3_feng_3' },
  ch3_feng_3: { type: 'dialogue', speaker: '周伯安', text: '第一轮——[主角名]，对——陆沉舟。', portrait: 'picture/NPC/周伯安.png', bg: 'picture/scene/C2-arena.png', next: 'ch3_feng_4' },
  ch3_feng_4: { type: 'narration', text: '（全场安静了一瞬。然后炸开了锅。）', next: 'ch3_feng_5' },
  ch3_feng_5: { type: 'dialogue', speaker: '顾小桑', text: '……陆沉舟筑基八层。师弟，小心。', portrait: 'picture/NPC/顾小桑.png', bg: 'picture/scene/C2-arena.png', next: 'ch3_feng_6' },
  ch3_feng_6: { type: 'dialogue', speaker: '陆沉舟', text: '又见面了。上次在外门小比，我说过——如果你能通过试炼考，我会亲自在演武场等你。现在——让我看看，大师姐到底看中了你什么。', portrait: 'picture/NPC/陆沉舟.png', bg: 'picture/scene/C2-arena.png', next: 'ch3_feng_battle' },
  ch3_feng_battle: { type: 'battle', enemyId: 'lu_chenzhou', nextOnWin: 'ch3_feng_7', nextOnLose: 'ch3_feng_7' },
  ch3_feng_7: { type: 'narration', text: '（演武场上一片寂静。你的长剑停在陆沉舟胸前——剑尖距离他的衣襟，只有一寸。陆沉舟低头看了看那柄剑。然后——缓缓露出了一个极淡的笑容。）', next: 'ch3_feng_8' },
  ch3_feng_8: { type: 'dialogue', speaker: '我', text: '……侥幸。', bg: 'picture/scene/C2-arena.png', next: 'ch3_feng_9' },
  ch3_feng_9: { type: 'dialogue', speaker: '陆沉舟', text: '不是侥幸。你的【云开】，已经有了自己的东西。不是陈长老教的——是你自己悟出来的。大师姐的眼光——确实不差。', portrait: 'picture/NPC/陆沉舟.png', bg: 'picture/scene/C2-arena.png', next: 'ch3_feng_10' },
  ch3_feng_10: { type: 'dialogue', speaker: '陆沉舟', text: '从今天起——你是我陆沉舟的对手。下次，我不会输。', portrait: 'picture/NPC/陆沉舟.png', bg: 'picture/scene/C2-arena.png', next: 'ch3_feng_end' },
  ch3_feng_end: { type: 'narration', text: '（高台之上，张玄素微微点头。陈静虚依旧面无表情——但他手中那根枯枝，不知何时被他捏成了两截。）\n\n✅ 内门试剑会·战胜陆沉舟\n👤 陆沉舟认可度 +40（从"审视者"变为"对手"）', next: 'END' },
};

// ── 节点七：婚约（筑基七层·试剑会当晚触发）─────────────────
const HUNYUE_NODES: Record<string, StoryNode> = {
  ch3_hun_0: { type: 'narration', text: '（内门弟子小屋。夜已深。你盘膝坐在床上，闭目回味今日与陆沉舟那一战的每一个细节。）\n\n（陆沉舟的剑很快。但他的剑意——你读懂了。不是用眼睛读的。是用身体——用那一次次在传功崖上劈开云雾的经验，用苍岭山生死之间的本能。）', next: 'ch3_hun_1' },
  ch3_hun_1: { type: 'narration', text: '（正在此时——叩、叩。门被轻轻敲响了。）', next: 'ch3_hun_2' },
  ch3_hun_2: { type: 'dialogue', speaker: '柳清寒', text: '……是我。', portrait: 'picture/Female-main/柳清寒.png', bg: 'picture/scene/C3-neimen_xiaowu.png', next: 'ch3_hun_3' },
  ch3_hun_3: { type: 'narration', text: '（门开了。柳清寒站在月光里。今夜她穿的是白日那件素白道袍，整整齐齐——像是特意换过才来的。你忽然有些手足无措，手忙脚乱地去倒水。茶壶是冷的，杯子也没洗。）', next: 'ch3_hun_4' },
  ch3_hun_4: { type: 'dialogue', speaker: '柳清寒', text: '……今天那一战，打得很好。', portrait: 'picture/Female-main/柳清寒.png', bg: 'picture/scene/C3-neimen_xiaowu.png', next: 'ch3_hun_5' },
  ch3_hun_5: { type: 'dialogue', speaker: '我', text: '是陆师兄让着我——', bg: 'picture/scene/C3-neimen_xiaowu.png', next: 'ch3_hun_6' },
  ch3_hun_6: { type: 'dialogue', speaker: '柳清寒', text: '他没有让。我看得出来。你最后那一剑——归元的剑意，已经有了自己的东西。', portrait: 'picture/Female-main/柳清寒.png', bg: 'picture/scene/C3-neimen_xiaowu.png', next: 'ch3_hun_7' },
  ch3_hun_7: { type: 'dialogue', speaker: '柳清寒', text: '我今天来……是想跟你说一件事。\n\n（沉默了很久。久到窗外的虫鸣都停了一轮。）\n\n我自小被武当收养。一直生活在武当。但自小——就有一个约定的婚约。', portrait: 'picture/Female-main/柳清寒.png', bg: 'picture/scene/C3-neimen_xiaowu.png', next: 'ch3_hun_8' },
  ch3_hun_8: { type: 'dialogue', speaker: '我', text: '……婚约？', bg: 'picture/scene/C3-neimen_xiaowu.png', next: 'ch3_hun_9' },
  ch3_hun_9: { type: 'dialogue', speaker: '我', text: '……在下不想知道。也不愿知道。', bg: 'picture/scene/C3-neimen_xiaowu.png', next: 'ch3_hun_10' },
  ch3_hun_10: { type: 'dialogue', speaker: '柳清寒', text: '……你不想知道对方是谁吗？', portrait: 'picture/Female-main/柳清寒.png', bg: 'picture/scene/C3-neimen_xiaowu.png', next: 'ch3_hun_11' },
  ch3_hun_11: { type: 'dialogue', speaker: '柳清寒', text: '师父说——在武当山脚。如果我救到一个落魄的小师弟——那就是我这辈子的缘分。', portrait: 'picture/Female-main/柳清寒.png', bg: 'picture/scene/C3-neimen_xiaowu.png', next: 'ch3_hun_12' },
  ch3_hun_12: { type: 'dialogue', speaker: '我', text: '……武当山脚？可是师姐——你救我就是在武当山脚的雪地里。', bg: 'picture/scene/C3-neimen_xiaowu.png', next: 'ch3_hun_13' },
  ch3_hun_13: { type: 'dialogue', speaker: '柳清寒', text: '……嗯。就是那里。', portrait: 'picture/Female-main/柳清寒.png', bg: 'picture/scene/C3-neimen_xiaowu.png', next: 'ch3_hun_14' },
  ch3_hun_14: { type: 'narration', text: '（她说完这句话，猛地站起身。动作依旧利落——但这一次，她撞到了桌角，差点带翻了那杯凉水。）', next: 'ch3_hun_15' },
  ch3_hun_15: { type: 'dialogue', speaker: '柳清寒', text: '……那杯水。下次——烧热了再给我。', portrait: 'picture/Female-main/柳清寒.png', bg: 'picture/scene/C3-neimen_xiaowu.png', next: 'ch3_hun_end' },
  ch3_hun_end: { type: 'narration', text: '（门开了。月光涌入，又随着门的关闭而收敛。脚步声渐远。）\n\n武当山脚……就是我遇到她的那个雪夜。师姐——原来从一开始，你就知道了。\n\n……下次。下次一定烧热。\n\n📖 柳清寒好感度 +20\n💍 婚约剧情解锁', next: 'END' },
};

// ── 节点八：夺魁（试剑会次日·连战三场）─────────────────
const DUOKUI_NODES: Record<string, StoryNode> = {
  ch3_duo_0: { type: 'narration', text: '（武当演武场。试剑会第二日。昨日你击败陆沉舟的消息已经传遍了整个武当——外门弟子把演武场围得水泄不通。）', next: 'ch3_duo_1' },
  ch3_duo_1: { type: 'dialogue', speaker: '宋知远', text: '隔壁的！今天继续！把他们全打趴下！', portrait: 'picture/NPC/宋知远.png', bg: 'picture/scene/C2-arena.png', next: 'ch3_duo_2' },
  ch3_duo_2: { type: 'dialogue', speaker: '周伯安', text: '第二轮——[主角名]，对——方仲和。', portrait: 'picture/NPC/周伯安.png', bg: 'picture/scene/C2-arena.png', next: 'ch3_duo_battle1' },
  ch3_duo_battle1: { type: 'battle', enemyId: 'fang_zhonghe', nextOnWin: 'ch3_duo_3', nextOnLose: 'ch3_duo_3' },
  ch3_duo_3: { type: 'dialogue', speaker: '方仲和', text: '服了服了！师弟你这剑——比昨天打陆师兄的时候还快！看来昨天那一战，你又突破了。', portrait: 'picture/NPC/方仲和.png', bg: 'picture/scene/C2-arena.png', next: 'ch3_duo_4' },
  ch3_duo_4: { type: 'dialogue', speaker: '周伯安', text: '第三轮——[主角名]，对——苏云绣。', portrait: 'picture/NPC/周伯安.png', bg: 'picture/scene/C2-arena.png', next: 'ch3_duo_battle2' },
  ch3_duo_battle2: { type: 'battle', enemyId: 'su_yunxiu', nextOnWin: 'ch3_duo_5', nextOnLose: 'ch3_duo_5' },
  ch3_duo_5: { type: 'dialogue', speaker: '苏云绣', text: '厉害厉害。小师兄天赋异禀，入宗门短短时日就到了筑基七层——师姐我甘拜下风。', portrait: 'picture/NPC/苏云绣.png', bg: 'picture/scene/C2-arena.png', next: 'ch3_duo_6' },
  ch3_duo_6: { type: 'dialogue', speaker: '苏云绣', text: '对了——小师兄，你可有心仪的姑娘？要不——考虑考虑姐姐？', portrait: 'picture/NPC/苏云绣.png', bg: 'picture/scene/C2-arena.png', next: 'ch3_duo_7' },
  ch3_duo_7: { type: 'narration', text: '（你下意识地——目光不由自主地飘向了演武场边。柳清寒正站在那里。四目相对。柳清寒的脸上，浮起了一层极淡的红晕。）', next: 'ch3_duo_8' },
  ch3_duo_8: { type: 'dialogue', speaker: '我', text: '苏师姐说笑了！在下——在下还需努力修炼，告辞！', bg: 'picture/scene/C2-arena.png', next: 'ch3_duo_9' },
  ch3_duo_9: { type: 'narration', text: '（你几乎是逃下了擂台。身后传来苏云绣银铃般的笑声。而在主角看不到的地方——柳清寒看着那个仓皇逃窜的背影，嘴角弯起了一个极淡的、好看的弧度。）', next: 'ch3_duo_10' },
  ch3_duo_10: { type: 'dialogue', speaker: '周伯安', text: '决赛——[主角名]，对——纪无双。', portrait: 'picture/NPC/周伯安.png', bg: 'picture/scene/C2-arena.png', next: 'ch3_duo_11' },
  ch3_duo_11: { type: 'narration', text: '（全场安静了下来。纪无双——内门另一位筑基七层的领袖人物。与陆沉舟齐名，人称"武当双璧"。）', next: 'ch3_duo_12' },
  ch3_duo_12: { type: 'dialogue', speaker: '纪无双', text: '[主角名]。昨天你和陆沉舟那一战，我看了。你的剑——很快。但我的剑，也不慢。请。', portrait: 'picture/NPC/纪无双.png', bg: 'picture/scene/C2-arena.png', next: 'ch3_duo_battle3' },
  ch3_duo_battle3: { type: 'battle', enemyId: 'ji_wushuang', nextOnWin: 'ch3_duo_13', nextOnLose: 'ch3_duo_13' },
  ch3_duo_13: { type: 'dialogue', speaker: '纪无双', text: '……好剑。你的归元——最后那一剑，我看见了。不是师父教的。是你自己的。武当有你——是幸事。', portrait: 'picture/NPC/纪无双.png', bg: 'picture/scene/C2-arena.png', next: 'ch3_duo_14' },
  ch3_duo_14: { type: 'dialogue', speaker: '纪无双', text: '恭喜。内门试剑会——魁首。', portrait: 'picture/NPC/纪无双.png', bg: 'picture/scene/C2-arena.png', next: 'ch3_duo_end' },
  ch3_duo_end: { type: 'narration', text: '（演武场爆发出雷鸣般的欢呼。宋知远嗓子已经喊哑了，还在拼命挥舞那面破布条。顾小桑眼眶有点红，用力鼓掌。）\n\n🏆 内门试剑会·魁首\n📈 获得大量经验\n🎁 获得奖励：藏经阁自选武学（一次）', next: 'END' },
};

// ── 节点九：真传（试剑会结束后·自动触发）─────────────────
const ZHENCHUAN_NODES: Record<string, StoryNode> = {
  ch3_zhen_0: { type: 'narration', text: '（武当真武大殿。张玄素坐于蒲团之上，陈静虚立于一侧。殿中只有你们三人，檀香缭绕。）', next: 'ch3_zhen_1' },
  ch3_zhen_1: { type: 'dialogue', speaker: '张玄素', text: '试剑会魁首。击败陆沉舟，又胜纪无双。陈长老——你收了个好徒弟。', portrait: 'picture/NPC/张玄素.png', bg: 'picture/scene/C1-wudang_hall.png', next: 'ch3_zhen_2' },
  ch3_zhen_2: { type: 'dialogue', speaker: '陈静虚', text: '……是他自己争气。', portrait: 'picture/NPC/陈静虚.png', bg: 'picture/scene/C1-wudang_hall.png', next: 'ch3_zhen_3' },
  ch3_zhen_3: { type: 'dialogue', speaker: '张玄素', text: '内门弟子[主角名]，试剑会夺魁，修为扎实，心性上佳。自今日起——晋升真传弟子。', portrait: 'picture/NPC/张玄素.png', bg: 'picture/scene/C1-wudang_hall.png', next: 'ch3_zhen_4' },
  ch3_zhen_4: { type: 'dialogue', speaker: '张玄素', text: '成为真传弟子，便不只是修炼了。武当真传——要担得起"行侠仗义"四个字。你此前在青石村遭遇的黑月教探子——陈长老已经禀报过我。', portrait: 'picture/NPC/张玄素.png', bg: 'picture/scene/C1-wudang_hall.png', next: 'ch3_zhen_5' },
  ch3_zhen_5: { type: 'dialogue', speaker: '陈静虚', text: '黑月教。魔教之中，它不算武功最强的。但却是最让人头疼的一个。他们不靠武功——靠邪药。以妖兽精血、甚至活人经脉为引，炼制各种禁药。', portrait: 'picture/NPC/陈静虚.png', bg: 'picture/scene/C1-wudang_hall.png', next: 'ch3_zhen_6' },
  ch3_zhen_6: { type: 'dialogue', speaker: '陈静虚', text: '试剑会结束后，各长老会带领门下真传弟子下山——调查并铲除黑月教在各处的据点。你有一个月的时间。好好总结试剑会的经验，巩固修为。一个月后——随我下山。', portrait: 'picture/NPC/陈静虚.png', bg: 'picture/scene/C1-wudang_hall.png', next: 'ch3_zhen_end' },
  ch3_zhen_end: { type: 'narration', text: '🏔️ 晋升真传弟子\n📜 解锁主线任务：黑月教讨伐（一个月后触发）\n⏳ 倒计时：30天（可通过可重复任务推进时间）', next: 'END' },
};

// ── 节点十：出征（一个月后·自动触发）─────────────────────
const CHUZHENG_NODES: Record<string, StoryNode> = {
  ch3_chu_0: { type: 'narration', text: '（一个月转瞬即逝。这一个月里，你日夜苦修，将试剑会上与陆沉舟、纪无双交手的感悟一一消化。筑基七层的根基，愈发扎实。今日——便是出征之日。）', next: 'ch3_chu_cg' },
  ch3_chu_cg: { type: 'cg', bg: 'picture/scene/C3-guangchang.png', delay: 2500, next: 'ch3_chu_1' },
  ch3_chu_1: { type: 'narration', text: '（武当大殿前广场。晨光初透，山风猎猎。七组人马列队而立——七位长老，各自带领门下真传弟子。这是武当近百年来规模最大的一次下山行动。）', next: 'ch3_chu_2' },
  ch3_chu_2: { type: 'dialogue', speaker: '陈静虚', text: '……都到了。', portrait: 'picture/NPC/陈静虚.png', bg: 'picture/scene/C3-guangchang.png', next: 'ch3_chu_3' },
  ch3_chu_3: { type: 'narration', text: '（陈静虚门下——算上你，一共四人。柳清寒立于陈静虚身侧，素白道袍，长剑悬腰。她今天系了一根新的剑穗。淡青色的。）', next: 'ch3_chu_4' },
  ch3_chu_4: { type: 'dialogue', speaker: '张玄素', text: '诸位——今日下山，不为比武，不为扬名。是为——除魔卫道。黑月教在苍岭山、青石村一带的活动只是冰山一角。七位长老，各领一组，分头前往。查明情况，肃清邪教。', portrait: 'picture/NPC/张玄素.png', bg: 'picture/scene/C3-guangchang.png', next: 'ch3_chu_5' },
  ch3_chu_5: { type: 'dialogue', speaker: '张玄素', text: '另有一事——与官府交际时，要观察再三。黑月教的邪药，对有权势之人诱惑极大。不可轻信，也不可轻疑。分寸——你们自己把握。', portrait: 'picture/NPC/张玄素.png', bg: 'picture/scene/C3-guangchang.png', next: 'ch3_chu_6' },
  ch3_chu_6: { type: 'narration', text: '（七组人马依次下山。你与柳清寒并肩走在山道上。晨光从松枝间洒落，在他们脚下投下斑驳的光影。）', next: 'ch3_chu_7' },
  ch3_chu_7: { type: 'dialogue', speaker: '我', text: '师姐。新剑穗——很好看。', bg: 'picture/scene/C3-shanmen.png', next: 'ch3_chu_8' },
  ch3_chu_8: { type: 'dialogue', speaker: '柳清寒', text: '……旧的断了。随手换的。', portrait: 'picture/Female-main/柳清寒.png', bg: 'picture/scene/C3-shanmen.png', next: 'ch3_chu_end' },
  ch3_chu_end: { type: 'narration', text: '（你没有戳穿。但你记得——旧的剑穗是白色的。和这根淡青色的一模一样，从来没有断过。）\n\n随手换的……吗。师姐，你什么时候才能学会说谎。\n\n── 第三章·内门风云·完 ──', next: 'END' },
};

const STORY_NODES: Record<string, StoryNode> = {
  ...BREAKTHROUGH_NODES,
  ...GIFTSHU_NODES,
  ...BAISHI_NODES,
  ...SHOUJIAN_NODES,
  ...XIASHAN_NODES,
  ...FENGMANG_NODES,
  ...HUNYUE_NODES,
  ...DUOKUI_NODES,
  ...ZHENCHUAN_NODES,
  ...CHUZHENG_NODES,
};

export const CH3: ChapterData = {
  id: 3,
  title: '第三章 · 内门风云',
  startNode: 'ch3_break_0',
  storyNodes: STORY_NODES,
  campScenes: {
    0: {
      id: 'ch3_camp_0',
      title: '内门弟子小屋',
      bg: 'picture/scene/C3-neimen_xiaowu.png',
      npc: { name: '柳清寒', sub: '武当大师姐', img: 'picture/Female-main/柳清寒.png' },
      desc: '月光从窗格透入。体内的气息躁动不安——炼气十层的瓶颈摇摇欲坠。突破大境界，需要一个人护法。',
      actionLabel: '开始突破',
      actionEvent: 'ch3_breakthrough',
    },
    1: {
      id: 'ch3_camp_1',
      title: '外门弟子院',
      bg: 'picture/scene/C2-outer-court.png',
      npc: { name: '宋知远', sub: '外门师兄·炼气三层', img: 'picture/NPC/宋知远.png' },
      desc: '你已是筑基一层的内门弟子。宋知远还在外门苦熬——或许该把自己突破的心得分享给他。',
      actionLabel: '赠送突破心得',
      actionEvent: 'ch3_giftshu',
    },
    2: {
      id: 'ch3_camp_2',
      title: '传功崖·拜师',
      bg: 'picture/scene/C2-cliff.png',
      npc: { name: '陈静虚', sub: '传功长老·元婴五层', img: 'picture/NPC/陈静虚.png' },
      desc: '内门弟子需择一位长老为师。陈静虚门下弟子不多——他正在传功崖等你。',
      actionLabel: '拜陈静虚为师',
      actionEvent: 'ch3_baishi',
    },
    3: {
      id: 'ch3_camp_3',
      title: '传功崖·授剑',
      bg: 'picture/scene/C2-cliff.png',
      npc: { name: '陈静虚', sub: '传功长老·元婴五层', img: 'picture/NPC/陈静虚.png' },
      desc: '筑基三层，根基已稳。陈静虚将传授武当真传剑法——云开、松涛、归元。',
      actionLabel: '学习真传剑法',
      actionEvent: 'ch3_shoujian',
    },
    4: {
      id: 'ch3_camp_4',
      title: '武当山门·下山行侠',
      bg: 'picture/scene/C2-outer-court.png',
      npc: { name: '周伯安', sub: '外门管事', img: 'picture/NPC/周伯安.png' },
      desc: '筑基五层，可以带队下山了。青石村妖兽出没，外门弟子需要有人镇场子。',
      actionLabel: '带队下山除妖',
      actionEvent: 'ch3_xiashan',
    },
    5: {
      id: 'ch3_camp_5',
      title: '演武场·试剑会第一轮',
      bg: 'picture/scene/C2-arena.png',
      npc: { name: '陆沉舟', sub: '内门师兄·筑基八层', img: 'picture/NPC/陆沉舟.png' },
      desc: '筑基七层，内门试剑会开幕。抽签结果——第一轮，对阵陆沉舟。',
      actionLabel: '迎战陆沉舟',
      actionEvent: 'ch3_fengmang',
    },
    6: {
      id: 'ch3_camp_6',
      title: '内门小屋·深夜',
      bg: 'picture/scene/C3-neimen_xiaowu.png',
      npc: { name: '柳清寒', sub: '武当大师姐', img: 'picture/Female-main/柳清寒.png' },
      desc: '试剑会第一轮战胜陆沉舟。夜已深，有人敲门——是柳清寒。她有话要说。',
      actionLabel: '开门',
      actionEvent: 'ch3_hunyue',
    },
    7: {
      id: 'ch3_camp_7',
      title: '演武场·试剑会次日',
      bg: 'picture/scene/C2-arena.png',
      npc: { name: '纪无双', sub: '内门领袖·筑基七层', img: 'picture/NPC/纪无双.png' },
      desc: '昨日击败陆沉舟的消息传遍武当。今日连战三场——方仲和、苏云绣、纪无双。',
      actionLabel: '继续试剑会',
      actionEvent: 'ch3_duokui',
    },
    8: {
      id: 'ch3_camp_8',
      title: '真武大殿·晋升真传',
      bg: 'picture/scene/C1-wudang_hall.png',
      npc: { name: '张玄素', sub: '武当掌门·化神六层', img: 'picture/NPC/张玄素.png' },
      desc: '试剑会魁首。掌门召见——晋升真传弟子，了解黑月教的威胁。',
      actionLabel: '觐见掌门',
      actionEvent: 'ch3_zhenchuan',
    },
    9: {
      id: 'ch3_camp_9',
      title: '武当广场·出征',
      bg: 'picture/scene/C3-guangchang.png',
      npc: { name: '柳清寒', sub: '武当大师姐', img: 'picture/Female-main/柳清寒.png' },
      desc: '一个月后。七组人马集结，下山讨伐黑月教。柳清寒系了一根新的淡青色剑穗。\n\n第四章即将开启……',
      actionLabel: '随师下山出征',
      actionEvent: 'ch3_chuzheng',
    },
  },
  finalAct: 9,
};