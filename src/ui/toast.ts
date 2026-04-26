let _timer: ReturnType<typeof setTimeout> | null = null;

export function showToast(msg: string, dur = 2200): void {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  if (_timer !== null) clearTimeout(_timer);
  _timer = setTimeout(() => t.classList.remove('show'), dur);
}
