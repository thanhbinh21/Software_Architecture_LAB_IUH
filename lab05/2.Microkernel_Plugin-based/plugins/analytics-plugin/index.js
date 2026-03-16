/**
 * ANALYTICS PLUGIN
 * Tracks content events: views, creates, updates, deletes.
 * Provides a stats service and aggregated report API.
 */
const { BasePlugin } = require('../../core/base-plugin');

class AnalyticsPlugin extends BasePlugin {
  static meta = {
    name: 'analytics-plugin',
    displayName: '📊 Theo doi thong ke',
    version: '1.0.0',
    description: 'Theo doi luot xem, tao moi, cap nhat, xoa va cung cap thong ke theo thoi gian thuc.',
    author: 'MicroCMS Team',
    dependencies: [],
    color: '#f59e0b',
  };

  constructor(kernel) {
    super(kernel);
    this._stats = {
      views: 0,
      creates: 0,
      updates: 0,
      deletes: 0,
    };
    this._topPosts = new Map();   // id -> { title, views }
    this._feed = [];              // recent activity
  }

  async activate() {
    this._onView    = (post) => this._track('views', post);
    this._onCreate  = (post) => this._track('creates', post);
    this._onUpdate  = (post) => this._track('updates', post);
    this._onDelete  = (post) => this._track('deletes', post);

    this.kernel.events.on('content:viewed',  this._onView);
    this.kernel.events.on('content:created', this._onCreate);
    this.kernel.events.on('content:updated', this._onUpdate);
    this.kernel.events.on('content:deleted', this._onDelete);

    this.kernel.services.register('analytics', {
      getStats: () => ({ ...this._stats }),
      getFeed:  () => [...this._feed],
      getTopPosts: () => this._getTopPosts(),
    });

    console.log('[Analytics Plugin] Activated — event tracking live');
  }

  async deactivate() {
    this.kernel.events.off('content:viewed',  this._onView);
    this.kernel.events.off('content:created', this._onCreate);
    this.kernel.events.off('content:updated', this._onUpdate);
    this.kernel.events.off('content:deleted', this._onDelete);
    if (this.kernel.services.has('analytics')) this.kernel.services.unregister('analytics');
    console.log('[Analytics Plugin] Deactivated');
  }

  _track(type, post) {
    this._stats[type]++;

    if (type === 'views') {
      const entry = this._topPosts.get(post.id) || { title: post.title, views: 0 };
      entry.views++;
      this._topPosts.set(post.id, entry);
    }

    const icons = { views: '👁️', creates: '✏️', updates: '🔄', deletes: '🗑️' };
    const labels = { views: 'Da xem', creates: 'Da tao', updates: 'Da cap nhat', deletes: 'Da xoa' };

    this._feed.unshift({
      icon: icons[type],
      action: `${labels[type]}: "${post.title}"`,
      timestamp: new Date().toISOString(),
    });

    if (this._feed.length > 50) this._feed.pop();
  }

  _getTopPosts() {
    return Array.from(this._topPosts.entries())
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 5);
  }
}

module.exports = AnalyticsPlugin;
