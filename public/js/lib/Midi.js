import { Midi as ToneMidi } from '../vendor/Tone-midi.js';
import MathHelper from './MathHelper.js';
import Synth from './Synth.js';

export default class Midi {
  constructor(options = {}) {
    const defaults = {
      audioContext: false,
      debug: false,
      latency: 0.1,
      onPlayNote: (note) => {},
      throttle: 0.3,
    };
    this.options = Object.assign(defaults, options);
    this.init();
  }

  init() {
    this.isPlaying = false;
    this.isBusy = false;
    this.loadedMidi = false;
    this.startedAt = false;
    this.state = false;
    this.recalculateTimeout = false;
    this.queueRecalculation = false;
    this.firstStarted = false;
    this.boundsJustSet = false;
    this.durationJustChanged = false;
    this.previousTime = false;
    this.ctx = this.options.audioContext || new AudioContext();
    this.synth = new Synth();

    this.$playButton = document.getElementById('toggle-play-button');
    this.$resetButton = document.getElementById('reset-button');
    this.$everyOtherButton = document.getElementById('every-other-button');
    this.$highLowButton = document.getElementById('high-low-button');

    this.ctx.suspend();
    this.loadListeners();
  }

  activateNote(noteIndex, isActive = true) {
    if (!this.isReady()) return;
    this.state.notes[noteIndex].active = isActive;

    this.queueRecalculateNotes();
  }

  // return flattened array of active notes on this page
  getActiveNotes() {
    const { indexStart, indexEnd, notes } = this.state;
    const activeNotes = notes.filter(
      (note, i) => i >= indexStart && i <= indexEnd && note.active,
    );

    // sort them
    activeNotes.sort((a, b) => {
      if (a.offsetTicks === b.offsetTicks) return a.ticks - b.ticks;
      return a.offsetTicks - b.offsetTicks;
    });

    return activeNotes;
  }

  getNoteSchedule(noteIndex, currentTime) {
    const { notes, ticks, durationTicks, offsetTicks, durationOffsetTicks } =
      this.state;
    const nearZero = 0.01;
    const note = notes[noteIndex];

    const duration = this.ticksToSeconds(durationTicks - durationOffsetTicks);
    const start = this.ticksToSeconds(ticks - offsetTicks);
    const end = start + duration;

    const elapsedTotal = currentTime - this.startedAt;
    const elapsedLoop = elapsedTotal % duration;
    const elapsedSong = start + elapsedLoop;

    // if note starts before this page, chop it to the beginning of the page
    let noteDur = this.ticksToSeconds(note.durationTicks);
    const noteTime = this.ticksToSeconds(note.ticks - note.offsetTicks);
    const noteStart = Math.max(noteTime, start);
    if (noteStart > noteTime) noteDur = noteDur - (noteStart - noteTime);

    // if note lasts longer than the page, chop it to the end of the page
    const noteEnd = noteStart + noteDur;
    if (noteEnd > end) noteDur = noteDur - (noteEnd - end);

    // determine when the note should play (in the future)
    let secondsUntilPlay = noteStart - elapsedSong;
    if (secondsUntilPlay < 0 && secondsUntilPlay >= -nearZero)
      secondsUntilPlay = 0;

    return { secondsUntilPlay, noteDur };
  }

  isReady() {
    return this.loadedMidi !== false && !this.isBusy;
  }

  jumpToNote(currentTime, noteIndex, secondsUntilPlay) {
    if (this.startedAt === false) return;
    const padding = Math.max(secondsUntilPlay, 0.01);
    const { ticks, offsetTicks } = this.state;
    const note = this.state.notes[noteIndex];

    const loopStart = this.ticksToSeconds(ticks - offsetTicks);
    const noteTime = this.ticksToSeconds(note.ticks - note.offsetTicks);
    const noteLoopTime = Math.max(noteTime - loopStart - padding, 0);
    this.startedAt = currentTime - noteLoopTime;
    this.previousTime = false;
  }

