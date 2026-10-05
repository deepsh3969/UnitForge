(function (global) {
  "use strict";

  var UF = (global.UF = global.UF || {});

  var TO_CELSIUS = {
    c: function (value) { return value; },
    f: function (value) { return (value - 32) * 5 / 9; },
    k: function (value) { return value - 273.15; }
  };

  var FROM_CELSIUS = {
    c: function (value) { return value; },
    f: function (value) { return value * 9 / 5 + 32; },
    k: function (value) { return value + 273.15; }
  };

  var TEMPERATURE_FORMULAS = {
    "c>f": ["°F = (°C × 9/5) + 32"],
    "f>c": ["°C = (°F − 32) × 5/9"],
    "c>k": ["K = °C + 273.15"],
    "k>c": ["°C = K − 273.15"],
    "f>k": ["K = ((°F − 32) × 5/9) + 273.15"],
    "k>f": ["°F = ((K − 273.15) × 9/5) + 32"],
    "c>c": ["Values are identical in both units."],
    "f>f": ["Values are identical in both units."],
    "k>k": ["Values are identical in both units."]
  };

  function failure(categoryId, fromUnitId, toUnitId, error) {
    return {
      ok: false,
      error: error,
      category: categoryId,
      fromUnit: fromUnitId,
      toUnit: toUnitId
    };
  }

  function convert(value, categoryId, fromUnitId, toUnitId, options) {
    var precision = options && options.precision !== undefined ? options.precision : "auto";

    var category = UF.getCategory(categoryId);
    if (!category) return failure(categoryId, fromUnitId, toUnitId, "Unsupported category.");

    var from = UF.getUnit(categoryId, fromUnitId);
    var to = UF.getUnit(categoryId, toUnitId);
    if (!from || !to) return failure(categoryId, fromUnitId, toUnitId, "Unsupported unit selection.");

    if (typeof value !== "number" || Number.isNaN(value)) {
      return failure(categoryId, fromUnitId, toUnitId, "Enter a valid number.");
    }
    if (!Number.isFinite(value)) {
      return failure(categoryId, fromUnitId, toUnitId, "That value is too large to convert.");
    }

    var result;
    if (category.special && category.id === "temperature") {
      if (!TO_CELSIUS[from.id] || !FROM_CELSIUS[to.id]) {
        return failure(categoryId, fromUnitId, toUnitId, "Unsupported temperature unit.");
      }
      result = FROM_CELSIUS[to.id](TO_CELSIUS[from.id](value));
    } else {
      if (typeof from.factor !== "number" || typeof to.factor !== "number") {
        return failure(categoryId, fromUnitId, toUnitId, "Conversion factor unavailable.");
      }
      result = value * from.factor / to.factor;
    }

    if (!Number.isFinite(result)) {
      return failure(categoryId, fromUnitId, toUnitId, "The result is out of range.");
    }

    return {
      ok: true,
      value: result,
      formattedValue: UF.utils.formatNumber(result, precision),
      category: category.id,
      categoryName: category.name,
      fromUnit: from.id,
      toUnit: to.id,
      fromName: from.name,
      toName: to.name,
      fromSymbol: from.symbol,
      toSymbol: to.symbol
    };
  }

  function getFormula(categoryId, fromUnitId, toUnitId, precision) {
    var category = UF.getCategory(categoryId);
    var from = UF.getUnit(categoryId, fromUnitId);
    var to = UF.getUnit(categoryId, toUnitId);
    if (!category || !from || !to) return ["Conversion unavailable."];

    if (category.id === "temperature") {
      var key = from.id + ">" + to.id;
      var lines = (TEMPERATURE_FORMULAS[key] || []).slice();
      if (from.id !== to.id) {
        lines.push("Conversion is calculated through Celsius, the base unit.");
      }
      return lines;
    }

    var ratio = from.factor / to.factor;
    return [
      "1 " + from.name + " = " + UF.utils.formatNumber(ratio, precision || "auto") + " " + to.name,
      from.name + " → " + to.name + ": value × " + UF.utils.formatNumber(ratio, precision || "auto")
    ];
  }

  function describeUnit(categoryId, unitId) {
    var unit = UF.getUnit(categoryId, unitId);
    return unit ? unit.name + " (" + unit.symbol + ")" : "Unknown unit";
  }

  UF.engine = {
    convert: convert,
    getFormula: getFormula,
    describeUnit: describeUnit
  };
})(typeof globalThis !== "undefined" ? globalThis : this);
