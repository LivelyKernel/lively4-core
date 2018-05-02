/**
 * A wrapper around setTimeout() to create reusable timers
 */
export default class Timer {
  constructor(duration, callback) {
    this.duration = duration;
    this.callback = callback;
    this.currentTimeout = null;
  }

  start() {
    this.stop();
    this.currentTimeout = setTimeout(this.callback, this.duration);
  }

  stop() {
    if(this.currentTimeout) {
      clearTimeout(this.currentTimeout);
    }
  }
}
