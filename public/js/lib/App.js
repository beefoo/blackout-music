import Midi from './Midi.js';
import MidiSelector from './MidiSelector.js';

export default class App {
  constructor(options = {}) {
    const defaults = {
      debug: false,
    };
    this.options = Object.assign(defaults, options);
    this.init();
  }

  async init() {
    const { options } = this;
    const selector = new MidiSelector(
      Object.assign(options, {
        onSelectMidi: (url) => {
          this.onSelectMidi(url);
        },
      }),
    );
    this.midi = new Midi(options);
    selector.onSelect();
  }

  onSelectMidi(url) {
    this.midi.loadFromURL(url);
  }
}
