/** Compact token count for status UI (e.g. 1.2k). */
export function formatTokenCount(n: number): string {
  if (!Number.isFinite(n)) return '—';
  const abs = Math.abs(n);
  if (abs < 1000) return String(Math.round(n));
  const k = n / 1000;
  const rounded = Math.round(k * 10) / 10;
  return rounded % 1 === 0 ? `${rounded}k` : `${rounded}k`;
}
