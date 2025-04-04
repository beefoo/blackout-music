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

    const midi = new Midi();
    const url = `${options.midiPath}${options.scores[5].id}.mid`;
    const loaded = await midi.loadFromURL(url);
  }
}
