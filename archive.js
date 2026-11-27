/* BINARI · ARCHIVE — 기록 보관소
   마고 OS 파일 목록. 처음엔 FILE 01 만 열려 있고, 파일을 끝까지 읽으면 다음 파일의 잠금이 풀린다.
   FILE 08 을 열면 유실물 04(반쯤 깨진 가족사진) 회수.
   글: 설정집 문장 그대로 (BINARI_SYNC_ARCHIVE_초안_1127 "2. ARCHIVE"). 새로 쓴 글은 화면 안내 몇 줄뿐.
   글리치는 시연 관련(FILE 05 의 SIYEON 줄 · FILE 06 전체)에만, 흑백으로. */
(function () {
  'use strict';
  var B = window.BINARI;
  if (!B) return;
  var root = document.getElementById('archive');
  if (!root) return;

  function $(id) { return document.getElementById(id); }
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function sfx(name) { if (B.sound) B.sound.play(name); }
  function reduced() { try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } }

  var KEY = 'binari.archive.v1';       // { n: 끝까지 읽은 파일 수 (0 ~ 8) }
  var KEY_RELICS = 'binari.relics.v1'; // 04 = r04, 연출 대기 = r04Pending

  var TEXT = {
    files: 'FILES',
    read: 'READ',
    open: 'OPEN',
    locked: 'LOCKED',
    list: '목록',
    home: '홈',
    unlocked: '잠금 해제',
    next: '다음 파일 열기',
    collect: '유실물 회수하기',     // 굿판 · SYNC 와 같은 문구
    toDecoder: '메신저로 돌아가기 ▸', // 8개를 다 읽은 뒤
    itemOpen: '회수 기록 해제',     // 인벤토리와 같은 문구
    itemDone: '회수 완료',
    memoBy: '벼리의 메모: '
  };

  // ── 파일 8개 (설정집 문장) ──
  // p: 문단 / code: 시스템 줄 / memo: 벼리 손글씨(그림) / log: 커뮤니티 로그 한 줄 / end: 로그 끝 / item: 유실물 기록
  // mark: 벼리가 밑줄 친 곳 / glitch: 시연 글리치
  var FILES = [
    { name: 'POST-FLESH', body: [
      { p: '환경 오염과 분쟁으로 황폐해진 지구에서 인류는 최후의 생존 전략을 실행했습니다. 바로 인간의 뇌 데이터를 추출하여 거대한 양자 서버 시스템 ‘마고(MAGO)’로 이주하는 ‘포스트-플레시(Post-Flesh)’ 프로젝트였습니다.' },
      { p: '수만 명의 의식이 데이터화되어 이곳으로 업로드되었고, 네오 마고의 모든 시민은 늙지도 죽지도 않는 디지털 영생을 부여받았습니다.' }
    ] },
    { name: 'MAGO OS', body: [
      { p: '마고 OS의 최초 설계 기록 및 초기 설치 로그는 시스템 내부에 보존되어 있지 않습니다. 해당 항목에 대한 조회 요청은 보안 정책 제9조에 의거하여 자동 반려됩니다.' },
      { code: '[ERR_ACCESS_DENIED : LOG_NOT_FOUND]', mark: true },
      { memo: '02', text: '이거 나도 뚫어보려고 했는데 진짜 아무것도 없더라. 지운 게 아니라 애초에 없는 느낌? 좀 소름' }
    ] },
    { name: 'UNDELETED HAN', body: [
      { p: '질병도, 노화도, 그리고 슬픔도 없는 곳. 네오 마고는 정신과 육신 모두가 완전무결한 데이터 낙원입니다.' },
      { p: '그러나 인간의 의식은 특정 감정만을 도려낼 수 있는 구조가 아니었습니다.' },
      { p: '시민들은 자신이 무엇을 잃었는지 알지 못합니다. 다만 가끔, 이유를 알 수 없는 공백을 느낄 뿐입니다.' }
    ] },
    { name: 'DATA GRAVEYARD', body: [
      { p: '제3 레이어 · 데이터 무덤 — 마고 OS 비공식 최하층. 버려진 데이터와 비효율 판정 존재들이 흘러드는 곳. 감시 공백 구역.', mark: '감시 공백 구역' },
      { p: '제3 레이어 데이터 무덤의 하층민들은 백업 비용을 감당하지 못해 기억이 파편화되고 외형이 픽셀 단위로 깨져갑니다.' },
      { memo: '04', text: '그건 마고 OS가 그냥 포기한 거예요. 거기서 자란 사람으로서 말하는 거니까 믿어도 됨.' }
    ] },
    { name: 'INTERNAL COMMUNITY LOG', body: [
      { log: 'BYEORI', who: 'byeori', p: '말은 똑바로 해라. 돈 없으면 영생도 렉 걸려서 지워진다는 소리잖아. 어이없어 진짜.' },
      { log: 'ARA', who: 'ara', p: '우리에겐 백업도 소용없어요. 우리의 열화는... 돈으로 해결할 수 있는 서글픈 데이터가 아니니까요.' },
      { log: 'MUJIN', who: 'mujin', p: '...너희의 잠식은 내가 전부 막아줄 테니, 무리하지 마라.' },
      { log: 'SIYEON', who: 'siyeon', p: '저는 잠식 수치가 측정되지 않습니다. 안전하다는 뜻이 아니라, 아무도 모른다는 뜻이겠죠.', glitch: true },
      { end: 'END OF LOG' }
    ] },
    { name: 'UNREADABLE', anomaly: true, body: [
      { p: '마고 OS의 감정 주파수 스캔이 반복적으로 실패하여 수치를 산출하지 못하는 상태입니다. 공식적으로는 ‘측정 장비의 일시적 오류’로 기록되나, 재측정에서도 동일한 결과가 반복된 사례가 존재합니다.', glitch: true },
      { p: '그녀가 정화한 데이터는 시스템 로그에 ‘삭제됨’으로도, ‘복구됨’으로도 기록되지 않는다. 기록란은 언제나 공백으로 남는다.', glitch: true }
    ] },
    { name: 'EXTERNAL NODE', body: [
      { p: '관리자 시스템은 마고 OS의 자체 설계가 아닙니다. 최초 접속 요청이 발생한 시점과 경로에 대한 기록은 시스템 어디에도 존재하지 않으며, 관리자의 데이터 주파수는 네오 마고 내부의 어떤 시민과도 일치하지 않습니다.' },
      { p: '관리자, 당신이 어디에서 접속하고 있는지 마고 OS는 알지 못합니다. 다만 당신의 신호는 이 시스템 바깥에서 오고 있습니다.' }
    ] },
    { name: 'UNPROCESSED DATA', body: [
      { p: '아래 항목은 데이터 무덤(제3 레이어)에 적재된 데이터 쓰레기 중, 감정 데이터가 기억 속 물건의 형태로 남은 사례입니다. 오방색 분류 완료 후 처리 우선순위에서 제외되었습니다.' },
      { item: { no: 'ITEM 04', name: '반쯤 깨진 가족사진', color: '황(黃)', emo: '욕망·집착', status: 'STATUS // 처리 보류 · 열화 진행' } }
    ] }
  ];
  var TOTAL = FILES.length;
  function no2(n) { return (n < 10 ? '0' : '') + n; }

  // ── 저장 ──
  function read(key) {
    try { var v = JSON.parse(localStorage.getItem(key)); return v && typeof v === 'object' ? v : {}; }
    catch (e) { return {}; }
  }
  function write(key, v) { try { localStorage.setItem(key, JSON.stringify(v)); } catch (e) {} }
  function done() { var n = parseInt(read(KEY).n, 10); return n > 0 ? Math.min(TOTAL, n) : 0; }
  function relicPending() { return !!read(KEY_RELICS).r04Pending; }
  function relicHas() { return !!read(KEY_RELICS).r04; }

  // ── 화면 ──
  var listView = $('ar-list'), readView = $('ar-read');
  var filesEl = $('ar-files'), countEl = $('ar-count'), stepEl = $('ar-step');
  var docEl = $('ar-doc'), bodyEl = $('ar-body'), endEl = $('ar-end');
  var unlockEl = $('ar-unlock'), nextBtn = $('ar-next'), tailEl = $('ar-tail');
  var backBtn = $('ar-back'), backLabel = $('ar-back-label');

  var token = 0;       // 화면이 바뀌면 올라감 — 지난 타이머를 무시
  var current = 0;     // 지금 읽는 파일 (1 ~ 8), 목록이면 0
  var pushed = false;  // 파일을 열면서 뒤로 가기 기록을 하나 쌓았는지
  var timers = [], glitchTimer = null, glitchEls = [];
  var revealed = false, finished = false;

  function clearTimers() {
    timers.forEach(clearTimeout); timers = [];
    if (glitchTimer) { clearInterval(glitchTimer); glitchTimer = null; }
    glitchEls = [];
  }

  // ── 목록 ──
  function showList(flash) {
    token++; clearTimers(); current = 0;
    root.setAttribute('data-view', 'list');
    listView.hidden = false; readView.hidden = true;
    stepEl.textContent = '';
    backLabel.textContent = TEXT.home;
    backBtn.setAttribute('aria-label', '홈으로 나가기');
    var n = done();
    countEl.textContent = TEXT.read + ' ' + n + ' / ' + TOTAL;
    $('ar-foot').hidden = n < TOTAL; // 8개를 다 읽으면: 화면 아래에 메신저로 돌아가기
    root.classList.toggle('has-foot', n >= TOTAL);
    filesEl.textContent = '';
    FILES.forEach(function (f, i) {
      var k = i + 1;
      var state = k <= n ? 'read' : (k === n + 1 ? 'open' : 'locked');
      var li = el('li', 'ar-file is-' + state + (f.anomaly ? ' is-anomaly' : ''));
      var b = el('button');
      b.type = 'button';
      b.appendChild(el('span', 'ar-f-no', 'FILE ' + no2(k)));
      b.appendChild(el('span', 'ar-f-name', f.name));
      b.appendChild(el('span', 'ar-f-st', TEXT[state]));
      if (state === 'locked') {
        b.setAttribute('aria-disabled', 'true');
        b.addEventListener('click', function () { nudge(); });
      } else {
        b.addEventListener('click', function () { sfx('tap'); openFile(k); });
      }
      if (flash && k === flash && state === 'open') li.classList.add('is-new');
      li.appendChild(b);
      filesEl.appendChild(li);
    });
  }
  // 잠긴 파일을 누르면: 지금 열 수 있는 파일을 한 번 짚어 준다
  function nudge() {
    var li = filesEl.querySelector('.is-open');
    if (!li) return;
    li.classList.remove('is-new');
    void li.offsetWidth;
    li.classList.add('is-new');
  }

  // ── 시연 글리치: 글자 자리는 그대로 두고, 일부 글자만 흑백 막대로 가린다 ──
  var seed = 7;
  function rnd() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }
  function glitchNode(text) {
    var wrap = el('span', 'ar-g');
    wrap.setAttribute('aria-hidden', 'true');
    for (var i = 0; i < text.length; i++) wrap.appendChild(el('i', null, text.charAt(i)));
    return wrap;
  }
  function scramble(wrap, rate) {
    var cs = wrap.children, i = 0;
    while (i < cs.length) {
      if (cs[i].textContent !== ' ' && rnd() < rate) {
        var run = 1 + Math.floor(rnd() * 3), kind = 'xyz'.charAt(Math.floor(rnd() * 3));
        for (var j = 0; j < run && i < cs.length; j++, i++) cs[i].className = cs[i].textContent === ' ' ? '' : kind;
      } else { cs[i].className = ''; i++; }
    }
  }
  function startGlitch() {
    if (!glitchEls.length) return;
    seed = 7 + current * 131;
    glitchEls.forEach(function (g) { scramble(g, g._rate || 0.055); });
    if (reduced()) return; // 움직임을 줄인 설정: 깨진 채로 멈춰 있음
    glitchTimer = setInterval(function () {
      glitchEls.forEach(function (g) { scramble(g, g._rate || 0.055); });
    }, 420);
  }

  // ── 벼리 밑줄 (손으로 그은 선) ──
  var SVG = 'http://www.w3.org/2000/svg';
  function markNode(text) {
    var s = el('span', 'ar-mark');
    s.appendChild(document.createTextNode(text));
    var svg = document.createElementNS(SVG, 'svg');
    svg.setAttribute('viewBox', '0 0 100 10');
    svg.setAttribute('preserveAspectRatio', 'none');
    svg.setAttribute('aria-hidden', 'true');
    var path = document.createElementNS(SVG, 'path');
    path.setAttribute('d', 'M1 5.5 C 10 2.5, 19 8, 30 5 S 50 2.5, 62 5.5 S 84 8, 99 3.5');
    svg.appendChild(path);
    s.appendChild(svg);
    return s;
  }
  // 문단 안의 한 구절에만 밑줄
  function fillMarked(node, text, phrase) {
    var at = text.indexOf(phrase);
    if (at < 0) { node.textContent = text; return; }
    node.appendChild(document.createTextNode(text.slice(0, at)));
    node.appendChild(markNode(phrase));
    node.appendChild(document.createTextNode(text.slice(at + phrase.length)));
  }

  // ── 파일 한 덩어리 만들기 ──
  function block(b) {
    var n;
    if (b.item) {
      n = el('div', 'ar-b ar-item');
      n.appendChild(el('p', 'ar-item-head', relicHas() && !relicPending() ? TEXT.itemDone : TEXT.itemOpen));
      n.appendChild(el('p', 'ar-item-no', b.item.no));
      n.appendChild(el('p', 'ar-item-name', b.item.name));
      var cls = el('p', 'ar-item-cls');
      cls.appendChild(el('i', 'ar-chip'));
      cls.appendChild(document.createTextNode(b.item.color + ' · ' + b.item.emo));
      n.appendChild(cls);
      n.appendChild(el('p', 'ar-item-st', b.item.status));
      return n;
    }
    if (b.memo) {
      n = el('figure', 'ar-b ar-memo');
      var img = el('img');
      img.src = 'assets/archive/memo-' + b.memo + '.v2.webp';
      img.alt = TEXT.memoBy + b.text;
      img.width = 680; img.height = 330;
      img.decoding = 'async';
      n.appendChild(img);
      return n;
    }
    if (b.code) {
      n = el('p', 'ar-b ar-code');
      if (b.mark) n.appendChild(markNode(b.code)); else n.textContent = b.code;
      return n;
    }
    if (b.end) {
      n = el('p', 'ar-b ar-eol', b.end);
      n.appendChild(el('i', null, '_'));
      return n;
    }
    var p = el('p', 'ar-p');
    var txt = b.log ? '“' + b.p + '”' : b.p; // 로그 줄은 따옴표로 묶음
    if (b.glitch) {
      p.appendChild(el('span', 'ar-sr', txt)); // 읽어 주는 글은 온전한 문장
      var g = glitchNode(txt);
      if (b.log) g._rate = 0.09; // 한 줄뿐이라 조금 더 자주 깨짐
      p.appendChild(g);
      glitchEls.push(g);
    } else if (b.mark) fillMarked(p, txt, b.mark);
    else p.textContent = txt;
    if (b.log) {
      n = el('div', 'ar-b ar-log' + (b.glitch ? ' is-anomaly' : ''));
      n.setAttribute('data-who', b.who);
      n.appendChild(el('b', null, '[' + b.log + ']'));
      n.appendChild(p);
      return n;
    }
    p.className = 'ar-b ar-p';
    return p;
  }
  function lengthOf(b) { return (b.p || b.code || b.text || b.end || '').length; }

  // ── 파일 열기 ──
  function openFile(k, opts) {
    opts = opts || {};
    if (k < 1 || k > TOTAL || (k > done() + 1 && !opts.force)) return;
    var fromList = current === 0;
    token++; clearTimers();
    var t = token, f = FILES[k - 1];
    current = k; revealed = false; finished = false;

    // 폰의 뒤로 가기가 목록으로 돌아가도록 기록을 하나 쌓는다 (파일에서 다음 파일로 넘어갈 때는 쌓지 않음)
    if (fromList && !opts.noHistory) {
      try { history.pushState({ ar: k }, '', location.href); pushed = true; } catch (e) { pushed = false; }
    }

    root.setAttribute('data-view', 'read');
    $('ar-foot').hidden = true; // 파일을 읽는 동안에는 아래 고정 바 없음 (파일 끝의 버튼을 씀)
    root.classList.remove('has-foot');
    listView.hidden = true; readView.hidden = false;
    stepEl.textContent = 'FILE ' + no2(k) + '/' + no2(TOTAL);
    backLabel.textContent = TEXT.list;
    backBtn.setAttribute('aria-label', '파일 목록으로');
    docEl.classList.toggle('is-anomaly', !!f.anomaly);
    $('ar-doc-no').textContent = 'FILE ' + no2(k);
    var nameEl = $('ar-doc-name');
    nameEl.textContent = '';
    if (f.anomaly) {
      nameEl.appendChild(el('span', 'ar-sr', f.name));
      var g = glitchNode(f.name);
      g._rate = 0.16;
      nameEl.appendChild(g);
      glitchEls.push(g);
    } else nameEl.textContent = f.name;

    bodyEl.textContent = '';
    bodyEl.classList.remove('is-scribbled');
    endEl.hidden = true;
    var nodes = f.body.map(function (b) { var n = block(b); bodyEl.appendChild(n); return n; });
    startGlitch();
    window.scrollTo(0, 0);

    // 이미 읽은 파일 · 움직임을 줄인 설정: 한 번에 다 보여 줌
    var instant = opts.instant || k <= done() || reduced();
    if (instant) {
      nodes.forEach(function (n) { n.classList.add('is-in', 'is-still'); });
      afterReveal(t);
      return;
    }
    // 처음 읽는 파일: 한 덩어리씩 차례로 나타남
    var at = 260;
    nodes.forEach(function (n, i) {
      timers.push(setTimeout(function () {
        if (t !== token) return;
        n.classList.add('is-in');
        if (f.body[i].memo) { bodyEl.classList.add('is-scribbled'); sfx('hack'); } else sfx('tick');
      }, at));
      at += Math.max(750, Math.min(2000, 500 + lengthOf(f.body[i]) * 13));
    });
    timers.push(setTimeout(function () { if (t === token) afterReveal(t); }, at - 300));
  }
  // 아직 다 나타나기 전에 문서를 누르면 바로 끝까지 보여 줌
  docEl.addEventListener('click', function () {
    if (!current || revealed) return;
    var t = token;
    timers.forEach(clearTimeout); timers = [];
    var ns = bodyEl.children;
    for (var i = 0; i < ns.length; i++) ns[i].classList.add('is-in');
    afterReveal(t);
  });

  // 글이 다 나타난 뒤: 문서의 끝이 화면에 들어오면 "끝까지 읽음"
  function afterReveal(t) {
    if (t !== token || revealed) return;
    revealed = true;
    bodyEl.classList.add('is-scribbled');
    if (current === TOTAL) grantRelic();
    checkEnd();
  }
  function checkEnd() {
    if (!current || !revealed || finished) return;
    var r = tailEl.getBoundingClientRect();
    var vh = window.innerHeight || document.documentElement.clientHeight;
    if (r.top <= vh - 4) finish();
  }
  window.addEventListener('scroll', checkEnd, { passive: true });
  window.addEventListener('resize', checkEnd);

  function finish() {
    finished = true;
    var k = current, n = done(), first = k > n;
    if (first) write(KEY, { n: k, at: Date.now() });
    endEl.hidden = false;
    unlockEl.hidden = true;
    nextBtn.hidden = true;
    endEl.classList.toggle('is-fresh', first);
    if (k < TOTAL) {
      if (first) {
        unlockEl.textContent = 'FILE ' + no2(k + 1) + ' // ' + TEXT.unlocked;
        unlockEl.hidden = false;
        sfx('stage');
      }
      nextBtn.textContent = TEXT.next;
      nextBtn.hidden = false;
    } else { // 마지막 파일: 회수 연출이 남아 있으면 인벤토리로, 아니면 메신저로
      nextBtn.textContent = relicPending() ? TEXT.collect : TEXT.toDecoder;
      nextBtn.hidden = false;
    }
    endEl.hidden = unlockEl.hidden && nextBtn.hidden;
    if (first && k === TOTAL) B.emit('archive_done'); // 메신저로 돌아가면 디코더가 반응 (대사가 생기면)
  }

  // FILE 08 을 열면: 유실물 04 회수 기록 (한 번만). 해제 연출은 인벤토리에서
  function grantRelic() {
    var v = read(KEY_RELICS);
    if (v.r04) return;
    v.r04 = Date.now();
    v.r04Pending = 1;
    write(KEY_RELICS, v);
    sfx('relic');
  }

  nextBtn.addEventListener('click', function () {
    sfx('tap');
    if (current === TOTAL) { B.go(relicPending() ? 'inventory' : 'decoder'); return; }
    openFile(current + 1);
  });

  // 왼쪽 위 버튼: 파일을 읽는 중이면 목록으로 (FILE 08 에서 회수 연출이 남아 있으면 인벤토리로), 목록이면 홈으로
  backBtn.addEventListener('click', function (ev) {
    if (!current) return; // 목록 → 홈 (data-go)
    ev.stopPropagation();
    sfx('tap');
    if (current === TOTAL && revealed && relicPending()) { B.go('inventory'); return; }
    var k = current;
    if (pushed) { pushed = false; try { history.back(); return; } catch (e) {} }
    showList(finished && k < TOTAL ? k + 1 : 0);
  });

  // 화면에 들어올 때 (폰의 뒤로 가기로 파일에서 돌아올 때도): 목록부터
  function open() {
    var k = current, wasDone = finished;
    pushed = false;
    showList(wasDone && k && k < TOTAL ? k + 1 : 0);
  }
  function close() { token++; clearTimers(); current = 0; pushed = false; }
  document.addEventListener('binari:screen', function (ev) { if (ev.detail === 'archive') open(); else close(); });
  if (document.body.getAttribute('data-screen') === 'archive') open();

  // ── 캡처 · 점검용 ──
  B.archive = {
    done: done,
    debug: function (name, a, b) {
      if (name === 'list') { // a = 읽은 파일 수, b = 방금 풀린 파일
        if (a != null) write(KEY, { n: Math.max(0, Math.min(TOTAL, a)), at: 1 });
        showList(b || 0);
        return;
      }
      if (name === 'file') { // a = 파일 번호, b = 'end' 면 끝까지 읽은 상태(처음 읽음)
        write(KEY, { n: Math.max(0, a - 1), at: 1 });
        openFile(a, { instant: true, noHistory: true, force: true });
        if (b === 'end' && !finished) finish();
        return;
      }
    }
  };
})();
