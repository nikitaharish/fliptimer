const FLIP_DURATION_MS = 220;

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
  #animationState = "idle";
  #swapTimeoutId = null;

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

  flipTo(nextValue) {
    if (nextValue === this.#currentValue) return;

    const previousValue = this.#currentValue;
    this.#nextValue = nextValue;
    this.#currentValue = nextValue;
    this.#animationState = "flipping";

    clearTimeout(this.#swapTimeoutId);
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

    this.#swapTimeoutId = setTimeout(() => {
      this.#bottomNum.textContent = nextValue;
      this.#animationState = "idle";
      this.#nextValue = null;
      this.#swapTimeoutId = null;
    }, FLIP_DURATION_MS);
  }
}
