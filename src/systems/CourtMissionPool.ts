// ============================================================
//  src/systems/CourtMissionPool.ts — 文武晋升路线任务池
// ============================================================
//  为朝堂系统提供文官/武官专属任务，通过完成任务获得
//  影响力（influence）推动朝廷品阶晋升。
//
//  文武分途：
//  - 文官（wen）：外交、调查、传功、学识类任务
//  - 武官（wu）：战斗、护送、守卫、征讨类任务
//  - 部分通用任务（双方均可接取）
// ============================================================

import type { MissionDef } from '../data/sandboxTypes';
import type { LocationId } from '../data/worldMap';

// ================================================================
//  文官任务池（wen path）
// ================================================================

const WEN_MISSIONS: MissionDef[] = [
  // ── 基础：秀才/校尉级别 ──
  {
    id: 'court_wen_study',
    title: '研习经史',
    type: 'teach',
    difficulty: 'easy',
    description: '在长安国子监研读汉书，与国子生讨论治国之道。学问需日积月累。',
    issuer: 'wudang',
    requireCourtRank: 'commoner',
    courtPath: 'wen',
    targetLocation: 'changan_city' as LocationId,
    progressMax: 3,
    rewardContribution: 10,
    rewardExp: 30,
    rewardGold: 8,
    rewardInfluence: 40,
    dailyRepeatable: true,
  },
  {
    id: 'court_wen_draft',
    title: '代拟公文',
    type: 'teach',
    difficulty: 'easy',
    description: '京兆府丞公务繁忙，请秀才代为起草三份通判文书。笔墨功夫不可废。',
    issuer: 'wudang',
    requireCourtRank: 'commoner',
    courtPath: 'wen',
    targetLocation: 'changan_city' as LocationId,
    progressMax: 3,
    rewardContribution: 10,
    rewardExp: 25,
    rewardGold: 10,
    rewardInfluence: 35,
    dailyRepeatable: true,
  },
  {
    id: 'court_wen_census',
    title: '编户齐民',
    type: 'investigate',
    difficulty: 'normal',
    description: '协助洛阳府衙核查户籍册，统计百姓人口与田产。亲民之政从此始。',
    issuer: 'wudang',
    requireCourtRank: 'xiucai',
    courtPath: 'wen',
    targetLocation: 'luoyang_city' as LocationId,
    progressMax: 3,
    rewardContribution: 15,
    rewardExp: 40,
    rewardGold: 15,
    rewardInfluence: 60,
  },
  {
    id: 'court_wen_lecture',
    title: '书院讲学',
    type: 'teach',
    difficulty: 'easy',
    description: '应开封府嵩阳书院之邀，为诸生讲授五经之一章。以文会友，以友辅仁。',
    issuer: 'wudang',
    requireCourtRank: 'xiucai',
    courtPath: 'wen',
    targetLocation: 'kaifeng_city' as LocationId,
    progressMax: 2,
    rewardContribution: 15,
    rewardExp: 45,
    rewardGold: 12,
    rewardInfluence: 55,
    dailyRepeatable: true,
  },

  // ── 进阶：举人/进士级别 ──
  {
    id: 'court_wen_mediate_tax',
    title: '调解田赋纠纷',
    type: 'diplomacy',
    difficulty: 'normal',
    description: '襄阳府两姓因田产赋税争执不下，闹至府衙。举人出面斡旋，以理服人。',
    issuer: 'wudang',
    requireCourtRank: 'juren',
    courtPath: 'wen',
    targetLocation: 'xiangyang_city' as LocationId,
    progressMax: 1,
    rewardContribution: 20,
    rewardExp: 60,
    rewardGold: 25,
    rewardInfluence: 80,
  },
  {
    id: 'court_wen_policy_memo',
    title: '上书朝政策论',
    type: 'special',
    difficulty: 'hard',
    description: '撰写一篇关于漕运改良的策论，上书三司使。事关国计民生，不可草率。',
    issuer: 'wudang',
    requireCourtRank: 'juren',
    courtPath: 'wen',
    targetLocation: 'changan_city' as LocationId,
    progressMax: 5,
    rewardContribution: 25,
    rewardExp: 80,
    rewardGold: 30,
    rewardInfluence: 120,
  },
  {
    id: 'court_wen_flood_relief',
    title: '赈灾治水',
    type: 'investigate',
    difficulty: 'hard',
    description: '扬州运河决堤，数千灾民流离。进士奉旨前往勘查灾情、统筹赈济。',
    issuer: 'wudang',
    requireCourtRank: 'jinshi',
    courtPath: 'wen',
    targetLocation: 'yangzhou_city' as LocationId,
    progressMax: 4,
    rewardContribution: 30,
    rewardExp: 120,
    rewardGold: 40,
    rewardInfluence: 180,
  },
  {
    id: 'court_wen_imperial_exam',
    title: '主持乡试',
    type: 'teach',
    difficulty: 'normal',
    description: '以进士身份受命为河南府乡试副考官，为国选才，公正无私。',
    issuer: 'wudang',
    requireCourtRank: 'jinshi',
    courtPath: 'wen',
    targetLocation: 'luoyang_city' as LocationId,
    progressMax: 3,
    rewardContribution: 25,
    rewardExp: 90,
    rewardGold: 35,
    rewardInfluence: 150,
  },

  // ── 高级：翰林/尚书级别 ──
  {
    id: 'court_wen_rite_reform',
    title: '修订礼乐典章',
    type: 'special',
    difficulty: 'hard',
    description: '翰林院奉旨修订大宋礼制，需查阅古籍、考据典章。关乎国体大礼。',
    issuer: 'wudang',
    requireCourtRank: 'hanlin',
    courtPath: 'wen',
    targetLocation: 'changan_city' as LocationId,
    progressMax: 5,
    rewardContribution: 35,
    rewardExp: 160,
    rewardGold: 50,
    rewardInfluence: 250,
  },
  {
    id: 'court_wen_audit_court',
    title: '督办三司审计',
    type: 'investigate',
    difficulty: 'legendary',
    description: '尚书大人奉旨核查三司账目，追查贪墨。需不动声色，密查暗访。',
    issuer: 'wudang',
    requireCourtRank: 'shangshu',
    courtPath: 'wen',
    targetLocation: 'kaifeng_city' as LocationId,
    progressMax: 5,
    rewardContribution: 50,
    rewardExp: 250,
    rewardGold: 80,
    rewardInfluence: 400,
  },
];

