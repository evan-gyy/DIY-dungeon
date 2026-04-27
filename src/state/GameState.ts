import type {
  PlayerState, CampTabId, ScreenId, NpcId,
} from '../data/types';

// ── 全局游戏上下文（私有，仅通过函数访问）──
interface GameContext {
  player: PlayerState | null;
  currentScreen: ScreenId;
  campTab: CampTabId;
  dialogNpcId: NpcId | null;
  dialogNode: string | null;
}

const _ctx: GameContext = {
  player: null,
  currentScreen: 'main',
  campTab: 'story',
  dialogNpcId: null,
  dialogNode: null,
};

// ── Player ──

export function getPlayer(): PlayerState {
  if (!_ctx.player) throw new Error('No active player — call getPlayerOrNull() if player may not exist');
  return _ctx.player;
}

export function getPlayerOrNull(): PlayerState | null {
  return _ctx.player;
}

export function setPlayer(p: PlayerState): void {
  _ctx.player = p;
}

export function clearPlayer(): void {
  _ctx.player = null;
}

// ── Screen ──

export function getCurrentScreen(): ScreenId {
  return _ctx.currentScreen;
}

export function setCurrentScreen(id: ScreenId): void {
  _ctx.currentScreen = id;
}

// ── Camp Tab ──

export function getCampTab(): CampTabId {
  return _ctx.campTab;
}

export function setCampTab(tab: CampTabId): void {
  _ctx.campTab = tab;
}

// ── Dialog ──

export function getDialogNpcId(): NpcId | null {
  return _ctx.dialogNpcId;
}

export function setDialogNpcId(id: NpcId | null): void {
  _ctx.dialogNpcId = id;
}

export function getDialogNode(): string | null {
  return _ctx.dialogNode;
}

export function setDialogNode(node: string | null): void {
  _ctx.dialogNode = node;
}


