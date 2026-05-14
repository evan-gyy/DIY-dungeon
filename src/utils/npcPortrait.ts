// ============================================================
//  src/utils/npcPortrait.ts — NPC 立绘图片路径解析器
// ============================================================
//  集中管理所有 NPC 的立绘图片映射：
//  - 固定 NPC（剧情角色/掌门/长老/官员）：直接映射 ID→文件
//  - 随机 NPC（gen_ 前缀）：基于 sect+gender 从随机池选取
//  - 生成器在 generateNpc() 时预计算 portraitIndex 存入 NpcStats
// ============================================================

import type { SectId } from '../data/types';

// ──── 固定 NPC 图片映射 ────

const FIXED_PORTRAIT_MAP: Record<string, string> = {
  // 女主
  'liu_qinghan':      'picture/Female-main/柳清寒.png',
  'shen_nishang':     'picture/Female-main/沈霓裳.png',
  'mo_jiangqing':     'picture/Female-main/墨绐青.png',
  'zhao_qinwei':      'picture/Female-main/趙沁微.png',

  // 武当派
  'zhang_xuansu':     'picture/NPC/武当派/张玄素.png',
  'chen_jingxu':      'picture/NPC/武当派/陈静虚.png',
  'zhou_boan':        'picture/NPC/武当派/周伯安.png',
  'song_zhiyuan':     'picture/NPC/武当派/宋知远.png',
  'gu_xiaosang':      'picture/NPC/武当派/顾小桑.png',
  'lu_chengzhou':     'picture/NPC/武当派/陆沉舟.png',
  'ji_wushuang_npc':  'picture/NPC/武当派/纪无双.png',
  'su_yunxiu_npc':    'picture/NPC/武当派/苏云绣.png',
  'fang_zhonghe_npc': 'picture/NPC/武当派/方仲和.png',
  'meng_wenyuan':     'picture/NPC/武当派/孟文渊.png',
  'ye_ziyi':          'picture/NPC/武当派/叶紫衣.png',

  // 少林派
  'shaolin_kongwen':  'picture/NPC/少林派/空闻方丈.png',
  'shaolin_kongjian': 'picture/NPC/少林派/空见首座.png',

  // 峨眉派
  'emei_miejue':     'picture/NPC/峨眉派/灭绝师太.png',
  'emei_jingxuan':   'picture/NPC/峨眉派/静玄师太.png',

  // 丐帮
  'beggar_hong':     'picture/NPC/丐帮/洪帮主.png',
  'beggar_lu':       'picture/NPC/丐帮/鲁有脚.png',

  // 华山派
  'huashan_master':  'picture/NPC/华山派/岳掌门.png',
  'huashan_feng':    'picture/NPC/华山派/封不平.png',

  // 黑月教
  'demon_master':    'picture/NPC/黑月教/教主.png',
  'demon_yang':      'picture/NPC/黑月教/杨左使.png',

  // 茅山派
  'maoshan_zhangmen': 'picture/NPC/茅山派/陶天师.png',
  'maoshan_elder':    'picture/NPC/茅山派/葛玄清.png',

  // 昆仑派
  'kunlun_zhangmen': 'picture/NPC/昆仑派/何太虚.png',
  'kunlun_elder':    'picture/NPC/昆仑派/寒松子.png',

  // 青城派
  'qingcheng_zhangmen': 'picture/NPC/青城派/余掌门.png',
  'qingcheng_elder':    'picture/NPC/青城派/常鹤鸣.png',

  // 唐门
  'tangmen_zhangmen': 'picture/NPC/唐门/唐老太太.png',
  'tangmen_elder':    'picture/NPC/唐门/唐无影.png',

  // 逍遥派
  'xiaoyao_zhangmen': 'picture/NPC/逍遥派/逍遥子.png',
  'xiaoyao_elder':    'picture/NPC/逍遥派/苏星河.png',

  // 全真教
  'quanzhen_zhangmen':  'picture/NPC/全真派/陈道玄.png',
  'quanzhen_elder':     'picture/NPC/全真派/李清元.png',
  'quanzhen_qiuchuji':  'picture/NPC/全真派/周抱朴.png',

  // 崆峒派
  'kongtong_zhangmen': 'picture/NPC/崆峒派/铁昆仑.png',
  'kongtong_elder':    'picture/NPC/崆峒派/霍震岳.png',

  // 点苍派
  'diancang_zhangmen': 'picture/NPC/点苍派/杨天纵.png',
  'diancang_elder':    'picture/NPC/点苍派/谢云帆.png',

  // 朝廷文官
  'kaifeng_fuyin':      'picture/NPC/官府/包拯.png',
  'luoyang_zhifu':      'picture/NPC/官府/赵汝成.png',
  'changan_zhifu':      'picture/NPC/官府/韩维庸.png',
  'xiangyang_zhifu':    'picture/NPC/官府/郭铁山.png',
  'jiangling_zhifu':    'picture/NPC/官府/刘守安.png',
  'chengdu_zhifu':      'picture/NPC/官府/王仲良.png',
  'yangzhou_zhizhou':   'picture/NPC/官府/杜文清.png',
  'suzhou_zhizhou':     'picture/NPC/官府/白修文.png',
  'hangzhou_zhifu':     'picture/NPC/官府/林观潮.png',
  'dali_guoxiang':      'picture/NPC/官府/高檀让.png',
  'jiangzhou_zhizhou':  'picture/NPC/官府/司马秋客.png',
  'tanzhou_zhifu':      'picture/NPC/官府/周必正.png',
  'guangzhou_shibosi':  'picture/NPC/官府/陈望海.png',
};

