import MathHelper from './MathHelper.js';
import StringHelper from './StringHelper.js';
import Throttler from './Throttler.js';
import * as Tone from '../vendor/Tone.js';

export default class Synth {
  constructor(options = {}) {
    const defaults = {
      debug: false,
      localStorageKey: 'synth',
    };
    this.options = Object.assign(defaults, options);
    this.init();
  }

  init() {
    this.loaded = false;
    this.lastScheduled = -1;
    this.setDefaults();
    this.loadFromStorage();
    this.loadListeners();
  }

  getInputProperties() {
    const props = {
      effects: {
        reverb: {
          decay: 2,
        },
      },
      synth: {
        envelope: {},
        oscillator: {
          modulationType: 'square',
        },
        modulation: {
          type: 'square',
        },
      },
    };
    // set reverb
    props.effects.reverb.wet = parseFloat(
      document.getElementById('effects-reverb-wet').value,
    );
    // set oscillator type
    props.synth.oscillator.type = document.querySelector(
      '.oscillator-type:checked',
    ).value;
    // set envelope
    ['attack', 'decay', 'sustain', 'release'].forEach((prop) => {
      const value = parseFloat(
        document.getElementById(`synth-envelope-${prop}`).value,
      );
      props.synth.envelope[prop] = value;
    });
    return props;
  }

  load() {
    if (this.loaded) return;
    const props = this.getInputProperties();
    const effects = {};
    // add distortion
    // effects.distortion = new Tone.Distortion({ distortion: 0.5, wet: 0.5 });
    // add reverb
    effects.reverb = new Tone.Reverb(props.reverb);
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
    this.synth = new Tone.PolySynth(Tone.AMSynth, props.synth).chain(
      ...effectChain,
    );
    this.effects = effects;
    Tone.start();
    this.loaded = true;
  }

  loadFromStorage() {
    const props = StringHelper.loadStorageData(
      this.options.localStorageKey,
      false,
    );

    if (!props) return;

    // set oscillator type
    document.getElementById(
      `synth-oscillator-type-${props.synth.oscillator.type}`,
    ).checked = true;

    // set envelope values in UI
    ['attack', 'decay', 'sustain', 'release'].forEach((prop) => {
      const value = props.synth.envelope[prop];
      document.getElementById(`synth-envelope-${prop}`).value = value;
    });

    // set reverb in UI
    const reverb = props.effects.reverb.wet;
    document.getElementById(`effects-reverb-wet`).value = reverb;

    this.update();
  }

  loadListeners() {
    const throttled = () => this.update();
    const throttler = new Throttler({
      throttled,
      seconds: 0.3,
    });
    const $options = document.querySelectorAll('.synth-option');
    $options.forEach(($option) => {
      $option.addEventListener('input', (_event) => {
        throttler.queue();
      });
    });
    const $types = document.querySelectorAll('.oscillator-type');
    $types.forEach(($option) => {
      $option.addEventListener('click', (_event) => {
        throttler.queue();
      });
    });
    const $reset = document.getElementById('reset-settings-button');
    $reset.addEventListener('click', (_event) => {
      this.resetSettings();
    });
  }

  pause() {
    this.synth.releaseAll();
  }

  play(note, secondsInTheFuture) {
    const ctx = Tone.getContext();
    if (ctx.state !== 'running') return;
    const now = ctx.now();
    let future = now + Math.max(secondsInTheFuture, 0);
    const { lastScheduled } = this;
    if (future < lastScheduled) return; // we cannot schedule before the last scheduled note

    const { name, duration } = note;
    if (duration <= 0 || !name) return;
    // make longer notes have lower velocity
    let velocity = duration > 1 ? Math.pow(duration, -0.5) : 1;
    velocity = MathHelper.clamp(velocity, 0.5, 1);
    // console.log(this.synth.activeVoices);
    this.synth.triggerAttackRelease(name, duration, future, velocity);
    this.lastScheduled = future;
  }

  resetSettings() {
    const { defaults } = this;

    document.getElementById(
      `synth-oscillator-type-${defaults.synth.oscillator.type}`,
    ).checked = true;

    ['attack', 'decay', 'sustain', 'release'].forEach((prop) => {
      const value = defaults.synth.envelope[prop];
      document.getElementById(`synth-envelope-${prop}`).value = value;
    });

    document.getElementById(`effects-reverb-wet`).value =
      defaults.effects.reverb.wet;

    this.update();
  }

  setDefaults() {
    const defaults = {
      synth: {
        oscillator: {
          type: 'amsquare',
        },
        envelope: {},
      },
      effects: {
        reverb: {},
      },
    };

    ['attack', 'decay', 'sustain', 'release'].forEach((prop) => {
      const value = document.getElementById(
        `synth-envelope-${prop}-value`,
      ).innerText;
      defaults.synth.envelope[prop] = parseFloat(value);
    });

    defaults.effects.reverb.wet = parseFloat(
      document.getElementById(`effects-reverb-wet-value`).innerText,
    );

    this.defaults = defaults;
  }

  update() {
    const props = this.getInputProperties();

    // set envelope values in UI
    ['attack', 'decay', 'sustain', 'release'].forEach((prop) => {
      const value = props.synth.envelope[prop];
      document.getElementById(`synth-envelope-${prop}-value`).innerText = value;
    });

    // set reverb in UI
    const reverb = props.effects.reverb.wet;
    document.getElementById(`effects-reverb-wet-value`).innerText = reverb;

    if (!this.loaded) return;

    // update synth
    this.synth.set(props.synth);
    // update reverb
    this.effects.reverb.set(props.effects.reverb);

    this.updateStorage();
  }

  updateStorage() {
    const props = this.getInputProperties();
    StringHelper.saveStorageData(this.options.localStorageKey, props);
  }
}