// ================================================================
//  武官任务池（wu path）
// ================================================================

const WU_MISSIONS: MissionDef[] = [
  // ── 基础：平民/校尉级别 ──
  {
    id: 'court_wu_guard_gate',
    title: '值守城门',
    type: 'escort',
    difficulty: 'easy',
    description: '长安城门校尉缺人，新募军士需在城门值守三日，盘查可疑行人。',
    issuer: 'wudang',
    requireCourtRank: 'commoner',
    courtPath: 'wu',
    targetLocation: 'changan_city' as LocationId,
    progressMax: 3,
    rewardContribution: 10,
    rewardExp: 35,
    rewardGold: 10,
    rewardInfluence: 40,
    dailyRepeatable: true,
  },
  {
    id: 'court_wu_patrol',
    title: '巡逻京畿',
    type: 'escort',
    difficulty: 'easy',
    description: '随都尉在长安城外京畿道巡逻，严防盗贼流寇骚扰百姓。',
    issuer: 'wudang',
    requireCourtRank: 'commoner',
    courtPath: 'wu',
    targetLocation: 'changan_city' as LocationId,
    progressMax: 3,
    rewardContribution: 10,
    rewardExp: 30,
    rewardGold: 8,
    rewardInfluence: 35,
    dailyRepeatable: true,
  },
  {
    id: 'court_wu_train_recruits',
    title: '操练新兵',
    type: 'teach',
    difficulty: 'normal',
    description: '校尉奉令操练新征募的府兵，需教习基础枪法与阵法。兵贵精不贵多。',
    issuer: 'wudang',
    requireCourtRank: 'xiucai',
    courtPath: 'wu',
    targetLocation: 'luoyang_city' as LocationId,
    progressMax: 3,
    rewardContribution: 15,
    rewardExp: 50,
    rewardGold: 12,
    rewardInfluence: 60,
  },
  {
    id: 'court_wu_hunt_bandit',
    title: '追剿山贼',
    type: 'combat',
    difficulty: 'normal',
    description: '襄阳城外三十里山中有盗匪盘踞，都尉率小队入山剿灭匪首。',
    issuer: 'wudang',
    requireCourtRank: 'xiucai',
    courtPath: 'wu',
    targetLocation: 'xiangyang_city' as LocationId,
    progressMax: 3,
    rewardContribution: 20,
    rewardExp: 60,
    rewardGold: 20,
    rewardInfluence: 70,
  },

  // ── 进阶：都尉/将军级别 ──
  {
    id: 'court_wu_escort_grain',
    title: '护送军粮',
    type: 'escort',
    difficulty: 'normal',
    description: '护送三千里漕运军粮从扬州至洛阳，途中水匪山贼环伺，不可大意。',
    issuer: 'wudang',
    requireCourtRank: 'juren',
    courtPath: 'wu',
    targetLocation: 'luoyang_city' as LocationId,
    progressMax: 3,
    rewardContribution: 25,
    rewardExp: 80,
    rewardGold: 30,
    rewardInfluence: 100,
  },
  {
    id: 'court_wu_fortify_city',
    title: '加固城防',
    type: 'escort',
    difficulty: 'hard',
    description: '将军受命巡视襄阳边防，督造箭楼十二座，加固汉水沿岸防御工事。',
    issuer: 'wudang',
    requireCourtRank: 'juren',
    courtPath: 'wu',
    targetLocation: 'xiangyang_city' as LocationId,
    progressMax: 4,
    rewardContribution: 30,
    rewardExp: 100,
    rewardGold: 35,
    rewardInfluence: 140,
  },
  {
    id: 'court_wu_suppress_revolt',
    title: '平定叛乱',
    type: 'combat',
    difficulty: 'hard',
    description: '大理边境蛮族作乱，将军率三千劲卒远征平叛，建功立业就在今朝。',
    issuer: 'wudang',
    requireCourtRank: 'jinshi',
    courtPath: 'wu',
    targetLocation: 'dali_city' as LocationId,
    progressMax: 4,
    rewardContribution: 40,
    rewardExp: 180,
    rewardGold: 60,
    rewardInfluence: 220,
  },
  {
    id: 'court_wu_border_scout',
    title: '侦察西夏边境',
    type: 'investigate',
    difficulty: 'hard',
    description: '大将军令将军率精骑潜入关外，侦查西夏军情。生死一线，将星闪耀。',
    issuer: 'wudang',
    requireCourtRank: 'jinshi',
    courtPath: 'wu',
    targetLocation: 'changan_city' as LocationId,
    progressMax: 3,
    rewardContribution: 35,
    rewardExp: 150,
    rewardGold: 50,
    rewardInfluence: 200,
  },

  // ── 高级：大将军/太尉级别 ──
  {
    id: 'court_wu_northern_campaign',
    title: '北伐筹备',
    type: 'special',
    difficulty: 'legendary',
    description: '大将军奉旨筹办北伐大业：调兵遣将、督造军械、统筹粮草。国之大事在祀与戎。',
    issuer: 'wudang',
    requireCourtRank: 'hanlin',
    courtPath: 'wu',
    targetLocation: 'changan_city' as LocationId,
    progressMax: 5,
    rewardContribution: 50,
    rewardExp: 250,
    rewardGold: 80,
    rewardInfluence: 350,
  },
  {
    id: 'court_wu_grand_review',
    title: '大阅兵',
    type: 'special',
    difficulty: 'legendary',
    description: '太尉在长安城外主持三年一度的大阅兵，十万雄兵列阵，天子亲临观礼。',
    issuer: 'wudang',
    requireCourtRank: 'shangshu',
    courtPath: 'wu',
    targetLocation: 'changan_city' as LocationId,
    progressMax: 5,
    rewardContribution: 60,
    rewardExp: 300,
    rewardGold: 100,
    rewardInfluence: 500,
  },
];

