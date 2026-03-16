/**
 * HTML View Templates
 */

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=DM+Mono:wght@400;500&family=Inter:wght@300;400;500&display=swap');

  :root {
    --bg: #0a0a0f;
    --surface: #12121a;
    --surface2: #1a1a26;
    --border: #2a2a3a;
    --accent: #7c6af7;
    --accent2: #f7516a;
    --accent3: #3de0a8;
    --text: #e8e8f0;
    --muted: #7070a0;
    --danger: #f7516a;
    --success: #3de0a8;
    --warning: #f7c948;
  }

  * { margin: 0; padding: 0; box-sizing: border-box; }

  body {
    font-family: 'Inter', sans-serif;
    background: var(--bg);
    color: var(--text);
    min-height: 100vh;
    font-size: 14px;
    line-height: 1.6;
  }

  /* LAYOUT */
  .layout { display: flex; min-height: 100vh; }

  .sidebar {
    width: 220px;
    background: var(--surface);
    border-right: 1px solid var(--border);
    padding: 0;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
  }

  .sidebar-logo {
    padding: 24px 20px 20px;
    border-bottom: 1px solid var(--border);
    font-family: 'Syne', sans-serif;
    font-weight: 800;
    font-size: 18px;
    color: var(--accent);
    letter-spacing: -0.5px;
  }

  .sidebar-logo span { color: var(--accent2); }

  .sidebar-nav { flex: 1; padding: 16px 10px; }

  .nav-section {
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 1.5px;
    color: var(--muted);
    padding: 12px 10px 6px;
    font-family: 'DM Mono', monospace;
  }

  .nav-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 9px 12px;
    border-radius: 8px;
    color: var(--muted);
    text-decoration: none;
    font-size: 13.5px;
    transition: all 0.15s;
    margin-bottom: 2px;
  }

  .nav-item:hover, .nav-item.active {
    background: var(--surface2);
    color: var(--text);
  }

  .nav-item.active { color: var(--accent); }
  .nav-icon { font-size: 15px; width: 20px; text-align: center; }

  .sidebar-footer {
    padding: 16px;
    border-top: 1px solid var(--border);
    font-size: 12px;
    color: var(--muted);
  }

  .user-badge {
    display: flex; align-items: center; gap: 10px;
  }
  .user-avatar {
    width: 30px; height: 30px; border-radius: 50%;
    background: var(--accent);
    display: flex; align-items: center; justify-content: center;
    font-size: 12px; font-weight: 700; color: white;
    flex-shrink: 0;
  }
  .user-name { font-weight: 500; color: var(--text); }
  .user-role {
    font-family: 'DM Mono', monospace;
    font-size: 10px;
    color: var(--accent3);
    background: rgba(61,224,168,0.1);
    padding: 1px 6px; border-radius: 3px;
    display: inline-block; margin-top: 2px;
  }

  .main { flex: 1; overflow: hidden; display: flex; flex-direction: column; }

  .topbar {
    height: 56px;
    border-bottom: 1px solid var(--border);
    padding: 0 28px;
    display: flex; align-items: center; justify-content: space-between;
    background: var(--surface);
  }

  .page-title {
    font-family: 'Syne', sans-serif;
    font-size: 16px;
    font-weight: 700;
  }

  .content { padding: 28px; flex: 1; overflow-y: auto; }

  /* CARDS & STATS */
  .stats-grid {
    display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 16px; margin-bottom: 28px;
  }

  .stat-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 20px;
    position: relative; overflow: hidden;
  }

  .stat-card::before {
    content: '';
    position: absolute; top: 0; left: 0; right: 0; height: 2px;
  }
  .stat-card:nth-child(1)::before { background: var(--accent); }
  .stat-card:nth-child(2)::before { background: var(--accent3); }
  .stat-card:nth-child(3)::before { background: var(--accent2); }
  .stat-card:nth-child(4)::before { background: var(--warning); }

  .stat-label { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: var(--muted); font-family: 'DM Mono', monospace; }
  .stat-value { font-family: 'Syne', sans-serif; font-size: 32px; font-weight: 800; margin-top: 6px; }

  /* TABLES */
  .card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 12px;
    overflow: hidden;
    margin-bottom: 20px;
  }
  .card-header {
    padding: 16px 20px;
    border-bottom: 1px solid var(--border);
    display: flex; align-items: center; justify-content: space-between;
    font-family: 'Syne', sans-serif; font-weight: 700; font-size: 14px;
  }

  table { width: 100%; border-collapse: collapse; }
  th {
    text-align: left; padding: 10px 20px;
    font-size: 11px; text-transform: uppercase; letter-spacing: 1px;
    color: var(--muted); font-family: 'DM Mono', monospace;
    border-bottom: 1px solid var(--border);
    background: rgba(255,255,255,0.02);
  }
  td { padding: 14px 20px; border-bottom: 1px solid rgba(255,255,255,0.04); vertical-align: middle; }
  tr:last-child td { border-bottom: none; }
  tr:hover td { background: rgba(255,255,255,0.02); }

  /* BADGES */
  .badge {
    display: inline-block; padding: 3px 10px; border-radius: 20px;
    font-size: 11px; font-weight: 500; font-family: 'DM Mono', monospace;
  }
  .badge-published { background: rgba(61,224,168,0.15); color: var(--accent3); }
  .badge-draft { background: rgba(112,112,160,0.15); color: var(--muted); }
  .badge-admin { background: rgba(124,106,247,0.2); color: var(--accent); }
  .badge-editor { background: rgba(247,81,106,0.15); color: var(--accent2); }
  .badge-active { background: rgba(61,224,168,0.15); color: var(--accent3); }
  .badge-inactive { background: rgba(112,112,160,0.15); color: var(--muted); }

  /* BUTTONS */
  .btn {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 8px 16px; border-radius: 8px;
    font-size: 13px; font-weight: 500; cursor: pointer;
    border: 1px solid transparent; text-decoration: none;
    transition: all 0.15s; font-family: inherit;
  }
  .btn-primary { background: var(--accent); color: white; border-color: var(--accent); }
  .btn-primary:hover { background: #6a58e0; }
  .btn-danger { background: transparent; color: var(--danger); border-color: var(--danger); }
  .btn-danger:hover { background: rgba(247,81,106,0.1); }
  .btn-ghost { background: transparent; color: var(--muted); border-color: var(--border); }
  .btn-ghost:hover { color: var(--text); border-color: var(--text); }
  .btn-success { background: transparent; color: var(--success); border-color: var(--success); }
  .btn-success:hover { background: rgba(61,224,168,0.1); }
  .btn-sm { padding: 5px 10px; font-size: 12px; }

  /* FORMS */
  .form-group { margin-bottom: 16px; }
  label { display: block; font-size: 12px; color: var(--muted); margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.8px; font-family: 'DM Mono', monospace; }
  input, textarea, select {
    width: 100%; padding: 10px 14px;
    background: var(--surface2); border: 1px solid var(--border);
    border-radius: 8px; color: var(--text);
    font-family: inherit; font-size: 14px;
    transition: border-color 0.15s;
  }
  input:focus, textarea:focus, select:focus {
    outline: none; border-color: var(--accent);
    box-shadow: 0 0 0 3px rgba(124,106,247,0.1);
  }
  textarea { min-height: 200px; resize: vertical; }

  /* AUTH */
  .auth-page {
    display: flex; align-items: center; justify-content: center;
    min-height: 100vh;
    background: radial-gradient(ellipse at 20% 50%, rgba(124,106,247,0.08) 0%, transparent 60%),
                radial-gradient(ellipse at 80% 20%, rgba(247,81,106,0.06) 0%, transparent 50%), var(--bg);
  }
  .auth-box {
    width: 380px; background: var(--surface);
    border: 1px solid var(--border); border-radius: 16px; padding: 40px;
  }
  .auth-logo {
    font-family: 'Syne', sans-serif; font-weight: 800; font-size: 24px;
    color: var(--accent); text-align: center; margin-bottom: 28px;
  }
  .auth-logo span { color: var(--accent2); }

  .error-msg {
    background: rgba(247,81,106,0.1); border: 1px solid rgba(247,81,106,0.3);
    color: var(--danger); padding: 10px 14px; border-radius: 8px;
    font-size: 13px; margin-bottom: 16px;
  }
  .success-msg {
    background: rgba(61,224,168,0.1); border: 1px solid rgba(61,224,168,0.3);
    color: var(--success); padding: 10px 14px; border-radius: 8px;
    font-size: 13px; margin-bottom: 16px;
  }

  /* PLUGIN CARDS */
  .plugins-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; }
  .plugin-card {
    background: var(--surface); border: 1px solid var(--border);
    border-radius: 12px; padding: 20px;
    display: flex; flex-direction: column; gap: 12px;
  }
  .plugin-card.enabled { border-color: rgba(61,224,168,0.3); }
  .plugin-header { display: flex; justify-content: space-between; align-items: flex-start; }
  .plugin-name { font-family: 'Syne', sans-serif; font-weight: 700; font-size: 15px; }
  .plugin-version { font-family: 'DM Mono', monospace; font-size: 11px; color: var(--muted); }
  .plugin-desc { font-size: 13px; color: var(--muted); line-height: 1.5; }
  .plugin-hooks { display: flex; flex-wrap: wrap; gap: 6px; }
  .hook-tag {
    font-family: 'DM Mono', monospace; font-size: 10px;
    padding: 2px 8px; border-radius: 4px;
    background: rgba(124,106,247,0.15); color: var(--accent);
  }

  /* SEO Info */
  .seo-box {
    background: rgba(124,106,247,0.05); border: 1px solid rgba(124,106,247,0.2);
    border-radius: 8px; padding: 14px; margin-top: 12px; font-size: 12px;
  }
  .seo-box dt { color: var(--muted); font-family: 'DM Mono', monospace; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; margin-top: 8px; }
  .seo-box dd { color: var(--text); margin-left: 0; margin-top: 2px; }

  .post-meta { font-size: 12px; color: var(--muted); display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }
  .post-meta span { display: flex; align-items: center; gap: 4px; }
  .actions { display: flex; gap: 6px; }

  hr { border: none; border-top: 1px solid var(--border); margin: 20px 0; }
  .text-muted { color: var(--muted); }
  .text-sm { font-size: 12px; }
  .mt-4 { margin-top: 16px; }
  .mb-4 { margin-bottom: 16px; }
  .flex { display: flex; }
  .items-center { align-items: center; }
  .justify-between { justify-content: space-between; }
  .gap-2 { gap: 8px; }
  .w-full { width: 100%; }
