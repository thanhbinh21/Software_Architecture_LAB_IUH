/**
 * PLUGIN: SEO Optimizer
 * Automatically adds SEO metadata to posts before saving
 */

const seoPlugin = {
  id: 'seo-plugin',
  name: 'SEO Optimizer',
  version: '1.0.0',
  description: 'Auto-generates SEO metadata (meta description, keywords) for posts',

  hooks: {
    /**
     * before_post_save: Enrich post with SEO fields
     */
    before_post_save: async (post) => {
      // Auto-generate meta description from content
      const plainText = post.content.replace(/<[^>]*>/g, '').replace(/\n+/g, ' ').trim();
      post.seo = {
        metaTitle: post.title + ' | My CMS',
        metaDescription: plainText.substring(0, 160) + (plainText.length > 160 ? '...' : ''),
        keywords: seoPlugin._extractKeywords(post.title + ' ' + plainText),
        canonical: `/posts/${post.slug}`,
        generatedAt: new Date().toISOString()
      };
      console.log(`[SEO Plugin] Generated SEO metadata for: "${post.title}"`);
      return post;
    },

    /**
     * after_post_update: Refresh SEO on edit
     */
    after_post_update: async (post) => {
      if (post) {
        const plainText = (post.content || '').replace(/<[^>]*>/g, '').replace(/\n+/g, ' ').trim();
        post.seo = {
          ...post.seo,
          metaTitle: post.title + ' | My CMS',
          metaDescription: plainText.substring(0, 160),
          keywords: seoPlugin._extractKeywords(post.title + ' ' + plainText),
          updatedAt: new Date().toISOString()
        };
      }
      return post;
    }
  },

  onActivate: async () => {
    console.log('[SEO Plugin] Activated - Will auto-generate SEO metadata for all posts');
  },

  onDeactivate: async () => {
    console.log('[SEO Plugin] Deactivated');
  },

  // Helper: naive keyword extraction
  _extractKeywords(text) {
    const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'is', 'are', 'was', 'be', 'this', 'that', 'it']);
    const words = text.toLowerCase().match(/\b[a-z]{3,}\b/g) || [];
    const freq = {};
    for (const w of words) {
      if (!stopWords.has(w)) freq[w] = (freq[w] || 0) + 1;
    }
    return Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([w]) => w)
      .join(', ');
  }
};

module.exports = seoPlugin;
