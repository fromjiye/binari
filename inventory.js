/* BINARI · INVENTORY — 유실물 인벤토리 (4단계)
   6칸 = 원고 02-1-A 순서 = RELIC 번호.
   실물 3칸(01 · 05 · 06)은 키링 NFC 주소 ?relic=번호 로 들어와야 열린다. */
(function () {
  'use strict';

  var B = window.BINARI;
  if (!B) return;

  function $(id) { return document.getElementById(id); }
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function sfx(name) { if (B.sound) B.sound.play(name); }

  var root = $('inventory');
  if (!root) return;

  var KEY = 'binari.relics.v1'; // { voice: 시각, r01: 시각, … } — 굿판(ritual.js)과 같이 씀

  // 원고 문장 그대로
  var RECORD = '[마고 OS 기록] 아래 항목은 데이터 무덤(제3 레이어)에 적재된 데이터 쓰레기 중, 감정 데이터가 기억 속 물건의 형태로 남은 사례입니다. 오방색 분류 완료 후 처리 우선순위에서 제외되었습니다.';

  var TEXT = {
    count: '회수',
    locked: '미회수',
    pending: '처리 보류',
    done: '회수 완료',
    unlockTitle: '회수 기록 해제',
    already: '이미 회수된 기록',
    findIt: '전시 부스에서 유실물을 찾아보세요!',
    class: '분류',
    status: '상태',
    close: '닫기'
  };

  // 오방색 분류: 작은 색 사각형 + 글자
  var COLORS = {
    blue:   { ko: '청', han: '靑', c: '#3F6BFF' },
    red:    { ko: '적', han: '赤', c: '#E0392E' },
    yellow: { ko: '황', han: '黃', c: '#F0B90B' },
    white:  { ko: '백', han: '白', c: '#F2F2EC' }
  };

  // via: tag = 실물 키링 태그 / 그 밖은 회수 경로가 되는 앱
  // flat: 바탕이 있는 그림(설정집 그림) → 가장자리를 페이드해서 사이트 바탕에 섞음. 투명 누끼(01 · 05 · 06)는 그대로
  var ITEMS = [
    { no: '01', key: 'r01',   name: '붉은 댕기',                      color: 'blue',   emo: '슬픔·그리움', note: '',                    via: 'tag' },
    { no: '02', key: 'voice', name: '보내지 못한 음성 메시지',        color: 'blue',   emo: '슬픔·그리움', note: '재생 불가',           via: 'ritual',  flat: true },
    { no: '03', key: 'r03',   name: '찢어진 업로드 동의서',           color: 'red',    emo: '분노·억울함', note: '서명란 손상',         via: 'sync',    flat: true },
    { no: '04', key: 'r04',   name: '반쯤 깨진 가족사진',             color: 'yellow', emo: '욕망·집착',   note: '열화 진행',           via: 'archive', flat: true },
    { no: '05', key: 'r05',   name: '주인 잃은 노리개',               color: 'yellow', emo: '욕망·집착',   note: '원 소유자 기록 없음', via: 'tag' },
    { no: '06', key: 'r06',   name: '마지막 로그인이 찍힌 개인 단말', sub: '2199.03.██', color: 'white', emo: '공허·체념', note: '접속 기록 종료', via: 'tag' }
  ];
  // 회수 경로가 되는 앱. open 이 false 면 아직 없는 앱 → 홈 메뉴처럼 STANDBY
  var ROUTES = {
    ritual:  { label: 'RITUAL',  open: true,  go: 'ritual' },
    sync:    { label: 'SYNC',    open: true,  go: 'sync' },
    archive: { label: 'ARCHIVE', open: true,  go: 'archive' }
  };

  function img(item) { return 'assets/relic/relic-' + item.no + '.webp'; }
  function byNo(no) { for (var i = 0; i < ITEMS.length; i++) if (ITEMS[i].no === no) return ITEMS[i]; return null; }

  function load() {
    try { var v = JSON.parse(localStorage.getItem(KEY)); return v && typeof v === 'object' ? v : {}; }
    catch (e) { return {}; }
  }
  function save(v) { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch (e) {} }
  var forced = null; // 캡처 · 점검용: 저장과 상관없이 보여 줄 회수 상태
  function has(item) { return forced ? !!forced[item.key] : !!load()[item.key]; }

  var api = B.inventory = {};

  // ── 분류 표시: 색 사각형 + 한글(한자는 작게) + 감정 ──
  function classInto(node, item, withEmo) {
    var col = COLORS[item.color];
    node.textContent = '';
    var sq = el('i', 'inv-sq');
    sq.style.background = col.c;
    node.appendChild(sq);
    node.appendChild(el('span', 'inv-col', col.ko));
    node.appendChild(el('small', null, col.han));
    if (withEmo) node.appendChild(el('span', 'inv-emo', '· ' + item.emo));
  }

  // ── 6칸 ──
  var grid = $('inv-grid');
  function render() {
    var n = 0;
    grid.textContent = '';
    ITEMS.forEach(function (item) {
      var got = has(item);
      if (got) n++;
      var cell = el('li', 'inv-cell' + (got ? ' is-got' : ' is-locked'));
      cell.setAttribute('data-no', item.no);

      var btn = el('button', 'inv-open');
      btn.type = 'button';
      btn.setAttribute('aria-label', 'RELIC ' + item.no + ' ' + item.name + ' · ' + (got ? TEXT.done : TEXT.locked));
      btn.addEventListener('click', function () { sfx('tap'); openDetail(item); });
      cell.appendChild(btn);

      var pic = el('span', 'inv-pic');
      var im = document.createElement('img');
      im.src = img(item); im.alt = ''; im.loading = 'lazy';
      if (item.flat) im.className = 'is-flat';
      pic.appendChild(im);
      cell.appendChild(pic);

      cell.appendChild(el('span', 'inv-no', 'RELIC ' + item.no));
      cell.appendChild(el('span', 'inv-name', item.name));
      if (item.sub) cell.appendChild(el('span', 'inv-sub', item.sub));

      var cls = el('span', 'inv-class');
      classInto(cls, item, false);
      cell.appendChild(cls);

      var st = el('span', 'inv-st', got ? TEXT.done : TEXT.locked);
      cell.appendChild(st);
      if (!got) cell.appendChild(hintNode(item, 'inv-hint'));
      grid.appendChild(cell);
    });
    $('inv-count').textContent = n + ' / ' + ITEMS.length;
    var segs = $('inv-segs');
    segs.textContent = '';
    ITEMS.forEach(function (item) { segs.appendChild(el('i', has(item) ? 'on' : '')); });
    api.count = n; // 나중에 인증서에 씀
  }

  // 잠긴 칸의 안내: 실물은 찾아보세요, 그 밖은 회수 경로(아직 없는 앱이면 STANDBY)
  function hintNode(item, cls) {
    var p = el('span', cls);
    if (item.via === 'tag') { p.textContent = TEXT.findIt; return p; }
    var r = ROUTES[item.via];
    p.appendChild(el('b', null, r.label));
    if (!r.open) p.appendChild(el('em', null, 'STANDBY'));
    return p;
  }

  // ── 상세 ──
  var detail = $('inv-detail'), lastFocus = null;
  function openDetail(item) {
    var got = has(item);
    detail.className = 'inv-detail' + (got ? ' is-got' : ' is-locked');
    $('inv-d-img').src = img(item);
    $('inv-d-img').className = item.flat ? 'is-flat' : '';
    $('inv-d-no').textContent = 'RELIC ' + item.no;
    $('inv-d-name').textContent = item.name;
    $('inv-d-sub').textContent = item.sub || '';
    classInto($('inv-d-class'), item, true);
    var st = $('inv-d-status');
    st.textContent = '';
    // 회수 전: "미회수 · 처리 보류 · (비고)" / 회수 후: "회수 완료 · (비고)"
    st.appendChild(el('b', null, got ? TEXT.done : TEXT.locked));
    st.appendChild(document.createTextNode((got ? '' : ' · ' + TEXT.pending) + (item.note ? ' · ' + item.note : '')));
    var hint = $('inv-d-hint');
    hint.textContent = '';
    if (!got) hint.appendChild(hintNode(item, 'inv-hint'));
    $('inv-d-record').textContent = RECORD;
    lastFocus = document.activeElement;
    detail.hidden = false;
    detail.scrollTop = 0;
    try { $('inv-close').focus({ preventScroll: true }); } catch (e) {}
  }
  function closeDetail() {
    detail.hidden = true;
    if (lastFocus && lastFocus.focus) { try { lastFocus.focus({ preventScroll: true }); } catch (e) {} }
  }
  $('inv-close').addEventListener('click', function () { sfx('tap'); closeDetail(); });

  // ── 칸 강조 · 짧은 알림 ──
  function highlight(no) {
    var cell = grid.querySelector('[data-no="' + no + '"]');
    if (!cell) return;
    cell.classList.remove('flash'); void cell.offsetWidth; cell.classList.add('flash');
    try { cell.scrollIntoView({ block: 'center', behavior: 'smooth' }); } catch (e) {}
  }
  var toastTimer = 0;
  function toast(text) {
    var t = $('inv-toast');
    t.textContent = text;
    t.hidden = false;
    t.classList.remove('go'); void t.offsetWidth; t.classList.add('go');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { if (!api._freeze) t.hidden = true; }, 2200);
  }

  // ── 회수 기록 해제: 스캔 + 진행 바, 상태 '처리 보류' → '회수 완료' ──
  var unlockEl = $('inv-unlock'), unlocking = false;
  function setProgress(p) {
    var pct = Math.round(p * 100);
    $('inv-bar-fill').style.transform = 'scaleX(' + p + ')';
    $('inv-u-pct').textContent = pct + '%';
    $('inv-scan').style.top = pct + '%';
    // 스캔 선 위쪽만 색이 드러나게: 그림 상자가 바깥 상자보다 작아서 선의 위치를 px 로 맞춘다
    var box = $('inv-u-pic').getBoundingClientRect(), im = $('inv-u-color').getBoundingClientRect();
    var cut = im.height ? Math.max(0, Math.min(im.height, im.bottom - (box.top + box.height * p))) : 0;
    var clip = p >= 1 ? 'none' : 'inset(0 0 ' + (im.height ? cut + 'px' : (100 - pct) + '%') + ' 0)';
    $('inv-u-color').style.clipPath = clip;
    $('inv-u-color').style.webkitClipPath = clip;
  }
  function setUnlockDone(done) {
    unlockEl.classList.toggle('is-done', done);
    $('inv-u-status').textContent = done ? TEXT.done : TEXT.pending;
  }
  function playUnlock(item, stopAt) {
    if (unlocking) return Promise.resolve();
    unlocking = true;
    closeDetail();
    $('inv-u-no').textContent = 'RELIC ' + item.no;
    $('inv-u-name').textContent = item.name;
    $('inv-u-gray').src = img(item);
    $('inv-u-color').src = img(item);
    $('inv-u-gray').className = 'inv-u-gray' + (item.flat ? ' is-flat' : '');
    $('inv-u-color').className = 'inv-u-color' + (item.flat ? ' is-flat' : '');
    setUnlockDone(false);
    setProgress(0);
    unlockEl.hidden = false;

    var reduced = false;
    try { reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
    var DUR = reduced ? 600 : 2300, start = performance.now(), tick = 0;

    return new Promise(function (resolve) {
      var finished = false;
      function finish() {
        if (finished) return;
        finished = true;
        setProgress(1);
        setUnlockDone(true);
        sfx('relic');
        var v = load();
        if (!v[item.key]) v[item.key] = Date.now();
        delete v[item.key + 'Pending']; // 굿판(voicePending) · SYNC(r03Pending) 첫 완료 연출은 한 번만
        save(v);
        if (stopAt != null) { resolve(); return; } // 캡처용: 끝 화면에서 멈춤
        setTimeout(function () {
          unlockEl.hidden = true;
          unlocking = false;
          render();
          highlight(item.no);
          resolve();
        }, 1100);
      }
      if (stopAt != null && stopAt < 1) { setProgress(stopAt); resolve(); return; } // 캡처용: 중간에서 멈춤
      if (stopAt === 1) { finish(); return; }
      // 화면이 가려져 그림이 멈춰도(다른 앱으로 잠깐 나감 등) 기록 해제는 제시간에 끝나게 한다
      setTimeout(finish, DUR + 150);
      (function frame(now) {
        if (finished) return;
        var p = Math.min(1, (now - start) / DUR);
        setProgress(p);
        if (p * 4 > tick + 1 && p < 1) { tick++; sfx('tick'); }
        if (p < 1) requestAnimationFrame(frame); else finish();
      })(start);
    });
  }

  // ── ?relic=번호 로 들어왔을 때 (키링 태그) ──
  // 01 · 05 · 06 만 해제. 02 · 03 · 04 나 없는 번호는 인벤토리만 연다
  var pending = B.relic || null;
  function handleTag() {
    if (!pending) return;
    var raw = String(pending).trim();
    pending = null;
    if (!/^\d{1,2}$/.test(raw)) return;
    var item = byNo(('0' + parseInt(raw, 10)).slice(-2));
    if (!item || item.via !== 'tag') return;
    if (has(item)) { toast(TEXT.already); highlight(item.no); return; }
    playUnlock(item);
  }

  // 굿판을 처음 끝낸 뒤 아직 연출을 못 봤으면: 02번을 키링과 같은 연출로 한 번만
  function handlePending() {
    if (unlocking || forced) return;
    var v = load();
    if (v.voicePending) playUnlock(byNo('02'));
    else if (v.r03Pending) playUnlock(byNo('03')); // SYNC 를 처음 끝낸 뒤
    else if (v.r04Pending) playUnlock(byNo('04')); // ARCHIVE 마지막 파일
  }

  function open() {
    render();
    handleTag();
    handlePending();
  }
  function close() {
    closeDetail();
    if (!unlocking) unlockEl.hidden = true;
  }

  document.addEventListener('binari:screen', function (ev) { if (ev.detail === 'inventory') open(); else close(); });
  if (document.body.getAttribute('data-screen') === 'inventory') open();

  // ── 캡처 · 점검용: 한 장면을 골라 멈춰 세움 (저장된 기록은 건드리지 않음) ──
  api.debug = function (name) {
    api._freeze = true;
    unlocking = false;
    unlockEl.hidden = true;
    detail.hidden = true;
    $('inv-toast').hidden = true;
    var all = {}; ITEMS.forEach(function (it) { all[it.key] = 1; });
    if (name === 'locked') { forced = {}; render(); return; }
    if (name === 'full') { forced = all; render(); return; }
    if (name === 'unlock-mid' || name === 'unlock-end') {
      forced = {}; render();
      var keep = save; save = function () {}; // 캡처는 저장하지 않음
      playUnlock(byNo('01'), name === 'unlock-mid' ? 0.56 : 1);
      save = keep;
      return;
    }
    if (name === 'voice-mid' || name === 'voice-end') {
      forced = { r01: 1, voice: 1 }; render();
      var keep2 = save; save = function () {};
      playUnlock(byNo('02'), name === 'voice-mid' ? 0.56 : 1);
      save = keep2;
      return;
    }
    if (name === 'voice-after') { forced = { r01: 1, voice: 1 }; render(); highlight('02'); return; }
    if (name === 'after') { forced = { r01: 1 }; render(); highlight('01'); return; }
    if (name === 'already') { forced = { r01: 1 }; render(); toast(TEXT.already); highlight('01'); return; }
    if (name === 'detail') { forced = { r01: 1, voice: 1 }; render(); openDetail(byNo('01')); return; }
    if (name === 'detail-locked') { forced = { r01: 1 }; render(); openDetail(byNo('03')); return; }
  };
})();
