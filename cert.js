/* BINARI · 관리자 인증서 — 홈의 "인증서 발급"을 누르면 카드를 그려 보여 주고 PNG로 저장
   실물 관리자 카드와 같은 계열(가로형 86.5×55 비율, 검정 + 시안, 설계자 00은 노랑).
   그림은 브라우저 안에서 직접 그린다(canvas). 서버로 보내는 것 없음. */
(function () {
  'use strict';
  var B = window.BINARI;
  if (!B || !B.card) return;

  var root = document.getElementById('cert');
  var openBtn = document.getElementById('cert-open');
  if (!root || !openBtn) return;

  // 부스 아이패드에서는 인증서를 내지 않는다
  if (B.booth) { openBtn.hidden = true; return; }
  openBtn.hidden = false;

  var img = document.getElementById('cert-img');
  var saveBtn = document.getElementById('cert-save');
  var hint = document.getElementById('cert-hint');
  var card = B.card;

  var TEXT = {
    head: B.arch ? 'MAGO OS // ARCHITECT CERTIFICATE' : 'MAGO OS // ADMINISTRATOR CERTIFICATE',
    headKo: B.arch ? '네오 마고 설계자 인증서' : '네오 마고 관리자 인증서',
    title: B.arch ? '설계자 인증서' : '관리자 인증서',
    site: 'NEO-MAGO',
    issued: 'ISSUED',
    ritual: 'RITUAL // BEST SCORE',
    ritualKo: '굿판 최고 점수',
    relics: 'RELICS // RECOVERED',
    relicsKo: '회수한 유실물',
    status: 'STATUS',
    none: '—',
    holdIOS: '이미지를 길게 눌러 ‘사진 앱에 저장’을 선택하세요.',
    hold: '이미지를 길게 눌러 저장하세요.',
    alt: B.name + ' ' + (B.arch ? '설계자 인증서' : '관리자 인증서')
  };
  document.getElementById('cert-title').textContent = TEXT.title;

  var ACCENT = B.arch ? '#FCE80A' : '#18D9EE';
  var WHITE = '#F2F5F6', GRAY = '#8C9599', INK = '#0D0D0D';
  var MONO = '"IBM Plex Mono", ui-monospace, Menlo, monospace';
  var SANS = '"IBM Plex Sans KR", "Apple SD Gothic Neo", "Malgun Gothic", sans-serif';
  var W = 1100, H = 700, K = 2; // 그리는 기준 크기 × 2배 = 2200×1400 PNG

  // ── 이 폰에 남아 있는 기록 ──
  function read(key) { try { return JSON.parse(localStorage.getItem(key)); } catch (e) { return null; } }
  function bestScore() {
    var best = 0, b = read('binari.best.v1'), list = read('binari.rank.v1');
    if (b && b.score > best) best = b.score;
    // 최고 점수를 따로 적기 전에 이 폰에서 등록한 랭킹 기록도 본다
    if (list && list.length) list.forEach(function (e) { if (e && e.score > best) best = e.score; });
    return best;
  }
  var RELIC_KEYS = ['r01', 'voice', 'r03', 'r04', 'r05', 'r06']; // 01 ~ 06 순서
  function relics() {
    var r = read('binari.relics.v1') || {};
    return RELIC_KEYS.map(function (k) { return !!r[k]; });
  }
  function two(n) { return (n < 10 ? '0' : '') + n; }
  function stamp(d) {
    return d.getFullYear() + '.' + two(d.getMonth() + 1) + '.' + two(d.getDate()) + ' ' + two(d.getHours()) + ':' + two(d.getMinutes());
  }

  // ── 그리기 ──
  function lotusPaths() {
    var out = [], nodes = document.querySelectorAll('#seal-art g[transform] path');
    for (var i = 0; i < nodes.length; i++) {
      try { out.push(new Path2D(nodes[i].getAttribute('d'))); } catch (e) {}
    }
    return out;
  }

  function draw(info) {
    var cv = document.createElement('canvas');
    cv.width = W * K; cv.height = H * K;
    var c = cv.getContext('2d');
    c.scale(K, K);
    var lotus = lotusPaths();

    // 글자 사이를 띄워 쓰는 글 (canvas 의 letterSpacing 은 아이폰에서 안 되는 버전이 있어 직접 띄움)
    function text(str, x, y, font, color, ls, align) {
      c.font = font; c.fillStyle = color; c.textAlign = 'left'; c.textBaseline = 'alphabetic';
      ls = ls || 0;
      var chars = String(str).split(''), ws = [], total = 0, i;
      for (i = 0; i < chars.length; i++) { ws[i] = c.measureText(chars[i]).width; total += ws[i] + ls; }
      total -= ls;
      var cx = align === 'right' ? x - total : align === 'center' ? x - total / 2 : x;
      for (i = 0; i < chars.length; i++) { c.fillText(chars[i], cx, y); cx += ws[i] + ls; }
      return total;
    }
    function fillLotus(x, y, width, color, alpha) {
      c.save();
      c.translate(x, y); c.scale(width / 244.5, width / 244.5); c.translate(-134, -62);
      c.fillStyle = color; c.globalAlpha = alpha;
      lotus.forEach(function (p) { c.fill(p); });
      c.restore();
    }
    function line(x1, y1, x2, y2, color, w) {
      c.strokeStyle = color; c.lineWidth = w; c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke();
    }

    // 바탕 + 옅은 모눈
    c.fillStyle = '#0A0C0D'; c.fillRect(0, 0, W, H);
    var g;
    for (g = 44; g < W; g += 44) line(g, 0, g, H, 'rgba(255,255,255,0.028)', 1);
    for (g = 34; g < H; g += 44) line(0, g, W, g, 'rgba(255,255,255,0.028)', 1);

    // 머리띠
    c.fillStyle = '#050607'; c.fillRect(0, 0, W, 120);
    c.fillStyle = ACCENT; c.fillRect(0, 0, 42, 120);
    c.fillRect(42, 119, W - 42, 3);
    fillLotus(58, 33, 78, ACCENT, 1);
    text(TEXT.head, 160, 55, '600 25px ' + MONO, WHITE, 4.2);
    text(TEXT.headKo, 160, 90, '400 21px ' + SANS, GRAY, 3.5);
    text(TEXT.site, 1030, 72, '500 22px ' + MONO, ACCENT, 2.4, 'right');

    // 뒤에 깔리는 큰 연꽃
    fillLotus(626, 150, 440, ACCENT, 0.085);

    // 이름 · 직함
    text(info.ko, 70, 238, '700 84px ' + SANS, WHITE, 2);
    text(info.en, 72, 286, '400 23px ' + MONO, GRAY, 7);
    c.fillStyle = ACCENT; c.fillRect(740, 176, 290, 44);
    text(info.badge, 885, 206, '700 22px ' + MONO, INK, 2.6, 'center');
    line(72, 316, 1030, 316, 'rgba(255,255,255,0.3)', 2);

    // 식별 번호 · 발급 일시
    text(info.idLabel, 72, 364, '400 22px ' + MONO, GRAY, 2.4);
    text(info.idValue, 250, 364, '500 26px ' + MONO, WHITE, 1.2);
    text(TEXT.issued, 72, 408, '400 22px ' + MONO, GRAY, 2.4);
    text(info.issued, 250, 408, '500 26px ' + MONO, WHITE, 1.2);

    // 기록 두 칸 — 할수록 채워진다
    function box(x, y, w, h, en, ko) {
      c.strokeStyle = 'rgba(255,255,255,0.22)'; c.lineWidth = 1.5; c.strokeRect(x, y, w, h);
      c.fillStyle = ACCENT; // 귀퉁이 브래킷
      c.fillRect(x - 1, y - 1, 16, 3); c.fillRect(x - 1, y - 1, 3, 16);
      c.fillRect(x + w - 15, y + h - 2, 16, 3); c.fillRect(x + w - 2, y + h - 15, 3, 16);
      text(en, x + 20, y + 31, '500 15px ' + MONO, ACCENT, 2);
      text(ko, x + 20, y + 57, '400 18px ' + SANS, GRAY, 1);
    }
    box(72, 436, 326, 126, TEXT.ritual, TEXT.ritualKo);
    text(info.best > 0 ? String(info.best) : TEXT.none, 92, 544, '700 46px ' + MONO, info.best > 0 ? WHITE : GRAY, 1.5);

    box(418, 436, 326, 126, TEXT.relics, TEXT.relicsKo);
    var got = info.relics.filter(Boolean).length;
    var nw = text(String(got), 438, 544, '700 46px ' + MONO, got ? WHITE : GRAY, 0);
    text('/ 6', 438 + nw + 12, 544, '500 28px ' + MONO, GRAY, 1);
    info.relics.forEach(function (on, i) {
      var x = 560 + i * 28, y = 518;
      if (on) { c.fillStyle = ACCENT; c.fillRect(x, y, 20, 26); }
      else { c.strokeStyle = 'rgba(255,255,255,0.3)'; c.lineWidth = 1.5; c.strokeRect(x + 0.75, y + 0.75, 18.5, 24.5); }
    });

    // ACCESS SEAL 도장 (index.html 의 도장과 같은 치수)
    (function seal(cx, cy, size, deg) {
      c.save();
      c.translate(cx, cy); c.rotate(deg * Math.PI / 180); c.scale(size / 100, size / 100); c.translate(-50, -50);
      c.globalAlpha = 0.94;
      c.strokeStyle = ACCENT; c.fillStyle = ACCENT;
      [[47.5, 1.6], [45.3, 0.5], [32.5, 0.5], [30.8, 1.6]].forEach(function (r) {
        c.lineWidth = r[1]; c.beginPath(); c.arc(50, 50, r[0], 0, Math.PI * 2); c.stroke();
      });
      [88.9, 11.1].forEach(function (x) { c.beginPath(); c.arc(x, 50, 1.4, 0, Math.PI * 2); c.fill(); });
      function arc(str, R, ls, top) {
        c.font = '600 5.2px ' + MONO; c.textAlign = 'left'; c.textBaseline = 'alphabetic'; c.fillStyle = ACCENT;
        var chars = str.split(''), ws = [], total = 0, i;
        for (i = 0; i < chars.length; i++) { ws[i] = c.measureText(chars[i]).width; total += ws[i] + ls; }
        total -= ls;
        var acc = 0;
        for (i = 0; i < chars.length; i++) {
          var mid = (acc + ws[i] / 2 - total / 2) / R; // 가운데에서 잰 각
          var a = top ? -Math.PI / 2 + mid : Math.PI / 2 - mid;
          c.save();
          c.translate(50 + R * Math.cos(a), 50 + R * Math.sin(a));
          c.rotate(top ? a + Math.PI / 2 : a - Math.PI / 2);
          c.fillText(chars[i], -ws[i] / 2, 0);
          c.restore();
          acc += ws[i] + ls;
        }
      }
      arc('MAGO OS ADMINISTRATION', 37.085, 0.7, true);
      arc('NEO-MAGO · 2199', 40.715, 1.1, false);
      // 가운데 띠
      c.fillStyle = ACCENT; c.fillRect(10, 43.5, 80, 13);
      c.font = '700 7.4px ' + MONO; c.textBaseline = 'middle'; c.fillStyle = INK;
      var s = 'ACCESS GRANTED', chars = s.split(''), tw = 0, ws = [], i;
      for (i = 0; i < chars.length; i++) { ws[i] = c.measureText(chars[i]).width; tw += ws[i] + 0.9; }
      tw -= 0.9;
      var x = 50 - tw / 2;
      for (i = 0; i < chars.length; i++) { c.fillText(chars[i], x, 50.4); x += ws[i] + 0.9; }
      // 연꽃 + 접속 승인
      c.save();
      c.translate(40.5, 25.034); c.scale(0.079683, 0.079683); c.translate(-136.9766, -64.4922);
      c.fillStyle = ACCENT; lotus.forEach(function (p) { c.fill(p); });
      c.restore();
      c.font = '700 6.2px ' + SANS; c.textAlign = 'center'; c.textBaseline = 'alphabetic'; c.fillStyle = ACCENT;
      c.fillText('접속 승인', 50, 67.5);
      c.restore();
    })(940, 470, 178, -8);

    // 아래 줄: 번호 · 바코드 · 상태
    line(72, 586, 1030, 586, 'rgba(255,255,255,0.3)', 2);
    text(info.no || TEXT.none, 72, 664, '700 74px ' + MONO, WHITE, 2);
    if (info.barcode) {
      var mm = 376 / 30, bx = 216; // 30mm 를 376 폭으로
      c.fillStyle = '#E8EDEE';
      for (var i = 0; i + 1 < info.barcode.length; i += 2) {
        var bw = info.barW[info.barcode.charAt(i)];
        c.fillRect(bx, 610, bw * mm, 54);
        bx += (bw + info.gapW[info.barcode.charAt(i + 1)]) * mm;
      }
    }
    var sx = info.barcode ? 630 : 216;
    text(TEXT.status, sx, 632, '400 22px ' + MONO, GRAY, 2.6);
    text(info.status, sx, 663, '600 24px ' + MONO, ACCENT, 2.6);

    return cv;
  }

  // 글꼴이 준비된 뒤에 그린다 (늦으면 기다리지 않고 그림)
  function fontsReady(sample) {
    if (!document.fonts || !document.fonts.load) return Promise.resolve();
    var specs = ['700 84px "IBM Plex Sans KR"', '400 21px "IBM Plex Sans KR"',
      '400 22px "IBM Plex Mono"', '500 26px "IBM Plex Mono"', '600 25px "IBM Plex Mono"', '700 46px "IBM Plex Mono"'];
    var all = Promise.all(specs.map(function (s) { return document.fonts.load(s, sample).catch(function () {}); }));
    return Promise.race([all, new Promise(function (r) { setTimeout(r, 2500); })]);
  }

  // ── 저장 방식: 내려받기가 되는 브라우저는 버튼, 아니면(아이폰 · 인앱) 길게 눌러 저장 ──
  var ua = navigator.userAgent || '';
  var isIOS = /iPhone|iPad|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  var canDownload = ('download' in document.createElement('a')) && !isIOS && !B.inApp;

  var fileName = 'BINARI_CERTIFICATE' + (card.no ? '_' + card.no : '') + '.png';
  var blobUrl = '';
  var seq = 0;

  function issue() {
    var my = ++seq;
    var info = {
      no: card.no, ko: card.ko, en: card.en, badge: card.badge,
      idLabel: card.idLabel, idValue: card.idValue, status: card.status,
      barcode: card.barcode, barW: card.barW, gapW: card.gapW,
      issued: stamp(api._now || new Date()),
      best: bestScore(),
      relics: relics()
    };
    root.setAttribute('data-state', 'drawing');
    saveBtn.hidden = true; hint.hidden = true;
    var sample = TEXT.head + TEXT.headKo + info.ko + info.en + info.idValue + info.issued + TEXT.ritualKo + TEXT.relicsKo + '접속 승인0123456789';
    return fontsReady(sample).then(function () {
      if (my !== seq) return;
      var cv = draw(info);
      img.src = cv.toDataURL('image/png');
      img.alt = TEXT.alt;
      root.setAttribute('data-state', 'ready');
      if (canDownload) {
        saveBtn.hidden = false;
        if (blobUrl) { try { URL.revokeObjectURL(blobUrl); } catch (e) {} blobUrl = ''; }
        if (cv.toBlob) cv.toBlob(function (b) { if (b && my === seq) blobUrl = URL.createObjectURL(b); }, 'image/png');
      } else {
        hint.textContent = isIOS ? TEXT.holdIOS : TEXT.hold;
        hint.hidden = false;
      }
    });
  }

  saveBtn.addEventListener('click', function () {
    var a = document.createElement('a');
    a.href = blobUrl || img.src;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    if (B.sound) B.sound.play('tap');
  });

  document.addEventListener('binari:screen', function (ev) { if (ev.detail === 'cert') issue(); });
  if (document.body.getAttribute('data-screen') === 'cert') issue();

  var api = B.cert = {
    issue: issue,
    // 캡처용: 기록을 채운 모습으로 다시 그림
    debug: function (best, got, now) {
      try {
        if (best != null) localStorage.setItem('binari.best.v1', JSON.stringify({ score: best, at: 1 }));
        if (got != null) {
          var r = {};
          RELIC_KEYS.slice(0, got).forEach(function (k) { r[k] = 1; });
          localStorage.setItem('binari.relics.v1', JSON.stringify(r));
        }
      } catch (e) {}
      if (now) api._now = new Date(now);
      return issue();
    }
  };
})();
