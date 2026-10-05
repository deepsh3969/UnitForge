(function (global) {
  "use strict";

  var UF = global.UF;
  if (!UF) return;

  var engine = UF.engine;
  var utils = UF.utils;
  var storage = UF.storage;
  var search = UF.search;
  var ui = UF.ui;

  var DEFAULTS = {
    precision: "auto",
    theme: "system",
    animations: true,
    sound: false
  };

  var HISTORY_LIMIT = 50;
  var RECENT_LIMIT = 10;
  var FAVORITES_LIMIT = 20;
  var RECORD_DELAY = 850;

  var QUICK_CONVERSIONS = [
    { label: "1 km \u2192 miles", meta: "Length", category: "length", from: "km", to: "mi", value: "1" },
    { label: "1 kg \u2192 pounds", meta: "Weight / Mass", category: "mass", from: "kg", to: "lb", value: "1" },
    { label: "100 \u00b0C \u2192 \u00b0F", meta: "Temperature", category: "temperature", from: "c", to: "f", value: "100" },
    { label: "1 liter \u2192 gallons", meta: "Volume", category: "volume", from: "l", to: "gal", value: "1" },
    { label: "60 mph \u2192 km/h", meta: "Speed", category: "speed", from: "mph", to: "kph", value: "60" },
    { label: "1 hour \u2192 minutes", meta: "Time", category: "time", from: "h", to: "min", value: "1" },
    { label: "1 GB \u2192 MB", meta: "Digital Storage", category: "digital", from: "gb", to: "mb", value: "1" },
    { label: "1 atm \u2192 PSI", meta: "Pressure", category: "pressure", from: "atm", to: "psi", value: "1" }
  ];

  var state = {
    category: "length",
    from: "m",
    to: "km",
    precision: "auto",
    theme: "system",
    animations: true,
    sound: false,
    favorites: [],
    recent: [],
    history: [],
    showFormula: false,
    lastResult: null
  };

  var recordTimer = null;
  var searchActiveIndex = -1;
  var storageWarned = false;

  function categoryName(categoryId) {
    var category = UF.getCategory(categoryId);
    return category ? category.name : categoryId;
  }

  function currentTheme() {
    if (state.theme === "system") {
      if (global.matchMedia) {
        return global.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      }
      return "light";
    }
    return state.theme;
  }

  function applyTheme() {
    ui.applyTheme(state.theme, currentTheme());
  }

  function saveSettings() {
    var ok = storage.saveSettings({
      precision: state.precision,
      theme: state.theme,
      animations: state.animations,
      sound: state.sound
    });
    if (!ok && storage.available() && !storageWarned) {
      storageWarned = true;
      ui.showToast("Preferences could not be saved.", "error");
    }
  }

  function playFeedback(frequency) {
    if (state.sound) utils.playTone(frequency || 620);
  }

  function favoriteIndex() {
    for (var i = 0; i < state.favorites.length; i += 1) {
      var item = state.favorites[i];
      if (item.cat === state.category && item.from === state.from && item.to === state.to) {
        return i;
      }
    }
    return -1;
  }

  function updateFavoriteButton() {
    ui.updateFavoriteButton(favoriteIndex() >= 0);
  }

  function deriveDisplay(entry) {
    var from = UF.getUnit(entry.cat, entry.from);
    var to = UF.getUnit(entry.cat, entry.to);
    var value = utils.parseValue(entry.raw);
    var fromSymbol = from ? from.symbol : entry.from;
    var toSymbol = to ? to.symbol : entry.to;

    if (!value.ok || !from || !to) {
      return entry.raw + " " + fromSymbol + " \u2192 ? " + toSymbol;
    }

    var converted = engine.convert(value.value, entry.cat, entry.from, entry.to, {
      precision: state.precision
    });

    var output = converted.ok ? converted.formattedValue : "\u2014";
    return entry.raw + " " + fromSymbol + " \u2192 " + output + " " + toSymbol;
  }

  function toRecentItem(entry) {
    return {
      category: entry.cat,
      from: entry.from,
      to: entry.to,
      raw: entry.raw,
      display: deriveDisplay(entry),
      meta: categoryName(entry.cat)
    };
  }

  function toHistoryItem(entry) {
    return {
      category: entry.cat,
      from: entry.from,
      to: entry.to,
      raw: entry.raw,
      display: deriveDisplay(entry),
      meta: categoryName(entry.cat),
      time: entry.t || ""
    };
  }

  function toFavoriteItem(entry) {
    var from = UF.getUnit(entry.cat, entry.from);
    var to = UF.getUnit(entry.cat, entry.to);
    return {
      category: entry.cat,
      from: entry.from,
      to: entry.to,
      display: (from ? from.name : entry.from) + " \u2192 " + (to ? to.name : entry.to),
      meta: categoryName(entry.cat)
    };
  }

  function renderSideLists() {
    ui.renderRecent(state.recent.map(toRecentItem));
    ui.renderHistory(state.history.map(toHistoryItem));
    ui.renderFavorites(state.favorites.map(toFavoriteItem));
  }

  function renderFormulaNow() {
    if (!state.showFormula) {
      ui.renderFormula([], false);
      return;
    }
    ui.renderFormula(
      engine.getFormula(state.category, state.from, state.to, state.precision),
      true
    );
  }

  function syncConverterChrome() {
    ui.renderCategories(UF.categories, state.category);
    ui.renderUnitSelects(state.category, state.from, state.to);
    ui.setCategoryTitle(categoryName(state.category));
    updateFavoriteButton();
    renderFormulaNow();
  }

  function validationMessage(reason) {
    if (reason === "empty") return "Enter a value to convert.";
    if (reason === "range") return "That value is too large to convert.";
    return "Enter a valid number.";
  }

  function negativeNote(value) {
    if (value >= 0 || state.category === "temperature") return "";
    return "Negative values are not physical for " + categoryName(state.category) +
      " \u2014 result shown for reference.";
  }

  function cancelScheduledRecord() {
    if (recordTimer) {
      clearTimeout(recordTimer);
      recordTimer = null;
    }
  }

  function scheduleRecord(raw) {
    cancelScheduledRecord();
    recordTimer = setTimeout(function () {
      recordTimer = null;
      recordConversion(raw);
    }, RECORD_DELAY);
  }

  function recordConversion(raw) {
    var signature = [state.category, state.from, state.to, raw].join("|");

    if (state.history.length && state.history[0].sig === signature) return;

    var entry = {
      cat: state.category,
      from: state.from,
      to: state.to,
      raw: raw,
      t: utils.formatTime(new Date()),
      sig: signature
    };

    state.history.unshift(entry);
    state.history = state.history.slice(0, HISTORY_LIMIT);
    storage.saveList("history", state.history);

    if (!state.recent.length || state.recent[0].sig !== signature) {
      state.recent.unshift(entry);
      state.recent = state.recent.slice(0, RECENT_LIMIT);
      storage.saveList("recent", state.recent);
    }

    renderSideLists();
  }

  function recalc(options) {
    var opts = options || {};
    var els = ui.els;
    var raw = els.valueInput.value;
    var parsed = utils.parseValue(raw);

    renderFormulaNow();

    if (!parsed.ok) {
      cancelScheduledRecord();
      state.lastResult = null;
      ui.renderResult({ kind: "invalid" });
      ui.setFieldMessage(
        validationMessage(parsed.reason),
        parsed.reason === "empty" ? "" : "error"
      );
      return;
    }

    var result = engine.convert(parsed.value, state.category, state.from, state.to, {
      precision: state.precision
    });

    if (!result.ok) {
      cancelScheduledRecord();
      state.lastResult = null;
      ui.renderResult({ kind: "error", message: result.error });
      ui.setFieldMessage(result.error, "error");
      return;
    }

    state.lastResult = { result: result, raw: parsed.raw };
    ui.renderResult({ kind: "ok", result: result, raw: parsed.raw });
    ui.setFieldMessage(negativeNote(parsed.value), negativeNote(parsed.value) ? "warning" : "");

    if (opts.record !== false) scheduleRecord(parsed.raw);
  }

  function applySelection(categoryId, unitId, opts) {
    opts = opts || {};

    var category = UF.getCategory(categoryId);
    if (!category) {
      ui.showToast("That category is unavailable.", "error");
      return;
    }

    var pair = UF.getDefaultPair(categoryId);
    var from = opts.from;
    var to = opts.to;

    if (unitId && UF.getUnit(categoryId, unitId)) {
      from = unitId;
      to = unitId === pair.from ? pair.to : pair.from;
    }
    if (!UF.getUnit(categoryId, from)) from = pair.from;
    if (!UF.getUnit(categoryId, to)) to = pair.to;

    state.category = categoryId;
    state.from = from;
    state.to = to;

    if (opts.value !== undefined && opts.value !== null && opts.value !== "") {
      ui.els.valueInput.value = opts.value;
    }

    syncConverterChrome();
    recalc({ record: opts.record === false ? false : undefined });
  }

  function swapUnits() {
    var previousFrom = state.from;
    state.from = state.to;
    state.to = previousFrom;
    ui.els.fromUnit.value = state.from;
    ui.els.toUnit.value = state.to;
    recalc();
    playFeedback(540);
  }

  function fallbackCopy(text) {
    try {
      var area = document.createElement("textarea");
      area.value = text;
      area.setAttribute("readonly", "");
      area.style.position = "fixed";
      area.style.top = "-1000px";
      area.style.opacity = "0";
      document.body.appendChild(area);
      area.select();
      var ok = document.execCommand("copy");
      document.body.removeChild(area);
      return ok;
    } catch (err) {
      return false;
    }
  }

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text).then(
        function () { return true; },
        function () { return fallbackCopy(text); }
      );
    }
    return Promise.resolve(fallbackCopy(text));
  }

  function copyResult() {
    if (!state.lastResult) return;

    var current = state.lastResult;
    var text = current.raw + " " + current.result.fromName + " = " +
      current.result.formattedValue + " " + current.result.toName;

    copyText(text).then(function (ok) {
      if (ok) {
        ui.showToast("Copied!");
        playFeedback(760);
      } else {
        ui.showToast("Copy failed \u2014 select the result and copy manually.", "error");
      }
    });
  }

  function toggleFavorite() {
    var index = favoriteIndex();

    if (index >= 0) {
      state.favorites.splice(index, 1);
      ui.showToast("Removed from favorites.");
    } else {
      if (state.favorites.length >= FAVORITES_LIMIT) state.favorites.pop();
      state.favorites.unshift({ cat: state.category, from: state.from, to: state.to });
      ui.showToast("Saved to favorites.");
      playFeedback(700);
    }

    storage.saveList("favorites", state.favorites);
    renderSideLists();
    updateFavoriteButton();
  }

  function removeFavorite(position) {
    if (position < 0 || position >= state.favorites.length) return;
    state.favorites.splice(position, 1);
    storage.saveList("favorites", state.favorites);
    renderSideLists();
    updateFavoriteButton();
    ui.showToast("Removed from favorites.");
  }

  function clearRecent() {
    state.recent = [];
    storage.saveList("recent", state.recent);
    renderSideLists();
    ui.showToast("Recent conversions cleared.");
  }

  function clearHistory() {
    state.history = [];
    storage.saveList("history", state.history);
    renderSideLists();
    ui.showToast("History cleared.");
  }

  function restoreFromElement(element) {
    applySelection(
      element.getAttribute("data-category"),
      null,
      {
        from: element.getAttribute("data-from"),
        to: element.getAttribute("data-to"),
        value: element.getAttribute("data-value")
      }
    );
  }

  UF.app = {
    state: state,
    recalc: recalc,
    refreshChrome: syncConverterChrome,
    refreshLists: renderSideLists,
    applySelection: applySelection,
    swapUnits: swapUnits,
    copyResult: copyResult,
    toggleFavorite: toggleFavorite,
    removeFavorite: removeFavorite,
    clearRecent: clearRecent,
    clearHistory: clearHistory,
    restoreFromElement: restoreFromElement,
    saveSettings: saveSettings,
    applyTheme: applyTheme,
    currentTheme: currentTheme,
    playFeedback: playFeedback,
    QUICK_CONVERSIONS: QUICK_CONVERSIONS,
    DEFAULTS: DEFAULTS,
    setSearchActiveIndex: function (value) { searchActiveIndex = value; },
    getSearchActiveIndex: function () { return searchActiveIndex; }
  };
})(typeof globalThis !== "undefined" ? globalThis : this);

