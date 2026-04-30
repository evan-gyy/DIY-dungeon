// ============================================================
//  src/data/worldMap.ts — 世界地图节点配置
// ============================================================
//
// 基于宋朝真实地理的简化地图：
//   武当山（今湖北十堰）为中心
//   襄阳城（西北，京西南路军事重镇）
//   江陵城（东南，荆湖北路治所·荆州）
//   汉水连接三地，形成三角格局
//
// 只保留门派/大城市级别地点，内部区域（如武当内门、传功崖等）
// 通过对话和剧情触发，不在地图上展示。

// ──── 地点节点定义 ────

export type LocationId = 
  // ── 武当派区域 ──
  | 'wudang_mountain'    // 武当山
  // ── 主要城市 ──
  | 'xiangyang_city'     // 襄阳城（京西南路·军事重镇）
  | 'jiangling_city'     // 江陵城（荆湖北路治所·荆州府）
  // ── 周边地点 ──
  | 'longyin_village'    // 龙隐村（主角故乡）
  | 'han_river'          // 汉水渡口（连接襄阳与武当）
  | 'cangling_mountain'  // 苍岭山（野外区域）
  | 'blackmoon_ruins'    // 黑月教遗址（苍岭山深处）
  // ── 其他门派 ──
  | 'shaolin_temple'     // 少林寺（河南·京西北路）
  | 'emei_mountain'      // 峨眉山（四川·成都府路）
  | 'beggar_hq';         // 丐帮总舵（襄阳城外）

export interface MapLocation {
  id: LocationId;
  name: string;
  description: string;
  backgroundImg: string;
  region: 'wudang' | 'jinghu' | 'jingxi' | 'other';
  dangerLevel: number;
  connections: LocationId[];
  unlockChapter?: number;
}

// ──── 世界地图数据 ────

export const WORLD_MAP: Record<LocationId, MapLocation> = {
  // ── 武当山（核心·京西南路均州）──
  wudang_mountain: {
    id: 'wudang_mountain',
    name: '武当山',
    description: '道教圣地，七十二峰朝大顶。武当派山门所在，云雾缭绕，仙气飘渺。',
    backgroundImg: 'picture/scene/C1-wudang_mountain.png',
    region: 'wudang',
    dangerLevel: 2,
    connections: ['han_river', 'cangling_mountain', 'longyin_village'],
  },
  
  // ── 汉水渡口 ──
  han_river: {
    id: 'han_river',
    name: '汉水渡口',
    description: '汉水之滨，舟楫往来。从武当山北下可乘船至襄阳，是连接武当与外界的要道。',
    backgroundImg: 'picture/scene/han_river.png',
    region: 'wudang',
    dangerLevel: 2,
    connections: ['wudang_mountain', 'xiangyang_city'],
  },
  
  // ── 主要城市 ──
  xiangyang_city: {
    id: 'xiangyang_city',
    name: '襄阳城',
    description: '京西南路治所，汉水之畔的军事重镇。城墙雄伟，商贸繁荣，江湖人士往来频繁。',
    backgroundImg: 'picture/scene/xiangyang_city.png',
    region: 'jingxi',
    dangerLevel: 3,
    connections: ['han_river', 'longyin_village', 'beggar_hq'],
  },
  
  jiangling_city: {
    id: 'jiangling_city',
    name: '江陵城',
    description: '荆湖北路治所，古荆州。长江重镇，商贾云集，文人墨客汇聚之地。',
    backgroundImg: 'picture/scene/jiangling_city.png',
    region: 'jinghu',
    dangerLevel: 3,
    connections: ['longyin_village'],
  },
  
  // ── 村庄 ──
  longyin_village: {
    id: 'longyin_village',
    name: '龙隐村',
    description: '武当山南麓的偏僻小村，传说有龙脉隐匿于此。主角的故乡，村民淳朴好客。',
    backgroundImg: 'picture/scene/longyin_village.png',
    region: 'wudang',
    dangerLevel: 1,
    connections: ['wudang_mountain', 'xiangyang_city', 'jiangling_city'],
  },
  
  // ── 野外区域 ──
  cangling_mountain: {
    id: 'cangling_mountain',
    name: '苍岭山',
    description: '武当山西侧的险峻山脉，妖兽横行。传闻黑月教在此有秘密据点。',
    backgroundImg: 'picture/scene/C2-canglinshan.png',
    region: 'wudang',
    dangerLevel: 5,
    connections: ['wudang_mountain', 'blackmoon_ruins'],
    unlockChapter: 2,
  },
  
  blackmoon_ruins: {
    id: 'blackmoon_ruins',
    name: '黑月教遗址',
    description: '魔教黑月教的秘密据点。阴森诡异，常人不敢靠近。',
    backgroundImg: 'picture/scene/C3-shanmiao.png',
    region: 'wudang',
    dangerLevel: 8,
    connections: ['cangling_mountain'],
    unlockChapter: 3,
  },
  
  // ── 其他门派 ──
  shaolin_temple: {
    id: 'shaolin_temple',
    name: '少林寺',
    description: '禅宗祖庭，武学圣地。位于河南府登封，七十二绝技威震江湖。',
    backgroundImg: 'picture/scene/shaolin_temple.png',
    region: 'other',
    dangerLevel: 3,
    connections: ['xiangyang_city'],
  },
  
  emei_mountain: {
    id: 'emei_mountain',
    name: '峨眉山',
    description: '秀丽险峻，峨眉派所在。位于成都府路嘉州，金顶日出为天下奇观。',
    backgroundImg: 'picture/scene/emei_mountain.png',
    region: 'other',
    dangerLevel: 3,
    connections: ['jiangling_city'],
  },
  
  beggar_hq: {
    id: 'beggar_hq',
    name: '丐帮总舵',
    description: '襄阳城外看似杂乱无章的棚户区，实则暗藏玄机。天下第一大帮。',
    backgroundImg: 'picture/scene/beggar_hq.png',
    region: 'jingxi',
    dangerLevel: 3,
    connections: ['xiangyang_city'],
  },
};

// ──── 辅助函数 ────

export function getAllLocations(): MapLocation[] {
  return Object.values(WORLD_MAP);
}

export function getLocation(id: LocationId): MapLocation | undefined {
  return WORLD_MAP[id];
}

export function getLocationDisplayName(id: LocationId): string {
  const loc = WORLD_MAP[id];
  if (!loc) return id;
  const regionPrefix: Record<string, string> = {
    wudang: '【武当】',
    jinghu: '【荆湖】',
    jingxi: '【京西】',
    other: '【江湖】',
  };
  return `${regionPrefix[loc.region] ?? ''}${loc.name}`;
}

export function isLocationUnlocked(id: LocationId, currentChapter: number): boolean {
  const loc = WORLD_MAP[id];
  if (!loc) return false;
  if (!loc.unlockChapter) return true;
  return currentChapter >= loc.unlockChapter;
}

export function getAvailableDestinations(
  currentLocationId: LocationId,
  currentChapter: number
): MapLocation[] {
  const current = WORLD_MAP[currentLocationId];
  if (!current) return [];
  
  return current.connections
    .map(id => WORLD_MAP[id])
    .filter(loc => isLocationUnlocked(loc.id, currentChapter));
}

export function getLocationBackground(locationId: LocationId): string {
  return WORLD_MAP[locationId]?.backgroundImg ?? 'picture/scene/default.png';
}