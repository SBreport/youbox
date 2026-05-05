var DICT_CATEGORIES = [
  { id: 'intro',   label: '도입부',   icon: '🎬' },
  { id: 'hook',    label: '후크',     icon: '🎯' },
  { id: 'overlay', label: '표시 제목', icon: '📌' },
  { id: 'cut',     label: '컷 패턴',  icon: '✂️' },
  { id: 'cta',     label: '결론 CTA', icon: '🎁' },
  { id: 'key',     label: '키 템플릿', icon: '🔑' }
];

function _uuid() {
  return (typeof crypto !== 'undefined' && crypto.randomUUID)
    ? crypto.randomUUID()
    : Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function _readJSON(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) || fallback; }
  catch (e) { return fallback; }
}

function _writeJSON(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

var DictionaryDB = {
  STORAGE_KEY: 'youbox-dictionary-v1',
  STUDIES_KEY: 'youbox-studies-v1',

  list: function () {
    return _readJSON(this.STORAGE_KEY, []);
  },

  get: function (id) {
    return this.list().find(function (c) { return c.id === id; }) || null;
  },

  add: function (card) {
    var list = this.list();
    var item = Object.assign({
      id: _uuid(),
      category: 'intro',
      title: '',
      content: '',
      sourceUrl: '',
      sourceTitle: '',
      addedAt: new Date().toISOString(),
      favorite: false,
      structureNotes: ''
    }, card);
    list.unshift(item);
    _writeJSON(this.STORAGE_KEY, list);
    return item;
  },

  update: function (id, patch) {
    var list = this.list();
    var idx = list.findIndex(function (c) { return c.id === id; });
    if (idx === -1) return null;
    list[idx] = Object.assign({}, list[idx], patch);
    _writeJSON(this.STORAGE_KEY, list);
    return list[idx];
  },

  remove: function (id) {
    var list = this.list().filter(function (c) { return c.id !== id; });
    _writeJSON(this.STORAGE_KEY, list);
  },

  toggleFavorite: function (id) {
    var card = this.get(id);
    if (!card) return;
    this.update(id, { favorite: !card.favorite });
  },

  countByCategory: function () {
    var counts = {};
    DICT_CATEGORIES.forEach(function (cat) { counts[cat.id] = 0; });
    this.list().forEach(function (card) {
      if (counts.hasOwnProperty(card.category)) counts[card.category]++;
    });
    return counts;
  },

  getCategories: function () { return DICT_CATEGORIES; },

  getCategoryLabel: function (id) {
    var cat = DICT_CATEGORIES.find(function (c) { return c.id === id; });
    return cat ? cat.label : id;
  },

  studies: {
    _key: 'youbox-studies-v1',

    list: function () {
      return _readJSON(this._key, []);
    },

    add: function (study) {
      var list = this.list();
      var item = Object.assign({
        id: _uuid(),
        url: '',
        title: '',
        likes: 0,
        source: '',
        foundAt: new Date().toISOString(),
        breakdown: {},
        savedToDictIds: [],
        application: '',
        applicationPriority: 'now',
        completedAt: null,
        weekKey: _weekKey(),
        step: 1
      }, study);
      list.unshift(item);
      _writeJSON(this._key, list);
      return item;
    },

    update: function (id, patch) {
      var list = this.list();
      var idx = list.findIndex(function (s) { return s.id === id; });
      if (idx === -1) return null;
      list[idx] = Object.assign({}, list[idx], patch);
      _writeJSON(this._key, list);
      return list[idx];
    },

    remove: function (id) {
      var list = this.list().filter(function (s) { return s.id !== id; });
      _writeJSON(this._key, list);
    },

    countThisWeek: function () {
      var wk = _weekKey();
      return this.list().filter(function (s) {
        return s.weekKey === wk && s.completedAt;
      }).length;
    }
  }
};

function _weekKey() {
  var d = new Date();
  var day = d.getDay();
  var diff = d.getDate() - day + (day === 0 ? -6 : 1);
  var mon = new Date(d.setDate(diff));
  return mon.getFullYear() + '-W' +
    String(mon.getMonth() + 1).padStart(2, '0') +
    String(mon.getDate()).padStart(2, '0');
}
