import test from 'node:test';
import assert from 'node:assert/strict';
import { parse, tripSchema } from '../server/validation.js';
import { dateForDay, planReadiness, planningErrors } from '../shared/planning.js';
const stop = (day, time, durationMinutes = 60) => ({ id: crypto.randomUUID(), title: `Day ${day} stop`, day, time, durationMinutes, notes: '' });
const trip = (changes = {}) => ({ title: 'A coast escape', destination: 'Goa', country: 'India', startDate: '2026-12-30', endDate: '2027-01-01', status: 'Upcoming', budget: 20000, currency: 'INR', cover: 'coast', itinerary: [], expenses: [], entries: [], ...changes });
test('calendar days cross month and year boundaries without local-time drift', () => {
 assert.equal(dateForDay(trip(), 3), '2027-01-01');
 assert.equal(dateForDay(trip({startDate:'2028-02-28'}), 2), '2028-02-29');
});
test('stops outside a trip are rejected, including after shortening a planned trip', () => {
 const planned = trip({itinerary:[stop(3, '10:00')]});
 assert.equal(parse(tripSchema, planned).itinerary.length, 1);
 assert.throws(() => parse(tripSchema, {...planned,endDate:'2026-12-31'}), /day 3.*2 days/);
 assert.throws(() => parse(tripSchema, trip({endDate:'2028-01-01'})), /365 days/);
});
test('overlapping intervals are rejected while back-to-back stops remain valid', () => {
 assert.throws(() => parse(tripSchema, trip({itinerary:[stop(1,'09:00',90),stop(1,'10:00',30)]})), /overlaps/);
 assert.equal(planningErrors(trip({itinerary:[stop(1,'09:00',60),stop(1,'10:00',30)]})).length,0);
 assert.equal(planningErrors(trip({itinerary:[stop(1,'09:00'),stop(2,'09:00')]})).length,0);
});
test('cross-midnight stops and duplicate IDs are rejected', () => {
 assert.throws(() => parse(tripSchema, trip({itinerary:[stop(1,'23:30',60)]})), /past midnight/);
 const same = stop(1, '09:00');
 assert.throws(() => parse(tripSchema, trip({itinerary:[same,{...same,day:2}]})), /Duplicate/);
});
test('ready state requires planned days, a positive budget, and affordable expenses', () => {
 const empty = planReadiness(trip());
 assert.deepEqual(empty.missingDays,[1,2,3]);
 assert.equal(empty.ready,false);
 assert.throws(() => parse(tripSchema, trip({planStatus:'Ready'})), /readiness/);
 const complete = trip({planStatus:'Ready',itinerary:[stop(1,'09:00'),stop(2,'09:00'),stop(3,'09:00')]});
 assert.equal(planReadiness(complete).ready,true);
 assert.equal(parse(tripSchema, complete).planStatus,'Ready');
 assert.throws(() => parse(tripSchema, {...complete,budget:0}), /readiness/);
 const over = {...complete,expenses:[{id:crypto.randomUUID(),title:'Flight',amount:25000,category:'Transport',date:'2026-12-01'}]};
 assert.throws(() => parse(tripSchema, over), /readiness/);
 assert.equal(parse(tripSchema, {...over,planStatus:'Draft'}).expenses.length,1);
});
test('older trips receive draft status and a default stop duration', () => {
 const old = stop(1, '10:00'); delete old.durationMinutes;
 const result = parse(tripSchema, trip({itinerary:[old]}));
 assert.equal(result.planStatus,'Draft'); assert.equal(result.itinerary[0].durationMinutes,60);
});
