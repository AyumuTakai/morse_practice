// 共通: 音声・設定・学習記録・ページ切り替え・オフライン対応

// モールス音の再生(Web Audio)。ツ(-)=3単位、ト(.)=1単位、符号間=1、文字間=3、語間=7
window.morseAudio = (() => {
  let ctx = null;
  let osc = null;
  let token = 0; // 再生のたびに増やし、古い予約を無効にする
  let silentAudio = null;
  const getCtx = () => {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    ctx = ctx || new Ctx();
    return ctx;
  };
  // iPhone では、サイレントスイッチ(消音)がオンだと Web Audio は鳴らない。
  // 「再生」扱いに切り替える(iOS 16.4 以降は audioSession、それ未満は無音の <audio> を再生)
  function allowSilentSwitch() {
    try {
      if (navigator.audioSession) {
        navigator.audioSession.type = "playback";
        return;
      }
    } catch (e) {}
    if (silentAudio) return;
    try {
      const n = 800;
      const buf = new ArrayBuffer(44 + n);
      const v = new DataView(buf);
      const w = (o, str) => [...str].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)));
      w(0, "RIFF"); v.setUint32(4, 36 + n, true); w(8, "WAVEfmt ");
      v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
      v.setUint32(24, 8000, true); v.setUint32(28, 8000, true); v.setUint16(32, 1, true); v.setUint16(34, 8, true);
      w(36, "data"); v.setUint32(40, n, true);
      for (let i = 0; i < n; i++) v.setUint8(44 + i, 128);
      silentAudio = new Audio(URL.createObjectURL(new Blob([buf], { type: "audio/wav" })));
      silentAudio.loop = true;
      silentAudio.setAttribute("playsinline", "");
      silentAudio.play().catch(() => (silentAudio = null));
    } catch (e) {}
  }
  // 最初のタップ・キー操作の中で音声を有効化する(iOS はユーザー操作の中でないと音を出せない)
  function unlock() {
    const c = getCtx();
    if (!c) return;
    allowSilentSwitch();
    if (c.state !== "running") c.resume();
    try {
      const src = c.createBufferSource();
      src.buffer = c.createBuffer(1, 1, 22050);
      src.connect(c.destination);
      src.start(0);
    } catch (e) {}
    if (c.state === "running") {
      ["touchend", "pointerdown", "click", "keydown"].forEach((ev) =>
        document.removeEventListener(ev, unlock, true)
      );
    }
  }
  ["touchend", "pointerdown", "click", "keydown"].forEach((ev) =>
    document.addEventListener(ev, unlock, { capture: true, passive: true })
  );
  const stop = () => {
    token++;
    if (osc) {
      try { osc.stop(); } catch (e) {}
      osc = null;
    }
  };
  function schedule(code, opts) {
    // 速度(WPM)は引数があればそれを、なければ設定の値を使う。gap は文字と文字の間隔の倍率
    const wpm = (opts && opts.wpm) || Number(morseSettings.load().wpm) || 15;
    const gap = (opts && opts.gap) || Number(morseSettings.load().gap) || 1;
    const unit = 1.2 / wpm;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.frequency.value = Number(morseSettings.load().tone) || 600;
    g.gain.value = 0;
    o.connect(g).connect(ctx.destination);
    let t = ctx.currentTime + 0.05;
    const ramp = 0.005; // クリック音を避けるための立ち上がり/立ち下がり
    const on = (len) => {
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.3, t + ramp);
      g.gain.setValueAtTime(0.3, t + len - ramp);
      g.gain.linearRampToValueAtTime(0, t + len);
      t += len;
    };
    const symbols = [...code.replace(/・/g, ".").replace(/－/g, "-")];
    symbols.forEach((s, i) => {
      if (s === ".") on(unit);
      else if (s === "-") on(unit * 3);
      else if (s === " ") { t += unit * (3 * gap - 1); return; } // 直前の符号間1単位と合わせて文字間3単位(×倍率)
      const next = symbols[i + 1];
      if (next === "." || next === "-") t += unit;
      else if (next === " ") t += unit;
    });
    o.start();
    o.stop(t + 0.05);
    osc = o;
  }
  function play(code, opts) {
    const c = getCtx();
    if (!c) return;
    stop();
    const mine = token;
    allowSilentSwitch();
    // 起動(resume)が終わってから予約する。起動前は時計が進まず、予約した音が間に合わなくなる
    if (c.state === "running") schedule(code, opts);
    else c.resume().then(() => mine === token && schedule(code, opts)).catch(() => {});
  }
  return { play, stop };
})();
// 設定の保存(端末内のみ)
let settingsMem = null;
window.morseSettings = {
  load() {
    if (!settingsMem) {
      try { settingsMem = JSON.parse(localStorage.getItem("morse-settings")) || {}; } catch (e) { settingsMem = {}; }
    }
    return settingsMem;
  },
  save(patch) {
    settingsMem = { ...this.load(), ...patch };
    try { localStorage.setItem("morse-settings", JSON.stringify(settingsMem)); } catch (e) {}
  },
};
    

