import { Midi as ToneMidi } from '../vendor/tone-midi.js';
import MusicHelper from './MusicHelper.js';

export default class Midi {
  constructor(options = {}) {
    const defaults = {
      debug: false,
    };
    this.options = Object.assign(defaults, options);
    this.init();
  }

  init() {}

  async loadFromURL(url) {
    const midi = await ToneMidi.fromUrl(url);
    console.log(midi);
    this.toneMidi = midi;
    return true;
  }
}
