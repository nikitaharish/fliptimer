// A small, self-contained popover UI: renders one preview card per
// available theme and applies whichever one is clicked via the given
// ThemeManager. It knows nothing about timers, digits, fonts, or accents -
// its only jobs are rendering the list and calling themeManager.apply().
//
// Adding a theme later means adding one entry to THEMES below - nothing
// else here changes, since cards are rendered generically from that list.
export const THEMES = [
  { id: "minimal-black", label: "Minimal Black", bg: "#000000", card: "#1c1c1e" },
  { id: "light", label: "Light", bg: "#f4f4f5", card: "#eaeaec" },
  { id: "dark", label: "Dark", bg: "#18181b", card: "#1c1c1e" },
];

const CHECK_ICON = `<svg class="theme-card-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><path d="M4 12l5 5L20 6"/></svg>`;

export function createThemePicker({ toggleEl, popoverEl, themeManager, themes = THEMES, onApply }) {
  function render() {
    popoverEl.innerHTML = "";
    themes.forEach((theme) => {
      const isActive = themeManager.activeTheme === theme.id;
      const card = document.createElement("button");
      card.type = "button";
      card.className = "theme-card";
      card.classList.toggle("active", isActive);
      card.setAttribute("aria-label", theme.label);
      card.style.setProperty("--preview-bg", theme.bg);
      card.style.setProperty("--preview-card", theme.card);
      card.innerHTML =
        `<span class="theme-card-swatch"><span class="theme-card-swatch-tile"></span></span>` +
        `<span class="theme-card-label">${theme.label}</span>` +
        (isActive ? CHECK_ICON : "");

      card.addEventListener("click", () => {
        themeManager.apply(theme.id);
        popoverEl.classList.remove("open");
        render();
        onApply?.(theme.id);
      });

      popoverEl.appendChild(card);
    });
  }

  toggleEl.addEventListener("click", (event) => {
    event.stopPropagation();
    const opening = !popoverEl.classList.contains("open");
    popoverEl.classList.toggle("open");
    // The active theme may have changed via another control (e.g. the
    // light/dark toggle) since this was last rendered, so refresh the
    // highlighted card every time the popover opens.
    if (opening) render();
  });

  document.addEventListener("click", (event) => {
    if (!popoverEl.contains(event.target) && event.target !== toggleEl && !toggleEl.contains(event.target)) {
      popoverEl.classList.remove("open");
    }
  });

  render();
}
