/**
 * SEO PLUGIN
 * Hooks into content lifecycle to auto-generate:
 * - URL slugs from titles
 * - Meta descriptions (truncated body)
 * - Reading time estimates
 */
const { BasePlugin } = require('../../core/base-plugin');

class SeoPlugin extends BasePlugin {
  static meta = {
    name: 'seo-plugin',
    displayName: '🔍 Toi uu SEO',
    version: '1.0.0',
    description: 'Tu dong tao slug, mo ta meta va thoi gian doc cho noi dung.',
    author: 'MicroCMS Team',
    dependencies: [],
    color: '#10b981',
  };

  async activate() {
    this._onBeforeCreate = async (data) => this._enrich(data);
    this._onBeforeUpdate = async (data) => this._enrich(data);

    this.kernel.events.on('content:before-create', this._onBeforeCreate);
    this.kernel.events.on('content:before-update', this._onBeforeUpdate);

    // Register as a service so other plugins can use it
    if (!this.kernel.services.has('seo')) {
      this.kernel.services.register('seo', {
        generateSlug: this._generateSlug,
        readingTime: this._readingTime,
        metaDescription: this._metaDescription,
      });
    }

    console.log('[SEO Plugin] Activated — hooking into content lifecycle');
  }

  async deactivate() {
    this.kernel.events.off('content:before-create', this._onBeforeCreate);
    this.kernel.events.off('content:before-update', this._onBeforeUpdate);
    if (this.kernel.services.has('seo')) this.kernel.services.unregister('seo');
    console.log('[SEO Plugin] Deactivated');
  }

  _enrich(data) {
    return {
      ...data,
      slug: this._generateSlug(data.title || ''),
      metaDescription: this._metaDescription(data.body || ''),
      readingTime: this._readingTime(data.body || ''),
    };
  }

  _generateSlug(title) {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }

  _metaDescription(body) {
    const plain = body.replace(/[#*`_\[\]()]/g, '').replace(/\s+/g, ' ').trim();
    return plain.length > 160 ? plain.slice(0, 157) + '...' : plain;
  }

  _readingTime(body) {
    const words = body.trim().split(/\s+/).length;
    const mins = Math.max(1, Math.round(words / 200));
    return `${mins} phut doc`;
  }
}

module.exports = SeoPlugin;
