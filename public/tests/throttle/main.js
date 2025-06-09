import Throttler from '../../js/lib/Throttler.js';

class ThrottleTest {
  constructor(options = {}) {
    const defaults = {};
    this.options = Object.assign(defaults, options);
    this.init();
  }

  init() {
    const $trigger = document.getElementById('trigger-button');
    const $triggerCount = document.getElementById('trigger-count');
    const $clickCount = document.getElementById('click-count');

    let clickCount = 0;
    let triggerCount = 0;

    const throttled = () => {
      triggerCount += 1;
      $triggerCount.innerText = triggerCount.toLocaleString();
    };
    const throttler = new Throttler({
      throttled,
      seconds: 3.0,
    });

    $trigger.addEventListener('click', (_event) => {
      clickCount += 1;
      $clickCount.innerText = clickCount.toLocaleString();
      throttler.queue();
    });
  }
}

const _test = new ThrottleTest();
