# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 概要

ブラウザで遊べるミニゲーム集。**ビルド・依存管理・テスト・Lint は無し**の静的HTML(GitHub Pages で公開、`.nojekyll` あり)。
各ゲームは `<dir>/index.html` 1ファイルに HTML/CSS/JS が全部入っている。

実行: `python3 -m http.server` でルートを配信するか、`index.html` を直接開く(`file://` でも動く)。

## 構成

- `index.html` — ポータル(カード一覧、星空、ワープ遷移)。ゲームを追加したらここにカードを足す。
  ハイスコアは各ゲームが `localStorage` に保存し、ポータルが `data-hi` の key で読んでバッジ表示する
  (`suikaHi` / `lr_stage_best` / `spaceShooterHi` / `taikoHi` / `doodleDone`)。key を変えるとバッジが壊れる。
- `assets/back-button.js` — 全ゲーム共通の「← トップへ」ボタン(各ゲームの `</body>` 前で読み込む)。
  `position:fixed` で左上に出るので、**ゲーム側のUIと重ならない余白を確保する**こと。
- ゲーム: `suika/`(Planet Merge、Matter.js を CDN から読込) / `car/`(ラインロード) / `space/`(Space Shooter) /
  `dance/`(Taiko Beat) / `paint/`(Doodle Lab、仕様は `paint/REQUIREMENTS.md`)
- 音は全て Web Audio で合成(音源ファイル無し)。例外を作る場合は出典・ライセンスを README に書く。

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

- `car/`: 物理は固定刻み(`STEP=1/60`)。速度ボタンやリフレッシュレートで結果が変わらないようにしてある。刻みは変えない。
- `dance/`: 譜面は `buildChart()` が BPM 基準でコード生成(難易度は `LEVELS`)。曲は `scheduleSong()` が合成。
  判定時刻は `songTime()`(AudioContext 基準)で、描画・判定・音が同じ時計を共有する。
