/**
 * BUSINESS LAYER - Authentication Service
 * Handles login, register, session management
 */
const db = require('../infrastructure/database');
const { hashPassword, verifyPassword, generateToken, generateId } = require('../infrastructure/crypto');

class AuthService {
  /**
   * Register a new user
   */
  async register({ name, email, password, role = 'editor' }) {
    // Validation
    if (!name || !email || !password) {
      throw new Error('Name, email and password are required');
    }
    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters');
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Invalid email format');
    }

    // Check duplicate
    const existing = db.findUserByEmail(email);
    if (existing) throw new Error('Email already registered');

    // Create user
    const user = {
      id: generateId(),
      name,
      email,
      password: hashPassword(password),
      role,
      createdAt: new Date().toISOString()
    };
    db.createUser(user);

    const { password: _, ...safeUser } = user;
    return safeUser;
  }

  /**
   * Login - returns session token
   */
  async login({ email, password }) {
    if (!email || !password) throw new Error('Email and password required');

    const user = db.findUserByEmail(email);
    if (!user) throw new Error('Invalid email or password');

    const valid = verifyPassword(password, user.password);
    if (!valid) throw new Error('Invalid email or password');

    const token = generateToken();
    db.setSession(token, {
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name
    });

    return { token, user: { id: user.id, name: user.name, email: user.email, role: user.role } };
  }

  /**
   * Logout - destroy session
   */
  async logout(token) {
    db.deleteSession(token);
    return true;
  }

  /**
   * Verify token and return session data
   */
  verifyToken(token) {
    if (!token) return null;
    return db.getSession(token);
  }

  /**
   * Get all users (admin only)
   */
  async getAllUsers() {
    return db.getAllUsers().map(({ password: _, ...u }) => u);
  }

  /**
   * Seed default admin if no users exist
   */
  async seedAdmin() {
    const users = db.getAllUsers();
    if (users.length === 0) {
      await this.register({
        name: 'Admin',
        email: 'admin@cms.local',
        password: 'admin123',
        role: 'admin'
      });
      console.log('[AuthService] Seeded default admin: admin@cms.local / admin123');
    }
  }
}

module.exports = new AuthService();
