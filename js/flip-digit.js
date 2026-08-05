// Duration of one half-flip (top fold, then bottom fold), in milliseconds.
// Matches the CSS `foldFront` / `foldBack` keyframe durations in style.css
// (0.22s each). This step does not change these numbers - it only tracks
// them explicitly so the state machine below knows when each phase of the
// animation actually finishes.
const FLIP_DURATION_MS = 220;

// The finite states a single FlipDigit can be in, and what each one means:
//
// Idle       At rest, showing `currentValue`. No animation is running.
//            This is the initial state and the state the digit returns to
//            once a flip finishes. It is also the ONLY state from which a
//            new flipTo() call is accepted - see the guard in flipTo().
//
// Preparing  Transient setup phase entered the instant a valid flipTo()
//            call is accepted. The leaves' inline transition/transform are
//            reset, the outgoing/incoming digit text is written into the
//            DOM, and a forced reflow commits that reset before animation
//            classes are (re)added. This phase takes no wall-clock time of
//            its own (no timer) - it exists so the reset step is an
//            explicit, named phase rather than an implicit side effect
//            buried inside a transition.
//
// TopFlip    The front leaf is rotating from flat (0deg) to on-edge
//            (-90deg), driven by the CSS `foldFront` animation. Lasts
//            FLIP_DURATION_MS. By the end of this phase the front leaf is
//            edge-on/invisible and the back leaf (already showing the new
//            value) is about to rotate into view.
//
// BottomFlip The back leaf is rotating from on-edge (90deg) to flat
//            (0deg), driven by the CSS `foldBack` animation. Entered the
//            instant TopFlip's timer fires, which is also when the static
//            "bottom" half's text is swapped to the new value, so nothing
//            stale is ever visible once the back leaf lands. Lasts another
//            FLIP_DURATION_MS.
//
// Complete   Transient state entered the instant BottomFlip's timer fires,
//            i.e. the moment the CSS animation has fully finished. It
//            exists only to make "the animation just ended" an explicit,
//            momentary state before immediately returning to Idle - it is
//            never held onto.
const FlipState = Object.freeze({
  IDLE: "Idle",
  PREPARING: "Preparing",
  TOP_FLIP: "TopFlip",
  BOTTOM_FLIP: "BottomFlip",
  COMPLETE: "Complete",
});

// The only transitions allowed out of each state:
//   Idle -> Preparing -> TopFlip -> BottomFlip -> Complete -> Idle
// There is no entry back into Preparing/TopFlip/BottomFlip/Complete except
// via this exact sequence, which is what makes it impossible for a second
// flip animation to start while one is already running.
const VALID_TRANSITIONS = Object.freeze({
  [FlipState.IDLE]: [FlipState.PREPARING],
  [FlipState.PREPARING]: [FlipState.TOP_FLIP],
  [FlipState.TOP_FLIP]: [FlipState.BOTTOM_FLIP],
  [FlipState.BOTTOM_FLIP]: [FlipState.COMPLETE],
  [FlipState.COMPLETE]: [FlipState.IDLE],
});

export class FlipDigit {
  #el;
  #topNum;
  #bottomNum;
  #frontLeaf;
  #backLeaf;
  #frontNum;
  #backNum;

  #currentValue;
  #nextValue = null;
  #state = FlipState.IDLE;
  #topFlipTimeoutId = null;
  #bottomFlipTimeoutId = null;

  constructor(el, initialValue = "0") {
    this.#el = el;
    this.#topNum = el.querySelector(".flip-static.top .num");
    this.#bottomNum = el.querySelector(".flip-static.bottom .num");
    this.#frontLeaf = el.querySelector(".flip-leaf.front");
    this.#backLeaf = el.querySelector(".flip-leaf.back");
    this.#frontNum = this.#frontLeaf.querySelector(".num");
    this.#backNum = this.#backLeaf.querySelector(".num");
    this.#currentValue = initialValue;
  }

  // Advances the state machine, throwing if the requested transition isn't
  // in VALID_TRANSITIONS. This is what enforces "only valid transitions are
  // allowed" rather than leaving it as an unenforced convention.
  #transitionTo(nextState) {
    const allowed = VALID_TRANSITIONS[this.#state];
    if (!allowed || !allowed.includes(nextState)) {
      throw new Error(`FlipDigit: invalid state transition ${this.#state} -> ${nextState}`);
    }
    this.#state = nextState;
  }

  // Public API: flip the digit to `nextValue`. No-ops if the value hasn't
  // changed, and REJECTS the request outright (does not queue or
  // interrupt) if a flip animation is already in progress - only the Idle
  // state accepts a new flip, so this is how "prevent multiple flip
  // animations running simultaneously" is enforced.
  //
  // Returns true if `nextValue` is (or is now becoming) the displayed
  // value, false if the request was dropped because a flip is already in
  // progress - callers that need this digit to eventually catch up to the
  // real target should retry once it's idle again.
  flipTo(nextValue) {
    if (nextValue === this.#currentValue) return true;
    if (this.#state !== FlipState.IDLE) return false;

    const previousValue = this.#currentValue;
    this.#nextValue = nextValue;
    this.#currentValue = nextValue;

    // --- Preparing ---
    this.#transitionTo(FlipState.PREPARING);

    this.#frontLeaf.classList.remove("animate");
    this.#backLeaf.classList.remove("animate");
    this.#frontLeaf.style.transition = "none";
    this.#backLeaf.style.transition = "none";
    this.#frontLeaf.style.transform = "rotateX(0deg)";
    this.#backLeaf.style.transform = "rotateX(90deg)";
    this.#frontNum.textContent = previousValue;
    this.#backNum.textContent = nextValue;
    this.#topNum.textContent = nextValue;

    void this.#el.offsetWidth;

    this.#frontLeaf.style.transition = "";
    this.#backLeaf.style.transition = "";
    this.#frontLeaf.style.transform = "";
    this.#backLeaf.style.transform = "";
    this.#frontLeaf.classList.add("animate");
    this.#backLeaf.classList.add("animate");

    // --- TopFlip ---
    this.#transitionTo(FlipState.TOP_FLIP);

    this.#topFlipTimeoutId = setTimeout(() => {
      // --- BottomFlip ---
      this.#transitionTo(FlipState.BOTTOM_FLIP);
      this.#bottomNum.textContent = nextValue;

      this.#bottomFlipTimeoutId = setTimeout(() => {
        // --- Complete -> Idle ---
        this.#transitionTo(FlipState.COMPLETE);
        this.#nextValue = null;
        this.#topFlipTimeoutId = null;
        this.#bottomFlipTimeoutId = null;
        this.#transitionTo(FlipState.IDLE);
      }, FLIP_DURATION_MS);
    }, FLIP_DURATION_MS);

    return true;
  }
}
