import AudioPlayer from './AudioPlayer.js';
import Midi from './Midi.js';
import MidiSelector from './MidiSelector.js';
import MidiUI from './MidiUI.js';
import MidiUploader from './MidiUploader.js';
import PanelManager from './PanelManager.js';
import PointerManager from './PointerManager.js';
import StringHelper from './StringHelper.js';

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
    this.selector = new MidiSelector(
      Object.assign({}, options, {
        onSelectMidi: (url, fromUser) => {
          this.onSelectMidi(url, fromUser);
        },
      }),
    );
    this.uploader = new MidiUploader(
      Object.assign({}, options, {
        onSelectFile: (file) => {
          this.onSelectMidiFile(file);
        },
      }),
    );
    this.midi = new Midi(
      Object.assign({}, options, {
        onPlayNote: (note) => {
          this.onPlayNote(note);
        },
      }),
    );
    this.ui = new MidiUI(
      Object.assign({}, options, {
        onChangePage: () => {
          this.onChangePage();
        },
      }),
    );
    this.pointers = new PointerManager({
      childSelector: '.note',
      childSelectorRadius: 24,
      target: 'composition',
      onDrag: (pointer) => {
        this.onPointerTriggerNote(pointer);
        this.onPointerDrag(pointer);
      },
      onDragEnd: (pointer) => {
        this.onPointerDragEnd(pointer);
      },
      onTap: (pointer) => {
        this.onPointerTriggerNote(pointer);
      },
    });
    this.sfx = new AudioPlayer({
      sources: {
        tap: 'audio/tap.wav',
        tap2: 'audio/tap2.wav',
      },
    });
    this.panels = new PanelManager();
    this.selector.onSelect(false);
    this.loadListeners();
  }

  loadListeners() {
    const $shareButton = document.getElementById('share-button');
    $shareButton.addEventListener('click', (_event) => this.updateShareURL());

    const $controlButtons = document.querySelectorAll('.control-button');
    $controlButtons.forEach(($button) => {
      $button.addEventListener('click', (_event) => {
        this.sfx.play('tap2');
      });
    });
  }

  onChangePage() {
    const { tickStart, tickEnd } = this.ui;
    this.midi.setBounds(tickStart, tickEnd);
    this.updateURL();
  }

  onPlayNote(note) {
    this.ui.highlight(note);
  }

  onPointerDrag(pointer) {
    if (pointer.pointerType !== 'touch') return;
    const elId = `note-cursor-${pointer.id}`;
    const radius = this.pointers.options.childSelectorRadius;
    let $el = document.getElementById(elId);
    if (!$el) {
      $el = document.createElement('div');
      $el.id = elId;
      $el.classList.add('note-cursor');
      document.body.appendChild($el);
    }
    const { posLast } = pointer;
    if (!posLast) return;
    const x = posLast.x - radius;
    const y = posLast.y - radius;
    $el.style.top = `${y}px`;
    $el.style.left = `${x}px`;
    if (!$el.classList.contains('active')) $el.classList.add('active');
  }

  onPointerDragEnd(pointer) {
    if (pointer.pointerType !== 'touch') return;
    const elId = `note-cursor-${pointer.id}`;
    const $el = document.getElementById(elId);
    if ($el) $el.classList.remove('active');
  }

  onPointerTriggerNote(pointer) {
    const { $targets } = pointer;
    if ($targets.length <= 0) return;

    $targets.forEach(($target) => {
      if (!$target.hasAttribute('id')) return;
      const { id } = $target;
      if (!id.startsWith('note-')) return;
      const [_note, noteIndex] = id.split('-');
      const i = parseInt(noteIndex);

      // de-activate note
      const isActive = $target.classList.contains('active');
      if (isActive) {
        $target.classList.remove('active');
        this.midi.activateNote(i, false);
        this.sfx.play('tap');
      }
    });
  }

  async onSelectMidi(url, fromUser) {
    const isUpload = url.includes('upload');
    const loaded = await this.midi.loadFromURL(url);
    if (!loaded && isUpload) {
      if (fromUser) this.uploader.triggerSelect();
      else {
        this.midi.firstLoad = false;
        this.selector.reset();
      }
      return;
    } else if (!loaded) return;
    this.ui.load(this.midi);
    this.updateURL();
  }

  async onSelectMidiFile(file) {
    const loaded = await this.midi.loadFromFile(file);
    if (!loaded) return;
    this.selector.setId('upload');
    this.ui.load(this.midi);
    this.updateURL();
  }

  updateShareURL() {
    const $input = document.getElementById('share-url');
    const params = {};
    params.c = this.selector.id;
    params.page = this.ui.page + 1;
    const midiParams = this.midi.getURLParams();
    const url = StringHelper.dataToURL(Object.assign({}, params, midiParams));
    $input.value = url;
  }

  updateURL() {
    const params = {};
    params.c = this.selector.id;
    params.page = this.ui.page + 1;
    StringHelper.pushURLState(params, true);
  }
}
