// 기획 로그 — 렌더 로직 (JSON fetch -> DOM). 빌드 없음.

function esc(s) {
  return String(s).replace(/[&<>"']/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
  });
}

function table(columns, rows) {
  var thead = "<tr>" + columns.map(function (c) { return "<th>" + esc(c) + "</th>"; }).join("") + "</tr>";
  var tbody = rows.map(function (r) {
    return "<tr>" + r.map(function (c) { return "<td>" + esc(c) + "</td>"; }).join("") + "</tr>";
  }).join("");
  return '<div class="table-scroll"><table><thead>' + thead + "</thead><tbody>" + tbody + "</tbody></table></div>";
}

function section(num, title, bodyHtml) {
  return '<section class="ep-section"><span class="sec-num">' + num + '</span><h2>' + esc(title) + "</h2>" + bodyHtml + "</section>";
}

function chips(words) {
  return words.map(function (w) { return '<span class="word-chip">' + esc(w) + "</span>"; }).join("");
}

function checklist(items) {
  return '<ul class="checklist">' + items.map(function (i) { return "<li>" + esc(i) + "</li>"; }).join("") + "</ul>";
}

function plainList(items) {
  return '<ul class="plain">' + items.map(function (i) { return "<li>" + esc(i) + "</li>"; }).join("") + "</ul>";
}

function buildEpisodeHtml(ep) {
  var h = ep.header;
  var html = "";

  html += '<div class="ep-header">' +
    '<span class="badge card-num">#' + esc(h.번호) + "</span>" +
    "<h1>" + esc(h.제목) + "</h1>" +
    '<div class="meta-row">' +
      "<span>상태: " + esc(h.상태) + "</span>" +
      "<span>묶음: " + esc(h.묶음) + "</span>" +
      "<span>버전: " + esc(h.버전) + "</span>" +
      "<span>정리일: " + esc(h.정리일) + "</span>" +
    "</div></div>";

  // 2. 포지션과 게이트
  var pg = ep.positionGate;
  html += section("2", "포지션과 게이트",
    "<p>" + esc(pg.position) + "</p>" +
    "<p><strong>짤컷식 게이트 7항</strong></p>" + plainList(pg.jjalcutGate) +
    "<p><strong>표절 방지 규칙 5</strong></p>" + plainList(pg.antiPlagiarismRules));

  // 3. 소재
  var matHtml = ep.materials.map(function (m) {
    return '<div class="tip-card">' +
      '<div class="tip-name">' + esc(m.팁) + "</div>" +
      '<div class="tip-row">' + esc(m.라벨) + " " + esc(m.출처명) + ' <span class="badge">' + esc(m.지역) + "</span></div>" +
      '<div class="tip-row"><a href="' + esc(m.url) + '" target="_blank" rel="noopener">' + esc(m.url) + "</a></div>" +
      '<div class="tip-row">국내 기수록: ' + esc(m.국내기수록검사) + "</div>" +
      "</div>";
  }).join("");
  html += section("3", "소재 — 어디서 가져왔나", matHtml);

  // 4. 벤치
  var b = ep.bench;
  var videoHtml = "<ul class=\"plain\">" + b.videos.map(function (v) {
    return "<li>" + esc(v.제목) + " · " + esc(v.조회수) + ' — <a href="' + esc(v.url) + '" target="_blank" rel="noopener">' + esc(v.url) + "</a></li>";
  }).join("") + "</ul>";
  var patRows = b.commentPatterns.map(function (p) { return [p.패턴, p.좋아요, p.빌린것]; });
  html += section("4", "벤치 — 무엇을 보고 배웠나",
    "<p><strong>벤치 영상</strong></p>" + videoHtml +
    "<p><strong>댓글 반응 패턴</strong></p>" + table(["패턴", "좋아요", "대본에 빌린 것"], patRows));

  // 5. 재구성
  var rc = ep.reconstruction;
  var diffRows = rc.폐기03편비교.rows;
  html += section("5", "재구성 — 어떻게 다시 짰나",
    "<p><strong>묶음 렌즈 변경</strong><br>" + esc(rc.묶음렌즈변경) + "</p>" +
    "<p><strong>팁 배열 순서와 이유</strong><br>" + esc(rc.팁배열) + "</p>" +
    "<p><strong>폐기한 03편과의 차이</strong></p>" +
    table(rc.폐기03편비교.columns, diffRows) +
    "<p>폐기 사유: " + esc(rc.폐기03편비교.폐기사유) + "</p>" +
    "<p><strong>금지어 사전</strong></p><div>" + chips(rc.금지어사전) + "</div>");

  // 6. 본문
  var scriptHtml = ep.script.map(function (s) {
    return '<div class="script-block"><div class="script-time">' + esc(s.시간) + "</div><div>" +
      '<div class="script-title">' + esc(s.소제목) + "</div><div>" + esc(s.본문) + "</div></div></div>";
  }).join("");
  html += section("6", "본문 — 대본", scriptHtml);

  // 7. 제목·썸네일
  var tt = ep.titleThumbnail;
  html += section("7", "제목·썸네일",
    (tt.확정제목 ? "<p><strong>확정 제목</strong> — " + esc(tt.확정제목) + "</p>" : "") + (tt.제목결정과정 ? "<p class=\"muted\">" + esc(tt.제목결정과정) + "</p>" : "") + "<p><strong>제목 후보</strong></p><ol>" + tt.제목3안.map(function (t) { return "<li>" + esc(t) + "</li>"; }).join("") + "</ol>" +
    "<p><strong>썸네일 문구 2안</strong></p><ol>" + tt.썸네일2안.map(function (t) { return "<li>" + esc(t) + "</li>"; }).join("") + "</ol>" +
    "<p>" + esc(tt.양식메모) + "</p>" +
    "<p><strong>이원화 규칙</strong>: " + esc(tt.이원화규칙) + "</p>");

  // 8. 게이트 검수 결과
  var gr = ep.gateResults;
  html += section("8", "검수 게이트 결과", table(gr.columns, gr.rows));

  // 9. needs-me
  html += section("9", "needs-me", checklist(ep.needsMe));

  return html;
}

