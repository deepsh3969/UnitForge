(function (global) {
  "use strict";

  var checks = [];

  function check(name, condition, detail) {
    checks.push({ name: name, ok: !!condition, detail: detail === undefined ? "" : String(detail) });
  }

  function fire(element, type, options) {
    var event;
    try {
      event = new Event(type, { bubbles: true, cancelable: true });
    } catch (err) {
      event = document.createEvent("Event");
      event.initEvent(type, true, true);
    }
    element.dispatchEvent(event);
  }

  function press(key) {
    document.dispatchEvent(new KeyboardEvent("keydown", {
      key: key,
      bubbles: true,
      cancelable: true
    }));
  }

  function pressOn(element, key) {
    element.dispatchEvent(new KeyboardEvent("keydown", {
      key: key,
      bubbles: true,
      cancelable: true
    }));
  }

  function text(id) {
    var node = document.getElementById(id);
    return node ? node.textContent.trim() : "";
  }

  function run() {
    var value = document.getElementById("value-input");
    var from = document.getElementById("from-unit");
    var to = document.getElementById("to-unit");

    check("initial result", text("result-number") === "0.1" && text("result-unit") === "km",
      text("result-number") + " " + text("result-unit"));
    check("initial sub line", text("result-sub") === "100 Meter = 0.1 Kilometer", text("result-sub"));
    check("categories rendered", document.querySelectorAll(".cat-btn").length === 12,
      document.querySelectorAll(".cat-btn").length);
    check("quick conversions rendered", document.querySelectorAll(".quick-card").length === 8,
      document.querySelectorAll(".quick-card").length);

    value.value = "5";
    fire(value, "input");
    check("value update recalculates", text("result-number") === "0.005", text("result-number"));

    value.value = "abc";
    fire(value, "input");
    check("invalid input message", text("value-msg") === "Enter a valid number.", text("value-msg"));
    check("invalid input result placeholder", text("result-number") === "—", text("result-number"));

    value.value = "";
    fire(value, "input");
    check("empty input message", text("value-msg") === "Enter a value to convert.", text("value-msg"));

    value.value = "1e999";
    fire(value, "input");
    check("overflow message", text("value-msg") === "That value is too large to convert.",
      text("value-msg"));

    value.value = "100";
    fire(value, "input");
    check("valid input restores result", text("result-number") === "0.1", text("result-number"));

    var tempButton = document.querySelector('[data-category="temperature"]');
    tempButton.click();
    check("category switch title", text("cat-title") === "Temperature", text("cat-title"));
    check("category switch units", from.options.length === 3 && from.value === "c" && to.value === "f",
      from.value + "→" + to.value);
    check("category switch keeps value", value.value === "100", value.value);
    check("temperature result", text("result-number") === "212", text("result-number"));
    tempButton = document.querySelector('[data-category="temperature"]');
    check("active category marked", tempButton.getAttribute("aria-current") === "true",
      tempButton.getAttribute("aria-current"));

    value.value = "-40";
    fire(value, "input");
    check("negative temperature allowed", text("result-number") === "-40", text("result-number"));
    check("no warning for temperature", text("value-msg") === "", text("value-msg"));

    document.getElementById("btn-swap").click();
    check("swap exchanges units", from.value === "f" && to.value === "c", from.value + "→" + to.value);
    check("swap recalculates", text("result-number") === "-40", text("result-number"));

    value.value = "-10";
    fire(value, "input");
    var lengthButton = document.querySelector('[data-category="length"]');
    lengthButton.click();
    check("negative non-temperature warning",
      text("value-msg").indexOf("Negative values") === 0, text("value-msg"));

    var favorite = document.getElementById("btn-favorite");
    favorite.click();
    check("favorite toggles on", favorite.getAttribute("aria-pressed") === "true",
      favorite.getAttribute("aria-pressed"));
    check("favorite list grows", document.querySelectorAll("#favorites-body .fav-row").length === 1,
      document.querySelectorAll("#favorites-body .fav-row").length);

    favorite.click();
    check("favorite toggles off", favorite.getAttribute("aria-pressed") === "false",
      favorite.getAttribute("aria-pressed"));

    document.querySelector(".quick-card").click();
    check("quick conversion sets category", text("cat-title") === "Length", text("cat-title"));
    check("quick conversion sets units", from.value === "km" && to.value === "mi",
      from.value + "→" + to.value);
    check("quick conversion sets value", value.value === "1", value.value);
    check("quick conversion result", text("result-number") === "0.6213711922", text("result-number"));

    var searchInput = document.getElementById("global-search");
    searchInput.value = "mile";
    fire(searchInput, "input");
    var options = document.querySelectorAll('#search-results [role="option"]');
    check("search returns results", options.length >= 3, options.length);
    check("search ranks Mile first",
      options.length && options[0].textContent.indexOf("Mile") === 0,
      options.length ? options[0].textContent : "none");

    searchInput.focus();
    pressOn(searchInput, "ArrowDown");
    options = document.querySelectorAll('#search-results [role="option"]');
    check("search arrow key activates option",
      options.length >= 3 && options[0].classList.contains("is-active"),
      options.length);
    options[0].click();
    check("search selection sets unit", from.value === "mi", from.value);
    check("search selection sets target unit", to.value === "m", to.value);
    check("search selection clears query", searchInput.value === "", JSON.stringify(searchInput.value));

    document.getElementById("btn-swap").click();
    var beforeSwapFrom = from.value;
    var beforeSwapTo = to.value;
    press("s");
    check("keyboard S swaps", from.value === beforeSwapTo && to.value === beforeSwapFrom,
      from.value + "→" + to.value);

    press("c");
    check("keyboard C focuses value", document.activeElement === value, document.activeElement.id);

    press("/");
    check("keyboard / focuses search", document.activeElement === searchInput,
      document.activeElement.id);

    press("Escape");
    searchInput.blur();

    press("h");
    check("keyboard H opens history", document.getElementById("history-panel").hidden === false,
      document.getElementById("history-panel").hidden);
    press("Escape");
    check("Escape closes history", document.getElementById("history-panel").hidden === true,
      document.getElementById("history-panel").hidden);

    document.getElementById("btn-settings").click();

    document.querySelector('[data-category="length"]').click();
    value.value = "1";
    fire(value, "input");

    var precision = document.getElementById("set-precision");
    precision.value = "2";
    fire(precision, "change");
    check("precision 2 decimals", text("result-number") === "0.00", text("result-number"));

    precision.value = "auto";
    fire(precision, "change");
    check("precision auto restores", text("result-number") === "0.001", text("result-number"));

    var animations = document.getElementById("set-animations");
    animations.checked = false;
    fire(animations, "change");
    check("animations toggle", document.body.classList.contains("no-animations"),
      document.body.classList.contains("no-animations"));
    animations.checked = true;
    fire(animations, "change");

    var themeRadio = document.querySelector('input[name="theme"][value="dark"]');
    themeRadio.checked = true;
    fire(themeRadio, "change");
    check("dark theme applies",
      document.documentElement.getAttribute("data-theme") === "dark",
      document.documentElement.getAttribute("data-theme"));

    var lightRadio = document.querySelector('input[name="theme"][value="light"]');
    lightRadio.checked = true;
    fire(lightRadio, "change");
    check("light theme applies",
      document.documentElement.getAttribute("data-theme") === "light",
      document.documentElement.getAttribute("data-theme"));

    document.querySelector("[data-close-panel]").click();

    document.getElementById("btn-formula").click();
    check("formula opens", document.getElementById("formula-box").hidden === false,
      document.getElementById("formula-box").hidden);
    check("formula content", text("formula-box").indexOf("0.001") > -1, text("formula-box"));
    document.getElementById("btn-formula").click();
    check("formula closes", document.getElementById("formula-box").hidden === true,
      document.getElementById("formula-box").hidden);

    document.getElementById("btn-copy").click();

    document.getElementById("btn-history").click();
    check("history panel opens via button",
      document.getElementById("history-panel").hidden === false,
      document.getElementById("history-panel").hidden);
    document.getElementById("overlay").click();
    check("overlay closes panel",
      document.getElementById("history-panel").hidden === true,
      document.getElementById("history-panel").hidden);

    var storageOk = true;
    try {
      localStorage.setItem("uf-probe", "1");
      localStorage.removeItem("uf-probe");
    } catch (err) {
      storageOk = false;
    }
    check("localStorage available", storageOk, storageOk);

    setTimeout(function () {
      var recentEmpty = document.getElementById("recent-body").textContent;
      check("recent list populated or empty state",
        recentEmpty.indexOf("→") > -1 || recentEmpty.indexOf("appear here") > -1, recentEmpty.slice(0, 60));

      document.getElementById("btn-clear-recent").click();
      check("clear recent works",
        document.getElementById("recent-body").textContent.indexOf("appear here") > -1,
        document.getElementById("recent-body").textContent.slice(0, 60));

      var failed = checks.filter(function (item) { return !item.ok; });
      var report = document.createElement("pre");
      report.id = "smoke-report";
      report.textContent = JSON.stringify({
        total: checks.length,
        failed: failed.length,
        failures: failed,
        checks: checks
      }, null, 1);
      document.body.appendChild(report);
      console.log("SMOKE_RESULT " + JSON.stringify({
        total: checks.length,
        failed: failed.length,
        failures: failed.map(function (f) { return f.name + " [" + f.detail + "]"; })
      }));
    }, 1300);
  }

  if (document.readyState === "complete") run();
  else global.addEventListener("load", run);
})(typeof globalThis !== "undefined" ? globalThis : this);
