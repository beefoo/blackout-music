export default class PanelManager {
  constructor(options = {}) {
    const defaults = {};
    this.options = Object.assign(defaults, options);
    this.init();
  }

  init() {
    this.$panelButtons = document.querySelectorAll('.panel-button');
    this.loadListeners();
  }

  loadListeners() {
    this.$panelButtons.forEach(($button) => {
      $button.addEventListener('click', (event) => {
        this.onClickPanelButton(event.currentTarget);
      });
    });
  }

  onClickPanelButton($button) {
    const id = $button.getAttribute('data-panel');
    const $panel = document.getElementById(id);
    if ($panel) $panel.classList.toggle('active');
  }
}
