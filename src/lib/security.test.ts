import test from 'node:test';
import assert from 'node:assert/strict';
import {
  generateSalt,
  hashPassword,
  verifyPassword,
  createToken,
  verifyToken,
} from './security.ts';

test('scrypt password hashing and verification', () => {
  const salt = generateSalt();
  assert.equal(typeof salt, 'string');
  assert.ok(salt.length >= 32);

  const password = 'SuperSecretPassword123!';
  const hash = hashPassword(password, salt);
  assert.equal(typeof hash, 'string');
  assert.equal(hash.length, 128); // 64 bytes in hex

  // Positive verification
  assert.equal(verifyPassword(password, hash, salt), true);

  // Negative verifications
  assert.equal(verifyPassword('WrongPassword', hash, salt), false);
  assert.equal(verifyPassword('', hash, salt), false);
  assert.equal(verifyPassword(password, hash, 'diffSalt'), false);
});

test('session token creation and HMAC verification', () => {
  const secret = 'koumnd-production-jwt-hmac-secret-test';
  const token = createToken({ userId: 'u-123', role: 'admin', email: 'admin@koumnd.com' }, secret, 1);

  assert.ok(token.includes('.'));

  // Valid verification
  const payload = verifyToken(token, secret);
  assert.ok(payload);
  assert.equal(payload.userId, 'u-123');
  assert.equal(payload.role, 'admin');
  assert.equal(payload.email, 'admin@koumnd.com');
  assert.ok(payload.exp > Date.now());

  // Tampered token
  const tamperedToken = token.slice(0, -4) + 'abcd';
  assert.equal(verifyToken(tamperedToken, secret), null);

  // Wrong secret
  assert.equal(verifyToken(token, 'wrong-secret'), null);

  // Expired token simulation
  const expiredToken = createToken({ userId: 'u-exp', role: 'user', email: 'exp@koumnd.com' }, secret, -1);
  assert.equal(verifyToken(expiredToken, secret), null);
});
