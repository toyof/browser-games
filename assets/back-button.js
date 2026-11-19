// 「← トップへ」ボタン。各ゲームの </body> 前で読み込む。
// 誤タップ防止: 1回目のタップで「もう一度押すと戻る」に変わり、2.5秒以内にもう一度押すと遷移する。
(function () {
  var b = document.createElement('button');
  var label = '← トップへ';
  var armed = false, timer = null;
  b.textContent = label;
  b.setAttribute('aria-label', 'トップへ戻る');
  b.style.cssText =
    'position:fixed;top:8px;left:8px;z-index:99999;padding:8px 12px;font:bold 13px/1 monospace;' +
    'color:#cde;background:rgba(10,12,30,.8);border:1px solid #58c;border-radius:8px;cursor:pointer;' +
    'touch-action:manipulation;';
  b.addEventListener('click', function (e) {
    e.stopPropagation();
    if (armed) { location.href = '../index.html'; return; }
    armed = true;
    b.textContent = 'もう一度押すと戻る';
    b.style.background = 'rgba(160,40,60,.9)';
    clearTimeout(timer);
    timer = setTimeout(function () {
      armed = false; b.textContent = label; b.style.background = 'rgba(10,12,30,.8)';
    }, 2500);
  });
  // ボタン上の操作がゲーム側(キー/ポインタ)に漏れないようにする
  ['pointerdown', 'pointerup', 'mousedown', 'touchstart'].forEach(function (t) {
    b.addEventListener(t, function (e) { e.stopPropagation(); });
  });
  b.addEventListener('keydown', function (e) { e.stopPropagation(); });
  document.body.appendChild(b);
})();
