// 2〜4級の計算問題。過去問・CBT例題に出た計算の種類(オームの法則・合成抵抗・電力・変調度・波長とアンテナ長・
// 変成器・コンデンサ・ひずみ率・PLL・影像周波数 など)を、電卓なしで解ける数字で出題する。
// 1級の出題ロジックは keisan-1.html にある(ama1-keisan.html から移植したもの)。
var KGEN = (function () {
  function ri(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function fmt(n) { return Number.isInteger(n) ? String(n) : String(+n.toFixed(2)); }
  function m(s) { return '<span class="m">' + s + '</span>'; }
  var TOL1 = '数値のみ(±1% まで正解)';
  var TOL3 = '数値のみ(±3% まで正解)';
  var TOL5 = '数値のみ(±5% まで正解)';

  // 並列にして割り切れる抵抗の組 [R1, R2, 合成]
  var PAIRS = [[6, 3, 2], [12, 4, 3], [20, 5, 4], [30, 60, 20], [10, 10, 5], [40, 10, 8], [15, 30, 10], [12, 6, 4], [24, 8, 6], [60, 20, 15]];
  // 直列コンデンサ [C1, C2, 合成]
  var CSER = [[3, 6, 2], [4, 12, 3], [2, 2, 1], [5, 20, 4], [10, 40, 8], [6, 12, 4], [8, 8, 4], [12, 6, 4], [30, 60, 20], [20, 5, 4]];

  function waveStr(f) { return fmt(300 / f); }

  // ---------------------------------------------------------------- 共通で使う分野の出題
  function genOhm() {
    var t = ri(0, 2), R = pick([2, 4, 5, 8, 10, 20, 50, 100]), I = pick([0.1, 0.2, 0.5, 1, 2, 3, 5]);
    var V = +(R * I).toFixed(2);
    if (t === 0) return { text: m(R + ' Ω') + ' の抵抗に ' + m(I + ' A') + ' の電流が流れている。抵抗の両端の電圧は何 V か。', unit: 'V', ans: V, abs: 0, rel: 0.01,
      steps: ['オームの法則 ' + m('V = I × R'), m('V = ' + I + ' × ' + R + ' = ' + fmt(V) + ' V')], tolText: TOL1 };
    if (t === 1) return { text: m(R + ' Ω') + ' の抵抗に ' + m(fmt(V) + ' V') + ' の直流電圧を加えた。流れる電流は何 A か。', unit: 'A', ans: I, abs: 0, rel: 0.01,
      steps: ['オームの法則 ' + m('I = V / R'), m('I = ' + fmt(V) + ' / ' + R + ' = ' + I + ' A')], tolText: TOL1 };
    return { text: m(fmt(V) + ' V') + ' の直流電圧を加えたとき ' + m(I + ' A') + ' の電流が流れた。この抵抗は何 Ω か。', unit: 'Ω', ans: R, abs: 0, rel: 0.01,
      steps: ['オームの法則 ' + m('R = V / I'), m('R = ' + fmt(V) + ' / ' + I + ' = ' + R + ' Ω')], tolText: TOL1 };
  }

  function genPw4() {
    var R = pick([2, 4, 5, 8, 10, 20, 25, 50]), V = pick([10, 20, 40, 50, 100]), P = V * V / R, I = V / R, t = ri(0, 3);
    if (t === 0) return { text: m(R + ' Ω') + ' の抵抗に ' + m(V + ' V') + ' の直流電圧を加えた。消費される電力は何 W か。', unit: 'W', ans: P, abs: 0, rel: 0.01,
      steps: [m('P = V² / R'), m('P = ' + V + '² / ' + R + ' = ' + (V * V) + ' / ' + R + ' = ' + fmt(P) + ' W')], tolText: TOL1 };
    if (t === 1) return { text: m(R + ' Ω') + ' の抵抗に直流電圧を加えたところ、' + m(fmt(P) + ' W') + ' の電力が消費された。抵抗に加えられた電圧は何 V か。', unit: 'V', ans: V, abs: 0, rel: 0.01,
      steps: [m('P = V² / R') + ' から ' + m('V² = P × R'), m('V² = ' + fmt(P) + ' × ' + R + ' = ' + (V * V)), m('V = √' + (V * V) + ' = ' + V + ' V')], tolText: TOL1 };
    if (t === 2) return { text: m(V + ' V') + ' の直流電源に抵抗をつないだら ' + m(fmt(I) + ' A') + ' の電流が流れた。消費される電力は何 W か。', unit: 'W', ans: V * I, abs: 0, rel: 0.01,
      steps: [m('P = V × I'), m('P = ' + V + ' × ' + fmt(I) + ' = ' + fmt(V * I) + ' W')], tolText: TOL1 };
    return { text: m(V + ' V') + ' の電源で ' + m(fmt(P) + ' W') + ' の電力を消費している。流れている電流は何 A か。', unit: 'A', ans: I, abs: 0, rel: 0.01,
      steps: [m('P = V × I') + ' から ' + m('I = P / V'), m('I = ' + fmt(P) + ' / ' + V + ' = ' + fmt(I) + ' A')], tolText: TOL1 };
  }

  function genRs4() {
    var t = ri(0, 2);
    if (t === 0) { var a = pick([2, 3, 4, 5, 10]), b = pick([5, 6, 10, 20]), c = pick([1, 2, 4, 10]);
      return { text: m(a + ' Ω') + '、' + m(b + ' Ω') + '、' + m(c + ' Ω') + ' の3つの抵抗を直列に接続した。合成抵抗は何 Ω か。', unit: 'Ω', ans: a + b + c, abs: 0, rel: 0.01,
        steps: ['直列は足し算: ' + m('R = ' + a + ' + ' + b + ' + ' + c + ' = ' + (a + b + c) + ' Ω')], tolText: TOL1 }; }
    var p = pick(PAIRS);
    if (t === 1) return { text: m(p[0] + ' Ω') + ' と ' + m(p[1] + ' Ω') + ' の抵抗を並列に接続した。合成抵抗は何 Ω か。', unit: 'Ω', ans: p[2], abs: 0, rel: 0.01,
      steps: ['並列(2つ)は、積 ÷ 和: ' + m('R = (R₁ × R₂) / (R₁ + R₂)'), m('R = ' + (p[0] * p[1]) + ' / ' + (p[0] + p[1]) + ' = ' + p[2] + ' Ω')], tolText: TOL1 };
    var r1 = pick([2, 4, 5, 10]);
    return { text: m(p[0] + ' Ω') + ' と ' + m(p[1] + ' Ω') + ' の並列回路に、' + m(r1 + ' Ω') + ' の抵抗を直列に接続した。全体の合成抵抗は何 Ω か。', unit: 'Ω', ans: r1 + p[2], abs: 0, rel: 0.01,
      steps: ['並列部分: ' + m('(' + p[0] + ' × ' + p[1] + ') / (' + p[0] + ' + ' + p[1] + ') = ' + p[2] + ' Ω'), '直列は足し算: ' + m(r1 + ' + ' + p[2] + ' = ' + (r1 + p[2]) + ' Ω')], tolText: TOL1 };
  }

  function genLam() {
    var f = pick([3.5, 7, 14, 21, 28, 50, 144]), lam = 300 / f, t = ri(0, 2);
    if (t === 0) return { text: '周波数 ' + m(f + ' MHz') + ' の電波の波長は約何 m か。(光速を 3×10⁸ m/s とする)', unit: 'm', ans: lam, abs: 0, rel: 0.03,
      steps: [m('λ[m] = 300 / f[MHz]'), m('λ = 300 / ' + f + ' ≈ ' + fmt(lam) + ' m')], tolText: TOL3 };
    if (t === 1) return { text: m(f + ' MHz') + ' 用の 1/4 波長垂直接地アンテナ(ブラウンアンテナなど)の放射エレメントの長さは、ほぼ何 m か。', unit: 'm', ans: lam / 4, abs: 0, rel: 0.03,
      steps: ['波長: ' + m('λ = 300 / ' + f + ' ≈ ' + fmt(lam) + ' m'), '1/4 波長: ' + m('λ / 4 ≈ ' + fmt(lam / 4) + ' m')], tolText: TOL3 };
    return { text: '波長が ' + m(fmt(lam) + ' m') + ' の電波の周波数は約何 MHz か。', unit: 'MHz', ans: f, abs: 0, rel: 0.03,
      steps: [m('f[MHz] = 300 / λ[m]'), m('f = 300 / ' + fmt(lam) + ' ≈ ' + f + ' MHz')], tolText: TOL3 };
  }

  function genAm4() {
    var a = pick([40, 50, 60, 80, 100]), pc = pick([20, 25, 40, 50, 60, 80]), b = a * pc / 100, t = ri(0, 1);
    if (t === 0) return { text: '振幅変調(A3E)の変調波の振幅が、最大 ' + m(fmt(a + b) + ' V') + '、最小 ' + m(fmt(a - b) + ' V') + ' であった。変調度は何 % か。', unit: '%', ans: pc, abs: 0.5, rel: 0,
      steps: [m('変調度 = (最大 − 最小) / (最大 + 最小) × 100'), m('= (' + fmt(a + b) + ' − ' + fmt(a - b) + ') / (' + fmt(a + b) + ' + ' + fmt(a - b) + ') × 100'), m('= ' + fmt(2 * b) + ' / ' + fmt(2 * a) + ' × 100 = ' + pc + ' %')], tolText: '整数で入力(±0.5% まで正解)' };
    return { text: '搬送波の振幅が ' + m(a + ' V') + '、信号波の振幅が ' + m(fmt(b) + ' V') + ' のとき、変調度は何 % か。', unit: '%', ans: pc, abs: 0.5, rel: 0,
      steps: [m('変調度 = 信号波の振幅 / 搬送波の振幅 × 100'), m('= ' + fmt(b) + ' / ' + a + ' × 100 = ' + pc + ' %')], tolText: '整数で入力(±0.5% まで正解)' };
  }

  function genTr() {
    var n = pick([2, 3, 4, 5, 10]), V1 = pick([10, 20, 50, 100, 200]), V2 = V1 / n, t = ri(0, 2), k = pick([1, 2, 5, 10, 20]);
    if (t === 0) return { text: '変成器の一次側と二次側の巻数の比(一次:二次)が ' + m(n + ':1') + ' である。一次側に ' + m(V1 + ' V') + ' の交流電圧を加えると、二次側の電圧は何 V か。', unit: 'V', ans: V2, abs: 0, rel: 0.01,
      steps: ['電圧は巻数に比例する: ' + m('V₁ : V₂ = n₁ : n₂'), m('V₂ = ' + V1 + ' × (1/' + n + ') = ' + fmt(V2) + ' V')], tolText: TOL1 };
    if (t === 1) return { text: '変成器の一次側に ' + m(V1 + ' V') + ' を加えたところ、二次側に ' + m(fmt(V2) + ' V') + ' が現れた。巻数比(一次 ÷ 二次)はいくらか。', unit: '', ans: n, abs: 0, rel: 0.01,
      steps: [m('V₁ / V₂ = n₁ / n₂'), m('n₁ / n₂ = ' + V1 + ' / ' + fmt(V2) + ' = ' + n)], tolText: TOL1 };
    return { text: '巻数比(一次:二次)が ' + m(n + ':1') + ' の変成器の一次側に ' + m(V1 + ' V') + ' を加えると、二次側に電流が ' + m(k + ' A') + ' 流れた(負荷に供給)。一次側の電流は何 A か。ただし損失は無いものとする。', unit: 'A', ans: k / n, abs: 0, rel: 0.01,
      steps: ['損失が無いので、一次の電力 = 二次の電力。電流は巻数に反比例する: ' + m('I₁ : I₂ = n₂ : n₁'), m('I₁ = ' + k + ' × (1/' + n + ') = ' + fmt(k / n) + ' A')], tolText: TOL1 };
  }

  function genMt4() {
    var r = pick([1, 2, 5, 10, 20]), n = pick([2, 3, 5, 10, 20]), t = ri(0, 1);
    if (t === 0) { var rs = r * (n - 1);
      return { text: '内部抵抗 ' + m(r + ' kΩ') + ' の電圧計に、' + m(rs + ' kΩ') + ' の倍率器(抵抗)を直列に接続した。測定できる電圧の範囲は、もとの何倍になるか。', unit: '倍', ans: n, abs: 0, rel: 0.01,
        steps: ['直列にすると、電圧は抵抗に比例して分かれる: ' + m('倍率 = (r + Rs) / r'), m('= (' + r + ' + ' + rs + ') / ' + r + ' = ' + n + ' 倍')], tolText: TOL1 }; }
    var sh = r / (n - 1);
    return { text: '内部抵抗 ' + m(r + ' Ω') + ' の電流計に、' + m(fmt(sh) + ' Ω') + ' の分流器(抵抗)を並列に接続した。測定できる電流の範囲は、もとの何倍になるか。', unit: '倍', ans: n, abs: 0, rel: 0.01,
      steps: ['並列では、電流は抵抗に反比例して分かれる: ' + m('倍率 = 1 + r / Rs'), m('= 1 + ' + r + ' / ' + fmt(sh) + ' = 1 + ' + (n - 1) + ' = ' + n + ' 倍')], tolText: TOL1 };
  }

  // ---------------------------------------------------------------- 3級・2級で使う分野
  function genDcc() {
    var p = pick(PAIRS), r1 = pick([4, 5, 10, 15, 20]), I = pick([0.5, 1, 2, 3]), Rt = r1 + p[2], V = +(Rt * I).toFixed(2), t = ri(0, 1);
    var head = m(r1 + ' Ω') + ' の抵抗に、' + m(p[0] + ' Ω') + ' と ' + m(p[1] + ' Ω') + ' の並列回路を直列に接続し、' + m(fmt(V) + ' V') + ' の直流電圧を加えた。';
    var common = ['並列部分の合成抵抗: ' + m('(' + p[0] + ' × ' + p[1] + ') / (' + p[0] + ' + ' + p[1] + ') = ' + p[2] + ' Ω'), '全体の抵抗: ' + m(r1 + ' + ' + p[2] + ' = ' + Rt + ' Ω'), '全体の電流: ' + m('I = ' + fmt(V) + ' / ' + Rt + ' = ' + I + ' A')];
    if (t === 0) return { text: head + '電源から流れる電流は何 A か。', unit: 'A', ans: I, abs: 0, rel: 0.01, steps: common, tolText: TOL1 };
    var Vp = +(p[2] * I).toFixed(2);
    return { text: head + '並列回路の両端の電圧は何 V か。', unit: 'V', ans: Vp, abs: 0, rel: 0.01, steps: common.concat(['並列部分の電圧: ' + m('V = I × R = ' + I + ' × ' + p[2] + ' = ' + fmt(Vp) + ' V')]), tolText: TOL1 };
  }

  function genPw3() {
    var R = pick([2, 4, 5, 8, 10, 20, 25, 50]), I = pick([0.2, 0.5, 1, 2, 3, 4]), t = ri(0, 2), P = I * I * R;
    if (t === 0) return { text: m(R + ' Ω') + ' の抵抗に ' + m(I + ' A') + ' の電流が流れている。消費される電力は何 W か。', unit: 'W', ans: P, abs: 0, rel: 0.01,
      steps: [m('P = I² × R'), m('P = ' + I + '² × ' + R + ' = ' + fmt(I * I) + ' × ' + R + ' = ' + fmt(P) + ' W')], tolText: TOL1 };
    if (t === 1) return { text: m(R + ' Ω') + ' の抵抗で ' + m(fmt(P) + ' W') + ' の電力が消費されている。流れている電流は何 A か。', unit: 'A', ans: I, abs: 0, rel: 0.01,
      steps: [m('P = I² × R') + ' から ' + m('I² = P / R'), m('I² = ' + fmt(P) + ' / ' + R + ' = ' + fmt(I * I)), m('I = √' + fmt(I * I) + ' = ' + I + ' A')], tolText: TOL1 };
    var V = pick([10, 20, 40, 50, 100]), Pw = V * V / R;
    return { text: m(R + ' Ω') + ' の抵抗に ' + m(V + ' V') + ' を加えたとき、消費される電力は何 W か。', unit: 'W', ans: Pw, abs: 0, rel: 0.01,
      steps: [m('P = V² / R'), m('P = ' + V + '² / ' + R + ' = ' + (V * V) + ' / ' + R + ' = ' + fmt(Pw) + ' W')], tolText: TOL1 };
  }

  function genCap3() {
    var t = ri(0, 2), a = pick([2, 4, 6, 8, 10]), b = pick([2, 4, 6, 10, 12]);
    if (t === 0) return { text: '静電容量 ' + m(a + ' μF') + ' と ' + m(b + ' μF') + ' のコンデンサを並列に接続した。合成静電容量は何 μF か。', unit: 'μF', ans: a + b, abs: 0, rel: 0.01,
      steps: ['並列は足し算: ' + m(a + ' + ' + b + ' = ' + (a + b) + ' μF')], tolText: TOL1 };
    if (t === 1) { var s = pick(CSER);
      return { text: '静電容量 ' + m(s[0] + ' μF') + ' と ' + m(s[1] + ' μF') + ' のコンデンサを直列に接続した。合成静電容量は何 μF か。', unit: 'μF', ans: s[2], abs: 0, rel: 0.01,
        steps: ['直列は、抵抗の並列と同じ形(積 ÷ 和): ' + m('C = (C₁ × C₂) / (C₁ + C₂)'), m('C = ' + (s[0] * s[1]) + ' / ' + (s[0] + s[1]) + ' = ' + s[2] + ' μF')], tolText: TOL1 }; }
    var ratio = pick([2, 3, 4, 5]), Q1 = ratio * pick([5, 10, 20]) * 1e-6, c1 = pick([2, 4, 5]) * ratio, c2 = c1 / ratio;
    // 並列: 電圧が等しいので、電荷は静電容量に比例する
    var Q2 = Q1 * c2 / c1;
    return { text: '静電容量 ' + m(c1 + ' μF') + ' と ' + m(fmt(c2) + ' μF') + ' のコンデンサを並列に接続した。' + m(c1 + ' μF') + ' のコンデンサに蓄えられた電荷が ' + m(fmt(Q1 * 1e6) + ' μC') + ' のとき、' + m(fmt(c2) + ' μF') + ' のコンデンサに蓄えられている電荷は何 μC か。', unit: 'μC', ans: Q2 * 1e6, abs: 0, rel: 0.01,
      steps: ['並列なので、2つのコンデンサの電圧は等しい。' + m('Q = C × V') + ' から、電荷は静電容量に比例する。', m('V = ' + fmt(Q1 * 1e6) + ' / ' + c1 + ' = ' + fmt(Q1 * 1e6 / c1) + ' V'), m('Q = ' + fmt(c2) + ' × ' + fmt(Q1 * 1e6 / c1) + ' = ' + fmt(Q2 * 1e6) + ' μC')], tolText: TOL1 };
  }

  function genAc3() {
    var Vm = pick([10, 20, 50, 100, 141]), t = ri(0, 2);
    if (t === 0) return { text: '正弦波交流の最大値が ' + m(Vm + ' V') + ' のとき、実効値は約何 V か。(√2 = 1.41 とする)', unit: 'V', ans: Vm / 1.41, abs: 0, rel: 0.03,
      steps: [m('実効値 = 最大値 / √2 ≈ 最大値 × 0.707'), m('= ' + Vm + ' / 1.41 ≈ ' + fmt(Vm / 1.41) + ' V')], tolText: TOL3 };
    if (t === 1) return { text: '正弦波交流の実効値が ' + m(Vm + ' V') + ' のとき、最大値は約何 V か。(√2 = 1.41 とする)', unit: 'V', ans: Vm * 1.41, abs: 0, rel: 0.03,
      steps: [m('最大値 = 実効値 × √2'), m('= ' + Vm + ' × 1.41 ≈ ' + fmt(Vm * 1.41) + ' V')], tolText: TOL3 };
    return { text: '正弦波交流の最大値が ' + m(Vm + ' V') + ' のとき、平均値は約何 V か。(平均値 = 最大値 × 0.64 とする)', unit: 'V', ans: Vm * 0.64, abs: 0, rel: 0.03,
      steps: [m('平均値 = 最大値 × 2/π ≈ 最大値 × 0.64'), m('= ' + Vm + ' × 0.64 ≈ ' + fmt(Vm * 0.64) + ' V')], tolText: TOL3 };
  }

  function genAnt() {
    var R = 73;
    var t = ri(0, 1);
    if (t === 0) { var I = pick([0.5, 1, 2, 3]), P = I * I * R; // P / 73 がちょうど I² になる値だけを出題する(手計算で √ を開けるように)
      return { text: '半波長ダイポールアンテナ(放射抵抗 ' + m('73 Ω') + ')の放射電力を ' + m(P + ' W') + ' にするために、アンテナに供給する電流は約何 A か。ただし、アンテナの損失は無視する。', unit: 'A', ans: I, abs: 0, rel: 0.05,
        steps: [m('P = I² × R') + ' から ' + m('I = √(P / R)'), m('I = √(' + fmt(P) + ' / 73) = √' + fmt(I * I) + ' = ' + fmt(I) + ' A')], tolText: TOL5 }; }
    var Ia = pick([0.5, 1, 1.5, 2]), Pa = Ia * Ia * R;
    return { text: '半波長ダイポールアンテナ(放射抵抗 ' + m('73 Ω') + ')に ' + m(Ia + ' A') + ' の電流を供給した。放射される電力は約何 W か。', unit: 'W', ans: Pa, abs: 0, rel: 0.05,
      steps: [m('P = I² × R'), m('P = ' + Ia + '² × 73 = ' + fmt(Ia * Ia) + ' × 73 ≈ ' + fmt(Pa) + ' W')], tolText: TOL5 };
  }

  function genAm3() {
    var t = ri(0, 1);
    if (t === 0) return genAm4();
    var Vc = pick([20, 40, 50, 100]), pc = pick([20, 40, 50, 60, 80]), Vmax = Vc * (1 + pc / 100);
    return { text: '振幅 ' + m(Vc + ' V') + ' の搬送波を、変調度 ' + m(pc + ' %') + ' で振幅変調した。変調波の振幅の最大値は何 V か。', unit: 'V', ans: Vmax, abs: 0, rel: 0.01,
      steps: [m('最大値 = 搬送波の振幅 × (1 + 変調度)'), m('= ' + Vc + ' × (1 + ' + (pc / 100) + ') = ' + fmt(Vmax) + ' V')], tolText: TOL1 };
  }

  function genEff() {
    var V = pick([12, 24, 28, 50, 100]), I = pick([1, 2, 4, 5, 10]), eta = pick([50, 60, 70, 75, 80]), Pin = V * I, Po = Pin * eta / 100, t = ri(0, 2);
    if (t === 0) return { text: '電力増幅器に直流電圧 ' + m(V + ' V') + ' を加えたところ、直流電流が ' + m(I + ' A') + ' 流れ、高周波出力電力が ' + m(fmt(Po) + ' W') + ' であった。電力効率は何 % か。', unit: '%', ans: eta, abs: 0.5, rel: 0,
      steps: ['直流入力電力: ' + m('V × I = ' + V + ' × ' + I + ' = ' + Pin + ' W'), m('効率 = 出力 / 入力 × 100 = ' + fmt(Po) + ' / ' + Pin + ' × 100 = ' + eta + ' %')], tolText: '整数で入力(±0.5% まで正解)' };
    if (t === 1) return { text: '電力増幅器の高周波出力電力が ' + m(fmt(Po) + ' W') + '、直流供給電流が ' + m(I + ' A') + '、電力効率が ' + m(eta + ' %') + ' のとき、直流供給電圧は何 V か。', unit: 'V', ans: V, abs: 0, rel: 0.01,
      steps: ['直流入力電力: ' + m('入力 = 出力 / 効率 = ' + fmt(Po) + ' / ' + (eta / 100) + ' = ' + Pin + ' W'), m('V = 入力 / I = ' + Pin + ' / ' + I + ' = ' + V + ' V')], tolText: TOL1 };
    return { text: '電力増幅器に ' + m(V + ' V') + '、' + m(I + ' A') + ' の直流電力を供給し、電力効率が ' + m(eta + ' %') + ' であった。高周波出力電力は何 W か。', unit: 'W', ans: Po, abs: 0, rel: 0.01,
      steps: ['直流入力電力: ' + m(V + ' × ' + I + ' = ' + Pin + ' W'), m('出力 = 入力 × 効率 = ' + Pin + ' × ' + (eta / 100) + ' = ' + fmt(Po) + ' W')], tolText: TOL1 };
  }

  // ---------------------------------------------------------------- 2級だけの分野
  function genCap2() {
    var t = ri(0, 3);
    if (t === 0) { var V = pick([10, 20, 40, 50, 100]), Q = pick([0.1, 0.2, 0.4, 0.5, 1]), W = Q * V / 2;
      return { text: 'コンデンサに直流電圧 ' + m(V + ' V') + ' を加えたとき、' + m(Q + ' C') + ' の電荷が蓄えられた。このコンデンサに蓄えられるエネルギーは何 J か。', unit: 'J', ans: W, abs: 0, rel: 0.01,
        steps: [m('W = ½ C V² = ½ Q V') + '(' + m('Q = C V') + ' より)', m('W = ½ × ' + Q + ' × ' + V + ' = ' + fmt(W) + ' J')], tolText: TOL1 }; }
    if (t === 1) { var S = pick([20, 40, 50, 80, 100]), d = pick([2, 4, 5, 10]), er = pick([2, 3, 4, 5, 6]), C = 0.9 * er * S / d;
      return { text: '平行平板コンデンサの電極の面積が ' + m(S + ' cm²') + '(' + m(S + '×10⁻⁴ m²') + ')、電極間の距離が ' + m(d + ' mm') + '、誘電体の比誘電率が ' + m(er) + ' である。真空の誘電率を ' + m('9×10⁻¹² F/m') + ' とすると、静電容量は何 pF か。', unit: 'pF', ans: C, abs: 0, rel: 0.01,
        steps: [m('C = ε₀ εr S / d'), m('= 9×10⁻¹² × ' + er + ' × ' + S + '×10⁻⁴ / (' + d + '×10⁻³)'), m('= ' + fmt(C) + '×10⁻¹² F = ' + fmt(C) + ' pF'), '(10 のべき乗: ' + m('10⁻¹² × 10⁻⁴ / 10⁻³ = 10⁻¹³') + ' なので、9 × ' + er + ' × ' + S + ' / ' + d + ' を 10 で割ると pF になる)'], tolText: TOL1 }; }
    if (t === 2) { var s = pick(CSER), Vv = pick([10, 20, 30, 60, 100]), Qs = s[2] * Vv;
      return { text: '静電容量 ' + m(s[0] + ' μF') + ' と ' + m(s[1] + ' μF') + ' のコンデンサを直列に接続し、両端に ' + m(Vv + ' V') + ' の直流電圧を加えた。' + m(s[0] + ' μF') + ' のコンデンサに蓄えられる電荷は何 μC か。', unit: 'μC', ans: Qs, abs: 0, rel: 0.01,
        steps: ['合成容量: ' + m('C = (' + s[0] + ' × ' + s[1] + ') / (' + s[0] + ' + ' + s[1] + ') = ' + s[2] + ' μF'), '直列では、どちらにも同じ電荷が蓄えられる: ' + m('Q = C × V = ' + s[2] + ' × ' + Vv + ' = ' + Qs + ' μC')], tolText: TOL1 };
    }
    var c1 = pick([10, 20, 30, 40]), c2 = pick([10, 20, 30, 60]), v1 = pick([25, 50, 60, 100]), v2 = pick([25, 50, 60, 100]);
    var q = Math.min(c1 * v1, c2 * v2), Vt = q / c1 + q / c2;
    return { text: '耐圧 ' + m(v1 + ' V') + '、静電容量 ' + m(c1 + ' μF') + ' のコンデンサ C₁ と、耐圧 ' + m(v2 + ' V') + '、静電容量 ' + m(c2 + ' μF') + ' のコンデンサ C₂ を直列に接続した。両端に加えることができる最大の電圧は何 V か。', unit: 'V', ans: Vt, abs: 0, rel: 0.01,
      steps: ['直列では、どちらも同じ電荷 Q が蓄えられる。各コンデンサに蓄えられる最大の電荷 ' + m('Q = C × 耐圧'), m('C₁: ' + c1 + ' × ' + v1 + ' = ' + (c1 * v1) + ' μC、C₂: ' + c2 + ' × ' + v2 + ' = ' + (c2 * v2) + ' μC'), '小さい方に合わせる: ' + m('Q = ' + q + ' μC'), m('V = Q/C₁ + Q/C₂ = ' + fmt(q / c1) + ' + ' + fmt(q / c2) + ' = ' + fmt(Vt) + ' V')], tolText: TOL1 };
  }

  function genRes2() {
    var t = ri(0, 2);
    if (t === 0) { var k = pick([2, 3, 4]), kind = pick(['L', 'C']);
      return { text: '直列共振回路の共振周波数を ' + m(k + ' 倍') + ' にするためには、' + (kind === 'L' ? 'コイルのインダクタンス L' : 'コンデンサの静電容量 C') + ' を何倍にすればよいか。ただし、もう一方は変えないものとする。', unit: '倍', ans: 1 / (k * k), abs: 0, rel: 0.02,
        steps: [m('f = 1 / (2π√(LC))') + ' なので、f は ' + m('√(' + kind + ')') + ' に反比例する。', 'f を ' + k + ' 倍にするには、' + m('√' + kind) + ' を 1/' + k + ' にする → ' + kind + ' を ' + m('1/' + (k * k) + ' 倍') + ' にする。', m('1/' + (k * k) + ' = ' + fmt(1 / (k * k)))], tolText: '小数または分数を小数にして入力(±2% まで正解)' }; }
    var u = pick([2, 5, 10]), R = 3 * u, X = 4 * u, Z = R * X / Math.sqrt(R * R + X * X), V = pick([12, 24, 48]);
    if (t === 1) return { text: '抵抗 R = ' + m(R + ' Ω') + ' と誘導性リアクタンス XL = ' + m(X + ' Ω') + ' の並列回路の合成インピーダンスの大きさは何 Ω か。', unit: 'Ω', ans: Z, abs: 0, rel: 0.01,
      steps: [m('Z = (R × XL) / √(R² + XL²)'), m('= (' + R + ' × ' + X + ') / √(' + (R * R) + ' + ' + (X * X) + ') = ' + (R * X) + ' / ' + (5 * u) + ' = ' + fmt(Z) + ' Ω'), '3:4:5 の直角三角形に気づくと √ が早い。'], tolText: TOL1 };
    return { text: '抵抗 R = ' + m(R + ' Ω') + ' と誘導性リアクタンス XL = ' + m(X + ' Ω') + ' の並列回路に ' + m(V + ' V') + ' の交流電圧を加えた。電源から流れる電流の大きさは何 A か。', unit: 'A', ans: V / Z, abs: 0, rel: 0.01,
      steps: ['並列では、各枝の電流は別々に求めて、直角に合成する(位相が 90° 違う)。', m('IR = ' + V + ' / ' + R + ' = ' + fmt(V / R) + ' A、IL = ' + V + ' / ' + X + ' = ' + fmt(V / X) + ' A'), m('I = √(IR² + IL²) = ' + fmt(V / Z) + ' A'), '(別解: ' + m('Z = ' + fmt(Z) + ' Ω') + ' を先に求めて ' + m('I = V / Z') + ')'], tolText: TOL1 };
  }

  function genDist2() {
    var a = pick([0.1, 0.2, 0.4, 0.5]), V1 = pick([25, 50, 100]), V2 = 3 * a, V3 = 4 * a, d = 5 * a / V1 * 100;
    return { text: '増幅器の出力で、基本波(正弦波)の電圧の実効値が ' + m(V1 + ' V') + '、第二高調波が ' + m(fmt(V2) + ' V') + '、第三高調波が ' + m(fmt(V3) + ' V') + ' であった。ひずみ率は何 % か。', unit: '%', ans: d, abs: 0.05, rel: 0.02,
      steps: [m('ひずみ率 = √(V₂² + V₃²) / V₁ × 100'), m('√(' + fmt(V2) + '² + ' + fmt(V3) + '²) = ' + fmt(5 * a) + ' V') + '(3:4:5 の直角三角形)', m(fmt(5 * a) + ' / ' + V1 + ' × 100 = ' + fmt(d) + ' %')], tolText: '小数で入力(±2% または ±0.05 まで正解)' };
  }

  function genAm2() {
    var Pc = pick([100, 200, 400, 800]), pc = pick([50, 60, 70, 80, 100]), mm = pc / 100, t = ri(0, 1), P = Pc * (1 + mm * mm / 2);
    if (t === 0) return { text: 'AM(A3E)送信機で、無変調時の搬送波電力が ' + m(Pc + ' W') + '、変調信号が単一正弦波で変調度 ' + m(pc + ' %') + ' のとき、振幅変調波の平均電力は約何 W か。', unit: 'W', ans: P, abs: 0, rel: 0.02,
      steps: [m('P = Pc × (1 + m²/2)'), m('= ' + Pc + ' × (1 + ' + fmt(mm * mm) + '/2) = ' + Pc + ' × ' + fmt(1 + mm * mm / 2) + ' ≈ ' + fmt(P) + ' W')], tolText: '数値のみ(±2% まで正解)' };
    var Ps = Pc * mm * mm / 4;
    return { text: 'AM(A3E)送信機で、無変調時の搬送波電力が ' + m(Pc + ' W') + '、変調度 ' + m(pc + ' %') + ' のとき、上側波帯(片方)の電力は約何 W か。', unit: 'W', ans: Ps, abs: 0, rel: 0.02,
      steps: ['両側波帯の合計は ' + m('Pc × m²/2') + '、上下に等分するので片方は ' + m('Pc × m²/4'), m('= ' + Pc + ' × ' + fmt(mm * mm) + ' / 4 ≈ ' + fmt(Ps) + ' W')], tolText: '数値のみ(±2% まで正解)' };
  }

  function genPll2() {
    var fr = pick([1, 2, 4, 5, 10]), M = pick([2, 4, 5, 8, 10]), N = pick([8, 16, 20, 32, 50, 100]), f0 = fr / M * N;
    return { text: 'PLL 周波数シンセサイザで、基準発振器の周波数が ' + m(fr + ' MHz') + '、固定分周器の分周比が 1/' + m(M) + '、可変分周器の分周比が 1/' + m(N) + ' である。ループがロックしたときの出力周波数 f₀ は何 MHz か。', unit: 'MHz', ans: f0, abs: 0, rel: 0.01,
      steps: ['位相比較器の2つの入力周波数が等しくなる: ' + m('f₀ / N = 基準 / M'), m('f₀ = 基準 × N / M = ' + fr + ' × ' + N + ' / ' + M + ' = ' + fmt(f0) + ' MHz')], tolText: TOL1 };
  }

  function genImg2() {
    var fr = pick([3.55, 7.1, 14.2, 21.2, 28.5]), fi = 0.455, hi = Math.random() < 0.5, ans = hi ? fr + 2 * fi : fr - 2 * fi;
    return { text: 'スーパヘテロダイン受信機で、受信周波数が ' + m(fr + ' MHz') + '、中間周波数が ' + m('455 kHz') + ' で、局部発振周波数は受信周波数より' + (hi ? '高い' : '低い') + '。影像周波数は何 MHz か。', unit: 'MHz', ans: ans, abs: 0.005, rel: 0,
      steps: ['局部発振周波数: ' + m('fL = ' + fr + (hi ? ' + ' : ' − ') + '0.455 = ' + fmt(hi ? fr + fi : fr - fi) + ' MHz'), '影像周波数は、局部発振周波数から見て受信周波数と反対側に、中間周波数だけ離れた所: ' + m('fR ' + (hi ? '+' : '−') + ' 2 × fI = ' + fr + (hi ? ' + ' : ' − ') + '0.91 = ' + fmt(ans) + ' MHz')], tolText: '小数で入力(±0.005 MHz まで正解)' };
  }

  function genTr2() {
    var n = pick([2, 3, 4, 5, 10]), R = pick([2, 4, 8, 10, 50]), t = ri(0, 1);
    if (t === 0) return { text: '巻数比(一次側巻数 n₁ / 二次側巻数 n₂)が ' + m(n) + ' の変成器の二次側に ' + m(R + ' Ω') + ' の抵抗を接続した。一次側端子から見たインピーダンスは何 Ω か。', unit: 'Ω', ans: n * n * R, abs: 0, rel: 0.01,
      steps: ['インピーダンスは巻数比の2乗に比例する: ' + m('Z₁ = (n₁/n₂)² × R'), m('= ' + n + '² × ' + R + ' = ' + (n * n) + ' × ' + R + ' = ' + (n * n * R) + ' Ω')], tolText: TOL1 };
    return { text: '一次側から見たインピーダンスを ' + m(n * n * R + ' Ω') + ' にするため、二次側に ' + m(R + ' Ω') + ' の負荷を接続した変成器を用いる。巻数比 n₁ / n₂ はいくらか。', unit: '', ans: n, abs: 0, rel: 0.01,
      steps: [m('Z₁ = (n₁/n₂)² × R') + ' から ' + m('(n₁/n₂)² = Z₁ / R = ' + (n * n * R) + ' / ' + R + ' = ' + (n * n)), m('n₁/n₂ = √' + (n * n) + ' = ' + n)], tolText: TOL1 };
  }

  function genOsc2() {
    var t = ri(0, 1);
    if (t === 0) { var N = pick([2, 2.5, 4, 5]), tm = pick([0.1, 0.2, 0.4, 0.5, 1]), T = N * tm, f = 1 / T;
      return { text: 'オシロスコープで正弦波を観測したところ、波形の1周期が横軸の ' + m(N + ' 目盛り') + ' であった。掃引時間は 1 目盛り当たり ' + m(tm + ' ms') + ' である。この波形の周波数は何 kHz か。', unit: 'kHz', ans: f, abs: 0, rel: 0.02,
        steps: ['1周期の時間: ' + m('T = ' + N + ' × ' + tm + ' = ' + fmt(T) + ' ms'), m('f = 1 / T = 1 / ' + fmt(T) + ' ms = ' + fmt(f) + ' kHz'), '(周期が ms のとき、周波数は kHz)'], tolText: '数値のみ(±2% まで正解)' }; }
    var pk = pick([2, 3, 4, 5]), vd = pick([1, 2, 2.5, 5]), Vp = pk * vd, Vr = Vp / 1.41;
    return { text: 'オシロスコープで観測した正弦波の、山の頂点から零点までの高さ(最大値)が縦軸の ' + m(pk + ' 目盛り') + ' であった。縦軸は 1 目盛り当たり ' + m(vd + ' V') + ' である。この正弦波の実効値は約何 V か。(√2 = 1.41 とする)', unit: 'V', ans: Vr, abs: 0, rel: 0.03,
      steps: ['最大値: ' + m(pk + ' × ' + vd + ' = ' + fmt(Vp) + ' V'), m('実効値 = 最大値 / √2 = ' + fmt(Vp) + ' / 1.41 ≈ ' + fmt(Vr) + ' V')], tolText: TOL3 };
  }

  function genRect2() {
    var V = pick([10, 20, 50, 100]), t = ri(0, 2), Vm = V * 1.41;
    if (t === 0) return { text: '実効値 ' + m(V + ' V') + ' の交流を、ブリッジ形の全波整流回路(ダイオード4個、抵抗負荷)で整流する。各ダイオードに加わる逆電圧の最大値は約何 V か。(√2 = 1.41 とする)', unit: 'V', ans: Vm, abs: 0, rel: 0.03,
      steps: ['ブリッジ形では、逆電圧の最大値は交流電圧の最大値に等しい。', m('Vm = 実効値 × √2 = ' + V + ' × 1.41 ≈ ' + fmt(Vm) + ' V')], tolText: TOL3 };
    if (t === 1) return { text: '実効値 ' + m(V + ' V') + ' の交流を、半波整流回路(ダイオード1個)とコンデンサ入力形の平滑回路で整流する。無負荷のとき、ダイオードに加わる逆電圧の最大値は約何 V か。(√2 = 1.41 とする)', unit: 'V', ans: 2 * Vm, abs: 0, rel: 0.03,
      steps: ['コンデンサは交流の最大値 Vm まで充電される。', '交流が逆の最大値になるとき、ダイオードには、コンデンサの電圧と電源電圧が足し合わさって加わる: ' + m('2 × Vm'), m('2 × ' + V + ' × 1.41 ≈ ' + fmt(2 * Vm) + ' V')], tolText: TOL3 };
    var EL = pick([12, 24, 50, 100]), pc = pick([2, 4, 5, 10]), E0 = EL * (1 + pc / 100);
    return { text: '電源装置の無負荷時の出力電圧が ' + m(fmt(E0) + ' V') + '、定格負荷を接続したときの出力電圧が ' + m(EL + ' V') + ' であった。電圧変動率は何 % か。', unit: '%', ans: pc, abs: 0.2, rel: 0,
      steps: [m('電圧変動率 = (E₀ − EL) / EL × 100'), m('= (' + fmt(E0) + ' − ' + EL + ') / ' + EL + ' × 100 = ' + pc + ' %')], tolText: '数値のみ(±0.2% まで正解)' };
  }

  // ---------------------------------------------------------------- 級ごとの定義
  return {
    4: {
      label: '4級',
      intro: '4級の無線工学の計算問題用。オームの法則・電力・合成抵抗・変調度・波長とアンテナ長・変成器・電圧計/電流計の倍率を、電卓なしで解ける数字で出題します。',
      cats: { ohm: 'オームの法則', pw: '電力', rs: '合成抵抗', lam: '波長・アンテナ長', am: '変調度', tr: '変成器', mt: '測定範囲の拡大' },
      order: ['ohm', 'pw', 'rs', 'lam', 'am', 'tr', 'mt'],
      gen: { ohm: genOhm, pw: genPw4, rs: genRs4, lam: genLam, am: genAm4, tr: genTr, mt: genMt4 },
    },
    3: {
      label: '3級',
      intro: '3級の無線工学の計算問題用。直流回路・電力・コンデンサ・交流の実効値・変成器・波長・ダイポールアンテナ・変調度・電力効率を、電卓なしで解ける数字で出題します。',
      cats: { dcc: '直流回路', pw: '電力', cap: 'コンデンサ', ac: '交流の値', tr: '変成器', lam: '波長・アンテナ長', ant: 'ダイポールの電力', am: '変調度', eff: '電力効率' },
      order: ['dcc', 'pw', 'cap', 'ac', 'tr', 'lam', 'ant', 'am', 'eff'],
      gen: { dcc: genDcc, pw: genPw3, cap: genCap3, ac: genAc3, tr: genTr, lam: genLam, ant: genAnt, am: genAm3, eff: genEff },
    },
    2: {
      label: '2級',
      intro: '2級の無線工学A問題の計算用。コンデンサ・直流回路・共振/LR並列・ひずみ率・AM電力・PLL・電力効率・影像周波数・変成器・オシロスコープ・ダイポール・整流を、電卓なしで解ける数字で出題します。',
      cats: { cap: 'コンデンサ', dcc: '直流回路', res: '共振・LR並列', dist: 'ひずみ率', am: 'AM電力', pll: 'PLL', eff: '電力効率', img: '影像周波数', tr: 'インピーダンス変換', osc: 'オシロスコープ', ant: 'ダイポールの電力', rect: '電源(整流・変動率)' },
      order: ['cap', 'dcc', 'res', 'dist', 'am', 'pll', 'eff', 'img', 'tr', 'osc', 'ant', 'rect'],
      gen: { cap: genCap2, dcc: genDcc, res: genRes2, dist: genDist2, am: genAm2, pll: genPll2, eff: genEff, img: genImg2, tr: genTr2, osc: genOsc2, ant: genAnt, rect: genRect2 },
    },
  };
})();