// ================================================================
//  通用朝堂任务（文武皆可）
// ================================================================

const NEUTRAL_COURT_MISSIONS: MissionDef[] = [
  {
    id: 'court_capital_report',
    title: '京中述职',
    type: 'diplomacy',
    difficulty: 'normal',
    description: '前往长安向有司汇报近期政务/军务，面见上官，维系朝中人脉。',
    issuer: 'wudang',
    requireCourtRank: 'xiucai',
    targetLocation: 'changan_city' as LocationId,
    progressMax: 1,
    rewardContribution: 20,
    rewardExp: 40,
    rewardGold: 15,
    rewardInfluence: 50,
  },
  {
    id: 'court_banquet',
    title: '赴琼林宴',
    type: 'diplomacy',
    difficulty: 'easy',
    description: '长安琼林苑设宴款待天下才俊，往来皆鸿儒，谈笑有勋贵。',
    issuer: 'wudang',
    requireCourtRank: 'juren',
    targetLocation: 'changan_city' as LocationId,
    progressMax: 1,
    rewardContribution: 15,
    rewardExp: 35,
    rewardGold: 5,
    rewardInfluence: 45,
    dailyRepeatable: true,
  },
  {
    id: 'court_morning_assembly',
    title: '上早朝',
    type: 'special',
    difficulty: 'normal',
    description: '五更天即起，赴含元殿参加早朝。百官奏对，天子垂询，一言可定乾坤。',
    issuer: 'wudang',
    requireCourtRank: 'jinshi',
    targetLocation: 'changan_city' as LocationId,
    progressMax: 1,
    rewardContribution: 30,
    rewardExp: 60,
    rewardGold: 0,
    rewardInfluence: 100,
    dailyRepeatable: true,
  },
  {
    id: 'court_censor_report',
    title: '弹劾权奸',
    type: 'special',
    difficulty: 'hard',
    description: '有证据表明朝中某尚书贪赃枉法。是否上表弹劾？成败关系前程。',
    issuer: 'wudang',
    requireCourtRank: 'hanlin',
    targetLocation: 'changan_city' as LocationId,
    progressMax: 3,
    rewardContribution: 40,
    rewardExp: 150,
    rewardGold: 30,
    rewardInfluence: 250,
  },
];

