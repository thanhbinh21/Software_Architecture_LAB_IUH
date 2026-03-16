/**
 * PRESENTATION LAYER - Middleware
 */
const authService = require('../business/authService');
const { getToken } = require('./router');

function requireAuth(roles = []) {
  return async (req, res, next) => {
    const token = getToken(req);
    const session = token ? authService.verifyToken(token) : null;

    if (!session) {
      if (req.headers['content-type']?.includes('application/json')) {
        return res.json({ error: 'Unauthorized' }, 401);
      }
      return res.redirect('/login');
    }

    req.user = session;

    if (roles.length > 0 && !roles.includes(session.role)) {
      return res.json({ error: 'Forbidden' }, 403);
    }

    await next();
  };
}

// Compose middleware chain
function compose(...middlewares) {
  return async (req, res) => {
    let i = 0;
    const next = async () => {
      if (i < middlewares.length) {
        await middlewares[i++](req, res, next);
      }
    };
    await next();
  };
}

module.exports = { requireAuth, compose };