(function (global) {
  "use strict";

  var UF = global.UF;
  if (!UF || !UF.app) return;

  var app = UF.app;
  var state = app.state;
  var ui = UF.ui;
  var utils = UF.utils;
  var storage = UF.storage;
  var search = UF.search;
  var els = null;

  function syncSettingsForm() {
    var radio = document.querySelector('input[name="theme"][value="' + state.theme + '"]');
    if (radio) radio.checked = true;
    document.getElementById("set-precision").value = state.precision;
    document.getElementById("set-animations").checked = state.animations;
    document.getElementById("set-sound").checked = state.sound;
  }

  function setSearchOpen(open) {
    document.body.classList.toggle("search-open", open);
    els.btnSearchMobile.setAttribute("aria-expanded", open ? "true" : "false");
  }

  function focusSearch() {
    var bar = document.querySelector(".header-search");
    if (bar && global.getComputedStyle(bar).display === "none") setSearchOpen(true);
    els.searchInput.focus();
    els.searchInput.select();
  }

  function togglePanel(panelId) {
    if (ui.getActivePanelId() === panelId) ui.closePanels();
    else ui.openPanel(panelId);
  }

  function activateSearchResult(index) {
    var results = ui.getSearchResults();
    var result = results[index];
    if (!result) return;

    app.applySelection(result.categoryId, result.unitId, {});
    ui.hideSearchResults();
    ui.els.searchInput.value = "";
    setSearchOpen(false);
    ui.els.valueInput.focus();
  }

  function onSearchInput() {
    var text = els.searchInput.value;
    app.setSearchActiveIndex(-1);
    if (!text.trim()) {
      ui.hideSearchResults();
      return;
    }
    ui.renderSearchResults(search.query(text, 8), -1);
  }

  function onSearchKeydown(event) {
    var results = ui.getSearchResults();
    var index = app.getSearchActiveIndex();

    if (event.key === "ArrowDown" && results.length) {
      event.preventDefault();
      index = index < 0 ? 0 : (index + 1) % results.length;
      app.setSearchActiveIndex(index);
      ui.setActiveSearchOption(index);
    } else if (event.key === "ArrowUp" && results.length) {
      event.preventDefault();
      index = index <= 0 ? results.length - 1 : index - 1;
      app.setSearchActiveIndex(index);
      ui.setActiveSearchOption(index);
    } else if (event.key === "Enter") {
      if (results.length) {
        event.preventDefault();
        activateSearchResult(index >= 0 ? index : 0);
      }
    } else if (event.key === "Tab") {
      ui.hideSearchResults();
    }
  }

  function onSettingsChange(event) {
    var target = event.target;

    if (target.name === "theme") {
      state.theme = target.value;
      app.applyTheme();
      app.saveSettings();
    } else if (target.id === "set-precision") {
      state.precision = target.value;
      app.saveSettings();
      app.refreshLists();
      app.recalc({ record: false });
    } else if (target.id === "set-animations") {
      state.animations = target.checked;
      ui.applyAnimations(state.animations);
      app.saveSettings();
    } else if (target.id === "set-sound") {
      state.sound = target.checked;
      app.saveSettings();
      if (state.sound) app.playFeedback(660);
    }
  }

  function onGlobalKeydown(event) {
    if (event.key === "Escape") {
      if (!els.searchResults.hidden) {
        ui.hideSearchResults();
        return;
      }
      if (ui.getActivePanelId()) {
        ui.closePanels();
        return;
      }
      if (document.body.classList.contains("search-open")) {
        setSearchOpen(false);
        ui.hideSearchResults();
      }
      return;
    }

    var target = event.target;
    var tag = target && target.tagName ? target.tagName.toUpperCase() : "";
    var typing = tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA" ||
      (target && target.isContentEditable);

    if (typing || event.ctrlKey || event.metaKey || event.altKey) return;

    var key = event.key.toLowerCase();

    if (event.key === "/") {
      event.preventDefault();
      focusSearch();
    } else if (key === "s") {
      event.preventDefault();
      app.swapUnits();
    } else if (key === "c") {
      event.preventDefault();
      ui.els.valueInput.focus();
      ui.els.valueInput.select();
    } else if (key === "h") {
      event.preventDefault();
      togglePanel("history-panel");
    }
  }

  function bindEvents() {
    els.valueInput.addEventListener("input", function () { app.recalc(); });

    els.fromUnit.addEventListener("change", function () {
      state.from = els.fromUnit.value;
      app.recalc();
      app.refreshChrome();
    });

    els.toUnit.addEventListener("change", function () {
      state.to = els.toUnit.value;
      app.recalc();
      app.refreshChrome();
    });

    els.swapBtn.addEventListener("click", app.swapUnits);
    els.copyBtn.addEventListener("click", app.copyResult);
    els.favoriteBtn.addEventListener("click", app.toggleFavorite);

    els.formulaBtn.addEventListener("click", function () {
      state.showFormula = !state.showFormula;
      app.recalc({ record: false });
    });

    els.categoryList.addEventListener("click", function (event) {
      var button = event.target.closest("[data-category]");
      if (button) app.applySelection(button.getAttribute("data-category"), null, {});
    });

    function restoreHandler(event) {
      var button = event.target.closest("[data-restore]");
      if (button) app.restoreFromElement(button);
    }

    els.quickList.addEventListener("click", restoreHandler);
    els.recentBody.addEventListener("click", restoreHandler);
    els.historyBody.addEventListener("click", restoreHandler);

    els.favoritesBody.addEventListener("click", function (event) {
      var remove = event.target.closest("[data-remove-favorite]");
      if (remove) {
        app.removeFavorite(Number(remove.getAttribute("data-remove-favorite")));
        return;
      }
      restoreHandler(event);
    });

    document.getElementById("btn-clear-recent").addEventListener("click", app.clearRecent);
    document.getElementById("btn-clear-history").addEventListener("click", app.clearHistory);

    els.btnHistory.addEventListener("click", function () { togglePanel("history-panel"); });
    els.btnSettings.addEventListener("click", function () { togglePanel("settings-panel"); });
    els.overlay.addEventListener("click", function () { ui.closePanels(); });

    Array.prototype.forEach.call(document.querySelectorAll("[data-close-panel]"), function (button) {
      button.addEventListener("click", function () { ui.closePanels(); });
    });

    document.getElementById("settings-panel").addEventListener("change", onSettingsChange);

    els.btnTheme.addEventListener("click", function () {
      state.theme = app.currentTheme() === "dark" ? "light" : "dark";
      app.applyTheme();
      syncSettingsForm();
      app.saveSettings();
      app.playFeedback(560);
    });

    els.btnSearchMobile.addEventListener("click", function () {
      var open = !document.body.classList.contains("search-open");
      setSearchOpen(open);
      if (open) els.searchInput.focus();
      else {
        ui.hideSearchResults();
        els.searchInput.value = "";
      }
    });

    els.searchInput.addEventListener("input", onSearchInput);
    els.searchInput.addEventListener("keydown", onSearchKeydown);
    els.searchInput.addEventListener("focus", function () {
      if (els.searchInput.value.trim()) onSearchInput();
    });

    els.searchResults.addEventListener("mousedown", function (event) {
      event.preventDefault();
    });

    els.searchResults.addEventListener("click", function (event) {
      var option = event.target.closest("[data-index]");
      if (option) activateSearchResult(Number(option.getAttribute("data-index")));
    });

    document.addEventListener("click", function (event) {
      if (!event.target.closest(".header-search") && !event.target.closest("#btn-search-mobile")) {
        ui.hideSearchResults();
      }
    });

    document.addEventListener("keydown", onGlobalKeydown);
  }

  function bindSystemTheme() {
    if (!global.matchMedia) return;
    var media = global.matchMedia("(prefers-color-scheme: dark)");
    var handler = function () {
      if (state.theme === "system") app.applyTheme();
    };
    if (media.addEventListener) media.addEventListener("change", handler);
    else if (media.addListener) media.addListener(handler);
  }

  function init() {
    ui.init();
    els = ui.els;
    search.build();

    var settings = storage.loadSettings(app.DEFAULTS);
    var precisions = ["auto", "2", "4", "6", "8"];

    state.precision = precisions.indexOf(String(settings.precision)) >= 0
      ? String(settings.precision) : app.DEFAULTS.precision;
    state.theme = ["system", "light", "dark"].indexOf(settings.theme) >= 0
      ? settings.theme : app.DEFAULTS.theme;
    state.animations = settings.animations !== false;
    state.sound = settings.sound === true;
    state.favorites = storage.loadList("favorites");
    state.recent = storage.loadList("recent");
    state.history = storage.loadList("history");

    app.applyTheme();
    ui.applyAnimations(state.animations);
    syncSettingsForm();
    ui.renderQuick(app.QUICK_CONVERSIONS);
    app.refreshChrome();
    app.refreshLists();
    app.recalc({ record: false });

    bindEvents();
    bindSystemTheme();

    if (!storage.available()) {
      ui.showToast(
        "Local storage unavailable \u2014 history and settings will not persist.",
        "error"
      );
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})(typeof globalThis !== "undefined" ? globalThis : this);
