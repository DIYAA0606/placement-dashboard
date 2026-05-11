"use strict";

function toast(message, type = "info") {

  const container = getEl("toast-container");

  if (!container) return;

  if (container.children.length >= 3) {
    container.firstElementChild.remove();
  }

  const toastEl = document.createElement("div");

  toastEl.className = `toast ${type}`;
  toastEl.textContent = message;

  container.appendChild(toastEl);

  setTimeout(() => {
    toastEl.remove();
  }, 3000);
}