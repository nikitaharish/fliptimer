// ThemeManager owns exactly one concern: which named theme is active and
// getting that name onto the DOM. It knows nothing about timers, digits,
// fonts, or accents - and nothing about *how many* themes exist or what
// they're called, which is what lets it support a theme nobody has
// invented yet without a single line changing here:
//
//   themeManager.apply("minimal")
//   // -> document.documentElement.dataset.theme = "minimal"
//
// apply() never branches on the theme name, so there is no per-theme
// logic to extend - a new theme is purely a CSS concern (a new
// `:root[data-theme="minimal"] { ... }` block), not a code change.

const STORAGE_KEY = "timer-theme";

export class ThemeManager {
  #root;
  #storage;
  #activeTheme = null;

  constructor({ root = document.documentElement, storage = window.localStorage } = {}) {
    this.#root = root;
    this.#storage = storage;
  }

  get activeTheme() {
    return this.#activeTheme;
  }

  // Applies a theme by writing the root data-theme attribute and
  // persisting the choice. Accepts any theme name - there is no whitelist.
  apply(theme) {
    this.#activeTheme = theme;
    this.#root.dataset.theme = theme;
    this.#storage?.setItem(STORAGE_KEY, theme);
  }

  // Restores a previously-persisted theme, falling back to the OS-level
  // light/dark preference, then to `fallback`. Returns the theme that was
  // applied. Call once during startup.
  init(fallback) {
    const stored = this.#storage?.getItem(STORAGE_KEY);
    const systemPrefersDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
    const initial = stored || (systemPrefersDark ? "dark" : "light") || fallback;
    this.apply(initial);
    return initial;
  }
}
