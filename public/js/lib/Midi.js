import { Midi as ToneMidi } from '../vendor/Tone-midi.js';
import MusicHelper from './MusicHelper.js';
import * as Tone from '../vendor/Tone.js';

export default class Midi {
  constructor(options = {}) {
    const defaults = {
      audioContext: false,
      debug: false,
      latency: 0.1,
    };
    this.options = Object.assign(defaults, options);
    this.init();
  }

  init() {
    this.isPlaying = false;
    this.loadedMidi = false;
    this.startedAt = false;
    this.ctx = this.options.audioContext || new AudioContext();
    this.$playButton = document.getElementById('toggle-play-button');

    this.ctx.suspend();
    this.loadListeners();
  }

  isReady() {
    return this.loadedMidi !== false;
  }

  async loadFromURL(url) {
    const midi = await ToneMidi.fromUrl(url);
    console.log(midi);
    this.loadedMidi = midi;
    const measures = midi.header.ticksToMeasures(midi.durationTicks);
    console.log(
      `Duration: ${midi.duration}s, ${midi.durationTicks} ticks, ${measures} measures`,
    );
    // keep track of state
    this.state = {
      durationTicks: midi.durationTicks,
      tracks: midi.tracks.map((track) => {
        return {
          currentIndex: 0,
          noteCount: track.notes.length,
          notes: track.notes.map((note) => {
            return {
              active: true,
              ticks: note.ticks,
              durationTicks: note.durationTicks,
            };
          }),
        };
      }),
    };
    return true;
  }

  loadListeners() {
    this.$playButton.addEventListener('click', (_event) => this.togglePlay());
  }

  loadSynth() {
    const filter = new Tone.Tremolo(9, 0.75).toDestination();
    this.synth = new Tone.PolySynth(Tone.Synth, {
      oscillator: {
        partials: [0, 2, 3, 4],
      },
    }).connect(filter);
  }

  onFirstStart() {
    Tone.start();
    this.loadSynth();
    this.startedAt = this.ctx.currentTime;
    this.step();
  }

  pause() {
    this.isPlaying = false;
    this.ctx.suspend();
  }

  play() {
    this.isPlaying = true;
    this.ctx.resume();
    if (!this.startedAt) this.onFirstStart();
  }

  scheduleNote(note, secondsInTheFuture) {
    const now = Tone.getContext().now();
    const future = now + Math.max(secondsInTheFuture, 0);
    // console.log(note.name, future);
    this.synth.triggerAttackRelease(note.name, note.duration, future);
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
          if (secondsInTheFuture > latency) break;
          queue.push({ note, secondsInTheFuture });
          index += 1;
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

  togglePlay() {
    if (!this.isReady()) return;
    this.$playButton.classList.toggle('playing');
    const isPlaying = this.$playButton.classList.contains('playing');
    if (isPlaying) this.play();
    else this.pause();
  }
}
