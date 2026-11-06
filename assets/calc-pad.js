// 計算ページ用の簡易電卓(+ − × ÷ ( ) √ x² π)。式を組み立てて「=」で計算し、結果を答え欄に入れられる。
// eval は使わず、小さな構文解析で計算する。
(() => {
  const card = document.getElementById("calc-out") && document.getElementById("calc-out").closest(".card");
  if (!card) return;

  // ---- 計算(式の文字列 → 数値)。使える文字: 数字 . + - * / ^ ( ) π √
  function evaluate(src) {
    let s = src.replace(/\s+/g, "");
    // 閉じ忘れの括弧(√ のあとなど)は、式の最後で閉じる
    s += ")".repeat(Math.max(0, (s.match(/\(/g) || []).length - (s.match(/\)/g) || []).length));
    let i = 0;
    const peek = () => s[i];
    function expr() {
      let v = term();
      while (peek() === "+" || peek() === "-") v = s[i++] === "+" ? v + term() : v - term();
      return v;
    }
    function term() {
      let v = power();
      while (peek() === "*" || peek() === "/") {
        const op = s[i++];
        const r = power();
        v = op === "*" ? v * r : v / r;
      }
      return v;
    }
    function power() {
      const b = unary();
      if (peek() === "^") {
        i++;
        return Math.pow(b, power());
      }
      return b;
    }
    function unary() {
      if (peek() === "-") { i++; return -unary(); }
      if (peek() === "√") { i++; return Math.sqrt(unary()); }
      return atom();
    }
    function atom() {
      if (peek() === "(") {
        i++;
        const v = expr();
        if (peek() !== ")") throw new Error("括弧");
        i++;
        return v;
      }
      if (peek() === "π") { i++; return Math.PI; }
      const m = /^\d*\.?\d+|^\d+\.?/.exec(s.slice(i));
      if (!m) throw new Error("式");
      i += m[0].length;
      return parseFloat(m[0]);
    }
    const v = expr();
    if (i < s.length) throw new Error("式");
    if (!isFinite(v)) throw new Error("計算できません");
    return v;
  }
  const show = (v) => String(+v.toPrecision(10));

  // ---- 画面
  const style = document.createElement("style");
  style.textContent = `
    #calc-pad { margin-top: 1em; background: white; border: 1px solid #ccc; border-radius: 0.6em; padding: 0.5em 0.9em; }
    #calc-pad summary { cursor: pointer; font-weight: bold; }
    #calc-pad .scr { margin: 0.6em 0 0.4em; padding: 0.4em 0.6em; background: #f4f6f8; border-radius: 0.4em; font-family: monospace; text-align: right; min-height: 3.2em; }
    #calc-pad .scr .ex { font-size: 1rem; color: #555; word-break: break-all; min-height: 1.3em; }
    #calc-pad .scr .rs { font-size: 1.5rem; font-weight: bold; min-height: 1.8em; }
    #calc-pad .keys { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.35em; max-width: 360px; }
    #calc-pad .keys button { height: 2.8em; font-size: 1.1rem; border-radius: 0.5em; border: 1px solid #aab; background: #fafbfc; cursor: pointer; padding: 0; margin: 0; }
    #calc-pad .keys button.op { background: #e6ecf3; }
    #calc-pad .keys button.eq { background: lightslategray; color: white; grid-column: span 2; }
    #calc-pad .put { margin-top: 0.5em; font-size: 0.95rem; padding: 0.5em 1em; border-radius: 2em; border: 1px solid lightslategray; background: transparent; cursor: pointer; }
    #calc-pad .hint { font-size: 0.8rem; color: #555; margin: 0.4em 0 0; }
  `;
  document.head.appendChild(style);

  const pad = document.createElement("details");
  pad.id = "calc-pad";
  pad.innerHTML =
    '<summary>電卓(計算の補助)</summary><div class="scr"><div class="ex"></div><div class="rs"></div></div><div class="keys"></div>' +
    '<button type="button" class="put">結果を答え欄に入れる</button>' +
    '<p class="hint">2π ≈ 6.28 は「2 × π」で出せます。√ は「√ 16」「√( 2 × 8 )」のように使います。</p>';
  card.parentNode.insertBefore(pad, card.nextSibling);

  const ex = pad.querySelector(".ex");
  const rs = pad.querySelector(".rs");
  const keys = pad.querySelector(".keys");
  const st = { expr: "", done: false, value: null };
  const disp = () => {
    ex.textContent = st.expr.replace(/\*/g, "×").replace(/\//g, "÷").replace(/-/g, "−").replace(/\^2/g, "²");
  };

  function press(k) {
    if (k === "C") { st.expr = ""; st.done = false; st.value = null; rs.textContent = ""; return disp(); }
    if (k === "⌫") { st.expr = st.expr.replace(/(\^2|.)$/, ""); st.done = false; return disp(); }
    if (k === "=") {
      if (!st.expr) return;
      try {
        st.value = evaluate(st.expr);
        rs.textContent = show(st.value);
        st.done = true;
      } catch (e) {
        st.value = null;
        rs.textContent = "式を確かめてください";
      }
      return;
    }
    const isOp = /^[+\-*/]$/.test(k) || k === "x²";
    // 計算のあとに数字を押したら新しい式。演算子なら、結果に続けて計算する
    if (st.done) {
      st.expr = isOp && st.value !== null ? show(st.value) : "";
      st.done = false;
      rs.textContent = "";
    }
    st.expr += k === "x²" ? "^2" : k === "√" ? "√(" : k;
    disp();
  }

  [
    ["C", "op"], ["⌫", "op"], ["(", "op"], [")", "op"],
    ["7"], ["8"], ["9"], ["/", "op", "÷"],
    ["4"], ["5"], ["6"], ["*", "op", "×"],
    ["1"], ["2"], ["3"], ["-", "op", "−"],
    ["0"], ["."], ["π", "op"], ["+", "op"],
    ["√", "op"], ["x²", "op"], ["=", "eq"],
  ].forEach(([k, cls, label]) => {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = label || k;
    if (cls) b.className = cls;
    b.addEventListener("click", () => press(k));
    keys.appendChild(b);
  });

  pad.querySelector(".put").addEventListener("click", () => {
    const input = document.querySelector("#calc-input-box input");
    if (!input || input.disabled) return;
    if (!st.done) press("=");
    if (st.value === null) return;
    input.value = show(+st.value.toPrecision(6));
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.focus({ preventScroll: true });
  });

  window.calcPadEvaluate = evaluate; // 動作確認用
})();
