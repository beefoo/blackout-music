import MathHelper from './MathHelper.js';

export default class MidiUI {
  constructor(options = {}) {
    const defaults = {
      debug: false,
      el: 'composition',
      measuresPerPage: 8,
      segmentsPerQuarterNote: 4, // 2 = 1/8th, 4 = 1/16th, 8 = 1/32nd
    };
    this.options = Object.assign(defaults, options);
    this.init();
  }

  init() {
    this.$el = document.getElementById(this.options.el);
    this.loadListeners();
  }

  load(midi) {
    const { measuresPerPage, segmentsPerQuarterNote } = this.options;
    this.midi = midi;
    this.pageCount = Math.ceil((1.0 * midi.measureCount) / measuresPerPage);
    this.ticksPerCell = midi.ticksPerQNote / segmentsPerQuarterNote;
    this.cellsPerPage = segmentsPerQuarterNote * 4 * measuresPerPage;
    this.ticksPerPage = this.ticksPerCell * this.cellsPerPage;
    this.cellW = 100.0 / this.cellsPerPage;
    this.cellH = 100.0 / midi.midiNoteRows;
    console.log(`Pages: ${this.pageCount}`);
    this.render(0);
  }

  loadListeners() {}

  render(page) {
    const { midi, $el, ticksPerCell, cellsPerPage, cellW, cellH } = this;
    const { measuresPerPage } = this.options;
    const { ticksPerMeasure, loadedMidi, state } = midi;
    const tickStart = page * measuresPerPage * ticksPerMeasure;
    const tickEnd = (page + 1) * measuresPerPage * ticksPerMeasure;

    let html = '';
    loadedMidi.tracks.forEach((track, i) => {
      track.notes.forEach((note, j) => {
        const { ticks, durationTicks } = note;
        const endTicks = ticks + durationTicks;
        if (
          !(
            (ticks >= tickStart && ticks < tickEnd) ||
            (endTicks >= tickStart && endTicks < tickEnd)
          )
        )
          return;
        const noteState = state.tracks[i].notes[j];
        const { id, active, row } = noteState;
        const cells = Math.max(Math.round(durationTicks / ticksPerCell), 1);
        const n = MathHelper.norm(ticks, tickStart, tickEnd);
        const cellStart = Math.round(n * (cellsPerPage - 1));
        const width = (cells / cellsPerPage) * 100;
        const left = (cellStart / cellsPerPage) * 100;
        const top = row * cellH;
        const activeLabel = active ? 'active' : '';
        html += `<button id="${id}" class="note ${activeLabel}" style="width: ${width}%; height: ${cellH}%; top: ${top}%; left: ${left}%;">`;
        for (let n = 0; n < cells; n++) {
          html += '<span class="cell"></span>';
        }
        html += '</button>';
      });
    });
    $el.innerHTML = html;
  }
}
