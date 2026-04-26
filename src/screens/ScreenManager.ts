import type { ScreenId } from '../data/types';
import { setCurrentScreen } from '../state/GameState';

export function showScreen(id: ScreenId): void {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const el = document.getElementById(`screen-${id}`);
  if (el) el.classList.add('active');
  setCurrentScreen(id);
}
