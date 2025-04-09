import MathHelper from './MathHelper.js';
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
    this.loaded = false;
    this.lastScheduled = -1;
  }

  load() {
    if (this.loaded) return;
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
    effects.limiter = new Tone.Limiter(-6);
    // avoid being too loud
    effects.gain = new Tone.Gain(0.8).toDestination();
    const effectChain = [
      // effects.distortion,
      effects.reverb,
      effects.lowpass,
      effects.lowshelf,
      effects.limiter,
      effects.gain,
    ];
    this.synth = new Tone.PolySynth(Tone.AMSynth, {
      envelope: {
        attack: 0.02, // 0 - 2, default: 0.01
        decay: 0.2, // 0 - 2, default: 0.1
        sustain: 0.25, // 0 - 1, default: 1
        release: 1, // 0 - 5, default: 0.5
      },
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
    this.loaded = true;
  }

  pause() {
    this.synth.releaseAll();
  }

  play(note, secondsInTheFuture) {
    const now = Tone.getContext().now();
    let future = now + Math.max(secondsInTheFuture, 0);
    const { lastScheduled } = this;
    if (future < lastScheduled) return; // we cannot schedule before the last scheduled note

    const { name, duration } = note;
    // make longer notes have lower velocity
    let velocity = duration > 1 ? Math.pow(duration, -0.5) : 1;
    velocity = MathHelper.clamp(velocity, 0.5, 1);
    // console.log(this.synth.activeVoices);
    this.synth.triggerAttackRelease(name, duration, future, velocity);
    this.lastScheduled = future;
  }
}
