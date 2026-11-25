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
    '18': { ko: '유대겸', en: 'YOO DAE KYUM', issued: '2026.11.25' }
  };

  var KEY = 'binari.console.v1';

  function $(id) { return document.getElementById(id); }

  function el(tag, text, cls) {
    var n = document.createElement(tag);
    if (text != null) n.textContent = text;
    if (cls) n.className = cls;
    return n;
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
    if (!/^\d{1,3}$/.test(s)) return null;
    var id = ('0' + parseInt(s, 10)).slice(-2);
    if (parseInt(s, 10) > 99) return null;
    return Object.prototype.hasOwnProperty.call(ROSTER, id) ? id : null;
  }

  // ── 인앱 브라우저 안내: 카카오톡 · 인스타그램만. 삼성 인터넷 등은 정상 브라우저 ──
  function isInApp() {
    var ua = navigator.userAgent || '';
    return /KAKAOTALK|Instagram/i.test(ua);
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
  document.body.setAttribute('data-role', isArch ? 'arch' : 'admin');

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
      if (who) rows.push(['ADMIN ID', 'ADM-2199-00' + activeId]);
      rows.push(['CLEARANCE', 'LV.1 // NEW ADMIN']);
    }
    rows.push(['ACCESS', 'ALL LAYERS']);
    if (who) rows.push(['ISSUED', who.issued]);
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
      ['접속', 'ALL LAYERS', 'OK']
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

  function showHome(focus) {
    if (stampTimer) { clearTimeout(stampTimer); stampTimer = null; }
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

    // 도장이 찍힐 즈음 이 id를 기억 (그 전에 닫으면 다음에 다시 보여 줌)
    stampTimer = setTimeout(remember, kind === 'boot' ? 1900 : 500);

    $('skip').addEventListener('click', function () { remember(); showHome(true); });
    $('enter').addEventListener('click', function () { remember(); showHome(true); });
  }

  fillHome();

  if (mode === 'home') {
    // relic로 처음 들어온 경우에는 기억하지 않는다 (다음 정식 접속 때 부팅을 보여 주기 위해)
    showHome(false);
  } else {
    showBoot(mode);
  }

  if (isInApp()) {
    var bar = $('inapp');
    bar.hidden = false;
    $('inapp-close').addEventListener('click', function () { bar.hidden = true; });
  }
})();
