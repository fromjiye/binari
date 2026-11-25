/* BINARI · RITUAL — 디지털 굿판 (3단계)
   01 공명 RESONANCE → 02 살풀이 SALPURI → 03 정상화 NORMALIZATION → 결과 · 랭킹
   점수는 03에서만 난다. 01의 정확도는 03의 시작 싱크로율이 된다. */
(function () {
  'use strict';

  var B = window.BINARI;
  if (!B) return;
  var CFG = window.BINARI_CONFIG || {};

  function $(id) { return document.getElementById(id); }
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function sfx(name, arg) { if (B.sound) B.sound.play(name, arg); }
  function hum() { return B.sound ? B.sound.hum : { start: function () {}, set: function () {}, stop: function () {} }; }

  var root = $('ritual');
  if (!root) return;

  // ── 화면에 나오는 글 (문장만 바꾸려면 여기) ──
  var TEXT = {
    stages: [
      { no: '01', ko: '공명', en: 'RESONANCE' },
      { no: '02', ko: '살풀이', en: 'SALPURI' },
      { no: '03', ko: '정상화', en: 'NORMALIZATION' }
    ],
    hintRes: '바늘이 444Hz에 올 때 탭',
    hintSal: '점을 끌어서 선이 겹치지 않게',
    hintNorm: '악귀의 색에 맞는 디코더를 탭',
    locked: '주파수 포착',
    solved: '살 풀림',
    unclass: '분류 불가',
    rootName: '만다라 프로토콜',
    localNote: '지금은 이 폰에 저장된 기록만 보여요',
    byeori: 'BYEORI ★ 기록'
  };

  // ── 숫자 (난이도를 고치려면 여기) ──
  var RES = { center: 444, span: 12, perfect: 1.0, good: 4.0, half: [1.05, 0.8, 0.62], timeout: 20000, maxSync: 30 };
  var SAL = { nodes: 6, timeout: 20000 };
  var NORM = {
    time: 30000,
    spawn: [1150, 620],   // 악귀가 나오는 간격 (처음 → 끝, ms)
    life: [2700, 1900],   // 악귀가 머무는 시간 (처음 → 끝, ms)
    base: 100,            // 정답 한 번의 기본 점수
    sync: 7,              // 정답 한 번에 오르는 싱크로율 (%)
    rootBase: 1500, rootEach: 300, // ROOT ACCESS: 기본 + 정화한 악귀 하나당
    blackBonus: 800,      // 흑귀를 건드리지 않고 흘려보냈을 때
    blackAt: [[8500, 11000], [19000, 22500]], // 흑귀가 나오는 시간대
    blackLife: 2600
  };
  // 콤보 5마다 배율 +0.5, 최대 x3
  function multOf(combo) { return Math.min(3, 1 + Math.floor(combo / 5) * 0.5); }

  // 오방색 ↔ 디코더 (원고 06장 대응표)
  var KINDS = [
    { k: 'blue',   han: '靑', ko: '청', who: ['ara'],           names: '아라',        color: '#3F6BFF' },
    { k: 'red',    han: '赤', ko: '적', who: ['byeori'],        names: '벼리',        color: '#E0392E' },
    { k: 'yellow', han: '黃', ko: '황', who: ['mujin', 'doun'], names: '무진 · 도운', color: '#F0B90B' },
    { k: 'white',  han: '白', ko: '백', who: ['geon'],          names: '건',          color: '#F2F2EC' }
  ];
  var KIND = {};
  KINDS.forEach(function (k) { KIND[k.k] = k; });

  var api = B.ritual = {};
  var V = { card: $('rt-card'), res: $('rt-res'), sal: $('rt-sal'), norm: $('rt-norm'), result: $('rt-result') };
  var stepEl = $('rt-step');

  function view(name) {
    for (var k in V) if (Object.prototype.hasOwnProperty.call(V, k)) V[k].hidden = (k !== name);
    root.setAttribute('data-view', name);
  }

  // 진행 중인 판. token 이 바뀌면(나가기 · 다시 도전) 이전 판의 예약된 일은 모두 무시된다
  var token = 0, run = null, raf = 0;
  function alive(t) { return t === token; }
  function later(ms, t) {
    return new Promise(function (resolve) { setTimeout(function () { if (alive(t)) resolve(); }, ms); });
  }
  function stopLoop() { if (raf) cancelAnimationFrame(raf); raf = 0; }
  function loop(t, fn) {
    stopLoop();
    var last = performance.now();
    (function frame(now) {
      if (!alive(t)) return;
      var dt = Math.min(50, now - last); last = now;
      if (fn(now, dt) === false) { raf = 0; return; }
      raf = requestAnimationFrame(frame);
    })(last);
  }

  function fitCanvas(cv) {
    var r = cv.getBoundingClientRect();
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    var w = Math.max(1, Math.round(r.width)), h = Math.max(1, Math.round(r.height));
    if (cv.width !== w * dpr || cv.height !== h * dpr) { cv.width = w * dpr; cv.height = h * dpr; }
    var c = cv.getContext('2d');
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { c: c, w: w, h: h };
  }
  function accent() { return getComputedStyle(document.body).getPropertyValue('--accent').trim() || '#18d9ee'; }

  // ══════════════ 단계 표시 ══════════════
  function stageCard(i, t) {
    var s = TEXT.stages[i];
    $('rt-card-no').textContent = s.no;
    $('rt-card-ko').textContent = s.ko;
    $('rt-card-en').textContent = s.en;
    stepEl.textContent = s.no + ' / 03';
    view('card');
    V.card.classList.remove('go'); void V.card.offsetWidth; V.card.classList.add('go');
    sfx('stage');
    return later(1500, t);
  }

  // ══════════════ 01 공명 RESONANCE ══════════════
  var resState = null;
  function resonance(t) {
    view('res');
    var needle = $('res-needle'), judge = $('res-judge'), dots = $('res-dots').children;
    var cv = $('res-wave');
    var st = resState = { pos: -1, dir: 1, taps: [], close: 0, target: 0, done: false, started: performance.now(), phase: 0 };
    judge.textContent = ''; judge.className = 'res-judge';
    for (var i = 0; i < dots.length; i++) dots[i].className = '';
    $('res-hint').textContent = TEXT.hintRes;
    hum().start();

    return new Promise(function (resolve) {
      function finish() {
        if (st.done) return;
        st.done = true;
        st.target = 1;
        V.res.removeEventListener('pointerdown', onTap);
        var sum = st.taps.reduce(function (a, b) { return a + b.acc; }, 0);
        run.perfect = st.taps.filter(function (x) { return x.grade === 'PERFECT'; }).length;
        run.startSync = Math.round(RES.maxSync * sum / 3);
        hum().stop(true);
        later(650, t).then(function () {
          judge.textContent = TEXT.locked;
          judge.className = 'res-judge is-lock';
          sfx('lock');
          return later(1500, t);
        }).then(resolve);
      }
      function record(freq) {
        var d = Math.abs(freq - RES.center);
        var grade = d <= RES.perfect ? 'PERFECT' : d <= RES.good ? 'GOOD' : 'MISS';
        var acc = grade === 'PERFECT' ? 1 : grade === 'GOOD' ? 0.5 : 0;
        st.taps.push({ freq: freq, grade: grade, acc: acc });
        var n = st.taps.length;
        dots[n - 1].className = 'is-' + grade.toLowerCase();
        judge.textContent = grade === 'MISS' ? 'MISS' : freq.toFixed(1) + 'Hz ' + grade;
        judge.className = 'res-judge is-' + grade.toLowerCase();
        void judge.offsetWidth; judge.classList.add('pop');
        st.target = n / 3 * 0.86; // 탭할 때마다 한 겹씩 가까워지고, 마지막에 완전히 겹침
        sfx(grade.toLowerCase());
        if (n >= 3) finish();
      }
      function onTap(ev) {
        if (st.done || (ev.target.closest && ev.target.closest('[data-sound],[data-bgm]'))) return;
        ev.preventDefault();
        record(RES.center + st.pos * RES.span);
      }
      api._tapAt = function (freq) { if (!st.done) record(freq); }; // 캡처 · 점검용
      V.res.addEventListener('pointerdown', onTap);

      loop(t, function (now, dt) {
        if (!st.done) {
          var hits = st.taps.filter(function (x) { return x.acc > 0; }).length;
          var half = RES.half[Math.min(RES.half.length - 1, hits)] * 1000; // 맞출 때마다 빨라짐
          st.pos += st.dir * dt / half * 2;
          if (st.pos > 1) { st.pos = 2 - st.pos; st.dir = -1; }
          if (st.pos < -1) { st.pos = -2 - st.pos; st.dir = 1; }
          hum().set(RES.center + st.pos * RES.span);
          if (now - st.started > RES.timeout) { // 오래 멈춰 있으면 남은 탭은 MISS로 넘김
            while (st.taps.length < 3 && !st.done) record(RES.center + RES.span);
          }
        }
        needle.style.left = (50 + st.pos * 50) + '%';
        st.close += (st.target - st.close) * Math.min(1, dt / 220);
        st.phase += dt / 1000;
        drawWaves(cv, st.close, st.phase, st.done);
      });
    });
  }

  // 아라 파형(남색)과 악귀 파형(흰색). close 가 1이면 완전히 겹친다
  function drawWaves(cv, close, phase, locked) {
    var f = fitCanvas(cv), c = f.c, w = f.w, h = f.h, mid = h / 2, A = h * 0.26, off = 1 - close;
    c.clearRect(0, 0, w, h);
    c.lineJoin = 'round';
    function line(color, width, fn, glow) {
      c.beginPath();
      for (var x = 0; x <= w; x += 3) { var y = mid + fn(x); if (x === 0) c.moveTo(x, y); else c.lineTo(x, y); }
      c.strokeStyle = color; c.lineWidth = width;
      c.shadowColor = color; c.shadowBlur = glow || 0;
      c.stroke();
      c.shadowBlur = 0;
    }
    var k = Math.PI * 2 / (w / 2.4), om = phase * 4.4;
    line('rgba(232,238,240,' + (0.5 + 0.4 * close) + ')', 2, function (x) {
      return A * (1 + 0.5 * off) * Math.sin(k * (1 + 0.42 * off) * x + om * (1 + 0.5 * off) + 2.4 * off)
        + off * 9 * Math.sin(k * 6.3 * x + om * 3.1);
    }, locked ? 10 : 0);
    line('#7c88ff', 2.6, function (x) { return A * Math.sin(k * x + om); }, locked ? 14 : 4);
  }

  // ══════════════ 02 살풀이 SALPURI ══════════════
  var SVGNS = 'http://www.w3.org/2000/svg';
  function cross(a, b, c, d) { // 선분 ab 와 cd 가 엇갈리는지
    function o(p, q, r) { return (q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x); }
    var o1 = o(a, b, c), o2 = o(a, b, d), o3 = o(c, d, a), o4 = o(c, d, b);
    return ((o1 > 0 && o2 < 0) || (o1 < 0 && o2 > 0)) && ((o3 > 0 && o4 < 0) || (o3 < 0 && o4 > 0));
  }
  function countCross(pts, edges, mark) {
    var n = 0, i, j;
    if (mark) for (i = 0; i < edges.length; i++) mark[i] = false;
    for (i = 0; i < edges.length; i++) for (j = i + 1; j < edges.length; j++) {
      var e = edges[i], g = edges[j];
      if (e[0] === g[0] || e[0] === g[1] || e[1] === g[0] || e[1] === g[1]) continue;
      if (cross(pts[e[0]], pts[e[1]], pts[g[0]], pts[g[1]])) { n++; if (mark) { mark[i] = true; mark[j] = true; } }
    }
    return n;
  }
  // 풀 수 있는 모양만: 원 위에 차례로 놓으면 선이 하나도 겹치지 않는 그림을, 자리만 뒤섞어서 엉키게 한다
  function makeTangle() {
    var n = SAL.nodes, slots = [], edges = [], i;
    for (i = 0; i < n; i++) {
      var a = -Math.PI / 2 + i * Math.PI * 2 / n;
      slots.push({ x: 150 + Math.cos(a) * 104, y: 150 + Math.sin(a) * 104 });
      edges.push([i, (i + 1) % n]);
    }
    edges.push([0, Math.floor(n / 2)]);
    var pts, tries = 0;
    do {
      var order = slots.map(function (_, k) { return k; });
      for (i = order.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), tmp = order[i]; order[i] = order[j]; order[j] = tmp; }
      pts = order.map(function (s) { return { x: slots[s].x + (Math.random() * 16 - 8), y: slots[s].y + (Math.random() * 16 - 8) }; });
    } while (countCross(pts, edges) < 3 && ++tries < 300);
    return { pts: pts, edges: edges, slots: slots };
  }

  function salpuri(t, preset) {
    view('sal');
    var svg = $('sal-svg'), bar = $('sal-time'), label = $('sal-label');
    var g = preset || makeTangle();
    var pts = g.pts, edges = g.edges, mark = [], lines = [], dots = [], done = false, started = performance.now();
    svg.textContent = '';
    svg.setAttribute('class', 'sal-svg');
    label.textContent = '';
    $('sal-hint').textContent = TEXT.hintSal;

    // 선은 한 묶음으로 (가로로 누운 선 하나에는 빛 효과가 걸리지 않아서 묶음에 건다)
    var edgeGroup = document.createElementNS(SVGNS, 'g');
    edgeGroup.setAttribute('class', 'sal-edges');
    svg.appendChild(edgeGroup);
    edges.forEach(function () { var l = document.createElementNS(SVGNS, 'line'); l.setAttribute('class', 'sal-edge'); edgeGroup.appendChild(l); lines.push(l); });
    pts.forEach(function (p, i) {
      var grp = document.createElementNS(SVGNS, 'g');
      grp.setAttribute('class', 'sal-node');
      var hit = document.createElementNS(SVGNS, 'circle'); hit.setAttribute('r', 26); hit.setAttribute('class', 'sal-hit');
      var dot = document.createElementNS(SVGNS, 'rect'); dot.setAttribute('x', -9); dot.setAttribute('y', -9); dot.setAttribute('width', 18); dot.setAttribute('height', 18); dot.setAttribute('class', 'sal-dot');
      grp.appendChild(hit); grp.appendChild(dot);
      svg.appendChild(grp); dots.push(grp);
      grp.addEventListener('pointerdown', function (ev) {
        if (done) return;
        ev.preventDefault();
        try { grp.setPointerCapture(ev.pointerId); } catch (e) {}
        grp.setAttribute('class', 'sal-node is-drag');
        function move(e2) {
          var m = svg.getScreenCTM();
          if (!m) return;
          p.x = Math.max(16, Math.min(284, (e2.clientX - m.e) / m.a));
          p.y = Math.max(16, Math.min(284, (e2.clientY - m.f) / m.d));
          paint();
          if (countCross(pts, edges) === 0) { up(); solve(false); }
        }
        function up() {
          grp.setAttribute('class', 'sal-node');
          grp.removeEventListener('pointermove', move);
          grp.removeEventListener('pointerup', up);
          grp.removeEventListener('pointercancel', up);
        }
        grp.addEventListener('pointermove', move);
        grp.addEventListener('pointerup', up);
        grp.addEventListener('pointercancel', up);
      });
    });

    function paint() {
      countCross(pts, edges, mark);
      edges.forEach(function (e, i) {
        var l = lines[i];
        l.setAttribute('x1', pts[e[0]].x); l.setAttribute('y1', pts[e[0]].y);
        l.setAttribute('x2', pts[e[1]].x); l.setAttribute('y2', pts[e[1]].y);
        l.setAttribute('class', 'sal-edge' + (mark[i] ? ' is-x' : ''));
      });
      pts.forEach(function (p, i) { dots[i].setAttribute('transform', 'translate(' + p.x + ' ' + p.y + ')'); });
    }
    paint();

    var resolveFn;
    function tween(ms, fn) {
      if (api._freeze) { fn(1); return Promise.resolve(); } // 캡처용: 움직임 없이 끝 상태로
      return new Promise(function (res) {
        var s = performance.now();
        (function step(now) {
          if (!alive(t)) return;
          var k = Math.min(1, (now - s) / ms), e = 1 - Math.pow(1 - k, 3);
          fn(e);
          if (k < 1) requestAnimationFrame(step); else res();
        })(s);
      });
    }
    // 다 풀리면: 선들이 나란히 정렬되며 빛남
    function align() {
      svg.setAttribute('class', 'sal-svg is-done');
      label.textContent = TEXT.solved;
      sfx('solve');
      var from = edges.map(function (e) { return [pts[e[0]].x, pts[e[0]].y, pts[e[1]].x, pts[e[1]].y]; });
      var m = edges.length;
      return tween(850, function (e) {
        edges.forEach(function (_, i) {
          var y = 66 + i * (168 / (m - 1)), f = from[i], l = lines[i];
          l.setAttribute('x1', f[0] + (46 - f[0]) * e); l.setAttribute('y1', f[1] + (y - f[1]) * e);
          l.setAttribute('x2', f[2] + (254 - f[2]) * e); l.setAttribute('y2', f[3] + (y - f[3]) * e);
          l.setAttribute('class', 'sal-edge');
        });
      });
    }
    function solve(auto) {
      if (done) return;
      done = true;
      var pre = auto
        ? (function () { // 20초가 지나면 저절로 풀림
          var a = pts.map(function (p) { return { x: p.x, y: p.y }; });
          return tween(650, function (e) {
            pts.forEach(function (p, i) { p.x = a[i].x + (g.slots[i].x - a[i].x) * e; p.y = a[i].y + (g.slots[i].y - a[i].y) * e; });
            paint();
          });
        })()
        : Promise.resolve();
      pre.then(function () { return align(); }).then(function () { return later(900, t); }).then(resolveFn);
    }
    api._solve = function () { solve(true); };

    loop(t, function (now) {
      var left = Math.max(0, 1 - (now - started) / SAL.timeout);
      bar.style.transform = 'scaleX(' + left + ')';
      if (done) return false;
      if (left <= 0) { solve(true); return false; }
    });
    return new Promise(function (resolve) { resolveFn = resolve; });
  }

  // ══════════════ 03 정상화 NORMALIZATION ══════════════
  var nm = null;
  function buildKeys() {
    var wrap = $('nm-keys');
    if (wrap.childNodes.length) return;
    KINDS.forEach(function (k) {
      var b = el('button', 'nm-key');
      b.type = 'button';
      b.setAttribute('data-kind', k.k);
      b.setAttribute('aria-label', k.ko + ' · ' + k.names);
      b.style.setProperty('--k', k.color);
      b.appendChild(el('span', 'nm-ko', k.ko));   // 한글을 크게
      b.appendChild(el('span', 'nm-han', k.han)); // 한자는 그 아래 작게
      var faces = el('span', 'nm-faces');
      k.who.forEach(function (w) {
        var img = document.createElement('img');
        img.src = 'assets/decoder/' + w + '-face.webp'; img.alt = ''; img.width = 34; img.height = 34;
        faces.appendChild(img);
      });
      b.appendChild(faces);
      b.appendChild(el('span', 'nm-name', k.names));
      b.addEventListener('pointerdown', function (ev) { ev.preventDefault(); press(k.k); });
      wrap.appendChild(b);
    });
    $('nm-root').addEventListener('pointerdown', function (ev) { ev.preventDefault(); rootAccess(); });
    $('nm-root-name').textContent = TEXT.rootName;
  }

  function rnd(seed) { // 악귀마다 같은 모양이 유지되도록 하는 난수
    var s = seed % 2147483647; if (s <= 0) s += 2147483646;
    return function () { s = s * 16807 % 2147483647; return (s - 1) / 2147483646; };
  }
  function makeGhost(kind, now, life, field) {
    var r = rnd(Math.floor(Math.random() * 1e6) + 7), cells = [], N = 7;
    for (var y = 0; y < N; y++) for (var x = 0; x < N; x++) {
      var d = Math.hypot(x - 3, y - 3);
      if (d < 2.2 || (d < 3.6 && r() > 0.38)) cells.push([x, y, r()]);
    }
    var lanes = 4, used = {};
    nm.ghosts.forEach(function (g) { if (g.state === 'alive') used[g.lane] = true; });
    var free = []; for (var i = 0; i < lanes; i++) if (!used[i]) free.push(i);
    var lane = free.length ? free[Math.floor(Math.random() * free.length)] : Math.floor(Math.random() * lanes);
    return {
      kind: kind, born: now, life: life, cells: cells, lane: lane, state: 'alive', touched: false,
      x: field.w * (lane + 0.5) / lanes + (Math.random() * 14 - 7),
      y: field.h * (0.2 + Math.random() * 0.42), end: 0
    };
  }

  function pop(text, cls) {
    var p = $('nm-pop');
    p.textContent = text;
    p.className = 'nm-pop ' + (cls || '');
    void p.offsetWidth;
    p.classList.add('show');
  }
  function hud() {
    $('nm-score').textContent = String(nm.score);
    $('nm-combo-n').textContent = String(nm.combo);
    $('nm-mult').textContent = 'x' + multOf(nm.combo).toFixed(1);
    $('nm-sync').textContent = Math.round(nm.sync) + '%';
    $('nm-sync-fill').style.transform = 'scaleX(' + (nm.sync / 100) + ')';
    var ready = nm.sync >= 100;
    if ($('nm-root').hidden === ready) { $('nm-root').hidden = !ready; if (ready) sfx('rootReady'); }
    root.toggleAttribute('data-root-ready', ready);
  }

  function press(kind) {
    if (!nm || nm.over) return;
    var now = performance.now(), target = null, black = null;
    nm.ghosts.forEach(function (g) {
      if (g.state !== 'alive') return;
      if (g.kind === 'black') black = g;
      else if (g.kind === kind && (!target || g.born < target.born)) target = g;
    });
    var key = document.querySelector('.nm-key[data-kind="' + kind + '"]');
    if (key) { key.classList.remove('hit'); void key.offsetWidth; key.classList.add('hit'); }
    if (target) { // 정화
      target.state = 'pure'; target.end = now;
      nm.combo += 1; nm.maxCombo = Math.max(nm.maxCombo, nm.combo);
      var gain = Math.round(NORM.base * multOf(nm.combo));
      nm.score += gain;
      nm.sync = Math.min(100, nm.sync + NORM.sync);
      pop('+' + gain, 'is-good');
      sfx('hit', nm.combo);
    } else if (black) { // 흑귀: 맞는 버튼이 없다. 점수 변화 없음
      black.touched = true;
      pop(TEXT.unclass, 'is-dim');
      sfx('unclass');
    } else { // 틀림: 콤보만 끊김
      nm.combo = 0;
      pop('MISS', 'is-dim');
      sfx('wrong');
    }
    hud();
  }

  // ROOT ACCESS: 아라의 만다라 프로토콜로 화면의 악귀를 모두 정화
  function rootAccess() {
    if (!nm || nm.over || nm.sync < 100) return;
    var now = performance.now(), n = 0;
    nm.ghosts.forEach(function (g) { if (g.state === 'alive' && g.kind !== 'black') { g.state = 'pure'; g.end = now; n++; } });
    var gain = NORM.rootBase + NORM.rootEach * n;
    nm.score += gain; nm.roots += 1; nm.sync = 0;
    nm.hold = now + 1000; // 연출 동안은 새 악귀가 나오지 않음
    var fx = $('nm-root-fx');
    fx.hidden = false; fx.classList.remove('go'); void fx.offsetWidth; fx.classList.add('go');
    setTimeout(function () { if (!api._freeze) fx.hidden = true; }, 1500);
    pop('+' + gain, 'is-root');
    sfx('root');
    hud();
  }

  function drawGhost(c, g, now) {
    var age = now - g.born, S = 9, N = 7, half = S * N / 2;
    var rise = Math.min(1, age / 420), e = 1 - Math.pow(1 - rise, 3);
    var y = g.y + (1 - e) * (nm.field.h - g.y + 60), x = g.x, alpha = 1, scale = 1;
    if (g.state === 'alive') { var left = g.life - age; if (left < 420) alpha = Math.max(0, left / 420); }
    else if (g.state === 'pure') { var k = Math.min(1, (now - g.end) / 320); alpha = 1 - k; scale = 1 + k * 0.7; }
    else { alpha = Math.max(0, 1 - (now - g.end) / 300); }
    if (alpha <= 0) return;
    var black = g.kind === 'black', color = black ? '#0b0d0e' : KIND[g.kind].color, tick = Math.floor(now / 90);
    c.save();
    c.globalAlpha = alpha;
    c.translate(x, y); c.scale(scale, scale);
    for (var i = 0; i < g.cells.length; i++) {
      var cell = g.cells[i], cx = cell[0] * S - half, cy = cell[1] * S - half;
      // 깨진 픽셀: 몇 칸이 깜빡임
      if (((cell[2] * 997 + tick) | 0) % 11 === 0) continue;
      if (black) { // 흑귀만 글리치: 가로줄이 어긋남
        cx += ((((cell[1] * 7 + tick) % 5) === 0) ? ((tick % 2) ? 7 : -9) : 0);
        c.fillStyle = (cell[2] > 0.82) ? '#3a4347' : color;
        c.fillRect(cx, cy, S - 1, S - 1);
        c.strokeStyle = 'rgba(160,172,178,0.5)'; c.lineWidth = 1; c.strokeRect(cx + 0.5, cy + 0.5, S - 2, S - 2);
      } else {
        c.fillStyle = color;
        c.globalAlpha = alpha * (0.55 + cell[2] * 0.45);
        c.fillRect(cx, cy, S - 1, S - 1);
      }
    }
    c.globalAlpha = alpha;
    if (!black) { // 색만으로 구분하지 않게 한글 한 글자(청 · 적 · 황 · 백)를 같이
      c.fillStyle = 'rgba(8,11,12,0.9)';
      c.fillRect(-15, -15, 30, 30);
      c.fillStyle = color;
      c.font = '700 22px "IBM Plex Sans KR", sans-serif';
      c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText(KIND[g.kind].ko, 0, 1);
    }
    if (g.state === 'alive') { // 남은 시간
      var rem = Math.max(0, 1 - age / g.life);
      c.fillStyle = black ? 'rgba(160,172,178,0.7)' : color;
      c.fillRect(-half, half + 6, (S * N) * rem, 2);
    }
    c.restore();
  }

  function normalization(t) {
    view('norm');
    buildKeys();
    $('nm-hint').textContent = TEXT.hintNorm;
    $('nm-root-fx').hidden = true;
    $('nm-pop').className = 'nm-pop';
    var cv = $('nm-canvas');
    var blackTimes = NORM.blackAt.map(function (r) { return r[0] + Math.random() * (r[1] - r[0]); });
    nm = { score: 0, combo: 0, maxCombo: 0, roots: 0, sync: run.startSync, ghosts: [], next: 700, hold: 0, start: performance.now(), over: false, field: fitCanvas(cv), blackTimes: blackTimes };
    hud();

    return new Promise(function (resolve) {
      loop(t, function (now) {
        var f = nm.field = fitCanvas(cv), c = f.c, time = now - nm.start, p = Math.min(1, time / NORM.time);
        $('nm-time').style.transform = 'scaleX(' + (1 - p) + ')';

        if (time >= NORM.time) { // 끝
          nm.over = true;
          c.clearRect(0, 0, f.w, f.h);
          run.score = nm.score; run.maxCombo = nm.maxCombo; run.roots = nm.roots;
          later(700, t).then(resolve);
          return false;
        }

        // 흑귀: 가끔. 나올 때는 다른 악귀가 잠깐 나오지 않는다
        var blackSoon = false;
        for (var i = 0; i < nm.blackTimes.length; i++) {
          var bt = nm.blackTimes[i];
          if (bt !== null && time > bt - 700) blackSoon = true;
          if (bt !== null && time >= bt) {
            nm.ghosts.push(makeGhost('black', now, NORM.blackLife, f));
            nm.blackTimes[i] = null;
            nm.hold = now + NORM.blackLife * 0.75;
          }
        }
        if (time >= nm.next && now >= nm.hold && !blackSoon && time < NORM.time - 900) {
          var kinds = ['blue', 'red', 'yellow', 'white'];
          nm.ghosts.push(makeGhost(kinds[Math.floor(Math.random() * 4)], now, NORM.life[0] + (NORM.life[1] - NORM.life[0]) * p, f));
          nm.next = time + NORM.spawn[0] + (NORM.spawn[1] - NORM.spawn[0]) * p;
        }

        c.clearRect(0, 0, f.w, f.h);
        var keep = [];
        nm.ghosts.forEach(function (g) {
          if (g.state === 'alive' && now - g.born >= g.life) { // 사라짐
            g.state = 'gone'; g.end = now;
            if (g.kind === 'black') {
              if (!g.touched) { nm.score += NORM.blackBonus; pop('+' + NORM.blackBonus, 'is-good'); sfx('pass'); hud(); }
            } else { nm.combo = 0; hud(); }
          }
          drawGhost(c, g, now);
          if (g.state === 'alive' || now - g.end < 340) keep.push(g);
        });
        nm.ghosts = keep;
      });
    });
  }

  // ══════════════ 결과 · 랭킹 ══════════════
  // 저장 위치는 config.js 의 ranking 으로 고른다. 둘 다 list() 와 submit() 만 있으면 된다
  var Rank = (function () {
    var KEYR = 'binari.rank.v1', r = CFG.ranking || {};
    function sort(list) { return list.sort(function (a, b) { return b.score - a.score || a.at - b.at; }); }
    var local = {
      shared: false,
      list: function () {
        var v = [];
        try { v = JSON.parse(localStorage.getItem(KEYR)) || []; } catch (e) {}
        return Promise.resolve(sort(Array.isArray(v) ? v : []));
      },
      submit: function (entry) {
        return local.list().then(function (list) {
          list.push(entry);
          try { localStorage.setItem(KEYR, JSON.stringify(sort(list).slice(0, 200))); } catch (e) {}
        });
      }
    };
    if (r.provider === 'supabase' && r.supabaseUrl && r.supabaseKey) {
      var url = r.supabaseUrl.replace(/\/$/, '') + '/rest/v1/' + (r.table || 'ritual_scores');
      var head = { apikey: r.supabaseKey, Authorization: 'Bearer ' + r.supabaseKey, 'Content-Type': 'application/json' };
      return {
        shared: true,
        list: function () {
          return fetch(url + '?select=id,name,score,perfect,combo,root,at&order=score.desc,at.asc&limit=50', { headers: head })
            .then(function (res) { if (!res.ok) throw new Error('rank ' + res.status); return res.json(); });
        },
        submit: function (entry) {
          return fetch(url, { method: 'POST', headers: Object.assign({ Prefer: 'return=minimal' }, head), body: JSON.stringify(entry) })
            .then(function (res) { if (!res.ok) throw new Error('rank ' + res.status); });
        }
      };
    }
    return local;
  })();

  var BYEORI = Number(CFG.byeoriScore) || 0;

  function renderRank(list, mine) {
    var ol = $('rs-rank');
    ol.textContent = '';
    var top = el('li', 'rs-byeori'); // 순위 번호 없이 맨 위에 따로
    top.appendChild(el('span', 'rs-rank-name', TEXT.byeori));
    top.appendChild(el('b', null, String(BYEORI)));
    ol.appendChild(top);
    list.slice(0, 10).forEach(function (e, i) {
      var li = el('li', mine && e.id === mine ? 'is-me' : '');
      li.appendChild(el('span', 'rs-rank-no', ('0' + (i + 1)).slice(-2)));
      li.appendChild(el('span', 'rs-rank-name', e.name));
      li.appendChild(el('b', null, String(e.score)));
      ol.appendChild(li);
    });
    $('rs-note').textContent = Rank.shared ? '' : TEXT.localNote;
  }

  function result(t) {
    view('result');
    stepEl.textContent = '';
    var id = Date.now().toString(36).toUpperCase().slice(-5) + Math.floor(Math.random() * 36 * 36).toString(36).toUpperCase();
    run.id = id;
    $('rs-score').textContent = String(run.score);
    $('rs-perfect').textContent = run.perfect + ' / 3';
    $('rs-combo').textContent = String(run.maxCombo);
    $('rs-root').textContent = String(run.roots);
    $('rs-id').textContent = id;
    var form = $('rs-form'), input = $('rs-name'), done = $('rs-done');
    form.hidden = false; done.hidden = true; input.value = '';
    sfx('result');

    // 처음 한 판을 끝내면 유품 "보내지 못한 음성 메시지" 획득 (인벤토리는 다음 단계에서 연결)
    try {
      var relics = JSON.parse(localStorage.getItem('binari.relics.v1')) || {};
      if (!relics.voice) { relics.voice = Date.now(); localStorage.setItem('binari.relics.v1', JSON.stringify(relics)); }
    } catch (e) {}

    // 메신저로 돌아가면 디코더가 반응 (벼리 기록을 넘겼는지 같이 알림)
    B.emit('ritual_done', { beat: run.score > BYEORI });

    Rank.list().then(function (list) { if (alive(t)) renderRank(list, null); }).catch(function () { renderRank([], null); });

    form.onsubmit = function (ev) {
      ev.preventDefault();
      var name = input.value.replace(/\s+/g, ' ').trim().slice(0, 10);
      if (!name) { input.focus(); return; }
      var entry = { id: id, name: name, score: run.score, perfect: run.perfect, combo: run.maxCombo, root: run.roots, at: Date.now() };
      form.hidden = true; done.hidden = false;
      sfx('tap');
      Rank.submit(entry)
        .then(function () { return Rank.list(); })
        .then(function (list) { if (alive(t)) renderRank(list, id); })
        .catch(function () { if (alive(t)) { form.hidden = false; done.hidden = true; } });
    };
  }

  // ══════════════ 한 판 ══════════════
  function start() {
    token += 1;
    var t = token;
    stopLoop();
    hum().stop();
    run = { perfect: 0, startSync: 0, score: 0, maxCombo: 0, roots: 0 };
    stageCard(0, t)
      .then(function () { return resonance(t); })
      .then(function () { return stageCard(1, t); })
      .then(function () { return salpuri(t); })
      .then(function () { return stageCard(2, t); })
      .then(function () { return normalization(t); })
      .then(function () { result(t); });
  }
  function stop() {
    token += 1;
    stopLoop();
    hum().stop();
    nm = null;
  }

  $('rs-retry').addEventListener('click', function () { sfx('tap'); start(); });

  function onScreen(name) { if (name === 'ritual') start(); else stop(); }
  document.addEventListener('binari:screen', function (ev) { onScreen(ev.detail); });
  if (document.body.getAttribute('data-screen') === 'ritual') start();

  // ── 캡처 · 점검용: 한 장면을 골라 멈춰 세움 ──
  api.debug = function (name) {
    token += 1;
    var t = token;
    stopLoop(); hum().stop();
    api._freeze = true;
    run = { perfect: 2, startSync: 25, score: 0, maxCombo: 0, roots: 0 };
    if (name === 'card') { stageCard(0, t); return; }
    if (name === 'res') {
      stepEl.textContent = '01 / 03';
      resonance(t);
      api._tapAt(446.8); api._tapAt(444.0);
      resState.pos = 0; resState.dir = 0; resState.started = performance.now() + 1e7;
      return;
    }
    if (name === 'sal-before' || name === 'sal-after') {
      stepEl.textContent = '02 / 03';
      SAL.timeout = 1e9;
      salpuri(t, makeTangle());
      if (name === 'sal-after') setTimeout(function () { api._solve(); }, 50);
      return;
    }
    if (name === 'norm' || name === 'root' || name === 'black') {
      stepEl.textContent = '03 / 03';
      view('norm'); buildKeys();
      $('nm-hint').textContent = TEXT.hintNorm;
      var cv = $('nm-canvas'), f = fitCanvas(cv), now = performance.now();
      nm = { score: 4350, combo: 7, maxCombo: 7, roots: 0, sync: name === 'norm' ? 72 : 100, ghosts: [], next: 1e9, hold: 0, start: now, over: false, field: f, blackTimes: [] };
      var set = name === 'black' ? [['black', 1]] : [['blue', 0], ['yellow', 2], ['red', 3]];
      set.forEach(function (s, i) {
        var g = makeGhost(s[0], now - 900, 1e9, f);
        g.lane = s[1]; g.x = f.w * (s[1] + 0.5) / 4; g.y = f.h * (0.26 + i * 0.16);
        nm.ghosts.push(g);
      });
      if (name === 'black') { nm.combo = 4; nm.sync = 58; nm.score = 2600; }
      hud();
      $('nm-time').style.transform = 'scaleX(' + (name === 'black' ? 0.62 : 0.44) + ')';
      loop(t, function (n2) {
        var ff = nm.field = fitCanvas(cv);
        ff.c.clearRect(0, 0, ff.w, ff.h);
        nm.ghosts.forEach(function (g) { drawGhost(ff.c, g, n2); });
      });
      if (name === 'norm') pop('+150', 'is-good');
      if (name === 'root') setTimeout(function () { rootAccess(); }, 60);
      return;
    }
    if (name === 'result') {
      run = { perfect: 2, startSync: 25, score: 16480, maxCombo: 14, roots: 2 };
      result(t); // 예시 기록은 넣지 않는다. 등록된 기록이 없으면 BYEORI ★ 기록 줄만 보임
    }
  };
})();