// ================================================================
//  导出
// ================================================================

/** 文官专属任务池 */
export const WEN_MISSION_POOL: MissionDef[] = WEN_MISSIONS;

/** 武官专属任务池 */
export const WU_MISSION_POOL: MissionDef[] = WU_MISSIONS;

/** 通用朝堂任务池 */
export const NEUTRAL_COURT_MISSION_POOL: MissionDef[] = NEUTRAL_COURT_MISSIONS;

/** 全部朝廷任务池（文+武+通用） */
export const ALL_COURT_MISSIONS: MissionDef[] = [
  ...WEN_MISSIONS,
  ...WU_MISSIONS,
  ...NEUTRAL_COURT_MISSIONS,
];

/**
 * 根据玩家朝廷身份获取可接取的朝廷任务。
 * @param courtPath 玩家选择的朝廷路径（null=未选择）
 * @param courtRank 当前朝廷品阶
 */
export function getAvailableCourtMissions(
  courtPath: string | null,
  courtRank: string,
): MissionDef[] {
  const rankIdx = [
    'commoner', 'xiucai', 'juren', 'jinshi', 'hanlin', 'shangshu', 'zaixiang',
  ].indexOf(courtRank);

  return ALL_COURT_MISSIONS.filter(def => {
    // 路径匹配（通用任务双方均可）
    if (def.courtPath && def.courtPath !== courtPath) return false;

    // 品阶检查
    if (def.requireCourtRank) {
      const reqIdx = [
        'commoner', 'xiucai', 'juren', 'jinshi', 'hanlin', 'shangshu', 'zaixiang',
      ].indexOf(def.requireCourtRank);
      if (rankIdx < reqIdx) return false;
    }

    return true;
  });
}

/**
 * 获取全部朝廷任务（用于合并到主任务池）
 */
export function getCourtMissionPool(): MissionDef[] {
  return ALL_COURT_MISSIONS;
}
