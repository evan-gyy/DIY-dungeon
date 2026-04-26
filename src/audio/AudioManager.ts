// Music URLs: Vite resolves these to hashed paths in /dist.
// Before running `vite build`, place the .mp3 files at:
//   src/assets/music/mainmusic2.mp3
//   src/assets/music/battlemusic1.mp3
// (download from your current R2 bucket and commit them to the repo)
import mainMusicUrl from '../assets/music/mainmusic2.mp3';
import battleMusicUrl from '../assets/music/battlemusic1.mp3';

export const MUSIC = {
  main:   mainMusicUrl,
  battle: battleMusicUrl,
} as const;

let _audio: HTMLAudioElement | null = null;
let _enabled = true;

export function initAudio(): void {
  _audio = document.createElement('audio');
  _audio.volume = 0.35;
  _audio.loop = true;
  document.body.appendChild(_audio);
}

export function switchMusic(src: string): void {
  if (!_audio || _audio.src.endsWith(src)) return;
  _audio.src = src;
  if (_enabled) _audio.play().catch(() => {});
}

export function toggleAudio(): boolean {
  if (!_audio) return _enabled;
  _enabled = !_enabled;
  if (_enabled) {
    _audio.play().catch(() => {});
  } else {
    _audio.pause();
  }
  return _enabled;
}

export function resumeAudio(): void {
  if (_audio && _enabled && _audio.src) {
    _audio.play().catch(() => {});
  }
}

export function isAudioEnabled(): boolean {
  return _enabled;
}
