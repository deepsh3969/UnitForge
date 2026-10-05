(function (global) {
  "use strict";

  var UF = global.UF;
  if (!UF) return;

  function assert(condition, message) {
    if (!condition) throw new Error(message);
  }

  function assertClose(actual, expected, tolerance, label) {
    var diff = Math.abs(actual - expected);
    var limit = tolerance === undefined ? 1e-9 : tolerance;
    if (!(diff <= limit)) {
      throw new Error(label + " — expected " + expected + ", received " + actual);
    }
  }

  function convert(value, category, from, to) {
    var result = UF.engine.convert(value, category, from, to, { precision: "auto" });
    if (!result.ok) throw new Error("convert failed: " + result.error);
    return result.value;
  }

  function testSuite() {
    var tests = [];
    function test(name, fn) {
      tests.push({ name: name, fn: fn });
    }

    test("length: 1000 m to km", function () {
      assertClose(convert(1000, "length", "m", "km"), 1, 1e-12, "1000 m in km");
    });

    test("length: 100 cm to m", function () {
      assertClose(convert(100, "length", "cm", "m"), 1, 1e-12, "100 cm in m");
    });

    test("length: 1 mile to km", function () {
      assertClose(convert(1, "length", "mi", "km"), 1.609344, 1e-12, "1 mi in km");
    });

    test("length: 12 inches to feet", function () {
      assertClose(convert(12, "length", "in", "ft"), 1, 1e-12, "12 in in ft");
    });

    test("length: 1 nautical mile to meters", function () {
      assertClose(convert(1, "length", "nmi", "m"), 1852, 1e-9, "1 nmi in m");
    });

    test("length: 1 yard to feet", function () {
      assertClose(convert(1, "length", "yd", "ft"), 3, 1e-12, "1 yd in ft");
    });

    test("mass: 1 kg to pounds", function () {
      assertClose(convert(1, "mass", "kg", "lb"), 2.2046226218, 1e-8, "1 kg in lb");
    });

    test("mass: 1000 g to kg", function () {
      assertClose(convert(1000, "mass", "g", "kg"), 1, 1e-12, "1000 g in kg");
    });

    test("mass: 1 stone to pounds", function () {
      assertClose(convert(1, "mass", "st", "lb"), 14, 1e-9, "1 st in lb");
    });

    test("mass: 1 metric ton to kg", function () {
      assertClose(convert(1, "mass", "t", "kg"), 1000, 1e-9, "1 t in kg");
    });

    test("temperature: 0 °C to °F", function () {
      assertClose(convert(0, "temperature", "c", "f"), 32, 1e-12, "0 °C in °F");
    });

    test("temperature: 100 °C to °F", function () {
      assertClose(convert(100, "temperature", "c", "f"), 212, 1e-12, "100 °C in °F");
    });

    test("temperature: -40 °C to °F", function () {
      assertClose(convert(-40, "temperature", "c", "f"), -40, 1e-12, "-40 °C in °F");
    });

    test("temperature: 0 °C to K", function () {
      assertClose(convert(0, "temperature", "c", "k"), 273.15, 1e-12, "0 °C in K");
    });

    test("temperature: 300 K to °C", function () {
      assertClose(convert(300, "temperature", "k", "c"), 26.85, 1e-12, "300 K in °C");
    });

    test("temperature: 32 °F to °C", function () {
      assertClose(convert(32, "temperature", "f", "c"), 0, 1e-12, "32 °F in °C");
    });

    test("temperature: 98.6 °F to °C", function () {
      assertClose(convert(98.6, "temperature", "f", "c"), 37, 1e-10, "98.6 °F in °C");
    });

    test("temperature: 0 K to °C", function () {
      assertClose(convert(0, "temperature", "k", "c"), -273.15, 1e-12, "0 K in °C");
    });

    test("temperature: 373.15 K to °F", function () {
      assertClose(convert(373.15, "temperature", "k", "f"), 212, 1e-9, "373.15 K in °F");
    });

    test("temperature: negative Celsius allowed", function () {
      assertClose(convert(-5, "temperature", "c", "f"), 23, 1e-12, "-5 °C in °F");
    });

    test("area: 10000 m² to hectares", function () {
      assertClose(convert(10000, "area", "m2", "ha"), 1, 1e-12, "10000 m² in ha");
    });

    test("area: 1 acre to ft²", function () {
      assertClose(convert(1, "area", "acre", "ft2"), 43560, 1e-6, "1 acre in ft²");
    });

    test("area: 1 km² to m²", function () {
      assertClose(convert(1, "area", "km2", "m2"), 1000000, 1e-6, "1 km² in m²");
    });

    test("volume: 1000 mL to L", function () {
      assertClose(convert(1000, "volume", "ml", "l"), 1, 1e-12, "1000 mL in L");
    });

    test("volume: 1 m³ to L", function () {
      assertClose(convert(1, "volume", "m3", "l"), 1000, 1e-9, "1 m³ in L");
    });

    test("volume: 1 gallon (US) to L", function () {
      assertClose(convert(1, "volume", "gal", "l"), 3.785411784, 1e-12, "1 gal in L");
    });

    test("volume: 1 L to cm³", function () {
      assertClose(convert(1, "volume", "l", "cm3"), 1000, 1e-12, "1 L in cm³");
    });

    test("speed: 36 km/h to m/s", function () {
      assertClose(convert(36, "speed", "kph", "mps"), 10, 1e-12, "36 km/h in m/s");
    });

    test("speed: 60 mph to km/h", function () {
      assertClose(convert(60, "speed", "mph", "kph"), 96.56064, 1e-9, "60 mph in km/h");
    });

    test("speed: 10 m/s to km/h", function () {
      assertClose(convert(10, "speed", "mps", "kph"), 36, 1e-9, "10 m/s in km/h");
    });

    test("speed: 1 knot to m/s", function () {
      assertClose(convert(1, "speed", "kt", "mps"), 1852 / 3600, 1e-12, "1 kn in m/s");
    });

    test("time: 1 hour to minutes", function () {
      assertClose(convert(1, "time", "h", "min"), 60, 1e-12, "1 h in min");
    });

    test("time: 1 day to hours", function () {
      assertClose(convert(1, "time", "day", "h"), 24, 1e-12, "1 d in h");
    });

    test("time: 1 year to days", function () {
      assertClose(convert(1, "time", "year", "day"), 365.25, 1e-9, "1 yr in d");
    });

    test("time: 1000 ms to s", function () {
      assertClose(convert(1000, "time", "ms", "s"), 1, 1e-12, "1000 ms in s");
    });

    test("digital: 1 TB to GB", function () {
      assertClose(convert(1, "digital", "tb", "gb"), 1000, 1e-9, "1 TB in GB");
    });

    test("digital: 8 bits to bytes", function () {
      assertClose(convert(8, "digital", "bit", "b"), 1, 1e-12, "8 bit in B");
    });

    test("digital: 1 GB to MB", function () {
      assertClose(convert(1, "digital", "gb", "mb"), 1000, 1e-9, "1 GB in MB");
    });

    test("pressure: 1 atm to Pa", function () {
      assertClose(convert(1, "pressure", "atm", "pa"), 101325, 1e-9, "1 atm in Pa");
    });

    test("pressure: 1 bar to kPa", function () {
      assertClose(convert(1, "pressure", "bar", "kpa"), 100, 1e-12, "1 bar in kPa");
    });

    test("pressure: 1 atm to PSI", function () {
      assertClose(convert(1, "pressure", "atm", "psi"), 14.6959487755, 1e-7, "1 atm in psi");
    });

    test("pressure: 1 mmHg to Pa", function () {
      assertClose(convert(1, "pressure", "mmhg", "pa"), 133.322387415, 1e-9, "1 mmHg in Pa");
    });

    test("energy: 1 kWh to J", function () {
      assertClose(convert(1, "energy", "kwh", "j"), 3600000, 1e-6, "1 kWh in J");
    });

    test("energy: 1 kcal to J", function () {
      assertClose(convert(1, "energy", "kcal", "j"), 4184, 1e-9, "1 kcal in J");
    });

    test("energy: 1000 J to kJ", function () {
      assertClose(convert(1000, "energy", "j", "kj"), 1, 1e-12, "1000 J in kJ");
    });

    test("power: 1 kW to W", function () {
      assertClose(convert(1, "power", "kw", "w"), 1000, 1e-9, "1 kW in W");
    });

    test("power: 1 horsepower to W", function () {
      assertClose(convert(1, "power", "hp", "w"), 745.6998715822702, 1e-9, "1 hp in W");
    });

    test("power: 1 MW to kW", function () {
      assertClose(convert(1, "power", "mw", "kw"), 1000, 1e-9, "1 MW in kW");
    });

    test("angle: 180° to radians", function () {
      assertClose(convert(180, "angle", "deg", "rad"), Math.PI, 1e-12, "180° in rad");
    });

    test("angle: 1 radian to degrees", function () {
      assertClose(convert(1, "angle", "rad", "deg"), 57.29577951308232, 1e-12, "1 rad in °");
    });

    test("angle: 100 grad to degrees", function () {
      assertClose(convert(100, "angle", "grad", "deg"), 90, 1e-12, "100 grad in °");
    });

    test("edge: zero value", function () {
      assertClose(convert(0, "length", "m", "km"), 0, 0, "0 m in km");
    });

    test("edge: very large value", function () {
      assertClose(convert(1e12, "length", "m", "km"), 1e9, 1, "1e12 m in km");
    });

    test("edge: very small value", function () {
      assertClose(convert(1e-9, "length", "m", "mm"), 1e-6, 1e-18, "1e-9 m in mm");
    });

    test("edge: decimal value", function () {
      assertClose(convert(2.5, "length", "m", "cm"), 250, 1e-9, "2.5 m in cm");
    });

    test("round trip: every unit returns to its origin", function () {
      UF.categories.forEach(function (category) {
        category.units.forEach(function (unit) {
          var other = category.units[(category.units.indexOf(unit) + 1) % category.units.length];
          var forward = convert(3.7, category.id, unit.id, other.id);
          var backward = convert(forward, category.id, other.id, unit.id);
          assertClose(backward, 3.7, 1e-6, category.id + " " + unit.id + " → " + other.id);
        });
      });
    });

    test("errors: NaN input is rejected", function () {
      var result = UF.engine.convert(NaN, "length", "m", "km");
      assert(!result.ok, "NaN conversion should fail");
    });

    test("errors: unknown unit is rejected", function () {
      var result = UF.engine.convert(1, "length", "bogus", "km");
      assert(!result.ok, "unknown unit should fail");
    });

    test("errors: unknown category is rejected", function () {
      var result = UF.engine.convert(1, "bogus", "m", "km");
      assert(!result.ok, "unknown category should fail");
    });

    test("parse: rejects letters", function () {
      assert(!UF.utils.parseValue("abc").ok, "letters should be rejected");
    });

    test("parse: rejects empty input", function () {
      var parsed = UF.utils.parseValue("");
      assert(!parsed.ok && parsed.reason === "empty", "empty input reason");
    });

    test("parse: rejects overflow", function () {
      var parsed = UF.utils.parseValue("1e999");
      assert(!parsed.ok && parsed.reason === "range", "overflow reason");
    });

    test("parse: accepts scientific notation", function () {
      var parsed = UF.utils.parseValue("1e3");
      assert(parsed.ok && parsed.value === 1000, "1e3 should equal 1000");
    });

    test("parse: strips thousands separators", function () {
      var parsed = UF.utils.parseValue("1,234.5");
      assert(parsed.ok && parsed.value === 1234.5, "1,234.5 should equal 1234.5");
    });

    test("parse: accepts negative decimals", function () {
      var parsed = UF.utils.parseValue("-12.5");
      assert(parsed.ok && parsed.value === -12.5, "-12.5 accepted");
    });

    test("format: removes floating point noise", function () {
      var text = UF.utils.formatNumber(0.30000000000000004, "auto");
      assert(text === "0.3", "expected 0.3, received " + text);
    });

    test("format: groups thousands", function () {
      var text = UF.utils.formatNumber(1000000, "auto");
      assert(text === "1,000,000", "expected 1,000,000, received " + text);
    });

    test("format: keeps tiny values readable", function () {
      var text = UF.utils.formatNumber(0.0000012, "auto");
      assert(text === "0.0000012", "expected 0.0000012, received " + text);
    });

    test("format: uses scientific notation for extremes", function () {
      var text = UF.utils.formatNumber(0.0000000001, "auto");
      assert(text.indexOf("10") > -1 && text.indexOf("×") > -1,
        "expected scientific notation, received " + text);
    });

    test("format: fixed precision", function () {
      var text = UF.utils.formatNumber(0.123456789, 2);
      assert(text === "0.12", "expected 0.12, received " + text);
    });

    test("format: handles zero and invalid input", function () {
      assert(UF.utils.formatNumber(0, "auto") === "0", "zero formats as 0");
      assert(UF.utils.formatNumber(NaN, "auto") === "\u2014", "NaN formats as em dash");
    });

    test("formula: temperature formula is provided", function () {
      var lines = UF.engine.getFormula("temperature", "c", "f");
      assert(lines.length > 0 && lines[0].indexOf("\u00b0F") > -1, "temperature formula");
    });

    test("formula: linear ratio is provided", function () {
      var lines = UF.engine.getFormula("length", "m", "km");
      assert(lines[0] === "1 Meter = 0.001 Kilometer", "linear formula, got " + lines[0]);
    });

    test("search: finds mile variants", function () {
      var results = UF.search.query("mile", 8);
      var labels = results.map(function (item) { return item.label; });
      assert(labels.indexOf("Mile") > -1, "Mile should be found");
      assert(labels.indexOf("Mile/Hour") > -1, "Mile/Hour should be found");
      assert(labels.indexOf("Nautical Mile") > -1, "Nautical Mile should be found");
      assert(labels[0] === "Mile", "Mile should rank first, got " + labels[0]);
    });

    test("search: matches symbols", function () {
      var results = UF.search.query("kmh", 8);
      assert(results.length > 0 && results[0].label === "Kilometer/Hour",
        "kmh should match Kilometer/Hour");
    });

    test("search: returns empty for unknown text", function () {
      assert(UF.search.query("zzzzzz", 8).length === 0, "unknown query returns nothing");
    });

    test("data: all categories define defaults", function () {
      UF.categories.forEach(function (category) {
        assert(category.defaults && category.defaults.length === 2,
          category.id + " needs two defaults");
        assert(UF.getUnit(category.id, category.defaults[0]), category.id + " default from");
        assert(UF.getUnit(category.id, category.defaults[1]), category.id + " default to");
      });
    });

    return tests;
  }

  UF.testSuite = testSuite;
})(typeof globalThis !== "undefined" ? globalThis : this);
