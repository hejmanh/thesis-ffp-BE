import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { hashPassword, comparePassword } from './hash.js';

describe('Password hashing utilities', () => {
  const testPassword = 'MySecurePassword123!';
  let hashedPassword: string;

  beforeAll(async () => {
    hashedPassword = await hashPassword(testPassword);
  });

  describe('hashPassword', () => {
    it('should hash password and return different string', async () => {
      const hashed = await hashPassword(testPassword);

      expect(hashed).toBeDefined();
      expect(hashed).not.toBe(testPassword);
      expect(hashed.length).toBeGreaterThan(testPassword.length);
    });

    it('should produce different hash for same password', async () => {
      const hash1 = await hashPassword(testPassword);
      const hash2 = await hashPassword(testPassword);

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('comparePassword', () => {
    it('should return true for matching password', async () => {
      const isMatch = await comparePassword(testPassword, hashedPassword);

      expect(isMatch).toBe(true);
    });

    it('should return false for non-matching password', async () => {
      const isMatch = await comparePassword('WrongPassword', hashedPassword);

      expect(isMatch).toBe(false);
    });

    it('should return false for empty password', async () => {
      const isMatch = await comparePassword('', hashedPassword);

      expect(isMatch).toBe(false);
    });
  });
});
