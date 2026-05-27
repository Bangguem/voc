// ── state.js ──────────────────────────────────────────────────────────────
// 앱 전체 상태 관리 및 localStorage 저장/불러오기

const State = {
  // 현재 레벨 ('n5' | 'n3')
  level: localStorage.getItem('jlpt_level') || 'n5',

  // 암기 상태 (레벨별로 별도 저장)
  known:   { n5: new Set(JSON.parse(localStorage.getItem('jlpt_known_n5')   || '[]')),
             n3: new Set(JSON.parse(localStorage.getItem('jlpt_known_n3')   || '[]')) },
  unknown: { n5: new Set(JSON.parse(localStorage.getItem('jlpt_unknown_n5') || '[]')),
             n3: new Set(JSON.parse(localStorage.getItem('jlpt_unknown_n3') || '[]')) },

  // UI 상태
  filter: 'all',
  search: '',
  sort:   'index',
  mode:   'list',   // 'list' | 'flash'

  // 플래시카드 상태
  fcIndex:    0,
  fcRevealed: false,
  fcList:     [],

  // 표시 설정
  fontSize:        parseInt(localStorage.getItem('jlpt_fs') || '18'),
  hideReadingList: localStorage.getItem('jlpt_hide_reading_list') === '1',
  hideMeaningList: localStorage.getItem('jlpt_hide_meaning_list') === '1',
  hideReadingFc:   localStorage.getItem('jlpt_hide_reading_fc')   === '1',
  theme:           localStorage.getItem('jlpt_theme') || 'dark',

  // 현재 레벨의 단어 배열 반환
  get vocab() {
    return this.level === 'n3' ? VOCAB_N3 : VOCAB_N5;
  },
  get knownSet() {
    return this.known[this.level];
  },
  get unknownSet() {
    return this.unknown[this.level];
  },

  // 저장
  save() {
    localStorage.setItem('jlpt_level',           this.level);
    localStorage.setItem('jlpt_known_n5',         JSON.stringify([...this.known.n5]));
    localStorage.setItem('jlpt_known_n3',         JSON.stringify([...this.known.n3]));
    localStorage.setItem('jlpt_unknown_n5',       JSON.stringify([...this.unknown.n5]));
    localStorage.setItem('jlpt_unknown_n3',       JSON.stringify([...this.unknown.n3]));
    localStorage.setItem('jlpt_fs',              this.fontSize);
    localStorage.setItem('jlpt_hide_reading_list', this.hideReadingList ? '1' : '0');
    localStorage.setItem('jlpt_hide_meaning_list', this.hideMeaningList ? '1' : '0');
    localStorage.setItem('jlpt_hide_reading_fc',   this.hideReadingFc   ? '1' : '0');
    localStorage.setItem('jlpt_theme',           this.theme);
  },

  // 필터링된 단어 목록 반환
  filtered() {
    let list = this.vocab;

    if (this.search) {
      const q = this.search.toLowerCase();
      list = list.filter(w =>
        w.kanji.includes(q) || w.reading.includes(q) || w.meaning.toLowerCase().includes(q)
      );
    }

    const k = this.knownSet, u = this.unknownSet;
    if      (this.filter === 'known')   list = list.filter(w =>  k.has(w.id));
    else if (this.filter === 'unknown') list = list.filter(w => !k.has(w.id));
    else if (this.filter === 'noun')    list = list.filter(w => w.type === 'noun');
    else if (this.filter === 'verb')    list = list.filter(w => w.type === 'verb');
    else if (this.filter === 'adj')     list = list.filter(w => w.type === 'adj');
    else if (this.filter === 'adv')     list = list.filter(w => w.type === 'adv');

    if      (this.sort === 'alpha') list = [...list].sort((a,b) => a.reading.localeCompare(b.reading));
    else if (this.sort === 'known') list = [...list].sort((a,b) => (k.has(a.id)?1:0) - (k.has(b.id)?1:0));

    return list;
  },

  markKnown(id) {
    if (this.knownSet.has(id)) this.knownSet.delete(id);
    else { this.knownSet.add(id); this.unknownSet.delete(id); }
    this.save();
  },
  markUnknown(id) {
    if (this.unknownSet.has(id)) this.unknownSet.delete(id);
    else { this.unknownSet.add(id); this.knownSet.delete(id); }
    this.save();
  },
};
