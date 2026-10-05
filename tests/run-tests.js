var path = require("path");

require(path.join(__dirname, "..", "js", "units.js"));
require(path.join(__dirname, "..", "js", "utils.js"));
require(path.join(__dirname, "..", "js", "conversionEngine.js"));
require(path.join(__dirname, "..", "js", "search.js"));
require(path.join(__dirname, "..", "tests", "suite.js"));

var UF = globalThis.UF;
var tests = UF.testSuite();
var passed = 0;
var failures = [];

tests.forEach(function (entry) {
  try {
    entry.fn();
    passed += 1;
    console.log("  \u2713 " + entry.name);
  } catch (error) {
    failures.push({ name: entry.name, message: error.message });
    console.log("  \u2717 " + entry.name + "\n      " + error.message);
  }
});

console.log("\n" + passed + "/" + tests.length + " tests passed");

if (failures.length) {
  console.log("\nFailures:");
  failures.forEach(function (failure) {
    console.log("  - " + failure.name + ": " + failure.message);
  });
  process.exitCode = 1;
}
