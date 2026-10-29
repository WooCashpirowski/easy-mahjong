export function formatTime(milliseconds, precise = false) {
  const totalSeconds = Math.floor(Math.max(0, milliseconds) / 1000);
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  const hundredths = String(Math.floor((milliseconds % 1000) / 10)).padStart(2, '0');
  return `${minutes}:${seconds}${precise ? `.${hundredths}` : ''}`;
}

export function formatDate(iso) {
  return new Intl.DateTimeFormat('pl-PL', { day: 'numeric', month: 'short' }).format(new Date(iso));
}
