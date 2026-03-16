/**
 * PRESENTATION LAYER - Controllers
 * Handles HTTP requests, calls business services, renders views
 */
const authService = require('../business/authService');
const postService = require('../business/postService');
const pluginService = require('../business/pluginService');
const views = require('./views');
const { getToken } = require('./router');

// ─── AUTH CONTROLLERS ────────────────────────────────────────────────────────

const showLogin = async (req, res) => {
  res.html(views.loginPage());
};

const doLogin = async (req, res) => {
  try {
    const { token } = await authService.login(req.body);
    res.writeHead(302, {
      'Set-Cookie': `cms_token=${token}; HttpOnly; Path=/; Max-Age=86400`,
      'Location': '/admin'
    });
    res.end();
  } catch (err) {
    res.html(views.loginPage(err.message));
  }
};

const doLogout = async (req, res) => {
  const token = getToken(req);
  if (token) await authService.logout(token);
  res.writeHead(302, {
    'Set-Cookie': 'cms_token=; HttpOnly; Path=/; Max-Age=0',
    'Location': '/login'
  });
  res.end();
};

// ─── DASHBOARD ───────────────────────────────────────────────────────────────

const showDashboard = async (req, res) => {
  const stats = await postService.getStats();
  const recentPosts = await postService.getAllPosts();
  res.html(views.dashboardPage({ user: req.user, stats, recentPosts }));
};

// ─── POST CONTROLLERS ────────────────────────────────────────────────────────

const listPosts = async (req, res) => {
  const posts = await postService.getAllPosts();
  res.html(views.postsPage({ user: req.user, posts }));
};

const showNewPostForm = async (req, res) => {
  res.html(views.postFormPage({ user: req.user }));
};

const createPost = async (req, res) => {
  try {
    const { title, content, status, tags } = req.body;
    const tagArray = tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : [];
    await postService.createPost({
      title, content, status,
      tags: tagArray,
      authorId: req.user.userId,
      authorName: req.user.name
    });
    res.redirect('/admin/posts');
  } catch (err) {
    res.html(views.postFormPage({ user: req.user, error: err.message }));
  }
};

const showPost = async (req, res) => {
  try {
    const post = await postService.getPostById(req.params.id);
    res.html(views.postDetailPage({ user: req.user, post }));
  } catch (err) {
    res.redirect('/admin/posts');
  }
};

const showEditForm = async (req, res) => {
  try {
    const post = await postService.getPostById(req.params.id);
    res.html(views.postFormPage({ user: req.user, post }));
  } catch (err) {
    res.redirect('/admin/posts');
  }
};

const updatePost = async (req, res) => {
  try {
    const { title, content, status, tags } = req.body;
    const tagArray = tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : [];
    await postService.updatePost(
      req.params.id,
      { title, content, status, tags: tagArray },
      req.user.userId,
      req.user.role
    );
    res.redirect('/admin/posts');
  } catch (err) {
    const post = await postService.getPostById(req.params.id).catch(() => null);
    res.html(views.postFormPage({ user: req.user, post, error: err.message }));
  }
};

const deletePost = async (req, res) => {
  try {
    await postService.deletePost(req.params.id, req.user.userId, req.user.role);
  } catch (e) { /* ignore */ }
  res.redirect('/admin/posts');
};

const togglePost = async (req, res) => {
  try {
    await postService.toggleStatus(req.params.id, req.user.userId, req.user.role);
  } catch (e) { /* ignore */ }
  res.redirect('/admin/posts');
};

// ─── PLUGIN CONTROLLERS ──────────────────────────────────────────────────────

const listPlugins = async (req, res) => {
  const plugins = await pluginService.listPlugins();
  res.html(views.pluginsPage({ user: req.user, plugins }));
};

const enablePlugin = async (req, res) => {
  try { await pluginService.enablePlugin(req.params.id); } catch (e) { /* ignore */ }
  res.redirect('/admin/plugins');
};

const disablePlugin = async (req, res) => {
  try { await pluginService.disablePlugin(req.params.id); } catch (e) { /* ignore */ }
  res.redirect('/admin/plugins');
};

// ─── USER CONTROLLERS ────────────────────────────────────────────────────────

const listUsers = async (req, res) => {
  const users = await authService.getAllUsers();
  res.html(views.usersPage({ user: req.user, users }));
};

const showAddUser = async (req, res) => {
  res.html(views.addUserPage({ user: req.user }));
};

const createUser = async (req, res) => {
  try {
    await authService.register(req.body);
    res.redirect('/admin/users');
  } catch (err) {
    res.html(views.addUserPage({ user: req.user, error: err.message }));
  }
};

module.exports = {
  showLogin, doLogin, doLogout,
  showDashboard,
  listPosts, showNewPostForm, createPost, showPost, showEditForm, updatePost, deletePost, togglePost,
  listPlugins, enablePlugin, disablePlugin,
  listUsers, showAddUser, createUser
};
