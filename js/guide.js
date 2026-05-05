(function () {
  'use strict';

  // ── 상태 ──────────────────────────────────────────
  let currentLectureId = null;
  let currentToc = [];

  // ── DOM refs ──────────────────────────────────────
  const sidebar     = document.getElementById('guideSidebar');
  const lectureList = document.getElementById('guideLectureList');
  const contentEl   = document.getElementById('guideContent');
  const navEl       = document.getElementById('guideNav');
  const prevBtn     = document.getElementById('guidePrevBtn');
  const nextBtn     = document.getElementById('guideNextBtn');
  const overlay     = document.getElementById('guideOverlay');
  const hamburger   = document.getElementById('guideSidebarToggle');

  // ── 초기화 ────────────────────────────────────────
  function init() {
    GuideMarkdown.configure();
    renderSidebar();
    setupMobileToggle();
    setupNavButtons();

    // URL 해시 파싱해서 강 로드
    const { lectureId, sectionId } = parseHash(location.hash);
    if (lectureId) {
      loadLecture(lectureId, sectionId);
    } else {
      // 마지막 본 강 복원 (localStorage)
      const last = localStorage.getItem('guide-last-lecture');
      if (last && GUIDE_DATA.lectures.find(l => l.id === last)) {
        loadLecture(last);
      } else {
        loadLecture('index');
      }
    }

    window.addEventListener('hashchange', () => {
      const { lectureId, sectionId } = parseHash(location.hash);
      if (lectureId && lectureId !== currentLectureId) {
        loadLecture(lectureId, sectionId);
      } else if (sectionId) {
        scrollToSection(sectionId);
      }
    });
  }

  // ── 해시 파싱 ─────────────────────────────────────
  // #1, #1강, #index, #1/section-id, #index/section-id
  function parseHash(hash) {
    if (!hash || hash === '#') return {};
    const raw = decodeURIComponent(hash.slice(1)); // # 제거
    const [idPart, ...rest] = raw.split('/');
    const sectionId = rest.join('/') || null;

    // id 부분 정규화
    let lectureId = idPart.replace(/강$/, ''); // "1강" → "1"
    // 숫자면 0 패딩
    if (/^\d+$/.test(lectureId)) {
      lectureId = lectureId.padStart(2, '0');
    }
    // GUIDE_DATA에 존재하는지 확인
    const found = GUIDE_DATA.lectures.find(l => l.id === lectureId);
    if (!found) return {};
    return { lectureId: found.id, sectionId };
  }

  // ── 사이드바 렌더링 ───────────────────────────────
  function renderSidebar() {
    lectureList.innerHTML = '';
    GUIDE_DATA.lectures.forEach(lecture => {
      const item = document.createElement('div');
      item.className = 'guide-lecture-item';
      item.dataset.id = lecture.id;

      const btn = document.createElement('button');
      btn.className = 'guide-lecture-btn';
      btn.innerHTML = `
        <span class="guide-lecture-num">${escapeHtml(lecture.num)}</span>
        <span class="guide-lecture-title">${escapeHtml(lecture.title)}</span>
      `;
      btn.addEventListener('click', () => {
        loadLecture(lecture.id);
        closeSidebarOnMobile();
      });

      const toc = document.createElement('div');
      toc.className = 'guide-section-toc';
      toc.id = `guide-toc-${lecture.id}`;

      item.appendChild(btn);
      item.appendChild(toc);
      lectureList.appendChild(item);
    });
  }

  // ── 강 로드 ───────────────────────────────────────
  async function loadLecture(lectureId, scrollToId) {
    const lecture = GUIDE_DATA.lectures.find(l => l.id === lectureId);
    if (!lecture) return;

    currentLectureId = lectureId;
    localStorage.setItem('guide-last-lecture', lectureId);

    // 활성 상태 표시
    updateActiveLecture(lectureId);

    // 로딩 표시
    contentEl.innerHTML = '<div class="guide-loading">불러오는 중...</div>';
    navEl.style.display = 'none';

    try {
      const filePath = GUIDE_DATA.baseDir + lecture.file;
      const markdown = await GuideMarkdown.fetchLecture(filePath);
      const { html, toc, meta } = GuideMarkdown.render(markdown);

      currentToc = toc;
      contentEl.innerHTML = buildMetaCard(meta) + html;

      // 본문 내 .md 링크 클릭 핸들러
      setupContentLinks();

      // 사이드바 TOC 업데이트
      updateToc(lectureId, toc);

      // 이전/다음 버튼 업데이트
      updateNav(lectureId);

      // 해시 업데이트
      const newHash = '#' + lectureId;
      if (location.hash !== newHash) {
        history.replaceState(null, '', newHash);
      }

      // 섹션 스크롤
      if (scrollToId) {
        requestAnimationFrame(() => scrollToSection(scrollToId));
      } else {
        window.scrollTo({ top: 0, behavior: 'instant' });
      }

    } catch (err) {
      contentEl.innerHTML = `<div class="guide-error">강의를 불러올 수 없습니다.<br><small>${escapeHtml(err.message)}</small></div>`;
    }
  }

  // ── 활성 강 표시 업데이트 ─────────────────────────
  function updateActiveLecture(lectureId) {
    document.querySelectorAll('.guide-lecture-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    document.querySelectorAll('.guide-section-toc').forEach(toc => {
      toc.classList.remove('open');
    });

    const item = lectureList.querySelector(`.guide-lecture-item[data-id="${lectureId}"]`);
    if (item) {
      item.querySelector('.guide-lecture-btn').classList.add('active');
    }
  }

  // ── 사이드바 TOC 업데이트 (아코디언 열기) ─────────
  function updateToc(lectureId, toc) {
    const tocContainer = document.getElementById(`guide-toc-${lectureId}`);
    if (!tocContainer) return;

    tocContainer.innerHTML = '';

    if (toc.length === 0) {
      tocContainer.classList.remove('open');
      return;
    }

    toc.forEach(item => {
      const btn = document.createElement('button');
      btn.className = 'guide-section-link' + (item.level === 3 ? ' level-3' : '');
      btn.textContent = item.text;
      btn.dataset.sectionId = item.id;
      btn.addEventListener('click', () => {
        scrollToSection(item.id);
        updateActiveSection(item.id);
        closeSidebarOnMobile();
      });
      tocContainer.appendChild(btn);
    });

    tocContainer.classList.add('open');

    // 스크롤 감지로 활성 섹션 업데이트
    setupScrollSpy();
  }

  // ── 섹션 스크롤 ───────────────────────────────────
  function scrollToSection(sectionId) {
    const el = document.getElementById(sectionId);
    if (el) {
      const headerH = 48;
      const top = el.getBoundingClientRect().top + window.scrollY - headerH - 12;
      window.scrollTo({ top, behavior: 'smooth' });
      updateActiveSection(sectionId);
    }
  }

  // ── 활성 섹션 표시 ────────────────────────────────
  function updateActiveSection(sectionId) {
    document.querySelectorAll('.guide-section-link').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.sectionId === sectionId);
    });
  }

  // ── 스크롤 스파이 ─────────────────────────────────
  let scrollSpyTimer = null;
  function setupScrollSpy() {
    window.removeEventListener('scroll', onScroll);
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  function onScroll() {
    if (scrollSpyTimer) return;
    scrollSpyTimer = requestAnimationFrame(() => {
      scrollSpyTimer = null;
      if (currentToc.length === 0) return;
      const headerH = 48 + 20;
      let active = null;
      for (const item of currentToc) {
        const el = document.getElementById(item.id);
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        if (rect.top <= headerH) active = item.id;
        else break;
      }
      if (active) updateActiveSection(active);
    });
  }

  // ── 이전/다음 네비 ────────────────────────────────
  function updateNav(lectureId) {
    const lectures = GUIDE_DATA.lectures;
    const idx = lectures.findIndex(l => l.id === lectureId);

    prevBtn.disabled = (idx <= 0);
    nextBtn.disabled = (idx >= lectures.length - 1);

    prevBtn.dataset.targetId = idx > 0 ? lectures[idx - 1].id : '';
    nextBtn.dataset.targetId = idx < lectures.length - 1 ? lectures[idx + 1].id : '';

    navEl.style.display = 'flex';
  }

  function setupNavButtons() {
    prevBtn.addEventListener('click', () => {
      if (prevBtn.dataset.targetId) loadLecture(prevBtn.dataset.targetId);
    });
    nextBtn.addEventListener('click', () => {
      if (nextBtn.dataset.targetId) loadLecture(nextBtn.dataset.targetId);
    });
  }

  // ── 본문 내 .md 링크 핸들러 ───────────────────────
  function setupContentLinks() {
    contentEl.querySelectorAll('a[data-lecture-link]').forEach(a => {
      a.addEventListener('click', e => {
        e.preventDefault();
        const href = a.getAttribute('data-lecture-link');
        // 파일명에서 강 id 추출 (예: ./04강_숏폼%20끝내기.md → "04")
        const match = href.match(/(\d+)강_/);
        if (match) {
          const id = match[1].padStart(2, '0');
          loadLecture(id);
        } else if (href.includes('00_') || href.includes('인덱스')) {
          loadLecture('index');
        }
      });
    });
  }

  // ── 모바일 햄버거 토글 ────────────────────────────
  function setupMobileToggle() {
    hamburger.addEventListener('click', () => {
      sidebar.classList.toggle('open');
      overlay.classList.toggle('open');
    });
    overlay.addEventListener('click', () => {
      closeSidebar();
    });
  }

  function closeSidebarOnMobile() {
    if (window.innerWidth <= 700) closeSidebar();
  }

  function closeSidebar() {
    sidebar.classList.remove('open');
    overlay.classList.remove('open');
  }

  // ── 메타 카드 빌드 ────────────────────────────────
  function buildMetaCard(meta) {
    if (!meta || Object.keys(meta).length === 0) return '';

    const items = [];

    if (meta['강']) {
      items.push(`<span class="lecture-meta-item"><strong>강</strong> ${escapeHtml(meta['강'])}</span>`);
    }
    if (meta['시간']) {
      items.push(`<span class="lecture-meta-item"><strong>시간</strong> ${escapeHtml(meta['시간'])}</span>`);
    }
    if (meta['난이도']) {
      items.push(`<span class="lecture-meta-item"><strong>난이도</strong> ${escapeHtml(meta['난이도'])}</span>`);
    }
    if (meta['강사']) {
      items.push(`<span class="lecture-meta-item"><strong>강사</strong> ${escapeHtml(meta['강사'])}</span>`);
    }

    let tagsHtml = '';
    const tagSrc = meta['태그'] || meta['tags'];
    if (tagSrc) {
      const tagStr = tagSrc.replace(/^\[|\]$/g, '').trim();
      const tags = tagStr.split(',').map(t => t.trim()).filter(Boolean);
      if (tags.length > 0) {
        tagsHtml = `<span class="lecture-meta-tags">${tags.map(escapeHtml).join(' · ')}</span>`;
      }
    }

    if (items.length === 0 && !tagsHtml) return '';

    return `<div class="lecture-meta">${items.join('')}${tagsHtml}</div>`;
  }

  // ── 시작 ─────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', init);
})();
