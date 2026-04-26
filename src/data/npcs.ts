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

  zhang_xuansu: {
    name: '张玄素',
    img: 'picture/NPC/武当派-张三丰.png',
    sect: '武当掌门·化神六层',
    dialogs: {
      start: {
        text: '武当收徒，不问来处，只看去处。你既来了，便是武当的人。',
        choices: [
          { text: '多谢掌门收留。', next: 'welcome' },
          { text: '掌门……认识墨绐青？', next: 'ask_mo' },
          { text: '告辞。', next: null },
        ],
      },
      welcome: {
        text: '莫要言谢。路，是你自己走的。武当只是给你一片可以落脚的山。至于能走到哪一步——看你自己的造化。',
        choices: [{ text: '晚辈定不负掌门期望。', next: null }],
      },
      ask_mo: {
        text: '……（沉默良久）她可好？',
        choices: [
          { text: '我不知道。我走时，她让我不要回头。', next: 'mo_sigh' },
          { text: '告辞。', next: null },
        ],
      },
      mo_sigh: {
        text: '（轻轻点头，仿佛在确认某件事）她还是老样子。……去吧。先跟陈长老学好根基。',
        choices: [{ text: '是。', next: null }],
      },
    },
  },

  chen_jingxu: {
    name: '陈静虚',
    img: 'picture/NPC/武当派-张三丰.png',
    sect: '传功长老·元婴五层',
    dialogs: {
      start: {
        text: '根骨平平，心思倒细。练得出来。——这是我三天观察下来的结论。',
        choices: [
          { text: '长老，我何时可以学剑法？', next: 'ask_sword' },
          { text: '请长老赐教根基功法。', next: 'teach_base' },
          { text: '告辞。', next: null },
        ],
      },
      ask_sword: {
        text: '剑？先把拳打好。一拳打出，枯叶不飘，方可言剑。',
        choices: [{ text: '晚辈受教。', next: null }],
      },
      teach_base: {
        text: '武当武学，根基在"松沉"二字。肩松则力沉，腰松则步稳，心松则意达。记住——欲速则不达。',
        choices: [{ text: '多谢长老教诲。', next: null }],
      },
      progress: {
        text: '……嗯。长进了。继续练。',
        choices: [{ text: '是。', next: null }],
      },
    },
  },

  zhou_boan: {
    name: '周伯安',
    img: 'picture/NPC/武当派-张三丰.png',
    sect: '外门管事·结丹三层',
    dialogs: {
      start: {
        text: '哈哈，新来的！不急不急，慢慢来。外门弟子嘛，先从日常杂务做起——砍柴、挑水、打扫大殿、抄写道经，都是修行。',
        choices: [
          { text: '有什么任务需要我做？', next: 'daily_tasks' },
          { text: '什么时候能参加小比？', next: 'ask_sparring' },
          { text: '告辞。', next: null },
        ],
      },
      daily_tasks: {
        text: '砍柴去林子，挑水去东泉，扫殿在主殿，抄经在藏经阁。每日各选一件，做完来我这儿报到，有经验和铜钱拿。',
        choices: [{ text: '明白了，我去做。', next: null }],
      },
      ask_sparring: {
        text: '炼气六层以上就可以报名。到时候演武场见！败者……回去多挑几桶水就是了。哈哈哈！',
        choices: [{ text: '好，我会努力的。', next: null }],
      },
    },
  },

  song_zhiyuan: {
    name: '宋知远',
    img: 'picture/NPC/武当派-张三丰.png',
    sect: '外门师兄·炼气三层',
    dialogs: {
      start: {
        text: '嘿！隔壁的！今天差事做完了吗？我跟你说，陈长老今天又在传功崖画图讲课——我偷偷看了一眼，半个字没听懂。',
        choices: [
          { text: '你就这么混日子？', next: 'lazy' },
          { text: '一起去练练？', next: 'train' },
          { text: '改天吧。', next: null },
        ],
      },
      lazy: {
        text: '什么叫混日子！我这是……在蓄势！厚积薄发！古语有云嘛……对了古语具体怎么说我忘了，反正意思就是这样。',
        choices: [{ text: '……好吧，随你。', next: null }],
      },
      train: {
        text: '行啊！不过说好了，你别太猛——我刚被顾小桑揍了，手腕还有点酸。',
        choices: [{ text: '……就这样的还想进内门？', next: null }],
      },
    },
  },

  gu_xiaosang: {
    name: '顾小桑',
    img: 'picture/NPC/武当派-张三丰.png',
    sect: '外门师姐·炼气五层',
    dialogs: {
      start: {
        text: '哟，新来的，练得挺勤嘛。陈长老亲自教你，你面子不小。我当年入门，长老只丢给我一本破册子，说"自己看"就走了。',
        choices: [
          { text: '师姐功法练得怎样了？', next: 'ask_progress' },
          { text: '你了解柳师姐吗？', next: 'ask_liu' },
          { text: '没事，随便问问。', next: null },
        ],
      },
      ask_progress: {
        text: '我现在炼气五层，争取小比之前到八层！话说你现在几层了？要超过我的话，给我提前打招呼，我好有个心理准备。',
        choices: [{ text: '好，到时候一定告诉你。', next: null }],
      },
      ask_liu: {
        text: '柳师姐啊……武当第一美人，武当第一剑，武当第一让人摸不透。她对大多数人都是那副样子——冷冷的，但其实心思细得很。你是大师姐带上山的，她自然会不一样。',
        choices: [{ text: '……是吗。', next: null }],
      },
    },
  },

  lu_chengzhou: {
    name: '陆沉舟',
    img: 'picture/NPC/武当派-张三丰.png',
    sect: '内门师兄·筑基八层',
    dialogs: {
      start: {
        text: '你就是大师姐带上山的那个人。',
        choices: [
          { text: '是。有何指教？', next: 'question' },
          { text: '……对。', next: 'silent' },
        ],
      },
      question: {
        text: '指教不敢。我只是想看看——大师姐的眼光，究竟落在了什么样的人身上。',
        choices: [
          { text: '那就请师兄拭目以待。', next: 'challenge' },
          { text: '我只是个外门弟子。', next: 'humble' },
        ],
      },
      silent: {
        text: '……（沉默地上下打量了一眼，然后点头）能在外门小比里打赢赵大石，算有点东西。',
        choices: [{ text: '承让。', next: null }],
      },
      challenge: {
        text: '好。外门试炼考——我在演武场等你。通过之后，来找我。',
        choices: [{ text: '一言为定。', next: null }],
      },
      humble: {
        text: '外门弟子，也可以成为值得对视的人。记住这句话。',
        choices: [{ text: '……谢师兄。', next: null }],
      },
    },
  },

  shen_nishang: {
    name: '沈霓裳',
    img: 'picture/Female-main/柳清寒.png',
    sect: '茅山派·雷法传人',
    dialogs: {
      start: {
        text: '武当的人？一个炼气八层，带着另一个炼气八层，跑来打筑基期的土匪？你们武当的人，都这么不要命吗？',
        choices: [
          { text: '多亏你出手相救。', next: 'thanks' },
          { text: '我们本来能撑住的。', next: 'stubborn' },
        ],
      },
      thanks: {
        text: '救？我是路过。正好茅山派管这种邪药害人的事。——不过你身上有点意思。那一瞬间的共鸣……不像是炼气期该有的。',
        choices: [
          { text: '我也不知道那是什么。', next: 'mystery' },
          { text: '也许是巧合。', next: 'deny' },
        ],
      },
      stubborn: {
        text: '（微微一笑）有骨气。但骨气不能挡刀。下次记得量力而行——当然，如果你真的想死，那是你的事。',
        choices: [{ text: '……谢谢你的雷。', next: 'thanks' }],
      },
      mystery: {
        text: '不知道……也许你自己迟早会知道。有意思。我叫沈霓裳，茅山派。记住了——下次见面，我想看看你的真本事。',
        choices: [{ text: '后会有期，沈姑娘。', next: null }],
      },
      deny: {
        text: '巧合……（若有所思地盯着你看了三秒）也许。也许不是。总之——后会有期，武当的。别死太早了。',
        choices: [{ text: '多谢提醒。', next: null }],
      },
    },
  },
};
