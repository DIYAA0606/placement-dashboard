"use strict";

const Storage = {

  get(key, fallback = null) {
    try {
      const data = localStorage.getItem(key);

      return data ? JSON.parse(data) : fallback;
    } catch (err) {
      console.error(err);
      return fallback;
    }
  },

  set(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  },

  remove(key) {
    localStorage.removeItem(key);
  },

  clear() {
    localStorage.clear();
  }
};