// home.js — 홈 페이지 로직

(function() {
  const listEl = () => document.getElementById('projectList');
  const emptyEl = () => document.getElementById('emptyState');

  const FILTER_KEY = 'yw-type-filter';

  function getFilter() {
    return localStorage.getItem(FILTER_KEY) || 'all';
  }

  function setFilter(val) {
    localStorage.setItem(FILTER_KEY, val);
  }

  function typeBadgeHtml(type, shortformMode) {
    if (type === 'shortform') {
      const label = shortformMode === 'key' ? '🎬 숏폼·키' : '🎬 숏폼';
      return `<span class="project-type-badge shortform">${label}</span>`;
    }
    return `<span class="project-type-badge longform">📝 롱폼</span>`;
  }

  function render() {
    const filter = getFilter();
    const filterEl = document.getElementById('projectTypeFilter');
    if (filterEl) filterEl.value = filter;

    let projects = ProjectsDB.list().sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
    if (filter !== 'all') {
      projects = projects.filter(p => (p.type || 'longform') === filter);
    }

    const list = listEl();
    list.innerHTML = '';

    if (projects.length === 0) {
      emptyEl().style.display = 'block';
      document.getElementById('projectsCount').textContent = '';
      return;
    }
    emptyEl().style.display = 'none';
    document.getElementById('projectsCount').textContent = `(${projects.length})`;

    for (const p of projects) {
      const card = document.createElement('div');
      card.className = 'project-card';
      const timeAgo = _timeAgo(p.updatedAt);
      const progress = p.progress || {};
      const pType = p.type || 'longform';
      const badge = typeBadgeHtml(pType, p.shortformMode);
      card.innerHTML = `
        <div class="project-card-main" data-id="${p.id}" data-type="${pType}">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
            <div class="project-card-title" style="margin-bottom:0;">${escapeHtml(p.title || '제목 없음')}</div>
            ${badge}
          </div>
          <div class="project-card-meta">
            <span class="chapter-dot ${progress.c1 ? 'done' : ''}" title="기획">1</span>
            <span class="chapter-dot ${progress.c2 ? 'done' : ''}" title="원고">2</span>
            <span class="chapter-dot ${progress.c3 ? 'done' : ''}" title="B-roll">3</span>
            <span class="project-card-time">수정 ${timeAgo}</span>
          </div>
        </div>
        <div class="project-card-actions">
          <button class="btn-icon" data-act="open" data-id="${p.id}" data-type="${pType}" title="열기">&rarr;</button>
          <button class="btn-icon" data-act="duplicate" data-id="${p.id}" title="복제">&#10697;</button>
          <button class="btn-icon" data-act="export" data-id="${p.id}" title="ZIP 내보내기">&#8615;</button>
          <button class="btn-icon danger" data-act="delete" data-id="${p.id}" title="삭제">&#10005;</button>
        </div>`;
      list.appendChild(card);
    }

    // Event delegation
    list.onclick = async (e) => {
      const actBtn = e.target.closest('[data-act]');
      if (actBtn) {
        e.stopPropagation();
        const id = actBtn.dataset.id;
        const act = actBtn.dataset.act;
        if (act === 'open') openProject(id, actBtn.dataset.type);
        else if (act === 'duplicate') {
          await ProjectsDB.duplicate(id);
          render();
        } else if (act === 'export') {
          await ProjectZip.exportProject(id);
        } else if (act === 'delete') {
          const entry = ProjectsDB.list().find(p => p.id === id);
          if (confirm(`"${entry?.title || '프로젝트'}"를 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`)) {
            await ProjectsDB.remove(id);
            render();
          }
        }
        return;
      }
      const main = e.target.closest('.project-card-main');
      if (main) openProject(main.dataset.id, main.dataset.type);
    };
  }

  function openProject(id, type) {
    const dest = (type === 'shortform') ? 'shortform.html' : 'project.html';
    window.location.href = `${dest}?id=${encodeURIComponent(id)}`;
  }

  function _timeAgo(iso) {
    if (!iso) return '';
    const then = new Date(iso).getTime();
    const now = Date.now();
    const sec = Math.floor((now - then) / 1000);
    if (sec < 60) return '방금';
    if (sec < 3600) return Math.floor(sec / 60) + '분 전';
    if (sec < 86400) return Math.floor(sec / 3600) + '시간 전';
    if (sec < 86400 * 7) return Math.floor(sec / 86400) + '일 전';
    return new Date(iso).toLocaleDateString('ko-KR');
  }

  // ── Filter ──
  document.getElementById('projectTypeFilter').onchange = (e) => {
    setFilter(e.target.value);
    render();
  };

  // ── New project modal ──
  const modal = document.getElementById('newProjectModal');

  function openNewProjectModal() {
    document.getElementById('npTitleInput').value = '';
    document.querySelector('input[name="npType"][value="longform"]').checked = true;
    document.querySelector('input[name="npMode"][value="pulling"]').checked = true;
    document.getElementById('npModeSection').style.display = 'none';
    _updateTypeCards();
    _updateModeCards();
    modal.classList.add('show');
    setTimeout(() => document.getElementById('npTitleInput').focus(), 50);
  }

  function closeNewProjectModal() {
    modal.classList.remove('show');
  }

  function _updateTypeCards() {
    const val = document.querySelector('input[name="npType"]:checked')?.value;
    document.getElementById('npTypeLongform').classList.toggle('selected', val === 'longform');
    document.getElementById('npTypeShortform').classList.toggle('selected', val === 'shortform');
    document.getElementById('npModeSection').style.display = (val === 'shortform') ? 'block' : 'none';
  }

  function _updateModeCards() {
    const val = document.querySelector('input[name="npMode"]:checked')?.value;
    document.getElementById('npModePulling').classList.toggle('selected', val === 'pulling');
    document.getElementById('npModeKey').classList.toggle('selected', val === 'key');
  }

  document.getElementById('newProjectBtn').onclick = openNewProjectModal;

  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeNewProjectModal();
  });

  document.getElementById('npCancelBtn').onclick = closeNewProjectModal;

  // Type card click
  document.getElementById('npTypeLongform').onclick = () => {
    document.querySelector('input[name="npType"][value="longform"]').checked = true;
    _updateTypeCards();
  };
  document.getElementById('npTypeShortform').onclick = () => {
    document.querySelector('input[name="npType"][value="shortform"]').checked = true;
    _updateTypeCards();
  };

  // Mode card click
  document.getElementById('npModePulling').onclick = () => {
    document.querySelector('input[name="npMode"][value="pulling"]').checked = true;
    _updateModeCards();
  };
  document.getElementById('npModeKey').onclick = () => {
    document.querySelector('input[name="npMode"][value="key"]').checked = true;
    _updateModeCards();
  };

  document.getElementById('npTitleInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') document.getElementById('npCreateBtn').click();
    if (e.key === 'Escape') closeNewProjectModal();
  });

  document.getElementById('npCreateBtn').onclick = () => {
    const title = document.getElementById('npTitleInput').value.trim() || '새 프로젝트';
    const type = document.querySelector('input[name="npType"]:checked')?.value || 'longform';
    const shortformMode = document.querySelector('input[name="npMode"]:checked')?.value || 'pulling';
    const p = ProjectsDB.create({ title, type, shortformMode });
    closeNewProjectModal();
    openProject(p.id, type);
  };

  // ── Import ZIP ──
  const zipInput = document.getElementById('zipFileInput');
  document.getElementById('importZipBtn').onclick = () => zipInput.click();
  zipInput.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    await _handleZipImport(file);
    zipInput.value = '';
  };

  async function _handleZipImport(file) {
    try {
      const result = await ProjectZip.importZip(file);
      if (Array.isArray(result)) {
        alert(`${result.length}개 프로젝트를 가져왔습니다.`);
      } else if (result) {
        alert(`"${result.thumbResearch?.myVideoTitle || result.name}" 프로젝트를 가져왔습니다.`);
      }
      render();
    } catch (e) {
      console.error(e);
      alert('ZIP 파일을 읽을 수 없습니다: ' + e.message);
    }
  }

  // ── Drag & drop ZIP on body ──
  document.body.addEventListener('dragover', (e) => { e.preventDefault(); });
  document.body.addEventListener('drop', async (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith('.zip')) await _handleZipImport(file);
  });

  // ── Export all ──
  document.getElementById('exportAllBtn').onclick = async () => {
    if (ProjectsDB.list().length === 0) { alert('내보낼 프로젝트가 없습니다.'); return; }
    await ProjectZip.exportAll();
  };

  // ── Help modal ──
  document.getElementById('helpBtn').onclick = () => {
    document.getElementById('helpModal').classList.add('show');
  };
  document.getElementById('helpCloseBtn').onclick = () => {
    document.getElementById('helpModal').classList.remove('show');
  };
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') document.getElementById('helpModal').classList.remove('show');
  });

  // ── v2 migration ──
  (function checkV2() {
    const items = ProjectsDB.detectV2Data();
    if (items.length === 0) return;
    const banner = document.getElementById('migrationBanner');
    const msgEl = document.getElementById('migrationMsg');
    msgEl.textContent = `이전 버전의 작업 ${items.length}개가 있습니다. v3 프로젝트로 가져올까요?`;
    banner.style.display = 'flex';
    document.getElementById('migrateYesBtn').onclick = () => {
      items.forEach(item => ProjectsDB.migrateV2(item));
      ProjectsDB.clearV2();
      banner.style.display = 'none';
      render();
    };
    document.getElementById('migrateNoBtn').onclick = () => {
      if (confirm('이전 작업 데이터를 삭제할까요? 이 작업은 되돌릴 수 없습니다.')) {
        ProjectsDB.clearV2();
        banner.style.display = 'none';
      }
    };
  })();

  // ── Init ──
  render();
})();
