/** Domain rules shared by the API and the browser, including the local demo. */
const DAY_MS = 86_400_000;
export const tripDays = trip => Math.round((Date.parse(trip.endDate) - Date.parse(trip.startDate)) / DAY_MS) + 1;
export const stopMinutes = stop => Number(stop.time.slice(0, 2)) * 60 + Number(stop.time.slice(3));
export const stopDuration = stop => stop.durationMinutes ?? 60;
export function dateForDay(trip, day) {
  return new Date(Date.parse(trip.startDate) + (day - 1) * DAY_MS).toISOString().slice(0, 10);
}
export function planningErrors(trip) {
  const errors = [], days = tripDays(trip);
  if (!Number.isFinite(days) || days < 1 || days > 365) errors.push('A trip must last between 1 and 365 days.');
  for (const key of ['itinerary', 'expenses', 'entries']) {
    const items = trip[key] || [];
    if (new Set(items.map(item => item.id)).size !== items.length) errors.push(`Duplicate items are not allowed in ${key}.`);
  }
  const stops = trip.itinerary || [];
  for (const stop of stops) {
    if (stop.day < 1 || stop.day > days) errors.push(`“${stop.title}” is on day ${stop.day}, but this trip has ${days} days. Move the stop before shortening the trip.`);
    if (stopMinutes(stop) + stopDuration(stop) > 1440) errors.push(`“${stop.title}” runs past midnight. Shorten it or move it earlier.`);
  }
  for (let i = 0; i < stops.length; i++) {
    for (let j = i + 1; j < stops.length; j++) {
      const a = stops[i], b = stops[j];
      if (a.day === b.day && stopMinutes(a) < stopMinutes(b) + stopDuration(b) && stopMinutes(b) < stopMinutes(a) + stopDuration(a)) {
        errors.push(`Day ${a.day}: “${a.title}” overlaps “${b.title}”. Choose a different time or duration.`);
      }
    }
  }
  return errors;
}
export function planReadiness(trip) {
  const days = tripDays(trip), stops = trip.itinerary || [], expenses = trip.expenses || [];
  const planned = new Set(stops.filter(s => s.day >= 1 && s.day <= days).map(s => s.day));
  const missingDays = Array.from({ length: Math.min(365, Math.max(0, days || 0)) }, (_, i) => i + 1).filter(day => !planned.has(day));
  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
  const checks = [
    { label: 'A stop planned for every day', passed: days > 0 && missingDays.length === 0 },
    { label: 'A budget set for the trip', passed: trip.budget > 0 },
    { label: 'Expenses within the planned budget', passed: totalSpent <= trip.budget },
    { label: 'No schedule conflicts', passed: planningErrors(trip).length === 0 }
  ];
  return { checks, missingDays, plannedDays: planned.size, totalDays: days, totalSpent, ready: checks.every(c => c.passed) };
}
