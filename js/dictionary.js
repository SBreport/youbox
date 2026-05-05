(function () {
  function updateCounts() {
    var counts = DictionaryDB.countByCategory();
    var cats = DictionaryDB.getCategories();
    cats.forEach(function (cat) {
      var countEl = document.getElementById('dictCount_' + cat.id);
      if (!countEl) return;
      var n = counts[cat.id] || 0;
      countEl.textContent = n + '개';
      countEl.classList.toggle('has-count', n > 0);
    });

    var total = Object.values(counts).reduce(function (a, b) { return a + b; }, 0);
    var noticeEl = document.getElementById('dictNotice');
    if (noticeEl) {
      noticeEl.innerHTML = total > 0
        ? '🆕 ' + total + '개 카드 — 본격 검색·필터는 S3에서 구현됩니다.'
        : '🆕 0개 카드 — <a href="shortform-study.html" style="color:var(--accent);">끝내기</a>에서 분석을 완료하면 카드가 쌓입니다. 본격 검색·필터는 S3에서 구현됩니다.';
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', updateCounts);
  } else {
    updateCounts();
  }
})();