`;

function layout({ title, user, page, content, extraMenu = [] }) {
  const initials = user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2);
  const navItems = [
    { href: '/admin', icon: '⬡', label: 'Dashboard', id: 'dashboard' },
    { href: '/admin/posts', icon: '📝', label: 'Posts', id: 'posts' },
    { href: '/admin/posts/new', icon: '✦', label: 'New Post', id: 'new-post' },
    { href: '/admin/users', icon: '👤', label: 'Users', id: 'users', adminOnly: true },
    { href: '/admin/plugins', icon: '🔌', label: 'Plugins', id: 'plugins', adminOnly: true },
    ...extraMenu
  ].filter(item => !item.adminOnly || user.role === 'admin');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title} · PluginCMS</title>
<style>${styles}</style>
</head>
<body>
<div class="layout">
  <aside class="sidebar">
    <div class="sidebar-logo">Plugin<span>CMS</span></div>
    <nav class="sidebar-nav">
      <div class="nav-section">Navigation</div>
      ${navItems.map(item => `
        <a href="${item.href}" class="nav-item ${page === item.id ? 'active' : ''}">
          <span class="nav-icon">${item.icon}</span>
          ${item.label}
        </a>
      `).join('')}
    </nav>
    <div class="sidebar-footer">
      <div class="user-badge">
        <div class="user-avatar">${initials}</div>
        <div>
          <div class="user-name">${user.name}</div>
          <div class="user-role">${user.role}</div>
        </div>
      </div>
      <a href="/logout" class="btn btn-ghost btn-sm mt-4 w-full" style="justify-content:center;margin-top:12px">Logout</a>
    </div>
  </aside>
  <div class="main">
    <div class="topbar">
      <span class="page-title">${title}</span>
    </div>
    <div class="content">${content}</div>
  </div>
</div>
</body>
</html>`;
}

