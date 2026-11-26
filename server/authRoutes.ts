import express, { Request, Response } from 'express';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

export interface StoredLocalUser {
  id: string;
  username: string;
  phone: string;
  displayName: string;
  passwordHash: string;
  role: 'user' | 'researcher' | 'administrator';
  createdAt: string;
  updatedAt: string;
}

const DATA_DIR = path.resolve(process.cwd(), '.data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

// Session signing key: read from env or fall back to an in-memory random 32-byte key
const SESSION_SECRET = process.env.AUTH_SESSION_SECRET || crypto.randomBytes(32).toString('hex');
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readUsers(): StoredLocalUser[] {
  try {
    ensureDataDir();
    if (!fs.existsSync(USERS_FILE)) {
      return [];
    }
    const raw = fs.readFileSync(USERS_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeUsers(users: StoredLocalUser[]) {
  ensureDataDir();
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf8');
}

function normalizePhone(input: unknown): string | null {
  if (typeof input !== 'string') return null;
  let cleaned = input.replace(/[\s\-().]/g, '').trim();
  if (!cleaned) return null;

  if (cleaned.startsWith('0')) {
    cleaned = '+84' + cleaned.slice(1);
  } else if (cleaned.startsWith('84') && !cleaned.startsWith('+')) {
    cleaned = '+' + cleaned;
  } else if (!cleaned.startsWith('+')) {
    return null;
  }

  if (/^\+84\d{9,10}$/.test(cleaned) || /^\+[1-9]\d{8,14}$/.test(cleaned)) {
    return cleaned;
  }
  return null;
}

function normalizeUsername(input: unknown): string | null {
  if (typeof input !== 'string') return null;
  const trimmed = input.trim().toLowerCase();
  if (!/^[a-z0-9_.-]{3,32}$/.test(trimmed)) return null;
  return trimmed;
}

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

function verifyPassword(password: string, storedHash: string): boolean {
  const parts = storedHash.split(':');
  if (parts.length !== 2) return false;
  const [salt, expectedHex] = parts;
  const actualBuf = crypto.scryptSync(password, salt, 64);
  const expectedBuf = Buffer.from(expectedHex, 'hex');
  if (actualBuf.length !== expectedBuf.length) return false;
  return crypto.timingSafeEqual(actualBuf, expectedBuf);
}

function signSessionToken(user: StoredLocalUser): string {
  const payload = {
    sub: user.id,
    username: user.username,
    role: user.role,
    exp: Date.now() + SESSION_TTL_MS,
  };
  const payloadB64 = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const sig = crypto.createHmac('sha256', SESSION_SECRET).update(payloadB64).digest('base64url');
  return `${payloadB64}.${sig}`;
}

function verifySessionToken(token: string): { sub: string; username: string; role: string; exp: number } | null {
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [payloadB64, sigB64] = parts;
  const expectedSig = crypto.createHmac('sha256', SESSION_SECRET).update(payloadB64).digest('base64url');
  const sigBuf = Buffer.from(sigB64);
  const expectedBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
    return null;
  }
  try {
    const decoded = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
    if (!decoded || typeof decoded.exp !== 'number' || decoded.exp < Date.now()) {
      return null;
    }
    return decoded;
  } catch {
    return null;
  }
}

function toPublicUser(user: StoredLocalUser) {
  return {
    id: user.id,
    username: user.username,
    phone: user.phone,
    displayName: user.displayName,
    role: user.role,
    createdAt: user.createdAt,
  };
}

export function createAuthRouter() {
  const router = express.Router();

  // 1. Direct Registration: Phone + Username + Password (no OTP)
  router.post('/register', (req: Request, res: Response) => {
    const phone = normalizePhone(req.body?.phone);
    const username = normalizeUsername(req.body?.username);
    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    const displayNameInput = typeof req.body?.displayName === 'string' ? req.body.displayName.trim() : '';

    if (!phone) {
      return res.status(400).json({ error: 'Số điện thoại chưa đúng. Bác nhập 10 số bắt đầu bằng 0 nhé (ví dụ: 0912345678).' });
    }
    if (!username) {
      return res.status(400).json({ error: 'Tên đăng nhập cần từ 3 đến 32 ký tự viết liền không dấu (chữ hoặc số).' });
    }
    if (password.length < 6 || password.length > 128) {
      return res.status(400).json({ error: 'Mật khẩu cần có ít nhất 6 chữ hoặc số.' });
    }

    const users = readUsers();
    if (users.some((u) => u.username === username)) {
      return res.status(409).json({ error: 'Tên đăng nhập này đã có người dùng. Bác chọn tên khác nhé.' });
    }
    if (users.some((u) => u.phone === phone)) {
      return res.status(409).json({ error: 'Số điện thoại này đã đăng ký rồi. Bác quay lại đăng nhập hoặc bấm Quên mật khẩu nhé.' });
    }

    const now = new Date().toISOString();
    const newUser: StoredLocalUser = {
      id: `local_${crypto.randomUUID()}`,
      username,
      phone,
      displayName: displayNameInput || username,
      passwordHash: hashPassword(password),
      role: 'user',
      createdAt: now,
      updatedAt: now,
    };

    users.push(newUser);
    writeUsers(users);

    const token = signSessionToken(newUser);
    return res.status(201).json({
      ok: true,
      token,
      user: toPublicUser(newUser),
    });
  });

  // 2. Login with Username (or Phone) + Password
  router.post('/login', (req: Request, res: Response) => {
    const rawIdentifier = typeof req.body?.username === 'string' ? req.body.username.trim() : '';
    const password = typeof req.body?.password === 'string' ? req.body.password : '';

    if (!rawIdentifier || !password) {
      return res.status(400).json({ error: 'Bác vui lòng nhập đủ tên đăng nhập và mật khẩu.' });
    }

    const asUsername = normalizeUsername(rawIdentifier);
    const asPhone = normalizePhone(rawIdentifier);
    const users = readUsers();

    const matchedUser = users.find(
      (u) => (asUsername && u.username === asUsername) || (asPhone && u.phone === asPhone)
    );

    if (!matchedUser || !verifyPassword(password, matchedUser.passwordHash)) {
      return res.status(401).json({ error: 'Tên đăng nhập hoặc mật khẩu chưa đúng.' });
    }

    const token = signSessionToken(matchedUser);
    return res.json({
      ok: true,
      token,
      user: toPublicUser(matchedUser),
    });
  });

  // 3. Forgot Password: verify matching Username + Registered Phone and set New Password
  router.post('/forgot/reset', (req: Request, res: Response) => {
    const username = normalizeUsername(req.body?.username);
    const phone = normalizePhone(req.body?.phone);
    const newPassword = typeof req.body?.newPassword === 'string' ? req.body.newPassword : '';

    if (!username || !phone) {
      return res.status(400).json({ error: 'Bác nhập đúng tên đăng nhập và số điện thoại đã đăng ký nhé.' });
    }
    if (newPassword.length < 6 || newPassword.length > 128) {
      return res.status(400).json({ error: 'Mật khẩu mới cần có ít nhất 6 chữ hoặc số.' });
    }

    const users = readUsers();
    const userIndex = users.findIndex((u) => u.username === username && u.phone === phone);

    if (userIndex === -1) {
      return res.status(404).json({ error: 'Tên đăng nhập và số điện thoại không khớp với tài khoản nào.' });
    }

    const targetUser = users[userIndex];
    targetUser.passwordHash = hashPassword(newPassword);
    targetUser.updatedAt = new Date().toISOString();
    users[userIndex] = targetUser;
    writeUsers(users);

    const token = signSessionToken(targetUser);
    return res.json({
      ok: true,
      token,
      user: toPublicUser(targetUser),
    });
  });

  // 4. Verify Bearer session token
  router.get('/me', (req: Request, res: Response) => {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
    if (!token) {
      return res.status(401).json({ error: 'Chưa đăng nhập.' });
    }

    const decoded = verifySessionToken(token);
    if (!decoded) {
      return res.status(401).json({ error: 'Phiên đăng nhập đã hết hạn.' });
    }

    const users = readUsers();
    const found = users.find((u) => u.id === decoded.sub);
    if (!found) {
      return res.status(401).json({ error: 'Không tìm thấy tài khoản.' });
    }

    return res.json({ ok: true, user: toPublicUser(found) });
  });

  router.post('/logout', (_req: Request, res: Response) => {
    return res.json({ ok: true });
  });

  return router;
}
