// shortform.js — 숏폼 제작 워크북 (S4: Ch1~3 구현)

(function() {
  const params = new URLSearchParams(location.search);
  const id = params.get('id');

  if (!id) {
    document.getElementById('sfNoProject').style.display = 'block';
    return;
  }

  let project = ProjectsDB.load(id);
  if (!project || !ProjectsDB.isShortform(project)) {
    document.getElementById('sfNoProject').style.display = 'block';
    return;
  }

  // ── 유틸 ──
  function esc(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // ── 저장 ──
  let _debounceTimer = null;
  let _autoSaveInterval = null;

  function saveNow(showToast) {
    ProjectsDB.save(project);
    if (showToast) showSaveToast();
  }

  function saveDebounced() {
    clearTimeout(_debounceTimer);
    _debounceTimer = setTimeout(() => saveNow(false), 800);
  }

  function showSaveToast(msg) {
    const el = document.getElementById('sfToast');
    if (!el) return;
    const time = new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
    el.textContent = (msg || '저장 완료') + ' ' + time;
    el.classList.add('show');
    setTimeout(() => el.classList.remove('show'), 1600);
  }

  // 30초 인터벌 자동 저장
  _autoSaveInterval = setInterval(() => saveNow(false), 30000);

  // Ctrl+S
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 's') {
      e.preventDefault();
      clearTimeout(_debounceTimer);
      saveNow(true);
    }
  });

  // ── 헤더 ──
  const name = project.thumbResearch?.myVideoTitle || project.name || '새 프로젝트';
  document.getElementById('sfTitle').textContent = '🎬 ' + name;
  document.title = name + ' — 숏폼 제작 · youbox';

  const modeBadge = document.getElementById('sfModeBadge');
  const mode = project.shortform?.mode || 'pulling';
  modeBadge.textContent = mode === 'key' ? '🔑 키' : '📡 풀링';
  modeBadge.style.display = 'inline-flex';

  // ── 컨텍스트 바 갱신 ──
  const TEMPLATE_NAMES = {
    list: '📋 나열형',
    sequence: '📝 순서형',
    story: '🎬 스토리형',
    argue: '💪 주장설득형'
  };

  function updateContextBar() {
    const sf = project.shortform || {};
    const topic = sf.topic || {};
    const modeLabel = (sf.mode === 'key') ? '🔑 키' : '📡 풀링';

    const ctxMode = document.getElementById('sfCtxModeBadge');
    const ctxTopic = document.getElementById('sfCtxTopic');
    const ctxTarget = document.getElementById('sfCtxTarget');
    const ctxTemplate = document.getElementById('sfCtxTemplate');

    if (ctxMode) ctxMode.textContent = modeLabel;

    if (ctxTopic) {
      if (topic.main) {
        ctxTopic.textContent = topic.main.length > 30 ? topic.main.slice(0, 30) + '…' : topic.main;
        ctxTopic.classList.remove('empty');
      } else {
        ctxTopic.textContent = '주제 미설정';
        ctxTopic.classList.add('empty');
      }
    }

    if (ctxTarget) {
      if (topic.target) {
        ctxTarget.textContent = topic.target.length > 20 ? topic.target.slice(0, 20) + '…' : topic.target;
        ctxTarget.classList.remove('empty');
      } else {
        ctxTarget.textContent = '—';
        ctxTarget.classList.add('empty');
      }
    }

    if (ctxTemplate) {
      if (topic.template) {
        ctxTemplate.textContent = TEMPLATE_NAMES[topic.template] || topic.template;
        ctxTemplate.classList.remove('empty');
      } else {
        ctxTemplate.textContent = '—';
        ctxTemplate.classList.add('empty');
      }
    }
  }

  // ── 챕터 탭 ──
  const tabs = document.querySelectorAll('.sf-tab');
  let currentCh = 1;

  function switchChapter(ch) {
    currentCh = ch;
    tabs.forEach(t => t.classList.toggle('active', parseInt(t.dataset.ch) === ch));
    renderChapter(ch);
  }

  tabs.forEach(tab => {
    tab.addEventListener('click', () => switchChapter(parseInt(tab.dataset.ch)));
  });

  // ── 챕터 렌더링 디스패처 ──
  function renderChapter(ch) {
    const body = document.getElementById('sfChapterBody');
    if (ch === 1) body.innerHTML = renderCh1();
    else if (ch === 2) body.innerHTML = renderCh2();
    else if (ch === 3) body.innerHTML = renderCh3();
    else body.innerHTML = renderPlaceholder(ch);

    if (ch === 1) bindCh1();
    else if (ch === 2) bindCh2();
    else if (ch === 3) bindCh3();
  }

  function renderPlaceholder(ch) {
    const LABELS = { 4: '원고', 5: '콘티', 6: '발행 + 회고' };
    return `
      <div class="sf-placeholder-msg">
        <div class="sf-placeholder-icon">📝</div>
        <p><strong>Ch${ch} ${LABELS[ch] || ''}</strong></p>
        <p style="margin-top:6px;">이 챕터는 다음 단계(S5)에서 구현됩니다.</p>
        <p style="font-size:12px;color:var(--text-muted);margin-top:6px;">현재는 인프라 검증용 빈 쉘입니다.</p>
      </div>
    `;
  }

  // ══════════════════════════════════
  //  Ch1 — 주제 + 템플릿
  // ══════════════════════════════════
  function renderCh1() {
    const topic = project.shortform?.topic || {};

    const templateOptions = [
      { value: 'list',     icon: '📋', name: '나열형',      example: '"X하는 5가지 방법"' },
      { value: 'sequence', icon: '📝', name: '순서형',      example: '"X 단계별 절차"' },
      { value: 'story',    icon: '🎬', name: '스토리형',    example: '"내가 X한 경험"' },
      { value: 'argue',    icon: '💪', name: '주장 설득형', example: '"X해야 한다 — 이유 N가지"' }
    ];

    const cardsHtml = templateOptions.map(t => `
      <label class="sf-template-card">
        <input type="radio" name="sfTemplate" value="${t.value}" ${topic.template === t.value ? 'checked' : ''}>
        <div class="sf-template-card-inner">
          <div class="sf-template-card-icon">${t.icon}</div>
          <div class="sf-template-card-name">${t.name}</div>
          <div class="sf-template-card-example">${t.example}</div>
        </div>
      </label>
    `).join('');

    return `
      <a href="guide.html#1" class="sf-guide-link" target="_blank">📖 강의 1·2강 §주제선정 + 4종 템플릿 →</a>

      <div class="sf-section">
        <div class="sf-field">
          <label>📌 주제 <span class="sf-required">*</span></label>
          <textarea id="sfTopicMain" class="sf-textarea" rows="2"
            placeholder="어떤 주제로 숏폼을 만들 건가요?">${esc(topic.main)}</textarea>
        </div>

        <div class="sf-field">
          <label>🎯 타겟 시청자</label>
          <input id="sfTopicTarget" type="text" class="sf-input"
            value="${esc(topic.target)}"
            placeholder="누구의 어떤 문제를 해결?">
          <div class="sf-hint">예: "직장 초년생, 발표 불안 해소"</div>
        </div>

        <div class="sf-field">
          <label>🔎 뷰트랩 검증 URL</label>
          <input id="sfTopicViewtrap" type="url" class="sf-input"
            value="${esc(topic.viewtrap)}"
            placeholder="https://...">
          <div class="sf-hint">강의 1강: 일반 필터 또는 쇼츠 전용 필터로 검증</div>
        </div>
      </div>

      <div class="sf-divider"></div>

      <div class="sf-section">
        <div class="sf-section-title">📐 원고 템플릿 <span style="color:var(--accent);margin-left:2px;">*</span></div>
        <div class="sf-template-cards" id="sfTemplateCards">
          ${cardsHtml}
        </div>
      </div>
    `;
  }

  function bindCh1() {
    const sf = project.shortform;
    if (!sf.topic) sf.topic = { main: '', target: '', viewtrap: '', template: null };

    // textarea / input → debounce save
    const mainEl = document.getElementById('sfTopicMain');
    if (mainEl) {
      mainEl.addEventListener('input', () => {
        sf.topic.main = mainEl.value;
        updateContextBar();
        saveDebounced();
      });
    }

    const targetEl = document.getElementById('sfTopicTarget');
    if (targetEl) {
      targetEl.addEventListener('input', () => {
        sf.topic.target = targetEl.value;
        updateContextBar();
        saveDebounced();
      });
    }

    const viewtrapEl = document.getElementById('sfTopicViewtrap');
    if (viewtrapEl) {
      viewtrapEl.addEventListener('input', () => {
        sf.topic.viewtrap = viewtrapEl.value;
        saveDebounced();
      });
    }

    // 템플릿 라디오 → 즉시 저장
    document.querySelectorAll('input[name="sfTemplate"]').forEach(radio => {
      radio.addEventListener('change', () => {
        if (radio.checked) {
          sf.topic.template = radio.value;
          updateContextBar();
          saveNow(false);
        }
      });
    });
  }

  // ══════════════════════════════════
  //  Ch2 — 자료 조사
  // ══════════════════════════════════
  function renderCh2() {
    const research = project.shortform?.research || {};

    return `
      <a href="guide.html#2" class="sf-guide-link" target="_blank">📖 강의 2강 §자료조사 →</a>

      <div class="sf-section">
        <div class="sf-section-title">🚦 2관문 자가 검증</div>
        <div class="sf-check-group">
          <label class="sf-check-item ${research.gate1 ? 'checked' : ''}" id="sfGate1Label">
            <input type="checkbox" id="sfGate1" ${research.gate1 ? 'checked' : ''}>
            <div class="sf-check-item-text">
              <div class="sf-check-item-label">1관문 — 타겟에게 직접 도움이 되는가</div>
              <div class="sf-check-item-desc">내 영상을 보면 타겟의 문제가 실제로 해결되는가</div>
            </div>
          </label>
          <label class="sf-check-item ${research.gate2 ? 'checked' : ''}" id="sfGate2Label">
            <input type="checkbox" id="sfGate2" ${research.gate2 ? 'checked' : ''}>
            <div class="sf-check-item-text">
              <div class="sf-check-item-label">2관문 — 경쟁 영상보다 쉽고/빠르고/효과적인가</div>
              <div class="sf-check-item-desc">기존 영상 대비 차별점이 명확한가</div>
            </div>
          </label>
        </div>

        <div class="sf-warning-box ${(!research.gate1 || !research.gate2) ? 'show' : ''}" id="sfGateWarning">
          <span>⚠️</span>
          <span>두 관문을 모두 통과해야 영상을 만들 가치가 있습니다. 주제를 다시 검토해보세요.</span>
        </div>
      </div>

      <div class="sf-divider"></div>

      <div class="sf-section">
        <div class="sf-section-title">📚 4소스 자료 수집</div>
        <div class="sf-sources-grid">
          <div class="sf-source-item">
            <label>💬 경쟁 영상 댓글</label>
            <textarea id="sfResComments" class="sf-textarea" rows="4"
              placeholder="경쟁 영상 댓글에서 시청자 반응, 질문, 불만 등 수집">${esc(research.comments)}</textarea>
          </div>
          <div class="sf-source-item">
            <label>🌐 인터넷 검색</label>
            <textarea id="sfResInternet" class="sf-textarea" rows="4"
              placeholder="블로그, 뉴스, 전문 사이트에서 수집한 정보">${esc(research.internet)}</textarea>
          </div>
          <div class="sf-source-item">
            <label>👥 커뮤니티</label>
            <textarea id="sfResCommunity" class="sf-textarea" rows="4"
              placeholder="지식인, 디시인사이드, 네이버 카페 등 커뮤니티 인사이트">${esc(research.community)}</textarea>
          </div>
          <div class="sf-source-item">
            <label>🌏 외국 정보 <span class="sf-star">⭐</span></label>
            <textarea id="sfResForeign" class="sf-textarea" rows="4"
              placeholder="강의 2강: 외국 정보가 차별화의 가장 강력한 무기">${esc(research.foreign)}</textarea>
          </div>
        </div>
      </div>

      <div class="sf-callout warning" style="margin-top:16px;">
        <span class="sf-callout-icon">⚠️</span>
        <span><strong>카피 금지</strong> — 구조만 가져오고 주제는 절대 베끼지 말 것</span>
      </div>
    `;
  }

  function bindCh2() {
    const sf = project.shortform;
    if (!sf.research) sf.research = { gate1: false, gate2: false, comments: '', internet: '', community: '', foreign: '' };

    function updateGateWarning() {
      const warning = document.getElementById('sfGateWarning');
      if (!warning) return;
      if (!sf.research.gate1 || !sf.research.gate2) {
        warning.classList.add('show');
      } else {
        warning.classList.remove('show');
      }
    }

    const gate1El = document.getElementById('sfGate1');
    if (gate1El) {
      gate1El.addEventListener('change', () => {
        sf.research.gate1 = gate1El.checked;
        const lbl = document.getElementById('sfGate1Label');
        if (lbl) lbl.classList.toggle('checked', gate1El.checked);
        updateGateWarning();
        saveNow(false);
      });
    }

    const gate2El = document.getElementById('sfGate2');
    if (gate2El) {
      gate2El.addEventListener('change', () => {
        sf.research.gate2 = gate2El.checked;
        const lbl = document.getElementById('sfGate2Label');
        if (lbl) lbl.classList.toggle('checked', gate2El.checked);
        updateGateWarning();
        saveNow(false);
      });
    }

    const fields = [
      { id: 'sfResComments',  key: 'comments'  },
      { id: 'sfResInternet',  key: 'internet'  },
      { id: 'sfResCommunity', key: 'community' },
      { id: 'sfResForeign',   key: 'foreign'   }
    ];
    fields.forEach(({ id, key }) => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('input', () => {
          sf.research[key] = el.value;
          saveDebounced();
        });
      }
    });
  }

  // ══════════════════════════════════
  //  Ch3 — 도입부 설계
  // ══════════════════════════════════
  const SCREEN_OPTIONS = [
    { value: 'admire',   icon: '😲', label: '감탄'  },
    { value: 'curious',  icon: '🤔', label: '신기'  },
    { value: 'shock',    icon: '😱', label: '엽기'  },
    { value: 'fear',     icon: '😨', label: '공포'  },
    { value: 'progress', icon: '⏩', label: '진행'  },
    { value: 'sympathy', icon: '🤝', label: '공감'  },
    { value: 'twist',    icon: '🔄', label: '반전'  },
    { value: 'beauty',   icon: '💖', label: '예쁨'  }
  ];

  const TECHNIQUE_OPTIONS = [
    { value: 'word',     label: '단어',    desc: '강한 단어 사용' },
    { value: 'number',   label: '수치',    desc: '구체 숫자 ("5가지", "30초")' },
    { value: 'expr',     label: '표현',    desc: '비유·은유' },
    { value: 'simplify', label: '단순화',  desc: '짧게' },
    { value: 'target',   label: '타겟 지칭', desc: '칵테일 파티 효과 ("3년차 직장인")' }
  ];

  function renderCh3() {
    const intro = project.shortform?.intro || {};
    const techniques = Array.isArray(intro.techniques) ? intro.techniques : [];
    const overlayLen = (intro.overlay || '').length;

    const screenCardsHtml = SCREEN_OPTIONS.map(s => `
      <label class="sf-screen-card">
        <input type="radio" name="sfScreen" value="${s.value}" ${intro.screen === s.value ? 'checked' : ''}>
        <div class="sf-screen-card-inner">
          <div class="sf-screen-card-icon">${s.icon}</div>
          <div class="sf-screen-card-label">${s.label}</div>
        </div>
      </label>
    `).join('');

    const techniqueItemsHtml = TECHNIQUE_OPTIONS.map(t => `
      <label class="sf-technique-item ${techniques.includes(t.value) ? 'checked' : ''}">
        <input type="checkbox" name="sfTechnique" value="${t.value}" ${techniques.includes(t.value) ? 'checked' : ''}>
        ${t.label} <span style="font-weight:400;font-size:11px;color:inherit;opacity:0.75;">— ${t.desc}</span>
      </label>
    `).join('');

    return `
      <a href="guide.html#3" class="sf-guide-link" target="_blank">📖 강의 3강 §도입부 →</a>

      <div class="sf-callout important">
        <span class="sf-callout-icon">🔥</span>
        <span><strong>도입부 0.5초가 모든 것.</strong> 본문보다 도입부에 노력 50%를 투자하세요.</span>
      </div>

      <div class="sf-section">
        <div class="sf-field">
          <label>🎯 핵심 문제</label>
          <textarea id="sfIntroProblem" class="sf-textarea" rows="2"
            placeholder="타겟이 가진 진짜 고민">${esc(intro.problem)}</textarea>
        </div>

        <div class="sf-field">
          <label>✨ 긍정 이득</label>
          <textarea id="sfIntroBenefit" class="sf-textarea" rows="2"
            placeholder="이 영상을 보면 얻는 것">${esc(intro.benefit)}</textarea>
        </div>

        <div class="sf-field">
          <label>📌 표시 제목 <span style="font-size:11px;font-weight:400;color:var(--text-muted);">(영상 화면 오버레이)</span></label>
          <div class="sf-input-wrapper">
            <input id="sfIntroOverlay" type="text" class="sf-input" maxlength="30"
              value="${esc(intro.overlay)}"
              placeholder="가장 많이 보이는 텍스트. 짧고 강력하게.">
            <span class="sf-char-counter ${overlayLen > 15 ? 'over' : ''}" id="sfOverlayCounter">${overlayLen}/15</span>
          </div>
          <div class="sf-hint">15자 이내 권장. 현재 ${overlayLen}자.</div>
        </div>
      </div>

      <div class="sf-divider"></div>

      <div class="sf-section">
        <div class="sf-section-title">🎬 도입 화면 유형 <span style="font-size:12px;font-weight:400;color:var(--text-muted);">강의 3강: 8유형 중 하나</span></div>
        <div class="sf-screen-cards" id="sfScreenCards">
          ${screenCardsHtml}
        </div>
      </div>

      <div class="sf-divider"></div>

      <div class="sf-section">
        <div class="sf-section-title">🔥 문구 강화 5가지</div>
        <div class="sf-technique-group" id="sfTechniqueGroup">
          ${techniqueItemsHtml}
        </div>
      </div>

      <a href="dictionary.html#intro" class="sf-dict-link" target="_blank">
        📚 구조 사전에서 도입부 불러오기 → <span style="font-size:10px;color:var(--text-muted);">(F5에서 본격 통합)</span>
      </a>
    `;
  }

  function bindCh3() {
    const sf = project.shortform;
    if (!sf.intro) sf.intro = { problem: '', benefit: '', overlay: '', screen: null, techniques: [] };
    if (!Array.isArray(sf.intro.techniques)) sf.intro.techniques = [];

    const problemEl = document.getElementById('sfIntroProblem');
    if (problemEl) {
      problemEl.addEventListener('input', () => {
        sf.intro.problem = problemEl.value;
        saveDebounced();
      });
    }

    const benefitEl = document.getElementById('sfIntroBenefit');
    if (benefitEl) {
      benefitEl.addEventListener('input', () => {
        sf.intro.benefit = benefitEl.value;
        saveDebounced();
      });
    }

    const overlayEl = document.getElementById('sfIntroOverlay');
    const counterEl = document.getElementById('sfOverlayCounter');
    if (overlayEl) {
      overlayEl.addEventListener('input', () => {
        sf.intro.overlay = overlayEl.value;
        const len = overlayEl.value.length;
        if (counterEl) {
          counterEl.textContent = len + '/15';
          counterEl.classList.toggle('over', len > 15);
        }
        saveDebounced();
      });
    }

    // 도입 화면 라디오 → 즉시 저장
    document.querySelectorAll('input[name="sfScreen"]').forEach(radio => {
      radio.addEventListener('change', () => {
        if (radio.checked) {
          sf.intro.screen = radio.value;
          saveNow(false);
        }
      });
    });

    // 문구 강화 체크박스 → 즉시 저장
    document.querySelectorAll('input[name="sfTechnique"]').forEach(cb => {
      cb.addEventListener('change', () => {
        const techniques = [];
        document.querySelectorAll('input[name="sfTechnique"]:checked').forEach(c => techniques.push(c.value));
        sf.intro.techniques = techniques;
        // 레이블 시각 업데이트
        cb.closest('.sf-technique-item').classList.toggle('checked', cb.checked);
        saveNow(false);
      });
    });
  }

  // ── 초기화 ──
  document.getElementById('sfWorkbook').style.display = 'block';
  updateContextBar();
  renderChapter(1);

})();
