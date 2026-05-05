// shortform.js — 숏폼 제작 워크북 쉘

(function() {
  const params = new URLSearchParams(location.search);
  const id = params.get('id');

  if (!id) {
    document.getElementById('sfNoProject').style.display = 'block';
    return;
  }

  const project = ProjectsDB.load(id);
  if (!project || !ProjectsDB.isShortform(project)) {
    document.getElementById('sfNoProject').style.display = 'block';
    return;
  }

  // Show workbook
  document.getElementById('sfWorkbook').style.display = 'block';

  // Header title
  const name = project.thumbResearch?.myVideoTitle || project.name || '새 프로젝트';
  document.getElementById('sfTitle').textContent = '🎬 ' + name;
  document.title = name + ' — 숏폼 제작 · youbox';

  // Mode badge
  const modeBadge = document.getElementById('sfModeBadge');
  const mode = project.shortform?.mode || 'pulling';
  modeBadge.textContent = mode === 'key' ? '🔑 키' : '📡 풀링';
  modeBadge.style.display = 'inline-flex';

  // Chapter tabs
  const tabs = document.querySelectorAll('.sf-tab');
  const contentEl = document.getElementById('sfChapterContent');

  const CH_LABELS = {
    1: '주제 + 템플릿',
    2: '자료조사',
    3: '도입부',
    4: '원고',
    5: '콘티',
    6: '발행 + 회고'
  };

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const ch = tab.dataset.ch;
      contentEl.innerHTML = `
        <div class="sf-placeholder-icon">📝</div>
        <p><strong>Ch${ch} ${CH_LABELS[ch]}</strong></p>
        <p style="margin-top:6px;">이 챕터는 다음 단계(S3, S4)에서 구현됩니다.</p>
        <p style="font-size:12px;color:var(--text-muted);margin-top:6px;">현재는 인프라 검증용 빈 쉘입니다.</p>
      `;
    });
  });
})();
