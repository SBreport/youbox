const FRONTMATTER_RE = /^---\s*\n([\s\S]*?)\n---\s*\n/;

function parseFrontmatter(raw) {
  const meta = {};
  raw.split('\n').forEach(line => {
    const colon = line.indexOf(':');
    if (colon < 1) return;
    const key = line.slice(0, colon).trim();
    const val = line.slice(colon + 1).trim();
    if (key) meta[key] = val;
  });
  return meta;
}

function extractFirstText(token) {
  const first = token.tokens && token.tokens[0];
  if (!first) return '';
  if (first.type === 'paragraph' && first.tokens && first.tokens[0]) {
    const t = first.tokens[0];
    return t.raw || t.text || '';
  }
  return first.raw || first.text || '';
}

function calloutLabel(type) {
  const labels = {
    tip:       '💡 TIP',
    important: '⭐ 중요',
    warning:   '⚠️ 주의',
    note:      '📝 NOTE',
    caution:   '🚨 경고'
  };
  return labels[type] || type.toUpperCase();
}

const GuideMarkdown = {
  _toc: [],
  _idCounts: {},

  configure() {
    const self = this;

    const renderer = {
      heading(token) {
        const depth = token.depth;
        const text = token.text || '';
        const id = self._makeId(text);

        if (depth === 2 || depth === 3) {
          self._toc.push({ level: depth, text, id });
        }

        const inner = (token.tokens && this.parser)
          ? this.parser.parseInline(token.tokens)
          : escapeHtml(text);
        return `<h${depth} id="${id}">${inner}</h${depth}>\n`;
      },

      link(token) {
        const href = token.href || '';
        const title = token.title;
        const text = token.text || '';
        const inner = (token.tokens && this.parser)
          ? this.parser.parseInline(token.tokens)
          : escapeHtml(text);
        const titleAttr = title ? ` title="${escapeHtml(title)}"` : '';
        if (href.match(/\.md(\?.*)?$/i)) {
          const safeHref = escapeHtml(href);
          return `<a href="${safeHref}"${titleAttr} data-lecture-link="${safeHref}">${inner}</a>`;
        }
        const safeHref = escapeHtml(href);
        return `<a href="${safeHref}"${titleAttr} target="_blank" rel="noopener">${inner}</a>`;
      },

      blockquote(token) {
        const inner = marked.Parser.parse(token.tokens, marked.getDefaults());

        const firstText = extractFirstText(token);
        const m = firstText && firstText.match(/^\s*\[!(TIP|IMPORTANT|WARNING|NOTE|CAUTION)\]/i);

        if (m) {
          const type = m[1].toLowerCase();
          // 렌더된 HTML에서 [!TYPE] 라벨 제거 (줄바꿈 포함)
          const cleaned = inner.replace(/\[!(TIP|IMPORTANT|WARNING|NOTE|CAUTION)\]\n?/i, '');
          return `<blockquote class="callout callout-${type}"><div class="callout-label">${calloutLabel(type)}</div><div class="callout-content">${cleaned}</div></blockquote>\n`;
        }

        return `<blockquote>${inner}</blockquote>\n`;
      }
    };

    marked.use({
      gfm: true,
      breaks: false,
      renderer
    });
  },

  _makeId(text) {
    let slug = text
      .replace(/<[^>]+>/g, '')
      .replace(/[^\w\s가-힣]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .toLowerCase();

    if (!slug) slug = 'heading';

    if (this._idCounts[slug] === undefined) {
      this._idCounts[slug] = 0;
      return slug;
    } else {
      this._idCounts[slug]++;
      return `${slug}-${this._idCounts[slug] + 1}`;
    }
  },

  render(markdown) {
    this._toc = [];
    this._idCounts = {};

    let body = markdown;
    let meta = {};

    const fmMatch = markdown.match(FRONTMATTER_RE);
    if (fmMatch) {
      meta = parseFrontmatter(fmMatch[1]);
      body = markdown.slice(fmMatch[0].length);
    }

    const preprocessed = body.replace(/([가-힣\w])~([가-힣\w])/g, '$1&#126;$2');
    const html = marked.parse(preprocessed);
    const toc = [...this._toc];

    return { html, toc, meta };
  },

  async fetchLecture(filePath) {
    const encoded = encodeURI(filePath);
    const res = await fetch(encoded);
    if (!res.ok) {
      throw new Error(`파일을 불러올 수 없습니다: ${filePath} (${res.status})`);
    }
    return res.text();
  }
};

if (typeof escapeHtml === 'undefined') {
  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  }
}
