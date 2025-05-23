import MathHelper from './MathHelper.js';

export default class Pointer {
  constructor(options = {}) {
    const defaults = {
      childSelector: false,
      childSelectorRadius: false,
      debug: false,
      event: false,
      id: '0',
      $parent: false,
      tapThreshold: 500,
    };
    this.options = Object.assign(defaults, options);
    this.init();
  }

  init() {
    const { id, event } = this.options;

    this.id = id;
    this.isValid = false;
    this.started = false;
    this.posStart = false;
    this.posLast = false;
    this.delta = false;
    this.deltaFromStart = false;
    this.pointerType = false;
    this.$targets = [];
    this.data = {};
    if (event) this.onStart(event);
  }

  getTargetsFromEvent(event, selector, radius = false) {
    let $targets = [];
    if (radius) {
      const { $parent } = this.options;
      const circle = { x: event.clientX, y: event.clientY, r: radius };
      const $children = $parent.querySelectorAll(selector);
      $children.forEach(($child) => {
        const rect = $child.getBoundingClientRect();
        if (MathHelper.rectCircleColliding(circle, rect)) {
          $targets.push($child);
        }
      });
    } else {
      const $target = document.elementFromPoint(event.clientX, event.clientY);
      if ($target) {
        const $match = $target.closest(selector);
        if ($match) $targets.push($match);
      }
    }
    return $targets;
  }

  getData(key) {
    return key in this.data ? this.data[key] : false;
  }

  getGesture() {
    return this.gesture || 'tap';
  }

  static getPositionFromEvent(event) {
    return {
      x: event.clientX,
      y: event.clientY,
    };
  }

  hasMoved(threshold = 1) {
    if (!this.deltaFromStart) return false;
    const { x, y } = this.deltaFromStart;
    return Math.abs(x) > threshold || Math.abs(y) > threshold;
  }

  onMove(event) {
    // assume any movement is a drag
    if (this.gesture !== 'drag') this.gesture = 'drag';
    const { posLast, posStart } = this;
    if (!posLast || !posStart) return;
    const pos = this.constructor.getPositionFromEvent(event);
    this.delta = {
      x: pos.x - posLast.x,
      y: pos.y - posLast.y,
    };
    this.deltaFromStart = {
      x: pos.x - posStart.x,
      y: pos.y - posStart.y,
    };
    this.posLast = pos;
    // update target
    const { childSelector, childSelectorRadius } = this.options;
    if (childSelector) {
      const $targets = this.getTargetsFromEvent(
        event,
        childSelector,
        childSelectorRadius,
      );
      this.$targets = $targets;
    }
  }

  onStart(event) {
    this.isPrimary = false;
    this.gesture = false;
    this.started = Date.now();
    this.posStart = this.constructor.getPositionFromEvent(event);
    this.posLast = structuredClone(this.posStart);
    this.pointerType = event.pointerType;
    this.$targets = [];

    // check to see if it is primary pointer
    if (event && event.originalEvent) {
      this.isPrimary = event.originalEvent.isPrimary;
    } else if (event.isPrimary) this.isPrimary = event.isPrimary;

    // check to see if there's a child selector
    const { childSelector, childSelectorRadius } = this.options;
    if (childSelector) {
      const $targets = this.getTargetsFromEvent(
        event,
        childSelector,
        childSelectorRadius,
      );
      this.$targets = $targets;
    }
    this.isValid = true;
  }

  onEnd(_event) {
    if (!this.started || this.gesture !== false) return;

    const time = Date.now();

    // if passed the tap threshold, consider it a drag
    const elapsed = time - this.started;
    if (elapsed >= this.options.tapThreshold) this.gesture = 'drag';
  }

  setData(key, data) {
    this.data[key] = data;
  }
}
