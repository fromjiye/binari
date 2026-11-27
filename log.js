/* BINARI · LOG — 관리자 접속 기록 (방명록)
   한 줄 메시지 + 닉네임을 마고 OS 로그 형식으로 보여 준다: [2026.11.28 14:02] [ADMIN·07] ○○ : 메시지
   저장은 Supabase 표 하나(config.js 의 guestbook). 숨긴 글(hidden)은 서버가 내려 주지 않는다. */
(function () {
  'use strict';
  var B = window.BINARI;
  if (!B) return;

  var CFG = (window.BINARI_CONFIG && window.BINARI_CONFIG.guestbook) || {};
  var BASE = String(CFG.supabaseUrl || '').replace(/\/+$/, '');
  var KEY = String(CFG.supabaseKey || '');
  var READY = !!(BASE && KEY);

  function $(id) { return document.getElementById(id); }

  // 서버 주소가 아직 없으면 홈의 LOG 는 STANDBY 그대로. 주소로 직접 들어와도 홈으로 돌려보낸다
  if (!READY) {
    document.addEventListener('binari:screen', function (ev) { if (ev.detail === 'log') B.go('home', true); });
    if (document.body.getAttribute('data-screen') === 'log') B.go('home', true);
    return;
  }

  var MAX_NAME = Number(CFG.maxName) || 10;
  var MAX_MSG = Number(CFG.maxMessage) || 60;
  var COOL = (Number(CFG.cooldownSeconds) || 30) * 1000;
  var POLL = 30000;  // 화면이 열려 있는 동안 새 글을 다시 불러오는 간격
  var LIMIT = 200;   // 한 번에 보여 주는 글 수 (최신순)
  var STORE = 'binari.log.v1'; // { name: 마지막에 쓴 닉네임, last: 마지막으로 쓴 시각 }

  var TEXT = {
    loading: '기록을 불러오는 중…',
    empty: '아직 남겨진 기록이 없습니다.',
    loadFail: '기록을 불러오지 못했습니다. 연결을 확인해 주세요.',
    needName: '닉네임을 입력해 주세요.',
    needMsg: '메시지를 입력해 주세요.',
    sending: '기록하는 중…',
    sent: '기록되었습니다.',
    sendFail: '기록하지 못했습니다. 잠시 후 다시 시도해 주세요.',
    wait: function (s) { return s + '초 뒤에 다시 쓸 수 있습니다.'; },
    total: function (n) { return '기록 ' + n; }
  };

  var URL_TABLE = BASE + '/rest/v1/' + encodeURIComponent(CFG.table || 'guestbook');
  var HEAD = { apikey: KEY, Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/json' };

  var form = $('lg-form'), nameIn = $('lg-name'), msgIn = $('lg-msg'), btn = $('lg-send');
  var stateEl = $('lg-state'), countEl = $('lg-count'), listEl = $('lg-list'), noteEl = $('lg-note'), totalEl = $('lg-total');
  if (!form || !listEl) return;

  // 홈: LOG 를 열린 모듈로
  var li = $('m-log');
  if (li) {
    li.className += ' is-open';
    var link = li.querySelector('.m-link'), st = li.querySelector('.m-st');
    if (link) link.hidden = false;
    if (st) st.textContent = 'OPEN';
  }

  // 쓰기 칸 앞: 이 사람이 쓰면 붙을 태그
  var mine = $('lg-mine');
  if (mine) { var mt = tagOf(B.booth ? null : B.id, B.booth); mine.setAttribute('data-kind', mt.kind); mine.textContent = mt.text; }

  nameIn.maxLength = MAX_NAME;
  msgIn.maxLength = MAX_MSG;

  function store() {
    try { var v = JSON.parse(localStorage.getItem(STORE)); return v && typeof v === 'object' ? v : {}; }
    catch (e) { return {}; }
  }
  function remember(patch) {
    var v = store();
    for (var k in patch) if (Object.prototype.hasOwnProperty.call(patch, k)) v[k] = patch[k];
    try { localStorage.setItem(STORE, JSON.stringify(v)); } catch (e) {}
  }

  // 글 다듬기: 줄바꿈·제어 문자를 빈칸으로, 빈칸은 하나로, 앞뒤 빈칸 제거, 글자 수 제한
  function clean(s, max) {
    s = String(s == null ? '' : s).replace(/[\u0000-\u001f\u007f\u2028\u2029]/g, ' ').replace(/\s+/g, ' ').trim();
    return Array.from ? Array.from(s).slice(0, max).join('') : s.slice(0, max);
  }
  function len(s) { return Array.from ? Array.from(s).length : s.length; }
  function two(n) { return (n < 10 ? '0' : '') + n; }
  function stamp(iso) {
    var d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    return '[' + d.getFullYear() + '.' + two(d.getMonth() + 1) + '.' + two(d.getDate()) + ' ' + two(d.getHours()) + ':' + two(d.getMinutes()) + ']';
  }

  // ── 출처 태그: 닉네임 앞에 붙는 작은 표시 ──
  //  관리자 번호로 들어온 글 → ADMIN·07 (설계자 00 은 ARCH·00) / 부스 아이패드 → BOOTH / 그 밖 → GUEST
  //  번호와 부스가 둘 다 있으면 번호가 먼저
  function tagOf(adminId, booth) {
    var id = /^\d{2}$/.test(String(adminId == null ? '' : adminId)) ? String(adminId) : '';
    if (id === '00') return { kind: 'arch', text: 'ARCH\u00b700' };
    if (id) return { kind: 'admin', text: 'ADMIN\u00b7' + id };
    if (booth) return { kind: 'booth', text: 'BOOTH' };
    return { kind: 'guest', text: 'GUEST' };
  }
  function tagEl(t) {
    var s = document.createElement('span');
    s.className = 'lg-tag';
    s.setAttribute('data-kind', t.kind);
    s.textContent = t.text;
    return s;
  }

  // ── 목록 ──
  var rows = [], loaded = false, fresh = {};
  function span(cls, text) { var s = document.createElement('span'); s.className = cls; s.textContent = text; return s; }
  function draw() {
    listEl.textContent = '';
    rows.forEach(function (r) {
      var item = document.createElement('li');
      if (fresh[r.id]) item.className = 'is-new';
      item.appendChild(span('lg-t', stamp(r.created_at)));
      item.appendChild(document.createTextNode(' '));
      // 태그와 닉네임은 줄이 바뀌어도 떨어지지 않게 한 덩어리로
      var by = document.createElement('span');
      by.className = 'lg-by';
      by.appendChild(tagEl(tagOf(r.admin_id, r.booth)));
      by.appendChild(span('lg-who', r.name));
      item.appendChild(by);
      item.appendChild(document.createTextNode(' : '));
      item.appendChild(span('lg-m', r.message));
      listEl.appendChild(item);
    });
    totalEl.textContent = loaded ? TEXT.total(rows.length) : '';
    if (rows.length) noteEl.hidden = true;
  }
  function note(text) { noteEl.textContent = text; noteEl.hidden = !text; }

  var loading = false;
  function load() {
    if (loading) return;
    loading = true;
    if (!loaded) note(TEXT.loading);
    fetch(URL_TABLE + '?select=id,created_at,name,message,admin_id,booth&order=created_at.desc,id.desc&limit=' + LIMIT, { headers: HEAD, cache: 'no-store' })
      .then(function (res) { if (!res.ok) throw new Error('log ' + res.status); return res.json(); })
      .then(function (list) {
        loaded = true;
        rows = (Array.isArray(list) ? list : []).filter(function (r) { return r && r.name && r.message; });
        draw();
        note(rows.length ? '' : TEXT.empty);
      })
      .catch(function () { if (!rows.length) note(TEXT.loadFail); })
      .then(function () { loading = false; });
  }

  // ── 쓰기 ──
  var sending = false, coolTimer = 0, stateTimer = 0;
  function say(text, kind) {
    clearTimeout(stateTimer);
    stateEl.textContent = text || '';
    stateEl.setAttribute('data-kind', kind || '');
  }
  function left() { return Math.max(0, (Number(store().last) || 0) + COOL - Date.now()); }
  function count() { countEl.textContent = len(msgIn.value) + ' / ' + MAX_MSG; }
  function tick() {
    clearTimeout(coolTimer);
    var ms = left();
    btn.disabled = sending || ms > 0;
    if (ms > 0) {
      say(TEXT.wait(Math.ceil(ms / 1000)), 'wait');
      coolTimer = setTimeout(tick, 500);
    } else if (stateEl.getAttribute('data-kind') === 'wait') say('');
  }

  function send() {
    if (sending) return;
    var name = clean(nameIn.value, MAX_NAME), msg = clean(msgIn.value, MAX_MSG);
    if (!name) { say(TEXT.needName, 'need'); nameIn.focus(); return; }
    if (!msg) { say(TEXT.needMsg, 'need'); msgIn.focus(); return; }
    if (left() > 0) { tick(); return; }
    sending = true;
    btn.disabled = true;
    say(TEXT.sending, 'busy');
    var body = { name: name, message: msg, admin_id: B.booth ? null : (B.id || null), booth: !!B.booth };
    fetch(URL_TABLE + '?columns=name,message,admin_id,booth&select=id,created_at,name,message,admin_id,booth', {
      method: 'POST',
      headers: Object.assign({ Prefer: 'return=representation' }, HEAD),
      body: JSON.stringify(body)
    })
      .then(function (res) { if (!res.ok) throw new Error('log ' + res.status); return res.json(); })
      .then(function (out) {
        var row = Array.isArray(out) ? out[0] : out;
        if (!row || !row.created_at) row = { id: 'me' + Date.now(), created_at: new Date().toISOString(), name: name, message: msg, admin_id: body.admin_id, booth: body.booth };
        sending = false;
        remember({ name: name, last: Date.now() });
        B.emit('log_done'); // 메신저로 돌아가면 디코더가 반응
        // 쓰자마자 맨 위에 보이게
        loaded = true;
        fresh[row.id] = true;
        rows = [row].concat(rows.filter(function (r) { return r.id !== row.id; }));
        draw();
        note('');
        msgIn.value = '';
        count();
        if (B.sound) B.sound.play('tap');
        say(TEXT.sent, 'ok');
        try { msgIn.blur(); } catch (e) {}
        stateTimer = setTimeout(tick, 1600); // "기록되었습니다"를 잠깐 보여 준 뒤 남은 시간을 표시
        btn.disabled = true;
      })
      .catch(function () {
        sending = false;
        say(TEXT.sendFail, 'fail');
        btn.disabled = false;
      });
  }

  form.addEventListener('submit', function (ev) { ev.preventDefault(); send(); });
  // 닉네임 칸에서 완료(엔터)를 누르면 등록하지 않고 메시지 칸으로
  nameIn.addEventListener('keydown', function (ev) {
    if (ev.key === 'Enter' && !ev.isComposing) { ev.preventDefault(); msgIn.focus(); }
  });
  msgIn.addEventListener('input', function () {
    count();
    var kind = stateEl.getAttribute('data-kind');
    if (kind === 'need' || kind === 'fail' || kind === 'ok') say('');
  });
  nameIn.addEventListener('input', function () { if (stateEl.getAttribute('data-kind') === 'need') say(''); });

  // ── 화면이 열려 있는 동안만 주기적으로 새 글 확인 ──
  var poll = 0, open = false;
  function start() {
    open = true;
    // 닉네임 기본값: 전에 쓴 닉네임 → ?id 로 들어온 사람은 이름 → 빈칸
    if (!nameIn.value) nameIn.value = clean(store().name || (B.id && !B.booth ? B.name : ''), MAX_NAME);
    count();
    tick();
    load();
    clearInterval(poll);
    poll = setInterval(function () { if (open && !document.hidden) load(); }, POLL);
  }
  function stop() {
    open = false;
    clearInterval(poll);
    clearTimeout(coolTimer);
    fresh = {};
  }
  document.addEventListener('binari:screen', function (ev) { if (ev.detail === 'log') start(); else if (open) stop(); });
  document.addEventListener('visibilitychange', function () { if (open && !document.hidden) load(); });
  if (document.body.getAttribute('data-screen') === 'log') start();

  B.log = { reload: load };
})();
