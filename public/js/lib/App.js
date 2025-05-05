import Midi from './Midi.js';
import MidiSelector from './MidiSelector.js';
import MidiUI from './MidiUI.js';
import PointerManager from './PointerManager.js';

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
    this.pointers = new PointerManager({
      childSelector: '.note',
      target: 'composition',
      onDragEnter: (pointer) => {
        this.toggleNoteFromPointer(pointer);
      },
      onTap: (pointer) => {
        this.toggleNoteFromPointer(pointer);
      },
    });
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

  toggleNoteFromPointer(pointer) {
    if (!pointer.$target || !pointer.$target.hasAttribute('id')) return;
    const id = pointer.$target.id;
    if (!id.startsWith('note-')) return;
    const [_note, trackIndex, noteIndex] = id.split('-');
    const i = parseInt(trackIndex);
    const j = parseInt(noteIndex);

    // toggle active
    pointer.$target.classList.toggle('active');
    const isActive = pointer.$target.classList.contains('active');
    this.midi.activateNote(i, j, isActive);
  }
}
