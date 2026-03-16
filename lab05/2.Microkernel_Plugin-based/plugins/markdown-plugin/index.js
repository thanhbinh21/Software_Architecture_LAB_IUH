/**
 * MARKDOWN PLUGIN
 * Converts Markdown in post bodies to HTML on read.
 * Registers a 'renderer' service for use in templates.
 */
const { BasePlugin } = require('../../core/base-plugin');

class MarkdownPlugin extends BasePlugin {
  static meta = {
    name: 'markdown-plugin',
    displayName: '📝 Trinh render Markdown',
    version: '1.0.0',
    description: 'Render cu phap Markdown sang HTML, ho tro tieu de, dam, nghieng, code block, danh sach va lien ket.',
    author: 'MicroCMS Team',
    dependencies: [],
    color: '#6366f1',
  };

  async activate() {
    this._onBeforeCreate = async (data) => this._process(data);
    this._onBeforeUpdate = async (data) => this._process(data);

    this.kernel.events.on('content:before-create', this._onBeforeCreate);
    this.kernel.events.on('content:before-update', this._onBeforeUpdate);

    this.kernel.services.register('markdown', {
      render: this._render.bind(this),
    });

    console.log('[Markdown Plugin] Activated — rendering pipeline ready');
  }

  async deactivate() {
    this.kernel.events.off('content:before-create', this._onBeforeCreate);
    this.kernel.events.off('content:before-update', this._onBeforeUpdate);
    if (this.kernel.services.has('markdown')) this.kernel.services.unregister('markdown');
    console.log('[Markdown Plugin] Deactivated');
  }

  _process(data) {
    if (data.body) {
      return { ...data, renderedHtml: this._render(data.body) };
    }
    return data;
  }

  _render(markdown) {
    let html = markdown;

    // Fenced code blocks
    html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) =>
      `<pre><code class="lang-${lang || 'text'}">${this._escape(code.trim())}</code></pre>`
    );

    // Inline code
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

    // Headings
    html = html.replace(/^######\s(.+)$/gm, '<h6>$1</h6>');
    html = html.replace(/^#####\s(.+)$/gm, '<h5>$1</h5>');
    html = html.replace(/^####\s(.+)$/gm, '<h4>$1</h4>');
    html = html.replace(/^###\s(.+)$/gm, '<h3>$1</h3>');
    html = html.replace(/^##\s(.+)$/gm, '<h2>$1</h2>');
    html = html.replace(/^#\s(.+)$/gm, '<h1>$1</h1>');

    // Bold & italic
    html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
    html = html.replace(/__(.+?)__/g, '<strong>$1</strong>');
    html = html.replace(/_(.+?)_/g, '<em>$1</em>');

    // Blockquotes
    html = html.replace(/^>\s(.+)$/gm, '<blockquote>$1</blockquote>');

    // Unordered lists
    html = html.replace(/^[-*+]\s(.+)$/gm, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>\n?)+/g, m => `<ul>${m}</ul>`);

    // Ordered lists
    html = html.replace(/^\d+\.\s(.+)$/gm, '<li>$1</li>');

    // Links & images
    html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img alt="$1" src="$2">');
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');

    // Horizontal rule
    html = html.replace(/^---$/gm, '<hr>');

    // Paragraphs (lines not already wrapped)
    html = html.replace(/^(?!<[a-z]|$)(.+)$/gm, '<p>$1</p>');

    return html;
  }

  _escape(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
}

module.exports = MarkdownPlugin;
