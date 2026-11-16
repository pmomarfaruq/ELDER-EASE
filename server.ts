import express, { Request, Response, NextFunction } from 'express';
import cookieParser from 'cookie-parser';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import db from './src/server/db.ts';

dotenv.config();

const PORT = Number(process.env.PORT || 3000);
const SESSION_SECRET = process.env.SESSION_SECRET || crypto.createHash('sha256').update(process.cwd() + '_elderease_secret_key').digest('hex');
const COOKIE_NAME = 'elderease_session';

interface AuthUser {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  blood_group: string;
  allergies: string;
  medical_conditions: string;
  address: string;
  language: 'en' | 'ml';
  large_text: boolean;
  high_contrast: boolean;
  created_at: string;
}

interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

function verifyPassword(password: string, stored: string): boolean {
  const parts = stored.split(':');
  if (parts.length !== 2) return false;
  const [salt, keyHex] = parts;
  const derived = crypto.scryptSync(password, salt, 64);
  const keyBuf = Buffer.from(keyHex, 'hex');
  if (derived.length !== keyBuf.length) return false;
  return crypto.timingSafeEqual(derived, keyBuf);
}

function signToken(userId: string): string {
  const exp = Date.now() + 1000 * 60 * 60 * 24 * 14; // 14 days
  const payload = Buffer.from(JSON.stringify({ uid: userId, exp })).toString('base64url');
  const sig = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

function verifyToken(token: string): { uid: string } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    const [payload, sig] = parts;
    const expectedSig = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('base64url');
    const sigBuf = Buffer.from(sig);
    const expectedBuf = Buffer.from(expectedSig);
    if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
      return null;
    }
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (!decoded?.uid || typeof decoded.exp !== 'number' || decoded.exp < Date.now()) {
      return null;
    }
    return { uid: decoded.uid };
  } catch {
    return null;
  }
}

function mapUserRow(row: Record<string, unknown>): AuthUser {
  return {
    id: String(row.id),
    full_name: String(row.full_name),
    email: String(row.email),
    phone: String(row.phone || ''),
    blood_group: String(row.blood_group || ''),
    allergies: String(row.allergies || ''),
    medical_conditions: String(row.medical_conditions || ''),
    address: String(row.address || ''),
    language: row.language === 'ml' ? 'ml' : 'en',
    large_text: Boolean(row.large_text),
    high_contrast: Boolean(row.high_contrast),
    created_at: String(row.created_at),
  };
}

function extractToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7).trim();
  }
  const cookieToken = req.cookies?.[COOKIE_NAME];
  if (typeof cookieToken === 'string' && cookieToken.length > 0) {
    return cookieToken;
  }
  return null;
}

function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const token = extractToken(req);
  if (!token) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }
  const verified = verifyToken(token);
  if (!verified) {
    res.status(401).json({ error: 'Invalid or expired session' });
    return;
  }
  const row = db.prepare('SELECT * FROM users WHERE id = ?').get(verified.uid) as Record<string, unknown> | undefined;
  if (!row) {
    res.status(401).json({ error: 'User account not found' });
    return;
  }
  req.user = mapUserRow(row);
  next();
}

