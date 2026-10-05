(function (global) {
  "use strict";

  var UF = (global.UF = global.UF || {});

  var SUP_MAP = {
    "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴",
    "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹",
    "-": "⁻", "+": "+", ".": "·"
  };

  function toSuperscript(text) {
    return String(text)
      .split("")
      .map(function (ch) {
        return SUP_MAP[ch] || ch;
      })
      .join("");
  }

  function trimZeros(text) {
    if (text.indexOf(".") === -1) return text;
    return text.replace(/0+$/, "").replace(/\.$/, "");
  }

  function groupDigits(text) {
    var negative = text.charAt(0) === "-";
    var body = negative ? text.slice(1) : text;
    var parts = body.split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return (negative ? "-" : "") + parts.join(".");
  }

  function toScientific(value, significant) {
    var digits = Math.max(1, significant || 6);
    var exponent = Math.floor(Math.log10(Math.abs(value)));
    var mantissa = value / Math.pow(10, exponent);
    mantissa = Number(mantissa.toPrecision(digits));
    if (Math.abs(mantissa) >= 10) {
      mantissa = mantissa / 10;
      exponent += 1;
    }
    var mantissaText = trimZeros(Number(mantissa.toFixed(digits)).toString());
    if (mantissaText === "-0") mantissaText = "0";
    return mantissaText + " × 10" + toSuperscript(String(exponent));
  }

  function formatNumber(value, precision) {
    if (typeof value !== "number" || Number.isNaN(value)) return "—";
    if (!Number.isFinite(value)) return "—";
    if (value === 0) return "0";

    var fixed = precision !== undefined && precision !== null && precision !== "auto"
      ? Number(precision)
      : NaN;

    if (!Number.isNaN(fixed) && fixed >= 0) {
      return groupDigits(Number(value).toFixed(Math.min(fixed, 20)));
    }

    var cleaned = Number(value.toPrecision(12));
    if (cleaned === 0) return "0";

    var magnitude = Math.abs(cleaned);
    if (magnitude >= 1e15 || magnitude < 1e-7) {
      return toScientific(cleaned, 6);
    }

    var decimals = 11 - Math.floor(Math.log10(magnitude));
    decimals = Math.min(10, Math.max(0, decimals));
    var text = cleaned.toFixed(Math.min(decimals, 12));
    text = trimZeros(text);
    if (text === "-0") text = "0";
    return groupDigits(text);
  }

  function parseValue(raw) {
    var text = String(raw == null ? "" : raw).trim();
    text = text.replace(/,/g, "").replace(/\s+/g, "");

    if (text === "") return { ok: false, reason: "empty" };
    if (!/^[-+]?(\d+\.?\d*|\.\d+)([eE][-+]?\d+)?$/.test(text)) {
      return { ok: false, reason: "invalid" };
    }

    var value = Number(text);
    if (Number.isNaN(value)) return { ok: false, reason: "invalid" };
    if (!Number.isFinite(value)) return { ok: false, reason: "range" };

    return { ok: true, value: value, raw: text };
  }

  function debounce(fn, wait) {
    var timer = null;
    return function () {
      var args = arguments;
      var self = this;
      if (timer) clearTimeout(timer);
      timer = setTimeout(function () {
        timer = null;
        fn.apply(self, args);
      }, wait);
    };
  }

  function formatTime(date) {
    try {
      return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    } catch (err) {
      return date.getHours() + ":" + String(date.getMinutes()).padStart(2, "0");
    }
  }

  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (key) {
        if (key === "text") {
          node.textContent = attrs[key];
        } else if (attrs[key] !== undefined && attrs[key] !== null) {
          node.setAttribute(key, attrs[key]);
        }
      });
    }
    (children || []).forEach(function (child) {
      if (child) node.appendChild(child);
    });
    return node;
  }

  var audioContext = null;

  function playTone(frequency, duration) {
    try {
      var AudioCtx = global.AudioContext || global.webkitAudioContext;
      if (!AudioCtx) return;
      if (!audioContext) audioContext = new AudioCtx();
      if (audioContext.state === "suspended") audioContext.resume();
      var oscillator = audioContext.createOscillator();
      var gain = audioContext.createGain();
      oscillator.type = "sine";
      oscillator.frequency.value = frequency || 620;
      gain.gain.setValueAtTime(0.0001, audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.06, audioContext.currentTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + (duration || 0.09));
      oscillator.connect(gain);
      gain.connect(audioContext.destination);
      oscillator.start();
      oscillator.stop(audioContext.currentTime + (duration || 0.09) + 0.02);
    } catch (err) {
      /* audio is optional */
    }
  }

  UF.utils = {
    formatNumber: formatNumber,
    parseValue: parseValue,
    toSuperscript: toSuperscript,
    groupDigits: groupDigits,
    debounce: debounce,
    formatTime: formatTime,
    el: el,
    playTone: playTone
  };
})(typeof globalThis !== "undefined" ? globalThis : this);