function loginPage(error = '') {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Login · PluginCMS</title>
<style>${styles}</style>
</head>
<body>
<div class="auth-page">
  <div class="auth-box">
    <div class="auth-logo">Plugin<span>CMS</span></div>
    ${error ? `<div class="error-msg">${error}</div>` : ''}
    <form method="POST" action="/login">
      <div class="form-group">
        <label>Email</label>
        <input type="email" name="email" placeholder="admin@cms.local" required>
      </div>
      <div class="form-group">
        <label>Password</label>
        <input type="password" name="password" placeholder="••••••••" required>
      </div>
      <button type="submit" class="btn btn-primary w-full" style="justify-content:center;width:100%;margin-top:8px">Sign In</button>
    </form>
    <p class="text-muted text-sm mt-4" style="text-align:center">Default: admin@cms.local / admin123</p>
  </div>
</div>
</body>
</html>`;
}

function dashboardPage({ user, stats, recentPosts }) {
  return layout({
    title: 'Dashboard', user, page: 'dashboard',
    content: `
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-label">Total Posts</div>
          <div class="stat-value">${stats.total}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Published</div>
          <div class="stat-value" style="color:var(--accent3)">${stats.published}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Drafts</div>
          <div class="stat-value" style="color:var(--accent2)">${stats.drafts}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Total Views</div>
          <div class="stat-value" style="color:var(--warning)">${stats.totalViews}</div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          Recent Posts
          <a href="/admin/posts/new" class="btn btn-primary btn-sm">+ New Post</a>
        </div>
        <table>
          <thead>
            <tr><th>Title</th><th>Status</th><th>Author</th><th>Views</th><th>Date</th></tr>
          </thead>
          <tbody>
            ${recentPosts.length === 0 ? '<tr><td colspan="5" style="text-align:center;color:var(--muted);padding:30px">No posts yet</td></tr>' : ''}
            ${recentPosts.slice(0,5).map(post => `
              <tr>
                <td><a href="/admin/posts/${post.id}" style="color:var(--text);text-decoration:none;font-weight:500">${post.title}</a></td>
                <td><span class="badge badge-${post.status}">${post.status}</span></td>
                <td>${post.authorName}</td>
                <td>${post.views || 0}</td>
                <td class="text-muted text-sm">${new Date(post.createdAt).toLocaleDateString()}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `
  });
}