  async loadFromURL(url) {
    this.isBusy = true;
    const midi = await ToneMidi.fromUrl(url);
    console.log(midi);
    this.loadedMidi = midi;
    this.ticksPerQNote = midi.header.ppq;
    this.ticksPerMeasure = this.ticksPerQNote * 4;
    // make some calculations
    this.measureCount = Math.ceil(midi.durationTicks / this.ticksPerMeasure);

    console.log(`Duration: ${midi.duration}s, Measures: ${this.measureCount}`);

    // flatten the notes
    const notes = midi.tracks
      .map((track, i) => {
        return track.notes.map((note, j) => {
          return {
            name: note.name,
            midi: note.midi,
            track: i,
            trackNoteIndex: j,
            active: true,
            ticks: note.ticks,
            offsetTicks: 0,
            durationTicks: note.durationTicks,
          };
        });
      })
      .flat();
    // sort them
    notes.sort((a, b) => {
      if (a.ticks === b.ticks) {
        return a.durationTicks - b.durationTicks;
      } else return a.ticks - b.ticks;
    });
    // add index and id
    notes.forEach((_note, i) => {
      notes[i].index = i;
      notes[i].id = `note-${i}`;
    });

    // keep track of state
    this.state = {
      bpm: Math.round(midi.header.tempos[0].bpm),
      ticks: 0,
      offsetTicks: 0,
      durationTicks: midi.durationTicks,
      durationOffsetTicks: 0,
      currentIndex: 0,
      indexStart: 0,
      indexEnd: notes.length - 1,
      noteCount: notes.length,
      notes,
    };
    if (this.isPlaying) this.startedAt = this.ctx.currentTime;
    else this.startedAt = 0;
    this.previousTime = false;
    this.isBusy = false;
    return true;
  }

  loadListeners() {
    this.$playButton.addEventListener('click', (_event) => this.togglePlay());
    this.$resetButton.addEventListener('click', (_event) => this.reset());
    this.$everyOtherButton.addEventListener('click', (_event) =>
      this.setEveryOther(),
    );
    this.$highLowButton.addEventListener('click', (_event) =>
      this.setHighLow(),
    );
  }

  onFirstStart() {
    this.firstStarted = true;
    this.synth.load();
    this.startedAt = this.ctx.currentTime;
    this.step();
  }

  pause() {
    if (!this.isReady()) return;
    document.body.classList.remove('playing');
    this.isPlaying = false;
    this.ctx.suspend();
    this.synth.pause();
  }

  play() {
    if (!this.isReady()) return;
    document.body.classList.add('playing');
    this.isPlaying = true;
    this.ctx.resume();
    if (!this.firstStarted) this.onFirstStart();
    else if (this.startedAt === false) this.startedAt = this.ctx.currentTime;
    this.previousTime = false;
  }

  queueRecalculateNotes() {
    if (!this.isReady()) return;

    // only recalculate notes at most once per every wait milliseconds
    const waitMs = Math.round(this.options.throttle * 1000);

    if (this.recalculateTimeout === false) {
      this.recalculateOffsets();
      // wait some time before next calculation
      this.recalculateTimeout = setTimeout(() => {
        this.recalculateTimeout = false;
        if (this.queueRecalculation) {
          this.queueRecalculation = false;
          this.queueRecalculateNotes();
        }
      }, waitMs);
      return;
    }
    this.queueRecalculation = true;
  }

  recalculateOffsets() {
    this.isBusy = true;
    const { currentIndex } = this.state;
    const { currentTime } = this.ctx;
    const { secondsUntilPlay } = this.getNoteSchedule(
      currentIndex,
      currentTime,
    );
    const notes = this.state.notes.slice(0);
    // sort notes by ticks and whether they are active
    notes.sort((a, b) => {
      if (a.ticks === b.ticks) {
        if (a.active) return -1;
        else if (b.active) return 1;
      } else return a.ticks - b.ticks;
      return a.index - b.index;
    });
    const noteCount = notes.length;
    let offsetTicks = 0;
    notes.forEach((note, index) => {
      const { active, ticks } = note;
      const i = note.index;
      // offset time based on previously inactive notes
      this.state.notes[i].offsetTicks = offsetTicks;
      // increase offset of time if note is not active
      if (!active && index < noteCount - 1) {
        const nextNote = notes[index + 1];
        offsetTicks += nextNote.ticks - ticks;
      }
    });
    this.updateOffset();
    this.durationJustChanged = true;
    this.lastNoteIndex = currentIndex;
    this.secondsUntilPlayLastNote = secondsUntilPlay;
    this.isBusy = false;
  }

