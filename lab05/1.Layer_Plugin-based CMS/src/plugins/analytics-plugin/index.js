/**
 * PLUGIN: Analytics Tracker
 * Tracks post views and reading statistics
 */
const db = require('../../layers/infrastructure/database');

const analyticsPlugin = {
  id: 'analytics-plugin',
  name: 'Analytics Tracker',
  version: '1.0.0',
  description: 'Tracks post views, reading time, and content statistics',

  hooks: {
    /**
     * post_view: Increment view counter each time a post is read
     */
    post_view: async (post) => {
      if (!post || !post.id) return post;
      const updated = db.updatePost(post.id, {
        views: (post.views || 0) + 1,
        lastViewedAt: new Date().toISOString()
      });
      if (updated) {
        post.views = updated.views;
        post.lastViewedAt = updated.lastViewedAt;
      }
      return post;
    },

    /**
     * after_post_save: Add reading time estimate
     */
    after_post_save: async (post) => {
      const wordCount = (post.content || '').split(/\s+/).length;
      const readingTime = Math.max(1, Math.round(wordCount / 200)); // avg 200wpm
      db.updatePost(post.id, { readingTime, wordCount });
      post.readingTime = readingTime;
      post.wordCount = wordCount;
      console.log(`[Analytics] Post "${post.title}" - ${wordCount} words, ~${readingTime} min read`);
      return post;
    },

    /**
     * before_post_delete: Log deletion event
     */
    before_post_delete: async (post) => {
      console.log(`[Analytics] Post deleted: "${post.title}" had ${post.views || 0} views`);
      return post;
    }
  },

  adminMenu: [
    {
      label: 'Analytics',
      path: '/admin/analytics',
      icon: '📊'
    }
  ],

  onActivate: async () => {
    console.log('[Analytics Plugin] Activated - Tracking post views and stats');
  },

  onDeactivate: async () => {
    console.log('[Analytics Plugin] Deactivated');
  }
};

module.exports = analyticsPlugin;
