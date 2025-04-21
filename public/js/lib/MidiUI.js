import MathHelper from './MathHelper.js';

export default class MidiUI {
  constructor(options = {}) {
    const defaults = {
      debug: false,
      el: 'composition',
      measuresPerPage: 4,
      onChangePage: () => {},
      segmentsPerQuarterNote: 8, // 2 = 1/8th, 4 = 1/16th, 8 = 1/32nd, 16 = 1/64th
    };
    this.options = Object.assign(defaults, options);
    this.init();
  }

  init() {
    this.$el = document.getElementById(this.options.el);
    this.$pageLeft = document.getElementById('page-left');
    this.$pageRight = document.getElementById('page-right');
    this.$select = document.getElementById('select-page');
    this.loadListeners();
  }

  changePage(delta) {
    const newPage = this.page + delta;
    if (newPage < 0 || newPage >= this.pageCount) return;
    this.page = newPage;
    this.$select.value = newPage;
    this.loadPage(newPage);
  }

  highlight(note, noteState) {
    const $el = document.getElementById(noteState.id);
    const { duration } = note;
    const { children } = $el;
    const count = children.length;
    const step = Math.round((duration / count) * 1000);
    for (let i = 0; i < count; i++) {
      const $child = $el.children[i];
      const delay = i * step;
      setTimeout(() => {
        $child.classList.add('highlight');
        setTimeout(() => {
          $child.classList.remove('highlight');
        }, 500);
      }, delay);
    }
  }

  load(midi) {
    const { measuresPerPage, segmentsPerQuarterNote } = this.options;
    this.midi = midi;
    this.page = 0;
    this.pageCount = Math.ceil((1.0 * midi.measureCount) / measuresPerPage);
    this.ticksPerCell = midi.ticksPerQNote / segmentsPerQuarterNote;
    this.cellsPerPage = segmentsPerQuarterNote * 4 * measuresPerPage;
    this.ticksPerPage = this.ticksPerCell * this.cellsPerPage;
    this.cellW = 100.0 / this.cellsPerPage;
    this.cellH = 100.0 / midi.midiNoteRows;
    console.log(`Pages: ${this.pageCount}`);
    this.loadPage(this.page);
    this.renderPagination();
  }

  loadListeners() {
    this.$select.addEventListener('change', (_event) => {
      this.onSelectPage();
    });
    this.$pageLeft.addEventListener('click', (_event) => {
      this.changePage(-1);
    });
    this.$pageRight.addEventListener('click', (_event) => {
      this.changePage(1);
    });
  }

  loadPage(page) {
    const { measuresPerPage } = this.options;
    const { ticksPerMeasure } = this.midi;
    this.tickStart = page * measuresPerPage * ticksPerMeasure;
    this.tickEnd = (page + 1) * measuresPerPage * ticksPerMeasure;
    this.render();

    if (page === 0) this.$pageLeft.setAttribute('disabled', 'disabled');
    else this.$pageLeft.removeAttribute('disabled');
    if (page >= this.pageCount - 1)
      this.$pageRight.setAttribute('disabled', 'disabled');
    else this.$pageRight.removeAttribute('disabled');

    this.options.onChangePage();
  }

  onSelectPage() {
    const page = parseInt(this.$select.value);
    this.loadPage(page);
  }

  render() {
    const { midi, $el, ticksPerCell, cellsPerPage, cellH, tickStart, tickEnd } =
      this;
    const { loadedMidi, state } = midi;

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

  renderPagination() {
    const { $select, pageCount } = this;
    let html = '';
    for (let i = 0; i < pageCount; i++) {
      html += `<option value="${i}">Page ${i + 1}</option>`;
    }
    $select.innerHTML = html;
  }
}
