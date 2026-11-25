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
    '20': { ko: '박원철', en: 'PARK WON CHUL', issued: '—' } // 명예 발급. 발급일이 정해지면 채움
  };

  // 바코드 — 실물 관리자 카드와 같은 패턴.
  // 글자 두 개가 한 쌍 = 막대 + 간격, 왼쪽부터. 막대 a=0.18 b=0.30 c=0.45mm, 간격 1=0.18 2=0.30mm,
  // 전체 폭 30mm · 높이 4.1mm 안에서 그리고 화면에서는 같은 비율로 늘린다.
  var BARCODE = {
    '00': 'a2a2c2a2a2b2a1c2c2a1a2c2a2a1a2a2c2c2c2c1b1a1c1b2c2b2c2b2c2a2a2a2b2a2a2b2a1c2c1b1c1a2c2a1a2b2b2a1b1a1a1c2b1a2',
    '01': 'a2b2a2a2a2c2a2c1b1a1c2b1c2a2c2a1c2b1a2b2b2c1c1c2c1c1a2a2b1b2a1c1b1a2b2c1c2b1a1a1b2c1c2a2a1c1a1b2c1a2b2a1b2b1',
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
    try { localStorage.removeItem(KEY); } catch (e) {}
  }

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
  var inApp = inAppKind();

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

  var params;
  try { params = new URLSearchParams(location.search); }
  catch (e) { params = { get: function () { return null; }, has: function () { return false; } }; }

  // 테스트용: ?reset 을 붙이면 이 폰의 접속 기록을 지우고 처음 접속처럼 시작
  if (params.has('reset')) clear();

  var incoming = normalizeId(params.get('id'));
  var saved = load();
  var savedId = saved && Object.prototype.hasOwnProperty.call(ROSTER, saved.id) ? saved.id : null;

  // 어떤 화면으로 시작할지
  //  boot  : 이 폰의 첫 접속 → 부팅 연출 전체
  //  greet : 처음 보는 id (다른 id, 또는 id 없이 왔다가 id가 생김) → 짧은 인사 후 그 id를 기억
  //  home  : 같은 id로 다시 옴, 또는 id 없이 다시 옴 → 부팅 없이 홈 (기억한 이름 유지)
  var mode, activeId;
  if (params.has('relic')) {
    // 유품 키링 주소. INVENTORY는 2단계에서 붙임 — 지금은 부팅 없이 홈으로만.
    mode = 'home';
    activeId = incoming || savedId;
  } else if (!saved) {
    mode = 'boot';
    activeId = incoming;
  } else if (incoming && incoming !== savedId) {
    mode = 'greet';
    activeId = incoming;
  } else {
    mode = 'home';
    activeId = savedId;
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

  function remember() { save(activeId); }

  // 카드를 읽는 동안만: 빠르고 또렷한 스캔 라인 + 조준 링
  function setScanning(on) {
    if (on) document.body.setAttribute('data-scan', '');
    else document.body.removeAttribute('data-scan');
  }

  function showHome(focus) {
    if (stampTimer) { clearTimeout(stampTimer); stampTimer = null; }
    setScanning(false);
    bootEl.hidden = true;
    homeEl.hidden = false;
    window.scrollTo(0, 0);
    if (focus) { try { $('id-name').focus({ preventScroll: true }); } catch (e) {} }
  }

  function showBoot(kind) {
    fillGreet();
    if (kind === 'boot') fillLog();
    bootEl.setAttribute('data-mode', kind);
    bootEl.hidden = false;

    var reduced = false;
    try { reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}

    if (kind === 'boot' && !reduced) setScanning(true);

    // 도장이 찍히는 순간: 스캔을 끝내고 이 id를 기억 (그 전에 닫으면 다음에 다시 보여 줌)
    stampTimer = setTimeout(function () {
      stampTimer = null;
      setScanning(false);
      remember();
    }, kind === 'boot' ? STAMP_AT : 400);

    $('skip').addEventListener('click', function () { remember(); showHome(true); });
    $('enter').addEventListener('click', function () { remember(); showHome(true); });
  }

  fillCard();
  fillHome();

  if (mode === 'home') {
    // relic로 처음 들어온 경우에는 기억하지 않는다 (다음 정식 접속 때 부팅을 보여 주기 위해)
    showHome(false);
  } else {
    showBoot(mode);
  }

  if (inApp) {
    var bar = $('inapp');
    $('inapp-text').textContent = INAPP_TEXT[inApp];
    bar.hidden = false;
    $('inapp-close').addEventListener('click', function () { bar.hidden = true; });
  }
})();
