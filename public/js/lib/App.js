export default class App {
  constructor(options = {}) {
    const defaults = {
      el: 'app',
      debug: false,
    };
    this.options = Object.assign(defaults, options);
    this.init();
  }

  init() {
    const { options } = this;
    this.el = document.getElementById(options.el);
  }
}