  reset() {
    if (!this.isReady()) return;
    if (!this.state) return;

    const { indexStart, indexEnd } = this.state;
    for (let i = indexStart; i <= indexEnd; i += 1) {
      const { active, id } = this.state.notes[i];
      if (!active) {
        this.state.notes[i].active = true;
        const $el = document.getElementById(id);
        if ($el) $el.classList.add('active');
      }
    }
    this.queueRecalculateNotes();
  }

  scheduleNote(note, secondsInTheFuture) {
    this.synth.play(note, secondsInTheFuture);
    setTimeout(
      () => {
        this.options.onPlayNote(note);
      },
      Math.round(secondsInTheFuture * 1000),
    );
  }

  setBounds(tickStart, tickEnd) {
    this.isBusy = true;
    if (this.isPlaying) {
      this.ctx.suspend();
      this.synth.pause();
    }
    const { notes } = this.state;

    const indexStart = notes.findIndex((note) => {
      const noteStart = note.ticks;
      const noteEnd = noteStart + note.durationTicks;
      return (
        (noteStart >= tickStart && noteStart < tickEnd) ||
        (noteEnd > tickStart && noteEnd < tickEnd)
      );
    });

    let indexEnd = notes.findIndex((note) => note.ticks >= tickEnd);
    if (indexEnd < 0) indexEnd = notes.length - 1;

    this.state.indexStart = indexStart;
    this.state.indexEnd = indexEnd;
    this.state.currentIndex = indexStart;
    this.state.durationTicks = tickEnd - tickStart;
    this.state.ticks = tickStart;
    this.updateOffset();
    this.startedAt = this.ctx.currentTime;
    this.previousTime = false;
    if (this.isPlaying) this.ctx.resume();
    this.isBusy = false;
    this.boundsJustSet = true;
  }

  setEveryOther() {
    if (!this.isReady()) return;
    if (!this.state) return;

    const { indexStart, indexEnd } = this.state;
    const first = this.state.notes[indexStart];
    let isActive = !first.active;
    for (let i = indexStart; i <= indexEnd; i += 1) {
      const { id } = this.state.notes[i];
      this.state.notes[i].active = isActive;
      const $el = document.getElementById(id);
      if ($el && isActive) $el.classList.add('active');
      else if ($el) $el.classList.remove('active');
      isActive = !isActive;
    }
    this.queueRecalculateNotes();
  }

  setHighLow() {
    if (!this.isReady()) return;
    if (!this.state) return;

    const { indexStart, indexEnd } = this.state;
    const notes = this.state.notes.filter(
      (_note, i) => i >= indexStart && i <= indexEnd,
    );
    notes.sort((a, b) => b.midi - a.midi);
    const first = notes[0];
    const middleIndex = Math.round((notes.length - 1) * 0.5);
    const firstIsActive = !first.active;
    notes.forEach((note, i) => {
      const { id, index } = note;
      const isActive = i < middleIndex ? firstIsActive : !firstIsActive;
      this.state.notes[index].active = isActive;
      const $el = document.getElementById(id);
      if ($el && isActive) $el.classList.add('active');
      else if ($el) $el.classList.remove('active');
    });
    this.queueRecalculateNotes();
  }

  speed(deltaBpm) {
    if (!this.isReady()) return;
    this.isBusy = true;
    const { bpm } = this.state;
    const { duration } = this.loadedMidi;
    const { currentTime } = this.ctx;

    const elapsed = currentTime - this.startedAt;
    const time = elapsed % duration;
    const progress = time / duration;

    const newBpm = MathHelper.clamp(bpm + deltaBpm, 40, 240);
    this.loadedMidi.header.setTempo(newBpm);
    const newDuration = this.loadedMidi.duration;
    const newTime = newDuration * progress;

    console.log(`New BPM: ${newBpm}`);

    this.startedAt = currentTime - newTime;
    this.previousTime = false;
    this.state.bpm = newBpm;
    this.isBusy = false;
  }

