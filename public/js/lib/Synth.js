import * as Tone from '../vendor/Tone.js';

export default class Synth {
  constructor(options = {}) {
    const defaults = {
      debug: false,
    };
    this.options = Object.assign(defaults, options);
    this.init();
  }

  init() {
    this.lastScheduled = -1;
  }

  load() {
    const effects = {};
    // add distortion
    // effects.distortion = new Tone.Distortion({ distortion: 0.5, wet: 0.5 });
    // add reverb
    effects.reverb = new Tone.Reverb({ decay: 2, wet: 0.667 });
    // attenuate high notes
    effects.lowpass = new Tone.Filter({ frequency: 'C6', type: 'lowpass' });
    // boost low notes
    effects.lowshelf = new Tone.Filter({
      frequency: 'C4',
      type: 'lowshelf',
      gain: 6.0,
    });
    // avoid blowing out the audio
    effects.limiter = new Tone.Limiter(-3);
    // avoid being too loud
    effects.gain = new Tone.Gain(0.9).toDestination();
    const effectChain = [
      // effects.distortion,
      effects.reverb,
      effects.lowpass,
      effects.lowshelf,
      effects.limiter,
      effects.gain,
    ];
    this.synth = new Tone.PolySynth(Tone.AMSynth, {
      oscillator: {
        type: 'amsquare',
        modulationType: 'square',
      },
      modulation: {
        type: 'square',
      },
    }).chain(...effectChain);
    this.effects = effects;
    Tone.start();
  }

  play(note, secondsInTheFuture) {
    const now = Tone.getContext().now();
    let future = now + Math.max(secondsInTheFuture, 0);
    const { lastScheduled } = this;
    if (future < lastScheduled) return; // we cannot schedule before the last scheduled note
    this.synth.triggerAttackRelease(note.name, note.duration, future);
    this.lastScheduled = future;
  }
}
