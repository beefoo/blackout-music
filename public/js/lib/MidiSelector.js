export default class MidiSelector {
  constructor(options = {}) {
    const defaults = {
      c: '',
      debug: false,
      midiPath: 'mid/',
      onSelectMidi: (url) => {},
      scores: [],
    };
    this.options = Object.assign(defaults, options);
    this.init();
  }

  init() {
    this.id = this.options.c;
    this.$el = document.getElementById('select-composition');
    this.scores = this.options.scores;
    if (this.id === '') this.id = this.scores[0].id;
    this.loadUI();
    this.loadListeners();
  }

  loadListeners() {
    this.$el.addEventListener('change', (_event) => {
      this.onSelect();
    });
  }

  loadUI() {
    const selected = this.id;
    let html = '';
    this.scores.forEach((score) => {
      const title = score.alt !== '' ? score.alt : score.title;
      const selectedString = selected === score.id ? ' selected' : '';
      html += `<option value="${score.id}"${selectedString}>${title}, ${score.creator}</option>`;
    });
    this.$el.innerHTML = html;
  }

  onSelect() {
    const id = this.$el.value;
    const url = `${this.options.midiPath}${id}.mid`;
    this.id = id;
    this.options.onSelectMidi(url);
  }
}
