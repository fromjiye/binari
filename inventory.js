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
    close: '닫기',
    memLocked: '회수하면 기억이 열립니다.'
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
  // story: 잔류 기억(본문) / voice: 목소리 줄 / noise: 수신 잡음 (01 만) — 상세 화면에만 나옴. 문장은 지예 확정본 그대로
  var ITEMS = [
    { no: '01', key: 'r01',   name: '붉은 댕기',                      color: 'blue',   emo: '슬픔·그리움', note: '',                    via: 'tag',
      story: '업로드 전날 밤, 누군가 땋은 머리 끝에 이 댕기를 꽉 묶어 주었다. 대기열에서 끝까지 맞잡고 있던 손은 결국 놓쳤고, 댕기만 이쪽으로 넘어왔다. 겉은 분명 붉은데, 분류는 청(靑)이다. 데이터 무덤에 수없이 묻히고 깨졌는데도 이 붉은색은 한 번도 바래지 않았고, 끝자락의 올만 조금씩 풀려 가고 있다.',
      voice: '“풀리지 않게 꽉 묶었어. 이따 저쪽에서 만나.”',
      noise: ['[수신 잡음]', '…들…리나…요?'] },
    { no: '02', key: 'voice', name: '보내지 못한 음성 메시지',        color: 'blue',   emo: '슬픔·그리움', note: '재생 불가',           via: 'ritual',  flat: true,
      story: '업로드 전날 새벽에 녹음했지만, 끝내 보내지 못한 음성 메시지. 3분 12초 중 대부분은 숨소리와, 할 말을 고르다 멈춘 침묵이다. 마지막 2초는 파형으로만 남아 있다. 네 음절. 마고 OS는 이 네 음절을 ‘노이즈’로 분류했다.',
      voice: '“…있잖아. 나, 사실은—”' },
    { no: '03', key: 'r03',   name: '찢어진 업로드 동의서',           color: 'red',    emo: '분노·억울함', note: '서명란 손상',         via: 'sync',    flat: true,
      story: '포스트-플레시 이주 동의서. 맨 아래 작은 글씨에는 ‘이주 과정에서 불필요한 감정 데이터는 최적화됩니다’라는 조항이 있다. 그 줄을 읽은 누군가가 동의서를 반으로 찢었다. 서명란은 끝내 비어 있는데도, 기록은 이미 ‘동의 완료’로 처리된 뒤였다. 적(赤)으로 분류된 이 분노는 너무 뜨거워서, 회수된 지금도 종이 위로 픽셀 불티가 튄다.',
      voice: '“이런 건… 먼저 말해 줬어야지.”' },
    { no: '04', key: 'r04',   name: '반쯤 깨진 가족사진',             color: 'yellow', emo: '욕망·집착',   note: '열화 진행',           via: 'archive', flat: true,
      story: '제3 레이어에서 회수된 가족사진. 노을 진 들판에서 아빠는 아들의 손을 잡고 있고, 아들은 고개를 들어 엄마를 바라보고 있다. 백업 비용을 내지 못하는 동안, 사진은 엄마 쪽부터 픽셀로 흩어지기 시작했다. 아들은 엄마의 얼굴을 붙잡으려고 사진을 저장하고 또 저장했지만, 덮어쓸 때마다 깨진 자리는 조금씩 더 넓어졌다.',
      voice: '“괜찮아. 내가 기억하면 돼. …기억하면 되는데.”' },
    { no: '05', key: 'r05',   name: '주인 잃은 노리개',               color: 'yellow', emo: '욕망·집착',   note: '원 소유자 기록 없음', via: 'tag',
      story: '할머니에게서 어머니로, 어머니에게서 딸로. 늘 저고리 고름 한가운데에 매달려 있던 노리개. 이주할 때 물건은 가져갈 수 없었지만, 딸은 마지막까지 이것을 손에 쥐고 놓지 않았다. 그래서 마고 OS는 노리개와 함께 ‘놓지 않으려는 마음’까지 통째로 잘라 냈다. 주인은 지금도 네오 마고에 살고 있지만, 가끔 빈손을 쥐었다 펴는 버릇만 남았다.',
      voice: '“이것만은 안 돼요. 우리 집 거예요.”' },
    { no: '06', key: 'r06',   name: '마지막 로그인이 찍힌 개인 단말', color: 'white',  emo: '공허·체념',   note: '접속 기록 종료',      via: 'tag',
      story: '업로드 전까지 쓰던 개인 단말. 금 간 화면에는 마지막 로그인 시각 2199.03.██만 떠 있다. 그 아래에는 읽지 않은 알림이 999개 넘게 쌓여 있는데, 모두 먼저 넘어간 사람들이 보낸 같은 말, ‘어디야?’였다. 주인은 끝내 하나도 열어 보지 않았고, 그날 이후 접속 기록은 하얗게 비어 있다.',
      voice: '“다들 벌써 넘어갔네. …나만 남았나.”' }
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
    // 잔류 기억: 회수 전에는 제목 줄과 안내 한 줄만
    var mem = $('inv-d-mem');
    mem.style.setProperty('--mem', COLORS[item.color].c);
    mem.classList.toggle('is-shut', !got);
    $('inv-d-mem-body').textContent = got ? item.story : TEXT.memLocked;
    $('inv-d-mem-voice').textContent = got ? item.voice : '';
    var noise = $('inv-d-mem-noise');
    noise.textContent = '';
    if (got && item.noise) {
      noise.appendChild(el('b', null, item.noise[0]));
      noise.appendChild(document.createTextNode(' '));
      var word = el('span', 'inv-noise');
      word.setAttribute('aria-label', item.noise[1]);
      for (var ni = 0; ni < item.noise[1].length; ni++) { // 글자마다 따로 깜빡임
        var ch = el('i', null, item.noise[1].charAt(ni));
        ch.setAttribute('aria-hidden', 'true');
        ch.style.animationDelay = (-(ni * 0.37 % 2.6)).toFixed(2) + 's';
        ch.style.animationDuration = (2.1 + (ni * 7 % 5) * 0.23).toFixed(2) + 's';
        word.appendChild(ch);
      }
      noise.appendChild(word);
    }
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
    // 체험 순서를 아직 다 끝내지 않았으면 아래에 "메신저로 가기" (키링 태그로 바로 들어온 사람도 길이 이어지게)
    var nextBtn = $('inv-next');
    if (nextBtn) nextBtn.hidden = !(B.flow && B.flow.next().module);
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
    var m = /^d(0[1-6])([gl])$/.exec(name); // d06g = 06 회수한 상세, d06l = 06 회수 전 상세
    if (m) { forced = m[2] === 'g' ? all : {}; render(); openDetail(byNo(m[1])); return; }
  };
})();
