# CLAUDE.md — WeatherMap (working title)

## 1. Project goal

Portfolio project demonstrating backend + frontend: a REST API in .NET acting as an aggregator/proxy for external weather APIs, with data visualization on a map (precipitation, wind). No login, no database, and no SignalR — the project is deliberately lightweight on infrastructure, with the emphasis on data integration and visualization.

Target audience for this spec: recruiters/tech leads reviewing the repo — the code and README should clearly showcase architecture and design decisions.

## 2. Tech stack

**Backend**
- .NET 8/9, ASP.NET Core Web API
- Clean Architecture (Domain / Application / Infrastructure / API) — no persistence layer (no DB)
- `IMemoryCache` — caches responses from external APIs (limits call volume, TTL-based)
- xUnit + Moq (unit tests), possibly integration tests with `WebApplicationFactory`
- No EF Core, no auth/JWT — the backend is stateless (stateless proxy/aggregator)
- **Polly** — retry + circuit breaker on calls to Open-Meteo/RainViewer (a good, cheap way to showcase resiliency patterns)

**Frontend**
- Next.js (App Router) + TypeScript
- Map: **Leaflet** (via `react-leaflet`)
- Wind visualization: **OpenWeatherMap wind tile layer**, proxied through the backend — see section 9 for why this replaced the originally-planned `leaflet-velocity` point-grid approach
- Data fetching: **TanStack Query**
- Browser geolocation (Geolocation API) — opt-in via a "Use my location" button, not auto-requested on load (see section 9: an automatic permission prompt on entry read as pushy in testing)
- Defaults to Warsaw, Poland on first visit if nothing is stored yet
- Location search (fallback / change location)
- **localStorage** — remembers the last selected/searched location between visits (no backend, no account)

**Weather data sources**
- **Open-Meteo** — primary source (forecast, hourly data, wind, precipitation; no API key required), plus the Open-Meteo Geocoding API for the location search
- **RainViewer API** — free precipitation/storm radar tiles (Open-Meteo has no ready-made map tiles), used for the visual precipitation layer on the map, no API key required
- **OpenWeatherMap** — tile layer for the wind visualization (`wind_new`). Unlike Open-Meteo/RainViewer, this **requires a free API key** (openweathermap.org) — never committed, set via `dotnet user-secrets` locally or an environment variable in deployment

## 3. Backend architecture (Clean Architecture, no persistence)

```
src/
  WeatherMap.Domain/          # domain models (Location, WeatherSnapshot, ...), client interfaces
  WeatherMap.Application/     # use cases (CQRS/MediatR), DTOs, validation (FluentValidation)
  WeatherMap.Infrastructure/  # HTTP clients for Open-Meteo / RainViewer, IMemoryCache
  WeatherMap.Api/             # controllers, configuration, middleware
tests/
  WeatherMap.UnitTests/
  WeatherMap.IntegrationTests/
```

## 4. Key features

- [x] Geolocation via opt-in "Use my location" button (defaults to Warsaw on first visit instead of auto-prompting)
- [x] Location search (geocoding) as an alternative/way to change location
- [x] Remembering the last selected location in localStorage
- [x] Weather forecast (current + hourly + a few days)
- [x] Map layers: precipitation/storm (RainViewer radar) + wind (OpenWeatherMap tile layer)
- [x] Backend-side caching of external API responses (`IMemoryCache`, TTL)
- [x] Health checks (`/health`) for the API and its external dependencies

## 5. Example API endpoints

```
GET  /api/locations/search?query=Wroclaw
GET  /api/weather/current?lat=..&lon=..
GET  /api/weather/forecast?lat=..&lon=..
GET  /api/weather/radar-tiles                # RainViewer frame metadata (host + past/nowcast paths)
GET  /api/weather/wind-tiles/{z}/{x}/{y}      # OpenWeatherMap wind tile, proxied (hides the API key)
```

The backend here is primarily an **aggregator/proxy** — it normalizes responses from Open-Meteo, RainViewer and OpenWeatherMap into a single DTO contract, caches them, and hides provider details (including the OpenWeatherMap API key) from the frontend.

## 6. Working conventions with Claude Code

