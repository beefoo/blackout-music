export default class PanelManager {
  constructor(options = {}) {
    const defaults = {};
    this.options = Object.assign(defaults, options);
    this.init();
  }

  init() {
    this.$sourceElement = false;
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
    if ($panel) {
      $panel.classList.toggle('active');
      const isActive = $panel.classList.contains('active');
      // add visible focus to the first link (should be an anchor link in heading)
      if (isActive) {
        const $link = $panel.querySelector('a');
        if ($link) $link.focus();
        this.$sourceElement = $button;
      } else {
        if (this.$sourceElement) {
          this.$sourceElement.focus();
          this.$sourceElement = false;
        }
      }
    }
  }
}