// ──── 随机宗门弟子立绘池 ────
//
// 文件命名规范：picture/NPC/sect/{sectId}_{gender}_{n}.png
// 每个宗门每种性别需要 3 张变体（少林仅男弟子 3 张）
// 总计：(14 × 3 男) + (13 × 3 女) = 42 + 39 = 81 张

/** 每个宗门每种性别的图片数量 */
const POOL_SIZE_PER_GENDER = 3;

/**
 * 获取某个宗门性别的随机立绘池文件列表
 */
function getSectPoolFiles(sect: SectId, gender: 'male' | 'female'): string[] {
  const files: string[] = [];
  for (let i = 1; i <= POOL_SIZE_PER_GENDER; i++) {
    files.push(`picture/NPC/sect/${sect}_${gender}_${i}.png`);
  }
  return files;
}

/**
 * 基于 NPC ID 的 hash 值，确定性选取立绘池中的索引
 * 同一 NPC 每次查询返回同一张图（因为 NpcStats.portraitIndex 已预存）
 */
function resolvePoolIndex(npcId: string, poolSize: number): number {
  let hash = 0;
  for (let i = 0; i < npcId.length; i++) {
    hash = ((hash << 5) - hash) + npcId.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % poolSize;
}

// ──── 对外 API ────

/**
 * 获取 NPC 的立绘图片路径。
 * 
 * @param npcId   - NPC 唯一 ID（gen_ 前缀为随机生成）
 * @param sect    - NPC 所属宗门
 * @param gender  - 性别（'male' | 'female'）
 * @param portraitIndex - 预存立绘池索引（随机 NPC 在生成时预计算，避免每次 re-render 换图）
 * @returns 图片路径；无匹配时返回空字符串，UI 侧应显示 fallback
 */
export function getNpcPortrait(
  npcId: string,
  sect?: SectId,
  gender?: 'male' | 'female',
  portraitIndex?: number,
): string {
  // 1. 固定 NPC：直接查表
  if (npcId in FIXED_PORTRAIT_MAP) {
    return FIXED_PORTRAIT_MAP[npcId]!;
  }

  // 2. 随机 NPC（gen_ 前缀）：从宗门立绘池选取
  if (npcId.startsWith('gen_') && sect && gender) {
    const pool = getSectPoolFiles(sect, gender);
    if (pool.length === 0) return '';

    // 使用预存的 portraitIndex，若无则基于 id hash
    const idx = portraitIndex ?? resolvePoolIndex(npcId, pool.length);
    return pool[idx % pool.length]!;
  }

  // 3. 无匹配
  return '';
}

/**
 * 获取 NPC 立绘地图（批量查询用）。
 * 供 Camp.ts renderNearbyNpcs 等场景使用。
 */
export function getNpcImageMap(npcIds: string[], npcDatabase?: Record<string, { sect: SectId; gender?: string; portraitIndex?: number }>): Record<string, string> {
  const map: Record<string, string> = {};
  for (const id of npcIds) {
    const npc = npcDatabase?.[id];
    map[id] = getNpcPortrait(
      id,
      npc?.sect,
      npc?.gender as 'male' | 'female' | undefined,
      npc?.portraitIndex,
    );
  }
  return map;
}

/**
 * 为随机生成的 NPC 预计算立绘池索引。
 * 应在 generateNpc() 中调用，将结果存入 NpcStats.portraitIndex。
 */
export function assignRandomPortraitIndex(npcId: string, poolSize: number = POOL_SIZE_PER_GENDER): number {
  return resolvePoolIndex(npcId, poolSize);
}

/**
 * 获取「所有需要生成的图片文件」清单。
 * 用于指导 AI 图片生成工作。
 */
export interface PortraitGenerationTask {
  fileName: string;
  category: 'fixed_npc' | 'sect_disciple';
  sect?: SectId;
  gender?: 'male' | 'female';
  description: string;
}

export function getAllRequiredPortraits(): PortraitGenerationTask[] {
  const tasks: PortraitGenerationTask[] = [];

  // 固定 NPC（尚未生成的部分由用户判断）
  for (const [id, path] of Object.entries(FIXED_PORTRAIT_MAP)) {
    const name = path.split('/').pop()?.replace('.png', '') ?? id;
    tasks.push({
      fileName: path,
      category: 'fixed_npc',
      description: `固定 NPC：${name}`,
    });
  }

  // 宗门随机弟子池
  const allSects: SectId[] = [
    'wudang', 'shaolin', 'emei', 'beggar', 'huashan', 'demon',
    'maoshan', 'kunlun', 'qingcheng', 'tangmen', 'xiaoyao',
    'quanzhen', 'kongtong', 'diancang',
  ];

  const sectNames: Record<SectId, string> = {
    wudang: '武当', shaolin: '少林', emei: '峨眉', beggar: '丐帮',
    huashan: '华山', demon: '黑月教', maoshan: '茅山', kunlun: '昆仑',
    qingcheng: '青城', tangmen: '唐门', xiaoyao: '逍遥',
    quanzhen: '全真', kongtong: '崆峒', diancang: '点苍',
    riyue: '日月教', tiezhang: '铁掌帮', wudu: '五毒教', xuedao: '血刀门', haisha: '海沙派',
    none: '散修',
  };

  for (const sect of allSects) {
    // 男弟子
    for (let i = 1; i <= POOL_SIZE_PER_GENDER; i++) {
      tasks.push({
        fileName: `picture/NPC/sect/${sect}_male_${i}.png`,
        category: 'sect_disciple',
        sect,
        gender: 'male',
        description: `${sectNames[sect]} 随机男弟子 #${i}`,
      });
    }
    // 女弟子（少林无女弟子）
    if (sect !== 'shaolin') {
      for (let i = 1; i <= POOL_SIZE_PER_GENDER; i++) {
        tasks.push({
          fileName: `picture/NPC/sect/${sect}_female_${i}.png`,
          category: 'sect_disciple',
          sect,
          gender: 'female',
          description: `${sectNames[sect]} 随机女弟子 #${i}`,
        });
      }
    }
  }

  return tasks;
}
