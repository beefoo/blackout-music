import Midi from './Midi.js';
import MidiSelector from './MidiSelector.js';
import MidiUI from './MidiUI.js';

export default class App {
  constructor(options = {}) {
    const defaults = {
      debug: false,
    };
    this.options = Object.assign(defaults, options);
    this.init();
  }

  init() {
    const { options } = this;
    const selector = new MidiSelector(
      Object.assign(options, {
        onSelectMidi: (url) => {
          this.onSelectMidi(url);
        },
      }),
    );
    this.midi = new Midi(options);
    this.ui = new MidiUI(options);
    selector.onSelect();
  }

  async onSelectMidi(url) {
    const loaded = await this.midi.loadFromURL(url);
    if (!loaded) return;
    this.ui.load(this.midi);
  }
}