function setSessionCookie(res: Response, token: string) {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 1000 * 60 * 60 * 24 * 14,
    path: '/',
  });
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());

  // ==================== AUTH ROUTES ====================
  app.post('/api/auth/signup', (req: Request, res: Response) => {
    const fullName = String(req.body?.fullName || '').trim();
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');
    const confirmPassword = String(req.body?.confirmPassword || '');

    if (fullName.length < 2) {
      res.status(400).json({ error: 'Full name must be at least 2 characters.' });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      res.status(400).json({ error: 'Please enter a valid email address.' });
      return;
    }
    if (password.length < 8) {
      res.status(400).json({ error: 'Password must be at least 8 characters long.' });
      return;
    }
    if (password !== confirmPassword) {
      res.status(400).json({ error: 'Passwords do not match.' });
      return;
    }

    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) {
      res.status(409).json({ error: 'An account with this email already exists.' });
      return;
    }

    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const passwordHash = hashPassword(password);

    db.prepare(`
      INSERT INTO users (id, full_name, email, password_hash, language, large_text, high_contrast, created_at)
      VALUES (?, ?, ?, ?, 'en', 0, 0, ?)
    `).run(id, fullName, email, passwordHash, now);

    const userRow = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as Record<string, unknown>;
    const user = mapUserRow(userRow);
    const token = signToken(user.id);
    setSessionCookie(res, token);
    res.status(201).json({ user, token });
  });

  app.post('/api/auth/login', (req: Request, res: Response) => {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required.' });
      return;
    }

    const userRow = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as Record<string, unknown> | undefined;
    if (!userRow || !verifyPassword(password, String(userRow.password_hash))) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    const user = mapUserRow(userRow);
    const token = signToken(user.id);
    setSessionCookie(res, token);
    res.json({ user, token });
  });

  app.post('/api/auth/logout', (_req: Request, res: Response) => {
    res.clearCookie(COOKIE_NAME, { path: '/' });
    res.json({ ok: true });
  });

  app.get('/api/auth/me', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    res.json({ user: req.user });
  });

  app.post('/api/auth/forgot-password', (req: Request, res: Response) => {
    const email = String(req.body?.email || '').trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      res.status(400).json({ error: 'Please enter a valid email address.' });
      return;
    }

    const userRow = db.prepare('SELECT id, email FROM users WHERE email = ?').get(email) as { id: string; email: string } | undefined;
    if (!userRow) {
      res.status(404).json({ error: 'No registered account found with that email address.' });
      return;
    }

    const resetCode = String(crypto.randomInt(100000, 999999));
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 15 * 60 * 1000).toISOString();

    db.prepare('UPDATE password_resets SET used = 1 WHERE user_id = ?').run(userRow.id);
    db.prepare(`
      INSERT INTO password_resets (id, user_id, email, reset_code, expires_at, used, created_at)
      VALUES (?, ?, ?, ?, ?, 0, ?)
    `).run(crypto.randomUUID(), userRow.id, userRow.email, resetCode, expiresAt, now.toISOString());

    res.json({
      ok: true,
      message: 'A 6-digit verification code has been generated for your account.',
      verificationCode: resetCode,
    });
  });

  app.post('/api/auth/reset-password', (req: Request, res: Response) => {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const code = String(req.body?.code || '').trim();
    const newPassword = String(req.body?.newPassword || '');
    const confirmPassword = String(req.body?.confirmPassword || '');

    if (!email || !code) {
      res.status(400).json({ error: 'Email and verification code are required.' });
      return;
    }
    if (newPassword.length < 8) {
      res.status(400).json({ error: 'New password must be at least 8 characters.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      res.status(400).json({ error: 'Passwords do not match.' });
      return;
    }

    const resetRow = db.prepare(`
      SELECT * FROM password_resets
      WHERE email = ? AND reset_code = ? AND used = 0
      ORDER BY created_at DESC LIMIT 1
    `).get(email, code) as { id: string; user_id: string; expires_at: string } | undefined;

    if (!resetRow) {
      res.status(400).json({ error: 'Invalid verification code.' });
      return;
    }
    if (new Date(resetRow.expires_at).getTime() < Date.now()) {
      res.status(400).json({ error: 'Verification code has expired. Please request a new one.' });
      return;
    }

    const newHash = hashPassword(newPassword);
    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(newHash, resetRow.user_id);
    db.prepare('UPDATE password_resets SET used = 1 WHERE id = ?').run(resetRow.id);

    res.json({ ok: true, message: 'Password updated successfully. You can now log in.' });
  });

  // ==================== USER PROFILE & ACCESSIBILITY ====================
  app.patch('/api/user/profile', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    const u = req.user!;
    const fullName = req.body?.full_name !== undefined ? String(req.body.full_name).trim() : u.full_name;
    if (fullName.length < 2) {
      res.status(400).json({ error: 'Full name must be at least 2 characters.' });
      return;
    }

    const phone = req.body?.phone !== undefined ? String(req.body.phone).trim() : u.phone;
    const bloodGroup = req.body?.blood_group !== undefined ? String(req.body.blood_group).trim() : u.blood_group;
    const allergies = req.body?.allergies !== undefined ? String(req.body.allergies).trim() : u.allergies;
    const medicalConditions = req.body?.medical_conditions !== undefined ? String(req.body.medical_conditions).trim() : u.medical_conditions;
    const address = req.body?.address !== undefined ? String(req.body.address).trim() : u.address;
    const language = req.body?.language === 'ml' ? 'ml' : req.body?.language === 'en' ? 'en' : u.language;
    const largeText = req.body?.large_text !== undefined ? (req.body.large_text ? 1 : 0) : (u.large_text ? 1 : 0);
    const highContrast = req.body?.high_contrast !== undefined ? (req.body.high_contrast ? 1 : 0) : (u.high_contrast ? 1 : 0);

    db.prepare(`
      UPDATE users
      SET full_name = ?, phone = ?, blood_group = ?, allergies = ?, medical_conditions = ?,
          address = ?, language = ?, large_text = ?, high_contrast = ?
      WHERE id = ?
    `).run(fullName, phone, bloodGroup, allergies, medicalConditions, address, language, largeText, highContrast, u.id);

    const updatedRow = db.prepare('SELECT * FROM users WHERE id = ?').get(u.id) as Record<string, unknown>;
    res.json({ user: mapUserRow(updatedRow) });
  });

  // ==================== HEALTH RECORDS ====================
  app.get('/api/health', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    const records = db.prepare(`
      SELECT * FROM health_records WHERE user_id = ? ORDER BY recorded_at DESC, created_at DESC
    `).all(req.user!.id);
    res.json({ records });
  });

  app.post('/api/health', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    const body = req.body || {};
    const recordType = body.record_type === 'note' ? 'note' : 'vitals';
    const systolic = body.systolic !== undefined && body.systolic !== '' && body.systolic !== null ? Number(body.systolic) : null;
    const diastolic = body.diastolic !== undefined && body.diastolic !== '' && body.diastolic !== null ? Number(body.diastolic) : null;
    const bloodSugar = body.blood_sugar !== undefined && body.blood_sugar !== '' && body.blood_sugar !== null ? Number(body.blood_sugar) : null;
    const sugarContext = ['fasting', 'post_meal', 'random'].includes(body.sugar_context) ? body.sugar_context : 'fasting';
    const heartRate = body.heart_rate !== undefined && body.heart_rate !== '' && body.heart_rate !== null ? Number(body.heart_rate) : null;
    const weightKg = body.weight_kg !== undefined && body.weight_kg !== '' && body.weight_kg !== null ? Number(body.weight_kg) : null;
    const title = String(body.title || '').trim();
    const notes = String(body.notes || '').trim();
    const recordedAt = body.recorded_at ? String(body.recorded_at) : new Date().toISOString();

    if (
      systolic === null &&
      diastolic === null &&
      bloodSugar === null &&
      heartRate === null &&
      weightKg === null &&
      !title &&
      !notes
    ) {
      res.status(400).json({ error: 'Please enter at least one vital sign or medical note.' });
      return;
    }

    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO health_records (
        id, user_id, record_type, systolic, diastolic, blood_sugar, sugar_context,
        heart_rate, weight_kg, title, notes, recorded_at, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, req.user!.id, recordType, systolic, diastolic, bloodSugar, sugarContext, heartRate, weightKg, title, notes, recordedAt, now);

    const record = db.prepare('SELECT * FROM health_records WHERE id = ?').get(id);
    res.status(201).json({ record });
  });

  app.put('/api/health/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    const existing = db.prepare('SELECT * FROM health_records WHERE id = ? AND user_id = ?').get(req.params.id, req.user!.id);
    if (!existing) {
      res.status(404).json({ error: 'Health record not found.' });
      return;
    }

    const body = req.body || {};
    const recordType = body.record_type === 'note' ? 'note' : 'vitals';
    const systolic = body.systolic !== undefined && body.systolic !== '' && body.systolic !== null ? Number(body.systolic) : null;
    const diastolic = body.diastolic !== undefined && body.diastolic !== '' && body.diastolic !== null ? Number(body.diastolic) : null;
    const bloodSugar = body.blood_sugar !== undefined && body.blood_sugar !== '' && body.blood_sugar !== null ? Number(body.blood_sugar) : null;
    const sugarContext = ['fasting', 'post_meal', 'random'].includes(body.sugar_context) ? body.sugar_context : 'fasting';
    const heartRate = body.heart_rate !== undefined && body.heart_rate !== '' && body.heart_rate !== null ? Number(body.heart_rate) : null;
    const weightKg = body.weight_kg !== undefined && body.weight_kg !== '' && body.weight_kg !== null ? Number(body.weight_kg) : null;
    const title = String(body.title || '').trim();
    const notes = String(body.notes || '').trim();
    const recordedAt = body.recorded_at ? String(body.recorded_at) : String((existing as Record<string, unknown>).recorded_at);

    db.prepare(`
      UPDATE health_records
      SET record_type = ?, systolic = ?, diastolic = ?, blood_sugar = ?, sugar_context = ?,
          heart_rate = ?, weight_kg = ?, title = ?, notes = ?, recorded_at = ?
      WHERE id = ? AND user_id = ?
    `).run(recordType, systolic, diastolic, bloodSugar, sugarContext, heartRate, weightKg, title, notes, recordedAt, req.params.id, req.user!.id);

    const record = db.prepare('SELECT * FROM health_records WHERE id = ?').get(req.params.id);
    res.json({ record });
  });

  app.delete('/api/health/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    const result = db.prepare('DELETE FROM health_records WHERE id = ? AND user_id = ?').run(req.params.id, req.user!.id);
    if (result.changes === 0) {
      res.status(404).json({ error: 'Health record not found.' });
      return;
    }
    res.json({ ok: true });
  });

  // ==================== MEDICINE REMINDERS ====================
  app.get('/api/medicines', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    const reminders = db.prepare(`
      SELECT * FROM medicine_reminders WHERE user_id = ? ORDER BY schedule_time ASC, created_at DESC
    `).all(req.user!.id);
    const logs = db.prepare(`
      SELECT * FROM medicine_logs WHERE user_id = ? ORDER BY logged_at DESC LIMIT 200
    `).all(req.user!.id);
    res.json({ reminders, logs });
  });

  app.post('/api/medicines', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    const medicineName = String(req.body?.medicine_name || '').trim();
    const dosage = String(req.body?.dosage || '').trim();
    const scheduleTime = String(req.body?.schedule_time || '').trim();
    const frequency = String(req.body?.frequency || 'daily').trim();
    const instructions = String(req.body?.instructions || '').trim();

    if (!medicineName || !dosage || !scheduleTime) {
      res.status(400).json({ error: 'Medicine name, dosage, and reminder time are required.' });
      return;
    }

    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO medicine_reminders (id, user_id, medicine_name, dosage, schedule_time, frequency, instructions, active, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)
    `).run(id, req.user!.id, medicineName, dosage, scheduleTime, frequency, instructions, now);

    const reminder = db.prepare('SELECT * FROM medicine_reminders WHERE id = ?').get(id);
    res.status(201).json({ reminder });
  });

  app.put('/api/medicines/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    const existing = db.prepare('SELECT * FROM medicine_reminders WHERE id = ? AND user_id = ?').get(req.params.id, req.user!.id);
    if (!existing) {
      res.status(404).json({ error: 'Medicine reminder not found.' });
      return;
    }

    const medicineName = String(req.body?.medicine_name || '').trim();
    const dosage = String(req.body?.dosage || '').trim();
    const scheduleTime = String(req.body?.schedule_time || '').trim();
    const frequency = String(req.body?.frequency || 'daily').trim();
    const instructions = String(req.body?.instructions || '').trim();
    const active = req.body?.active !== undefined ? (req.body.active ? 1 : 0) : 1;

    if (!medicineName || !dosage || !scheduleTime) {
      res.status(400).json({ error: 'Medicine name, dosage, and reminder time are required.' });
      return;
    }

    db.prepare(`
      UPDATE medicine_reminders
      SET medicine_name = ?, dosage = ?, schedule_time = ?, frequency = ?, instructions = ?, active = ?
      WHERE id = ? AND user_id = ?
    `).run(medicineName, dosage, scheduleTime, frequency, instructions, active, req.params.id, req.user!.id);

    const reminder = db.prepare('SELECT * FROM medicine_reminders WHERE id = ?').get(req.params.id);
    res.json({ reminder });
  });

  app.delete('/api/medicines/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    const result = db.prepare('DELETE FROM medicine_reminders WHERE id = ? AND user_id = ?').run(req.params.id, req.user!.id);
    if (result.changes === 0) {
      res.status(404).json({ error: 'Medicine reminder not found.' });
      return;
    }
    res.json({ ok: true });
  });

  app.post('/api/medicines/:id/log', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    const reminder = db.prepare('SELECT * FROM medicine_reminders WHERE id = ? AND user_id = ?').get(req.params.id, req.user!.id) as Record<string, unknown> | undefined;
    if (!reminder) {
      res.status(404).json({ error: 'Medicine reminder not found.' });
      return;
    }

    const status = req.body?.status === 'skipped' ? 'skipped' : 'taken';
    const scheduledFor = req.body?.scheduled_for ? String(req.body.scheduled_for) : new Date().toISOString().slice(0, 10);
    const id = crypto.randomUUID();
    const loggedAt = new Date().toISOString();

    db.prepare(`
      INSERT INTO medicine_logs (id, user_id, reminder_id, medicine_name, dosage, scheduled_for, status, logged_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, req.user!.id, String(reminder.id), String(reminder.medicine_name), String(reminder.dosage), scheduledFor, status, loggedAt);

    const log = db.prepare('SELECT * FROM medicine_logs WHERE id = ?').get(id);
    res.status(201).json({ log });
  });

  // ==================== EMERGENCY SOS ====================
  app.get('/api/sos', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    const contacts = db.prepare(`
      SELECT * FROM emergency_contacts WHERE user_id = ? ORDER BY is_primary DESC, created_at ASC
    `).all(req.user!.id);
    const alerts = db.prepare(`
      SELECT * FROM sos_alerts WHERE user_id = ? ORDER BY triggered_at DESC LIMIT 50
    `).all(req.user!.id);
    res.json({ contacts, alerts });
  });

  app.post('/api/sos/contacts', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    const name = String(req.body?.name || '').trim();
    const relationship = String(req.body?.relationship || '').trim();
    const phone = String(req.body?.phone || '').trim();
    const email = String(req.body?.email || '').trim();
    const isPrimary = req.body?.is_primary ? 1 : 0;

    if (!name || !relationship || !phone) {
      res.status(400).json({ error: 'Contact name, relationship, and phone number are required.' });
      return;
    }

    if (isPrimary) {
      db.prepare('UPDATE emergency_contacts SET is_primary = 0 WHERE user_id = ?').run(req.user!.id);
    }

    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO emergency_contacts (id, user_id, name, relationship, phone, email, is_primary, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, req.user!.id, name, relationship, phone, email, isPrimary, now);

    const contact = db.prepare('SELECT * FROM emergency_contacts WHERE id = ?').get(id);
    res.status(201).json({ contact });
  });

  app.put('/api/sos/contacts/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    const existing = db.prepare('SELECT * FROM emergency_contacts WHERE id = ? AND user_id = ?').get(req.params.id, req.user!.id);
    if (!existing) {
      res.status(404).json({ error: 'Emergency contact not found.' });
      return;
    }

    const name = String(req.body?.name || '').trim();
    const relationship = String(req.body?.relationship || '').trim();
    const phone = String(req.body?.phone || '').trim();
    const email = String(req.body?.email || '').trim();
    const isPrimary = req.body?.is_primary ? 1 : 0;

    if (!name || !relationship || !phone) {
      res.status(400).json({ error: 'Contact name, relationship, and phone number are required.' });
      return;
    }

    if (isPrimary) {
      db.prepare('UPDATE emergency_contacts SET is_primary = 0 WHERE user_id = ?').run(req.user!.id);
    }

    db.prepare(`
      UPDATE emergency_contacts
      SET name = ?, relationship = ?, phone = ?, email = ?, is_primary = ?
      WHERE id = ? AND user_id = ?
    `).run(name, relationship, phone, email, isPrimary, req.params.id, req.user!.id);

    const contact = db.prepare('SELECT * FROM emergency_contacts WHERE id = ?').get(req.params.id);
    res.json({ contact });
  });

  app.delete('/api/sos/contacts/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    const result = db.prepare('DELETE FROM emergency_contacts WHERE id = ? AND user_id = ?').run(req.params.id, req.user!.id);
    if (result.changes === 0) {
      res.status(404).json({ error: 'Emergency contact not found.' });
      return;
    }
    res.json({ ok: true });
  });

  app.post('/api/sos/trigger', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    const contacts = db.prepare('SELECT id, name, relationship, phone, email FROM emergency_contacts WHERE user_id = ?').all(req.user!.id);
    const locationShared = req.body?.location_shared ? 1 : 0;
    const latitude = locationShared && req.body?.latitude !== undefined && req.body?.latitude !== null ? Number(req.body.latitude) : null;
    const longitude = locationShared && req.body?.longitude !== undefined && req.body?.longitude !== null ? Number(req.body.longitude) : null;
    const locationLabel = String(req.body?.location_label || '').trim();
    const notes = String(req.body?.notes || '').trim();

    const id = crypto.randomUUID();
    const triggeredAt = new Date().toISOString();

    db.prepare(`
      INSERT INTO sos_alerts (
        id, user_id, triggered_at, latitude, longitude, location_shared, location_label,
        notified_contacts_json, notes, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'sent')
    `).run(id, req.user!.id, triggeredAt, latitude, longitude, locationShared, locationLabel, JSON.stringify(contacts), notes);

    const alert = db.prepare('SELECT * FROM sos_alerts WHERE id = ?').get(id);
    res.status(201).json({ alert });
  });

  app.patch('/api/sos/alerts/:id/resolve', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    const existing = db.prepare('SELECT * FROM sos_alerts WHERE id = ? AND user_id = ?').get(req.params.id, req.user!.id);
    if (!existing) {
      res.status(404).json({ error: 'Alert not found.' });
      return;
    }
    const resolvedAt = new Date().toISOString();
    db.prepare('UPDATE sos_alerts SET status = ?, resolved_at = ? WHERE id = ? AND user_id = ?').run('resolved', resolvedAt, req.params.id, req.user!.id);
    const alert = db.prepare('SELECT * FROM sos_alerts WHERE id = ?').get(req.params.id);
    res.json({ alert });
  });

  // ==================== FAMILY CONNECT & MESSAGING ====================
  app.get('/api/family', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    const members = db.prepare('SELECT * FROM family_members WHERE user_id = ? ORDER BY created_at ASC').all(req.user!.id);
    const messages = db.prepare('SELECT * FROM family_messages WHERE user_id = ? ORDER BY created_at ASC').all(req.user!.id);
    res.json({ members, messages });
  });

  app.post('/api/family/members', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    const name = String(req.body?.name || '').trim();
    const relationship = String(req.body?.relationship || '').trim();
    const phone = String(req.body?.phone || '').trim();
    const email = String(req.body?.email || '').trim();
    const shareHealth = req.body?.share_health ? 1 : 0;
    const shareMedicines = req.body?.share_medicines ? 1 : 0;
    const shareAppointments = req.body?.share_appointments ? 1 : 0;
    const shareLocation = req.body?.share_location ? 1 : 0;

    if (!name || !relationship || !phone) {
      res.status(400).json({ error: 'Name, relationship, and phone number are required.' });
      return;
    }

    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO family_members (
        id, user_id, name, relationship, phone, email,
        share_health, share_medicines, share_appointments, share_location, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, req.user!.id, name, relationship, phone, email, shareHealth, shareMedicines, shareAppointments, shareLocation, now);

    const member = db.prepare('SELECT * FROM family_members WHERE id = ?').get(id);
    res.status(201).json({ member });
  });

  app.put('/api/family/members/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    const existing = db.prepare('SELECT * FROM family_members WHERE id = ? AND user_id = ?').get(req.params.id, req.user!.id);
    if (!existing) {
      res.status(404).json({ error: 'Family member not found.' });
      return;
    }
    const name = String(req.body?.name || '').trim();
    const relationship = String(req.body?.relationship || '').trim();
    const phone = String(req.body?.phone || '').trim();
    const email = String(req.body?.email || '').trim();
    if (!name || !relationship || !phone) {
      res.status(400).json({ error: 'Name, relationship, and phone number are required.' });
      return;
    }

    db.prepare(`
      UPDATE family_members SET name = ?, relationship = ?, phone = ?, email = ?
      WHERE id = ? AND user_id = ?
    `).run(name, relationship, phone, email, req.params.id, req.user!.id);

    const member = db.prepare('SELECT * FROM family_members WHERE id = ?').get(req.params.id);
    res.json({ member });
  });

  app.patch('/api/family/members/:id/permissions', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    const existing = db.prepare('SELECT * FROM family_members WHERE id = ? AND user_id = ?').get(req.params.id, req.user!.id) as Record<string, unknown> | undefined;
    if (!existing) {
      res.status(404).json({ error: 'Family member not found.' });
      return;
    }

    const shareHealth = req.body?.share_health !== undefined ? (req.body.share_health ? 1 : 0) : Number(existing.share_health);
    const shareMedicines = req.body?.share_medicines !== undefined ? (req.body.share_medicines ? 1 : 0) : Number(existing.share_medicines);
    const shareAppointments = req.body?.share_appointments !== undefined ? (req.body.share_appointments ? 1 : 0) : Number(existing.share_appointments);
    const shareLocation = req.body?.share_location !== undefined ? (req.body.share_location ? 1 : 0) : Number(existing.share_location);

    db.prepare(`
      UPDATE family_members
      SET share_health = ?, share_medicines = ?, share_appointments = ?, share_location = ?
      WHERE id = ? AND user_id = ?
    `).run(shareHealth, shareMedicines, shareAppointments, shareLocation, req.params.id, req.user!.id);

    const member = db.prepare('SELECT * FROM family_members WHERE id = ?').get(req.params.id);
    res.json({ member });
  });

  app.delete('/api/family/members/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    const result = db.prepare('DELETE FROM family_members WHERE id = ? AND user_id = ?').run(req.params.id, req.user!.id);
    if (result.changes === 0) {
      res.status(404).json({ error: 'Family member not found.' });
      return;
    }
    res.json({ ok: true });
  });

  app.post('/api/family/messages', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    const familyMemberId = String(req.body?.family_member_id || '').trim();
    const messageText = String(req.body?.message_text || '').trim();
    const senderRole = req.body?.sender_role === 'family' ? 'family' : 'senior';

    const member = db.prepare('SELECT * FROM family_members WHERE id = ? AND user_id = ?').get(familyMemberId, req.user!.id) as Record<string, unknown> | undefined;
    if (!member) {
      res.status(404).json({ error: 'Family member not found.' });
      return;
    }
    if (!messageText) {
      res.status(400).json({ error: 'Please write a message before sending.' });
      return;
    }

    const senderName = senderRole === 'family' ? String(member.name) : req.user!.full_name;
    const id = crypto.randomUUID();
    const createdAt = new Date().toISOString();

    db.prepare(`
      INSERT INTO family_messages (id, user_id, family_member_id, sender_role, sender_name, message_text, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, req.user!.id, familyMemberId, senderRole, senderName, messageText, createdAt);

    const message = db.prepare('SELECT * FROM family_messages WHERE id = ?').get(id);
    res.status(201).json({ message });
  });

  app.get('/api/family/members/:id/shared-preview', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    const member = db.prepare('SELECT * FROM family_members WHERE id = ? AND user_id = ?').get(req.params.id, req.user!.id) as Record<string, unknown> | undefined;
    if (!member) {
      res.status(404).json({ error: 'Family member not found.' });
      return;
    }

    const preview: Record<string, unknown> = {
      member,
      health: member.share_health
        ? db.prepare('SELECT id, systolic, diastolic, blood_sugar, heart_rate, weight_kg, title, recorded_at FROM health_records WHERE user_id = ? ORDER BY recorded_at DESC LIMIT 5').all(req.user!.id)
        : null,
      medicines: member.share_medicines
        ? db.prepare('SELECT id, medicine_name, dosage, schedule_time, frequency FROM medicine_reminders WHERE user_id = ? AND active = 1 ORDER BY schedule_time ASC').all(req.user!.id)
        : null,
      appointments: member.share_appointments
        ? db.prepare("SELECT id, doctor_name, hospital_name, appointment_date, appointment_time, status FROM appointments WHERE user_id = ? AND status = 'upcoming' ORDER BY appointment_date ASC LIMIT 5").all(req.user!.id)
        : null,
      locationAllowed: Boolean(member.share_location),
    };

    res.json({ preview });
  });

  // ==================== APPOINTMENTS ====================
  app.get('/api/appointments', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    const appointments = db.prepare(`
      SELECT * FROM appointments WHERE user_id = ? ORDER BY appointment_date ASC, appointment_time ASC
    `).all(req.user!.id);
    res.json({ appointments });
  });

  app.post('/api/appointments', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    const doctorName = String(req.body?.doctor_name || '').trim();
    const specialty = String(req.body?.specialty || '').trim();
    const hospitalName = String(req.body?.hospital_name || '').trim();
    const appointmentDate = String(req.body?.appointment_date || '').trim();
    const appointmentTime = String(req.body?.appointment_time || '').trim();
    const notes = String(req.body?.notes || '').trim();
    const reminderEnabled = req.body?.reminder_enabled !== undefined ? (req.body.reminder_enabled ? 1 : 0) : 1;

    if (!doctorName || !hospitalName || !appointmentDate || !appointmentTime) {
      res.status(400).json({ error: 'Doctor name, hospital, date, and time are required.' });
      return;
    }

    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO appointments (
        id, user_id, doctor_name, specialty, hospital_name, appointment_date, appointment_time,
        notes, reminder_enabled, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'upcoming', ?)
    `).run(id, req.user!.id, doctorName, specialty, hospitalName, appointmentDate, appointmentTime, notes, reminderEnabled, now);

    const appointment = db.prepare('SELECT * FROM appointments WHERE id = ?').get(id);
    res.status(201).json({ appointment });
  });

  app.put('/api/appointments/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    const existing = db.prepare('SELECT * FROM appointments WHERE id = ? AND user_id = ?').get(req.params.id, req.user!.id);
    if (!existing) {
      res.status(404).json({ error: 'Appointment not found.' });
      return;
    }

    const doctorName = String(req.body?.doctor_name || '').trim();
    const specialty = String(req.body?.specialty || '').trim();
    const hospitalName = String(req.body?.hospital_name || '').trim();
    const appointmentDate = String(req.body?.appointment_date || '').trim();
    const appointmentTime = String(req.body?.appointment_time || '').trim();
    const notes = String(req.body?.notes || '').trim();
    const reminderEnabled = req.body?.reminder_enabled !== undefined ? (req.body.reminder_enabled ? 1 : 0) : 1;
    const status = ['upcoming', 'completed', 'cancelled'].includes(req.body?.status) ? req.body.status : 'upcoming';

    if (!doctorName || !hospitalName || !appointmentDate || !appointmentTime) {
      res.status(400).json({ error: 'Doctor name, hospital, date, and time are required.' });
      return;
    }

    db.prepare(`
      UPDATE appointments
      SET doctor_name = ?, specialty = ?, hospital_name = ?, appointment_date = ?, appointment_time = ?,
          notes = ?, reminder_enabled = ?, status = ?
      WHERE id = ? AND user_id = ?
    `).run(doctorName, specialty, hospitalName, appointmentDate, appointmentTime, notes, reminderEnabled, status, req.params.id, req.user!.id);

    const appointment = db.prepare('SELECT * FROM appointments WHERE id = ?').get(req.params.id);
    res.json({ appointment });
  });

  app.delete('/api/appointments/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    const result = db.prepare('DELETE FROM appointments WHERE id = ? AND user_id = ?').run(req.params.id, req.user!.id);
    if (result.changes === 0) {
      res.status(404).json({ error: 'Appointment not found.' });
      return;
    }
    res.json({ ok: true });
  });

  // ==================== VITE / STATIC SERVING ====================
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req: Request, res: Response) => {
      const indexFile = path.join(distDir, 'index.html');
      if (fs.existsSync(indexFile)) {
        res.sendFile(indexFile);
      } else {
        res.status(404).send('Build not found');
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ElderEase server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
