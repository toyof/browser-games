---
name: new-game
description: Scaffold a new browser game and register it on the Game Station portal
disable-model-invocation: true
---

Create a new game named `$ARGUMENTS` (ask for a folder name, title, emoji, theme colour and one-line Japanese description if not given).

1. Create `<folder>/index.html`: single self-contained file, `<html lang="ja">`, viewport meta, dark space theme matching other games (`#05060f`, monospace). Wrap all localStorage use in try/catch. Load `<script src="../assets/back-button.js"></script>` just before `</body>`.
2. In the root `index.html`, add a card (copy the format of an existing one) with `--c` colour, emoji in `.planet`, `.name`, `.desc`, and a `.badge` with `data-hi` set to the game's localStorage key and a `data-fmt`. Place it before the "Coming Soon" card; if the grid would have no placeholder left, keep one.
3. Add a `.card:nth-child(n) .planet { animation-delay }` rule if the new card index lacks one.
4. Verify by serving locally (`python3 -m http.server`) and checking the page loads without console errors.
