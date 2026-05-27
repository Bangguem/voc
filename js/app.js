// ── app.js ────────────────────────────────────────────────────────────────
// 렌더링 + 이벤트 핸들러

// ── 유틸 ──────────────────────────────────────────────────────────────────
function typeLabel(t) {
  return { noun:'명사', verb:'동사', adj:'형용사', adv:'부사' }[t] || t;
}

// ── 테마 ──────────────────────────────────────────────────────────────────
function applyTheme(theme) {
  State.theme = theme;
  document.documentElement.setAttribute('data-theme', theme === 'light' ? 'light' : '');
  document.getElementById('theme-toggle').textContent = theme === 'light' ? '☀️' : '🌙';
  State.save();
}

// ── 글씨 크기 ──────────────────────────────────────────────────────────────
function applyFontSize() {
  document.documentElement.style.setProperty('--fs', State.fontSize + 'px');
  document.getElementById('fs-display').textContent = State.fontSize;
}

// ── 레벨 탭 ───────────────────────────────────────────────────────────────
function applyLevel() {
  document.querySelectorAll('.level-tab').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.level === State.level);
  });
  // 레벨 배지 업데이트
  const badge = State.level.toUpperCase();
  document.getElementById('level-badge').textContent = badge;
  // 필터/검색 초기화
  State.filter = 'all';
  State.search = '';
  document.getElementById('search-input').value = '';
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.toggle('active', b.dataset.filter === 'all'));
  renderList();
  updateStats();
}

// ── 통계 ──────────────────────────────────────────────────────────────────
function updateStats() {
  const total = State.vocab.length;
  const known = State.knownSet.size;
  document.getElementById('known-count').textContent   = known;
  document.getElementById('unknown-count').textContent = State.unknownSet.size;
  document.getElementById('total-count').textContent   = total;

  // 전체 진행 바
  const pct = total > 0 ? Math.round((known / total) * 100) : 0;
  document.getElementById('overall-pct').textContent = pct + '%';
  document.getElementById('overall-fill').style.width = pct + '%';
}

// ── 가시성 토글 ───────────────────────────────────────────────────────────
function applyVisibility() {
  document.body.classList.toggle('hide-reading',    State.hideReadingList);
  document.body.classList.toggle('hide-meaning',    State.hideMeaningList);
  document.body.classList.toggle('fc-hide-reading', State.hideReadingFc);

  const rBtn  = document.getElementById('toggle-reading-list');
  const mBtn  = document.getElementById('toggle-meaning-list');
  const fcBtn = document.getElementById('fc-reading-btn');

  rBtn.classList.toggle('hidden-on',  State.hideReadingList);
  mBtn.classList.toggle('hidden-on',  State.hideMeaningList);
  fcBtn.classList.toggle('hidden-on', State.hideReadingFc);

  rBtn.textContent  = State.hideReadingList ? '🙈 히라가나' : '👁 히라가나';
  mBtn.textContent  = State.hideMeaningList ? '🙈 뜻'       : '👁 뜻';
  fcBtn.textContent = State.hideReadingFc   ? '🙈 히라가나' : '👁 히라가나';
}

// ── 목록 렌더링 ───────────────────────────────────────────────────────────
function renderList() {
  const grid = document.getElementById('word-grid');
  const list = State.filtered();
  document.getElementById('word-count').textContent = `총 ${list.length}개 단어`;

  if (!list.length) {
    grid.innerHTML = '<div class="empty-state">검색 결과가 없습니다.</div>';
    return;
  }

  const k = State.knownSet, u = State.unknownSet;
  grid.innerHTML = list.map(w => {
    const isKnown   = k.has(w.id);
    const isUnknown = u.has(w.id);
    return `<div class="word-card ${isKnown?'known':''} ${isUnknown?'unknown':''}" onclick="toggleExpand(this)">
      <div class="card-top">
        <span class="card-kanji">${w.kanji}</span>
        <span class="card-reading">${w.reading}</span>
        <span class="card-type">${typeLabel(w.type)}</span>
      </div>
      <div class="card-meaning">${w.meaning}</div>
      <div class="card-example">
        <div class="ex-jp">${w.example}</div>
        <div class="ex-kr">${w.exTrans}</div>
      </div>
      <div class="card-actions" onclick="event.stopPropagation()">
        <button class="card-btn ${isKnown?'btn-known':''}" onclick="markKnown(${w.id})">${isKnown?'✓ 암기완료':'○ 암기완료'}</button>
        <button class="card-btn ${isUnknown?'btn-unknown':''}" onclick="markUnknown(${w.id})">${isUnknown?'✗ 미암기':'△ 미암기'}</button>
      </div>
    </div>`;
  }).join('');
}

function toggleExpand(el) { el.classList.toggle('expanded'); }

function markKnown(id)   { State.markKnown(id);   renderList(); updateStats(); }
function markUnknown(id) { State.markUnknown(id);  renderList(); updateStats(); }

// ── 플래시카드 ────────────────────────────────────────────────────────────
function initFlash() {
  State.fcList    = State.filtered();
  State.fcIndex   = 0;
  State.fcRevealed = false;
  renderFlash();
}

