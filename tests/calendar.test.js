import test from "node:test";
import assert from "node:assert/strict";
import { buildCalendar } from "../shared/calendar.js";
const trip = {
  title: "A coast escape",
  destination: "Goa",
  country: "India",
  startDate: "2026-12-31",
  endDate: "2027-01-02",
  itinerary: [],
  expenses: [],
  entries: [],
};
const stop = {
  id: crypto.randomUUID(),
  day: 2,
  time: "09:30",
  durationMinutes: 90,
  title: "Beach walk",
  notes: "Bring water",
};
test("calendar export maps itinerary days to dates and includes event durations", () => {
  const result = buildCalendar(
    { ...trip, itinerary: [stop] },
    new Date("2026-10-27T10:00:00Z"),
  );
  assert.match(result, /BEGIN:VCALENDAR\r\n/);
  assert.match(result, /DTSTAMP:20261027T100000Z/);
  assert.match(result, /DTSTART:20270101T093000/);
  assert.match(result, /DTEND:20270101T110000/);
  assert.match(result, new RegExp(`UID:${stop.id}@roam`));
});
test("calendar fields are escaped, folded by UTF-8 byte count, and cannot inject events", () => {
  const result = buildCalendar({
    ...trip,
    itinerary: [
      {
        ...stop,
        title: "Café 🌴 ".repeat(25),
        notes: "A, B; C\\D\nBEGIN:VEVENT",
      },
    ],
  });
  assert.match(result, /DESCRIPTION:A\\, B\\; C\\\\D\\nBEGIN:VEVENT/);
  assert.equal(result.split("BEGIN:VEVENT").length - 1, 2); // One event plus escaped text inside DESCRIPTION.
  assert.equal(result.split("\r\nBEGIN:VEVENT\r\n").length - 1, 1);
  for (const line of result.split("\r\n"))
    assert.ok(Buffer.byteLength(line, "utf8") <= 75);
});
test("empty or conflicting itineraries cannot be exported", () => {
  assert.throws(() => buildCalendar(trip), /Add an itinerary stop/);
  assert.throws(
    () =>
      buildCalendar({
        ...trip,
        itinerary: [stop, { ...stop, id: crypto.randomUUID() }],
      }),
    /overlaps/,
  );
});
