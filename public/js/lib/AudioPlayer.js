export default class AudioPlayer {
  constructor(options = {}) {
    const defaults = {
      audioContext: false,
      debug: false,
      fadeIn: 0,
      fadeOut: 0,
      sources: {}, // key/value pairs of id/url
    };
    this.options = Object.assign(defaults, options);
    this.init();
  }

  async init() {
    this.buffers = {};
    this.ctx = this.options.audioContext || new AudioContext();

    const { sources } = this.options;
    for (const [id, url] of Object.entries(sources)) {
      const _success = await this.load(id, url);
    }
  }

  async load(id, url) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        console.error(`Response status: ${response.status}`);
        return false;
      }

      const audioData = await response.arrayBuffer();
      const buffer = await this.ctx.decodeAudioData(audioData);
      this.buffers[id] = buffer;
      console.log(`Loaded ${url} with duration ${buffer.duration}s.`);
      return true;
    } catch (error) {
      console.error(error.message);
      return false;
    }
  }

  play(id, options = {}) {
    const { fadeIn, fadeOut } = this.options;
    const { ctx, buffers } = this;

    if (!(id in buffers)) return;

    const buf = buffers[id];

    // define defaults and set options if they exist
    const volume = 'volume' in options ? options.volume : 1;
    const gain = this.constructor.volumeToGain(volume);
    const playbackRate = 'playbackRate' in options ? options.playbackRate : 1;
    const dur = buf.duration;
    const fadeDur = fadeIn + fadeOut;

    // setup source and nodes
    const audioSource = ctx.createBufferSource();
    const gainNode = ctx.createGain();

    // set audio buffer
    audioSource.buffer = buf;

    // set playback rate
    if (playbackRate !== 1) audioSource.playbackRate.value = playbackRate;

    // do fade if the audio is long enough
    if (dur > fadeDur && fadeDur > 0) {
      // fade into gain value
      gainNode.gain.setValueAtTime(Number.EPSILON, 0);
      gainNode.gain.exponentialRampToValueAtTime(gain, fadeIn);

      // fade out from gain value
      gainNode.gain.setValueAtTime(gain, dur - fadeOut);
      gainNode.gain.exponentialRampToValueAtTime(Number.EPSILON, dur);

      // otherwise, just set gain
    } else {
      gainNode.gain.value = gain;
    }

    // connect and play
    audioSource.connect(gainNode);
    gainNode.connect(ctx.destination);
    audioSource.start();

    return audioSource;
  }

  static volumeToGain(volume = 1) {
    let gain = volume;
    if (volume > 1) gain = 10.0 * Math.log(Math.pow(volume, 2));
    else if (volume < 1) gain = Math.pow(volume, 2);
    return gain;
  }
}