function renderFlash() {
  const list = State.fcList;
  const card = document.getElementById('flashcard');
  card.classList.remove('revealed');
  State.fcRevealed = false;
  document.getElementById('fc-hint').textContent = '탭하여 정답 확인';

  if (!list.length) {
    document.getElementById('fc-kanji').textContent   = '단어 없음';
    document.getElementById('fc-reading').textContent = '';
    document.getElementById('fc-type').textContent    = '';
    document.getElementById('fc-meaning').textContent = '';
    document.getElementById('fc-example').innerHTML   = '';
    return;
  }

  const w = list[State.fcIndex];
  document.getElementById('fc-kanji').textContent   = w.kanji;
  document.getElementById('fc-reading').textContent = w.reading;
  document.getElementById('fc-type').textContent    = typeLabel(w.type);
  document.getElementById('fc-meaning').textContent = w.meaning;
  document.getElementById('fc-example').innerHTML   =
    `<div class="ex-jp">${w.example}</div><div class="ex-kr">${w.exTrans}</div>`;

  const total = list.length, cur = State.fcIndex + 1;
  document.getElementById('fc-progress-text').textContent = `${cur} / ${total}`;
  document.getElementById('fc-progress-fill').style.width = `${(cur/total)*100}%`;
}

function fcNext(mark) {
  const list = State.fcList;
  if (!list.length) return;
  const w = list[State.fcIndex];
  if (mark === 'known')   State.markKnown(w.id);
  if (mark === 'unknown') State.markUnknown(w.id);
  updateStats();

  const card = document.getElementById('flashcard');
  card.classList.add('flip-anim');
  setTimeout(() => {
    card.classList.remove('flip-anim');
    if (State.fcIndex < list.length - 1) {
      State.fcIndex++;
      renderFlash();
    } else {
      document.getElementById('fc-kanji').textContent   = '완료! 🎉';
      document.getElementById('fc-reading').textContent = '';
      document.getElementById('fc-type').textContent    = '';
      document.getElementById('fc-meaning').textContent = '모든 카드를 학습했습니다';
      document.getElementById('fc-example').innerHTML   = '';
      document.getElementById('fc-progress-fill').style.width = '100%';
      document.getElementById('fc-progress-text').textContent = `${list.length} / ${list.length}`;
      document.getElementById('flashcard').classList.add('revealed');
    }
  }, 180);
}

// ── 모드 전환 ─────────────────────────────────────────────────────────────
function setMode(mode) {
  State.mode = mode;
  const isList = mode === 'list';
  document.getElementById('list-view').style.display   = isList ? '' : 'none';
  document.getElementById('flash-view').style.display  = isList ? 'none' : 'flex';
  document.getElementById('toolbar').style.display     = isList ? '' : 'none';
  document.getElementById('btn-list').classList.toggle('active',  isList);
  document.getElementById('btn-flash').classList.toggle('active', !isList);
  if (!isList) initFlash();
}

// ── 이벤트 바인딩 ─────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {

  // 테마
  applyTheme(State.theme);
  document.getElementById('theme-toggle').addEventListener('click', () =>
    applyTheme(State.theme === 'dark' ? 'light' : 'dark')
  );

  // 글씨 크기
  applyFontSize();
  document.getElementById('fs-up').addEventListener('click', () => {
    if (State.fontSize < 32) { State.fontSize += 2; applyFontSize(); State.save(); }
  });
  document.getElementById('fs-down').addEventListener('click', () => {
    if (State.fontSize > 12) { State.fontSize -= 2; applyFontSize(); State.save(); }
  });

  // 레벨 탭
  document.querySelectorAll('.level-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.dataset.level === State.level) return;
      State.level = btn.dataset.level;
      State.save();
      applyLevel();
      if (State.mode === 'flash') initFlash();
    });
  });

  // 모드 전환
  document.getElementById('btn-list').addEventListener('click',  () => setMode('list'));
  document.getElementById('btn-flash').addEventListener('click', () => setMode('flash'));

  // 검색
  document.getElementById('search-input').addEventListener('input', e => {
    State.search = e.target.value.trim();
    renderList();
  });

  // 필터
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      State.filter = btn.dataset.filter;
      renderList();
    });
  });

  // 정렬
  document.getElementById('sort-select').addEventListener('change', e => {
    State.sort = e.target.value;
    renderList();
  });

  // 가시성 토글
  document.getElementById('toggle-reading-list').addEventListener('click', () => {
    State.hideReadingList = !State.hideReadingList; applyVisibility(); State.save();
  });
  document.getElementById('toggle-meaning-list').addEventListener('click', () => {
    State.hideMeaningList = !State.hideMeaningList; applyVisibility(); State.save();
  });
  document.getElementById('fc-reading-btn').addEventListener('click', () => {
    State.hideReadingFc = !State.hideReadingFc; applyVisibility(); State.save();
  });

  // 플래시카드 탭
  document.getElementById('flashcard').addEventListener('click', () => {
    if (!State.fcRevealed) {
      document.getElementById('flashcard').classList.add('revealed', 'flip-anim');
      State.fcRevealed = true;
      document.getElementById('fc-hint').textContent = '의미 공개됨';
      setTimeout(() => document.getElementById('flashcard').classList.remove('flip-anim'), 360);
    }
  });

  // 플래시카드 버튼
  document.getElementById('fc-known-btn').addEventListener('click',   () => fcNext('known'));
  document.getElementById('fc-unknown-btn').addEventListener('click', () => fcNext('unknown'));
  document.getElementById('fc-skip-btn').addEventListener('click',    () => fcNext(null));

  // 섞기
  document.getElementById('fc-shuffle-btn').addEventListener('click', () => {
    for (let i = State.fcList.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [State.fcList[i], State.fcList[j]] = [State.fcList[j], State.fcList[i]];
    }
    State.fcIndex = 0;
    const btn = document.getElementById('fc-shuffle-btn');
    btn.textContent = '🔀 섞음!';
    setTimeout(() => { btn.textContent = '🔀 섞기'; }, 900);
    renderFlash();
  });

  // Service Worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  }

  // 초기화
  applyLevel();
  applyVisibility();
  updateStats();
});
