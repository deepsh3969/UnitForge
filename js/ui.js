(function (global) {
  "use strict";

  var UF = (global.UF = global.UF || {});
  var el = UF.utils.el;

  var els = {};
  var activePanelId = null;
  var lastFocused = null;
  var toastTimer = null;
  var searchResults = [];

  function init() {
    els.categoryList = document.getElementById("category-list");
    els.favoritesBody = document.getElementById("favorites-body");
    els.favoritesCount = document.getElementById("favorites-count");
    els.catTitle = document.getElementById("cat-title");
    els.favoriteBtn = document.getElementById("btn-favorite");
    els.favoriteLabel = document.getElementById("favorite-label");
    els.valueInput = document.getElementById("value-input");
    els.valueMsg = document.getElementById("value-msg");
    els.fromUnit = document.getElementById("from-unit");
    els.toUnit = document.getElementById("to-unit");
    els.swapBtn = document.getElementById("btn-swap");
    els.resultValue = document.getElementById("result-value");
    els.resultNumber = document.getElementById("result-number");
    els.resultUnit = document.getElementById("result-unit");
    els.resultSub = document.getElementById("result-sub");
    els.copyBtn = document.getElementById("btn-copy");
    els.formulaBtn = document.getElementById("btn-formula");
    els.formulaBox = document.getElementById("formula-box");
    els.quickList = document.getElementById("quick-list");
    els.recentBody = document.getElementById("recent-body");
    els.historyBody = document.getElementById("history-body");
    els.overlay = document.getElementById("overlay");
    els.toast = document.getElementById("toast");
    els.btnTheme = document.getElementById("btn-theme");
    els.btnHistory = document.getElementById("btn-history");
    els.btnSettings = document.getElementById("btn-settings");
    els.btnSearchMobile = document.getElementById("btn-search-mobile");
    els.searchInput = document.getElementById("global-search");
    els.searchResults = document.getElementById("search-results");
    els.metaThemeColor = document.querySelector('meta[name="theme-color"]');

    document.addEventListener("keydown", handleTrapFocus);
  }

  function renderCategories(categories, activeId) {
    var fragment = document.createDocumentFragment();

    categories.forEach(function (category) {
      var button = el("button", {
        type: "button",
        class: "cat-btn",
        "data-category": category.id
      });
      if (category.id === activeId) button.setAttribute("aria-current", "true");

      button.appendChild(el("span", { class: "cat-name", text: category.name }));
      button.appendChild(el("span", { class: "cat-count", text: String(category.units.length) }));

      fragment.appendChild(el("li", null, [button]));
    });

    els.categoryList.textContent = "";
    els.categoryList.appendChild(fragment);
  }

  function renderUnitSelects(categoryId, fromId, toId) {
    var units = UF.getUnits(categoryId);

    [els.fromUnit, els.toUnit].forEach(function (select) {
      select.textContent = "";
      units.forEach(function (unit) {
        select.appendChild(
          el("option", { value: unit.id, text: unit.name + " (" + unit.symbol + ")" })
        );
      });
    });

    els.fromUnit.value = fromId;
    els.toUnit.value = toId;
  }

  function setCategoryTitle(name) {
    els.catTitle.textContent = name;
  }

  function setFieldMessage(text, type) {
    els.valueMsg.textContent = text || "";
    els.valueMsg.className = "field-msg" + (type ? " is-" + type : "");
  }

  function renderResult(view) {
    var valueNode = els.resultValue;

    if (view.kind === "ok") {
      els.resultNumber.textContent = view.result.formattedValue;
      els.resultUnit.textContent = view.result.toSymbol;
      els.resultSub.textContent =
        view.raw + " " + view.result.fromName + " = " +
        view.result.formattedValue + " " + view.result.toName;
      valueNode.classList.remove("is-error-state");
      els.copyBtn.disabled = false;
    } else {
      els.resultNumber.textContent = "—";
      els.resultUnit.textContent = "";
      els.resultSub.textContent = view.kind === "error" ? view.message : "";
      valueNode.classList.add("is-error-state");
      els.copyBtn.disabled = true;
    }

    if (!document.body.classList.contains("no-animations")) {
      valueNode.classList.remove("is-updated");
      void valueNode.offsetWidth;
      valueNode.classList.add("is-updated");
    }
  }

  function renderFormula(lines, visible) {
    els.formulaBox.textContent = "";

    if (visible && lines && lines.length) {
      els.formulaBox.appendChild(el("p", { class: "formula-label", text: "Formula" }));
      lines.forEach(function (line) {
        els.formulaBox.appendChild(el("p", { class: "formula-line", text: line }));
      });
      els.formulaBox.hidden = false;
      els.formulaBtn.setAttribute("aria-expanded", "true");
      els.formulaBtn.textContent = "Hide formula";
    } else {
      els.formulaBox.hidden = true;
      els.formulaBtn.setAttribute("aria-expanded", "false");
      els.formulaBtn.textContent = "Show formula";
    }
  }

  function buildRestoreButton(item) {
    var button = el("button", {
      type: "button",
      class: "restore-item",
      "data-restore": "true",
      "data-category": item.category,
      "data-from": item.from,
      "data-to": item.to
    });

    if (item.raw !== undefined && item.raw !== null && item.raw !== "") {
      button.setAttribute("data-value", item.raw);
    }

    var main = el("span", { class: "restore-main" });
    main.appendChild(el("span", { class: "restore-value", text: item.display }));
    main.appendChild(el("span", { class: "restore-meta", text: item.meta }));
    button.appendChild(main);

    if (item.time) {
      button.insertBefore(el("span", { class: "history-time", text: item.time }), main);
    }

    return button;
  }

  function renderRecent(items) {
    els.recentBody.textContent = "";

    if (!items.length) {
      els.recentBody.appendChild(
        el("p", { class: "empty-state", text: "Your recent conversions will appear here." })
      );
      return;
    }

    var fragment = document.createDocumentFragment();
    items.forEach(function (item) {
      fragment.appendChild(buildRestoreButton(item));
    });
    els.recentBody.appendChild(fragment);
  }

  function renderFavorites(items) {
    els.favoritesBody.textContent = "";
    els.favoritesCount.textContent = String(items.length);

    if (!items.length) {
      els.favoritesBody.appendChild(
        el("p", { class: "empty-state", text: "Star a conversion pair to pin it here." })
      );
      return;
    }

    var fragment = document.createDocumentFragment();

    items.forEach(function (item, position) {
      var row = el("div", { class: "fav-row" });

      var button = buildRestoreButton(item);
      button.insertBefore(el("span", { class: "fav-star", text: "★" }), button.firstChild);

      var remove = el("button", {
        type: "button",
        class: "remove-btn",
        "data-remove-favorite": String(position),
        "aria-label": "Remove " + item.display + " from favorites",
        text: "×"
      });

      row.appendChild(button);
      row.appendChild(remove);
      fragment.appendChild(row);
    });

    els.favoritesBody.appendChild(fragment);
  }

  function renderHistory(items) {
    els.historyBody.textContent = "";

    if (!items.length) {
      els.historyBody.appendChild(
        el("p", { class: "empty-state", text: "No conversions recorded yet." })
      );
      return;
    }

    var fragment = document.createDocumentFragment();
    items.forEach(function (item) {
      fragment.appendChild(buildRestoreButton(item));
    });
    els.historyBody.appendChild(fragment);
  }

  function renderQuick(items) {
    var fragment = document.createDocumentFragment();

    items.forEach(function (item) {
      var button = el("button", {
        type: "button",
        class: "quick-card",
        "data-restore": "true",
        "data-category": item.category,
        "data-from": item.from,
        "data-to": item.to,
        "data-value": item.value
      });
      button.appendChild(el("span", { class: "quick-main", text: item.label }));
      button.appendChild(el("span", { class: "quick-meta", text: item.meta }));
      fragment.appendChild(button);
    });

    els.quickList.textContent = "";
    els.quickList.appendChild(fragment);
  }

  function updateFavoriteButton(isFavorite) {
    els.favoriteBtn.setAttribute("aria-pressed", isFavorite ? "true" : "false");
    els.favoriteLabel.textContent = isFavorite ? "Favorited" : "Favorite";
    els.favoriteBtn.setAttribute(
      "aria-label",
      isFavorite ? "Remove this pair from favorites" : "Add this pair to favorites"
    );
  }

  function renderSearchResults(results, activeIndex) {
    searchResults = results;
    els.searchResults.textContent = "";

    if (!results.length) {
      els.searchResults.appendChild(
        el("p", { class: "search-empty", text: "No matching units or categories." })
      );
    } else {
      var fragment = document.createDocumentFragment();

      results.forEach(function (result, position) {
        var option = el("div", {
          class: "search-result" + (position === activeIndex ? " is-active" : ""),
          role: "option",
          id: "uf-search-option-" + position,
          "aria-selected": position === activeIndex ? "true" : "false",
          "data-index": String(position),
          "data-category": result.categoryId,
          "data-unit": result.unitId || "",
          "data-kind": result.kind
        });
        option.appendChild(el("span", { class: "res-name", text: result.label }));
        option.appendChild(el("span", { class: "res-detail", text: result.detail }));
        fragment.appendChild(option);
      });

      els.searchResults.appendChild(fragment);
    }

    els.searchResults.hidden = false;
    els.searchInput.setAttribute("aria-expanded", "true");
    setActiveSearchOption(activeIndex);
  }

  function setActiveSearchOption(index) {
    var options = els.searchResults.querySelectorAll('[role="option"]');
    for (var i = 0; i < options.length; i += 1) {
      options[i].setAttribute("aria-selected", i === index ? "true" : "false");
      options[i].classList.toggle("is-active", i === index);
    }
    if (index >= 0 && options[index]) {
      els.searchInput.setAttribute("aria-activedescendant", options[index].id);
      options[index].scrollIntoView({ block: "nearest" });
    } else {
      els.searchInput.removeAttribute("aria-activedescendant");
    }
  }

  function hideSearchResults() {
    searchResults = [];
    els.searchResults.hidden = true;
    els.searchResults.textContent = "";
    els.searchInput.setAttribute("aria-expanded", "false");
    els.searchInput.removeAttribute("aria-activedescendant");
  }

  function getSearchResults() {
    return searchResults;
  }

  function showToast(message, type) {
    if (toastTimer) clearTimeout(toastTimer);
    els.toast.textContent = message;
    els.toast.className = "toast" + (type === "error" ? " is-error" : "");
    els.toast.hidden = false;
    toastTimer = setTimeout(function () {
      els.toast.hidden = true;
      toastTimer = null;
    }, 2400);
  }

  function openPanel(panelId) {
    if (activePanelId === panelId) return;
    closePanels(false);

    lastFocused = document.activeElement;
    activePanelId = panelId;
    els.overlay.hidden = false;

    var panel = document.getElementById(panelId);
    panel.hidden = false;

    var focusable = panel.querySelector(
      'button, [href], input:not([type="hidden"]), select, textarea'
    );
    if (focusable) focusable.focus();
  }

  function closePanels(restoreFocus) {
    if (activePanelId) {
      var panel = document.getElementById(activePanelId);
      if (panel) panel.hidden = true;
      activePanelId = null;
    }
    els.overlay.hidden = true;

    if (restoreFocus !== false && lastFocused && typeof lastFocused.focus === "function") {
      lastFocused.focus();
    }
    lastFocused = null;
  }

  function getActivePanelId() {
    return activePanelId;
  }

  function handleTrapFocus(event) {
    if (event.key !== "Tab" || !activePanelId) return;

    var panel = document.getElementById(activePanelId);
    if (!panel) return;

    var focusable = panel.querySelectorAll(
      'button, [href], input:not([type="hidden"]), select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (!focusable.length) return;

    var first = focusable[0];
    var last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    } else if (!panel.contains(document.activeElement)) {
      event.preventDefault();
      first.focus();
    }
  }

  function applyTheme(preference, resolved) {
    document.documentElement.setAttribute("data-theme", preference);
    els.btnTheme.setAttribute("data-effective", resolved);
    els.btnTheme.setAttribute(
      "aria-label",
      resolved === "dark" ? "Switch to light theme" : "Switch to dark theme"
    );
    if (els.metaThemeColor) {
      els.metaThemeColor.setAttribute("content", resolved === "dark" ? "#0d1220" : "#ffffff");
    }
  }

  function applyAnimations(enabled) {
    document.body.classList.toggle("no-animations", !enabled);
  }

  UF.ui = {
    init: init,
    els: els,
    renderCategories: renderCategories,
    renderUnitSelects: renderUnitSelects,
    setCategoryTitle: setCategoryTitle,
    setFieldMessage: setFieldMessage,
    renderResult: renderResult,
    renderFormula: renderFormula,
    renderRecent: renderRecent,
    renderFavorites: renderFavorites,
    renderHistory: renderHistory,
    renderQuick: renderQuick,
    updateFavoriteButton: updateFavoriteButton,
    renderSearchResults: renderSearchResults,
    setActiveSearchOption: setActiveSearchOption,
    hideSearchResults: hideSearchResults,
    getSearchResults: getSearchResults,
    showToast: showToast,
    openPanel: openPanel,
    closePanels: closePanels,
    getActivePanelId: getActivePanelId,
    applyTheme: applyTheme,
    applyAnimations: applyAnimations
  };
})(typeof globalThis !== "undefined" ? globalThis : this);
