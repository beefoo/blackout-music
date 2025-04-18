import { Midi as ToneMidi } from '../vendor/Tone-midi.js';
import MathHelper from './MathHelper.js';
import Synth from './Synth.js';

export default class Midi {
  constructor(options = {}) {
    const defaults = {
      audioContext: false,
      debug: false,
      latency: 0.1,
      throttle: 0.3,
    };
    this.options = Object.assign(defaults, options);
    this.init();
  }

  init() {
    this.isPlaying = false;
    this.isBusy = false;
    this.loadedMidi = false;
    this.startedAt = 0;
    this.state = false;
    this.recalculateTimeout = false;
    this.queueRecalculation = false;
    this.firstStarted = false;
    this.ctx = this.options.audioContext || new AudioContext();
    this.synth = new Synth();

    this.$playButton = document.getElementById('toggle-play-button');
    this.$resetButton = document.getElementById('reset-button');
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
    const measures = midi.header.ticksToMeasures(midi.durationTicks);
    console.log(
      `Duration: ${midi.duration}s, ${midi.durationTicks} ticks, ${measures} measures`,
    );
    // keep track of state
    this.state = {
      bpm: Math.round(midi.header.tempos[0].bpm),
      durationTicks: midi.durationTicks,
      tracks: midi.tracks.map((track, i) => {
        return {
          currentIndex: 0,
          noteCount: track.notes.length,
          notes: track.notes.map((note, j) => {
            return {
              index: j,
              track: i,
              active: true,
              originalTicks: note.ticks,
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
    this.$resetButton.addEventListener('click', (_event) => this.reset());
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
    this.isPlaying = false;
    this.ctx.suspend();
    this.synth.pause();
  }

  play() {
    if (!this.isReady()) return;
    this.isPlaying = true;
    this.ctx.resume();
    if (!this.firstStarted) this.onFirstStart();
    else if (!this.startedAt) this.startedAt = this.ctx.currentTime;
  }

  queueRecalculateNotes() {
    if (!this.isReady()) return;

    // only recalculate notes at most once per every wait milliseconds
    const waitMs = Math.round(this.options.throttle * 1000);

    if (this.recalculateTimeout === false) {
      this.recalculateNotes();
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

  recalculateNotes() {
    // get a flattened array of notes
    const notes = this.state.tracks.map((track) => track.notes).flat();
    // sort notes by ticks and whether they are active
    notes.sort((a, b) => {
      if (a.originalTicks === b.originalTicks) {
        if (a.active) return -1;
        else if (b.active) return 1;
      } else return a.originalTicks - b.originalTicks;
      return 0;
    });
    const noteCount = notes.length;
    let offsetTicks = 0;
    notes.forEach((note, index) => {
      const { active, originalTicks } = note;
      const i = note.track;
      const j = note.index;
      // offset time based on previously inactive notes
      if (offsetTicks > 0) {
        const newTicks = originalTicks - offsetTicks;
        this.loadedMidi.tracks[i].notes[j].ticks = newTicks;
      } else {
        this.loadedMidi.tracks[i].notes[j].ticks = originalTicks;
      }
      // increase offset of time if note is not active
      if (!active && index < noteCount - 1) {
        const nextNote = notes[index + 1];
        offsetTicks += nextNote.originalTicks - originalTicks;
      }
    });
  }

  reset() {
    if (!this.isReady()) return;
    if (!this.firstStarted) return;
    this.isBusy = true;
    if (this.state) {
      this.state.tracks.forEach((_track, i) => {
        this.state.tracks[i].currentIndex = 0;
      });
    }
    this.startedAt = this.isPlaying ? this.ctx.currentTime : false;
    this.isBusy = false;
  }

  scheduleNote(note, secondsInTheFuture) {
    this.synth.play(note, secondsInTheFuture);
  }

  skip(deltaSeconds) {
    if (!this.isReady()) return;
    if (!this.firstStarted) return;

    this.isBusy = true;

    const { duration, tracks } = this.loadedMidi;
    const { currentTime } = this.ctx;

    const elapsed = Math.max(currentTime - this.startedAt + deltaSeconds, 0);
    const newTime = elapsed % duration;
    this.startedAt = currentTime - newTime;

    tracks.forEach((track, i) => {
      let newIndex = track.notes.findIndex((note) => note.time > newTime);
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
    const { duration, tracks } = this.loadedMidi;

    const elapsed = this.ctx.currentTime - this.startedAt;
    const scheduleSeconds = (elapsed + latency) % duration;

    // build a queue of notes to play in the future
    const queue = [];
    tracks.forEach((track, i) => {
      const { currentIndex, noteCount, notes } = state.tracks[i];
      let index = currentIndex;
      while (true) {
        if (index >= noteCount) {
          console.log(`Reset track ${i + 1}`, scheduleSeconds);
          index = 0;
        }
        const note = track.notes[index];
        const noteState = notes[index];
        const secondsInTheFuture = scheduleSeconds - note.time;
        if (!noteState.active) index += 1;
        else if (secondsInTheFuture >= 0) {
          index += 1;
          if (secondsInTheFuture > latency) break;
          queue.push({ note, secondsInTheFuture });
        } else break;
      }
      this.state.tracks[i].currentIndex = index;
    });

    // schedule queue and ensure it is in chronological order
    if (queue.length > 0) {
      queue.sort((a, b) => a.secondsInTheFuture - b.secondsInTheFuture);
      queue.forEach((item) => {
        this.scheduleNote(item.note, item.secondsInTheFuture);
      });
    }
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
}
