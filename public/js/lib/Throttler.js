export default class Throttler {
  constructor(options = {}) {
    const defaults = {
      seconds: 0.5,
      throttled: () => {},
    };
    this.options = Object.assign(defaults, options);
    this.init();
  }

  init() {
    this.waitMs = Math.round(this.options.seconds) * 1000;
    this.timeout = false;
    this.queued = false;
  }

  queue() {
    const { waitMs, timeout } = this;

    if (timeout === false) {
      this.options.throttled();

      // wait some time before next function call
      this.timeout = setTimeout(() => {
        this.timeout = false;
        if (this.queued) {
          this.queued = false;
          this.queue();
        }
      }, waitMs);
      return;
    }
    this.queued = true;
  }
}
