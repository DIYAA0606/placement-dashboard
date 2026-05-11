"use strict";

document.addEventListener("DOMContentLoaded", () => {

  // Show skeletons immediately
  qsa(".stat-value").forEach(el => el.classList.add("skeleton"));

  // Small delay so skeletons are visible for a beat
  setTimeout(() => {
    qsa(".stat-value").forEach(el => el.classList.remove("skeleton"));

    if (typeof renderProfile === "function")         renderProfile();
    if (typeof refreshDashboard === "function")      refreshDashboard();
    if (typeof renderDSAGrid === "function")         renderDSAGrid();
    if (typeof renderPlannerTasks === "function")    renderPlannerTasks();
    if (typeof renderAnalysisHistory === "function") renderAnalysisHistory();

    const seen = Storage.get("placeprep_onboarded", false);
    if (!seen) showOnboarding();

  }, 350);
});