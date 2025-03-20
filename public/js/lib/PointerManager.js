import Pointer from './Pointer.js';

export default class PointerManager {
  constructor(options = {}) {
    const defaults = {
      childSelector: false,
      debug: false,
      onDrag: (pointer) => {},
      onDragEnd: (pointer) => {},
      onStart: (pointer) => {},
      onTap: (pointer) => {},
      target: 'app',
    };
    this.options = Object.assign(defaults, options);
    this.init();
  }

  init() {
    this.pointers = {};
    this.$target = document.getElementById(this.options.target);
    this.loadListeners();
  }

  getPointer(event, reset = false, mustExist = false) {
    const { pointers } = this;
    const { childSelector } = this.options;
    const pointerId = this.constructor.getPointerId(event);

    let pointer = false;
    if (!reset && pointerId in pointers) {
      pointer = pointers[pointerId];
    } else if (reset || !mustExist) {
      const options = {
        childSelector,
        id: pointerId,
        event,
      };
      pointer = new Pointer(options);
      if (pointer.isValid) this.pointers[pointerId] = pointer;
      else pointer = false;
    }

    return pointer;
  }

  static getPointerId(event) {
    let { pointerId } = event;

    if (pointerId === undefined) pointerId = '0';
    else pointerId = String(pointerId);

    return pointerId;
  }

  loadListeners() {
    const { $target } = this;

    $target.onpointerdown = (event) => this.onPointerDown(event);
    $target.onpointermove = (event) => this.onPointerMove(event);
    $target.onpointerup = (event) => this.onPointerUp(event);
  }

  onPointerDown(event) {
    const pointer = this.getPointer(event, true);
    if (!pointer) return;
    this.$target.setPointerCapture(event.pointerId);
    this.options.onStart(pointer);
  }

  onPointerMove(event) {
    const pointer = this.getPointer(event, false, true);
    if (!pointer) return;
    pointer.onMove(event);
    this.options.onDrag(pointer);
  }

  onPointerUp(event) {
    const pointer = this.getPointer(event, false, true);
    if (!pointer) return;
    pointer.onEnd(event);
    const gesture = pointer.getGesture();
    if (gesture === 'tap') {
      this.options.onTap(pointer);
    } else if (gesture === 'drag') {
      this.options.onDragEnd(pointer);
    }
    this.$target.releasePointerCapture(event.pointerId);
    this.removePointer(pointer);
  }

  removePointer(pointer) {
    delete this.pointers[pointer.id];
  }
}