function postsPage({ user, posts }) {
  return layout({
    title: 'Posts', user, page: 'posts',
    content: `
      <div class="flex justify-between items-center mb-4">
        <span class="text-muted">${posts.length} post${posts.length !== 1 ? 's' : ''} total</span>
        <a href="/admin/posts/new" class="btn btn-primary">✦ New Post</a>
      </div>
      <div class="card">
        <table>
          <thead>
            <tr><th>Title</th><th>Status</th><th>Author</th><th>Views</th><th>Read</th><th>Created</th><th>Actions</th></tr>
          </thead>
          <tbody>
            ${posts.length === 0 ? '<tr><td colspan="7" style="text-align:center;color:var(--muted);padding:30px">No posts yet. <a href="/admin/posts/new" style="color:var(--accent)">Create one</a></td></tr>' : ''}
            ${posts.map(post => `
              <tr>
                <td style="max-width:220px">
                  <a href="/admin/posts/${post.id}" style="color:var(--text);text-decoration:none;font-weight:500">${post.title}</a>
                  <div class="text-muted text-sm">${post.slug}</div>
                </td>
                <td><span class="badge badge-${post.status}">${post.status}</span></td>
                <td>${post.authorName}</td>
                <td>${post.views || 0}</td>
                <td class="text-muted text-sm">${post.readingTime ? post.readingTime + ' min' : '—'}</td>
                <td class="text-muted text-sm">${new Date(post.createdAt).toLocaleDateString()}</td>
                <td>
                  <div class="actions">
                    <a href="/admin/posts/${post.id}/edit" class="btn btn-ghost btn-sm">Edit</a>
                    <form method="POST" action="/admin/posts/${post.id}/toggle" style="display:inline">
                      <button type="submit" class="btn btn-ghost btn-sm">${post.status === 'published' ? 'Unpublish' : 'Publish'}</button>
                    </form>
                    <form method="POST" action="/admin/posts/${post.id}/delete" style="display:inline" onsubmit="return confirm('Delete this post?')">
                      <button type="submit" class="btn btn-danger btn-sm">Del</button>
                    </form>
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `
  });
}

function postFormPage({ user, post = null, error = '' }) {
  const isEdit = !!post;
  return layout({
    title: isEdit ? 'Edit Post' : 'New Post', user, page: isEdit ? 'posts' : 'new-post',
    content: `
      ${error ? `<div class="error-msg">${error}</div>` : ''}
      <div class="card">
        <div class="card-header">${isEdit ? 'Edit Post' : 'Create New Post'}</div>
        <form method="POST" action="${isEdit ? `/admin/posts/${post.id}/edit` : '/admin/posts/new'}" style="padding:20px">
          <div class="form-group">
            <label>Title</label>
            <input type="text" name="title" value="${post ? post.title.replace(/"/g,'&quot;') : ''}" placeholder="Post title..." required>
          </div>
          <div class="form-group">
            <label>Content</label>
            <textarea name="content" placeholder="Write your content here...">${post ? post.content.replace(/</g,'&lt;') : ''}</textarea>
          </div>
          <div class="form-group">
            <label>Tags (comma separated)</label>
            <input type="text" name="tags" value="${post ? (post.tags || []).join(', ') : ''}" placeholder="tech, nodejs, cms">
          </div>
          <div class="form-group">
            <label>Status</label>
            <select name="status">
              <option value="draft" ${(!post || post.status === 'draft') ? 'selected' : ''}>Draft</option>
              <option value="published" ${post && post.status === 'published' ? 'selected' : ''}>Published</option>
            </select>
          </div>
          <div class="flex gap-2">
            <button type="submit" class="btn btn-primary">${isEdit ? 'Save Changes' : 'Create Post'}</button>
            <a href="/admin/posts" class="btn btn-ghost">Cancel</a>
          </div>
        </form>
      </div>
    `
  });
}

function postDetailPage({ user, post }) {
  const seo = post.seo;
  return layout({
    title: post.title, user, page: 'posts',
    content: `
      <div class="flex justify-between items-center mb-4">
        <a href="/admin/posts" class="btn btn-ghost btn-sm">← Back</a>
        <div class="actions">
          <a href="/admin/posts/${post.id}/edit" class="btn btn-primary btn-sm">Edit Post</a>
          <form method="POST" action="/admin/posts/${post.id}/toggle" style="display:inline">
            <button type="submit" class="btn btn-success btn-sm">${post.status === 'published' ? 'Unpublish' : 'Publish'}</button>
          </form>
        </div>
      </div>
      <div class="card">
        <div style="padding:24px">
          <h1 style="font-family:'Syne',sans-serif;font-size:24px;font-weight:800;margin-bottom:12px">${post.title}</h1>
          <div class="post-meta">
            <span>📝 ${post.authorName}</span>
            <span>📅 ${new Date(post.createdAt).toLocaleDateString()}</span>
            <span>👁 ${post.views || 0} views</span>
            ${post.readingTime ? `<span>⏱ ${post.readingTime} min read</span>` : ''}
            ${post.wordCount ? `<span>📄 ${post.wordCount} words</span>` : ''}
            <span class="badge badge-${post.status}">${post.status}</span>
          </div>
          ${post.tags && post.tags.length ? `<div style="margin-top:10px">${post.tags.map(t => `<span class="hook-tag">${t}</span>`).join(' ')}</div>` : ''}
          <hr>
          <div style="white-space:pre-wrap;line-height:1.8">${post.content}</div>
          ${seo ? `
            <hr>
            <div style="font-family:'Syne',sans-serif;font-size:12px;font-weight:700;color:var(--accent);margin-bottom:8px">🔌 SEO Plugin Data</div>
            <dl class="seo-box">
              <dt>Meta Title</dt><dd>${seo.metaTitle}</dd>
              <dt>Meta Description</dt><dd>${seo.metaDescription}</dd>
              <dt>Keywords</dt><dd>${seo.keywords}</dd>
              <dt>Canonical URL</dt><dd><code>${seo.canonical}</code></dd>
            </dl>
          ` : ''}
        </div>
      </div>
    `
  });
}

function pluginsPage({ user, plugins }) {
  return layout({
    title: 'Plugin Manager', user, page: 'plugins',
    content: `
      <p class="text-muted mb-4">Manage plugins that extend CMS functionality via hooks and events.</p>
      <div class="plugins-grid">
        ${plugins.map(plugin => `
          <div class="plugin-card ${plugin.enabled ? 'enabled' : ''}">
            <div class="plugin-header">
              <div>
                <div class="plugin-name">${plugin.name}</div>
                <div class="plugin-version">v${plugin.version}</div>
              </div>
              <span class="badge badge-${plugin.enabled ? 'active' : 'inactive'}">${plugin.enabled ? 'Active' : 'Inactive'}</span>
            </div>
            <div class="plugin-desc">${plugin.description || 'No description'}</div>
            ${plugin.hooks.length ? `
              <div>
                <div class="text-muted text-sm" style="margin-bottom:6px">Hooks:</div>
                <div class="plugin-hooks">${plugin.hooks.map(h => `<span class="hook-tag">${h}</span>`).join('')}</div>
              </div>
            ` : ''}
            <form method="POST" action="/admin/plugins/${plugin.id}/${plugin.enabled ? 'disable' : 'enable'}">
              <button type="submit" class="btn ${plugin.enabled ? 'btn-danger' : 'btn-success'} btn-sm">
                ${plugin.enabled ? '⏸ Disable' : '▶ Enable'}
              </button>
            </form>
          </div>
        `).join('')}
      </div>
    `
  });
}

function usersPage({ user, users }) {
  return layout({
    title: 'Users', user, page: 'users',
    content: `
      <div class="flex justify-between items-center mb-4">
        <span class="text-muted">${users.length} user${users.length !== 1 ? 's' : ''}</span>
        <a href="/admin/users/new" class="btn btn-primary">+ Add User</a>
      </div>
      <div class="card">
        <table>
          <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Joined</th></tr></thead>
          <tbody>
            ${users.map(u => `
              <tr>
                <td style="font-weight:500">${u.name} ${u.id === user.userId ? '<span class="badge badge-active" style="font-size:10px">You</span>' : ''}</td>
                <td class="text-muted">${u.email}</td>
                <td><span class="badge badge-${u.role}">${u.role}</span></td>
                <td class="text-muted text-sm">${new Date(u.createdAt).toLocaleDateString()}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `
  });
}

function addUserPage({ user, error = '' }) {
  return layout({
    title: 'Add User', user, page: 'users',
    content: `
      ${error ? `<div class="error-msg">${error}</div>` : ''}
      <div class="card" style="max-width:480px">
        <div class="card-header">Create New User</div>
        <form method="POST" action="/admin/users/new" style="padding:20px">
          <div class="form-group"><label>Full Name</label><input type="text" name="name" required></div>
          <div class="form-group"><label>Email</label><input type="email" name="email" required></div>
          <div class="form-group"><label>Password</label><input type="password" name="password" required></div>
          <div class="form-group">
            <label>Role</label>
            <select name="role">
              <option value="editor">Editor</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div class="flex gap-2">
            <button type="submit" class="btn btn-primary">Create User</button>
            <a href="/admin/users" class="btn btn-ghost">Cancel</a>
          </div>
        </form>
      </div>
    `
  });
}

module.exports = { loginPage, dashboardPage, postsPage, postFormPage, postDetailPage, pluginsPage, usersPage, addUserPage };
