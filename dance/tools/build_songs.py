#!/usr/bin/env python3
"""曲の音声(mp3)から、BPM固定グリッド上の譜面を自動生成して dance/songs/*.mp3 と songs.js を書き出す。

使い方: python3 dance/tools/build_songs.py <元mp3のあるディレクトリ>
依存: numpy, librosa, ffmpeg
元音源は FreePD.com (CC0 / Public Domain)。
"""
import sys, os, json, subprocess, tempfile, warnings
import numpy as np, librosa
warnings.filterwarnings("ignore")

SRC = sys.argv[1]
OUT = os.path.join(os.path.dirname(__file__), "..", "songs")
MAX_SEC = 120          # 収録する長さの上限(小節区切りで切る)
HOP = 256
SONGS = [  # id, 元ファイル名, 表示名, BPM(解析で確定した値), 最初の拍のオフセット秒, 色
    ("funshine",   "Funshine",        "Funshine",        96.0,  0.372, "#6dff7a"),
    ("funkeriffic","Funkeriffic",     "Funkeriffic",     112.0, 0.046, "#4dc3ff"),
    ("hitnsmash",  "Hit n Smash",     "Hit n Smash",     130.0, 0.075, "#ffd24d"),
    ("rush",       "Rush",            "Rush",            150.0, 0.041, "#ff4a3d"),
]

def build(sid, fn, bpm, off):
    src = os.path.join(SRC, fn + ".mp3")
    beat = 60.0 / bpm; bar = beat * 4
    bars = int((MAX_SEC - off) // bar)
    dur = off + bars * bar
    # 配信用に再エンコード(モノラル/最大 dur 秒/終端1.5秒フェード)
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", src, "-t", f"{dur:.3f}", "-ac", "1", "-ar", "44100",
                    "-af", f"afade=t=out:st={dur-1.5:.3f}:d=1.5", "-c:a", "libmp3lame", "-b:a", "80k",
                    os.path.join(OUT, sid + ".mp3")], check=True)
    y, sr = librosa.load(src, sr=22050, mono=True, duration=dur)
    o = librosa.onset.onset_strength(y=y, sr=sr, hop_length=HOP)
    fps = sr / HOP
    # 低音/高音のバランスでドン(左)/カッ(右)を決める
    S = np.abs(librosa.stft(y, n_fft=1024, hop_length=HOP))
    fr = librosa.fft_frequencies(sr=sr, n_fft=1024)
    low = S[fr < 250].sum(0); high = S[fr >= 1500].sum(0)
    step = beat / 4                      # 16分音符
    nsteps = int((dur - off) / step)
    def at(arr, k):                      # グリッド点の前後1フレームの最大値
        i = int(round((off + k * step) * fps)); i0, i1 = max(0, i - 1), min(len(arr), i + 2)
        return arr[i0:i1].max() if i1 > i0 else 0
    st = np.array([at(o, k) for k in range(nsteps)])
    st = st / (np.percentile(st, 95) + 1e-9)
    lo = np.array([at(low, k) for k in range(nsteps)]); hi = np.array([at(high, k) for k in range(nsteps)])
    don = (lo / (lo.max() + 1e-9)) > (hi / (hi.max() + 1e-9)) * 1.0
    # レベル: (許可グリッド, しきい値, 連打数)
    LV = [(8, 0.45, 0), (4, 0.40, 2), (2, 0.55, 3), (1, 0.55, 4)]   # 鬼は16分(奇数位置)だけ別しきい値
    levels = []
    for gridn, thr, nroll in LV:
        notes = []
        for k in range(8 * 4, nsteps - 4 * 4):          # 最初の8拍(2小節)と最後の4拍は休み
            if k % gridn: continue
            on_beat = k % 4 == 0
            # 拍頭は少し甘く(リズムの背骨を残す)、裏拍/16分は強いオンセットだけ
            if st[k] >= (thr * (0.6 if on_beat else 1.0) * (1.1 if (gridn == 1 and k % 2) else 1.0)):
                notes.append(k)
        # 連打: 2拍(8step)窓のうち強いオンセットが密集する所
        rolls = []
        if nroll:
            win = 8; cand = []
            for k in range(8 * 4, nsteps - 4 * 8, 4):
                cand.append((st[k:k + win].sum(), k))
            cand.sort(reverse=True)
            for sc, k in cand:
                if len(rolls) >= nroll: break
                if all(abs(k - r) >= 16 * 4 for r in rolls) and k % 4 == 0: rolls.append(k)
            rolls.sort()
        rs = set()
        for r in rolls:
            for j in range(r - 2, r + win + 4): rs.add(j)
        notes = [k for k in notes if k not in rs]
        levels.append({"n": [[int(k), int(0 if don[k] else 1)] for k in notes], "r": [[int(r), 8] for r in rolls]})
    return {"id": sid, "bpm": bpm, "offset": off, "bars": bars, "dur": round(dur, 3), "levels": levels}

if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    meta = []
    for sid, fn, title, bpm, off, color in SONGS:
        d = build(sid, fn, bpm, off); d["title"] = title; d["color"] = color
        meta.append(d)
        print(sid, "bars", d["bars"], "notes/level", [len(l["n"]) for l in d["levels"]], "rolls", [len(l["r"]) for l in d["levels"]])
    with open(os.path.join(OUT, "songs.js"), "w") as f:
        f.write("// 自動生成: dance/tools/build_songs.py。n=[16分グリッド位置, 0=ドン(左)/1=カッ(右)], r=[開始位置, 長さ]\n")
        f.write("const SONGS = " + json.dumps(meta, ensure_ascii=False, separators=(",", ":")) + ";\n")
