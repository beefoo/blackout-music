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
    this.ctx = this.options.audioContext || new AudioContext();
    this.synth = new Synth();

    this.$playButton = document.getElementById('toggle-play-button');
    this.$restartButton = document.getElementById('restart-button');
    this.$backwardButton = document.getElementById('backward-button');
    this.$forwardButton = document.getElementById('forward-button');

    this.ctx.suspend();
    this.loadListeners();
  }

  isReady() {
    return this.loadedMidi !== false && !this.isBusy;
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
    const midiNotes = midi.tracks
      .map((track) => track.notes.map((note) => note.midi))
      .flat();
    // const durTicks = midi.tracks
    //   .map((track) =>
    //     track.notes.map(
    //       (note) => (note.durationTicks / midi.header.ppq) * 0.25,
    //     ),
    //   )
    //   .flat();
    this.minMidiNote = MathHelper.minList(midiNotes);
    this.maxMidiNote = MathHelper.maxList(midiNotes);
    this.midiNoteRows = this.maxMidiNote - this.minMidiNote + 1;
    // this.minMidiDurTicks = MathHelper.minList(durTicks);
    // this.maxMidiDurTicks = MathHelper.maxList(durTicks);
    console.log(`Duration: ${midi.duration}s, Measures: ${this.measureCount}`);
    console.log(`Midi note rows: ${this.midiNoteRows}`);
    // console.log(
    //   `Dur tick range: ${this.minMidiDurTicks} - ${this.maxMidiDurTicks}`,
    // );

    // keep track of state
    this.state = {
      bpm: Math.round(midi.header.tempos[0].bpm),
      ticks: 0,
      offsetTicks: 0,
      durationTicks: midi.durationTicks,
      durationOffsetTicks: 0,
      tracks: midi.tracks.map((track, i) => {
        return {
          currentIndex: 0,
          indexStart: 0,
          indexEnd: track.notes.length - 1,
          noteCount: track.notes.length,
          notes: track.notes.map((note, j) => {
            return {
              id: `note-${i}-${j}`,
              name: note.name,
              row: this.midiNoteRows - (note.midi - this.minMidiNote) - 1,
              index: j,
              track: i,
              active: true,
              ticks: note.ticks,
              offsetTicks: 0,
              durationTicks: note.durationTicks,
            };
          }),
        };
      }),
    };
    if (this.isPlaying) this.startedAt = this.ctx.currentTime;
    else this.startedAt = 0;
    this.isBusy = false;
    return true;
  }

  loadListeners() {
    this.$playButton.addEventListener('click', (_event) => this.togglePlay());
    this.$restartButton.addEventListener('click', (_event) => this.restart());
    this.$backwardButton.addEventListener('click', (_event) => this.skip(-5));
    this.$forwardButton.addEventListener('click', (_event) => this.skip(5));
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
    // get a flattened array of notes
    const notes = this.state.tracks.map((track) => track.notes).flat();
    // sort notes by ticks and whether they are active
    notes.sort((a, b) => {
      if (a.ticks === b.ticks) {
        if (a.active) return -1;
        else if (b.active) return 1;
      } else return a.ticks - b.ticks;
      return 0;
    });
    const noteCount = notes.length;
    let offsetTicks = 0;
    notes.forEach((note, index) => {
      const { active, ticks } = note;
      const i = note.track;
      const j = note.index;
      // offset time based on previously inactive notes
      this.state.tracks[i].notes[j].offsetTicks = offsetTicks;
      // increase offset of time if note is not active
      if (!active && index < noteCount - 1) {
        const nextNote = notes[index + 1];
        offsetTicks += nextNote.ticks - ticks;
      }
    });
    this.updateOffset();
  }

  restart() {
    if (!this.isReady()) return;
    if (!this.firstStarted) return;
    this.isBusy = true;
    if (this.state) {
      this.state.tracks.forEach((track, i) => {
        this.state.tracks[i].currentIndex = track.indexStart;
      });
    }
    this.startedAt = this.isPlaying ? this.ctx.currentTime : false;
    this.isBusy = false;
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
    const { tracks } = this.state;

    tracks.forEach((track, i) => {
      const indexStart = track.notes.findIndex((note) => {
        const noteStart = note.ticks;
        const noteEnd = noteStart + note.durationTicks;
        return (
          (noteStart >= tickStart && noteStart < tickEnd) ||
          (noteEnd > tickStart && noteEnd < tickEnd)
        );
      });
      let indexEnd = track.notes.findIndex((note) => note.ticks >= tickEnd);
      if (indexEnd < 0) indexEnd = track.notes.length - 1;
      this.state.tracks[i].indexStart = indexStart;
      this.state.tracks[i].indexEnd = indexEnd;
      this.state.tracks[i].currentIndex = indexStart;
      // console.log(`Track ${i + 1}: [${indexStart}, ${indexEnd}]`);
    });
    this.state.durationTicks = tickEnd - tickStart;
    this.state.ticks = tickStart;
    this.updateOffset();
    this.startedAt = this.ctx.currentTime;
    if (this.isPlaying) this.ctx.resume();
    this.isBusy = false;
    this.boundsJustSet = true;
  }

  skip(deltaSeconds) {
    if (!this.isReady()) return;
    if (!this.firstStarted) return;

    this.isBusy = true;

    const { tracks, ticks, durationTicks, durationOffsetTicks } = this.state;
    const { currentTime } = this.ctx;

    const start = this.ticksToSeconds(ticks);
    const duration = this.ticksToSeconds(durationTicks);
    const durationOffset = this.ticksToSeconds(durationOffsetTicks);

    const elapsed = Math.max(currentTime - this.startedAt + deltaSeconds, 0);
    const newTime = elapsed % (duration - durationOffset);
    this.startedAt = currentTime - newTime;

    tracks.forEach((track, i) => {
      const { indexStart, indexEnd, notes } = track;
      let newIndex = notes.findIndex((note, j) => {
        const noteTime = this.ticksToSeconds(note.ticks);
        return noteTime > newTime + start && j >= indexStart && j < indexEnd;
      });
      newIndex = Math.max(newIndex, 0);
      this.state.tracks[i].currentIndex = newIndex;
    });

    this.isBusy = false;
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
    this.state.bpm = newBpm;
    this.isBusy = false;
  }

  step() {
    window.requestAnimationFrame(() => this.step());
    if (!this.isPlaying || !this.isReady()) return;
    const { state } = this;
    const { latency } = this.options;
    const { tracks } = this.state;
    const { ticks, durationTicks, offsetTicks, durationOffsetTicks } = state;
    const nearZero = 0.01;

    const start = this.ticksToSeconds(ticks);
    const duration = this.ticksToSeconds(durationTicks);
    const startOffset = this.ticksToSeconds(offsetTicks);
    const durationOffset = this.ticksToSeconds(durationOffsetTicks);
    const end = start - startOffset + duration - durationOffset;

    if (this.boundsJustSet) {
      this.boundsJustSet = false;
      this.startedAt = this.ctx.currentTime;
    }

    const elapsedTotal = this.ctx.currentTime - this.startedAt;
    const elapsedLoop = elapsedTotal % (duration - durationOffset);
    const elapsedSong = start - startOffset + elapsedLoop;

    // build a queue of notes to play in the future
    const queue = [];
    tracks.forEach((track, i) => {
      const { currentIndex, indexStart, indexEnd } = track;
      if (indexStart < 0 || indexEnd < 0) return;
      let index = currentIndex;
      while (true) {
        // reset track to the beginning of the page loop
        if (index >= indexEnd) {
          // console.log(`Reset track ${i + 1} to index ${indexStart}`);
          index = indexStart;
        }
        const note = track.notes[index];

        // note not active, skip it
        if (!note.active) {
          index += 1;
          continue;
        }

        // if note starts before this page, chop it to the beginning of the page
        let noteDur = this.ticksToSeconds(note.durationTicks);
        const noteTime = this.ticksToSeconds(note.ticks);
        const noteStart = Math.max(noteTime, start - startOffset);
        if (noteStart > noteTime) noteDur = noteDur - (noteStart - noteTime);

        // if note lasts longer than the page, chop it to the end of the page
        const noteEnd = noteStart + noteDur;
        if (noteEnd > end) noteDur = noteDur - (noteEnd - end);

        // determine when the note should play (in the future)
        let secondsUntilPlay = noteStart - elapsedSong;
        if (secondsUntilPlay < 0 && secondsUntilPlay >= -nearZero)
          secondsUntilPlay = 0;

        // if it's within the latency, queue it
        if (secondsUntilPlay >= 0 && secondsUntilPlay <= latency) {
          index += 1;
          queue.push({
            note: Object.assign({}, note, {
              duration: noteDur,
            }),
            secondsUntilPlay,
          });

          // if we've passed this note, skip it
        } else if (
          secondsUntilPlay < 0 &&
          Math.abs(secondsUntilPlay) < duration * 0.5
        ) {
          index += 1;
          // if it's greater than latency, wait
        } else break;
      }
      this.state.tracks[i].currentIndex = index;
    });

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

  toggleNote(trackIndex, noteIndex) {
    if (!this.isReady()) return;
    const i = trackIndex;
    const j = noteIndex;
    const { active } = this.state.tracks[i].notes[j];
    this.state.tracks[i].notes[j].active = !active;

    this.queueRecalculateNotes();
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
    const { tracks } = this.state;
    let offsetTicksStart = 0;
    let offsetTicksEnd = 0;
    tracks.forEach((track, i) => {
      const { indexStart, indexEnd } = track;

      const firstNoteState = track.notes[indexStart];
      const firstNote = this.loadedMidi.tracks[i].notes[indexStart];
      const trackOffsetTicksStart = firstNoteState.ticks - firstNote.ticks;
      if (trackOffsetTicksStart > offsetTicksStart)
        offsetTicksStart = trackOffsetTicksStart;

      const lastNoteState = track.notes[indexEnd];
      const lastNote = this.loadedMidi.tracks[i].notes[indexEnd];
      const trackOffsetTicksEnd = lastNoteState.ticks - lastNote.ticks;
      if (trackOffsetTicksEnd > offsetTicksEnd)
        offsetTicksEnd = trackOffsetTicksEnd;
    });
    this.state.offsetTicks = offsetTicksStart;
    this.state.durationOffsetTicks = offsetTicksEnd - offsetTicksStart;
  }
}
