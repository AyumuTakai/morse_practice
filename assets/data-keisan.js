// 計算の分野の名前と並び(計算の画面と、復習の画面で使う)
var CATS = {
    db:'dB換算', amp:'反転増幅器', am:'変調度', qw:'λ/4整合',
    ant:'空中線電力', rect:'整流回路', cap:'コンデンサ', pf:'力率', res:'直列共振'
  };
var ORDER = ['db','amp','am','qw','ant','rect','cap','pf','res'];

// 級ごとの分野名(いまは1級のみ)
function calcCats(grade, cat) {
  return Number(grade) === 1 ? CATS[cat] || cat : cat;
}
