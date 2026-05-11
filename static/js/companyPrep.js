"use strict";

const COMPANY_PROFILES = {
  general:   { focus: "Balanced prep across DSA, Resume, and CS Core." },
  google:    { focus: "Focus: Hard DSA (Graphs, Trees, DP), System Design, OOP." },
  amazon:    { focus: "Focus: Leadership Principles + DSA (Arrays, Strings, Trees)." },
  microsoft: { focus: "Focus: Medium DSA, OOP/OOAD, CS Core (OS, DBMS)." },
  tcs:       { focus: "Focus: Aptitude, Basic DSA (Arrays, Strings), CS fundamentals." },
};

function initCompanyPrepMode() {
  const chips = qsa(".prep-chip"); if (!chips.length) return;
  const focusEl = getEl("companyFocusBanner");
  const saved = Storage.get("placeprep_prep_mode", "general");

  chips.forEach(chip => {
    chip.classList.toggle("active", chip.dataset.company === saved);
  });

  if (focusEl) {
    focusEl.textContent = COMPANY_PROFILES[saved]?.focus || "";
    focusEl.style.display = focusEl.textContent ? "block" : "none";
  }

  chips.forEach(chip => {
    chip.addEventListener("click", () => {
      chips.forEach(c => c.classList.remove("active"));
      chip.classList.add("active");
      Storage.set("placeprep_prep_mode", chip.dataset.company);
      if (focusEl) {
        focusEl.textContent = COMPANY_PROFILES[chip.dataset.company]?.focus || "";
      }
      toast(`Prep mode: ${chip.textContent.trim()}`, "success");
    });
  });
}

document.addEventListener("DOMContentLoaded", initCompanyPrepMode);