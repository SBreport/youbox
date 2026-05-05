(function () {
  'use strict';

  var PREF_KEY = 'youbox-dict-ui-v1';

  // ── 상태 ──────────────────────────────────────────────────────────
  var state = {
    filter: 'all',
    search: '',
    sort: 'newest'
  };

  function loadPrefs() {
    try {
      var saved = JSON.parse(localStorage.getItem(PREF_KEY));
      if (saved) {
        if (saved.sort) state.sort = saved.sort;
      }
    } catch (e) {}
  }

  function savePrefs() {
    localStorage.setItem(PREF_KEY, JSON.stringify({ sort: state.sort }));
  }

  // ── 날짜 포맷 ──────────────────────────────────────────────────────
  function relativeTime(isoStr) {
    if (!isoStr) return '';
    var diff = Date.now() - new Date(isoStr).getTime();
    var s = Math.floor(diff / 1000);
    if (s < 60) return '방금';
    var m = Math.floor(s / 60);
    if (m < 60) return m + '분 전';
    var h = Math.floor(m / 60);
    if (h < 24) return h + '시간 전';
    var d = Math.floor(h / 24);
    if (d < 30) return d + '일 전';
    var mo = Math.floor(d / 30);
    if (mo < 12) return mo + '개월 전';
    return Math.floor(mo / 12) + '년 전';
  }

  // ── HTML 이스케이프 ────────────────────────────────────────────────
  function esc(str) {
    var d = document.createElement('div');
    d.textContent = str || '';
    return d.innerHTML;
  }

  // ── 카테고리 메타 ─────────────────────────────────────────────────
  var CAT_META = {
    intro:   { icon: '🎬', label: '도입부' },
    hook:    { icon: '🎯', label: '후크' },
    overlay: { icon: '📌', label: '표시 제목' },
    cut:     { icon: '✂️', label: '컷 패턴' },
    cta:     { icon: '🎁', label: '결론 CTA' },
    key:     { icon: '🔑', label: '키 템플릿' }
  };

  function catMeta(id) {
    return CAT_META[id] || { icon: '🗂️', label: id };
  }

  // ── 필터·정렬 적용 ────────────────────────────────────────────────
  function applyFilters(cards) {
    var q = state.search.trim().toLowerCase();

    var result = cards.filter(function (c) {
      if (state.filter === 'favorite' && !c.favorite) return false;
      if (state.filter !== 'all' && state.filter !== 'favorite' && c.category !== state.filter) return false;
      if (q) {
        var haystack = ((c.title || '') + ' ' + (c.content || '') + ' ' + (c.structureNotes || '')).toLowerCase();
        if (haystack.indexOf(q) === -1) return false;
      }
      return true;
    });

    result.sort(function (a, b) {
      if (state.sort === 'oldest') return new Date(a.addedAt) - new Date(b.addedAt);
      if (state.sort === 'title') return (a.title || '').localeCompare(b.title || '', 'ko');
      if (state.sort === 'favorite') {
        if (a.favorite && !b.favorite) return -1;
        if (!a.favorite && b.favorite) return 1;
        return new Date(b.addedAt) - new Date(a.addedAt);
      }
      return new Date(b.addedAt) - new Date(a.addedAt);
    });

    return result;
  }

  // ── 카운트 업데이트 ───────────────────────────────────────────────
  function updateCounts(all) {
    var cats = ['intro', 'hook', 'overlay', 'cut', 'cta', 'key'];
    var counts = {};
    cats.forEach(function (id) { counts[id] = 0; });
    var favCount = 0;

    all.forEach(function (c) {
      if (counts.hasOwnProperty(c.category)) counts[c.category]++;
      if (c.favorite) favCount++;
    });

    var totalEl = document.getElementById('dictTotalCount');
    if (totalEl) totalEl.textContent = all.length + '개 카드';

    var allEl = document.getElementById('navCount_all');
    if (allEl) allEl.textContent = all.length;

    var favEl = document.getElementById('navCount_favorite');
    if (favEl) favEl.textContent = favCount;

    cats.forEach(function (id) {
      var el = document.getElementById('navCount_' + id);
      if (el) el.textContent = counts[id];
    });
  }

  // ── 카드 HTML 생성 ────────────────────────────────────────────────
  function buildCardHTML(card) {
    var cm = catMeta(card.category);
    var favClass = card.favorite ? 'on' : '';
    var favChar = card.favorite ? '★' : '☆';

    var sourcePart = '';
    if (card.sourceUrl) {
      var displayLabel = esc(card.sourceTitle || card.sourceUrl);
      sourcePart = '<a class="dict-card-source" href="' + esc(card.sourceUrl) + '" target="_blank" rel="noopener" onclick="event.stopPropagation()">📺 ' + displayLabel + '</a>';
    } else if (card.sourceTitle) {
      sourcePart = '<span class="dict-card-source" style="cursor:default;color:var(--text-muted);">📺 ' + esc(card.sourceTitle) + '</span>';
    }

    return '<div class="dict-card" data-id="' + esc(card.id) + '">' +
      '<div class="dict-card-top">' +
        '<span class="dict-cat-badge">' + cm.icon + ' ' + esc(cm.label) + '</span>' +
        '<span class="dict-card-title">' + esc(card.title || '(제목 없음)') + '</span>' +
        '<button class="dict-card-fav ' + favClass + '" data-fav="' + esc(card.id) + '" title="즐겨찾기 토글">' + favChar + '</button>' +
      '</div>' +
      (card.content ? '<div class="dict-card-content">' + esc(card.content) + '</div>' : '') +
      '<div class="dict-card-meta">' +
        sourcePart +
        '<span class="dict-card-date">' + relativeTime(card.addedAt) + '</span>' +
      '</div>' +
      '<button class="dict-card-menu-btn" data-menu="' + esc(card.id) + '" title="메뉴">⋮</button>' +
    '</div>';
  }

  // ── 그리드 렌더 ───────────────────────────────────────────────────
  function render() {
    var all = DictionaryDB.list();
    updateCounts(all);

    var filtered = applyFilters(all);

    var grid = document.getElementById('dictGrid');
    var emptyEl = document.getElementById('dictEmpty');
    var noResultsEl = document.getElementById('dictNoResults');

    if (all.length === 0) {
      grid.innerHTML = '';
      emptyEl.style.display = '';
      noResultsEl.style.display = 'none';
      return;
    }

    emptyEl.style.display = 'none';

    if (filtered.length === 0) {
      grid.innerHTML = '';
      noResultsEl.style.display = '';
      return;
    }

    noResultsEl.style.display = 'none';
    grid.innerHTML = filtered.map(buildCardHTML).join('');
  }

  // ── 사이드바 네비게이션 ───────────────────────────────────────────
  function initSidebar() {
    var sidebar = document.getElementById('dictSidebar');
    if (!sidebar) return;
    sidebar.addEventListener('click', function (e) {
      var item = e.target.closest('[data-filter]');
      if (!item) return;
      var filter = item.getAttribute('data-filter');
      state.filter = filter;

      sidebar.querySelectorAll('.dict-nav-item').forEach(function (el) {
        el.classList.remove('active');
      });
      item.classList.add('active');
      render();
    });
  }

  // ── 검색·정렬 ──────────────────────────────────────────────────────
  function initToolbar() {
    var searchEl = document.getElementById('dictSearch');
    var sortEl = document.getElementById('dictSort');

    if (searchEl) {
      searchEl.addEventListener('input', function () {
        state.search = this.value;
        render();
      });
    }

    if (sortEl) {
      sortEl.value = state.sort;
      sortEl.addEventListener('change', function () {
        state.sort = this.value;
        savePrefs();
        render();
      });
    }
  }

  // ── 모달 ──────────────────────────────────────────────────────────
  var modalOverlay = null;
  var editingId = null;

  function openModal(card) {
    if (!modalOverlay) return;
    editingId = card ? card.id : null;

    document.getElementById('dictModalTitle').textContent = card ? '카드 편집' : '새 카드';
    document.getElementById('dictFormId').value = editingId || '';
    document.getElementById('dictFormCategory').value = card ? card.category : 'intro';
    document.getElementById('dictFormTitle').value = card ? (card.title || '') : '';
    document.getElementById('dictFormContent').value = card ? (card.content || '') : '';
    document.getElementById('dictFormStructureNotes').value = card ? (card.structureNotes || '') : '';
    document.getElementById('dictFormSourceTitle').value = card ? (card.sourceTitle || '') : '';
    document.getElementById('dictFormSourceUrl').value = card ? (card.sourceUrl || '') : '';
    document.getElementById('dictFormFavorite').checked = card ? !!card.favorite : false;

    modalOverlay.classList.remove('hidden');
    document.getElementById('dictFormTitle').focus();
  }

  function closeModal() {
    if (modalOverlay) modalOverlay.classList.add('hidden');
    editingId = null;
  }

  function saveModal() {
    var title = document.getElementById('dictFormTitle').value.trim();
    if (!title) {
      document.getElementById('dictFormTitle').focus();
      return;
    }

    var data = {
      category: document.getElementById('dictFormCategory').value,
      title: title,
      content: document.getElementById('dictFormContent').value.trim(),
      structureNotes: document.getElementById('dictFormStructureNotes').value.trim(),
      sourceTitle: document.getElementById('dictFormSourceTitle').value.trim(),
      sourceUrl: document.getElementById('dictFormSourceUrl').value.trim(),
      favorite: document.getElementById('dictFormFavorite').checked
    };

    if (editingId) {
      DictionaryDB.update(editingId, data);
    } else {
      DictionaryDB.add(data);
    }

    closeModal();
    render();
  }

  function initModal() {
    modalOverlay = document.getElementById('dictModalOverlay');
    if (!modalOverlay) return;

    document.getElementById('dictModalClose').onclick = closeModal;
    document.getElementById('dictFormCancel').onclick = closeModal;
    document.getElementById('dictFormSave').onclick = saveModal;

    modalOverlay.addEventListener('click', function (e) {
      if (e.target === modalOverlay) closeModal();
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeModal();
    });
  }

  // ── 그리드 이벤트 위임 ────────────────────────────────────────────
  var activeDropdownId = null;

  function closeDropdown() {
    if (!activeDropdownId) return;
    var existing = document.querySelector('.dict-dropdown');
    if (existing) existing.remove();
    activeDropdownId = null;
  }

  function openDropdown(cardId, menuBtn) {
    closeDropdown();
    activeDropdownId = cardId;

    var dropdown = document.createElement('div');
    dropdown.className = 'dict-dropdown';
    dropdown.innerHTML =
      '<button class="dict-dropdown-item" data-action="edit">✏️ 편집</button>' +
      '<button class="dict-dropdown-item danger" data-action="delete">🗑️ 삭제</button>';

    dropdown.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-action]');
      if (!btn) return;
      var action = btn.getAttribute('data-action');
      closeDropdown();
      if (action === 'edit') {
        openModal(DictionaryDB.get(cardId));
      } else if (action === 'delete') {
        if (confirm('이 카드를 삭제할까요?')) {
          DictionaryDB.remove(cardId);
          render();
        }
      }
    });

    menuBtn.parentElement.style.position = 'relative';
    menuBtn.parentElement.appendChild(dropdown);
  }

  function initGrid() {
    var grid = document.getElementById('dictGrid');
    if (!grid) return;

    grid.addEventListener('click', function (e) {
      // 즐겨찾기 토글
      var favBtn = e.target.closest('[data-fav]');
      if (favBtn) {
        e.stopPropagation();
        var id = favBtn.getAttribute('data-fav');
        DictionaryDB.toggleFavorite(id);
        render();
        return;
      }

      // 메뉴 버튼
      var menuBtn = e.target.closest('[data-menu]');
      if (menuBtn) {
        e.stopPropagation();
        var cardId = menuBtn.getAttribute('data-menu');
        if (activeDropdownId === cardId) {
          closeDropdown();
        } else {
          openDropdown(cardId, menuBtn);
        }
        return;
      }

      // 드롭다운 외부 클릭 무시
      if (e.target.closest('.dict-dropdown')) return;

      // 소스 링크 클릭 무시
      if (e.target.closest('a')) return;

      // 카드 클릭 → 편집
      var card = e.target.closest('.dict-card');
      if (card) {
        closeDropdown();
        var id = card.getAttribute('data-id');
        openModal(DictionaryDB.get(id));
      }
    });
  }

  // ── 드롭다운 외부 클릭으로 닫기 ──────────────────────────────────
  document.addEventListener('click', function (e) {
    if (!e.target.closest('.dict-dropdown') && !e.target.closest('[data-menu]')) {
      closeDropdown();
    }
  });

  // ── 새 카드 버튼 ──────────────────────────────────────────────────
  function initNewBtn() {
    var newBtn = document.getElementById('dictNewBtn');
    if (newBtn) newBtn.onclick = function () { openModal(null); };

    var emptyNewBtn = document.getElementById('dictEmptyNewBtn');
    if (emptyNewBtn) emptyNewBtn.onclick = function () { openModal(null); };
  }

  // ── ZIP 내보내기 ──────────────────────────────────────────────────
  async function exportZip() {
    if (typeof JSZip === 'undefined') {
      alert('JSZip 라이브러리가 로드되지 않았습니다.');
      return;
    }

    var cards = DictionaryDB.list();
    var zip = new JSZip();

    var meta = {
      type: 'youbox-dictionary',
      version: '1.0',
      exportedAt: new Date().toISOString(),
      cardCount: cards.length
    };

    zip.file('meta.json', JSON.stringify(meta, null, 2));
    zip.file('dictionary.json', JSON.stringify(cards, null, 2));

    var blob = await zip.generateAsync({ type: 'blob' });
    var date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    var filename = date + '_youbox_dictionary.zip';

    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  // ── ZIP 불러오기 ──────────────────────────────────────────────────
  var pendingImportCards = null;

  async function handleImportFile(file) {
    if (typeof JSZip === 'undefined') {
      alert('JSZip 라이브러리가 로드되지 않았습니다.');
      return;
    }

    try {
      var zip = await JSZip.loadAsync(file);
      var metaFile = zip.file('meta.json');
      var dictFile = zip.file('dictionary.json');

      if (!dictFile) {
        alert('유효한 구조 사전 ZIP 파일이 아닙니다.\ndictionary.json 파일이 없습니다.');
        return;
      }

      if (metaFile) {
        var meta = JSON.parse(await metaFile.async('string'));
        if (meta.type && meta.type !== 'youbox-dictionary') {
          alert('이 ZIP은 구조 사전 형식이 아닙니다 (type: ' + meta.type + ').');
          return;
        }
      }

      var cards = JSON.parse(await dictFile.async('string'));
      if (!Array.isArray(cards)) {
        alert('dictionary.json 형식이 올바르지 않습니다.');
        return;
      }

      pendingImportCards = cards;
      var msg = cards.length + '개 카드를 불러옵니다.\n기존 카드에 병합하거나, 전체를 덮어쓸 수 있습니다.';
      document.getElementById('dictImportConfirmMsg').textContent = msg;
      document.getElementById('dictImportConfirmOverlay').classList.remove('hidden');

    } catch (err) {
      alert('ZIP 파일을 읽는 중 오류가 발생했습니다:\n' + err.message);
    }
  }

  function doImport(mode) {
    if (!pendingImportCards) return;

    if (mode === 'overwrite') {
      localStorage.setItem(DictionaryDB.STORAGE_KEY, JSON.stringify(pendingImportCards));
    } else {
      var existing = DictionaryDB.list();
      var existingIds = new Set(existing.map(function (c) { return c.id; }));
      var toAdd = pendingImportCards.filter(function (c) { return !existingIds.has(c.id); });
      var merged = toAdd.concat(existing);
      localStorage.setItem(DictionaryDB.STORAGE_KEY, JSON.stringify(merged));
    }

    pendingImportCards = null;
    document.getElementById('dictImportConfirmOverlay').classList.add('hidden');
    render();
    alert('불러오기가 완료됐습니다.');
  }

  function initZip() {
    var exportBtn = document.getElementById('dictExportBtn');
    if (exportBtn) exportBtn.onclick = exportZip;

    var importBtn = document.getElementById('dictImportBtn');
    var importFile = document.getElementById('dictImportFile');

    if (importBtn && importFile) {
      importBtn.onclick = function () { importFile.value = ''; importFile.click(); };
      importFile.onchange = function () {
        if (this.files && this.files[0]) handleImportFile(this.files[0]);
      };
    }

    var cancelBtn = document.getElementById('dictImportCancelBtn');
    if (cancelBtn) cancelBtn.onclick = function () {
      pendingImportCards = null;
      document.getElementById('dictImportConfirmOverlay').classList.add('hidden');
    };

    var mergeBtn = document.getElementById('dictImportMergeBtn');
    if (mergeBtn) mergeBtn.onclick = function () { doImport('merge'); };

    var overwriteBtn = document.getElementById('dictImportOverwriteBtn');
    if (overwriteBtn) overwriteBtn.onclick = function () {
      if (confirm('기존 카드가 모두 지워집니다. 계속할까요?')) doImport('overwrite');
    };

    var importOverlay = document.getElementById('dictImportConfirmOverlay');
    if (importOverlay) {
      importOverlay.addEventListener('click', function (e) {
        if (e.target === importOverlay) {
          pendingImportCards = null;
          importOverlay.classList.add('hidden');
        }
      });
    }
  }

  // ── 초기화 ────────────────────────────────────────────────────────
  function init() {
    loadPrefs();
    initSidebar();
    initToolbar();
    initModal();
    initGrid();
    initNewBtn();
    initZip();
    render();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
