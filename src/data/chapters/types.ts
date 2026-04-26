import type { StoryNode } from '../types';

export interface CampScene {
  id: string;
  title: string;
  bg: string;
  npc: { name: string; sub: string; img: string } | null;
  desc: string;
  actionLabel: string;
  actionEvent: string;
}

export interface ChapterData {
  id: number;
  title: string;
  startNode: string;
  storyNodes: Record<string, StoryNode>;
  campScenes: Record<number, CampScene>;
  finalAct: number;
}
