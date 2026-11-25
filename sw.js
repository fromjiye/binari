/* BINARI · 오프라인 동작 (서비스 워커)
   첫 방문 때 사이트 파일을 전부 받아 두고, 그 뒤로는 인터넷이 끊겨도 받아 둔 것으로 연다.
   새 버전을 올리면 인터넷이 연결됐을 때 자동으로 새 파일로 바뀐다 (옛 버전에 갇히지 않음).

   규칙
   · 첫 화면(index.html) : 인터넷에서 먼저 받아 봄 → 안 되거나 너무 느리면 받아 둔 것
   · ?v=숫자 가 붙은 JS · CSS : 받아 둔 것을 그대로 씀 (버전이 바뀌면 주소가 바뀌어 새로 받음)
   · 그림 · 대사 데이터 : 받아 둔 것을 바로 쓰고, 뒤에서 새것이 있는지 확인해 갈아 둠
   · 폰트(Google Fonts) : 받아 둔 것을 씀. 사이트 글에 쓰인 글자의 폰트 조각을 미리 받아 둠 */

var CACHE = 'binari-site-v1';
var FONTS = 'binari-fonts-v1';
var INDEX = new URL('./', self.registration.scope).href;
var NET_TIMEOUT = 3500; // 첫 화면을 인터넷에서 기다리는 시간(ms). 넘으면 받아 둔 것으로 연다

// HTML이 직접 부르지 않는 파일 (그림 · 대사 데이터). 파일을 추가하면 여기에도 적는다
var ASSETS = [
  'assets/access-seal.svg',
  'assets/binari-wordmark.svg',
  'assets/mago-lotus.svg',
  'assets/decoder/ara-bust.webp',
  'assets/decoder/ara-face.webp',
  'assets/decoder/byeori-bust.webp',
  'assets/decoder/byeori-face.webp',
  'assets/decoder/mujin-face.webp',
  'assets/decoder/doun-face.webp',
  'assets/decoder/geon-face.webp',
  'assets/decoder/doodle-01-spooked.png',
  'assets/decoder/doodle-02-smug.png',
  'assets/decoder/doodle-03-wink.png',
  'assets/decoder/doodle-05-puzzled.png',
  'data/decoder.json',
  'assets/relic/relic-01.webp',
  'assets/relic/relic-02.webp',
  'assets/relic/relic-03.webp',
  'assets/relic/relic-04.webp',
  'assets/relic/relic-05.webp',
  'assets/relic/relic-06.webp'
].map(abs);