  step() {
    window.requestAnimationFrame(() => this.step());
    if (!this.isPlaying || !this.isReady()) return;

    const { previousTime } = this;
    const { latency } = this.options;
    const { currentTime } = this.ctx;
    const { notes, indexStart, indexEnd } = this.state;
    let { currentIndex } = this.state;

    if (previousTime !== false && previousTime === currentTime) return;
    this.previousTime = currentTime;

    if (indexStart < 0 || indexEnd < 0) return;

    const activeNotes = this.getActiveNotes();
    if (activeNotes.length <= 0) return;

    if (this.boundsJustSet) {
      this.boundsJustSet = false;
      this.startedAt = currentTime;
    } else if (this.durationJustChanged) {
      this.durationJustChanged = false;
      const { lastNoteIndex, secondsUntilPlayLastNote } = this;
      currentIndex = lastNoteIndex;
      this.state.currentIndex = lastNoteIndex;
      this.jumpToNote(currentTime, lastNoteIndex, secondsUntilPlayLastNote);
    } else if (this.wasLoopReset(previousTime, currentTime)) {
      this.startedAt = currentTime;
    }

    // build a queue of notes to play in the future
    const queue = [];
    let index = currentIndex;
    while (true) {
      // reset track to the beginning of the page loop
      if (index >= indexEnd) {
        // console.log(`Reset to index ${indexStart}`);
        index = indexStart;
        break;
      }
      const note = notes[index];

      // note not active, skip it
      if (!note.active) {
        index += 1;
        continue;
      }

      const { secondsUntilPlay, noteDur } = this.getNoteSchedule(
        index,
        currentTime,
      );

      // if it's within the latency, queue it
      if (secondsUntilPlay >= 0 && secondsUntilPlay <= latency) {
        index += 1;
        queue.push({
          note: Object.assign({}, note, {
            duration: noteDur,
          }),
          secondsUntilPlay,
        });

        // otherwise, wait
      } else break;
    } // end while loop

    if (this.isBusy) return;

    this.state.currentIndex = index;

    // schedule queue and ensure it is in chronological order
    if (queue.length > 0) {
      queue.sort((a, b) => a.secondsUntilPlay - b.secondsUntilPlay);
      queue.forEach((item) => {
        this.scheduleNote(item.note, item.secondsUntilPlay);
      });
    }
  }

  ticksToSeconds(ticks) {
    const { bpm } = this.state;
    const beats = ticks / this.loadedMidi.header.ppq;
    return (60 / bpm) * beats;
  }

  togglePlay() {
    if (!this.isReady()) return;
    this.$playButton.classList.toggle('playing');
    const isPlaying = this.$playButton.classList.contains('playing');
    if (isPlaying) this.play();
    else this.pause();
  }

  // determine the offset of the current page from de-activated notes
  updateOffset() {
    // return flattened active notes on this page
    const notes = this.getActiveNotes();
    if (notes.length <= 0) return;

    const { ticks, durationTicks } = this.state;
    const endTicks = ticks + durationTicks;
    const firstNote = notes[0];
    const lastNote = notes[notes.length - 1];
    let offsetTicks = firstNote.offsetTicks;
    let durationOffsetTicks = lastNote.offsetTicks - firstNote.offsetTicks;
    const lastNoteEndTicks = lastNote.ticks + lastNote.durationTicks;

    // if only a single note, pad it
    if (notes.length === 1) {
      const paddedDurationTicks = firstNote.durationTicks * 2;
      durationOffsetTicks = this.state.durationTicks - paddedDurationTicks;

      // chop off silence at the end
    } else if (lastNoteEndTicks < endTicks - 1) {
      durationOffsetTicks -= endTicks - lastNoteEndTicks;
    }

    // chop off beginning silence
    if (firstNote.ticks > ticks) {
      const delta = firstNote.ticks - ticks;
      durationOffsetTicks += delta;
      offsetTicks -= delta;
    }

    this.state.offsetTicks = offsetTicks;
    this.state.durationOffsetTicks = durationOffsetTicks;
  }

  wasLoopReset(previousTime, currentTime) {
    const { startedAt } = this;
    const { durationTicks, durationOffsetTicks } = this.state;
    const duration = this.ticksToSeconds(durationTicks);
    const durationOffset = this.ticksToSeconds(durationOffsetTicks);

    const elapsedTotal = currentTime - startedAt;
    const elapsedLoop = elapsedTotal % (duration - durationOffset);

    let loopWasReset = false;
    if (previousTime !== false) {
      const prevElapsedTotal = previousTime - startedAt;
      const prevElapsedLoop = prevElapsedTotal % (duration - durationOffset);
      loopWasReset = prevElapsedLoop > elapsedLoop;
    }

    return loopWasReset;
  }
}
