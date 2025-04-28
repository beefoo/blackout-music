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
    this.midi = new Midi(
      Object.assign(options, {
        onPlayNote: (note) => {
          this.onPlayNote(note);
        },
      }),
    );
    this.ui = new MidiUI(
      Object.assign(options, {
        onChangePage: () => {
          this.onChangePage();
        },
      }),
    );
    selector.onSelect();
  }

  onChangePage() {
    const { tickStart, tickEnd } = this.ui;
    this.midi.setBounds(tickStart, tickEnd);
  }

  onPlayNote(note, noteState) {
    this.ui.highlight(note);
  }

  async onSelectMidi(url) {
    const loaded = await this.midi.loadFromURL(url);
    if (!loaded) return;
    this.ui.load(this.midi);
  }
}