function abs(path) { return new URL(path, self.registration.scope).href; }
function isFont(url) { return url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com'; }
function isVersioned(url) { return /[?&]v=/.test(url.search); }

// index.html 이 부르는 같은 사이트 파일(JS · CSS · 아이콘)과 폰트 CSS 주소를 뽑는다
function refsOf(html) {
  var out = { files: [], fontCss: [] }, m, re = /(?:src|href)="([^"]+)"/g;
  while ((m = re.exec(html))) {
    var ref = m[1].replace(/&amp;/g, '&');
    if (/^(#|data:|mailto:|kakaotalk:)/.test(ref)) continue;
    var u;
    try { u = new URL(ref, INDEX); } catch (e) { continue; }
    if (u.hostname === 'fonts.googleapis.com' && u.pathname.indexOf('/css') === 0) out.fontCss.push(u.href);
    else if (u.origin === self.location.origin && /\.(js|css|svg|png|webp|json)$/.test(u.pathname)) out.files.push(u.href);
  }
  return out;
}

function putAll(cache, urls, opts) {
  return Promise.all(urls.map(function (url) {
    return cache.match(url).then(function (hit) {
      if (hit && !(opts && opts.refresh)) return;
      return fetch(url, { cache: 'no-cache' }).then(function (res) {
        if (res && res.ok) return cache.put(url, res);
      });
    }).catch(function () {});
  }));
}

// 받아 온 새 index.html 을 기준으로: 필요한 파일을 모두 받아 두고, 지난 버전 파일은 지운다
function syncFrom(html) {
  var refs = refsOf(html);
  return caches.open(CACHE).then(function (cache) {
    return putAll(cache, refs.files)
      .then(function () { return putAll(cache, ASSETS, { refresh: true }); })
      .then(function () { return cache.keys(); })
      .then(function (keys) {
        var keep = {};
        keep[INDEX] = true;
        refs.files.concat(ASSETS).forEach(function (u) { keep[u] = true; });
        return Promise.all(keys.map(function (req) {
          // 지금 index.html 이 더는 부르지 않는 ?v= 파일 = 지난 버전
          if (!keep[req.url] && isVersioned(new URL(req.url))) return cache.delete(req);
        }));
      });
  }).then(function () { return warmFonts(html, refs.fontCss); });
}

// ── 폰트: 사이트 글에 실제로 쓰인 글자가 들어 있는 조각만 미리 받아 둔다 ──
function inRanges(ranges, used) {
  for (var i = 0; i < ranges.length; i++) {
    var r = ranges[i];
    for (var j = 0; j < used.length; j++) if (used[j] >= r[0] && used[j] <= r[1]) return true;
  }
  return false;
}
function parseRanges(text) {
  var out = [];
  text.split(',').forEach(function (part) {
    var m = /U\+([0-9A-F?]+)(?:-([0-9A-F]+))?/i.exec(part);
    if (!m) return;
    if (m[1].indexOf('?') >= 0) out.push([parseInt(m[1].replace(/\?/g, '0'), 16), parseInt(m[1].replace(/\?/g, 'F'), 16)]);
    else out.push([parseInt(m[1], 16), parseInt(m[2] || m[1], 16)]);
  });
  return out;
}
function warmFonts(html, cssUrls) {
  if (!cssUrls.length) return Promise.resolve();
  var texts = [html];
  return caches.open(CACHE).then(function (site) {
    // 사이트의 글이 들어 있는 파일들 (화면에 나오는 글자를 모으려고)
    return site.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return /\.(js|json)(\?|$)/.test(k.url); }).map(function (k) {
        return site.match(k).then(function (res) { return res ? res.text() : ''; }).then(function (t) { texts.push(t); });
      }));
    });
  }).then(function () {
    var seen = {}, used = [];
    texts.join('').split('').forEach(function (ch) {
      var c = ch.charCodeAt(0);
      if (!seen[c]) { seen[c] = true; used.push(c); }
    });
    return caches.open(FONTS).then(function (fonts) {
      return Promise.all(cssUrls.map(function (cssUrl) {
        return fetch(cssUrl).then(function (res) {
          if (!res.ok) throw new Error('font css');
          fonts.put(cssUrl, res.clone());
          return res.text();
        }).then(function (css) {
          var want = [], block, re = /@font-face\s*\{([^}]*)\}/g;
          while ((block = re.exec(css))) {
            var src = /url\((https:[^)]+)\)/.exec(block[1]);
            if (!src) continue;
            var ur = /unicode-range:\s*([^;]+)/.exec(block[1]);
            if (!ur || inRanges(parseRanges(ur[1]), used)) want.push(src[1]);
          }
          // 조금씩 나눠 받는다 (한꺼번에 수백 개를 열지 않게)
          var i = 0;
          function next() {
            var batch = want.slice(i, i + 8);
            i += 8;
            if (!batch.length) return;
            return Promise.all(batch.map(function (u) {
              return fonts.match(u).then(function (hit) {
                if (hit) return;
                return fetch(u).then(function (r) { if (r.ok) return fonts.put(u, r); });
              }).catch(function () {});
            })).then(next);
          }
          return next();
        }).catch(function () {});
      }));
    });
  }).catch(function () {});
}

