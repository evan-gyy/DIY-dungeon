import type { NpcId, NpcDialogData } from './types';

export const NPC_DIALOGS: Record<NpcId, NpcDialogData> = {
  wudang_zhangsan: {
    name: '张三丰',
    img: 'picture/NPC/武当派-张三丰.png',
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
        choices: [{ text: '告辞，我继续闯关！', next: null }],
      },
      mission_complete: {
        text: '少侠！好！好！好！<br><br>你连破三关，将魔教探子尽数驱逐，武当上下无不佩服！<br><br>这枚<span style="color:#e8c87a">武学残卷（太极拳）</span>乃老道毕生心血所悟，今日便赠予你。<br>望你善加修习，日后必成大器！',
        choices: [{ text: '多谢前辈厚赐！', next: null, effect: 'claimReward' }],
      },
    },
  },

  emei_miejue: {
    name: '灭绝师太',
    img: 'picture/NPC/峨眉派-灭绝师太.png',
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
        choices: [{ text: '多有打扰，告辞。', next: null }],
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

  shaolin_kongwen: {
    name: '方丈空闻',
    img: 'picture/NPC/少林派-方丈空闻.png',
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

  beggar_hong: {
    name: '洪七公',
    img: 'picture/NPC/丐帮-洪七公.png',
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

  huashan_master: {
    name: '华山掌门',
    img: 'picture/NPC/华山派-掌门.png',
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

  demon_master: {
    name: '魔教教主',
    img: 'picture/NPC/魔教-教主.png',
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
        choices: [{ text: '……晚辈告辞。', next: null }],
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

  mo_jiangqing: {
    name: '墨绐青',
    img: 'picture/Female-main/墨绐青.png',
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
    img: 'picture/Female-main/柳清寒.png',
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
