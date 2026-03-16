/**
 * INFRASTRUCTURE LAYER - Crypto Utilities
 * Uses Node.js built-in crypto module
 */
const crypto = require('crypto');

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  const [salt, hash] = stored.split(':');
  const inputHash = crypto.scryptSync(password, salt, 64).toString('hex');
  return inputHash === hash;
}

function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

function generateId() {
  return crypto.randomBytes(8).toString('hex');
}

module.exports = { hashPassword, verifyPassword, generateToken, generateId };
