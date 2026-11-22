// スマホで音が出ない問題の対策。各ゲームの <head> で、ゲームのスクリプトより先に読み込む。
// - iOS Safari は pointerdown では音の再生が解除されない。touchend/click/keydown の中で AudioContext を resume する。
// - iOS はマナースイッチがオンだと Web Audio が無音になる。無音の <audio> を再生して「再生中」扱いにすると鳴る。
// ゲーム側が new AudioContext() したものを自動で追跡するので、ゲーム側の修正は不要。
(function () {
  var Orig = window.AudioContext || window.webkitAudioContext;
  if (!Orig) return;
  var list = [];
  function Patched(a, b) { var c = new Orig(a, b); list.push(c); return c; }
  Patched.prototype = Orig.prototype;
  window.AudioContext = Patched; window.webkitAudioContext = Patched;

  // 0.5秒の無音 WAV(8kHz/8bit/モノラル)を生成する。
  // 注意: データ長0の WAV を loop 再生すると、先頭へのシークが毎秒数万回発生して
  // CPU を使い切り、ページが固まる・メモリが増え続ける。必ず長さのある音声にすること。
  function silentWavUrl() {
    var n = 4000, b = new Uint8Array(44 + n), v = new DataView(b.buffer);
    function str(o, s) { for (var i = 0; i < s.length; i++) b[o + i] = s.charCodeAt(i); }
    str(0, 'RIFF'); v.setUint32(4, 36 + n, true); str(8, 'WAVE');
    str(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
    v.setUint32(24, 8000, true); v.setUint32(28, 8000, true); v.setUint16(32, 1, true); v.setUint16(34, 8, true);
    str(36, 'data'); v.setUint32(40, n, true);
    b.fill(128, 44); // 8bit PCM の無音は 128
    return URL.createObjectURL(new Blob([b], { type: 'audio/wav' }));
  }

  // 無音ループが必要なのは「iOS で、audioSession API が無い古い版」だけ。
  // PC/Android/新しい iOS では不要で、iPhone で聴いている音楽を止めてしまう副作用もあるため流さない。
  var isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  var needSilentLoop = isIOS && !navigator.audioSession;

  var el = null;
  function unlock() {
    try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) {}
    list.forEach(function (c) { if (c.state !== 'running') { try { c.resume(); } catch (e) {} } });
    if (needSilentLoop && !el) {
      try {
        el = new Audio(silentWavUrl());
        el.loop = true; el.setAttribute('playsinline', '');
        var p = el.play(); if (p && p.catch) p.catch(function () { el = null; });
      } catch (e) { el = null; }
    }
  }
  ['touchend', 'pointerup', 'click', 'keydown'].forEach(function (t) {
    addEventListener(t, unlock, { capture: true, passive: true });
  });
})();
