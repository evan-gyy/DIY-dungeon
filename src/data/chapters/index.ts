import { CH1 } from './ch1';
import { CH2 } from './ch2';
import type { ChapterData } from './types';

export type { ChapterData, CampScene } from './types';

export const CHAPTERS: Record<number, ChapterData> = {
  1: CH1,
  2: CH2,
};

export function getChapter(n: number): ChapterData {
  const ch = CHAPTERS[n];
  if (!ch) throw new Error(`Chapter ${n} not found. Create src/data/chapters/ch${n}.ts and register it here.`);
  return ch;
}
