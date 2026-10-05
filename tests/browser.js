(function (global) {
  "use strict";

  var UF = global.UF;
  var results = document.getElementById("results");
  var summary = document.getElementById("summary");
  var tests = UF.testSuite();
  var passed = 0;
  var failed = 0;

  tests.forEach(function (entry) {
    var row = document.createElement("li");
    try {
      entry.fn();
      passed += 1;
      row.className = "pass";
      row.textContent = "✓ " + entry.name;
    } catch (error) {
      failed += 1;
      row.className = "fail";
      row.textContent = "✗ " + entry.name + " — " + error.message;
    }
    results.appendChild(row);
  });

  summary.textContent = passed + "/" + tests.length + " tests passed" +
    (failed ? " (" + failed + " failed)" : "");
  summary.className = failed ? "fail" : "pass";
})(typeof globalThis !== "undefined" ? globalThis : this);
