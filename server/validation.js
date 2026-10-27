import { z } from 'zod';
const text = (max) => z.string().trim().min(1).max(max);
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use a valid date').refine(v => !Number.isNaN(Date.parse(v)) && new Date(v).toISOString().startsWith(v), 'Use a valid date');
export const registerSchema = z.object({ name: text(80), email: z.email().max(254).transform(v => v.toLowerCase()), password: z.string().min(10, 'Use at least 10 characters').max(128) }).strict();
export const loginSchema = registerSchema.pick({ email: true, password: true });
const expense = z.object({ id: z.string().uuid(), title: text(120), amount: z.number().finite().positive().max(100000000), category: z.enum(['Stay','Food','Transport','Activities','Other']), date });
const stop = z.object({ id: z.string().uuid(), title: text(160), day: z.number().int().min(1).max(365), time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/), notes: z.string().max(1000).default('') });
const entry = z.object({ id: z.string().uuid(), title: text(160), body: text(10000), date, mood: z.enum(['Inspired','Happy','Grateful','Adventurous','Peaceful']) });
export const tripSchema = z.object({
  title: text(100), destination: text(120), country: text(80), startDate: date, endDate: date,
  status: z.enum(['Upcoming','In progress','Completed']), budget: z.number().finite().min(0).max(100000000),
  currency: z.enum(['INR','USD','EUR','GBP','JPY']), cover: z.enum(['bali','japan','italy','mountains','coast','city']),
  notes: z.string().max(5000).default(''), expenses: z.array(expense).max(500).default([]),
  itinerary: z.array(stop).max(500).default([]), entries: z.array(entry).max(200).default([])
}).strict().refine(v => v.endDate >= v.startDate, { message: 'End date must be after the start date', path: ['endDate'] });
export function parse(schema, value) {
  const result = schema.safeParse(value);
  if (!result.success) { const err = new Error(result.error.issues[0].message); err.status = 400; throw err; }
  return result.data;
}
