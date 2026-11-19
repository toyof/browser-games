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

  var el = null;
  function unlock() {
    try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) {}
    list.forEach(function (c) { if (c.state !== 'running') { try { c.resume(); } catch (e) {} } });
    if (!el) {
      try {
        el = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=');
        el.loop = true; el.setAttribute('playsinline', '');
        var p = el.play(); if (p && p.catch) p.catch(function () { el = null; });
      } catch (e) { el = null; }
    }
  }
  ['touchend', 'pointerup', 'click', 'keydown'].forEach(function (t) {
    addEventListener(t, unlock, { capture: true, passive: true });
  });
})();
