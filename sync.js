/* BINARI · SYNC — 공명 접속 (6명의 디코더 중 나와 공명하는 디코더)
   시작 화면 → 질문 8개(SCAN 01/08, 답할 때마다 동기화 진행률 상승) → 결과 카드 → 첫 완료 때 유실물 03 회수.
   글: 설정집 문장 그대로. 새로 쓴 글은 질문 · 선택지와 화면 안내 몇 줄뿐 (지예 확인본, BINARI_SYNC_ARCHIVE_초안_1127 "SYNC v2 최종안") */
(function () {
  'use strict';
  var B = window.BINARI;
  if (!B) return;
  var root = document.getElementById('sync');
  if (!root) return;

  function $(id) { return document.getElementById(id); }
  function sfx(name) { if (B.sound) B.sound.play(name); }

  var KEY = 'binari.sync.v1';      // { d: 결과 디코더, at: 시각 }
  var KEY_RELICS = 'binari.relics.v1';

  var TEXT = {
    introTitle: 'SYNC // 공명 접속',
    introEn: '(Resonance Connection)',
    intro: '관리자가 네오 마고에 접속하면, 마고 OS는 즉시 관리자의 고유 데이터 주파수를 분석합니다. 이후 해당 주파수와 공명 가능한 디코더를 탐색하여 동기화 신청서(Sync Request)를 자동 발송합니다.',
    start: '주파수 스캔 시작',
    progress: '동기화 진행률',
    head: 'SYNC COMPLETE // 동기화 성립',
    headSub: '관리자의 주파수와 공명한 디코더',
    headAnomaly: 'SYNC ??? // 측정 불가',
    headAnomalySub: '[STATUS: ANOMALY]',
    file: 'DECODER FILE // ',
    again: '다시 스캔',
    home: '홈으로 돌아가기',
    collect: '유실물 회수하기',   // 첫 완료로 03번 연출이 대기 중일 때만
    holdIOS: '이미지를 길게 눌러 ‘사진 앱에 저장’을 선택하세요.',
    hold: '이미지를 길게 눌러 저장하세요.',
    rows: ['관리 번호', '오방색', '정화 계열', '공명 주파수'],
    unreadable: '측정 불가'
  };

  // ── 디코더 6명 (설정집 문장) ──
  var D = {
    ara: {
      ko: '아라', en: 'ARA', line: '한을 해독하는 자, 살풀이의 무녀',
      no: '#24-ARTISAN-0929', obang: '청(靑)', cls: '해독형', hz: '444Hz', pen: '#4E5CE4', paper: '#E4E8FA',
      desc: ['아라는 악귀를 단순히 삭제해야 할 에러로 보지 않고, 해독되어야 할 ‘슬픈 데이터’로 간주한다.'],
      file: '포스트-플레시 프로젝트 당시, 소멸하지 않는 강렬한 ‘한(恨)’의 주파수를 보유한 채 업로드된 특이 개체이다. 아라는 악귀를 단순히 삭제해야 할 에러로 보지 않고, 해독되어야 할 ‘슬픈 데이터’로 간주한다. 시스템보다는 인간의 흔적을 우선시하는 성향으로 인해 효율 중심의 마고 OS 프로토콜과 충돌하기도 하나, 데이터 복구율은 최상위권에 속한다.'
    },
    geon: {
      ko: '건', en: 'GEON', line: '강철의 집행자, 시스템의 커서',
      no: '#25-LOGICIAN-0802', obang: '백(白)', cls: '파쇄형', hz: '0Hz', pen: '#B0202A', paper: '#F1E1EA',
      desc: ['주관적인 감정을 배제하고 데이터를 ‘유효’와 ‘무효’로만 구분한다.', '예상치 못한 시스템 과부하 상황에서는 누구보다 먼저 최전선에 서는 면모를 보인다.'],
      file: '마고 OS의 무결성을 증명하기 위해 설계된 가장 완벽한 형태의 디코더이다. 건에게 정화란 위로도, 해독도 아니다. 오염된 좌표를 특정하고, 선택하고, 시스템에서 영구 분리하는 일련의 연산일 뿐이다. 차갑고 원칙적인 태도로 인해 동료들 사이에서 ‘강철의 집행자’로 불리나, 예상치 못한 시스템 과부하 상황에서는 누구보다 먼저 최전선에 서는 면모를 보인다.'
    },
    byeori: {
      ko: '벼리', en: 'BYEORI', line: '규칙을 비웃는 디지털 도깨비',
      no: '#17-TRICKSTER-0808', obang: '적(赤)', cls: '교란형', hz: '808Hz', pen: '#F26A1B', paper: '#F6E7E6',
      desc: ['벼리는 무겁고 진중한 정화 프로토콜을 하나의 ‘유희(Game)’로 취급한다.'],
      file: '마고 OS의 가장 깊은 보안 구역을 자유롭게 크래킹하며 떠돌던 천재 신세대 디코더. 벼리는 무겁고 진중한 정화 프로토콜을 하나의 ‘유희(Game)’로 취급한다. 마고 OS의 엄격한 가이드라인을 무시하고 시스템 대시보드에 스티커와 낙서를 도배하는 탓에 관리국의 두통거리이지만, 현장 정화 효율만큼은 팀 내 누구도 따라올 수 없는 독보적인 스피드스터이다.'
    },
    mujin: {
      ko: '무진', en: 'MUJIN', line: '장승 & 산예, 침묵하는 수호자',
      no: '#34-FORTRESS-0505', obang: '황(黃)', cls: '수호형', hz: '104Hz', pen: '#2E7564', paper: '#DFF4EA',
      desc: ['말수가 적고 우직하여 행동으로 모든 것을 증명하는 팀의 맏형이다.'],
      file: '말수가 적고 우직하여 행동으로 모든 것을 증명하는 팀의 맏형이다. 그는 신성한 화이트 코드(White Code)를 방패 삼아, 후방의 아군이 안정적으로 공격 프로토콜을 전개할 수 있도록 최전선에서 철벽의 격벽을 유지한다. 가끔 마고 OS의 자체 보호 지침을 위반하면서까지 팀원들의 데이터 오염을 대신 뒤집어쓰고 잠식(Erosion)을 자처하는 이타적 코드를 지니고 있어, 시스템 관리국의 경계 및 특별 관리 대상이기도 하다.'
    },
    doun: {
      ko: '도운', en: 'DOWUN', line: '길을 읽고, 흐름을 되돌리는 자',
      no: '#27-GEOMANCER-0315', obang: '황(黃)', cls: '지형조작형', hz: '360Hz', pen: '#6A2FA8', paper: '#E9E4F6',
      desc: ['그가 서 있는 곳은 늘 중앙이지만, 그 중앙은 계속 움직인다.'],
      file: '능글맞고 여유로운 태도로 팀원들에게 스스럼없이 농을 걸지만, 전선에 들어서는 순간 손바닥 위의 윤도를 회전시키며 냉철한 관측자로 변모한다. 그의 정화는 파괴도 해독도 아니다. 어긋난 좌표를 원래의 방위로 되돌리거나, 반대로 악귀가 선 자리를 흉(凶)한 방위로 뒤바꿔 스스로 붕괴하게 만드는 조율(調律)의 연산이다. 그가 서 있는 곳은 늘 중앙이지만, 그 중앙은 계속 움직인다.'
    },
    siyeon: {
      ko: '시연', en: 'SIYEON', line: '악연을 끊고, 영혼을 보내는 자', anomaly: true,
      no: '#29-BOUNDARY-1024', obang: '흑(黑) 분류 불가', cls: '저격형', hz: '측정 불가 (Unreadable)', pen: '#A8196C', paper: '#E4E6E8',
      desc: ['그녀가 정화한 데이터는 시스템 로그에 ‘삭제됨’으로도, ‘복구됨’으로도 기록되지 않는다. 기록란은 언제나 공백으로 남는다.'],
      file: '포스트-플레시 프로젝트 당시 업로드된 개체이나, 마고 OS의 감정 주파수 스캔이 반복적으로 실패한 유일한 사례이다. 시연의 정화는 삭제도 해독도 아니다. 악연(惡緣)을 끊고, 그 데이터를 시스템 경계 밖으로 보내는 인도(引導)의 연산이다. 그녀가 정화한 데이터는 시스템 로그에 ‘삭제됨’으로도, ‘복구됨’으로도 기록되지 않는다. 기록란은 언제나 공백으로 남는다.'
    }
  };

  // ── 질문 8개. 선택지 하나 = 디코더 하나에 1점, '*' 는 시연 칸 ──
  var Q = [
    { q: '처음 보는 도시에 도착했다. 가장 먼저 하는 일은?', a: [
      ['높은 곳에 올라가 도시 전체를 내려다본다', 'doun'],
      ['사람들이 모인 곳에 가서 이야기를 들어 본다', 'ara'],
      ['‘출입 금지’ 표지판부터 찾아 넘어가 본다', 'byeori']] },
    { q: '함께 일하던 동료가 실수로 일을 크게 망쳤다.', a: [
      ['원인부터 짚고 바로 바로잡는다', 'geon'],
      ['말없이 뒷수습을 같이 한다', 'mujin'],
      ['일단 웃게 만든다. 수습은 그다음', 'byeori']] },
    { q: '친구가 밤늦게 “나 좀 힘들어”라고 연락했다.', a: [
      ['바로 전화해서 끝까지 들어 준다', 'ara'],
      ['아무 말 없이 그 친구 집 앞으로 간다', 'mujin'],
      ['혼자 정리할 시간을 주고 조용히 기다린다', '*']] },
    { q: '단체 여행에서 길 안내를 맡았다.', a: [
      ['날씨와 동선을 보고 좋은 길을 미리 잡아 둔다', 'doun'],
      ['가장 빠른 길로 시간을 정확히 맞춘다', 'geon'],
      ['길을 잃어도 좋다. 그게 더 재밌다', 'byeori']] },
    { q: '도저히 납득되지 않는 규칙이 생겼다.', a: [
      ['이유가 있을 거다. 일단 따른다', 'geon'],
      ['허점을 찾아서 슬쩍 빠져나간다', 'byeori'],
      ['상황을 봐서 따를 때와 안 따를 때를 정한다', 'doun']] },
    { q: '오래 붙잡고 있던 인연이 끝나 간다.', a: [
      ['끝까지 이야기를 나누고 서로 풀고 보낸다', 'ara'],
      ['끝나는 날까지 말없이 곁에 있어 준다', 'mujin'],
      ['끝내기보다 다른 관계로 이어 갈 방법을 찾는다', 'doun'],
      ['미련이 남지 않게 깔끔하게 끊고 보내 준다', '*']] },
    { q: '팀에서 맡고 싶은 자리는?', a: [
      ['맨 앞에서 모두를 막아 주는 자리', 'mujin'],
      ['적을 가장 빠르게 쓰러뜨리는 자리', 'geon'],
      ['판을 흔들어 기회를 만드는 자리', 'byeori'],
      ['한발 물러서 흐름을 읽고 작전을 짜는 자리', 'doun'],
      ['지친 팀원들의 마음을 챙기는 자리', 'ara']] },
    { q: '마지막 스캔. 관리자는 왜 이 신호에 응답했습니까?', a: [
      ['누군가 부르는 소리가 들려서', 'ara'],
      ['해야 할 일이니까', 'geon'],
      ['지켜야 할 사람이 있어서', 'mujin'],
      ['잘 모르겠다. 그냥, 닿았다', '*']] }
  ];

  // 판정: ★ 를 2개 이상 고르면 시연. 그 밖에는 점수가 가장 높은 디코더, 동점이면 나중에 점수를 얻은 쪽
  function judge(picks) {
    var star = 0, score = {}, last = {};
    picks.forEach(function (k, i) {
      if (k === '*') { star++; return; }
      score[k] = (score[k] || 0) + 1;
      last[k] = i;
    });
    if (star >= 2) return 'siyeon';
    var best = null;
    for (var k in score) {
      if (!Object.prototype.hasOwnProperty.call(score, k)) continue;
      if (!best || score[k] > score[best] || (score[k] === score[best] && last[k] > last[best])) best = k;
    }
    return best || 'ara';
  }

  function read(key) { try { var v = JSON.parse(localStorage.getItem(key)); return v && typeof v === 'object' ? v : {}; } catch (e) { return {}; } }
  function write(key, v) { try { localStorage.setItem(key, JSON.stringify(v)); } catch (e) {} }
  function saved() { var v = read(KEY); return v.d && D[v.d] ? v.d : null; }
  function relicPending() { return !!read(KEY_RELICS).r03Pending; }
  function reduced() { try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } }

  // ── 화면 ──
  var views = { intro: $('sy-intro'), scan: $('sy-scan'), result: $('sy-result') };
  function view(name) {
    for (var k in views) if (Object.prototype.hasOwnProperty.call(views, k)) views[k].hidden = (k !== name);
    root.setAttribute('data-view', name);
    if (name !== 'scan') $('sy-step').textContent = '';
    try { root.scrollTop = 0; window.scrollTo(0, 0); } catch (e) {}
  }

  $('sy-intro-title').textContent = TEXT.introTitle;
  $('sy-intro-en').textContent = TEXT.introEn;
  $('sy-intro-text').textContent = TEXT.intro;
  $('sy-start').textContent = TEXT.start;
  $('sy-prog-label').textContent = TEXT.progress;
  $('sy-again').textContent = TEXT.again;

  var token = 0, picks = [], idx = 0, busy = false;

  function setProgress(n, broken) {
    var pct = Math.round(n / Q.length * 100);
    $('sy-prog-fill').style.transform = 'scaleX(' + (n / Q.length) + ')';
    $('sy-prog-pct').textContent = broken ? '???' : pct + '%';
    $('sy-prog').classList.toggle('is-broken', !!broken);
  }
  function shuffle(list) {
    var a = list.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }
  function two(n) { return (n < 10 ? '0' : '') + n; }

  function ask(i) {
    idx = i; busy = false;
    var item = Q[i];
    $('sy-step').textContent = 'SCAN ' + two(i + 1) + '/' + two(Q.length);
    $('sy-q').textContent = item.q;
    var box = $('sy-choices');
    box.textContent = '';
    var order = api._fixed ? item.a : shuffle(item.a); // 선택지 순서는 매번 섞는다 (디코더가 보이지 않게)
    order.forEach(function (c, n) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'sy-choice';
      var no = document.createElement('span'); no.className = 'sy-choice-no'; no.textContent = two(n + 1);
      var tx = document.createElement('span'); tx.textContent = c[0];
      b.appendChild(no); b.appendChild(tx);
      b.addEventListener('click', function () { pick(c[1], b); });
      box.appendChild(b);
    });
    views.scan.classList.remove('is-in'); void views.scan.offsetWidth; views.scan.classList.add('is-in');
  }

  function pick(key, btn) {
    if (busy) return;
    busy = true;
    var t = token;
    sfx('tap');
    btn.classList.add('is-picked');
    picks.push(key);
    setProgress(picks.length);
    var last = picks.length >= Q.length;
    setTimeout(function () {
      if (t !== token) return;
      if (!last) { ask(idx + 1); return; }
      finish(t);
    }, last ? 700 : 320);
  }

  function finish(t) {
    var d = judge(picks);
    var first = !saved();
    write(KEY, { d: d, at: Date.now() });
    // 첫 완료: 유실물 03 "찢어진 업로드 동의서" — 결과 카드를 닫을 때 인벤토리에서 "회수 기록 해제" 연출 (한 번만)
    var relics = read(KEY_RELICS);
    if (first && !relics.r03) {
      relics.r03 = Date.now();
      relics.r03Pending = 1;
      write(KEY_RELICS, relics);
    }
    B.emit('sync_done'); // 메신저로 돌아가면 디코더가 반응 (after_sync 대사가 생기면)
    var wait = 0;
    if (D[d].anomaly) { // 시연: 진행률 100%가 깨짐
      setProgress(Q.length, true);
      wait = reduced() ? 500 : 1500;
    }
    setTimeout(function () { if (t === token) showResult(d, true); }, wait);
  }

  function begin() {
    token++;
    picks = [];
    setProgress(0);
    view('scan');
    ask(0);
  }

  // ══════════════ 결과 카드 (canvas 로 그려 이미지로 보여 줌 — 그대로 저장 · 공유) ══════════════
  var W = 1080, H = 1440, K = 1.5;
  var MONO = '"IBM Plex Mono", ui-monospace, Menlo, monospace';
  var SANS = '"IBM Plex Sans KR", "Apple SD Gothic Neo", "Malgun Gothic", sans-serif';
  var CYAN = '#18D9EE', WHITE = '#F2F5F6', GRAY = '#8C9599', INK = '#0D0D0D';

  function loadImage(src) {
    return new Promise(function (resolve) {
      var im = new Image();
      im.onload = function () { resolve(im); };
      im.onerror = function () { resolve(null); };
      im.src = src;
    });
  }
  function fontsReady(sample) {
    if (!document.fonts || !document.fonts.load) return Promise.resolve();
    var specs = ['700 150px "IBM Plex Sans KR"', '400 34px "IBM Plex Sans KR"', '500 36px "IBM Plex Sans KR"',
      '400 28px "IBM Plex Mono"', '500 27px "IBM Plex Mono"', '600 31px "IBM Plex Mono"', '700 25px "IBM Plex Mono"'];
    var all = Promise.all(specs.map(function (s) { return document.fonts.load(s, sample).catch(function () {}); }));
    return Promise.race([all, new Promise(function (r) { setTimeout(r, 2500); })]);
  }
  function lotusPaths() {
    var out = [], nodes = document.querySelectorAll('#seal-art g[transform] path');
    for (var i = 0; i < nodes.length; i++) { try { out.push(new Path2D(nodes[i].getAttribute('d'))); } catch (e) {} }
    return out;
  }

  function draw(key, art, memo, mark) {
    var d = D[key], mono = !!d.anomaly;
    var ACC = mono ? '#D5D9DB' : CYAN;        // 시연 카드는 흑백
    var PEN = mono ? '#D5D9DB' : d.pen;
    var cv = document.createElement('canvas');
    cv.width = W * K; cv.height = H * K;
    var c = cv.getContext('2d');
    c.scale(K, K);
    var lotus = lotusPaths();

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
    // 낱말 단위 줄바꿈 (한 낱말이 폭을 넘으면 글자 단위로)
    function wrap(str, font, maxW) {
      c.font = font;
      var lines = [], cur = '';
      String(str).split(' ').forEach(function (word) {
        var tryLine = cur ? cur + ' ' + word : word;
        if (c.measureText(tryLine).width <= maxW) { cur = tryLine; return; }
        if (cur) lines.push(cur);
        cur = word;
        while (c.measureText(cur).width > maxW) {
          var n = cur.length - 1;
          while (n > 1 && c.measureText(cur.slice(0, n)).width > maxW) n--;
          lines.push(cur.slice(0, n)); cur = cur.slice(n);
        }
      });
      if (cur) lines.push(cur);
      return lines;
    }
    function line(x1, y1, x2, y2, color, w) {
      c.strokeStyle = color; c.lineWidth = w; c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke();
    }
    function fillLotus(x, y, width, color, alpha) {
      c.save();
      c.translate(x, y); c.scale(width / 244.5, width / 244.5); c.translate(-134, -62);
      c.fillStyle = color; c.globalAlpha = alpha;
      lotus.forEach(function (p) { c.fill(p); });
      c.restore();
    }

    // 바탕 + 옅은 모눈
    c.fillStyle = '#0A0C0D'; c.fillRect(0, 0, W, H);
    var g;
    for (g = 45; g < W; g += 45) line(g, 0, g, H, 'rgba(255,255,255,0.028)', 1);
    for (g = 30; g < H; g += 45) line(0, g, W, g, 'rgba(255,255,255,0.028)', 1);

    // 캐릭터 그림 (오른쪽) — 왼쪽 글자 뒤로 자연스럽게 사라지게
    if (art) {
      var ah = 760, aw = ah * art.width / art.height;
      c.save();
      c.beginPath(); c.rect(0, 132, W, 718); c.clip();
      c.drawImage(art, W - aw + 20, 132, aw, ah);
      c.restore();
      var fade = c.createLinearGradient(430, 0, 700, 0);
      fade.addColorStop(0, 'rgba(10,12,13,1)'); fade.addColorStop(1, 'rgba(10,12,13,0)');
      c.fillStyle = fade; c.fillRect(430, 132, 270, 718);
      var foot = c.createLinearGradient(0, 760, 0, 850);
      foot.addColorStop(0, 'rgba(10,12,13,0)'); foot.addColorStop(1, 'rgba(10,12,13,1)');
      c.fillStyle = foot; c.fillRect(0, 760, W, 90);
    }

    // 머리줄
    c.fillStyle = '#050607'; c.fillRect(0, 0, W, 130);
    c.fillStyle = PEN; c.fillRect(0, 0, 40, 130);
    c.fillStyle = ACC; c.fillRect(40, 129, W - 40, 3);
    fillLotus(60, 38, 74, ACC, 1);
    text(mono ? TEXT.headAnomaly : TEXT.head, 158, 60, '600 31px ' + MONO, WHITE, 3);
    text(mono ? TEXT.headAnomalySub : TEXT.headSub, 158, 98, mono ? '500 24px ' + MONO : '400 26px ' + SANS, mono ? ACC : GRAY, mono ? 2.4 : 1.5);
    text('NEO-MAGO', 1024, 78, '500 22px ' + MONO, ACC, 2.4, 'right');

    // 이름 · 한 줄 소개
    text('DECODER', 66, 222, '600 24px ' + MONO, ACC, 5);
    var nameW = text(d.ko, 60, 372, '700 150px ' + SANS, WHITE, 2);
    text(d.en, 66 + (nameW > 300 ? 0 : nameW + 22), nameW > 300 ? 422 : 372, '400 28px ' + MONO, GRAY, 8);
    var ly = nameW > 300 ? 480 : 440;
    wrap(d.line, '500 36px ' + SANS, 470).forEach(function (s, i) { text(s, 66, ly + i * 48, '500 36px ' + SANS, WHITE, 0.3); });

    // 식별 줄: 관리 번호 · 오방색 · 정화 계열 · 공명 주파수
    var rows = [d.no, d.obang, d.cls, d.hz], ry = 600;
    rows.forEach(function (v, i) {
      var y = ry + i * 62;
      line(66, y - 41, 520, y - 41, 'rgba(255,255,255,0.16)', 1.5);
      text(TEXT.rows[i], 66, y, '400 27px ' + SANS, GRAY, 0.3);
      text(v, 520, y, (i === 0 ? '500 27px ' + MONO : '500 29px ' + SANS), WHITE, i === 0 ? 0.2 : 0.2, 'right');
    });
    line(66, ry + 3 * 62 + 21, 520, ry + 3 * 62 + 21, 'rgba(255,255,255,0.16)', 1.5);

    // 설명 (설정집 문장)
    line(60, 862, 1020, 862, 'rgba(255,255,255,0.3)', 2);
    var paras = d.desc.map(function (para) { return wrap(para, '400 34px ' + SANS, 956); });
    var total = paras.reduce(function (n, p) { return n + p.length * 50 + 4; }, -4);
    var dy = 862 + (220 - total) / 2 + 36; // 설명 칸(862~1082) 안에서 세로 가운데
    paras.forEach(function (p) {
      p.forEach(function (s) { text(s, 64, dy, '400 34px ' + SANS, WHITE, 0.1); dy += 50; });
      dy += 4;
    });

    // 손글씨 메모 — 캐릭터 카드 뒷면처럼 밝은 종이 위에 캐릭터 펜 색
    var py = 1082, ph = 262;
    c.fillStyle = d.paper; c.fillRect(48, py, 984, ph);
    c.fillStyle = PEN; c.fillRect(48, py, 8, ph);
    if (memo) {
      // 메모 그림은 글 둘레에 여백이 있어서, 칸보다 크게 그리고 칸 밖은 잘라 낸다
      var mh = 330, mw = mh * memo.width / memo.height;
      c.save();
      c.beginPath(); c.rect(56, py, 760, ph); c.clip();
      c.drawImage(memo, 70, py + (ph - mh) / 2, mw, mh);
      c.restore();
    }
    if (mono) {
      // 희귀 카드와 같은 분홍 도장: UNREADABLE · 측정 불가
      c.save();
      c.translate(906, py + 150); c.rotate(-7 * Math.PI / 180);
      c.strokeStyle = '#E23BD0'; c.lineWidth = 5; c.strokeRect(-104, -46, 208, 92);
      c.lineWidth = 2; c.strokeRect(-94, -36, 188, 72);
      text('UNREADABLE', 0, -4, '700 25px ' + MONO, '#E23BD0', 2, 'center');
      text(TEXT.unreadable, 0, 26, '700 20px ' + SANS, '#E23BD0', 5, 'center');
      c.restore();
    } else {
      // ACCESS SEAL (index.html 의 도장과 같은 치수)
      (function seal(cx, cy, size, deg) {
        c.save();
        c.translate(cx, cy); c.rotate(deg * Math.PI / 180); c.scale(size / 100, size / 100); c.translate(-50, -50);
        c.globalAlpha = 0.9;
        c.strokeStyle = INK; c.fillStyle = INK;
        [[47.5, 1.6], [45.3, 0.5], [32.5, 0.5], [30.8, 1.6]].forEach(function (r) {
          c.lineWidth = r[1]; c.beginPath(); c.arc(50, 50, r[0], 0, Math.PI * 2); c.stroke();
        });
        [88.9, 11.1].forEach(function (x) { c.beginPath(); c.arc(x, 50, 1.4, 0, Math.PI * 2); c.fill(); });
        function arc(str, R, ls, top) {
          c.font = '600 5.2px ' + MONO; c.textAlign = 'left'; c.textBaseline = 'alphabetic'; c.fillStyle = INK;
          var chars = str.split(''), ws = [], total = 0, i;
          for (i = 0; i < chars.length; i++) { ws[i] = c.measureText(chars[i]).width; total += ws[i] + ls; }
          total -= ls;
          var acc = 0;
          for (i = 0; i < chars.length; i++) {
            var mid = (acc + ws[i] / 2 - total / 2) / R;
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
        c.fillStyle = INK; c.fillRect(10, 43.5, 80, 13);
        c.font = '700 7.4px ' + MONO; c.textBaseline = 'middle'; c.fillStyle = d.paper;
        var s = 'ACCESS GRANTED', chars = s.split(''), tw = 0, ws = [], i;
        for (i = 0; i < chars.length; i++) { ws[i] = c.measureText(chars[i]).width; tw += ws[i] + 0.9; }
        tw -= 0.9;
        var x = 50 - tw / 2;
        for (i = 0; i < chars.length; i++) { c.fillText(chars[i], x, 50.4); x += ws[i] + 0.9; }
        c.save();
        c.translate(40.5, 25.034); c.scale(0.079683, 0.079683); c.translate(-136.9766, -64.4922);
        c.fillStyle = INK; lotus.forEach(function (p) { c.fill(p); });
        c.restore();
        c.font = '700 6.2px ' + SANS; c.textAlign = 'center'; c.textBaseline = 'alphabetic'; c.fillStyle = INK;
        c.fillText('접속 승인', 50, 67.5);
        c.restore();
      })(908, py + 132, 196, -8);
    }

    // 아래: BINARI 워드마크 · 관리 번호
    if (mark) {
      var mwk = 210, mhk = mwk * 67.072 / 475.234; // 워드마크 SVG 의 가로세로 비
      // 워드마크(검정 글자 SVG)를 강조색으로 칠함
      var tmp = document.createElement('canvas');
      tmp.width = Math.ceil(mwk * K); tmp.height = Math.ceil(mhk * K);
      var tc = tmp.getContext('2d');
      tc.drawImage(mark, 0, 0, tmp.width, tmp.height);
      tc.globalCompositeOperation = 'source-in';
      tc.fillStyle = ACC; tc.fillRect(0, 0, tmp.width, tmp.height);
      c.drawImage(tmp, 60, 1380, mwk, mhk);
    }
    text('MAGO OS // SYNC REQUEST', 1020, 1404, '500 22px ' + MONO, GRAY, 3, 'right');

    // 바깥 테두리 + 귀퉁이
    c.strokeStyle = 'rgba(255,255,255,0.14)'; c.lineWidth = 2; c.strokeRect(1, 1, W - 2, H - 2);

    // 시연: 깨진 가로 띠 (그림을 옆으로 밀고, 검은 줄로 가림) — 글리치는 시연 결과에만
    if (mono) {
      var snap = document.createElement('canvas');
      snap.width = cv.width; snap.height = cv.height;
      snap.getContext('2d').drawImage(cv, 0, 0);
      // [세로 위치, 두께, 옆으로 미는 거리, 왼쪽 끝, 오른쪽 끝] — 식별 줄 · 설명 · 메모 글자는 건드리지 않음
      var bands = [[236, 12, 34, 0, W], [318, 20, -44, 0, W], [466, 10, 56, 0, W], [624, 22, -30, 540, W], [716, 12, 48, 540, W], [812, 10, -26, 0, W], [1056, 8, 30, 0, W]];
      bands.forEach(function (b) {
        c.fillStyle = '#0A0C0D'; c.fillRect(b[3], b[0], b[4] - b[3], b[1]);
        try {
          c.drawImage(snap, Math.round(b[3] * K), Math.round(b[0] * K), Math.round((b[4] - b[3]) * K), Math.round(b[1] * K), b[3] + b[2], b[0], b[4] - b[3], b[1]);
        } catch (e) {}
      });
      c.fillStyle = '#050607';
      [[700, 286, 250, 12], [600, 452, 330, 10], [640, 760, 260, 10]].forEach(function (r) { c.fillRect(r[0], r[1], r[2], r[3]); });
      c.fillStyle = 'rgba(213,217,219,0.75)';
      [[440, 250, 170, 4], [780, 690, 200, 4]].forEach(function (r) { c.fillRect(r[0], r[1], r[2], r[3]); });
    }
    return cv;
  }

  // ── 저장 방식: 내려받기가 되는 브라우저는 버튼, 아니면(아이폰 · 인앱) 길게 눌러 저장. 부스에서는 저장 없음 ──
  var ua = navigator.userAgent || '';
  var isIOS = /iPhone|iPad|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  var canDownload = ('download' in document.createElement('a')) && !isIOS && !B.inApp;
  var cardImg = $('sy-card-img'), saveBtn = $('sy-save'), hint = $('sy-hint');
  var blobUrl = '', fileName = 'BINARI_SYNC.png', seq = 0;

  function showResult(key, fresh) {
    var d = D[key], my = ++seq;
    view('result');
    root.setAttribute('data-decoder', key);
    views.result.classList.toggle('is-anomaly', !!d.anomaly);
    views.result.setAttribute('data-state', 'drawing');
    $('sy-file-title').textContent = TEXT.file + d.ko;
    $('sy-file-text').textContent = d.file;
    $('sy-leave').textContent = relicPending() ? TEXT.collect : TEXT.home;
    saveBtn.hidden = true; hint.hidden = true;
    fileName = 'BINARI_SYNC_' + d.en + '.png';
    if (fresh) sfx(d.anomaly ? 'secret' : 'result');

    var sample = TEXT.head + TEXT.headSub + TEXT.headAnomaly + d.ko + d.en + d.line + d.no + d.obang + d.cls + d.hz + d.desc.join('') + TEXT.rows.join('') + '접속 승인측정 불가0123456789';
    return Promise.all([
      fontsReady(sample),
      loadImage('assets/sync/' + key + '.webp'),
      loadImage('assets/sync/memo-' + key + '.v2.webp'),
      loadImage('assets/binari-wordmark.svg')
    ]).then(function (r) {
      if (my !== seq) return;
      var cv = draw(key, r[1], r[2], r[3]);
      var url = cv.toDataURL('image/png');
      cardImg.src = url;
      cardImg.alt = d.ko + ' — ' + d.line;
      var ghosts = views.result.querySelectorAll('.sy-ghost');
      for (var i = 0; i < ghosts.length; i++) ghosts[i].src = d.anomaly ? url : '';
      views.result.setAttribute('data-state', 'ready');
      if (B.booth) return;
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
    a.href = blobUrl || cardImg.src;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    sfx('tap');
  });

  $('sy-start').addEventListener('click', function () { sfx('tap'); begin(); });
  $('sy-again').addEventListener('click', function () { sfx('tap'); begin(); });

  // 결과 카드를 닫을 때: 첫 완료라면 홈 대신 인벤토리로 가서 "회수 기록 해제" 연출을 보여 준다 (한 번만)
  function leave(ev) {
    if (root.getAttribute('data-view') !== 'result' || !relicPending()) return;
    ev.stopPropagation();
    sfx('tap');
    B.go('inventory');
  }
  var leaveBtns = root.querySelectorAll('#sy-leave, .chat-head .back');
  for (var lb = 0; lb < leaveBtns.length; lb++) leaveBtns[lb].addEventListener('click', leave);

  // 화면에 들어올 때: 이미 결과가 있으면 그 결과부터, 없으면 시작 화면
  function open() {
    token++;
    var d = saved();
    if (d) showResult(d, false); else view('intro');
  }
  function close() { token++; seq++; }
  document.addEventListener('binari:screen', function (ev) { if (ev.detail === 'sync') open(); else close(); });
  if (document.body.getAttribute('data-screen') === 'sync') open();

  // ── 캡처 · 점검용 ──
  var api = B.sync = {
    judge: judge,
    result: function () { return saved(); },
    name: function () { var d = saved(); return d ? D[d].ko + (D[d].anomaly ? ' · ' + TEXT.unreadable : '') : ''; },
    debug: function (name, arg) {
      token++;
      if (name === 'intro') { view('intro'); return; }
      if (name === 'scan') { // arg = 몇 번째 질문 (1부터)
        api._fixed = true;
        var n = Math.max(1, Math.min(Q.length, arg || 1));
        picks = []; for (var i = 0; i < n - 1; i++) picks.push('ara');
        setProgress(n - 1); view('scan'); ask(n - 1);
        return;
      }
      if (name === 'broken') { view('scan'); ask(Q.length - 1); setProgress(Q.length, true); return; }
      if (name === 'result') return showResult(D[arg] ? arg : 'ara', false);
    }
  };
})();
