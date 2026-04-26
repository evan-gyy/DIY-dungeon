import './style.css';
import { initParticles } from './fx/Particles';
import { initAudio, switchMusic, toggleAudio, MUSIC } from './audio/AudioManager';
import { initMainMenu } from './screens/MainMenu';
import { confirmCreate } from './screens/CharCreate';
import { enterCamp, doRest, doSaveGame, switchCampTab } from './screens/Camp';
import { closeDialog } from './screens/DialogScreen';
import { showScreen } from './screens/ScreenManager';
import { initBattleScreen } from './screens/BattleScreen';
import { renderLearnScreen } from './screens/LearnScreen';
import { skipStoryIntro } from './screens/StoryScreen';
import { bus } from './ui/events';

// ── expose essential functions to data-* handlers ──
// (These replace the old global onclick="...". The few places that
//  genuinely need to trigger from the story VN engine still work.)
declare global {
  interface Window {
    skipStoryIntro: typeof skipStoryIntro;
  }
}
window.skipStoryIntro = skipStoryIntro;

window.addEventListener('DOMContentLoaded', () => {
  initParticles();
  initAudio();

  // ── Register battle screen event listeners (one-time init) ──
  initBattleScreen();

  // ── Toast via bus ──
  bus.on('toast', ({ message, duration }) => {
    import('./ui/toast').then(m => m.showToast(message, duration));
  });

  // ── Main menu ──
  initMainMenu();

  // ── Story: skip intro ──
  document.getElementById('btn-skip-story')?.addEventListener('click', () => skipStoryIntro());

  // ── Back from save-select ──
  document.getElementById('btn-back-saveselect')?.addEventListener('click', () => {
    import('./screens/MainMenu').then(m => m.closeSaveSelect(true));
  });

  // ── Back from save-select / create ──
  document.getElementById('btn-back-create')?.addEventListener('click', () => {
    import('./screens/MainMenu').then(m => m.closeSaveSelect(true));
  });

  // ── Confirm character creation ──
  document.getElementById('btn-confirm-create')?.addEventListener('click', () => confirmCreate());

  // ── Close NPC dialog ──
  document.getElementById('btn-close-dialog')?.addEventListener('click', () => closeDialog());

  // ── Camp: back to main menu ──
  document.getElementById('btn-camp-back')?.addEventListener('click', () => {
    showScreen('main');
    switchMusic(MUSIC.main);
  });

  // ── Camp: rest ──
  document.getElementById('btn-rest')?.addEventListener('click', () => doRest());

  // ── Camp: manual save ──
  document.getElementById('btn-save')?.addEventListener('click', () => doSaveGame());

  // ── Camp: depart ──
  document.getElementById('btn-depart')?.addEventListener('click', () => {
    import('./screens/DepartScreen').then(m => m.showDepartScreen());
  });

  // ── Depart: back to camp ──
  document.getElementById('btn-back-depart')?.addEventListener('click', () => enterCamp());

  // ── Camp: go to learn ──
  document.getElementById('btn-goto-learn')?.addEventListener('click', () => {
    showScreen('learn');
    renderLearnScreen();
  });

  // ── Learn screen: back to camp ──
  document.getElementById('btn-back-learn')?.addEventListener('click', () => enterCamp());

  // ── Audio toggle ──
  document.getElementById('audio-control')?.addEventListener('click', () => {
    const enabled = toggleAudio();
    const el = document.getElementById('audio-control');
    if (el) el.textContent = enabled ? '♪ 音乐' : '♪ 静音';
  });

  // ── Autoplay BGM ──
  setTimeout(() => {
    switchMusic(MUSIC.main);
  }, 500);
});
