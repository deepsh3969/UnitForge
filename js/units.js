(function (global) {
  "use strict";

  var UF = (global.UF = global.UF || {});

  var CATEGORIES = [
    {
      id: "length",
      name: "Length",
      defaults: ["m", "km"],
      units: [
        { id: "mm", name: "Millimeter", symbol: "mm", factor: 0.001 },
        { id: "cm", name: "Centimeter", symbol: "cm", factor: 0.01 },
        { id: "m", name: "Meter", symbol: "m", factor: 1 },
        { id: "km", name: "Kilometer", symbol: "km", factor: 1000 },
        { id: "in", name: "Inch", symbol: "in", factor: 0.0254 },
        { id: "ft", name: "Foot", symbol: "ft", factor: 0.3048 },
        { id: "yd", name: "Yard", symbol: "yd", factor: 0.9144 },
        { id: "mi", name: "Mile", symbol: "mi", factor: 1609.344 },
        { id: "nmi", name: "Nautical Mile", symbol: "nmi", factor: 1852 }
      ]
    },
    {
      id: "mass",
      name: "Weight / Mass",
      defaults: ["kg", "lb"],
      units: [
        { id: "mg", name: "Milligram", symbol: "mg", factor: 0.001 },
        { id: "g", name: "Gram", symbol: "g", factor: 1 },
        { id: "kg", name: "Kilogram", symbol: "kg", factor: 1000 },
        { id: "t", name: "Metric Ton", symbol: "t", factor: 1000000 },
        { id: "oz", name: "Ounce", symbol: "oz", factor: 28.349523125 },
        { id: "lb", name: "Pound", symbol: "lb", factor: 453.59237 },
        { id: "st", name: "Stone", symbol: "st", factor: 6350.29318 }
      ]
    },
    {
      id: "temperature",
      name: "Temperature",
      defaults: ["c", "f"],
      special: true,
      units: [
        { id: "c", name: "Celsius", symbol: "°C" },
        { id: "f", name: "Fahrenheit", symbol: "°F" },
        { id: "k", name: "Kelvin", symbol: "K" }
      ]
    },
    {
      id: "area",
      name: "Area",
      defaults: ["m2", "ft2"],
      units: [
        { id: "mm2", name: "Square Millimeter", symbol: "mm²", factor: 0.000001 },
        { id: "cm2", name: "Square Centimeter", symbol: "cm²", factor: 0.0001 },
        { id: "m2", name: "Square Meter", symbol: "m²", factor: 1 },
        { id: "km2", name: "Square Kilometer", symbol: "km²", factor: 1000000 },
        { id: "in2", name: "Square Inch", symbol: "in²", factor: 0.00064516 },
        { id: "ft2", name: "Square Foot", symbol: "ft²", factor: 0.09290304 },
        { id: "acre", name: "Acre", symbol: "ac", factor: 4046.8564224 },
        { id: "ha", name: "Hectare", symbol: "ha", factor: 10000 }
      ]
    },
    {
      id: "volume",
      name: "Volume",
      defaults: ["l", "gal"],
      units: [
        { id: "ml", name: "Milliliter", symbol: "mL", factor: 0.001 },
        { id: "l", name: "Liter", symbol: "L", factor: 1 },
        { id: "m3", name: "Cubic Meter", symbol: "m³", factor: 1000 },
        { id: "cm3", name: "Cubic Centimeter", symbol: "cm³", factor: 0.001 },
        { id: "gal", name: "Gallon (US)", symbol: "gal", factor: 3.785411784 },
        { id: "qt", name: "Quart (US)", symbol: "qt", factor: 0.946352946 },
        { id: "pt", name: "Pint (US)", symbol: "pt", factor: 0.473176473 },
        { id: "cup", name: "Cup (US)", symbol: "cup", factor: 0.2365882365 }
      ]
    },
    {
      id: "speed",
      name: "Speed",
      defaults: ["kph", "mph"],
      units: [
        { id: "mps", name: "Meter/Second", symbol: "m/s", factor: 1 },
        { id: "kph", name: "Kilometer/Hour", symbol: "km/h", factor: 0.2777777777777778 },
        { id: "mph", name: "Mile/Hour", symbol: "mph", factor: 0.44704 },
        { id: "fps", name: "Foot/Second", symbol: "ft/s", factor: 0.3048 },
        { id: "kt", name: "Knot", symbol: "kn", factor: 0.5144444444444445 }
      ]
    },
    {
      id: "time",
      name: "Time",
      defaults: ["h", "min"],
      units: [
        { id: "ms", name: "Millisecond", symbol: "ms", factor: 0.001 },
        { id: "s", name: "Second", symbol: "s", factor: 1 },
        { id: "min", name: "Minute", symbol: "min", factor: 60 },
        { id: "h", name: "Hour", symbol: "h", factor: 3600 },
        { id: "day", name: "Day", symbol: "d", factor: 86400 },
        { id: "week", name: "Week", symbol: "wk", factor: 604800 },
        { id: "month", name: "Month", symbol: "mo", factor: 2629800 },
        { id: "year", name: "Year", symbol: "yr", factor: 31557600 }
      ]
    },
    {
      id: "digital",
      name: "Digital Storage",
      defaults: ["gb", "mb"],
      units: [
        { id: "bit", name: "Bit", symbol: "bit", factor: 0.125 },
        { id: "b", name: "Byte", symbol: "B", factor: 1 },
        { id: "kb", name: "Kilobyte", symbol: "KB", factor: 1000 },
        { id: "mb", name: "Megabyte", symbol: "MB", factor: 1000000 },
        { id: "gb", name: "Gigabyte", symbol: "GB", factor: 1000000000 },
        { id: "tb", name: "Terabyte", symbol: "TB", factor: 1000000000000 }
      ]
    },
    {
      id: "pressure",
      name: "Pressure",
      defaults: ["bar", "psi"],
      units: [
        { id: "pa", name: "Pascal", symbol: "Pa", factor: 1 },
        { id: "kpa", name: "Kilopascal", symbol: "kPa", factor: 1000 },
        { id: "bar", name: "Bar", symbol: "bar", factor: 100000 },
        { id: "atm", name: "Atmosphere", symbol: "atm", factor: 101325 },
        { id: "psi", name: "PSI", symbol: "psi", factor: 6894.757293168 },
        { id: "mmhg", name: "mmHg", symbol: "mmHg", factor: 133.322387415 }
      ]
    },
    {
      id: "energy",
      name: "Energy",
      defaults: ["kj", "cal"],
      units: [
        { id: "j", name: "Joule", symbol: "J", factor: 1 },
        { id: "kj", name: "Kilojoule", symbol: "kJ", factor: 1000 },
        { id: "cal", name: "Calorie", symbol: "cal", factor: 4.184 },
        { id: "kcal", name: "Kilocalorie", symbol: "kcal", factor: 4184 },
        { id: "wh", name: "Watt-hour", symbol: "Wh", factor: 3600 },
        { id: "kwh", name: "Kilowatt-hour", symbol: "kWh", factor: 3600000 }
      ]
    },
    {
      id: "power",
      name: "Power",
      defaults: ["kw", "hp"],
      units: [
        { id: "w", name: "Watt", symbol: "W", factor: 1 },
        { id: "kw", name: "Kilowatt", symbol: "kW", factor: 1000 },
        { id: "mw", name: "Megawatt", symbol: "MW", factor: 1000000 },
        { id: "hp", name: "Horsepower", symbol: "hp", factor: 745.6998715822702 }
      ]
    },
    {
      id: "angle",
      name: "Angle",
      defaults: ["deg", "rad"],
      units: [
        { id: "deg", name: "Degree", symbol: "°", factor: 1 },
        { id: "rad", name: "Radian", symbol: "rad", factor: 57.29577951308232 },
        { id: "grad", name: "Gradian", symbol: "grad", factor: 0.9 }
      ]
    }
  ];

  var byId = Object.create(null);

  CATEGORIES.forEach(function (category) {
    byId[category.id] = category;
    category.units.forEach(function (unit) {
      unit.category = category.id;
    });
  });

  UF.categories = CATEGORIES;

  UF.getCategory = function (categoryId) {
    return byId[categoryId] || null;
  };

  UF.getUnit = function (categoryId, unitId) {
    var category = byId[categoryId];
    if (!category) return null;
    for (var i = 0; i < category.units.length; i += 1) {
      if (category.units[i].id === unitId) return category.units[i];
    }
    return null;
  };

  UF.getUnits = function (categoryId) {
    var category = byId[categoryId];
    return category ? category.units : [];
  };

  UF.getDefaultPair = function (categoryId) {
    var category = byId[categoryId];
    if (!category) return null;
    return { from: category.defaults[0], to: category.defaults[1] };
  };
})(typeof globalThis !== "undefined" ? globalThis : this);