function renderIndex() {
  var el = document.getElementById("list");
  fetch("episodes/index.json")
    .then(function (r) { return r.json(); })
    .then(function (ids) { return Promise.all(ids.map(function (id) {
      return fetch("episodes/" + id + ".json").then(function (r) { return r.json(); });
    })); })
    .then(function (eps) {
      el.innerHTML = eps.map(function (ep) {
        var h = ep.header;
        return '<a class="card" href="episode.html?id=' + esc(ep.id) + '">' +
          '<span class="card-num">#' + esc(h.번호) + "</span>" +
          "<h2>" + esc(h.제목) + "</h2>" +
          '<div class="card-meta">' + esc(h.상태) + " · " + esc(h.묶음) + " · " + esc(h.정리일) + "</div>" +
          "</a>";
      }).join("");
    })
    .catch(function (e) {
      el.innerHTML = '<p class="error-msg">목록을 불러오지 못했습니다: ' + esc(e.message) + "</p>";
    });
}

function renderEpisode() {
  var el = document.getElementById("ep");
  var id = new URLSearchParams(location.search).get("id");
  if (!id) {
    el.innerHTML = '<p class="error-msg">id 파라미터가 없습니다.</p>';
    return;
  }
  fetch("episodes/" + id + ".json")
    .then(function (r) {
      if (!r.ok) throw new Error("not found");
      return r.json();
    })
    .then(function (ep) {
      document.title = ep.header.제목 + " — 기획 로그";
      el.innerHTML = buildEpisodeHtml(ep);
    })
    .catch(function (e) {
      el.innerHTML = '<p class="error-msg">에피소드를 불러오지 못했습니다: ' + esc(e.message) + "</p>";
    });
}
