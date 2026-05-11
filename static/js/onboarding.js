"use strict";

function showOnboarding() {
  getEl("onboardingBackdrop")?.classList.remove("hidden");
}

function hideOnboarding() {
  getEl("onboardingBackdrop")?.classList.add("hidden");
}

function goToStep(n) {
  qsa(".onboarding-step").forEach(s => s.classList.remove("active"));
  qsa(".ob-dot").forEach(d => d.classList.toggle("active", Number(d.dataset.step) === n));
  getEl(`ob-step-${n}`)?.classList.add("active");
}

document.addEventListener("DOMContentLoaded", () => {

  // Company selection in step 2
  let selectedCompany = Storage.get("placeprep_prep_mode", "general");

  qsa(".ob-company-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.company === selectedCompany);
    btn.addEventListener("click", () => {
      qsa(".ob-company-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      selectedCompany = btn.dataset.company;
    });
  });

  // Step 1 → 2
  getEl("obStep1Next")?.addEventListener("click", () => {
    const name = getEl("obName")?.value.trim();
    if (!name) { toast("Please enter your name", "error"); return; }
    goToStep(2);
  });

  // Step 2 → 3
  getEl("obStep2Next")?.addEventListener("click", () => {
    Storage.set("placeprep_prep_mode", selectedCompany);
    // Sync company prep chips if they exist
    qsa(".prep-chip").forEach(c => {
      c.classList.toggle("active", c.dataset.company === selectedCompany);
    });
    goToStep(3);
  });

  // Back buttons
  getEl("obStep2Back")?.addEventListener("click", () => goToStep(1));
  getEl("obStep3Back")?.addEventListener("click", () => goToStep(2));

  // Finish
  getEl("obFinish")?.addEventListener("click", () => {

    // Save profile
    const profile = {
      name:          getEl("obName")?.value.trim()   || "",
      branch:        getEl("obBranch")?.value.trim() || "",
      graduationYear:getEl("obYear")?.value          || "2026",
      targetRole:    getEl("obRole")?.value          || "SWE",
      targetCompanies: "",
      college:       "",
      skillLevel:    "intermediate",
    };
    if (typeof saveProfile === "function")  saveProfile(profile);
    if (typeof renderProfile === "function") renderProfile();

    // Save task if entered
    const taskTitle = getEl("obTaskInput")?.value.trim();
    if (taskTitle) {
      const tasks = typeof getPlannerTasks === "function" ? getPlannerTasks() : [];
      tasks.unshift({
        title:     taskTitle,
        category:  getEl("obTaskCategory")?.value || "DSA",
        bucket:    "today",
        completed: false,
        createdAt: Date.now()
      });
      if (typeof savePlannerTasks === "function") savePlannerTasks(tasks);
      if (typeof renderPlannerTasks === "function") renderPlannerTasks();
    }

    // Mark onboarded
    Storage.set("placeprep_onboarded", true);

    hideOnboarding();
    if (typeof refreshDashboard === "function") refreshDashboard();
    toast(`Welcome to PlacePrep, ${profile.name || "there"}! 🎉`, "success");
  });
});