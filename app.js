/* BINARI · MAGO OS 관리자 콘솔 — 1단계
   ?id=번호 로 이름을 읽어 부팅 · 접속 승인 화면을 띄우고, 준비 중 홈으로 잇는다. */
(function () {
  'use strict';

  // 관리자 명단 (번호 = ?id). 00은 설계자. 00 임지예와 14 임예지는 다른 사람.
  var ROSTER = {
    '00': { ko: '임지예', en: 'LIM JI YE', issued: '2026.11.25', arch: true },
    '01': { ko: '박민철', en: 'PARK MIN CHUL', issued: '2026.11.28' },
    '02': { ko: '김나희', en: 'KIM NA HEE', issued: '2026.11.27' },
    '03': { ko: '김동규', en: 'KIM DONG KYU', issued: '2026.11.27' },
    '04': { ko: '이제선', en: 'LEE JE SUN', issued: '2026.11.27' },
    '05': { ko: '이준혁', en: 'LEE JUN HYUK', issued: '2026.11.27' },
    '06': { ko: '유가희', en: 'YOO GA HEE', issued: '2026.11.28' },
    '07': { ko: '이바다', en: 'LEE BA DA', issued: '2026.11.28' },
    '08': { ko: '배은서', en: 'BAE EUN SEO', issued: '2026.11.28' },
    '09': { ko: '정지현', en: 'JUNG JI HYUN', issued: '2026.11.28' },
    '10': { ko: '공석진', en: 'KONG SEOK JIN', issued: '2026.11.28' },
    '11': { ko: '안효원', en: 'AHN HYO WON', issued: '2026.11.28' },
    '12': { ko: '최혁', en: 'CHOI HYUK', issued: '2026.11.28' },
    '13': { ko: '박은지', en: 'PARK EUN JI', issued: '2026.11.28' },
    '14': { ko: '임예지', en: 'LIM YE JI', issued: '2026.11.28' },
    '15': { ko: '김세령', en: 'KIM SE RYUNG', issued: '2026.11.28' },
    '16': { ko: '송정민', en: 'SONG JUNG MIN', issued: '2026.11.28' },
    '17': { ko: '최주혜', en: 'CHOI JU HYE', issued: '2026.11.29' },
    '18': { ko: '유대겸', en: 'YOO DAE KYUM', issued: '2026.11.25' },
    '19': { ko: '강윤기', en: 'KANG YUN KI', issued: '2026.11.25' },
    '20': { ko: '박원철', en: 'PARK WON CHUL', issued: '2026.11.28' } // 명예 발급
  };

  // 바코드 — 실물 관리자 카드와 같은 패턴.
  // 글자 두 개가 한 쌍 = 막대 + 간격, 왼쪽부터. 막대 a=0.18 b=0.30 c=0.45mm, 간격 1=0.18 2=0.30mm,
  // 전체 폭 30mm · 높이 4.1mm 안에서 그리고 화면에서는 같은 비율로 늘린다.
  var BARCODE = {
    '00': 'a2a2c2a2a2b2a1c2c2a1a2c2a2a1a2a2c2c2c2c1b1a1c1b2c2b2c2b2c2a2a2a2b2a2a2b2a1c2c1b1c1a2c2a1a2b2b2a1b1a1a1c2b1a2',
    '01': 'a2b2a2a2a2c2a2c1b1a1c2b1c2a2c2a1c2b1a2b2b2c1c1c2c1c1a2a2b1b2a1c1b1a2b2c1c2b1a1a1b2c1c2a2a1c1a1b2c1a2b2a1b2b1b2',
    '02': 'a2b1a2b2c2a2a2c2a2a1a2a2c2a2a2c2c2a1a2c2a2c2c2a1b1a2a2b2a2c2b2c2c2a2a2a2a2b2a2a2a2a2c2b2a1b2a2a1c1a2c2a1a1c2a1',
    '03': 'c2a2a2a2c2b2a2a1a2a1a1a2b1c2c1a1b1a2c2b1c2a2b1c1a2b1c2a2a2c2a2a2c2a2c2c2c2a1c1b2b1a2a2a1c1a2c1c2b1a2a2b2a2a2b2',
    '04': 'a1a2b1a1a1a1a2b2a1b2b2a2b2a2c2a2a2a1a2a1b2c2a2a1a2c2c2a1a1a1c1a2a1c1a1a1a2a1a2c2c2a2c2a2a2c2a2a2a1c2a1a2a2a2b1a2a2a2a1c2',
    '05': 'b2a1b2b2a2a1a2c2a2c2c2a2a2b2b1b2a2a2c2c2c2b2a2c2b2b2a1c2b2a2a1a2a2c2a2a1a2b2a2b2b1a1c1c2b1a1b1a1b1a2b2a2c1a2a1a2',
    '06': 'c1c1b1a2b2c2b2a2c2c2a1b2c2a2b2a1c1a1b1a2b2b2b2c2a1a2a1a1b2a1b2a2b2c2c1c1b2c2a1a2b2a2a2c2a2a1a2c1b1b1a2a1b2b1b2',
    '07': 'a2c2b1c2a2b2a2b2a1a1a1b1a1a2a1c2a1b2c1a2b2b2a2b1a1a2c1a2b2c2c2a2a2c2a2b2a1c2b2c2b2a2c2a2c2c2a2a1a2a1c1b2a2a1b1',
    '08': 'a2a2c2b2a1b1a1b1a1a2c1b2c1a2c1b2b2a1c1a1c2a2a2a2c2a2a1b2a1a2c2a1a1a2a2b1a2b1c2a2c2b2c1b2c1c2a1a1a2a1b1b2c1c1a1a1a1b2',
    '09': 'b1c2a1a2c2a1c2b2a2b1a2a2b2a1a2c1c2a1a2a2c2c1b2a2a2a2c2c1a2a2b1b2a2b2a2c2c2a2a2a1a1b2a2a2a2c2c2a1b2c2a1a1a2a2c2',
    '10': 'c2a2c2b2a2c2b2a1a1c2a2c2a2b2b2a2c2a1b2c1a2a1c2b1a2a1b1a2b2a1c2a1c2c2b1b2c2a2c1a1c2a1a1a1a2a2a2b1a1a1a2a2a2a2a2a1b1',
    '11': 'a2c1c2a2a2c2a1c2c2b2a2b2a2a2c2a2a2a2c1b1a2a2b2c2c2a2a1a2c2a2a2a1c2c1a1a2b2a2a2a2a2b1a2c1c2a2a2b1c1a1c2b1a1a2a1a2',
    '12': 'c2b2c2a2a2c1c2a2c2b2a1a2c2b2c2a1a2a2c2a2a1a2c1b2c2a2c1a1b1a2c1a2a2a2a2b1c1c2a2a1a2b2b2c2a2b1a2a2c2a1b2a2b2b1',
    '13': 'a2b1c2b1c1a2a2b2b2c2c1c2b2a2b1a2b2c2c1b2b2a1a1c1a2b2a1a1c1a2a1b2b1a2c1a2a2a1a2b2a1a1a2a2a2b2a2a1c1c2a2a2a2c2b2c1',
    '14': 'a2a2a2a1b2a2b2a1c2a2b2c2c1c2a2b2a1a2b2a2a2b1a1b2a1c1b2a1a1c1a2c2b2a2c2a1a2a2c1a2b2a2a2b2c2b2a1a2b2a2c2a2c2c1c2',
    '15': 'b1a2a2b2b2b2a2a1a2a2a1a1a1c1a2b2a2b2a2c2a2b1c2c2a2a2b2b2a1a2b1a1a2b2c2b2c1a2a1a2a2b2a2c2c2a2b2a1a1a2a2a1a2c2a2a1c1',
    '16': 'b1a2a2c1b2c2a2a2b2a2a2c1b1c2a2c2a2c2b2b2a2a2a2a1c2b1b2c1b2a2c2a1b1a2b1c1a2c1a2a2c2c2c2b2c2a2a1b2b1b2b2b1a2',
    '17': 'a1a1c1c2a2b2c2a1b2a1c2c2a1c2a2a2c2a1b1a2a1a2b2b2b2b1a2a2b2a2c2a2c1c2a1c2c2b2c1a2a2c2a2b2a2a2c1c1b2b1b2c2b1b2',
    '18': 'a2a2b2a2b1c2b2a2a1a2b1a2b2c2a2a2a2a2a1a1b2a1a2b1a2a1a1a2b1a2b2a2a2a1a1a2a2a1c1c2a2b2b1c1a1a2b2c1a2a2a2c1c1a2c2a2c2b2',
    '19': 'b1c1a2a1b2a2a2b2a2b1a2a2c2a1a1c2c2a1a1a1a2c2c2b1a2a2a2b2a1c2a1b2a2a2b2a2a2c2a2b1b1a2a2a2a2a1a2a1a1a1c2b2a2b2a2a2a1a1b2',
    '20': 'a1c1b1a2b2a1b2a2b2a1a2a1a1a2c2c2c1a1c2b2a1c2b2b2c2b2c2b1b2a2a2b2b1a1b1a1a2a2a2a2a1a1b2a2a2a2a2c2a2a2a2c2b2a2c2a2a2'
  };
  var BAR_W = { a: 0.18, b: 0.30, c: 0.45 };
  var GAP_W = { '1': 0.18, '2': 0.30 };

  var KEY = 'binari.console.v1';
  var KEY_EVENTS = 'binari.events.v1';   // 다른 모듈을 마쳤다는 기록 (디코더가 돌아왔을 때 반응)
  var KEY_DECODER = 'binari.decoder.v1'; // 디코더 메신저 진행 (decoder.js)
  var STAMP_AT = 1500; // 도장이 찍히는 시각(ms) — style.css의 --t와 같게

  function $(id) { return document.getElementById(id); }

  function el(tag, text, cls) {
    var n = document.createElement(tag);
    if (text != null) n.textContent = text;
    if (cls) n.className = cls;
    return n;
  }

  function barcodeSVG(code) {
    var x = 0, rects = '';
    for (var i = 0; i + 1 < code.length; i += 2) {
      var w = BAR_W[code.charAt(i)];
      rects += '<rect x="' + x.toFixed(2) + '" width="' + w + '" height="4.1"/>';
      x += w + GAP_W[code.charAt(i + 1)];
    }
    return '<svg viewBox="0 0 30 4.1" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" fill="#E8EDEE">' + rects + '</svg>';
  }

  // ── 저장 (그 폰의 브라우저에만 남음). 막혀 있어도 화면은 정상 진행 ──
  function load() {
    try {
      var v = JSON.parse(localStorage.getItem(KEY));
      return v && typeof v === 'object' ? v : null;
    } catch (e) { return null; }
  }
  function save(id) {
    try { localStorage.setItem(KEY, JSON.stringify({ id: id, at: Date.now() })); } catch (e) {}
  }
  function clear() {
    try {
      localStorage.removeItem(KEY);
      localStorage.removeItem(KEY_EVENTS);
      localStorage.removeItem(KEY_DECODER);
      localStorage.removeItem('binari.relics.v1'); // 유실물 획득 기록 (랭킹 기록과 소리 설정은 지우지 않음)
      localStorage.removeItem('binari.best.v1');   // 굿판 최고 점수 (인증서에 씀)
    } catch (e) {}
  }

  // ── 모듈 사이 알림: 굿판 · 테스트를 마치면 emit, 디코더가 열릴 때 안 본 것에 반응 ──
  function readEvents() {
    try { var v = JSON.parse(localStorage.getItem(KEY_EVENTS)); return Array.isArray(v) ? v : []; }
    catch (e) { return []; }
  }
  function writeEvents(list) {
    try { localStorage.setItem(KEY_EVENTS, JSON.stringify(list)); } catch (e) {}
  }
  function emit(name, info) {
    if (!/^[a-z_]{1,24}$/.test(String(name))) return;
    var list = readEvents();
    var ev = { e: String(name), seen: false, at: Date.now() };
    if (info && info.beat) ev.beat = true; // 굿판에서 벼리 기록을 넘김
    list.push(ev);
    writeEvents(list.slice(-20));
  }
  // 효과음 (sound.js 가 준비되어 있고 켜져 있을 때만 남)
  function sfx(name) { if (window.BINARI && window.BINARI.sound) window.BINARI.sound.play(name); }

  // ?id=7, ?id=07 모두 '07'. 명단에 없으면 null (그냥 "관리자"로 진행).
  function normalizeId(raw) {
    if (raw == null) return null;
    var s = String(raw).trim();
    if (!/^\d{1,2}$/.test(s)) return null;
    var id = ('0' + parseInt(s, 10)).slice(-2);
    return Object.prototype.hasOwnProperty.call(ROSTER, id) ? id : null;
  }

  // ── 인앱 브라우저: 카카오톡 · 인스타그램만. 삼성 인터넷 등은 정상 브라우저 ──
  // 인앱은 저장소가 따로라 인벤토리가 따로 쌓이므로 바깥 브라우저로 보낸다.
  function inAppKind() {
    var ua = navigator.userAgent || '';
    if (/KAKAOTALK/i.test(ua)) return 'kakao';
    if (/Instagram/i.test(ua)) return 'insta';
    return null;
  }
  var INAPP_TEXT = {
    kakao: '카카오톡 안에서 열렸어요. 오른쪽 아래 공유 버튼 → 다른 브라우저로 열기를 눌러 주세요.',
    insta: '인스타그램 안에서 열렸어요. 오른쪽 위 ⋯ → 외부 브라우저에서 열기를 눌러 주세요.'
  };
  var params;
  try { params = new URLSearchParams(location.search); }
  catch (e) { params = { get: function () { return null; }, has: function () { return false; } }; }

  // ── 오프라인 동작: 서비스 워커(sw.js)가 사이트 파일을 받아 두고, 새 버전은 연결됐을 때 알아서 갈아 둔다 ──
  function registerSW() {
    if (!('serviceWorker' in navigator) || !/^https?:$/.test(location.protocol)) return;
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('sw.js').then(function () {
        return navigator.serviceWorker.ready;
      }).then(function (reg) {
        // 화면이 다 뜬 뒤에 폰트 조각도 받아 두라고 알림
        if (reg.active) reg.active.postMessage({ type: 'warm' });
      }).catch(function () {});
    });
  }

  // ══════════════ 부스 모드: 주소에 ?booth=1 (부스 아이패드) ══════════════
  // 바깥 화면(여기)은 폰 화면을 아이패드 가운데에 비율 그대로 키워서 보여 주고,
  // 아무 조작 없이 시간이 지나면 "다음 관리자를 기다리는 중"으로 바꾼 뒤 처음부터 다시 시작하게 한다.
  // 실제 사이트는 안쪽 틀(?booth=1&frame=1)에서 폰 크기로 그대로 돈다.
  var BOOTH = params.get('booth') === '1';
  var BOOTH_INNER = BOOTH && params.has('frame');
  if (BOOTH && !BOOTH_INNER) {
    startBoothShell();
    registerSW();
    return;
  }

  function startBoothShell() {
    var cfg = (window.BINARI_CONFIG && window.BINARI_CONFIG.booth) || {};
    var W = cfg.width || 440, MIN_H = cfg.minHeight || 780;
    var IDLE = (parseFloat(params.get('idle')) || cfg.idleSeconds || 60) * 1000; // ?idle=초 는 점검용
    var inner = location.pathname + '?booth=1&frame=1';
    // 초기화할 때 지우는 것: 접속 기록 · 메신저 진행 · 굿판 알림 · 유실물 회수 기록. 랭킹 기록과 소리 설정은 남김
    var WIPE = [KEY, KEY_EVENTS, KEY_DECODER, 'binari.relics.v1', 'binari.best.v1'];

    document.body.className += ' booth-shell';
    document.body.setAttribute('data-screen', 'booth');

    var stage = el('div', null, 'booth-stage');
    var frame = document.createElement('iframe');
    frame.title = 'BINARI · MAGO OS 관리자 콘솔';
    frame.setAttribute('allow', 'autoplay');
    stage.appendChild(frame);
    document.body.appendChild(stage);

    var wait = el('button', null, 'booth-wait');
    wait.type = 'button';
    wait.hidden = true;
    wait.innerHTML = '<svg class="booth-wait-seal" viewBox="0 0 100 100" aria-hidden="true" focusable="false"><use href="#seal-art"/></svg>';
    wait.appendChild(el('span', '다음 관리자를 기다리는 중', 'booth-wait-ko'));
    wait.appendChild(el('span', 'STANDBY', 'booth-wait-en'));
    document.body.appendChild(wait);

    // 폰 레이아웃을 비율 그대로 키워 가운데에: 세로를 꽉 채우되 가로를 넘지 않게
    function fit() {
      var vw = window.innerWidth, vh = window.innerHeight;
      var s = Math.min(vw / W, vh / MIN_H);
      frame.style.width = W + 'px';
      frame.style.height = Math.ceil(vh / s) + 'px';
      stage.style.transform = 'scale(' + s + ')';
      stage.style.left = Math.max(0, (vw - W * s) / 2) + 'px';
    }
    fit();
    window.addEventListener('resize', fit);
    window.addEventListener('orientationchange', fit);

    var timer = 0, waiting = false;
    function wipe() { WIPE.forEach(function (k) { try { localStorage.removeItem(k); } catch (e) {} }); }
    function begin() { // 첫 접속 탭 화면부터
      waiting = false;
      wait.hidden = true;
      frame.src = inner + '&t=' + Date.now();
      poke();
    }
    function poke() {
      clearTimeout(timer);
      if (!waiting) timer = setTimeout(goIdle, IDLE);
    }
    function goIdle() {
      waiting = true;
      frame.src = 'about:blank'; // 안쪽 화면을 먼저 멈춘 뒤에 기록을 지움
      setTimeout(wipe, 50);
      wait.hidden = false;
    }
    wait.addEventListener('click', function () { wipe(); begin(); });
    // 안쪽 화면이 조작을 알려 오면 시간을 다시 잰다
    window.addEventListener('message', function (ev) {
      if (ev.origin === location.origin && ev.data && ev.data.type === 'binari-activity') poke();
    });
    document.addEventListener('pointerdown', poke, true);

    wipe(); // 부스를 켤 때도 지난 관람객의 기록 없이 시작
    begin();
  }

  // 부스 모드에서는 인앱 브라우저 안내 · 카카오톡 자동 이동을 끈다
  var inApp = BOOTH ? null : inAppKind();

  // 카카오톡: 지금 주소(?id= · ?relic= 그대로)를 바깥 브라우저로 자동으로 넘긴다.
  // 같은 창에서 되풀이되지 않게 한 번만 시도하고, 안 넘어가면 아래 안내 띠가 남는다.
  if (inApp === 'kakao') {
    var tried = false;
    try { tried = sessionStorage.getItem('binari.kakao.out') === '1'; } catch (e) {}
    if (!tried) {
      try { sessionStorage.setItem('binari.kakao.out', '1'); } catch (e) {}
      location.href = 'kakaotalk://web/openExternal?url=' + encodeURIComponent(location.href);
    }
  }

  // 테스트용: ?reset 을 붙이면 이 폰의 접속 기록을 지우고 처음 접속처럼 시작
  if (params.has('reset')) clear();

  var incoming = BOOTH ? null : normalizeId(params.get('id')); // 부스 모드는 id를 무시하고 항상 "관리자"
  var saved = load();
  var savedId = saved && Object.prototype.hasOwnProperty.call(ROSTER, saved.id) ? saved.id : null;

  // 이름 · 번호는 항상 지금 주소 기준.
  //  ?id 가 없거나 목록에 없는 번호면 언제나 "관리자" (전에 열었던 이름을 이어 쓰지 않는다)
  var activeId = incoming;

  // 어떤 화면으로 시작할지 (기억해 둔 id는 이 판단에만 쓴다)
  //  boot  : 이 폰의 첫 접속 → 부팅 연출 전체
  //  greet : 지난번과 다른 id (또는 id 없이 왔다가 id가 생김) → 짧은 인사 후 그 id를 기억
  //  home  : 같은 id로 다시 옴, 또는 id 없이 다시 옴 → 부팅 없이 홈
  var mode;
  if (params.has('relic')) {
    // 유실물 키링 주소: 부팅 없이 바로 INVENTORY 로 (아래에서 화면을 연다)
    mode = 'home';
  } else if (!saved) {
    mode = 'boot';
  } else if (incoming && incoming !== savedId) {
    mode = 'greet';
  } else {
    mode = 'home';
  }

  var who = activeId ? ROSTER[activeId] : null;
  var isArch = !!(who && who.arch);
  var access = isArch ? 'ALL LAYERS' : 'LAYER 1'; // 실물 카드와 같게: 설계자만 ALL LAYERS
  document.body.setAttribute('data-role', isArch ? 'arch' : 'admin');

  // ── 카드 번호 · 바코드 (부팅 카드와 홈 카드 둘 다) ──
  function fillCard() {
    var i, nodes = document.querySelectorAll('[data-card-no]');
    for (i = 0; i < nodes.length; i++) nodes[i].textContent = activeId || '—';

    nodes = document.querySelectorAll('[data-barcode]');
    for (i = 0; i < nodes.length; i++) {
      if (activeId && BARCODE[activeId]) {
        nodes[i].innerHTML = barcodeSVG(BARCODE[activeId]);
        nodes[i].removeAttribute('data-empty');
      } else {
        nodes[i].textContent = '';
        nodes[i].setAttribute('data-empty', ''); // id 없음: 바코드 자리에 "—"
      }
    }
  }

  // ── 홈 채우기 ──
  function fillHome() {
    $('id-name').textContent = who ? who.ko : '관리자';
    $('id-en').textContent = who ? who.en : 'ADMINISTRATOR';
    $('id-badge').textContent = isArch ? 'ARCHITECT' : 'ADMINISTRATOR';

    var rows = [];
    if (isArch) {
      rows.push(['ARCH ID', 'ROOT-2199-0000']);
      rows.push(['CLEARANCE', 'LV.MAX // ROOT']);
    } else {
      rows.push(['ADMIN ID', who ? 'ADM-2199-00' + activeId : '—']);
      rows.push(['CLEARANCE', 'LV.1 // NEW ADMIN']);
    }
    rows.push(['ACCESS', access]);
    rows.push(['ISSUED', who ? who.issued : '—']);
    rows.push(['STATUS', isArch ? 'ROOT ACCESS' : 'ACCESS GRANTED', 'on']);

    var dl = $('id-rows');
    dl.textContent = '';
    rows.forEach(function (r) {
      dl.appendChild(el('dt', r[0]));
      dl.appendChild(el('dd', r[1], r[2]));
    });
  }

  // ── 접속 승인 문구 ──
  function fillGreet() {
    var h = $('greet');
    h.textContent = '';
    if (isArch) {
      var l = el('span', null, 'line');
      l.appendChild(document.createTextNode('설계자 '));
      l.appendChild(el('b', who.ko));
      l.appendChild(document.createTextNode('님'));
      h.appendChild(l);
      h.appendChild(el('span', 'ROOT ACCESS', 'root'));
    } else {
      var a = el('span', null, 'line');
      if (who) {
        a.appendChild(el('b', who.ko));
        a.appendChild(document.createTextNode(' 관리자님,'));
      } else {
        a.appendChild(document.createTextNode('관리자님,'));
      }
      h.appendChild(a);
      h.appendChild(el('span', '접속이 승인되었습니다', 'line'));
    }
  }

  // ── 부팅 로그 ──
  function fillLog() {
    var lines = [
      ['연결', 'CONNECT', 'OK'],
      ['식별', isArch ? 'ROOT-2199-0000' : (who ? 'ADM-2199-00' + activeId : 'ADMIN'), 'OK'],
      ['권한', isArch ? 'LV.MAX // ROOT' : 'LV.1 // NEW ADMIN', 'OK'],
      ['접속', access, 'OK']
    ];
    var ol = $('log');
    ol.textContent = '';
    lines.forEach(function (ln, i) {
      var li = el('li');
      li.style.setProperty('--i', i);
      li.appendChild(el('span', '>'));
      li.appendChild(el('span', ln[0]));
      li.appendChild(el('b', ln[1]));
      li.appendChild(el('em', ln[2]));
      ol.appendChild(li);
    });
  }

  var bootEl = $('boot');
  var homeEl = $('home');
  var stampTimer = null;

  // ── 화면 이동: 주소 끝의 #decoder · #ritual 로 구분 (없으면 홈). 폰의 뒤로 가기가 그대로 먹음 ──
  var SCREENS = { home: homeEl, decoder: $('decoder'), ritual: $('ritual'), inventory: $('inventory'), cert: $('cert') };
  var booting = false;

  function screenFromHash() {
    var h = (location.hash || '').replace('#', '');
    return h !== 'home' && Object.prototype.hasOwnProperty.call(SCREENS, h) ? h : 'home';
  }
  function render() {
    if (booting) return;
    var name = screenFromHash();
    bootEl.hidden = true;
    for (var k in SCREENS) {
      if (Object.prototype.hasOwnProperty.call(SCREENS, k)) SCREENS[k].hidden = (k !== name);
    }
    document.body.setAttribute('data-screen', name);
    window.scrollTo(0, 0);
    try { document.dispatchEvent(new CustomEvent('binari:screen', { detail: name })); } catch (e) {}
  }
  function go(name, replace) {
    var url = location.pathname + location.search + (name === 'home' ? '' : '#' + name);
    try { history[replace ? 'replaceState' : 'pushState'](null, '', url); }
    catch (e) { location.hash = name === 'home' ? '' : name; }
    render();
  }
  window.addEventListener('popstate', render);
  window.addEventListener('hashchange', render);
  document.addEventListener('click', function (ev) {
    var t = ev.target && ev.target.closest ? ev.target.closest('[data-go]') : null;
    if (t) { sfx('tap'); go(t.getAttribute('data-go')); }
  });

  function remember() { save(activeId); }

  // 카드를 읽는 동안만: 빠르고 또렷한 스캔 라인 + 조준 링
  function setScanning(on) {
    if (on) document.body.setAttribute('data-scan', '');
    else document.body.removeAttribute('data-scan');
  }

  // 접속 승인 → 콘솔 열기 다음 첫 화면은 디코더 메신저 (홈은 메신저에서 나가면 보임)
  function finishBoot() {
    // 건너뛰면 울리던 부팅음도 같이 멈춘다
    if (bootSound && window.BINARI && window.BINARI.sound) window.BINARI.sound.boot.stop();
    bootSound = false;
    sfx('tap');
    if (stampTimer) { clearTimeout(stampTimer); stampTimer = null; }
    setScanning(false);
    remember();
    booting = false;
    go('decoder', true);
  }

  // 첫 접속에만: 부팅 앞의 탭 화면. 이 탭에서 소리를 열고 부팅음을 낸다 (스피커 설정과 상관없이 이 한 번만)
  var bootSound = false;
  function bsfx(name) {
    if (bootSound && window.BINARI && window.BINARI.sound) window.BINARI.sound.boot.play(name);
    else sfx(name);
  }
  function showGate() {
    var gate = $('gate');
    booting = true;
    document.body.setAttribute('data-screen', 'gate');
    gate.hidden = false;
    $('gate-btn').addEventListener('click', function () {
      if (gate.hidden) return;
      gate.hidden = true;
      var snd = window.BINARI && window.BINARI.sound;
      bootSound = !!(snd && snd.boot.unlock());
      bsfx('power'); // 시작음
      showBoot('boot');
    });
  }

  function showBoot(kind) {
    fillGreet();
    if (kind === 'boot') fillLog();
    booting = true;
    document.body.setAttribute('data-screen', 'boot');
    bootEl.setAttribute('data-mode', kind);
    bootEl.hidden = false;
    // 메신저 첫 등장에 쓸 그림을 미리 받아 둠
    try { new Image().src = 'assets/decoder/ara-bust.webp'; } catch (e) {}

    var reduced = false;
    try { reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}

    if (kind === 'boot' && !reduced) setScanning(true);

    // 부팅 로그가 한 줄씩 뜰 때 틱
    if (kind === 'boot' && !reduced) {
      [150, 450, 750, 1050].forEach(function (ms) { setTimeout(function () { if (booting) bsfx('tick'); }, ms); });
    }

    // 도장이 찍히는 순간: 스캔을 끝내고 이 id를 기억 (그 전에 닫으면 다음에 다시 보여 줌)
    stampTimer = setTimeout(function () {
      stampTimer = null;
      setScanning(false);
      bsfx('seal');
      bootSound = false; // 부팅음은 여기까지. 이 뒤로는 스피커 설정을 따른다
      remember();
    }, kind === 'boot' ? STAMP_AT : 400);

    $('skip').addEventListener('click', finishBoot);
    $('enter').addEventListener('click', finishBoot);
  }

  // 다른 스크립트(decoder.js 등)가 쓰는 공용 창구
  window.BINARI = {
    id: activeId,
    name: who ? who.ko : '관리자',
    arch: isArch,
    go: go,
    emit: emit,
    readEvents: readEvents,
    writeEvents: writeEvents,
    keys: { decoder: KEY_DECODER },
    booth: BOOTH,
    inApp: inApp, // 인앱 브라우저 종류 (없으면 null)
    // 인증서(cert.js)가 쓰는 카드 정보 — 홈 카드와 같은 값
    card: {
      no: activeId,
      ko: who ? who.ko : '관리자',
      en: who ? who.en : 'ADMINISTRATOR',
      badge: isArch ? 'ARCHITECT' : 'ADMINISTRATOR',
      idLabel: isArch ? 'ARCH ID' : 'ADMIN ID',
      idValue: isArch ? 'ROOT-2199-0000' : (who ? 'ADM-2199-00' + activeId : '—'),
      status: isArch ? 'ROOT ACCESS' : 'ACCESS GRANTED',
      barcode: activeId && BARCODE[activeId] ? BARCODE[activeId] : '',
      barW: BAR_W,
      gapW: GAP_W
    },
    relic: params.has('relic') ? params.get('relic') : null // 키링 태그 주소 ?relic=번호 (inventory.js 가 처리)
  };

  // 테스트용: ?event=ritual_done 처럼 붙이면 그 모듈을 마친 것으로 기록
  if (params.get('event')) emit(params.get('event'), { beat: params.has('beat') });

  fillCard();
  fillHome();

  if (mode === 'home') {
    // relic로 처음 들어온 경우에는 기억하지 않는다 (다음 정식 접속 때 부팅을 보여 주기 위해)
    if (params.has('relic')) go('inventory', true); // 키링 태그: 부팅 없이 바로 유실물 인벤토리
    else render();
  } else if (mode === 'boot') {
    showGate(); // 첫 접속: 탭 화면 → 부팅
  } else {
    showBoot(mode); // 다른 id로 다시 옴: 탭 화면 없이 짧은 인사
  }

  if (inApp) {
    var bar = $('inapp');
    $('inapp-text').textContent = INAPP_TEXT[inApp];
    bar.hidden = false;
    $('inapp-close').addEventListener('click', function () { bar.hidden = true; });
  }

  // 부스 모드의 안쪽 화면: 조작이 있을 때마다 바깥 화면에 알려서 60초를 다시 재게 한다
  if (BOOTH_INNER && window.parent !== window) {
    var tell = function () { try { window.parent.postMessage({ type: 'binari-activity' }, location.origin); } catch (e) {} };
    document.addEventListener('pointerdown', tell, true);
    document.addEventListener('keydown', tell, true);
  }

  registerSW();
})();
