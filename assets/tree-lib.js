// モールス符号の木(生成・配置・線)。木のあるページで使う
// モールス符号の木を生成する。単位は svw(画面幅の1%)。
// 行: 左は先頭の点の数、右は先頭の線の直後の点の数
// 列: 線の数(左は +1)  段: 行の接頭辞より後ろにある点の数
const TREE_CODES = [
  ["E", "."], ["T", "-"], ["I", ".."], ["A", ".-"], ["N", "-."], ["M", "--"],
  ["S", "..."], ["U", "..-"], ["R", ".-."], ["W", ".--"], ["D", "-.."], ["K", "-.-"],
  ["G", "--."], ["O", "---"], ["H", "...."], ["V", "...-"], ["F", "..-."], ["L", ".-.."],
  ["P", ".--."], ["J", ".---"], ["B", "-..."], ["X", "-..-"], ["C", "-.-."], ["Y", "-.--"],
  ["Z", "--.."], ["Q", "--.-"],
  ["5", "....."], ["4", "....-"], ["3", "...--"], ["2", "..---"], ["1", ".----"],
  ["6", "-...."], ["7", "--..."], ["8", "---.."], ["9", "----."], ["0", "-----"],
  ["?", "..--.."], ["/", "-..-."], ["=", "-...-"],
  // 別表第1号 欧文の記号(× は X と同じ符号のため省略)
  [".", ".-.-.-", "終点"], [",", "--..--", "小読点"], [":", "---...", "重点・除法"],
  ["'", ".----.", "略符"], ["-", "-....-", "連続線・横線・減算"], ["(", "-.--.", "左括弧"],
  [")", "-.--.-", "右括弧"], ["+", ".-.-.", "十字符・加算"], ['"', ".-..-.", "引用符"],
  ["@", ".--.-.", "単価記号"],
  // 1アマの範囲外で空欄のままにしてある位置
  ["", "..--"], ["", "..--."], ["", "---."], ["", "----"],
];
// 行・列・段の決め方(座標そのものはレイアウト計算で求める)
function treePlace(code) {
  const dashes = code.split("-").length - 1;
  const dots = code.length - dashes;
  let row, col, level, cx;
  if (code[0] === ".") {
    const a = code.match(/^\.+/)[0].length;
    row = 5 - a; col = dashes + 1; level = dots - a; cx = 55 - 10 * col;
  } else {
    const r = code.slice(1).match(/^\.*/)[0].length;
    row = 4 - r; col = dashes; level = dots - r; cx = 45 + 10 * col;
  }
  // cx は列の中心(中央 50 から列の間隔 10 ごと)。pair は G と Q のように同じ段で横並びにするマス
  return { row, col, level, cx, pair: null, side: code[0] };
}
function buildTree(container) {
  const used = new Set();
  TREE_CODES.forEach(([ch, code, name]) => {
    const p = treePlace(code);
    // 今の見た目を維持するための例外: G と Q は同じ段に横並び、/ は D 行の3列目の底
    let free = true;
    if (code === "--.") p.pair = "left";
    if (code === "--.-") { p.cx = 65; p.pair = "right"; p.level = 1; free = false; }
    if (code === "-..-.") { p.col = 3; p.cx = 75; p.level = 0; }
    const key = () => `${p.side}${p.row}:${p.col}:${p.level}`;
    if (free) {
      while (used.has(key())) p.level++; // 重なる場合は一段上へ
      used.add(key());
    }
    const input = document.createElement("input");
    input.type = "text";
    input.className = code.endsWith("-") ? "dash" : "dot";
    input.dataset.char = ch;
    input.dataset.code = code;
    if (name) { input.classList.add("sym"); input.title = name; }
    input._place = p;
    container.appendChild(input);
  });
  layoutTree(container);
}
// マスの高さは 24〜34px。横は線のマスの幅、縦は行ごとの間隔を、使える幅と高さに合わせて計算する
function layoutTree(container) {
  const wrap = container.parentElement;
  const W = wrap.clientWidth;
  if (!W) return false; // 非表示のときは計算できない
  const fit = container.dataset.fit === "1";
  const inputs = [...container.querySelectorAll("input")];
  // 行ごとの段の最大数(その行の上に積み上がる分だけ、次の行との間隔が必要)
  const rowMax = [0, 0, 0, 0, 0];
  inputs.forEach((i) => (rowMax[i._place.row] = Math.max(rowMax[i._place.row], i._place.level)));
  const gapY = 8; // 行どうしの最小の隙間
  const needUnits = (h) => [4, 3, 2, 1].map((r) => rowMax[r] * 1.093 * h + h + gapY);
  const sum = (a) => a.reduce((x, y) => x + y, 0);
  // 画面の高さのうち木に使える分(下の Reset / Show / Check の分を残す)
  const availH = fit ? window.innerHeight - (wrap.getBoundingClientRect().top + window.scrollY) - 100 : Infinity;
  // マスの高さ: 幅に応じて 24〜34px。縦が足りないときは、必要な高さに収まる大きさまで下げる
  let h = Math.max(24, Math.min(34, Math.round(W * 0.032)));
  while (h > 24 && sum(needUnits(h)) + h + 6 > availH) h--;
  const step = 1.093 * h; // 段の間隔
  const pad = 8;
  const gapX = 4; // 隣の列との最小の隙間
  // 線のマスの幅: 広い画面では高さの2倍。狭い画面では、9列ぶんが収まる幅まで狭める(高さの1.2倍が下限)
  const fitD = Math.floor((W - 2 * pad - 9 * gapX) / 10);
  const d = Math.max(Math.round(1.2 * h), Math.min(2 * h, fitD));
  // 列の間隔: 画面幅に収まるよう広げる/詰める
  const P = Math.max(d + gapX, Math.min(6 * h, (W - 2 * pad - d) / 9));
  const Wt = Math.max(W, Math.ceil(9 * P + d + 2 * pad));
  // 行の間隔: 必要な高さを確保し、余りがあれば少しだけ広げる
  const pitches = needUnits(h);
  const extra = Math.min(0.75 * h, Math.max(0, (availH - sum(pitches) - h - 6) / 4));
  const baseTop = [0, 0, 0, 0, 0];
  const Ht = Math.ceil(sum(pitches) + 4 * extra + h + 6);
  baseTop[4] = Ht - h;
  for (let r = 4; r >= 1; r--) baseTop[r - 1] = baseTop[r] - (pitches[4 - r] + extra);
  container.style.width = Wt + "px";
  container.style.height = Ht + "px";
  const nodes = {};
  inputs.forEach((input) => {
    const p = input._place;
    const code = input.dataset.code;
    const w = code.endsWith("-") ? d : h;
    let cx = Wt / 2 + ((p.cx - 50) / 10) * P;
    if (p.pair) {
      // G と Q は横並び。右隣の列のマスに触れない範囲で、列の中心にそろえる
      const total = h + d;
      const center = Math.min(0, P - h / 2 - 2 - total / 2);
      cx += center + (p.pair === "left" ? -total / 2 + h / 2 : total / 2 - d / 2);
    }
    const top = baseTop[p.row] - p.level * step;
    Object.assign(input.style, {
      left: cx - w / 2 + "px",
      top: top + "px",
      width: w + "px",
      height: h + "px",
      borderRadius: h + "px",
      fontSize: Math.max(16, Math.round(h * 0.66)) + "px", // 16px 未満だと iOS が入力時に拡大する
    });
    nodes[code] = { x: cx, y: top + h / 2 };
  });
  drawTreeLines(container, nodes, Wt, Ht, h);
  return true;
}
// 背面に SVG を敷いて、親子を線でつなぐ(入力欄の白い背景が線の端を隠す)
function drawTreeLines(container, nodes, Wt, Ht, h) {
  const NS = "http://www.w3.org/2000/svg";
  const old = container.querySelector(".tree-lines");
  if (old) old.remove();
  const svg = document.createElementNS(NS, "svg");
  svg.setAttribute("viewBox", `0 0 ${Wt} ${Ht}`);
  svg.setAttribute("class", "tree-lines");
  Object.entries(nodes).forEach(([code, n]) => {
    // 線は遷移できる親子の間だけ。E と T は根(開始位置)から始まるので線は引かない。
    // 親が木の中に無い符号(記号など)も引かない
    const parent = code.slice(0, -1);
    if (!parent || !nodes[parent]) return;
    const from = nodes[parent];
    const line = document.createElementNS(NS, "line");
    line.setAttribute("x1", from.x);
    line.setAttribute("y1", from.y);
    line.setAttribute("x2", n.x);
    line.setAttribute("y2", n.y);
    svg.appendChild(line);
  });
  container.insertBefore(svg, container.firstChild);
}
// 画面サイズの変更・タブの切り替えで余白を計算し直す。狭い画面では中央(E と T)が見える位置にスクロールする
function relayoutTrees(recenter) {
  document.querySelectorAll(".tree").forEach((c) => {
    if (!c.querySelector("input") || !layoutTree(c)) return;
    const wrap = c.parentElement;
    if ((recenter || !c._centered) && wrap.scrollWidth > wrap.clientWidth) {
      wrap.scrollLeft = (wrap.scrollWidth - wrap.clientWidth) / 2;
      c._centered = true;
    }
  });
}
let relayoutTimer = null;
window.addEventListener("resize", () => {
  clearTimeout(relayoutTimer);
  relayoutTimer = setTimeout(() => relayoutTrees(true), 100);
});
window.addEventListener("load", () => relayoutTrees());
