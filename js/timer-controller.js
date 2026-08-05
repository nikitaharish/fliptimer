// TimerController owns every piece of countdown logic: how much time is
// left, converting that into individual digit characters, working out
// which of those digits actually changed since the last render, and
// notifying only the FlipDigit components whose digit changed.
//
// It knows nothing about sound, visual effects, or theming - completion is
// surfaced purely through the onComplete callback supplied by the caller.
//
// FlipDigit, on the other side, is never told this is a clock: it only
// ever receives a single character through flipTo(nextValue). All
// knowledge of minutes/seconds and which digit role is which lives here,
// in DIGIT_ROLES and #render() below - not in FlipDigit.
const DIGIT_ROLES = ["mTens", "mOnes", "sTens", "sOnes"];

export class TimerController {
  #digits;
  #onComplete;

  #totalSeconds = 0;
  #remainingSeconds = 0;
  #endTime = null;
  #intervalId = null;
  #lastRenderedDigits = null;
  #renderRetryId = null;

  // `digits` is an object keyed by DIGIT_ROLES, each value being anything
  // with a flipTo(nextValue) method (a FlipDigit instance in practice).
  // `onComplete` is called (no arguments) the instant remaining time hits 0.
  constructor({ digits, onComplete }) {
    this.#digits = digits;
    this.#onComplete = onComplete;
  }

  get isRunning() {
    return this.#intervalId !== null;
  }

  get remainingSeconds() {
    return this.#remainingSeconds;
  }

  // Sets a new countdown duration, stopping any in-progress countdown and
  // immediately notifying FlipDigit components of the reset digits.
  setDuration(totalSeconds) {
    clearInterval(this.#intervalId);
    this.#intervalId = null;
    clearTimeout(this.#renderRetryId);
    this.#renderRetryId = null;
    this.#totalSeconds = totalSeconds;
    this.#remainingSeconds = totalSeconds;
    this.#endTime = null;
    this.#render();
  }

  // Starts (or resumes) the countdown. Returns false without doing
  // anything if there's no time left or it's already running.
  start() {
    if (this.#remainingSeconds <= 0 || this.isRunning) return false;
    this.#endTime = Date.now() + this.#remainingSeconds * 1000;
    this.#intervalId = setInterval(() => this.#tick(), 1000);
    return true;
  }

  pause() {
    clearInterval(this.#intervalId);
    this.#intervalId = null;
  }

  toggle() {
    if (this.isRunning) {
      this.pause();
    } else {
      this.start();
    }
  }

  // Stops the countdown and snaps the remaining time back to the full
  // duration, notifying FlipDigit components of the reset digits.
  reset() {
    clearInterval(this.#intervalId);
    this.#intervalId = null;
    clearTimeout(this.#renderRetryId);
    this.#renderRetryId = null;
    this.#remainingSeconds = this.#totalSeconds;
    this.#endTime = null;
    this.#render();
  }

  // Recomputes remaining time from wall-clock time (not by decrementing a
  // counter), so the countdown can't drift even if setInterval is throttled
  // by a backgrounded tab.
  #tick() {
    this.#remainingSeconds = Math.max(0, Math.round((this.#endTime - Date.now()) / 1000));
    this.#render();

    if (this.#remainingSeconds <= 0) {
      clearInterval(this.#intervalId);
      this.#intervalId = null;
      this.#onComplete?.();
    }
  }

  // Converts remainingSeconds into mm:ss, compares each of the 4 digit
  // characters against what was last rendered, and calls flipTo() only on
  // the FlipDigit components whose digit actually changed.
  #render() {
    const m = Math.floor(this.#remainingSeconds / 60).toString().padStart(2, "0");
    const s = Math.floor(this.#remainingSeconds % 60).toString().padStart(2, "0");
    const nextDigits = [m[0], m[1], s[0], s[1]];

    const rendered = this.#lastRenderedDigits ? [...this.#lastRenderedDigits] : [null, null, null, null];
    let pending = false;

    nextDigits.forEach((value, i) => {
      if (rendered[i] === value) return;
      // flipTo() rejects the request if that digit is still mid-animation
      // from a previous render (e.g. several duration changes landing
      // faster than one flip can finish, such as dragging the duration
      // slider). Only mark it as rendered when the flip actually took -
      // otherwise this digit is now stale versus nextDigits and needs a
      // retry, since nothing else will re-render it once input stops.
      const applied = this.#digits[DIGIT_ROLES[i]].flipTo(value);
      if (applied) {
        rendered[i] = value;
      } else {
        pending = true;
      }
    });

    this.#lastRenderedDigits = rendered;

    clearTimeout(this.#renderRetryId);
    this.#renderRetryId = pending ? setTimeout(() => this.#render(), 120) : null;
  }
}
