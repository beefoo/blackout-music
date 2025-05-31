import MathHelper from './MathHelper.js';

export default class MidiUI {
  constructor(options = {}) {
    const defaults = {
      debug: false,
      el: 'composition',
      measuresPerPage: 4,
      page: 1,
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
    this.page = this.options.page - 1;
    this.firstLoad = true;
    this.loadListeners();
  }

  changePage(delta) {
    const newPage = this.page + delta;
    if (newPage < 0 || newPage >= this.pageCount) return;
    this.$select.value = newPage;
    this.loadPage(newPage);
  }

  highlight(note) {
    const $el = document.getElementById(note.id);
    if (!$el) return;
    const { duration } = note;
    const cells = $el.querySelectorAll('.cell');
    const count = cells.length;
    if (duration <= 0 || count <= 0) return;
    const step = Math.round((duration / count) * 1000);
    for (let i = 0; i < count; i++) {
      const $cell = cells[i];
      const delay = i * step;
      setTimeout(() => {
        $cell.classList.add('highlight');
        setTimeout(() => {
          $cell.classList.remove('highlight');
        }, 500);
      }, delay);
    }
  }

  load(midi) {
    const { measuresPerPage, segmentsPerQuarterNote } = this.options;
    const { measureCount, ppq } = midi.state;
    const { firstLoad } = this;
    this.midi = midi;
    this.pageCount = Math.ceil((1.0 * measureCount) / measuresPerPage);
    this.ticksPerCell = ppq / segmentsPerQuarterNote;
    this.cellsPerPage = segmentsPerQuarterNote * 4 * measuresPerPage;
    this.ticksPerPage = this.ticksPerCell * this.cellsPerPage;
    this.cellW = 100.0 / this.cellsPerPage;
    console.log(`Pages: ${this.pageCount}`);
    if (firstLoad) this.firstLoad = false;
    else this.page = 0;
    this.loadPage(this.page);
    this.renderPagination();
    if (firstLoad) this.$select.value = this.page;
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
    const { ticksPerMeasure } = this.midi.state;
    this.page = page;
    this.tickStart = page * measuresPerPage * ticksPerMeasure;
    this.tickEnd = (page + 1) * measuresPerPage * ticksPerMeasure;
    this.tickEnd = Math.min(this.tickEnd, this.midi.state.totalDurationTicks);
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
    const { midi, $el, ticksPerCell, cellsPerPage, tickStart, tickEnd } = this;

    // only show notes on this page
    const notes = midi.state.notes.filter((note) => {
      const { ticks, durationTicks } = note;
      const endTicks = ticks + durationTicks;
      return (
        (ticks >= tickStart && ticks < tickEnd) ||
        (endTicks >= tickStart && endTicks < tickEnd)
      );
    });

    // no notes, return
    if (notes.length <= 0) {
      $el.innerHTML = '';
      return;
    }

    // determine cell height
    const midis = MathHelper.unique(notes.map((note) => note.midi));
    const minNoteRows = 12;
    const maxCellH = 100.0 / minNoteRows;
    const cellH = Math.min(100.0 / midis.length, maxCellH);
    const topOffset =
      midis.length < minNoteRows ? (100.0 - maxCellH * midis.length) * 0.5 : 0;

    // determine rows for each note
    notes.sort((a, b) => b.midi - a.midi);
    let row = -1;
    let currentMidi = -1;
    notes.forEach((note, i) => {
      if (note.midi !== currentMidi) {
        row += 1;
        currentMidi = note.midi;
      }
      notes[i].row = row;
    });
    notes.sort((a, b) => a.index - b.index);

    // build html
    let html = '';
    notes.forEach((note) => {
      const { active, id, name, row, ticks, durationTicks } = note;
      const endTicks = ticks + durationTicks;
      let cells = Math.max(Math.round(durationTicks / ticksPerCell), 1);
      let n = MathHelper.norm(ticks, tickStart, tickEnd);

      // account for notes that start before page
      if (n < 0) {
        n = 0;
        const deltaTicks = tickStart - ticks;
        const deltaCells = Math.floor(deltaTicks / ticksPerCell);
        cells -= deltaCells;
      }

      // account for notes that end after page
      if (endTicks > tickEnd) {
        const deltaTicks = endTicks - tickEnd;
        const deltaCells = Math.floor(deltaTicks / ticksPerCell);
        cells -= deltaCells;
      }

      const cellStart = Math.round(n * (cellsPerPage - 1));
      const width = (cells / cellsPerPage) * 100;
      const left = (cellStart / cellsPerPage) * 100;
      const top = row * cellH + topOffset;
      const activeLabel = active ? 'active' : '';
      const disabledLabel = active ? '' : 'disabled';
      html += `<button id="${id}" class="note ${activeLabel}" ${disabledLabel} style="width: ${width}%; height: ${cellH}%; top: ${top}%; left: ${left}%;" data-name="${name}">`;
      for (let n = 0; n < cells; n++) {
        html += '<span class="cell"></span>';
      }
      html += `<span class="visually-hidden">${name} note</span>`;
      html += '</button>';
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
