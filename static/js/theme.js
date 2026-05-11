"use strict";

const themeToggle = getEl("themeToggle");

function applyTheme(theme) {

  document.documentElement.setAttribute("data-theme", theme);

  Storage.set("placeprep_theme", theme);
}

function toggleTheme() {

  const currentTheme = document.documentElement.getAttribute("data-theme") || "dark";

  const nextTheme = currentTheme === "dark"
    ? "light"
    : "dark";

  applyTheme(nextTheme);
}

if (themeToggle) {
  themeToggle.addEventListener("click", toggleTheme);
}

(function initTheme() {

  const savedTheme = Storage.get("placeprep_theme", "dark");

  applyTheme(savedTheme);
})();