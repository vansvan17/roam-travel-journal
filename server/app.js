import 'dotenv/config';
import { buildCalendar } from '../shared/calendar.js';
import express from 'express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { rateLimit } from 'express-rate-limit';
import mongoose from 'mongoose';
import { User, Session, Trip, connectDB } from './models.js';
import { hashPassword, verifyPassword, tokenHash, newToken } from './security.js';
import { parse, registerSchema, loginSchema, tripSchema } from './validation.js';
export const app = express();
app.set('trust proxy', 1);
app.disable('x-powered-by');
app.use(helmet({ contentSecurityPolicy: { directives: { defaultSrc: ["'self'"], scriptSrc: ["'self'"], styleSrc: ["'self'", "'unsafe-inline'"], imgSrc: ["'self'", 'data:', 'https://images.unsplash.com'], fontSrc: ["'self'"], connectSrc: ["'self'"], upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null } }, crossOriginEmbedderPolicy: false }));
app.use(express.json({ limit: '512kb' }));
app.use(cookieParser());
app.use('/api', (req, res, next) => {
  if (['POST','PUT','PATCH','DELETE'].includes(req.method)) {
    const origin = req.get('origin');
    if (origin) { try { if (new URL(origin).host !== req.get('host')) return res.status(403).json({ error: 'Request origin is not allowed' }); } catch { return res.status(403).json({ error: 'Invalid origin' }); } }
    if (!req.is('application/json')) return res.status(415).json({ error: 'Send JSON content' });
  }
  next();
});
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: 'draft-8', legacyHeaders: false, message: { error: 'Too many attempts. Please try again in 15 minutes.' } });
const apiLimiter = rateLimit({ windowMs: 60 * 1000, limit: 180, standardHeaders: 'draft-8', legacyHeaders: false, message: { error: 'Too many requests. Please wait a moment.' } });
app.use('/api', apiLimiter);
app.get('/api/health', async (req, res) => {
  if (!process.env.MONGODB_URI) return res.status(503).json({ status: 'unconfigured', database: 'not configured' });
  try { await connectDB(); await mongoose.connection.db.admin().ping(); res.json({ status: 'ok', database: 'connected' }); }
  catch { res.status(503).json({ status: 'unavailable', database: 'unreachable' }); }
});
app.use('/api', (req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });
app.use('/api/auth', authLimiter);
const cookieName = 'roam_session';
const cookieOptions = () => ({ httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 7 * 24 * 60 * 60 * 1000 });
const publicUser = u => ({ id: u._id.toString(), name: u.name, email: u.email });
async function createSession(user, res) {
  const token = newToken();
  await Session.create({ userId: user._id, tokenHash: tokenHash(token), expiresAt: new Date(Date.now() + cookieOptions().maxAge) });
  res.cookie(cookieName, token, cookieOptions());
}
app.post('/api/auth/register', async (req, res) => {
  const input = parse(registerSchema, req.body);
  await connectDB();
  if (await User.exists({ email: input.email })) return res.status(409).json({ error: 'An account with this email already exists' });
  const user = await User.create({ name: input.name, email: input.email, passwordHash: await hashPassword(input.password) });
  await createSession(user, res);
  res.status(201).json({ user: publicUser(user) });
});
app.post('/api/auth/login', async (req, res) => {
  const input = parse(loginSchema, req.body);
  await connectDB();
  const user = await User.findOne({ email: input.email }).select('+passwordHash');
  if (!user || !(await verifyPassword(input.password, user.passwordHash))) return res.status(401).json({ error: 'Email or password is incorrect' });
  await createSession(user, res);
  res.json({ user: publicUser(user) });
});
async function requireUser(req, res, next) {
  const token = req.cookies[cookieName];
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return res.status(401).json({ error: 'Please sign in to continue' });
  await connectDB();
  const session = await Session.findOne({ tokenHash: tokenHash(token), expiresAt: { $gt: new Date() } });
  if (!session) return res.status(401).json({ error: 'Your session expired. Please sign in again.' });
  const user = await User.findById(session.userId);
  if (!user) return res.status(401).json({ error: 'Account not found' });
  req.user = user;
  next();
}
app.get('/api/auth/me', requireUser, (req, res) => res.json({ user: publicUser(req.user) }));
app.post('/api/auth/logout', async (req, res) => {
  if (req.cookies[cookieName]) { await connectDB(); await Session.deleteOne({ tokenHash: tokenHash(req.cookies[cookieName]) }); }
  const { maxAge, ...clearOptions } = cookieOptions();
  res.clearCookie(cookieName, clearOptions).json({ ok: true });
});
app.use('/api/trips', requireUser);
const tripJSON = t => { const { userId, __v, _id, ...data } = t.toObject(); return { ...data, id: _id.toString() }; };
app.get('/api/trips', async (req, res) => res.json({ trips: (await Trip.find({ userId: req.user._id }).sort({ createdAt: -1 })).map(tripJSON) }));
app.post('/api/trips', async (req, res) => {
  const input = parse(tripSchema, req.body);
  const trip = await Trip.create({ ...input, userId: req.user._id });
  res.status(201).json({ trip: tripJSON(trip) });
});
app.param('id', (req, res, next, id) => { if (!mongoose.isValidObjectId(id)) return res.status(400).json({ error: 'Invalid trip ID' }); next(); });
app.get('/api/trips/:id/calendar', async (req, res) => {
  const trip = await Trip.findOne({ _id: req.params.id, userId: req.user._id });
  if (!trip) return res.status(404).json({ error: 'Trip not found' });
  try { res.type('text/calendar').attachment('roam-itinerary.ics').send(buildCalendar(trip.toObject())); }
  catch (error) { res.status(400).json({ error: error.message }); }
});
app.get('/api/trips/:id', async (req, res) => {
  const trip = await Trip.findOne({ _id: req.params.id, userId: req.user._id });
  if (!trip) return res.status(404).json({ error: 'Trip not found' });
  res.json({ trip: tripJSON(trip) });
});
app.put('/api/trips/:id', async (req, res) => {
  const input = parse(tripSchema, req.body);
  const trip = await Trip.findOneAndUpdate({ _id: req.params.id, userId: req.user._id }, { $set: input }, { new: true, runValidators: true });
  if (!trip) return res.status(404).json({ error: 'Trip not found' });
  res.json({ trip: tripJSON(trip) });
});
app.delete('/api/trips/:id', async (req, res) => {
  const result = await Trip.deleteOne({ _id: req.params.id, userId: req.user._id });
  if (!result.deletedCount) return res.status(404).json({ error: 'Trip not found' });
  res.json({ ok: true });
});
app.use('/api', (req, res) => res.status(404).json({ error: 'Endpoint not found' }));
app.use((error, req, res, next) => {
  if (error.code === 11000) return res.status(409).json({ error: 'An account with this email already exists' });
  if (error.type === 'entity.parse.failed') return res.status(400).json({ error: 'Invalid JSON' });
  if (error.type === 'entity.too.large') return res.status(413).json({ error: 'This trip is too large. Export entries and start another trip.' });
  if (error.status && error.status < 500) return res.status(error.status).json({ error: error.message });
  if (error.status === 503) return res.status(503).json({ error: error.message });
  console.error('API error:', error.name);
  res.status(503).json({ error: 'We could not save that right now. Your changes are still on screen. Please try again.' });
});
export default app;
