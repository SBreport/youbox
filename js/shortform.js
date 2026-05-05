// shortform.js — 숏폼 제작 워크북 (S5: Ch1~6 구현 + 키모드 분기)

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
  modeBadge.textContent = mode === 'key' ? '🔑 키 (수익화)' : '📡 풀링';
  modeBadge.style.display = 'inline-flex';
  if (mode === 'key') modeBadge.classList.add('is-key-mode');

  // 키 모드 시 body에 클래스 추가
  if (mode === 'key') document.body.classList.add('is-key-mode');

  // ── 컨텍스트 바 갱신 ──
  // SHORTFORM_CONCEPTS.pullingTemplates 에서 동적 생성 (F5)
  const TEMPLATE_NAMES = Object.fromEntries(
    SHORTFORM_CONCEPTS.pullingTemplates.map(t => [t.id, t.icon + ' ' + t.label])
  );

  function updateContextBar() {
    const sf = project.shortform || {};
    const topic = sf.topic || {};
    const modeLabel = (sf.mode === 'key') ? '🔑 키' : '📡 풀링';

    const ctxMode = document.getElementById('sfCtxModeBadge');
    const ctxTopic = document.getElementById('sfCtxTopic');
    const ctxTarget = document.getElementById('sfCtxTarget');
    const ctxTemplate = document.getElementById('sfCtxTemplate');

    if (ctxMode) {
      ctxMode.textContent = modeLabel;
      ctxMode.classList.toggle('is-key-mode', sf.mode === 'key');
    }

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

  // 챕터 완료 조건 판별
  function isChapterDone(ch) {
    const sf = project.shortform || {};
    const topic = sf.topic || {};
    const research = sf.research || {};
    const intro = sf.intro || {};
    const script = sf.script || {};
    const storyboard = sf.storyboard || {};
    const publish = sf.publish || {};
    if (ch === 1) return !!(topic.main && topic.template);
    if (ch === 2) return !!(research.gate1 && research.gate2) || !!(research.comments || research.internet || research.community || research.foreign);
    if (ch === 3) return !!(intro.problem && intro.benefit && intro.screen);
    if (ch === 4) return (script.body || '').replace(/\n/g, '').length >= 150;
    if (ch === 5) return (storyboard.cuts || []).length >= 5;
    if (ch === 6) return !!(publish.title);
    return false;
  }

  function updateTabDoneMarks() {
    tabs.forEach(tab => {
      const ch = parseInt(tab.dataset.ch);
      const done = isChapterDone(ch);
      tab.classList.toggle('done', done);
      // 탭 텍스트에 ✓ 마크 토글
      const baseText = tab.dataset.label || tab.textContent.replace(' ✓', '');
      if (!tab.dataset.label) tab.dataset.label = baseText;
      tab.textContent = done ? baseText + ' ✓' : baseText;
    });
  }

  function switchChapter(ch) {
    currentCh = ch;
    tabs.forEach(t => t.classList.toggle('active', parseInt(t.dataset.ch) === ch));
    renderChapter(ch);
    updateTabDoneMarks();
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
    else if (ch === 4) body.innerHTML = renderCh4();
    else if (ch === 5) body.innerHTML = renderCh5();
    else if (ch === 6) body.innerHTML = renderCh6();

    if (ch === 1) bindCh1();
    else if (ch === 2) bindCh2();
    else if (ch === 3) bindCh3();
    else if (ch === 4) bindCh4();
    else if (ch === 5) bindCh5();
    else if (ch === 6) bindCh6();
  }

  // ══════════════════════════════════
  //  Ch1 — 주제 + 템플릿
  // ══════════════════════════════════
  function renderCh1() {
    const topic = project.shortform?.topic || {};

    // SHORTFORM_CONCEPTS.pullingTemplates 에서 렌더 (F5)
    const cardsHtml = SHORTFORM_CONCEPTS.pullingTemplates.map(t => `
      <label class="sf-template-card">
        <input type="radio" name="sfTemplate" value="${t.id}" ${topic.template === t.id ? 'checked' : ''}>
        <div class="sf-template-card-inner">
          <div class="sf-template-card-icon">${t.icon}</div>
          <div class="sf-template-card-name">${t.label}</div>
          <div class="sf-template-card-example">${t.example}</div>
        </div>
      </label>
    `).join('');

    // 키 모드 추가 섹션
    const keyShort = project.shortform?.keyShort || {};
    const isKey = (project.shortform?.mode === 'key');

    // SHORTFORM_CONCEPTS.keyTemplates 에서 렌더 (F5)
    const keyTemplateCardsHtml = SHORTFORM_CONCEPTS.keyTemplates.map(t => `
      <label class="sf-template-card">
        <input type="radio" name="sfKeyTemplate" value="${t.id}" ${keyShort.template === t.id ? 'checked' : ''}>
        <div class="sf-template-card-inner">
          <div class="sf-template-card-icon">${t.icon}</div>
          <div class="sf-template-card-name">${t.label}</div>
          <div class="sf-template-card-example">${t.example}</div>
        </div>
      </label>
    `).join('');

    // SHORTFORM_CONCEPTS.engagementLevels 에서 렌더 (F5)
    const engagementHtml = SHORTFORM_CONCEPTS.engagementLevels.map(e => `
      <label class="sf-check-item ${keyShort.engagement === e.id ? 'checked' : ''}" id="sfEngLabel_${e.id}">
        <input type="radio" name="sfEngagement" value="${e.id}" ${keyShort.engagement === e.id ? 'checked' : ''}>
        <div class="sf-check-item-text">
          <div class="sf-check-item-label">${e.label}</div>
          <div class="sf-check-item-desc">${e.desc}</div>
        </div>
      </label>
    `).join('');

    const keySection = isKey ? `
      <div class="sf-divider"></div>
      <div class="sf-section sf-key-section" id="sfKeySection">
        <div class="sf-section-title">🔑 키 템플릿 6종 <span style="font-size:12px;font-weight:400;color:var(--text-muted);">강의 5강</span></div>
        <div class="sf-template-cards sf-key-template-cards" id="sfKeyTemplateCards">
          ${keyTemplateCardsHtml}
        </div>

        <div class="sf-field" style="margin-top:18px;">
          <div class="sf-section-title" style="font-size:13px;">⚙️ 관여도 분기 <span style="font-size:12px;font-weight:400;color:var(--text-muted);">강의 5강</span></div>
          <div class="sf-check-group" id="sfEngagementGroup">
            ${engagementHtml}
          </div>
        </div>
      </div>
    ` : '';

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

      ${keySection}
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
          updateTabDoneMarks();
          saveNow(false);
        }
      });
    });

    // 키 템플릿 라디오 → 즉시 저장
    if (!sf.keyShort) sf.keyShort = { template: null, persuasionTactics: [], engagement: null };
    document.querySelectorAll('input[name="sfKeyTemplate"]').forEach(radio => {
      radio.addEventListener('change', () => {
        if (radio.checked) {
          sf.keyShort.template = radio.value;
          saveNow(false);
        }
      });
    });

    // 관여도 라디오 → 즉시 저장
    document.querySelectorAll('input[name="sfEngagement"]').forEach(radio => {
      radio.addEventListener('change', () => {
        if (radio.checked) {
          sf.keyShort.engagement = radio.value;
          // 라디오지만 check-item 스타일 토글
          document.querySelectorAll('[id^="sfEngLabel_"]').forEach(lbl => {
            lbl.classList.remove('checked');
          });
          const lbl = document.getElementById('sfEngLabel_' + radio.value);
          if (lbl) lbl.classList.add('checked');
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
  // Ch3·Ch4 공유 옵션 — SHORTFORM_CONCEPTS에서 참조 (F5)
  // 하위 호환 alias: 기존 코드가 SCREEN_OPTIONS / TECHNIQUE_OPTIONS를 직접 참조하는 경우를 위해 유지
  const SCREEN_OPTIONS    = SHORTFORM_CONCEPTS.introScreens;
  const TECHNIQUE_OPTIONS = SHORTFORM_CONCEPTS.enhanceTechniques;

  function renderCh3() {
    const intro = project.shortform?.intro || {};
    const techniques = Array.isArray(intro.techniques) ? intro.techniques : [];
    const overlayLen = (intro.overlay || '').length;

    // SHORTFORM_CONCEPTS.introScreens 에서 렌더 (F5)
    const screenCardsHtml = SCREEN_OPTIONS.map(s => `
      <label class="sf-screen-card">
        <input type="radio" name="sfScreen" value="${s.id}" ${intro.screen === s.id ? 'checked' : ''}>
        <div class="sf-screen-card-inner">
          <div class="sf-screen-card-icon">${s.icon}</div>
          <div class="sf-screen-card-label">${s.label}</div>
        </div>
      </label>
    `).join('');

    // SHORTFORM_CONCEPTS.enhanceTechniques 에서 렌더 (F5)
    const techniqueItemsHtml = TECHNIQUE_OPTIONS.map(t => `
      <label class="sf-technique-item ${techniques.includes(t.id) ? 'checked' : ''}">
        <input type="checkbox" name="sfTechnique" value="${t.id}" ${techniques.includes(t.id) ? 'checked' : ''}>
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

  // ══════════════════════════════════
  //  Ch4 — 원고
  // ══════════════════════════════════
  function renderCh4() {
    const script = project.shortform?.script || {};
    const techniques = Array.isArray(script.techniques) ? script.techniques : [];
    const bodyLen = (script.body || '').length;
    const bodyLenNl = (script.body || '').replace(/\n/g, '').length;
    const seconds = Math.round(bodyLenNl / 10);

    // 프로그레스 퍼센트 (0~600자 → 0~100%)
    const pct = Math.min(100, Math.round((bodyLenNl / 600) * 100));
    const progressClass = bodyLenNl === 0 ? 'empty' : bodyLenNl > 600 ? 'over' : bodyLenNl >= 150 ? 'good' : 'short';

    // SHORTFORM_CONCEPTS.enhanceTechniques 에서 렌더 (F5)
    const techniqueItemsHtml = TECHNIQUE_OPTIONS.map(t => `
      <label class="sf-technique-item ${techniques.includes(t.id) ? 'checked' : ''}">
        <input type="checkbox" name="sfScriptTechnique" value="${t.id}" ${techniques.includes(t.id) ? 'checked' : ''}>
        ${t.label} <span style="font-weight:400;font-size:11px;color:inherit;opacity:0.75;">— ${t.desc}</span>
      </label>
    `).join('');

    return `
      <a href="guide.html#3" class="sf-guide-link" target="_blank">📖 강의 3강 §원고 4체크포인트 →</a>

      <div class="sf-callout important">
        <span class="sf-callout-icon">📝</span>
        <span><strong>1초 = 10자, 30초 = 300자, 60초 = 600자.</strong> 이 비율로 원고 길이를 맞추세요.</span>
      </div>

      <div class="sf-section">
        <div class="sf-field">
          <label>📝 원고 본문 <span class="sf-required">*</span></label>
          <textarea id="sfScriptBody" class="sf-textarea sf-script-textarea" rows="10"
            placeholder="도입부부터 마무리 행동 유도까지 원고 전체를 작성하세요.">${esc(script.body)}</textarea>
          <div class="sf-script-counter-row">
            <span class="sf-script-char-info">글자수: <span id="sfScriptCharCount">${bodyLenNl}</span>자 (~<span id="sfScriptSeconds">${seconds}</span>초)</span>
            <span class="sf-script-char-hint" id="sfScriptHint">${bodyLenNl > 600 ? '⚠️ 너무 길어요 (권장 600자 이내)' : bodyLenNl >= 150 ? '✅ 좋은 길이' : '권장 최소 150자'}</span>
          </div>
          <div class="sf-script-progress-wrap">
            <div class="sf-script-progress-bar ${progressClass}" id="sfScriptProgressBar" style="width:${pct}%"></div>
            <div class="sf-script-progress-marker" style="left:50%">300자</div>
            <div class="sf-script-progress-marker sf-script-progress-marker-end">600자</div>
          </div>
        </div>

        <div class="sf-field">
          <label>🎁 결론 행동 버튼 <span class="sf-required">*</span></label>
          <textarea id="sfScriptCta" class="sf-textarea" rows="2"
            placeholder="영상 끝에 시청자에게 요청하는 행동. 예: &quot;댓글에 OO 남겨주세요&quot; / &quot;지금 링크 클릭&quot;">${esc(script.cta)}</textarea>
        </div>

        <div class="sf-field">
          <div class="sf-section-title" style="font-size:13px;">🔥 문구 강화 적용 5종</div>
          <div class="sf-technique-group" id="sfScriptTechniqueGroup">
            ${techniqueItemsHtml}
          </div>
        </div>
      </div>

      <a href="dictionary.html#hook" class="sf-dict-link" target="_blank">
        📚 구조 사전에서 후크 불러오기 →
      </a>
    `;
  }

  function bindCh4() {
    const sf = project.shortform;
    if (!sf.script) sf.script = { body: '', cta: '', techniques: [] };
    if (!Array.isArray(sf.script.techniques)) sf.script.techniques = [];

    const bodyEl = document.getElementById('sfScriptBody');
    const charCountEl = document.getElementById('sfScriptCharCount');
    const secondsEl = document.getElementById('sfScriptSeconds');
    const hintEl = document.getElementById('sfScriptHint');
    const barEl = document.getElementById('sfScriptProgressBar');

    function updateScriptCounter() {
      const raw = bodyEl.value;
      const len = raw.replace(/\n/g, '').length;
      const sec = Math.round(len / 10);
      const pct = Math.min(100, Math.round((len / 600) * 100));
      if (charCountEl) charCountEl.textContent = len;
      if (secondsEl) secondsEl.textContent = sec;
      if (hintEl) {
        hintEl.textContent = len > 600 ? '⚠️ 너무 길어요 (권장 600자 이내)' : len >= 150 ? '✅ 좋은 길이' : '권장 최소 150자';
      }
      if (barEl) {
        barEl.style.width = pct + '%';
        barEl.className = 'sf-script-progress-bar ' + (len === 0 ? 'empty' : len > 600 ? 'over' : len >= 150 ? 'good' : 'short');
      }
    }

    if (bodyEl) {
      bodyEl.addEventListener('input', () => {
        sf.script.body = bodyEl.value;
        updateScriptCounter();
        updateTabDoneMarks();
        saveDebounced();
      });
    }

    const ctaEl = document.getElementById('sfScriptCta');
    if (ctaEl) {
      ctaEl.addEventListener('input', () => {
        sf.script.cta = ctaEl.value;
        saveDebounced();
      });
    }

    document.querySelectorAll('input[name="sfScriptTechnique"]').forEach(cb => {
      cb.addEventListener('change', () => {
        const techniques = [];
        document.querySelectorAll('input[name="sfScriptTechnique"]:checked').forEach(c => techniques.push(c.value));
        sf.script.techniques = techniques;
        cb.closest('.sf-technique-item').classList.toggle('checked', cb.checked);
        saveNow(false);
      });
    });
  }

  // ══════════════════════════════════
  //  Ch5 — 콘티 (스토리보드)
  // ══════════════════════════════════
  function renderCh5() {
    const storyboard = project.shortform?.storyboard || {};
    const cuts = Array.isArray(storyboard.cuts) ? storyboard.cuts : [];

    const cutsHtml = cuts.map((cut, i) => renderCutCard(cut, i)).join('');
    const totalSec = cuts.reduce((sum, c) => sum + (parseFloat(c.duration) || 0), 0);
    const totalSecRound = Math.round(totalSec * 10) / 10;

    const durationClass = totalSec <= 0 ? '' : totalSec <= 30 ? 'good-30' : totalSec <= 60 ? 'good-60' : 'over';

    return `
      <a href="guide.html#3" class="sf-guide-link" target="_blank">📖 강의 3강 §콘티 →</a>

      <div class="sf-callout" style="background:rgba(99,102,241,0.07);border:1px solid rgba(99,102,241,0.25);color:#6366f1;margin-bottom:18px;">
        <span class="sf-callout-icon">🎬</span>
        <span>원고 문장별로 화면을 지정하세요. <strong>5~7컷 권장</strong>. 컷 길이 0.5~5초.</span>
      </div>

      <div id="sfCutList" class="sf-cut-list">
        ${cutsHtml}
      </div>

      <button type="button" class="sf-add-cut-btn" id="sfAddCutBtn">+ 컷 추가</button>

      <div class="sf-cut-total ${durationClass}" id="sfCutTotal">
        총 길이 <strong id="sfCutTotalSec">${totalSecRound}</strong>초
        <span class="sf-cut-total-hint" id="sfCutTotalHint">${totalSec <= 0 ? '' : totalSec <= 30 ? '(30초 이내 ✅)' : totalSec <= 60 ? '(60초 이내 ✅)' : '⚠️ 60초 초과'}</span>
        <div class="sf-cut-duration-markers">
          <span class="sf-cut-marker" style="left:calc(30/60*100%)">30초</span>
          <span class="sf-cut-marker sf-cut-marker-end">60초</span>
        </div>
      </div>

      <a href="dictionary.html#cut" class="sf-dict-link" target="_blank">
        📚 구조 사전에서 컷 패턴 불러오기 →
      </a>
    `;
  }

  function renderCutCard(cut, index) {
    const n = index + 1;
    return `
      <div class="sf-cut-card" data-index="${index}">
        <div class="sf-cut-card-header">
          <span class="sf-cut-num">#${n}</span>
          <button type="button" class="sf-cut-delete-btn" data-index="${index}" title="컷 삭제">✕</button>
        </div>
        <div class="sf-cut-fields">
          <div class="sf-cut-field">
            <label>화면 설명</label>
            <textarea class="sf-textarea sf-cut-screen" rows="2" data-index="${index}" data-field="screen"
              placeholder="이 컷에서 보이는 화면 묘사">${esc(cut.screen)}</textarea>
          </div>
          <div class="sf-cut-field">
            <label>자막</label>
            <input type="text" class="sf-input sf-cut-subtitle" data-index="${index}" data-field="subtitle"
              value="${esc(cut.subtitle)}" placeholder="화면에 표시될 자막">
          </div>
          <div class="sf-cut-fields-row">
            <div class="sf-cut-field sf-cut-field-sm">
              <label>길이 (초)</label>
              <input type="number" class="sf-input sf-cut-duration" data-index="${index}" data-field="duration"
                min="0.5" max="30" step="0.5" value="${esc(cut.duration)}" placeholder="초">
            </div>
            <div class="sf-cut-field sf-cut-field-lg">
              <label>효과음·BGM</label>
              <input type="text" class="sf-input sf-cut-sfx" data-index="${index}" data-field="sfx"
                value="${esc(cut.sfx)}" placeholder="효과음, BGM 지정">
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function bindCh5() {
    const sf = project.shortform;
    if (!sf.storyboard) sf.storyboard = { cuts: [] };
    if (!Array.isArray(sf.storyboard.cuts)) sf.storyboard.cuts = [];

    function updateCutTotal() {
      const cuts = sf.storyboard.cuts;
      const total = cuts.reduce((sum, c) => sum + (parseFloat(c.duration) || 0), 0);
      const rounded = Math.round(total * 10) / 10;
      const totalEl = document.getElementById('sfCutTotal');
      const totalSecEl = document.getElementById('sfCutTotalSec');
      const hintEl = document.getElementById('sfCutTotalHint');
      if (totalSecEl) totalSecEl.textContent = rounded;
      if (hintEl) {
        hintEl.textContent = total <= 0 ? '' : total <= 30 ? '(30초 이내 ✅)' : total <= 60 ? '(60초 이내 ✅)' : '⚠️ 60초 초과';
      }
      if (totalEl) {
        totalEl.className = 'sf-cut-total ' + (total <= 0 ? '' : total <= 30 ? 'good-30' : total <= 60 ? 'good-60' : 'over');
      }
    }

    function rebindCutInputs() {
      // 화면 설명 textarea, 자막 input, 길이 input, 효과음 input
      document.querySelectorAll('.sf-cut-screen, .sf-cut-subtitle, .sf-cut-duration, .sf-cut-sfx').forEach(el => {
        el.addEventListener('input', () => {
          const idx = parseInt(el.dataset.index);
          const field = el.dataset.field;
          if (!sf.storyboard.cuts[idx]) return;
          sf.storyboard.cuts[idx][field] = el.value;
          if (field === 'duration') updateCutTotal();
          updateTabDoneMarks();
          saveDebounced();
        });
      });

      // 삭제 버튼
      document.querySelectorAll('.sf-cut-delete-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const idx = parseInt(btn.dataset.index);
          sf.storyboard.cuts.splice(idx, 1);
          const list = document.getElementById('sfCutList');
          if (list) list.innerHTML = sf.storyboard.cuts.map((c, i) => renderCutCard(c, i)).join('');
          updateCutTotal();
          updateTabDoneMarks();
          rebindCutInputs();
          saveNow(false);
        });
      });
    }

    const addBtn = document.getElementById('sfAddCutBtn');
    if (addBtn) {
      addBtn.addEventListener('click', () => {
        const newCut = { screen: '', subtitle: '', duration: '', sfx: '' };
        sf.storyboard.cuts.push(newCut);
        const list = document.getElementById('sfCutList');
        if (list) {
          const idx = sf.storyboard.cuts.length - 1;
          list.insertAdjacentHTML('beforeend', renderCutCard(newCut, idx));
        }
        updateCutTotal();
        updateTabDoneMarks();
        rebindCutInputs();
        saveNow(false);
      });
    }

    rebindCutInputs();
  }

  // ══════════════════════════════════
  //  Ch6 — 발행 + 회고
  // ══════════════════════════════════
  function renderCh6() {
    const publish = project.shortform?.publish || {};
    const review = project.shortform?.review || {};
    const keyShort = project.shortform?.keyShort || {};
    const isKey = (project.shortform?.mode === 'key');
    const platforms = publish.platforms || {};

    const titleLen = (publish.title || '').length;

    const platformList = [
      { key: 'youtube',   label: 'YouTube Shorts' },
      { key: 'instagram', label: 'Instagram Reels' },
      { key: 'tiktok',    label: 'TikTok' },
      { key: 'threads',   label: 'Threads' },
      { key: 'naverClip', label: '네이버 클립 ⭐' }
    ];

    const platformsHtml = platformList.map(p => `
      <label class="sf-platform-item ${platforms[p.key] ? 'checked' : ''}" id="sfPlatLabel_${p.key}">
        <input type="checkbox" class="sf-platform-cb" data-platform="${p.key}" ${platforms[p.key] ? 'checked' : ''}>
        <span>${p.label}</span>
      </label>
    `).join('');

    // 키 모드 전용: 설득 꿀팁 4종 — SHORTFORM_CONCEPTS.persuasionTactics 에서 렌더 (F5)
    const persuasionTactics = Array.isArray(keyShort.persuasionTactics) ? keyShort.persuasionTactics : [];

    const persuasionHtml = SHORTFORM_CONCEPTS.persuasionTactics.map(t => `
      <label class="sf-technique-item ${persuasionTactics.includes(t.id) ? 'checked' : ''}">
        <input type="checkbox" name="sfPersuasion" value="${t.id}" ${persuasionTactics.includes(t.id) ? 'checked' : ''}>
        ${t.label} <span style="font-weight:400;font-size:11px;color:inherit;opacity:0.75;">— ${t.desc}</span>
      </label>
    `).join('');

    const keyPersuasionSection = isKey ? `
      <div class="sf-divider"></div>
      <div class="sf-section sf-key-section">
        <div class="sf-section-title">💪 설득 꿀팁 4종 <span style="font-size:12px;font-weight:400;color:var(--text-muted);">강의 5강</span></div>
        <div class="sf-technique-group" id="sfPersuasionGroup">
          ${persuasionHtml}
        </div>
      </div>
    ` : '';

    return `
      <a href="guide.html#6" class="sf-guide-link" target="_blank">📖 강의 6강 §발행 + 회고 →</a>

      <div class="sf-section">
        <div class="sf-section-title">📤 발행 정보</div>

        <div class="sf-field">
          <label>🎬 영상 제목 <span class="sf-required">*</span></label>
          <div class="sf-input-wrapper">
            <input id="sfPublishTitle" type="text" class="sf-input" maxlength="80"
              value="${esc(publish.title)}"
              placeholder="유튜브 쇼츠 / 릴스용 영상 제목">
            <span class="sf-char-counter ${titleLen > 40 ? 'over' : ''}" id="sfPublishTitleCounter">${titleLen}/40</span>
          </div>
        </div>

        <div class="sf-field">
          <label>📝 설명</label>
          <textarea id="sfPublishDesc" class="sf-textarea" rows="3"
            placeholder="영상 설명란에 들어갈 내용">${esc(publish.description)}</textarea>
        </div>

        <div class="sf-field">
          <label>🏷️ 해시태그</label>
          <input id="sfPublishHashtags" type="text" class="sf-input"
            value="${esc(publish.hashtags)}"
            placeholder="#숏폼 #유튜브쇼츠 #...">
        </div>

        <div class="sf-field">
          <label>📅 발행 예정 시간</label>
          <input id="sfPublishSchedule" type="datetime-local" class="sf-input"
            value="${esc(publish.scheduledAt)}">
        </div>

        <div class="sf-field">
          <label>🌐 플랫폼 동시 업로드</label>
          <div class="sf-platform-group">
            ${platformsHtml}
          </div>
        </div>
      </div>

      ${keyPersuasionSection}

      <div class="sf-divider"></div>

      <div class="sf-section sf-review-section">
        <div class="sf-section-title">🪞 회고 <span style="font-size:12px;font-weight:400;color:var(--text-muted);">발행 후 작성</span></div>

        <div class="sf-field">
          <label>📉 첫 3초 이탈률</label>
          <input id="sfReviewDropoff" type="text" class="sf-input"
            value="${esc(review.dropoff3s)}"
            placeholder="예: 40% → 20%로 개선 목표">
        </div>

        <div class="sf-field">
          <label>🔁 루프 재생 횟수</label>
          <input id="sfReviewLoop" type="text" class="sf-input"
            value="${esc(review.loopCount)}"
            placeholder="예: 2.3회">
        </div>

        <div class="sf-field">
          <label>💡 다음 영상에 쓸 교훈</label>
          <textarea id="sfReviewLesson" class="sf-textarea" rows="3"
            placeholder="이 영상에서 배운 점, 다음에 바꿀 것">${esc(review.lesson)}</textarea>
        </div>

        <div class="sf-review-actions">
          <a href="dictionary.html" class="sf-dict-link" target="_blank" style="margin-top:0;">
            📚 구조 사전에 추가 →
          </a>
          <button type="button" class="btn btn-primary sf-review-done-btn ${review.completedAt ? 'done' : ''}" id="sfReviewDoneBtn">
            ${review.completedAt ? '✓ 회고 완료됨' : '✓ 회고 완료'}
          </button>
        </div>
      </div>
    `;
  }

  function bindCh6() {
    const sf = project.shortform;
    if (!sf.publish) sf.publish = { title: '', description: '', hashtags: '', scheduledAt: '', platforms: { youtube: false, instagram: false, tiktok: false, threads: false, naverClip: false } };
    if (!sf.publish.platforms) sf.publish.platforms = { youtube: false, instagram: false, tiktok: false, threads: false, naverClip: false };
    if (!sf.review) sf.review = { dropoff3s: '', loopCount: '', lesson: '', completedAt: '' };
    if (!sf.keyShort) sf.keyShort = { template: null, persuasionTactics: [], engagement: null };
    if (!Array.isArray(sf.keyShort.persuasionTactics)) sf.keyShort.persuasionTactics = [];

    const titleEl = document.getElementById('sfPublishTitle');
    const titleCounterEl = document.getElementById('sfPublishTitleCounter');
    if (titleEl) {
      titleEl.addEventListener('input', () => {
        sf.publish.title = titleEl.value;
        const len = titleEl.value.length;
        if (titleCounterEl) {
          titleCounterEl.textContent = len + '/40';
          titleCounterEl.classList.toggle('over', len > 40);
        }
        updateTabDoneMarks();
        saveDebounced();
      });
    }

    const descEl = document.getElementById('sfPublishDesc');
    if (descEl) {
      descEl.addEventListener('input', () => {
        sf.publish.description = descEl.value;
        saveDebounced();
      });
    }

    const hashEl = document.getElementById('sfPublishHashtags');
    if (hashEl) {
      hashEl.addEventListener('input', () => {
        sf.publish.hashtags = hashEl.value;
        saveDebounced();
      });
    }

    const schedEl = document.getElementById('sfPublishSchedule');
    if (schedEl) {
      schedEl.addEventListener('input', () => {
        sf.publish.scheduledAt = schedEl.value;
        saveDebounced();
      });
    }

    // 플랫폼 체크박스
    document.querySelectorAll('.sf-platform-cb').forEach(cb => {
      cb.addEventListener('change', () => {
        const platform = cb.dataset.platform;
        sf.publish.platforms[platform] = cb.checked;
        const lbl = document.getElementById('sfPlatLabel_' + platform);
        if (lbl) lbl.classList.toggle('checked', cb.checked);
        saveNow(false);
      });
    });

    // 설득 꿀팁 체크박스 (키 모드)
    document.querySelectorAll('input[name="sfPersuasion"]').forEach(cb => {
      cb.addEventListener('change', () => {
        const tactics = [];
        document.querySelectorAll('input[name="sfPersuasion"]:checked').forEach(c => tactics.push(c.value));
        sf.keyShort.persuasionTactics = tactics;
        cb.closest('.sf-technique-item').classList.toggle('checked', cb.checked);
        saveNow(false);
      });
    });

    // 회고 필드들
    const dropoffEl = document.getElementById('sfReviewDropoff');
    if (dropoffEl) {
      dropoffEl.addEventListener('input', () => {
        sf.review.dropoff3s = dropoffEl.value;
        saveDebounced();
      });
    }

    const loopEl = document.getElementById('sfReviewLoop');
    if (loopEl) {
      loopEl.addEventListener('input', () => {
        sf.review.loopCount = loopEl.value;
        saveDebounced();
      });
    }

    const lessonEl = document.getElementById('sfReviewLesson');
    if (lessonEl) {
      lessonEl.addEventListener('input', () => {
        sf.review.lesson = lessonEl.value;
        saveDebounced();
      });
    }

    const doneBtnEl = document.getElementById('sfReviewDoneBtn');
    if (doneBtnEl) {
      doneBtnEl.addEventListener('click', () => {
        const isAlreadyDone = !!sf.review.completedAt;
        if (isAlreadyDone) {
          sf.review.completedAt = '';
          doneBtnEl.textContent = '✓ 회고 완료';
          doneBtnEl.classList.remove('done');
        } else {
          sf.review.completedAt = new Date().toISOString();
          doneBtnEl.textContent = '✓ 회고 완료됨';
          doneBtnEl.classList.add('done');
          showSaveToast('회고 완료!');
        }
        saveNow(false);
      });
    }
  }

  // ── 초기화 ──
  document.getElementById('sfWorkbook').style.display = 'block';
  updateContextBar();
  renderChapter(1);

})();