// 学習記録(端末内のみ)。キー: "c:A"(文字・記号)、"q:QSY"(Q符号・略符号)
// 直近5回の結果を残し、その中の誤答数で「苦手」を判定する(5回続けて正解すれば苦手から外れる)
window.morseStats = (() => {
  const KEY = "morse-stats";
  const WINDOW = 5;
  const load = () => {
    try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; }
  };
  let data = load();
  const save = () => {
    try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) {}
  };
  const weakness = (key) => (data[key] ? [...data[key].recent].filter((c) => c === "x").length : -1);
  return {
    record(key, ok) {
      const s = data[key] || { n: 0, miss: 0, recent: "" };
      s.n++;
      if (!ok) s.miss++;
      s.recent = (s.recent + (ok ? "o" : "x")).slice(-WINDOW);
      data[key] = s;
      save();
    },
    get: (key) => data[key] || null,
    // 直近の誤答数(0〜5)。記録がなければ -1
    weakness,
    // 苦手(直近に誤答がある)なキーを、誤答の多い順に返す
    weakKeys(prefix) {
      return Object.keys(data)
        .filter((k) => k.startsWith(prefix) && weakness(k) > 0)
        .sort((a, b) => weakness(b) - weakness(a) || data[b].miss / data[b].n - data[a].miss / data[a].n);
    },
    totals() {
      const v = Object.values(data);
      return { items: v.length, n: v.reduce((a, s) => a + s.n, 0), miss: v.reduce((a, s) => a + s.miss, 0) };
    },
    clear() {
      data = {};
      save();
    },
  };
})();
    
// 級の選択。get() は 0(未選択)〜4。set() は保存して「← N級」を更新する
window.morseGrade = {
  get() {
    const g = Number(morseSettings.load().grade);
    return g >= 1 && g <= 4 ? g : 0;
  },
  set(g) {
    morseSettings.save({ grade: g });
    if (window.morseUpdateBack) window.morseUpdateBack();
  },
};
// 練習ページの級の選択バー。onChange(級) で、ページが表示を作り直す
window.morseGradeBar = (container, onChange) => {
  container.className = "grade-bar";
  container.replaceChildren();
  const label = document.createElement("span");
  label.textContent = "級:";
  container.appendChild(label);
  const buttons = [];
  [4, 3, 2, 1].forEach((g) => {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = `${g}級`;
    b.addEventListener("click", () => {
      window.morseGrade.set(g);
      show();
      onChange(g);
    });
    container.appendChild(b);
    buttons.push([g, b]);
  });
  const show = () => buttons.forEach(([g, b]) => b.classList.toggle("on", g === (window.morseGrade.get() || 1)));
  show();
};

// ページの切り替え(ヘッダーのドロップダウン)。ホーム・級・分野ごとのページを並べる
(() => {
  const GROUPS = [["級を選ぶ", [["kyu-4.html", "4級"], ["kyu-3.html", "3級"], ["kyu-2.html", "2級"], ["kyu-1.html", "1級"]]], ["モールス", [["tree.html", "モールスの木"], ["listen.html", "聞き取り"], ["check.html", "字句照合"]]], ["法規", [["qcode.html", "Q符号・略符号"], ["procedure.html", "運用手順"]]], ["計算", [["keisan-4.html", "4級 計算"], ["keisan-3.html", "3級 計算"], ["keisan-2.html", "2級 計算"], ["keisan-1.html", "1級 計算"]]], ["記録・設定", [["review.html", "復習"], ["settings.html", "設定"]]]];
  const select = document.getElementById("page-select");
  if (!select) return;
  const here = document.body.dataset.page || location.pathname.split("/").pop() || "index.html";
  const home = document.createElement("option");
  home.value = "index.html";
  home.textContent = "ホーム(級を選ぶ)";
  select.appendChild(home);
  GROUPS.forEach(([label, pages]) => {
    const og = document.createElement("optgroup");
    og.label = label;
    pages.forEach(([file, name]) => {
      const o = document.createElement("option");
      o.value = file;
      o.textContent = name;
      og.appendChild(o);
    });
    select.appendChild(og);
  });
  select.value = here;
  select.addEventListener("change", () => (location.href = select.value));
  // 練習ページでは、選んだ級のメニューへ戻るリンクを出す(級を切り替えると更新される)
  const isMenu = /^(index|kyu-\d)\.html$/.test(here);
  window.morseUpdateBack = () => {
    let back = document.querySelector("header .back");
    const g = window.morseGrade.get();
    if (!g || isMenu) return;
    if (!back) {
      back = document.createElement("a");
      back.className = "back";
      select.parentNode.insertBefore(back, select);
    }
    back.href = `kyu-${g}.html`;
    back.textContent = `← ${g}級`;
  };
  window.morseUpdateBack();
})();

// オフライン対応: Service Worker を登録する(http/https で開いたときだけ)
if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
  window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
}
