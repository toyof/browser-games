# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 概要

ブラウザで遊べるミニゲーム集。**ビルド・依存管理・テスト・Lint は無し**の静的HTML(GitHub Pages で公開、`.nojekyll` あり)。
各ゲームは `<dir>/index.html` 1ファイルに HTML/CSS/JS が全部入っている。

実行: `python3 -m http.server` でルートを配信して開く。`dance/` は曲を `fetch` するため `file://` では動かない(他のゲームは動く)。

## 構成

- `index.html` — ポータル(カード一覧、星空、ワープ遷移)。ゲームを追加したらここにカードを足す。
  ハイスコアは各ゲームが `localStorage` に保存し、ポータルが `data-hi` の key で読んでバッジ表示する
  (`suikaHi` / `lr_stage_best` / `spaceShooterHi` / `taikoHi` / `doodleDone` / `bubbleHi` /
  `tubesBest` / `parkingBest` / `tangleBest` / `dripBest` / `pinBest` / `hopBest`)。key を変えるとバッジが壊れる。
- `assets/back-button.js` — 全ゲーム共通の「← トップへ」ボタン(各ゲームの `</body>` 前で読み込む)。
  `position:fixed` で左上に出るので、**ゲーム側のUIと重ならない余白を確保する**こと。
- ゲーム: `suika/`(Planet Merge、Matter.js を CDN から読込) / `car/`(ラインロード) / `space/`(Space Shooter) /
  `dance/`(Taiko Beat) / `paint/`(Doodle Lab、仕様は `paint/REQUIREMENTS.md`) /
  `bubble/`(Nebula Pop、バブルシューターのエンドレス版。物理エンジン無しのヘックスグリッド自作) /
  `tubes/`(Color Tubes、試験管ソート) / `parking/`(Parking Out、駐車場脱出) / `tangle/`(Tangle Free、ロープほどき) /
  `drip/`(Drip Line、線を描いて水をカップへ。Matter.js) / `pin/`(Pin Flow、ピン抜き。粒子シミュレーション自作)。
  `hop/`(Orbit Hop、軌道を回る点を接線方向へ発射して次の惑星へ。固定刻み `STEP=1/120`、`__game.auto()` で先読み自動プレイ)。
  パズル5本と hop は仕様を各 `REQUIREMENTS.md` に書いてある
- `assets/audio-unlock.js` — スマホで音を出す共通対策(iOS は touchend/click で resume が必要、マナースイッチ対策)。音を出すゲームは `<head>` で読み込む。
- 音は基本 Web Audio で合成。例外は `dance/songs/*.mp3`(FreePD.com の CC0/Public Domain 曲)。音源を足す場合は出典・ライセンスを README に書く。

## スマホ対応のルール

- viewport は全ゲーム設定済み。高さは `100vh` でなく `100dvh` を使う(モバイルのアドレスバー対策)。
- 入力は `pointer*` イベントに統一(`touch-action:none` で スクロール/ズームを抑止)。座標は
  `getBoundingClientRect()` で canvas 内座標に変換する(CSS 縮小時もずれないように)。
- **一番大事なボタン(スタート等の主操作)は画面の右側に置く**(右手で押しやすくするため)。
  `car/` のスマホ版は `#side` を `row-reverse` にして「スタート」を右にしている。新規UIも同じ方針にする。
- スマホ幅の切替は `@media (max-width:700px)`(paint は 800px)。canvas の縮尺を JS で決めているゲーム
  (`car/` の `fit()`)は CSS だけでなく JS 側の分岐も直す。
- 見た目の確認は Playwright(プリインストール)で 375×667(縦)/ 667×375(横)を撮影して行う。
  `suika/` は Matter.js の CDN に依存するため、CDN に届かない環境では空白になる。

## ゲーム固有の注意

- パズル5本(`tubes` `parking` `tangle` `drip` `pin`)は同じ骨組み: 400×700 の canvas を縦長表示、ボタンは canvas 内に描画
  (`btn()` で描画とクリック判定の登録を同時に行う)、タイトルの ◀▶ でクリア済み+1 までのステージを選べる。
  テスト用に `window.__game` を公開している(`drip` / `pin` の `run()` は想定解でシミュレーションして結果を返す)。
- `tubes` / `parking` / `tangle` のステージはステージ番号を種にした自動生成。生成ロジックを変えると既存ステージの中身が変わる。
- `drip` / `pin` のステージは手作り。ステージや物理の値を変えたら、想定解(`sol`)でクリアでき、
  `drip` は線なしで失敗、`pin` は間違った順で失敗することを `__game.run()` で確かめる(調整メモは各 REQUIREMENTS.md)。

- `car/`: 物理は固定刻み(`STEP=1/60`)。速度ボタンやリフレッシュレートで結果が変わらないようにしてある。刻みは変えない。
- `dance/`: 曲は `songs/*.mp3`、譜面は `songs/songs.js`(**自動生成物。手で編集しない**)。
  `python3 dance/tools/build_songs.py <元mp3のdir>` が BPM 固定グリッド上に曲の音の強さから譜面を作る(要 numpy/librosa/ffmpeg)。
  曲を足すときは `build_songs.py` の `SONGS` に BPM とオフセット(最初の拍の秒)を追加して再生成する。
  判定時刻は `songTime()`(AudioContext 基準)で、描画・判定・曲・ヒット音(ドン=左/カッ=右、合成)が同じ時計を共有する。
