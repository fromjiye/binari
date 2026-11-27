/* BINARI · DECODER — 디코더 메신저 (2단계)
   대사는 data/decoder.json 에 있고, 이 파일은 그것을 메신저처럼 보여 주기만 한다.
   줄 종류: enter(반신 누끼 + 이름표 등장) · msg(말풍선) · choice(선택지) ·
            hack_start / hack_end(벼리 해킹 낙서 시작 · 끝) · highlight_mission(임무 바로 가기 강조) */
(function () {
  'use strict';

  var B = window.BINARI;
  if (!B) return;

  var DATA_URL = 'data/decoder.json?v=5';
  var KEY = B.keys.decoder;
  var ASSET = 'assets/decoder/';

  // 캡처 · 점검용: hold 를 켜면 등장 · 해킹 연출이 저절로 넘어가지 않고 탭할 때까지 머문다
  var api = B.decoder = { hold: false };

  function sfx(name) { if (B.sound) B.sound.play(name); }
  function $(id) { return document.getElementById(id); }
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  var root = $('decoder');
  var logEl = $('chat-log');
  var choicesEl = $('choices');
  var introEl = $('intro');
  var hackEl = $('hack');
  var titleEn = $('chat-en');
  if (!root || !logEl) return;
  var TITLE = titleEn ? titleEn.textContent : 'DECODER';

  var reduced = false;
  try { reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}

  // ── 진행 저장 (그 폰의 브라우저에만) ──
  // pos: 다음에 볼 줄 / queue: 아직 안 보여 준 말풍선 / log: 이미 보여 준 것
  // hack: 지금 해킹 중인지(도장 글자) / hacked: 벼리가 다녀갔는지 / mission: 버튼 강조
  function fresh() { return { v: 2, pos: 0, queue: [], log: [], hack: null, hacked: false, mission: false, done: false, reacted: {} }; }
  function load() {
    try {
      var s = JSON.parse(localStorage.getItem(KEY));
      if (s && s.v === 2 && Array.isArray(s.log) && Array.isArray(s.queue)) return s;
    } catch (e) {}
    return fresh();
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} }

  var data = null;
  var script = [];
  var state = load();
  var rendered = false; // 저장된 대화를 화면에 그렸는지
  var running = false;
  var lastWho = null;   // 같은 디코더가 이어 말하면 프로필을 한 번만

  function speaker(id) {
    var sp = (data && data.speakers && data.speakers[id]) || {};
    return {
      name: sp.name || id, en: sp.en || '', tag: sp.tag || '', color: sp.color || '#8b979b',
      face: sp.face || (ASSET + id + '-face.webp'),
      bust: sp.bust || (ASSET + id + '-bust.webp')
    };
  }
  // {admin}: id가 있으면 "○○○ 관리자님"(설계자 00은 "○○○ 설계자님"), 없으면 "관리자님"
  var ADMIN = B.id ? B.name + (B.arch ? ' 설계자님' : ' 관리자님') : '관리자님';
  function fill(text) { return String(text).replace(/\{admin\}/g, ADMIN); }

  // 이름표 글자색: 디코더 색 위에서 잘 보이는 쪽(흰색 / 검정)
  function inkOn(hex) {
    var m = /^#?([0-9a-f]{6})$/i.exec(hex || '');
    if (!m) return '#0d0d0d';
    var n = parseInt(m[1], 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    return (0.299 * r + 0.587 * g + 0.114 * b) > 150 ? '#0d0d0d' : '#ffffff';
  }

  function scrollDown() { logEl.scrollTop = logEl.scrollHeight; }

  // ── 말풍선 ──
  function addSay(who, text, instant) {
    var sp = speaker(who);
    var row = el('div', 'msg');
    row.style.setProperty('--who', sp.color);
    if (who === lastWho) row.className += ' cont';
    else {
      var face = el('span', 'face');
      var img = document.createElement('img');
      img.src = sp.face; img.alt = ''; img.width = 40; img.height = 40;
      face.appendChild(img);
      row.appendChild(face);
      var tag = el('p', 'who');
      var chip = el('b', null, sp.name);
      chip.style.color = inkOn(sp.color);
      tag.appendChild(chip);
      if (sp.en) tag.appendChild(el('span', null, sp.en));
      row.appendChild(tag);
    }
    row.appendChild(el('p', 'bubble', fill(text)));
    if (instant) row.className += ' instant';
    else sfx('msg');
    logEl.appendChild(row);
    lastWho = who;
    scrollDown();
  }
  function addMe(text, instant) {
    var row = el('div', 'msg me' + (instant ? ' instant' : ''));
    row.appendChild(el('p', 'bubble', fill(text)));
    logEl.appendChild(row);
    lastWho = null;
    scrollDown();
  }

  var typingEl = null;
  function showTyping(who) {
    hideTyping();
    typingEl = el('div', 'msg typing' + (who === lastWho ? ' cont' : ''));
    typingEl.style.setProperty('--who', speaker(who).color);
    var b = el('p', 'bubble');
    b.setAttribute('aria-hidden', 'true');
    b.appendChild(el('i')); b.appendChild(el('i')); b.appendChild(el('i'));
    typingEl.appendChild(b);
    logEl.appendChild(typingEl);
    scrollDown();
  }
  function hideTyping() {
    if (typingEl && typingEl.parentNode) typingEl.parentNode.removeChild(typingEl);
    typingEl = null;
  }

  function wait(ms) { return new Promise(function (r) { setTimeout(r, reduced ? Math.min(ms, 120) : ms); }); }

  // ── 화면 상태 (해킹 중 · 벼리가 다녀감 · 임무 버튼 강조) ──
  function setFlag(name, on) { if (on) root.setAttribute(name, ''); else root.removeAttribute(name); }
  function applyHack(stamp) {
    setFlag('data-hack', !!stamp);
    if (titleEn) titleEn.textContent = stamp || TITLE;
  }

  // ── 아래 버튼: 체험 순서의 다음 단계로 가고, 글자도 같이 바뀐다 ──
  // 굿판 전 "임무 바로 가기" → "다음 임무 · 공명 접속" → "다음 임무 · 기록 보관소" → "접속 기록 남기기" → 폰 "인증서 발급" / 부스 "처음 화면으로"
  var missionBtn = root.querySelector('.mission');
  var missionDirty = false; // 반응 대사가 나오는 중: 다 나온 뒤에 버튼 강조를 켠다
  function syncMission(highlight) {
    if (!missionBtn || !B.flow) return;
    var next = B.flow.next();
    missionBtn.textContent = next.label + ' ';
    var arrow = el('span', null, '▸');
    arrow.setAttribute('aria-hidden', 'true');
    missionBtn.appendChild(arrow);
    if (next.go) { missionBtn.setAttribute('data-go', next.go); missionBtn.removeAttribute('data-act'); }
    else { missionBtn.removeAttribute('data-go'); missionBtn.setAttribute('data-act', next.key); }
    if (highlight) { state.mission = true; save(); }
    setFlag('data-mission', state.mission);
  }
  if (missionBtn) missionBtn.addEventListener('click', function () {
    if (missionBtn.getAttribute('data-act') !== 'restart') return; // 그 밖에는 data-go 로 이동
    sfx('tap');
    try { window.parent.postMessage({ type: 'binari-restart' }, location.origin); } catch (e) {}
  });
  syncMission(false);

  // ── 저장된 대화를 한 번에 그리기 (다시 들어왔을 때) ──
  function renderLog() {
    logEl.textContent = '';
    lastWho = null;
    state.log.forEach(function (m) {
      if (m.me) addMe(m.text, true); else addSay(m.who, m.text, true);
    });
    setFlag('data-hacked', state.hacked);
    setFlag('data-mission', state.mission);
    if (state.hack) {
      // 해킹 도중에 다시 들어온 경우: 낙서를 깔아 둔 상태로 이어 감
      setupHack(state.hack.who, state.hack.stamp);
      hackEl.hidden = false;
      hackEl.setAttribute('data-phase', 'stay');
      applyHack(state.hack.stamp);
    }
    rendered = true;
  }

  // ── 선택지 ──
  function showChoices(node) {
    choicesEl.textContent = '';
    (node.options || []).forEach(function (opt, i) {
      var b = el('button', 'choice');
      b.type = 'button';
      b.appendChild(el('span', 'choice-no', ('0' + (i + 1)).slice(-2)));
      b.appendChild(el('span', 'choice-text', fill(opt.label)));
      b.addEventListener('click', function () { pick(opt); });
      choicesEl.appendChild(b);
    });
    scrollDown();
  }
  function pick(opt) {
    sfx('choice');
    choicesEl.textContent = '';
    addMe(opt.label);
    state.log.push({ me: true, text: opt.label });
    (opt.reply || []).forEach(function (r) {
      if (r && r.text) state.queue.push({ who: r.who || 'ara', text: r.text });
    });
    state.pos += 1;
    save();
    run();
  }

  // ── 진행 ──
  function run() {
    if (running || !data) return;
    running = true;
    step();
  }
  function step() {
    // 0) 반응 대사가 다 나왔으면: 아래 버튼을 강조
    if (!state.queue.length && missionDirty) { missionDirty = false; syncMission(true); }
    // 1) 밀린 말풍선부터
    if (state.queue.length) {
      var m = state.queue[0];
      showTyping(m.who);
      wait(Math.min(1700, 560 + fill(m.text).length * 30)).then(function () {
        hideTyping();
        state.queue.shift();
        state.log.push({ who: m.who, text: m.text });
        save();
        addSay(m.who, m.text);
        return wait(280);
      }).then(step);
      return;
    }
    // 2) 다음 줄
    var node = script[state.pos];
    if (!node) {
      state.done = true; save();
      running = false;
      return;
    }
    switch (node.type) {
      case 'msg':
        state.queue.push({ who: node.who || 'ara', text: node.text });
        state.pos += 1; save();
        step();
        return;
      case 'choice':
        running = false;
        showChoices(node);
        return;
      case 'enter':
        playEnter(node.who || 'ara').then(function () { state.pos += 1; save(); step(); });
        return;
      case 'hack_start':
        playHack(node.who || 'byeori', node.stamp || '').then(function () {
          state.hack = { who: node.who || 'byeori', stamp: node.stamp || '' };
          state.hacked = true;
          state.pos += 1; save();
          setFlag('data-hacked', true);
          applyHack(state.hack.stamp);
          step();
        });
        return;
      case 'hack_end':
        endHack().then(function () {
          state.hack = null;
          state.pos += 1; save();
          step();
        });
        return;
      case 'highlight_mission':
        state.mission = true;
        state.pos += 1; save();
        setFlag('data-mission', true);
        step();
        return;
      default: // 모르는 줄은 건너뜀
        state.pos += 1; save();
        step();
    }
  }

  // ── 연출 공통: 화면을 띄우고, 시간이 지나거나 탭하면 다음으로 ──
  function present(node, holdMs) {
    return new Promise(function (resolve) {
      var done = false, timer = null;
      function next() {
        if (done) return;
        done = true;
        if (timer) clearTimeout(timer);
        node.removeEventListener('click', next);
        resolve();
      }
      node.hidden = false;
      node.setAttribute('data-phase', 'in');
      node.addEventListener('click', next);
      if (!api.hold) timer = setTimeout(next, reduced ? 1200 : holdMs);
      api.next = next;
    });
  }
  function dismiss(node, outMs) {
    return new Promise(function (resolve) {
      node.setAttribute('data-phase', 'out');
      setTimeout(function () {
        node.hidden = true;
        node.removeAttribute('data-phase');
        resolve();
      }, reduced ? 0 : outMs);
    });
  }

  // 이름표: "아라 // ARA · RESTORATION"
  function plateInto(node, sp) {
    node.textContent = '';
    node.appendChild(el('b', null, sp.name));
    var rest = [sp.en, sp.tag].filter(Boolean).join(' · ');
    if (rest) node.appendChild(el('span', null, '// ' + rest));
    node.style.setProperty('--who', sp.color);
  }

  // enter: 반신 누끼와 이름표가 크게 들어왔다가 대화창으로
  function playEnter(who) {
    var sp = speaker(who);
    $('intro-bust').src = sp.bust;
    plateInto($('intro-plate'), sp);
    introEl.style.setProperty('--who', sp.color);
    return present(introEl, 2200).then(function () { return dismiss(introEl, 380); });
  }

  // hack_start: 오렌지 붓이 화면을 가로지르고, 흰 분필 낙서와 함께 벼리가 옆에서 튀어나옴.
  // 그 뒤로는 낙서가 대화창 뒤에 깔린 채(stay) hack_end 까지 이어진다.
  function setupHack(who, stamp) {
    var sp = speaker(who);
    $('hack-bust').src = sp.bust;
    plateInto($('hack-plate'), sp);
    $('hack-stamp').textContent = stamp || '';
    hackEl.style.setProperty('--who', sp.color);
  }
  function playHack(who, stamp) {
    setupHack(who, stamp);
    sfx('hack');
    hideTyping();
    choicesEl.textContent = '';
    return present(hackEl, 3000).then(function () { hackEl.setAttribute('data-phase', 'stay'); });
  }
  function endHack() {
    applyHack(null);
    if (hackEl.hidden) return Promise.resolve();
    return dismiss(hackEl, 420);
  }

  // ── 다른 모듈을 마치고 돌아왔을 때: ritual_done → after_ritual, sync_done → after_sync … ──
  // 같은 반응은 한 번만. 굿판에서 벼리 기록을 넘긴 사람은 벼리 줄만 after_ritual_beat 의 것으로 바뀐다
  // (이미 반응을 본 뒤에 처음으로 기록을 넘기면, 벼리의 그 한 줄만 따로 나온다)
  function queueReactions() {
    var list = B.readEvents(), changed = false, queued = false;
    if (!state.reacted) state.reacted = {};
    list.forEach(function (ev) {
      if (ev.seen) return;
      ev.seen = true; changed = true;
      var base = 'after_' + String(ev.e).replace(/_done$/, '');
      var lines = Array.isArray(data[base]) ? data[base] : null;
      var beat = ev.beat && Array.isArray(data[base + '_beat']) ? data[base + '_beat'] : null;
      var out = [];
      if (lines && !state.reacted[base]) {
        lines.forEach(function (n) {
          if (!n || n.type !== 'msg' || !n.text) return;
          var swap = null;
          if (beat) beat.forEach(function (b2) { if (b2 && b2.who === n.who) swap = b2; });
          out.push(swap || n);
        });
        state.reacted[base] = true;
        if (beat) state.reacted[base + '_beat'] = true;
      } else if (beat && !state.reacted[base + '_beat']) {
        out = beat.filter(function (n) { return n && n.type === 'msg' && n.text; });
        state.reacted[base + '_beat'] = true;
      }
      out.forEach(function (n) { state.queue.push({ who: n.who || 'ara', text: n.text }); queued = true; });
    });
    if (changed) { B.writeEvents(list); save(); }
    return queued;
  }

  // ── 메신저가 열릴 때 ──
  function open() {
    if (!data) return;
    if (!rendered) renderLog();
    // 아래 버튼은 바로 다음 단계로 바꾸고, 반응 대사가 있으면 그게 다 나온 뒤에 강조를 켠다 (그동안은 끔)
    var queued = queueReactions();
    syncMission(false);
    if (queued) { missionDirty = true; setFlag('data-mission', false); }
    else if (missionDirty) setFlag('data-mission', false);
    try { new Image().src = speaker('byeori').bust; } catch (e) {}

    // 선택지에서 기다리던 중이었으면 다시 보여 줌
    var node = script[state.pos];
    if (!running && !state.queue.length && node && node.type === 'choice') {
      if (!choicesEl.childNodes.length) showChoices(node);
      return;
    }
    run();
    scrollDown();
  }

  document.addEventListener('binari:screen', function (ev) { if (ev.detail === 'decoder') open(); });

  fetch(DATA_URL)
    .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
    .then(function (json) {
      data = json;
      script = Array.isArray(data.intro) ? data.intro : [];
      if (state.pos > script.length) state.pos = script.length;
      if (document.body.getAttribute('data-screen') === 'decoder') open();
    })
    .catch(function () {
      // 대사 파일을 못 읽어도 화면은 멈추지 않음: 임무 바로 가기와 홈은 그대로 쓸 수 있다
      root.setAttribute('data-error', '');
    });
})();