- Commits: Conventional Commits (`feat:`, `fix:`, `refactor:`, `test:`)
- Unit tests for the Application layer before/alongside implementation
- Don't commit API keys (RainViewer/Open-Meteo require no keys; OpenWeatherMap does — set it via `dotnet user-secrets` locally / an environment variable in deployment, never in `appsettings.json`)
- README with architecture, a data-flow diagram, and a demo GIF

## 7. Stages (suggested order)

0. **Repo setup**: two projects (backend/frontend) or a monorepo, CI (build + tests on push), `.gitignore`, README skeleton
1. **Backend skeleton**: Clean Architecture structure, health check, `HttpClient` configuration (with Polly) for Open-Meteo
2. **Open-Meteo integration**: geocoding + current/forecast, DTOs, cache, tests
3. **Frontend MVP**: Next.js, geolocation + search, forecast display (no map yet), CORS between Vercel and the backend
4. **localStorage**: remembering the last location
5. **Map — precipitation/storm**: Leaflet + radar layer (RainViewer)
6. **Map — wind**: OpenWeatherMap wind tile layer, proxied through the backend (see section 9)
7. **Polishing**: handling external API errors (what the frontend shows when Open-Meteo/RainViewer/OpenWeatherMap is down), README with demo GIF

## 8. Hosting (free options)

**Frontend (Next.js) → Vercel**
Built for Next.js by the same team behind the framework. Free Hobby plan: static hosting on a CDN, serverless functions, automatic deploy from Git + a preview URL for every PR. The natural choice, no alternatives worth considering for Next.js.

**Backend (.NET Web API) → Render (recommended) or Azure App Service (F1)**
- **Render, free tier**: no credit card required, deploy from a Dockerfile, 750h/month for one service. Downside: spins down after 15 min of inactivity, 30-60s cold start on the first request after a period of inactivity — acceptable for a portfolio, just worth mentioning in the README so a recruiter doesn't think the app is broken.
- **Azure App Service, F1 tier**: free forever, but stricter limits (60 min CPU/day, no "Always On", may shut down under heavier daytime traffic). Plus: "Azure" looks good on a CV/in a repo alongside .NET, if you want to highlight it.
- Also worth considering: Fly.io (free tier, but requires a credit card) and Railway (one-time credit only, not permanently free).

Suggested setup: Vercel (frontend) + Render (backend) — least friction to get started, no credit card, a single config file.

Practical note: since the frontend and backend live on different domains, the backend needs CORS configured for the Vercel domain (and `localhost` during development).

## 9. Technical risks / open questions

- **Wind vectors on the map — resolved.** The original plan (`leaflet-velocity` over a custom Open-Meteo point-grid, sampling many lat/lon pairs per visible bbox) was replaced with **OpenWeatherMap's `wind_new` tile layer**, proxied through the backend the same way RainViewer's radar is. This avoids building/caching a custom grid endpoint entirely — Leaflet requests whatever `{z}/{x}/{y}` tiles are visible and the backend proxies+caches each one, same pattern as any other tile layer. Trade-off: unlike Open-Meteo/RainViewer, OpenWeatherMap requires a free API key, which must stay server-side (the backend injects it; the frontend never sees it) and is not committed to the repo. A third option (embedding a Windy.com iframe widget) was considered and rejected — it would show a real map faster but wouldn't demonstrate any backend integration work, which is the point of this portfolio project.
- **Open-Meteo rate limit** — the free plan has a daily call limit; backend-side caching (`IMemoryCache`, TTL on the order of several minutes) is here not so much an optimization as a necessity.
- **RainViewer / OpenWeatherMap tile format** — both may change their tile URL scheme or licensing independently of this spec; re-check before any future changes to the map layers.
- **Auto-prompting for geolocation on entry — resolved.** The original plan auto-requested the browser's location permission the moment the page loaded. In testing this read as a pushy/unexpected permission prompt (the page asking for a system permission before the user had done anything). Changed to: default to a fixed location (Warsaw, Poland) on first visit, with geolocation available as an explicit opt-in via a "Use my location" button. Matches general UX guidance to request permissions in response to a user action, not automatically on load.
