// All ranges below are computed on the Pacific calendar day, inclusive,
// as "YYYY-MM-DD" strings so comparisons are timezone-proof.

export function pacificToday() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Los_Angeles",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export function shiftISO(iso: string, days: number) {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

// 0 Sun .. 6 Sat for a PT date string
export function isoDay(iso: string) {
  return new Date(`${iso}T12:00:00Z`).getUTCDay();
}

// Monday 00:00 of the current week → coming Sunday 23:59
export function weekRange(today: string) {
  const day = isoDay(today);
  const backToMonday = day === 0 ? 6 : day - 1;
  const start = shiftISO(today, -backToMonday);
  return { start, end: shiftISO(start, 6) };
}

// Friday 00:00 → Sunday 23:59 of the coming (or current) weekend
export function weekendRange(today: string) {
  const day = isoDay(today);
  const offset = day === 0 ? -2 : day === 6 ? -1 : 5 - day;
  const start = shiftISO(today, offset);
  return { start, end: shiftISO(start, 2) };
}

// Today 00:00 → 7 days later 23:59
export function next7Range(today: string) {
  return { start: today, end: shiftISO(today, 7) };
}

// Today 00:00 → 30 days later 23:59
export function next30Range(today: string) {
  return { start: today, end: shiftISO(today, 30) };
}
