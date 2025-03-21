import Midi from './Midi.js';

export default class App {
  constructor(options = {}) {
    const defaults = {
      el: 'app',
      debug: false,
      midiPath: 'mid/',
    };
    this.options = Object.assign(defaults, options);
    this.init();
  }

  async init() {
    const { options } = this;
    this.el = document.getElementById(options.el);

    const midi = new Midi();
    const url = `${options.midiPath}${this.options.scores[0].mid}`;
    const loaded = await midi.loadFromURL(url);
  }
}
