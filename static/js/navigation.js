"use strict";
const navItems =
  qsa(".nav-item");

const sections =
  qsa(".section");

const qaButtons =
  qsa(".qa-btn");

const sidebar =
  getEl("sidebar");

const menuBtn =
  getEl("menuBtn");

const overlay =
  getEl("sidebarOverlay");
function showSection(name) {

  sections.forEach(section => {
    section.classList.remove("active");
  });

  navItems.forEach(item => {
    item.classList.remove("active");
  });

  const target = getEl(`section-${name}`);

  if (target) {
    target.classList.add("active");
  }

  navItems.forEach(item => {
    if (item.dataset.section === name) {
      item.classList.add("active");
    }
  });
}

function openSidebar() {
  sidebar.classList.add("mobile-open");
  overlay.classList.add("active");
}

function closeSidebar() {
  sidebar.classList.remove("mobile-open");
  overlay.classList.remove("active");
}

navItems.forEach(item => {

  item.addEventListener("click", e => {
    e.preventDefault();

    showSection(item.dataset.section);
    closeSidebar();
  });
});

qaButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    showSection(btn.dataset.section);
  });
});

if (menuBtn) {
  menuBtn.addEventListener("click", () => {

    const isOpen = sidebar.classList.contains("mobile-open");

    isOpen ? closeSidebar() : openSidebar();
  });
}

if (overlay) {
  overlay.addEventListener("click", closeSidebar);
}

document.addEventListener("keydown", e => {

  if (e.key === "Escape") {
    closeSidebar();
  }
});