/**
 * Auth Utilities
 *
 * JWT token generation / verification and password hashing via bcrypt.
 * Uses 12 salt rounds as specified in the project quality standards.
 * JWT tokens expire after 7 days.
 */

import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import type { JwtPayload } from '@/app/types';

const JWT_SECRET = process.env.JWT_SECRET || 'default_secret_change_in_production';
const JWT_EXPIRES_IN = '7d';
const BCRYPT_SALT_ROUNDS = 12;

// ─── JWT ────────────────────────────────────────────────────────────────────

/** Generate a JWT token with the user's ID. */
export function generateToken(userId: string): string {
  return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/** Verify a JWT token and return the decoded payload. */
export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
}

// ─── Password ───────────────────────────────────────────────────────────────

/** Hash a plain-text password with bcrypt (12 rounds). */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
}

/** Compare a plain-text password against a bcrypt hash. */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
