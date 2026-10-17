import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load .env from server root or project root directory reliably
const candidatePaths = [
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), 'server', '.env'),
  path.resolve(__dirname, '..', '..', '.env'),
];

for (const p of candidatePaths) {
  if (fs.existsSync(p)) {
    dotenv.config({ path: p });
    break;
  }
}

export const env = {
  PORT: parseInt(process.env.PORT || '5000', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/firedup_coffee',
  DB_NAME: process.env.DB_NAME || 'firedup_coffee',
  CLIENT_ORIGIN: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  JWT_SECRET: process.env.JWT_SECRET || 'firedup_dev_fallback_secret_key_2026',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  COOKIE_SECRET: process.env.COOKIE_SECRET || 'firedup_cookie_secret_2026',
  ADMIN_INVITATION_SECRET: process.env.ADMIN_INVITATION_SECRET || 'FIREDUP-ADMIN-SECURE-2026',
  ADMIN_INITIAL_EMAIL: process.env.ADMIN_INITIAL_EMAIL || 'vullerumahesh14@gmail.com',
  ADMIN_INITIAL_PASSWORD: process.env.ADMIN_INITIAL_PASSWORD || '',
};
