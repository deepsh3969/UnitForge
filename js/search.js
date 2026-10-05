(function (global) {
  "use strict";

  var UF = (global.UF = global.UF || {});

  var index = null;

  function build() {
    index = [];
    UF.categories.forEach(function (category) {
      index.push({
        kind: "category",
        label: category.name,
        detail: category.units.length + " units",
        categoryId: category.id,
        unitId: null,
        haystack: (category.name + " category").toLowerCase()
      });

      category.units.forEach(function (unit) {
        index.push({
          kind: "unit",
          label: unit.name,
          detail: category.name + " · " + unit.symbol,
          categoryId: category.id,
          unitId: unit.id,
          haystack: (unit.name + " " + unit.symbol + " " + category.name).toLowerCase(),
          name: unit.name.toLowerCase(),
          symbol: unit.symbol.toLowerCase(),
          compact: (unit.name + unit.symbol).toLowerCase().replace(/[^a-z0-9]/g, "")
        });
      });
    });
    return index;
  }

  function scoreEntry(entry, query, compactQuery) {
    if (entry.kind === "unit") {
      if (entry.name === query || entry.symbol === query) return 0;
      if (entry.name.indexOf(query) === 0) return 1;
      if (entry.symbol.indexOf(query) === 0) return 2;
      var wordIndex = entry.name.indexOf(" " + query);
      if (wordIndex > -1) return 3 + Math.min(wordIndex, 40) * 0.01;
      if (entry.haystack.indexOf(query) > -1) return 6;
      if (compactQuery && entry.compact.indexOf(compactQuery) > -1) return 6.5;
      return -1;
    }

    var label = entry.label.toLowerCase();
    if (label.indexOf(query) === 0) return 4;
    if (label.indexOf(query) > -1) return 5;
    if (entry.haystack.indexOf(query) > -1) return 8;
    return -1;
  }

  function query(text, limit) {
    if (!index) build();
    var search = String(text || "").trim().toLowerCase();
    if (!search) return [];

    var compactQuery = search.replace(/[^a-z0-9]/g, "");
    var max = limit || 8;
    var matches = [];

    for (var i = 0; i < index.length; i += 1) {
      var score = scoreEntry(index[i], search, compactQuery);
      if (score >= 0) {
        matches.push({ entry: index[i], score: score });
      }
    }

    matches.sort(function (a, b) {
      if (a.score !== b.score) return a.score - b.score;
      if (a.entry.label.length !== b.entry.label.length) {
        return a.entry.label.length - b.entry.label.length;
      }
      return a.entry.label.localeCompare(b.entry.label);
    });

    return matches.slice(0, max).map(function (match) {
      return match.entry;
    });
  }

  UF.search = {
    build: build,
    query: query
  };
})(typeof globalThis !== "undefined" ? globalThis : this);
