export default class MidiUploader {
  constructor(options = {}) {
    const defaults = {
      debug: false,
      onSelectFile: (file) => {},
    };
    this.options = Object.assign(defaults, options);
    this.init();
  }

  init() {
    this.$fileInput = document.getElementById('midi-file-input');
    this.$uploadButton = document.getElementById('upload-button');
    this.loadListeners();
  }

  loadListeners() {
    this.$fileInput.addEventListener('change', (_event) => this.onSelect());
    this.$uploadButton.addEventListener('click', (_event) =>
      this.triggerSelect(),
    );
  }

  onSelect() {
    const { files } = this.$fileInput;
    if (!files || files.length === 0) return;

    const file = files[0];
    this.options.onSelectFile(file);
  }

  triggerSelect() {
    this.$fileInput.click();
  }
}
