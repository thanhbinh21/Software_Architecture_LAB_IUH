/**
 * BUSINESS LAYER - Post Service
 * CRUD operations + plugin hook integration
 */
const db = require('../infrastructure/database');
const { generateId } = require('../infrastructure/crypto');
const pluginManager = require('../../core/pluginManager');

class PostService {
  /**
   * Create a new post
   */
  async createPost({ title, content, status = 'draft', authorId, authorName, tags = [] }) {
    if (!title || !content) throw new Error('Title and content are required');

    let post = {
      id: generateId(),
      title: title.trim(),
      content,
      status,
      authorId,
      authorName,
      tags,
      slug: this._slugify(title),
      views: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // 🔌 Plugin Hook: before_post_save
    post = await pluginManager.executeHook('before_post_save', post);

    db.createPost(post);

    // 🔌 Plugin Hook: after_post_save
    await pluginManager.executeHook('after_post_save', post);

    return post;
  }

  /**
   * Get all posts with optional filters
   */
  async getAllPosts({ status, authorId } = {}) {
    let posts = db.getAllPosts();
    if (status) posts = posts.filter(p => p.status === status);
    if (authorId) posts = posts.filter(p => p.authorId === authorId);
    return posts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  /**
   * Get single post by ID
   */
  async getPostById(id) {
    const post = db.getPostById(id);
    if (!post) throw new Error('Post not found');

    // 🔌 Plugin Hook: post_view (for analytics, view count, etc.)
    const enriched = await pluginManager.executeHook('post_view', post);
    return enriched;
  }

  /**
   * Update post
   */
  async updatePost(id, updates, userId, userRole) {
    const post = db.getPostById(id);
    if (!post) throw new Error('Post not found');

    // Only author or admin can edit
    if (post.authorId !== userId && userRole !== 'admin') {
      throw new Error('Permission denied');
    }

    let updatedPost = db.updatePost(id, {
      ...updates,
      slug: updates.title ? this._slugify(updates.title) : post.slug
    });

    // 🔌 Plugin Hook: after_post_update
    await pluginManager.executeHook('after_post_update', updatedPost);

    return updatedPost;
  }

  /**
   * Delete post
   */
  async deletePost(id, userId, userRole) {
    const post = db.getPostById(id);
    if (!post) throw new Error('Post not found');

    if (post.authorId !== userId && userRole !== 'admin') {
      throw new Error('Permission denied');
    }

    // 🔌 Plugin Hook: before_post_delete
    await pluginManager.executeHook('before_post_delete', post);

    db.deletePost(id);
    return true;
  }

  /**
   * Publish/unpublish a post
   */
  async toggleStatus(id, userId, userRole) {
    const post = db.getPostById(id);
    if (!post) throw new Error('Post not found');
    if (post.authorId !== userId && userRole !== 'admin') throw new Error('Permission denied');

    const newStatus = post.status === 'published' ? 'draft' : 'published';
    return db.updatePost(id, { status: newStatus });
  }

  /**
   * Stats for dashboard
   */
  async getStats() {
    const posts = db.getAllPosts();
    return {
      total: posts.length,
      published: posts.filter(p => p.status === 'published').length,
      drafts: posts.filter(p => p.status === 'draft').length,
      totalViews: posts.reduce((sum, p) => sum + (p.views || 0), 0)
    };
  }

  _slugify(text) {
    return text.toLowerCase()
      .replace(/[àáâãäå]/g, 'a').replace(/[èéêë]/g, 'e')
      .replace(/[ìíîï]/g, 'i').replace(/[òóôõö]/g, 'o')
      .replace(/[ùúûü]/g, 'u').replace(/[ñ]/g, 'n')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }
}

module.exports = new PostService();
