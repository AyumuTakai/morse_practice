// 計算の分野の名前と並び(計算の画面と、復習の画面で使う)
var CATS = {
    db:'dB換算', amp:'反転増幅器', am:'変調度', qw:'λ/4整合',
    ant:'空中線電力', rect:'整流回路', cap:'コンデンサ', pf:'力率', res:'直列共振'
  };
var ORDER = ['db','amp','am','qw','ant','rect','cap','pf','res'];

// 級ごとの分野名(2〜4級は gen-keisan.js の KGEN と同じ名前)
var KCATS = {
  1: CATS,
  2: { cap:'コンデンサ', dcc:'直流回路', res:'共振・LR並列', dist:'ひずみ率', am:'AM電力', pll:'PLL', eff:'電力効率', img:'影像周波数', tr:'インピーダンス変換', osc:'オシロスコープ', ant:'ダイポールの電力', rect:'電源(整流・変動率)' },
  3: { dcc:'直流回路', pw:'電力', cap:'コンデンサ', ac:'交流の値', tr:'変成器', lam:'波長・アンテナ長', ant:'ダイポールの電力', am:'変調度', eff:'電力効率' },
  4: { ohm:'オームの法則', pw:'電力', rs:'合成抵抗', lam:'波長・アンテナ長', am:'変調度', tr:'変成器', mt:'測定範囲の拡大' }
};
function calcCats(grade, cat) {
  var t = KCATS[Number(grade)];
  return (t && t[cat]) || cat;
}
