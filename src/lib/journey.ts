export function currentJourneyDay(start: string | null | undefined): number {
  if (!start) return 1;
  const ms = Date.now() - new Date(start + "T00:00:00").getTime();
  return Math.max(1, Math.floor(ms / 86400000) + 1);
}

export function currentJourneyWeek(start: string | null | undefined): number {
  return Math.min(52, Math.max(1, Math.floor((currentJourneyDay(start) - 1) / 7) + 1));
}
