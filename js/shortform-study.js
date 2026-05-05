(function () {
  /* ── 분석 항목 9가지 (4강 기반) ── */
  var BREAKDOWN_ITEMS = [
    {
      key: 'title_caption',
      label: '① 제목·캡션',
      placeholder: '제목 패턴을 구조 변수로 추출하세요. 예) [문제 제시]+[숫자]+[카테고리]',
      hint: '4강: 제목 구조를 변수(A=, B=)로 뽑아 두면 도입부 작성이 5분으로 단축됩니다.'
    },
    {
      key: 'script',
      label: '② 원고 받아쓰기',
      placeholder: '0.25~0.5배속으로 받아쓰세요. 슬래시(/)로 호흡 단위를 나눠 기록하면 텍스트 밀도 파악에 유리합니다.',
      hint: '4강: 크롬 확장 "유튜브 플레이 스피드 컨트롤"로 인스타 릴스도 0.25배속 가능.'
    },
    {
      key: 'structure',
      label: '③ 도입부·본문·결론 분리',
      placeholder: '도입부 멘트 구조(A=, B= 변수화), 본문 템플릿 유형(나열형/순서형/스토리형/주장 설득형), 결론 CTA 유무',
      hint: '4강: 진짜 차가운 숏폼은 세 컷 이내 본론. 결론에 행동 버튼 없으면 아쉬운 점으로 메모.'
    },
    {
      key: 'visual_sound',
      label: '④ 화면·사운드·영상 템포',
      placeholder: '초반 화면 구성, 화면 전환 속도(0.5초/1초/2초 실측), 자막 스타일, BGM·효과음 유형, 전체 템포',
      hint: '4강: 효과음은 집중도 유지에 직접 기여하는 것만 사용. 남발하면 제작 시간이 늘어납니다.'
    },
    {
      key: 'emotion_points',
      label: '⑤ 감정 포인트 (가장 중요)',
      placeholder: '감정을 느낀 타임스탬프를 기록하세요. 예) 0:03 웃김 / 0:08 반전 / 0:14 감탄...',
      hint: '4강: 잘된 숏폼 기본 10초당 1개, 천만 뷰는 5~6초당 1개. 기획 단계부터 의식적으로 설계해야 달성 가능.'
    },
    {
      key: 'beauty_element',
      label: '⑥ 미인 요소',
      placeholder: '연예인·애니·캐릭터·트렌드 활용 여부. 없으면 "없음"으로 기록',
      hint: '4강: 미인 요소가 가진 호감·감정을 영상에 무임승차 가능. 단, 저작권 허용 범위 내에서만.'
    },
    {
      key: 'special_notes',
      label: '⑦ 특이 사항 (자유 메모)',
      placeholder: '영상 보면서 느낀 점, 배운 것, 개선 아이디어를 자유롭게 기록하세요.',
      hint: '4강: ①~⑥에서 포착하지 못한 인상을 여기에 넣으세요. 형식 없는 메모가 목적입니다.'
    },
    {
      key: 'application_idea',
      label: '⑧ 적용 아이디어',
      placeholder: '이 영상의 강점을 내 채널에 어떻게 적용할지 구체적으로 기록하세요.',
      hint: '4강: 분석 강점을 내 영상에 하나씩 적용하고 성과 데이터로 검증. 안 좋으면 폐기, 좋으면 유지.'
    },
    {
      key: 'weekly_output',
      label: '⑨ 제작량·A/B 테스트 메모',
      placeholder: '이 분석을 어떤 제작 사이클에 투입할지, A/B 테스트 계획이 있다면 기록하세요.',
      hint: '4강: 주 3개 → 5개 → 7개 스케일업. 시간 여유 있으면 계정 3개로 A/B 테스트.'
    }
  ];

  var WEEK_GOAL_KEY = 'youbox-week-goal';
  var currentStudyId = null;
  var currentStep = 1;

  /* ── DOM refs ── */
  var weekCountEl = document.getElementById('weekCount');
  var weekGoalSel = document.getElementById('weekGoal');
  var newStudyBtn = document.getElementById('newStudyBtn');
  var inProgressList = document.getElementById('inProgressList');
  var completedList = document.getElementById('completedList');
  var modalOverlay = document.getElementById('studyModalOverlay');
  var modalCloseBtn = document.getElementById('modalCloseBtn');
  var stepPanels = Array.from(document.querySelectorAll('.study-step-panel'));
  var stepNodes = Array.from(document.querySelectorAll('.step-node'));
  var prevBtn = document.getElementById('stepPrevBtn');
  var nextBtn = document.getElementById('stepNextBtn');
  var completeBtn = document.getElementById('stepCompleteBtn');
  var toast = document.getElementById('studyToast');

  /* ── 초기화 ── */
  function init() {
    buildBreakdownItems();
    renderWeekCount();
    renderStudyLists();
    bindEvents();
    loadGoal();
  }

  function loadGoal() {
    var g = localStorage.getItem(WEEK_GOAL_KEY);
    if (g && weekGoalSel) weekGoalSel.value = g;
  }

  /* ── 주간 카운트 ── */
  function renderWeekCount() {
    if (!weekCountEl) return;
    var n = DictionaryDB.studies.countThisWeek();
    var goal = weekGoalSel ? parseInt(weekGoalSel.value) || 3 : 3;
    weekCountEl.textContent = '이번 주 ' + n + '/' + goal + '편';
    weekCountEl.classList.toggle('goal-met', n >= goal);
  }

  /* ── 분석 항목 9개 동적 생성 ── */
  function buildBreakdownItems() {
    var container = document.getElementById('breakdownItems');
    if (!container) return;
    container.innerHTML = '';
    BREAKDOWN_ITEMS.forEach(function (item, i) {
      var isEmotion = (item.key === 'emotion_points');
      var div = document.createElement('div');
      div.className = 'form-group';
      div.innerHTML = [
        '<div class="breakdown-item-header">',
        '  <span class="breakdown-item-num">' + (i + 1) + '</span>',
        '  <span class="breakdown-item-title">' + item.label + '</span>',
        '  <a class="hint-btn" title="' + escHtml(item.hint) + '" href="guide.html#강4" target="_blank">?</a>',
        '</div>',
        '<textarea class="form-textarea" id="bd_' + item.key + '" name="' + item.key + '"',
        '  placeholder="' + escHtml(item.placeholder) + '" rows="3"></textarea>'
      ].join('');
      container.appendChild(div);

      if (isEmotion) {
        var calcDiv = document.createElement('div');
        calcDiv.className = 'form-group';
        calcDiv.innerHTML = [
          '<div class="emotion-calc-row">',
          '  <div class="form-group">',
          '    <label class="form-label">영상 길이 (초)</label>',
          '    <input type="number" id="emotionDuration" class="form-input" placeholder="예) 58" min="1">',
          '  </div>',
          '  <div class="form-group">',
          '    <label class="form-label">감정 포인트 수</label>',
          '    <input type="number" id="emotionCount" class="form-input" placeholder="예) 6" min="0">',
          '  </div>',
          '  <div class="emotion-density-result" id="emotionResult">밀도: —</div>',
          '</div>'
        ].join('');
        container.appendChild(calcDiv);

        calcDiv.querySelector('#emotionDuration').addEventListener('input', calcEmotionDensity);
        calcDiv.querySelector('#emotionCount').addEventListener('input', calcEmotionDensity);
      }

      div.querySelector('textarea').addEventListener('input', autoSaveCurrent);
    });
  }

  function calcEmotionDensity() {
    var dur = parseFloat(document.getElementById('emotionDuration').value) || 0;
    var cnt = parseFloat(document.getElementById('emotionCount').value) || 0;
    var resultEl = document.getElementById('emotionResult');
    if (!resultEl) return;
    if (!dur || !cnt) { resultEl.textContent = '밀도: —'; resultEl.className = 'emotion-density-result'; return; }
    var perTen = (cnt / dur * 10).toFixed(1);
    var secs = (dur / cnt).toFixed(1);
    var msg = '10초당 ' + perTen + '개 (' + secs + '초/1개)';
    resultEl.className = 'emotion-density-result';
    if (secs <= 6) { resultEl.classList.add('great'); msg += ' — 천만 뷰급'; }
    else if (secs <= 10) { resultEl.classList.add('good'); msg += ' — 잘된 숏폼'; }
    else { msg += ' — 기준 미달'; }
    resultEl.textContent = msg;
  }

  /* ── 카드 렌더 ── */
  function renderStudyLists() {
    var all = DictionaryDB.studies.list();
    var inProg = all.filter(function (s) { return !s.completedAt; });
    var done = all.filter(function (s) { return !!s.completedAt; });

    renderList(inProgressList, inProg, false);
    renderList(completedList, done, true);
  }

  function renderList(container, items, isCompleted) {
    if (!container) return;
    container.innerHTML = '';
    if (!items.length) {
      container.innerHTML = '<div class="study-empty">' +
        (isCompleted ? '아직 완료된 끝내기가 없습니다.' : '진행 중인 끝내기가 없습니다.') +
        '</div>';
      return;
    }
    items.forEach(function (s) {
      container.appendChild(buildStudyCard(s, isCompleted));
    });
  }

  function buildStudyCard(s, isCompleted) {
    var step = s.step || 1;
    var div = document.createElement('div');
    div.className = 'study-card' + (isCompleted ? ' completed' : '');

    var dots = [1, 2, 3, 4].map(function (n) {
      return '<span class="' + (n <= step ? 'done' : '') + '"></span>';
    }).join('');

    var metaHtml = [
      s.source ? '<span class="study-card-source">' + escHtml(s.source) + '</span>' : '',
      s.foundAt ? '<span>' + fmtDate(s.foundAt) + '</span>' : ''
    ].filter(Boolean).join('');

    var actionsHtml = isCompleted
      ? '<a href="dictionary.html" class="btn btn-secondary" style="font-size:11px;padding:4px 10px;text-decoration:none;">사전 보기</a>'
        + '<button class="btn-icon danger" data-del="' + s.id + '" title="삭제">✕</button>'
      : '<button class="btn btn-secondary" data-resume="' + s.id + '" style="font-size:11px;padding:5px 12px;">계속하기</button>'
        + '<button class="btn-icon danger" data-del="' + s.id + '" title="삭제">✕</button>';

    div.innerHTML = [
      '<div class="study-card-info">',
      '  <div class="study-card-title">' + escHtml(s.title || s.url || '제목 없음') + '</div>',
      '  <div class="study-card-meta">' + metaHtml + '</div>',
      '</div>',
      '<div class="study-card-step-badge">',
      '  <div class="study-card-step-dots">' + dots + '</div>',
      '  ' + (isCompleted ? '완료' : 'Step ' + step + '/4'),
      '</div>',
      '<div class="study-card-actions">' + actionsHtml + '</div>'
    ].join('');

    div.querySelector('[data-del]') && div.querySelector('[data-del]').addEventListener('click', function (e) {
      var id = e.currentTarget.getAttribute('data-del');
      if (confirm('끝내기 기록을 삭제할까요?')) {
        DictionaryDB.studies.remove(id);
        renderStudyLists();
        renderWeekCount();
      }
    });

    var resumeBtn = div.querySelector('[data-resume]');
    if (resumeBtn) {
      resumeBtn.addEventListener('click', function (e) {
        openModal(e.currentTarget.getAttribute('data-resume'));
      });
    }

    return div;
  }

  /* ── 모달 열기/닫기 ── */
  function openModal(id) {
    var study = id ? DictionaryDB.studies.get(id) : null;
    if (id && !study) return;

    if (!study) {
      study = DictionaryDB.studies.add({ step: 1 });
    }
    currentStudyId = study.id;
    currentStep = study.step || 1;

    loadFormData(study);
    goToStep(currentStep);
    modalOverlay.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    modalOverlay.classList.add('hidden');
    document.body.style.overflow = '';
    currentStudyId = null;
    clearForm();
    renderStudyLists();
    renderWeekCount();
  }

  /* ── 폼 데이터 로드 ── */
  function loadFormData(study) {
    setVal('studyUrl', study.url || '');
    setVal('studyTitle', study.title || '');
    setVal('studyLikes', study.likes || '');
    setRadio('studySource', study.source || '');

    var bd = study.breakdown || {};
    BREAKDOWN_ITEMS.forEach(function (item) {
      setVal('bd_' + item.key, bd[item.key] || '');
    });

    var dur = bd.emotionDuration || '';
    var cnt = bd.emotionCount || '';
    var durEl = document.getElementById('emotionDuration');
    var cntEl = document.getElementById('emotionCount');
    if (durEl) durEl.value = dur;
    if (cntEl) cntEl.value = cnt;
    if (dur && cnt) calcEmotionDensity();

    var savedCats = study.savedCategories || {};
    DICT_CATEGORIES.forEach(function (cat) {
      var chk = document.getElementById('cat_' + cat.id);
      if (chk) {
        chk.checked = !!savedCats[cat.id];
        toggleCatFields(cat.id, !!savedCats[cat.id]);
      }
      if (savedCats[cat.id]) {
        setVal('cat_title_' + cat.id, savedCats[cat.id].cardTitle || '');
        setVal('cat_notes_' + cat.id, savedCats[cat.id].structureNotes || '');
      }
    });
    updateCatCheckLabels();

    setVal('studyApplication', study.application || '');
    setRadio('studyPriority', study.applicationPriority || 'soon');
    updatePriorityLabels();
  }

  function clearForm() {
    ['studyUrl', 'studyTitle', 'studyLikes', 'studyApplication'].forEach(function (id) { setVal(id, ''); });
    BREAKDOWN_ITEMS.forEach(function (item) { setVal('bd_' + item.key, ''); });
    var dur = document.getElementById('emotionDuration');
    var cnt = document.getElementById('emotionCount');
    if (dur) dur.value = '';
    if (cnt) cnt.value = '';
    var res = document.getElementById('emotionResult');
    if (res) { res.textContent = '밀도: —'; res.className = 'emotion-density-result'; }
    DICT_CATEGORIES.forEach(function (cat) {
      var chk = document.getElementById('cat_' + cat.id);
      if (chk) { chk.checked = false; toggleCatFields(cat.id, false); }
      setVal('cat_title_' + cat.id, '');
      setVal('cat_notes_' + cat.id, '');
    });
  }

  /* ── 단계 이동 ── */
  function goToStep(n) {
    currentStep = n;
    stepPanels.forEach(function (p, i) {
      p.classList.toggle('active', i + 1 === n);
    });
    stepNodes.forEach(function (node, i) {
      node.classList.remove('active', 'done');
      if (i + 1 < n) node.classList.add('done');
      else if (i + 1 === n) node.classList.add('active');
    });
    if (prevBtn) prevBtn.style.display = n === 1 ? 'none' : '';
    if (nextBtn) nextBtn.style.display = n === 4 ? 'none' : '';
    if (completeBtn) completeBtn.style.display = n === 4 ? '' : 'none';
  }

  /* ── 자동 저장 ── */
  function autoSaveCurrent() {
    if (!currentStudyId) return;
    var patch = gatherFormData();
    patch.step = currentStep;
    DictionaryDB.studies.update(currentStudyId, patch);
  }

  function gatherFormData() {
    var bd = {};
    BREAKDOWN_ITEMS.forEach(function (item) {
      bd[item.key] = getVal('bd_' + item.key);
    });
    var durEl = document.getElementById('emotionDuration');
    var cntEl = document.getElementById('emotionCount');
    if (durEl) bd.emotionDuration = durEl.value;
    if (cntEl) bd.emotionCount = cntEl.value;

    var savedCats = {};
    DICT_CATEGORIES.forEach(function (cat) {
      var chk = document.getElementById('cat_' + cat.id);
      if (chk && chk.checked) {
        savedCats[cat.id] = {
          cardTitle: getVal('cat_title_' + cat.id),
          structureNotes: getVal('cat_notes_' + cat.id)
        };
      }
    });

    return {
      url: getVal('studyUrl'),
      title: getVal('studyTitle'),
      likes: parseInt(getVal('studyLikes')) || 0,
      source: getRadio('studySource'),
      breakdown: bd,
      savedCategories: savedCats,
      application: getVal('studyApplication'),
      applicationPriority: getRadio('studyPriority') || 'soon'
    };
  }

  /* ── 완료 처리 ── */
  function completeStudy() {
    if (!currentStudyId) return;
    var patch = gatherFormData();
    patch.step = 4;
    patch.completedAt = new Date().toISOString();

    var savedCats = patch.savedCategories || {};
    var study = DictionaryDB.studies.get(currentStudyId);
    var dictIds = [];

    Object.keys(savedCats).forEach(function (catId) {
      var info = savedCats[catId];
      if (!info.cardTitle) return;
      var card = DictionaryDB.add({
        category: catId,
        title: info.cardTitle,
        content: info.structureNotes || '',
        sourceUrl: patch.url || '',
        sourceTitle: patch.title || '',
        structureNotes: info.structureNotes || ''
      });
      dictIds.push(card.id);
    });

    patch.savedToDictIds = dictIds;
    DictionaryDB.studies.update(currentStudyId, patch);

    closeModal();
    showToast('완료! ' + (dictIds.length ? dictIds.length + '개 카드가 구조 사전에 저장되었습니다.' : '끝내기 기록이 저장되었습니다.'));
  }

  /* ── Step 3 카테고리 체크박스 ── */
  function buildCatCheckGrid() {
    var grid = document.getElementById('categoryCheckGrid');
    var fieldsArea = document.getElementById('categoryFieldsArea');
    if (!grid || !fieldsArea) return;

    grid.innerHTML = '';
    fieldsArea.innerHTML = '';

    DICT_CATEGORIES.forEach(function (cat) {
      var lbl = document.createElement('label');
      lbl.className = 'category-check-label';
      lbl.id = 'cat_label_' + cat.id;
      lbl.innerHTML = [
        '<input type="checkbox" id="cat_' + cat.id + '">',
        '<span class="cat-icon">' + cat.icon + '</span>',
        escHtml(cat.label)
      ].join('');
      grid.appendChild(lbl);

      lbl.querySelector('input').addEventListener('change', function () {
        var checked = this.checked;
        toggleCatFields(cat.id, checked);
        updateCatCheckLabels();
        autoSaveCurrent();
      });

      var fields = document.createElement('div');
      fields.className = 'cat-card-fields';
      fields.id = 'cat_fields_' + cat.id;
      fields.innerHTML = [
        '<div class="cat-card-fields-title">' + cat.icon + ' ' + cat.label + ' 카드 작성</div>',
        '<div class="form-group">',
        '  <label class="form-label form-label-req">카드 제목</label>',
        '  <input type="text" id="cat_title_' + cat.id + '" class="form-input" placeholder="이 구조의 핵심을 한 문장으로">',
        '</div>',
        '<div class="form-group">',
        '  <label class="form-label">핵심 구조 메모</label>',
        '  <textarea id="cat_notes_' + cat.id + '" class="form-textarea" rows="2"',
        '    placeholder="변수화된 구조 패턴 또는 적용 방법"></textarea>',
        '</div>'
      ].join('');
      fieldsArea.appendChild(fields);

      fields.querySelectorAll('input, textarea').forEach(function (el) {
        el.addEventListener('input', autoSaveCurrent);
      });
    });
  }

  function toggleCatFields(catId, show) {
    var el = document.getElementById('cat_fields_' + catId);
    if (el) el.classList.toggle('visible', show);
  }

  function updateCatCheckLabels() {
    DICT_CATEGORIES.forEach(function (cat) {
      var chk = document.getElementById('cat_' + cat.id);
      var lbl = document.getElementById('cat_label_' + cat.id);
      if (chk && lbl) lbl.classList.toggle('checked', chk.checked);
    });
  }

  /* ── Step 1 유효성 ── */
  function validateStep1() {
    var likes = parseInt(getVal('studyLikes')) || 0;
    var warn = document.getElementById('likesWarning');
    if (warn) warn.classList.toggle('show', likes > 0 && likes < 1000);
    return true;
  }

  /* ── 이벤트 바인딩 ── */
  function bindEvents() {
    if (newStudyBtn) newStudyBtn.addEventListener('click', function () { openModal(null); });
    if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeModal);
    if (modalOverlay) {
      modalOverlay.addEventListener('click', function (e) {
        if (e.target === modalOverlay) closeModal();
      });
    }

    if (prevBtn) prevBtn.addEventListener('click', function () {
      autoSaveCurrent();
      if (currentStep > 1) goToStep(currentStep - 1);
    });

    if (nextBtn) nextBtn.addEventListener('click', function () {
      autoSaveCurrent();
      if (currentStep < 4) goToStep(currentStep + 1);
    });

    if (completeBtn) completeBtn.addEventListener('click', completeStudy);

    if (weekGoalSel) weekGoalSel.addEventListener('change', function () {
      localStorage.setItem(WEEK_GOAL_KEY, this.value);
      renderWeekCount();
    });

    var urlInput = document.getElementById('studyUrl');
    var likesInput = document.getElementById('studyLikes');
    if (urlInput) urlInput.addEventListener('input', autoSaveCurrent);
    if (likesInput) {
      likesInput.addEventListener('input', function () {
        validateStep1();
        autoSaveCurrent();
      });
    }

    var titleInput = document.getElementById('studyTitle');
    if (titleInput) titleInput.addEventListener('input', autoSaveCurrent);

    document.querySelectorAll('input[name="studySource"]').forEach(function (r) {
      r.addEventListener('change', function () {
        document.querySelectorAll('.source-radio-label').forEach(function (l) {
          l.classList.toggle('checked', l.querySelector('input') && l.querySelector('input').checked);
        });
        autoSaveCurrent();
      });
    });

    document.querySelectorAll('input[name="studyPriority"]').forEach(function (r) {
      r.addEventListener('change', function () {
        updatePriorityLabels();
        autoSaveCurrent();
      });
    });

    buildCatCheckGrid();
  }

  function updatePriorityLabels() {
    document.querySelectorAll('.priority-radio-label').forEach(function (lbl) {
      var inp = lbl.querySelector('input');
      if (inp) lbl.classList.toggle('checked', inp.checked);
    });
  }

  /* ── 토스트 ── */
  function showToast(msg) {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(function () { toast.classList.remove('show'); }, 3000);
  }

  /* ── 유틸 ── */
  function setVal(id, val) { var el = document.getElementById(id); if (el) el.value = val; }
  function getVal(id) { var el = document.getElementById(id); return el ? el.value.trim() : ''; }
  function setRadio(name, val) {
    document.querySelectorAll('input[name="' + name + '"]').forEach(function (r) {
      r.checked = (r.value === val);
    });
  }
  function getRadio(name) {
    var checked = document.querySelector('input[name="' + name + '"]:checked');
    return checked ? checked.value : '';
  }
  function escHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function fmtDate(iso) {
    if (!iso) return '';
    var d = new Date(iso);
    return d.getFullYear() + '.' + String(d.getMonth() + 1).padStart(2, '0') + '.' + String(d.getDate()).padStart(2, '0');
  }

  /* ── DictionaryDB.studies.get helper ── */
  DictionaryDB.studies.get = function (id) {
    return this.list().find(function (s) { return s.id === id; }) || null;
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
