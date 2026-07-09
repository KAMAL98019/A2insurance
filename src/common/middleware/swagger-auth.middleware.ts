import { Request, Response, NextFunction } from 'express';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { PrismaService } from '../../prisma/prisma.service';

const COOKIE_NAME = 'docs_session';
const SECRET = process.env.JWT_SECRET || 'fallback_secret';
const MAX_AGE_MS = 12 * 60 * 60 * 1000; // 12h

function parseCookies(header?: string): Record<string, string> {
  const cookies: Record<string, string> = {};
  if (!header) return cookies;
  for (const pair of header.split(';')) {
    const idx = pair.indexOf('=');
    if (idx === -1) continue;
    cookies[pair.slice(0, idx).trim()] = decodeURIComponent(pair.slice(idx + 1).trim());
  }
  return cookies;
}

function readBody(req: Request): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => (data += chunk));
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

function loginPageHtml(error?: string) {
  return `<!DOCTYPE html>
<html><head><title>API Docs Login</title><meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  *{box-sizing:border-box}
  body{font-family:system-ui,-apple-system,sans-serif;background:#0d1b6e;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0}
  .card{background:#fff;padding:32px;border-radius:12px;width:320px;box-shadow:0 10px 40px rgba(0,0,0,.3)}
  h1{font-size:18px;margin:0 0 4px;color:#111}
  p{color:#666;font-size:13px;margin:0 0 20px}
  label{font-size:12px;font-weight:600;color:#333;display:block;margin-bottom:4px}
  input{width:100%;padding:9px 10px;border:1px solid #ddd;border-radius:6px;margin-bottom:14px;font-size:14px}
  button{width:100%;padding:10px;background:#1a2980;color:#fff;border:none;border-radius:6px;font-weight:600;cursor:pointer;font-size:14px}
  button:hover{background:#0d1b6e}
  .err{color:#c62828;font-size:12px;margin-bottom:12px;background:#fdecea;padding:8px 10px;border-radius:6px}
</style></head>
<body>
  <form class="card" id="f">
    <h1>API Docs</h1>
    <p>Master Admin login required</p>
    ${error ? `<div class="err">${error}</div>` : ''}
    <label>Email</label>
    <input type="email" id="email" required autofocus autocomplete="username" />
    <label>Password</label>
    <input type="password" id="password" required autocomplete="current-password" />
    <button type="submit">Sign In</button>
  </form>
  <script>
    document.getElementById('f').addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      const res = await fetch('/api/docs/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      window.location.href = res.ok ? '/api/docs' : '/api/docs?error=1';
    });
  </script>
</body></html>`;
}

/**
 * Cookie-session gate for Swagger docs, checked against the real Master
 * Admin login (no separate secret to manage). Deliberately avoids HTTP
 * Basic Auth — browsers re-prompt inconsistently across sub-resource
 * requests (swagger-ui's own JS fetches, favicon, etc.), which reads as
 * "asks for credentials every page load".
 */
export function createSwaggerAuthMiddleware(prisma: PrismaService) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (req.method === 'POST' && req.path === '/api/docs/login') {
      try {
        const { email, password } = JSON.parse((await readBody(req)) || '{}');
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || user.role !== 'MASTER_ADMIN' || user.status !== 'ACTIVE') {
          return res.status(401).json({ message: 'Invalid credentials' });
        }
        const match = await bcrypt.compare(password, user.password);
        if (!match) return res.status(401).json({ message: 'Invalid credentials' });

        const token = jwt.sign({ sub: user.id, role: user.role }, SECRET, { expiresIn: '12h' });
        res.cookie(COOKIE_NAME, token, { httpOnly: true, sameSite: 'lax', maxAge: MAX_AGE_MS });
        return res.status(200).json({ success: true });
      } catch {
        return res.status(400).json({ message: 'Invalid request' });
      }
    }

    if (req.path === '/api/docs/logout') {
      res.clearCookie(COOKIE_NAME);
      return res.redirect('/api/docs');
    }

    const cookies = parseCookies(req.headers.cookie);
    const token = cookies[COOKIE_NAME];
    if (token) {
      try {
        const payload = jwt.verify(token, SECRET) as unknown as { sub: number; role: string };
        if (payload.role === 'MASTER_ADMIN') return next();
      } catch { /* fall through to login page */ }
    }

    if (req.path.startsWith('/api/docs-json') || req.path.startsWith('/api/docs-yaml')) {
      return res.status(401).json({ message: 'Master Admin login required. Visit /api/docs to sign in.' });
    }

    return res.status(200).send(loginPageHtml(req.query.error ? 'Invalid email or password.' : undefined));
  };
}
