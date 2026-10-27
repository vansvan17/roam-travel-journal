import { planningErrors, dateForDay, stopDuration } from './planning.js';

function escapeICS(value) {
  return String(value).replace(/\\/g, '\\\\').replace(/\r?\n/g, '\\n').replace(/;/g, '\\;').replace(/,/g, '\\,');
}
function foldLine(line) {
  let output = '', length = 0;
  for (const char of line) {
    const bytes = new TextEncoder().encode(char).length;
    if (length + bytes > 75) { output += '\r\n '; length = 1; }
    output += char; length += bytes;
  }
  return output;
}
/** Floating local times: the calendar app uses the user's selected local time zone. */
export function buildCalendar(trip, now = new Date()) {
  const errors = planningErrors(trip);
  if (errors.length) throw new Error(errors[0]);
  if (!trip.itinerary?.length) throw new Error('Add an itinerary stop before exporting your calendar.');
  const stamp = now.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Roam//Trip planner//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', `X-WR-CALNAME:${escapeICS(trip.title)}`];
  for (const stop of [...trip.itinerary].sort((a, b) => a.day - b.day || a.time.localeCompare(b.time))) {
    const date = dateForDay(trip, stop.day), start = `${date.replaceAll('-', '')}T${stop.time.replace(':', '')}00`;
    const endDate = new Date(`${date}T${stop.time}:00Z`); endDate.setUTCMinutes(endDate.getUTCMinutes() + stopDuration(stop));
    const end = endDate.toISOString().replace(/[-:]/g, '').slice(0, 15);
    lines.push('BEGIN:VEVENT', `UID:${escapeICS(stop.id)}@roam`, `DTSTAMP:${stamp}`, `DTSTART:${start}`, `DTEND:${end}`, `SUMMARY:${escapeICS(stop.title)}`, `DESCRIPTION:${escapeICS(stop.notes || '')}`, `LOCATION:${escapeICS(`${trip.destination}, ${trip.country}`)}`, 'END:VEVENT');
  }
  lines.push('END:VCALENDAR');
  return lines.map(foldLine).join('\r\n') + '\r\n';
}
