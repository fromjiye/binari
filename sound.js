/* BINARI · 소리 — 효과음은 전부 코드로 합성 (Web Audio, 음원 파일 없음)
   기본은 꺼짐. 스피커 버튼을 탭해야 켜지고, 켜고 끈 상태는 그 폰에 저장된다.
   작고 짧고 부드러운 HUD 톤만 쓴다. */
(function () {
  'use strict';

  var B = window.BINARI;
  if (!B) return;
  var CFG = window.BINARI_CONFIG || {};
  var KEY = 'binari.sound.v1';
  var BASE = 444; // 아라 공명 주파수. 굿판의 음은 모두 이 음에서 쌓는다

  var pref = { sfx: false, bgm: false };
  try {
    var saved = JSON.parse(localStorage.getItem(KEY));
    if (saved) { pref.sfx = !!saved.sfx; pref.bgm = !!saved.bgm; }
  } catch (e) {}
  function savePref() { try { localStorage.setItem(KEY, JSON.stringify(pref)); } catch (e) {} }

  var ctx = null, master = null, noiseBuf = null;

  function ensure() {
    if (!ctx) {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      try { ctx = new AC(); } catch (e) { return null; }
      master = ctx.createGain();
      master.gain.value = 0.5;
      master.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') { try { ctx.resume(); } catch (e) {} }
    return ctx;
  }

  // 한 음: 살짝 부풀었다가 부드럽게 사라짐
  function tone(o) {
    if (!ctx) return;
    var t = ctx.currentTime + (o.at || 0);
    var osc = ctx.createOscillator(), g = ctx.createGain();
    osc.type = o.type || 'sine';
    osc.frequency.setValueAtTime(o.f, t);
    if (o.f2) osc.frequency.exponentialRampToValueAtTime(o.f2, t + o.dur);
    var a = o.attack || 0.008;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(o.g || 0.05, t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + a + o.dur);
    osc.connect(g); g.connect(master);
    osc.start(t); osc.stop(t + a + o.dur + 0.03);
  }

  function noise(o) {
    if (!ctx) return;
    if (!noiseBuf) {
      noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 0.5, ctx.sampleRate);
      var d = noiseBuf.getChannelData(0);
      for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    var t = ctx.currentTime + (o.at || 0);
    var src = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    src.buffer = noiseBuf;
    f.type = o.type || 'bandpass';
    f.frequency.value = o.f || 1500;
    f.Q.value = o.q || 1.2;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(o.g || 0.05, t + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, t + o.dur);
    src.connect(f); f.connect(g); g.connect(master);
    src.start(t); src.stop(t + o.dur + 0.03);
  }

  // 콤보가 오를수록 한 칸씩 높아지는 음계 (444Hz 기준)
  var SCALE = [1, 9 / 8, 5 / 4, 3 / 2, 5 / 3, 2, 9 / 4, 5 / 2, 3, 10 / 3, 4];

  var SFX = {
    // ── 지금까지 만든 화면 ──
    tick: function () { tone({ f: 1560, dur: 0.03, g: 0.03 }); },                              // 부팅 로그
    seal: function () {                                                                       // ACCESS SEAL "쿵"
      tone({ f: 124, f2: 52, dur: 0.24, g: 0.2 });
      noise({ type: 'lowpass', f: 420, dur: 0.09, g: 0.07 });
    },
    tap: function () { tone({ f: 620, type: 'triangle', dur: 0.045, g: 0.045 }); },            // 버튼
    choice: function () { tone({ f: 523, type: 'triangle', dur: 0.05, g: 0.05 }); },           // 선택지
    msg: function () {                                                                        // 메신저 도착
      tone({ f: 880, dur: 0.07, g: 0.04 });
      tone({ f: 1174, dur: 0.1, g: 0.035, at: 0.07 });
    },
    hack: function () {                                                                       // 벼리 해킹: 지직 + "띠롱"(808Hz)
      noise({ f: 1900, q: 2, dur: 0.07, g: 0.055 });
      noise({ f: 2600, q: 2, dur: 0.06, g: 0.05, at: 0.1 });
      noise({ f: 1400, q: 2, dur: 0.09, g: 0.05, at: 0.2 });
      tone({ f: 808, dur: 0.13, g: 0.06, at: 0.36 });
      tone({ f: 1212, dur: 0.26, g: 0.055, at: 0.48 });
    },

    // ── 굿판 ──
    perfect: function () { [1, 5 / 4, 3 / 2, 2].forEach(function (r, i) { tone({ f: BASE * r, dur: 0.26, g: 0.05, at: i * 0.055 }); }); },
    good: function () { tone({ f: BASE, dur: 0.18, g: 0.05 }); tone({ f: BASE * 1.5, dur: 0.22, g: 0.04, at: 0.07 }); },
    miss: function () { tone({ f: 196, dur: 0.1, g: 0.04 }); },
    lock: function () { [1, 5 / 4, 3 / 2].forEach(function (r) { tone({ f: BASE * r, dur: 1.0, g: 0.04, attack: 0.12 }); }); }, // 주파수 포착
    solve: function () { [1, 5 / 4, 3 / 2, 2, 5 / 2].forEach(function (r, i) { tone({ f: BASE * r, type: 'triangle', dur: 0.34, g: 0.04, at: i * 0.075 }); }); },
    hit: function (combo) { tone({ f: BASE * SCALE[Math.max(0, Math.min(SCALE.length - 1, (combo || 1) - 1))], dur: 0.12, g: 0.05 }); },
    wrong: function () { tone({ f: 208, type: 'triangle', dur: 0.07, g: 0.035 }); },
    unclass: function () { tone({ f: 300, dur: 0.04, g: 0.035 }); tone({ f: 300, dur: 0.04, g: 0.035, at: 0.09 }); }, // 분류 불가
    pass: function () { tone({ f: 222, dur: 0.6, g: 0.05, attack: 0.02 }); tone({ f: 333, dur: 0.5, g: 0.03, at: 0.06 }); }, // 흑귀를 흘려보냄
    rootReady: function () { tone({ f: BASE * 2, dur: 0.12, g: 0.04 }); tone({ f: BASE * 3, dur: 0.18, g: 0.035, at: 0.09 }); },
    root: function () {                                                                       // ROOT ACCESS 발동
      [0.5, 1, 5 / 4, 3 / 2, 2].forEach(function (r) { tone({ f: BASE * r, dur: 1.5, g: 0.04, attack: 0.16 }); });
      noise({ type: 'highpass', f: 5200, q: 0.7, dur: 0.9, g: 0.02 });
    },
    stage: function () { tone({ f: BASE, dur: 0.14, g: 0.04 }); },
    result: function () { [1, 3 / 2, 2].forEach(function (r, i) { tone({ f: BASE * r, dur: 0.3, g: 0.045, at: i * 0.09 }); }); }
  };

  // ── 공명: 실제 444Hz 음과, 바늘 위치를 따라 흔들리는 음. 맞추면 화음으로 맞물림 ──
  var hum = null;
  var humApi = {
    start: function () {
      humApi.stop();
      if (!pref.sfx || !ensure()) return;
      var a = ctx.createOscillator(), b = ctx.createOscillator(), g = ctx.createGain();
      a.frequency.value = BASE; b.frequency.value = BASE;
      g.gain.setValueAtTime(0.0001, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.03, ctx.currentTime + 0.4);
      a.connect(g); b.connect(g); g.connect(master);
      a.start(); b.start();
      hum = { a: a, b: b, g: g };
    },
    set: function (freq) { if (hum && ctx) hum.b.frequency.setTargetAtTime(freq, ctx.currentTime, 0.02); },
    stop: function (lock) {
      if (!hum || !ctx) { hum = null; return; }
      var h = hum, t = ctx.currentTime;
      hum = null;
      if (lock) h.b.frequency.setTargetAtTime(BASE * 1.5, t, 0.03); // 화음으로 맞물림
      h.g.gain.setTargetAtTime(0.0001, t + (lock ? 0.5 : 0), 0.12);
      try { h.a.stop(t + 1.4); h.b.stop(t + 1.4); } catch (e) {}
    }
  };

  function play(name, arg) {
    if (!pref.sfx || !SFX[name]) return;
    if (!ensure() || ctx.state !== 'running') return;
    try { SFX[name](arg); } catch (e) {}
  }

  // ── BGM 자리: config.js 의 bgm 에 파일 주소를 넣으면 버튼이 나타난다 ──
  var bgmEl = null;
  function bgmApply() {
    if (!CFG.bgm) return;
    if (pref.bgm) {
      if (!bgmEl) {
        bgmEl = new Audio(CFG.bgm);
        bgmEl.loop = true;
        bgmEl.volume = 0.35;
      }
      var p = bgmEl.play();
      if (p && p.catch) p.catch(function () {});
    } else if (bgmEl) {
      bgmEl.pause();
    }
  }

  // ── 버튼 (화면마다 있는 스피커 · BGM 버튼을 한꺼번에 맞춤) ──
  function syncButtons() {
    var i, list = document.querySelectorAll('[data-sound]');
    for (i = 0; i < list.length; i++) {
      list[i].setAttribute('aria-pressed', pref.sfx ? 'true' : 'false');
      list[i].setAttribute('aria-label', pref.sfx ? '효과음 끄기' : '효과음 켜기');
    }
    list = document.querySelectorAll('[data-bgm]');
    for (i = 0; i < list.length; i++) {
      list[i].hidden = !CFG.bgm;
      list[i].setAttribute('aria-pressed', pref.bgm ? 'true' : 'false');
      list[i].setAttribute('aria-label', pref.bgm ? '배경 음악 끄기' : '배경 음악 켜기');
    }
  }

  document.addEventListener('click', function (ev) {
    var t = ev.target && ev.target.closest ? ev.target.closest('[data-sound],[data-bgm]') : null;
    if (!t) return;
    ev.stopPropagation();
    if (t.hasAttribute('data-sound')) {
      pref.sfx = !pref.sfx;
      if (pref.sfx) { ensure(); setTimeout(function () { play('tap'); }, 60); }
      else humApi.stop();
    } else {
      pref.bgm = !pref.bgm;
      bgmApply();
    }
    savePref();
    syncButtons();
  }, true);

  // 켜 둔 채로 다시 들어온 경우: 브라우저는 첫 탭 전에는 소리를 못 내므로 첫 탭에서 깨움
  function wake() {
    if (pref.sfx) ensure();
    bgmApply();
    document.removeEventListener('pointerdown', wake, true);
  }
  document.addEventListener('pointerdown', wake, true);

  B.sound = {
    play: play,
    hum: humApi,
    isOn: function () { return pref.sfx; }
  };
  syncButtons();
})();
