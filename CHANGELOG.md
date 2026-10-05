# Changelog

All notable changes to UnitForge are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-10-05

### Added

- Multi-category conversion engine covering 12 categories and 73 units:
  Length, Weight / Mass, Temperature, Area, Volume, Speed, Time,
  Digital Storage, Pressure, Energy, Power and Angle.
- `UF.engine.convert()` and `UF.engine.getFormula()` public API with typed
  error results for invalid values, unknown units and category mismatches.
- Temperature handled with explicit to-Celsius / from-Celsius offset maps
  (Celsius, Fahrenheit, Kelvin).
- Global unit search with fuzzy scoring, symbol matching, compact queries
  (for example `kmh` finds *Kilometer/Hour*), arrow-key navigation and
  Enter to activate.
- Favorites (star any conversion pair) and recent conversions, both
  persisted in `localStorage`.
- Conversion history panel with the last 50 conversions and a clear action.
- Popular conversions quick-pick grid with 8 presets.
- Light, dark and system themes with `theme-color` meta syncing and
  CSS-driven `prefers-color-scheme` fallback when no explicit choice is set.
- Settings panel: theme, decimal precision (auto / 2 / 4 / 6 / 8),
  animations toggle, sound feedback toggle.
- Keyboard shortcuts: `/` search, `S` swap, `C` focus value, `H` history,
  `Esc` close — disabled while typing in form controls.
- Copy result button with toast confirmation, inline formula breakdown and
  swap that exchanges units only (value is preserved).
- Responsive layout from 360px to wide desktop, collapsible sidebar and
  mobile search overlay.
- Accessibility: skip link, labelled controls, `aria-live` result region,
  focus management for dialogs, visible focus rings, reduced-motion support.
- Test suite: 77 engine/unit/search/storage tests (`tests/suite.js`) that
  run in Node and in the browser, plus a 51-step UI smoke harness
  (`tests/smoke.js`) covering interactions and console cleanliness.
- Documentation: README, screenshots, MIT license, changelog and roadmap.
