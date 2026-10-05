(function (global) {
  "use strict";

  var UF = (global.UF = global.UF || {});

  var PREFIX = "unitforge:";
  var memoryStore = Object.create(null);
  var persistent = true;

  try {
    global.localStorage.setItem(PREFIX + "probe", "1");
    global.localStorage.removeItem(PREFIX + "probe");
  } catch (err) {
    persistent = false;
  }

  function fullKey(key) {
    return PREFIX + key;
  }

  function read(key) {
    var name = fullKey(key);
    var raw;
    try {
      raw = persistent ? global.localStorage.getItem(name) : memoryStore[name];
    } catch (err) {
      raw = memoryStore[name];
    }
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch (err) {
      return null;
    }
  }

  function write(key, value) {
    var name = fullKey(key);
    var raw;
    try {
      raw = JSON.stringify(value);
    } catch (err) {
      return false;
    }
    memoryStore[name] = raw;
    if (!persistent) return false;
    try {
      global.localStorage.setItem(name, raw);
      return true;
    } catch (err) {
      return false;
    }
  }

  function remove(key) {
    var name = fullKey(key);
    delete memoryStore[name];
    try {
      global.localStorage.removeItem(name);
    } catch (err) {
      /* ignore */
    }
  }

  var KEYS = {
    settings: "settings",
    recent: "recent",
    favorites: "favorites",
    history: "history"
  };

  function loadSettings(defaults) {
    var stored = read(KEYS.settings);
    var merged = {};
    Object.keys(defaults || {}).forEach(function (key) {
      merged[key] = defaults[key];
    });
    if (stored && typeof stored === "object") {
      Object.keys(stored).forEach(function (key) {
        merged[key] = stored[key];
      });
    }
    return merged;
  }

  function saveSettings(settings) {
    return write(KEYS.settings, settings);
  }

  function loadList(key) {
    var stored = read(KEYS[key] || key);
    return Array.isArray(stored) ? stored : [];
  }

  function saveList(key, list) {
    return write(KEYS[key] || key, Array.isArray(list) ? list : []);
  }

  UF.storage = {
    available: function () { return persistent; },
    loadSettings: loadSettings,
    saveSettings: saveSettings,
    loadList: loadList,
    saveList: saveList,
    read: read,
    write: write,
    remove: remove
  };
})(typeof globalThis !== "undefined" ? globalThis : this);
