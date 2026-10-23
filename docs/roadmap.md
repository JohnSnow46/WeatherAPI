# Roadmap — potential post-MVP extensions

Every item in `CLAUDE.md` §4 "Key features" is done. This file tracks concrete,
scoped ideas for what could come next — not commitments, just a grounded backlog.
Each entry notes whether it fits the current "no login, no database" architecture
(§1) or would require a deliberate scope change (a new ADR-style decision, not
something to slip in as a side effect of an unrelated task).

| # | Feature | Fits current architecture? | Rough scope | Status |
|---|---|---|---|---|
| 1 | **Favorite locations list** — save a small set of named locations (not just the single "last location") in `localStorage`, with a quick-switch dropdown | Yes — same storage mechanism as today, just a list instead of one entry | Small: frontend-only, one new component + localStorage schema bump | ✅ Done (`useFavoriteLocations`, `FavoriteLocations`) |
| 2 | **Multi-location comparison view** — side-by-side current conditions for 2-4 saved locations at once | Yes — reuses existing `/api/weather/current` per location, no new backend contract | Medium: frontend layout work; backend already supports N independent calls, could add a batched endpoint later if N grows | ✅ Done (`FavoritesComparisonGrid`, shown once 2+ favorites are saved) |
| 3 | **Unit toggle (metric/imperial)** — °C/°F, km/h/mph, mm/in, persisted in `localStorage` | Yes — presentation-only; backend keeps returning metric, frontend converts at render time | Small: one conversion util + a toggle in settings/header | ✅ Done (`useUnitPreference`, `lib/units.ts`) |
| 4 | **Severe weather alerts** — surface Open-Meteo's alert/warning data (where available) or a threshold-based client-side flag (e.g. wind > X, precipitation > Y) on the current-conditions view | Yes if using Open-Meteo's own alert fields; a custom threshold engine is also backend-free (pure derived data from the existing forecast response) | Medium: new DTO fields + a warning banner component | ✅ Done, threshold-flag option (`lib/weatherAlerts.ts`, `WeatherAlertBanner`) — Open-Meteo's own alert fields still not integrated |
| 5 | **Air quality layer** — Open-Meteo also exposes a free Air Quality API (PM2.5/PM10/AQI); would slot in next to the existing weather aggregation with the same client/cache/proxy pattern | Yes — same shape as the existing Open-Meteo integration, no new architecture | Medium: new `IAirQualityClient` + `Cached` decorator (mirrors `IWeatherClient`), new map layer or panel | ✅ Done (`IAirQualityClient`/`OpenMeteoAirQualityClient`/`CachedAirQualityClient`, `GET /api/weather/air-quality`, `AirQualityPanel`) — panel, not a map layer (Open-Meteo's Air Quality API is point data, not tiles) |
| 6 | **PWA / offline last-known forecast** — service worker caching the last successful API response so the app shows *something* (with a "stale data" notice) when offline or the backend is cold-starting (Render free tier spin-down, §8) | Yes — purely a frontend concern, no backend change | Medium: Next.js PWA setup + cache-then-network strategy for the forecast fetch | ✅ Done, localStorage-cache variant (`useOfflineFallback`, `StaleDataBanner`) rather than a full service worker — see note below |
| 7 | **Historical trends (e.g. "last 7 days")** — a small sparkline of recent temperature/precipitation for the selected location | **Breaks §1's "no database" decision** — Open-Meteo's free forecast API doesn't retain history server-side per arbitrary location, so this needs either (a) a new call to Open-Meteo's separate *historical/archive* API (still no DB needed, just another proxied client — cheaper option), or (b) this app persisting samples itself (needs a DB — the expensive option). Do (a) first; only consider (b) if archive-API coverage turns out insufficient | Medium (option a) / Large + explicit scope change (option b) | Not started — needs explicit scope-change sign-off first |
| 8 | **Rate-limit-aware backpressure** — surface Open-Meteo's daily-call-limit risk (§9) proactively, e.g. a cache-hit-rate metric on `/health` or a soft warning when nearing the known daily ceiling | Yes — instrumentation on top of the existing `IMemoryCache` layer | Small: extend the existing health check rather than add new infrastructure | ✅ Done (`CacheMetrics`, `CacheHealthCheck`) |

**Not planned, deliberately:** user accounts/login, a real database, or SignalR —
all explicitly out of scope per `CLAUDE.md` §1. Any of these would need that
decision revisited first, not just a task that happens to need one of them.

**Note on #6:** implemented as a `useOfflineFallback` hook that persists each
successful `current`/`forecast` query result to `localStorage` and serves the
last cached value (with a `StaleDataBanner`) only once the live query has
failed — same storage mechanism as favorites/units/last-location, no new
dependency (`next-pwa`, a manifest, a real service worker) or build-step
complexity. Trade-off: this doesn't make the *app shell* installable/offline
the way a real service worker would — only the forecast data itself survives
a network failure. Revisit with a real service worker only if "installable
PWA" becomes an actual goal, not just offline data resilience.

## Next steps (round 2)

Everything above is done except #7 (needs explicit sign-off). These are new,
grounded proposals for what comes after — each checked against the current
codebase (`frontend/src/components/`, `frontend/src/hooks/`, `src/`) so they
build on what actually exists rather than duplicate it.

| # | Feature | Fits current architecture? | Rough scope | Status |
|---|---|---|---|---|
| 9 | **Extended forecast range picker** — Open-Meteo's daily endpoint supports up to 16 days; `ForecastPanel` currently renders a fixed short window with no way to ask for more | Yes — same `/api/weather/forecast` contract, just a `days` param already threaded through the backend; add a picker (3/7/14 days) in the UI | Small: one control + passing the value through the existing query hook | ✅ Done (3/7/14-day picker in `ForecastPanel`) |
| 10 | **Richer location comparison** — `FavoritesComparisonGrid` (item 2) currently shows only current conditions side by side; extend each column with its air-quality index (`AirQualityPanel`'s data) and active-alert status (`weatherAlerts.ts`) so the grid answers "which of my saved spots is best right now" in one glance | Yes — reuses the same three endpoints already called elsewhere, no new backend contract | Small-medium: mostly frontend composition, minor grid layout rework | ✅ Done (each favorite tile shows AQI band and active-alert count, `FavoritesComparisonGrid`) |
| 11 | **Render cold-start awareness banner** — §8 of `CLAUDE.md` flags the free-tier 30-60s cold start as a known rough edge for reviewers, but today a cold start just looks like a slow/stuck loading spinner with no explanation | Yes — purely a frontend UX concern (a timeout-based "waking up the backend…" message once a request has been pending past a threshold, e.g. 5s) | Small: one loading-state variant, no new dependency | ✅ Done (useIsSlow, ColdStartNotice shown after 5 s in the current-weather and forecast loading states) |
| 12 | **Shareable snapshot export** — export the current conditions card (or a saved comparison) as a PNG image a user can save/share, useful for a portfolio demo screenshot too | Yes — frontend-only (e.g. `html-to-image`/`dom-to-image`), no backend change | Small-medium: one new small dependency + an export button | ✅ Done (`ExportSnapshotButton`, lazy-loaded `html-to-image`) on `CurrentWeatherCard`, and (2026-10-13) on `FavoritesComparisonGrid` too — the whole grid section is the capture target, one PNG per export instead of per-tile |
| 13 | **Foreground severe-weather notifications** — upgrade the existing threshold-based `WeatherAlertBanner` (item 4) to also fire a browser `Notification` while the tab is open but unfocused, not just an in-page banner | Yes, **if scoped to foreground/open-tab only** (the `Notification` API needs no account or server) — a "notify me even after I close the tab" variant would need push subscriptions persisted server-side, which breaks "no database"; explicitly out of scope here | Medium: permission-request flow + an interval/visibility-check while the tab is open | ✅ Done (`useNotificationPermission`, `useForegroundAlertNotifications`; a 60s background-kept-alive poll only runs once permission is granted) |
| 14 | **Map layer legend** — the map already renders 5 proxied tile layers (RainViewer radar + 4 OpenWeatherMap layers) but has no on-map legend explaining what the colors mean; likely the single highest-value polish item for a recruiter clicking through the map | Yes — static/derived UI, no backend change (OpenWeatherMap publishes documented color scales per layer) | Small: one legend component keyed to the active layer | ✅ Done (`MapLegend`, a Leaflet control portal; gradients from openweathermap.org/map_legend's published stops, radar legend illustrative) |
| 15 | **Batched comparison endpoint** — item 2's original entry already flagged this: the comparison grid (and now item 10) fire one `/api/weather/current` call per saved location; fine at today's 2-4 location scale, but worth a single `POST /api/weather/current/batch` if that list ever grows or to cut round-trips | Yes — same aggregator pattern, just accepting multiple coordinate pairs in one request | Medium: new endpoint + cache-key handling for a batch, frontend switch-over | 🟡 Backend done (`POST /api/weather/current/batch`, `GetCurrentWeatherBatchQuery`, up to 10 locations, each still going through `CachedWeatherClient` so per-location caching is unchanged). Frontend intentionally NOT switched over: `FavoriteConditionsTile`'s per-location `["current-weather", lat, lon]` query shares its cache with the main dashboard (`CurrentWeatherCard`) when a favorite is also the selected location — a single batched query would give that up for a request-count saving that isn't a real cost yet at 2-4 favorites. Revisit the frontend side if the favorites list grows enough that N round-trips actually matter. |

**Not planned, deliberately (still applies):** user accounts/login, a real
database, or SignalR — see `CLAUDE.md` §1. Item 13's "closed tab" variant and
item 7's option (b) are the concrete cases above that would need that
decision revisited, not just implemented as a side effect.

## Next steps (round 3, 2026-10-11)

| # | Feature | Fits current architecture? | Rough scope | Status |
|---|---|---|---|---|
| 16 | **`AirQualityPanel` missing the offline-fallback/cold-start treatment the other two panels have** — `CurrentWeatherCard` and `ForecastPanel` both use `useOfflineFallback`/`StaleDataBanner` (item #6) and `useIsSlow`/`ColdStartNotice` (item #11); `AirQualityPanel` never got either applied, so on a Render cold start or a flaky network it just spins or shows a bare error instead of the same "waking up the backend…" notice / last-known-data fallback the other two panels already give | Yes — pure UI consistency fix reusing existing hooks/components verbatim, no backend change | Small: wire up two already-existing hooks in one component | ✅ Done — same pattern as `CurrentWeatherCard`, cache key `"air-quality"` |
| 17 | **`FavoritesComparisonGrid`'s tiles have no offline fallback either** — same gap as item #16, one layer further out: `FavoriteConditionsTile` just shows "n/a" on error with nothing to fall back to, while every other weather display on this page (item #6) recovers to the last-known value | Yes — same `useOfflineFallback` hook, reusing the `"current"` cache kind/key `CurrentWeatherCard` already writes for the same location, so a favorite that's also the selected location shares one cache entry | Small: one hook call + a small "stale" indicator | ✅ Done — reuses the `"current"` cache entry; no `ColdStartNotice` here (the grid only renders once there are 2+ favorites with an already-settled dashboard, so a cold start is already visible on the main panels above it) |

**Not planned, deliberately (still applies):** user accounts/login, a real
database, or SignalR — see `CLAUDE.md` §1.

## Next steps (round 4, 2026-10-13)

| # | Feature | Fits current architecture? | Rough scope | Status |
|---|---|---|---|---|
| 18 | **`WeatherAlertBanner` missing the offline-fallback treatment too** — items #16/#17 closed this same gap on `AirQualityPanel` and `FavoritesComparisonGrid`; `WeatherAlertBanner` had the same bug: on a cold start or network blip, `current.data`/`forecast.data` go `undefined`, `evaluateWeatherAlerts` gets empty input, and an already-active severe-weather alert silently disappears instead of falling back to the last known state | Yes — same `useOfflineFallback` hook, reusing the `"current"`/`"forecast"` cache kinds/keys `CurrentWeatherCard`/`ForecastPanel` already write for the same location | Small: two hook calls, no new component | ✅ Done — `displayCurrent`/`displayForecast` feed `evaluateWeatherAlerts` instead of the raw query data |

**Not planned, deliberately (still applies):** user accounts/login, a real
database, or SignalR — see `CLAUDE.md` §1.

## Next steps (round 5, 2026-10-15)

| # | Feature | Fits current architecture? | Rough scope | Status |
|---|---|---|---|---|
| 19 | **`WeatherAlertBanner`'s alert text ignored the metric/imperial toggle (#3)** — `CurrentWeatherCard`/`ForecastPanel` already convert every displayed number through `lib/units.ts` when `unit === "imperial"`, but `evaluateWeatherAlerts` hardcoded "km/h"/"mm" in the alert message text regardless of the toggle, so a user who switched to °F/mph still saw "Strong wind right now: 64 km/h" | Yes — same `lib/units.ts` conversion helpers already used elsewhere, no new dependency | Small: thread a `unit` param through `evaluateWeatherAlerts` and its two callers (`WeatherAlertBanner`, `FavoritesComparisonGrid`'s per-tile alert count) | ✅ Done — alert messages now render in the active unit, same as every other number on the page |
| 20 | **`AirQualityPanel` was the only one of the three main panels without the PNG-export button (#12)** — `CurrentWeatherCard` and `FavoritesComparisonGrid` both got `ExportSnapshotButton`; `AirQualityPanel` never did despite being the same shape of card | Yes — same component, already lazy-loaded | Small: one `useRef` + one button, mirrors `CurrentWeatherCard` exactly | ✅ Done — `fileName="air-quality-<location>"` |

**Not planned, deliberately (still applies):** user accounts/login, a real
database, or SignalR — see `CLAUDE.md` §1.

## Next steps (round 6, 2026-10-16)

| # | Feature | Fits current architecture? | Rough scope | Status |
|---|---|---|---|---|
| 21 | **`ForecastPanel` was the last of the four main panels without the PNG-export button (#12)** — round 5 closed this gap on `AirQualityPanel`; `ForecastPanel` (hourly + daily forecast) was the one remaining panel that never got it | Yes — same component, already lazy-loaded | Small: one `useRef` + one button next to the "Next hours" heading | ✅ Done — `fileName="forecast-<location>"` |

**Not planned, deliberately (still applies):** user accounts/login, a real
database, or SignalR — see `CLAUDE.md` §1.

## Next steps (round 7, 2026-10-18)

| # | Feature | Fits current architecture? | Rough scope | Status |
|---|---|---|---|---|
| 22 | **`WeatherAlertBanner` never showed `StaleDataBanner` even though it already computes an offline fallback (#18)** — `CurrentWeatherCard`/`ForecastPanel`/`AirQualityPanel` all show `StaleDataBanner` when displaying cached data; `WeatherAlertBanner` computes `currentFallback`/`forecastFallback` (added round 4, item #18) but never rendered the banner, so an alert based on stale cached data gave no "might be outdated" signal the other three panels already give | Yes — same `StaleDataBanner` component, already imported elsewhere | Small: one conditional render, reusing an existing component | ✅ Done — shown alongside the alerts whenever either fallback is active |
| 23 | **`FavoritesComparisonGrid`'s AQI badge had no offline fallback, only its temperature side did (#17)** — item #17 gave each tile's temperature/icon the `"current"` cache fallback, but the same tile's AQI badge (`describeEuropeanAqi(airQuality.data...)`) read `airQuality.data` directly — a cold start or network blip made the AQI badge just disappear instead of falling back to the last known value like everything else in the tile | Yes — same `"air-quality"` cache kind `AirQualityPanel` already writes for the same location | Small: one more `useOfflineFallback` call, same pattern as the temperature side | ✅ Done — `displayAirQuality` feeds the badge instead of the raw query data |
| 24 | **`FavoritesComparisonGrid`'s per-tile alert count had the exact bug item #18 fixed on `WeatherAlertBanner`** — `evaluateWeatherAlerts` was called with the raw `data`/`forecast.data` instead of the fallback-aware `displayData`/`displayForecast`, so a tile's "⚠ N active alerts" badge silently disappeared on a cold start/network blip instead of falling back like the rest of the tile already does | Yes — same `"forecast"` cache kind `ForecastPanel` already writes for the same location | Small: one more `useOfflineFallback` call + swap two call args | ✅ Done — `evaluateWeatherAlerts(displayData, displayForecast?.hourly ?? [], unit)` |

**Not planned, deliberately (still applies):** user accounts/login, a real
database, or SignalR — see `CLAUDE.md` §1.

## Next steps (round 8, 2026-10-19)

| # | Feature | Fits current architecture? | Rough scope | Status |
|---|---|---|---|---|
| 25 | **`MapLegend` ignored the metric/imperial toggle (#3, #14)** — item #19 closed this gap on alert messages; the map legend was the last place still hardcoding units: its Temperature scale always read °C and its Wind scale m/s, so a user on °F/mph saw every panel in imperial except the map right below them | Yes — same `lib/units.ts` helpers; stops stay in OWM's own units (they position the gradient), only the tick labels convert | Small: thread `unit` through `WeatherDashboard` → `WeatherMap` → `MapLegend`, per-entry `formatValue` | ✅ Done — imperial shows °F and mph labels; metric keeps OWM's published °C/m/s scale |

**Not planned, deliberately (still applies):** user accounts/login, a real
database, or SignalR — see `CLAUDE.md` §1.

## Next steps (round 9, 2026-10-20)

| # | Feature | Fits current architecture? | Rough scope | Status |
|---|---|---|---|---|
| 26 | **`LocationSearch`'s result dropdown was mouse-only** — a keyboard user could type a city name but had no way to pick a result: no arrow-key highlighting, Enter did nothing, Escape didn't close the list, and the dropdown carried no combobox/listbox semantics for screen readers | Yes — local component state only, no new dependency | Small: `activeIndex` state + `onKeyDown` handler, `role="combobox"`/`listbox`/`option` + `aria-activedescendant` | ✅ Done — ↑/↓ wrap through results, Enter selects, Esc closes; mouse hover keeps the highlight in sync |

**Not planned, deliberately (still applies):** user accounts/login, a real
database, or SignalR — see `CLAUDE.md` §1.

## Next steps (round 10, 2026-10-21)

| # | Feature | Fits current architecture? | Rough scope | Status |
|---|---|---|---|---|
| 27 | **`CurrentWeatherCard` never showed the wind direction** — `CurrentWeatherDto.windDirectionDeg` has been on the API response since the start, but the Wind tile only rendered the speed, so "18 km/h" didn't say whether it's a headwind on the way home | Yes — field already fetched, no backend change | Small: new `lib/wind.ts` `compassDirection` (8-point, meteorological "from" convention) appended to the Wind tile | ✅ Done — e.g. "18 km/h NW" |
| 28 | **`ForecastPanel`'s daily cards never showed the precipitation total** — same "fetched but never rendered" gap as #27: `DailyForecastPointDto.precipitationSumMm` is on every daily point, but each card only showed the icon and max/min temperature, which can't tell a passing shower from an all-day soak | Yes — field already fetched, same `lib/units.ts` precipitation helpers as `CurrentWeatherCard` | Small: one conditional line per daily card | ✅ Done — "💧 4.2 mm" (or inches) when the day's total is above zero |

**Not planned, deliberately (still applies):** user accounts/login, a real
database, or SignalR — see `CLAUDE.md` §1.

## Next steps (round 11, 2026-10-22)

| # | Feature | Fits current architecture? | Rough scope | Status |
|---|---|---|---|---|
| 29 | **`ForecastPanel`'s hourly chips never showed precipitation** — #28 added the daily total to the day cards; the hourly chips one section above still showed only icon + temperature, even though `HourlyForecastPointDto.precipitationMm` is on every point, so "which hour will it rain" was only guessable from the icon | Yes — field already fetched, same `lib/units.ts` helper | Small: one conditional line per hourly chip | ✅ Done — "💧 0.6" under the temperature when the hour's value is above zero |
| 30 | **`CurrentWeatherCard` never showed when the reading was taken** — `CurrentWeatherDto.time` (Open-Meteo's observation time, already in the location's own UTC offset) has always been on the response, but the card gave no hint whether "12°" was from five minutes or an hour ago | Yes — field already fetched; read `HH:MM` straight from the offset-qualified string, same approach `ForecastPanel.formatHour` uses | Small: one line under the condition label | ✅ Done — "Updated 14:15 local time" |

**Not planned, deliberately (still applies):** user accounts/login, a real
database, or SignalR — see `CLAUDE.md` §1.

## Next steps (round 12, 2026-10-23)

| # | Feature | Fits current architecture? | Rough scope | Status |
|---|---|---|---|---|
| 31 | **`AirQualityPanel` never showed the AQI number itself** — `europeanAqi` was only used to pick the "Good/Fair/Moderate..." label and color, but each band spans 20 points, so a 41 and a 59 looked identical | Yes — field already fetched | Small: one line under the label | ✅ Done — "European AQI 42" |

**Not planned, deliberately (still applies):** user accounts/login, a real
database, or SignalR — see `CLAUDE.md` §1.
