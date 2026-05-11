"use strict";

const PROFILE_KEY = "placeprep_profile";

function getProfile() {
  return Storage.get(PROFILE_KEY, {});
}

function saveProfile(data) {
  Storage.set(PROFILE_KEY, data);
}

function renderProfile() {

  const profile = getProfile();

  const nameEl = getEl("sidebarName");
  const tagEl = getEl("sidebarTag");
    const avatarEl = getEl("sidebarAvatar");
  if (avatarEl && profile.name) {
    const parts = profile.name.trim().split(" ");
    avatarEl.textContent = parts.length >= 2
      ? parts[0][0].toUpperCase() + parts[parts.length - 1][0].toUpperCase()
      : parts[0].slice(0, 2).toUpperCase();
  }
  if (nameEl) {
    nameEl.textContent = profile.name || "Student";
  }

  if (tagEl) {
    tagEl.textContent = `${profile.graduationYear || "2026"} · ${profile.branch || "CS"}`;
  }
}
function openProfileModal() {
  const profile = getProfile();
  const setVal = (id, val) => { const el = getEl(id); if (el) el.value = val || ""; };

  setVal("profileName", profile.name);
  setVal("profileBranch", profile.branch);
  setVal("profileCollege", profile.college);
  setVal("profileCompanies", profile.targetCompanies);
  const yearEl = getEl("profileYear");
  if (yearEl) yearEl.value = profile.graduationYear || "2026";
  const roleEl = getEl("profileRole");
  if (roleEl) roleEl.value = profile.targetRole || "SWE";
  const levelEl = getEl("profileLevel");
  if (levelEl) levelEl.value = profile.skillLevel || "intermediate";

  getEl("profileModalBackdrop")?.classList.remove("hidden");
}

function closeProfileModal() {
  getEl("profileModalBackdrop")?.classList.add("hidden");
}

// REPLACE the existing saveProfileModal function with:
function saveProfileModal() {
  const profile = {
    name: getEl("profileName")?.value.trim() || "",
    branch: getEl("profileBranch")?.value.trim() || "",
    college: getEl("profileCollege")?.value.trim() || "",
    targetCompanies: getEl("profileCompanies")?.value.trim() || "",
    graduationYear: getEl("profileYear")?.value || "2026",
    targetRole: getEl("profileRole")?.value || "SWE",
    skillLevel: getEl("profileLevel")?.value || "intermediate",
  };
  saveProfile(profile);
  renderProfile();
  closeProfileModal();
  toast("Profile saved", "success");
  refreshDashboard();
}

document.addEventListener("DOMContentLoaded", () => {
  getEl("openProfile")?.addEventListener("click", openProfileModal);
  getEl("openProfile")?.addEventListener("keydown", e => { if (e.key === "Enter") openProfileModal(); });
  getEl("closeProfileModal")?.addEventListener("click", closeProfileModal);
  getEl("cancelProfileModal")?.addEventListener("click", closeProfileModal);
  getEl("saveProfileModal")?.addEventListener("click", saveProfileModal);
  getEl("profileModalBackdrop")?.addEventListener("click", e => {
    if (e.target === getEl("profileModalBackdrop")) closeProfileModal();
  });
});

