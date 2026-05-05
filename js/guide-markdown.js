const GuideMarkdown = {
  _toc: [],
  _idCounts: {},

  // marked 설정
  configure() {
    const self = this;

    const renderer = {
      heading(token) {
        const depth = token.depth;
        const text = token.text || '';
        const id = self._makeId(text);

        // toc에 h2, h3만 추가
        if (depth === 2 || depth === 3) {
          self._toc.push({ level: depth, text, id });
        }

        const inner = (token.tokens && this.parser)
          ? this.parser.parseInline(token.tokens)
          : escapeHtml(text);
        return `<h${depth} id="${id}">${inner}</h${depth}>\n`;
      },

      // .md 파일 링크에 data-lecture-link 부여
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
      }
    };

    marked.use({
      gfm: true,
      breaks: false,
      renderer
    });
  },

  // 한글 포함 슬러그 생성 (중복 방지)
  _makeId(text) {
    // HTML 태그 제거, 특수문자 제거, 공백→하이픈, 소문자
    let slug = text
      .replace(/<[^>]+>/g, '')          // HTML 태그 제거
      .replace(/[^\w\s가-힣]/g, '') // 한글·영숫자·공백만 남김
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

  // 마크다운 → { html, toc }
  render(markdown) {
    this._toc = [];
    this._idCounts = {};

    const html = marked.parse(markdown);
    const toc = [...this._toc];

    return { html, toc };
  },

  // 마크다운 파일 fetch (한글 경로 안전)
  async fetchLecture(filePath) {
    // encodeURI: 경로 구분자(/)·콜론 등은 유지하면서 한글·공백만 인코딩
    const encoded = encodeURI(filePath);
    const res = await fetch(encoded);
    if (!res.ok) {
      throw new Error(`파일을 불러올 수 없습니다: ${filePath} (${res.status})`);
    }
    return res.text();
  }
};

// escapeHtml helper (guide-markdown 내부용, 전역에 없을 경우 대비)
if (typeof escapeHtml === 'undefined') {
  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  }
}
