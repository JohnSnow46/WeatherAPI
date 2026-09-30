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
| 9 | **Extended forecast range picker** — Open-Meteo's daily endpoint supports up to 16 days; `ForecastPanel` currently renders a fixed short window with no way to ask for more | Yes — same `/api/weather/forecast` contract, just a `days` param already threaded through the backend; add a picker (3/7/14 days) in the UI | Small: one control + passing the value through the existing query hook | Not started |
| 10 | **Richer location comparison** — `FavoritesComparisonGrid` (item 2) currently shows only current conditions side by side; extend each column with its air-quality index (`AirQualityPanel`'s data) and active-alert status (`weatherAlerts.ts`) so the grid answers "which of my saved spots is best right now" in one glance | Yes — reuses the same three endpoints already called elsewhere, no new backend contract | Small-medium: mostly frontend composition, minor grid layout rework | Not started |
| 11 | **Render cold-start awareness banner** — §8 of `CLAUDE.md` flags the free-tier 30-60s cold start as a known rough edge for reviewers, but today a cold start just looks like a slow/stuck loading spinner with no explanation | Yes — purely a frontend UX concern (a timeout-based "waking up the backend…" message once a request has been pending past a threshold, e.g. 5s) | Small: one loading-state variant, no new dependency | Not started |
| 12 | **Shareable snapshot export** — export the current conditions card (or a saved comparison) as a PNG image a user can save/share, useful for a portfolio demo screenshot too | Yes — frontend-only (e.g. `html-to-image`/`dom-to-image`), no backend change | Small-medium: one new small dependency + an export button | Not started |
| 13 | **Foreground severe-weather notifications** — upgrade the existing threshold-based `WeatherAlertBanner` (item 4) to also fire a browser `Notification` while the tab is open but unfocused, not just an in-page banner | Yes, **if scoped to foreground/open-tab only** (the `Notification` API needs no account or server) — a "notify me even after I close the tab" variant would need push subscriptions persisted server-side, which breaks "no database"; explicitly out of scope here | Medium: permission-request flow + an interval/visibility-change check while the tab is open | Not started |
| 14 | **Map layer legend** — the map already renders 5 proxied tile layers (RainViewer radar + 4 OpenWeatherMap layers) but has no on-map legend explaining what the colors mean; likely the single highest-value polish item for a recruiter clicking through the map | Yes — static/derived UI, no backend change (OpenWeatherMap publishes documented color scales per layer) | Small: one legend component keyed to the active layer | Not started |
| 15 | **Batched comparison endpoint** — item 2's original entry already flagged this: the comparison grid (and now item 10) fire one `/api/weather/current` call per saved location; fine at today's 2-4 location scale, but worth a single `POST /api/weather/current/batch` if that list ever grows or to cut round-trips | Yes — same aggregator pattern, just accepting multiple coordinate pairs in one request | Medium: new endpoint + cache-key handling for a batch, frontend switch-over | Not started, only worth doing if #10 makes the N-call pattern a real cost |

**Not planned, deliberately (still applies):** user accounts/login, a real
database, or SignalR — see `CLAUDE.md` §1. Item 13's "closed tab" variant and
item 7's option (b) are the concrete cases above that would need that
decision revisited, not just implemented as a side effect.