// ── 설치: 첫 화면과 필요한 파일을 전부 받아 둔다 ──
self.addEventListener('install', function (event) {
  event.waitUntil(
    fetch(INDEX, { cache: 'no-cache' }).then(function (res) {
      if (!res.ok) throw new Error('index');
      var copy = res.clone();
      return caches.open(CACHE).then(function (cache) { return cache.put(INDEX, copy); })
        .then(function () { return res.text(); })
        .then(function (html) {
          var refs = refsOf(html);
          return caches.open(CACHE).then(function (cache) {
            return putAll(cache, refs.files.concat(ASSETS));
          });
        });
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (names) {
      return Promise.all(names.map(function (n) {
        if (n.indexOf('binari-') === 0 && n !== CACHE && n !== FONTS) return caches.delete(n);
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

// 페이지가 열린 뒤 "폰트도 받아 둬" 라고 알려 오면 받아 둔다 (화면을 늦추지 않으려고 설치와 분리)
self.addEventListener('message', function (event) {
  if (!event.data || event.data.type !== 'warm') return;
  event.waitUntil(
    caches.open(CACHE).then(function (cache) { return cache.match(INDEX); })
      .then(function (res) { return res ? res.text() : ''; })
      .then(function (html) { return html ? warmFonts(html, refsOf(html).fontCss) : null; })
  );
});

// ── 첫 화면: 인터넷 먼저, 안 되면 받아 둔 것 ──
function navigate(event) {
  var cached = caches.open(CACHE).then(function (cache) { return cache.match(INDEX); });
  var fresh = fetch(INDEX, { cache: 'no-cache' }).then(function (res) {
    if (!res || !res.ok) throw new Error('offline');
    var forCache = res.clone(), forText = res.clone();
    event.waitUntil(
      caches.open(CACHE).then(function (cache) { return cache.put(INDEX, forCache); })
        .then(function () { return forText.text(); })
        .then(syncFrom)
        .catch(function () {})
    );
    return res;
  });
  var timeout = new Promise(function (resolve) { setTimeout(function () { resolve(null); }, NET_TIMEOUT); });

  return Promise.race([fresh.catch(function () { return null; }), timeout]).then(function (res) {
    if (res) return res;
    // 끊겼거나 너무 느림 → 받아 둔 것. 그것도 없으면 끝까지 인터넷을 기다림
    return cached.then(function (hit) { return hit || fresh; });
  });
}

function asset(event) {
  var req = event.request, url = new URL(req.url);
  return caches.open(CACHE).then(function (cache) {
    return cache.match(req).then(function (hit) {
      var update = function () {
        return fetch(req).then(function (res) {
          if (res && res.ok) cache.put(req, res.clone());
          return res;
        });
      };
      if (hit) {
        // 버전이 없는 파일(그림 · 대사)은 뒤에서 새것이 있는지 확인해 둠
        if (!isVersioned(url)) event.waitUntil(update().catch(function () {}));
        return hit;
      }
      return update().catch(function () {
        // 인터넷이 끊김: 주소의 ?v= 만 다른 것이라도 있으면 그것으로
        return cache.match(req, { ignoreSearch: true }).then(function (alt) {
          if (alt) return alt;
          throw new Error('offline');
        });
      });
    });
  });
}

function font(event) {
  var req = event.request;
  return caches.open(FONTS).then(function (cache) {
    return cache.match(req).then(function (hit) {
      if (hit) return hit;
      return fetch(req).then(function (res) {
        if (res && res.ok) cache.put(req, res.clone());
        return res;
      });
    });
  });
}

self.addEventListener('fetch', function (event) {
  var req = event.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  if (isFont(url)) { event.respondWith(font(event)); return; }
  if (url.origin !== self.location.origin) return;
  if (url.href.indexOf(self.registration.scope) !== 0) return;
  if (url.pathname.slice(-6) === '/sw.js') return;
  // 첫 화면 주소(…/binari/ 또는 …/binari/index.html, 뒤에 ?id= 등이 붙어도 같음)
  var isIndex = url.origin + url.pathname === INDEX || url.origin + url.pathname === INDEX + 'index.html';
  if (req.mode === 'navigate' && isIndex) { event.respondWith(navigate(event)); return; }
  if (req.mode === 'navigate') return; // 그 밖의 페이지는 건드리지 않음
  event.respondWith(asset(event));
});
