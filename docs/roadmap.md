# Roadmap — potential post-MVP extensions

Every item in `CLAUDE.md` §4 "Key features" is done. This file tracks concrete,
scoped ideas for what could come next — not commitments, just a grounded backlog.
Each entry notes whether it fits the current "no login, no database" architecture
(§1) or would require a deliberate scope change (a new ADR-style decision, not
something to slip in as a side effect of an unrelated task).

| # | Feature | Fits current architecture? | Rough scope |
|---|---|---|---|
| 1 | **Favorite locations list** — save a small set of named locations (not just the single "last location") in `localStorage`, with a quick-switch dropdown | Yes — same storage mechanism as today, just a list instead of one entry | Small: frontend-only, one new component + localStorage schema bump |
| 2 | **Multi-location comparison view** — side-by-side current conditions for 2-4 saved locations at once | Yes — reuses existing `/api/weather/current` per location, no new backend contract | Medium: frontend layout work; backend already supports N independent calls, could add a batched endpoint later if N grows |
| 3 | **Unit toggle (metric/imperial)** — °C/°F, km/h/mph, mm/in, persisted in `localStorage` | Yes — presentation-only; backend keeps returning metric, frontend converts at render time | Small: one conversion util + a toggle in settings/header |
| 4 | **Severe weather alerts** — surface Open-Meteo's alert/warning data (where available) or a threshold-based client-side flag (e.g. wind > X, precipitation > Y) on the current-conditions view | Yes if using Open-Meteo's own alert fields; a custom threshold engine is also backend-free (pure derived data from the existing forecast response) | Medium: new DTO fields + a warning banner component |
| 5 | **Air quality layer** — Open-Meteo also exposes a free Air Quality API (PM2.5/PM10/AQI); would slot in next to the existing weather aggregation with the same client/cache/proxy pattern | Yes — same shape as the existing Open-Meteo integration, no new architecture | Medium: new `IAirQualityClient` + `Cached` decorator (mirrors `IWeatherClient`), new map layer or panel |
| 6 | **PWA / offline last-known forecast** — service worker caching the last successful API response so the app shows *something* (with a "stale data" notice) when offline or the backend is cold-starting (Render free tier spin-down, §8) | Yes — purely a frontend concern, no backend change | Medium: Next.js PWA setup + cache-then-network strategy for the forecast fetch |
| 7 | **Historical trends (e.g. "last 7 days")** — a small sparkline of recent temperature/precipitation for the selected location | **Breaks §1's "no database" decision** — Open-Meteo's free forecast API doesn't retain history server-side per arbitrary location, so this needs either (a) a new call to Open-Meteo's separate *historical/archive* API (still no DB needed, just another proxied client — cheaper option), or (b) this app persisting samples itself (needs a DB — the expensive option). Do (a) first; only consider (b) if archive-API coverage turns out insufficient | Medium (option a) / Large + explicit scope change (option b) |
| 8 | **Rate-limit-aware backpressure** — surface Open-Meteo's daily-call-limit risk (§9) proactively, e.g. a cache-hit-rate metric on `/health` or a soft warning when nearing the known daily ceiling | Yes — instrumentation on top of the existing `IMemoryCache` layer | Small: extend the existing health check rather than add new infrastructure |

**Not planned, deliberately:** user accounts/login, a real database, or SignalR —
all explicitly out of scope per `CLAUDE.md` §1. Any of these would need that
decision revisited first, not just a task that happens to need one of them.
