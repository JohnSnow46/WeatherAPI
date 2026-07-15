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
- Map: **Leaflet** — alternative: MapLibre GL
- Wind visualization: `leaflet-velocity` (animated vector field from gridded data) — ⚠️ see section 9, this is the biggest technical risk in the project
- Data fetching: React Query / SWR
- Browser geolocation (Geolocation API) — asks for location permission on first visit
- Location search (fallback / change location)
- **localStorage** — remembers the last selected/searched location between visits (no backend, no account)

**Weather data sources**
- **Open-Meteo** — primary source (forecast, hourly data, wind, precipitation; no API key required), plus the Open-Meteo Geocoding API for the location search
- **RainViewer API** — free precipitation radar tiles (Open-Meteo has no ready-made map tiles), used for the visual precipitation layer on the map

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

- [ ] Geolocation on entry (permission prompt) → automatically sets the starting location
- [ ] Location search (geocoding) as an alternative/way to change location
- [ ] Remembering the last selected location in localStorage
- [ ] Weather forecast (current + hourly + a few days)
- [ ] Map layers: precipitation (RainViewer radar, animated over time) + wind (animated vector field)
- [ ] Backend-side caching of external API responses (`IMemoryCache`, TTL)
- [ ] Health checks (`/health`) for the API and its external dependencies

## 5. Example API endpoints

```
GET  /api/locations/search?query=Wroclaw
GET  /api/weather/current?lat=..&lon=..
GET  /api/weather/forecast?lat=..&lon=..
GET  /api/weather/radar-tiles          # proxy/metadata for RainViewer
GET  /api/weather/wind-grid?bbox=..    # wind vector grid for the visible map area
```

The backend here is primarily an **aggregator/proxy** — it normalizes responses from Open-Meteo and RainViewer into a single DTO contract, caches them, and hides provider details from the frontend.

## 6. Working conventions with Claude Code

- Commits: Conventional Commits (`feat:`, `fix:`, `refactor:`, `test:`)
- Unit tests for the Application layer before/alongside implementation
- Don't commit API keys (RainViewer/Open-Meteo currently require no keys, but keep this in config for the future)
- README with architecture, a data-flow diagram, and a demo GIF

## 7. Stages (suggested order)

0. **Repo setup**: two projects (backend/frontend) or a monorepo, CI (build + tests on push), `.gitignore`, README skeleton
1. **Backend skeleton**: Clean Architecture structure, health check, `HttpClient` configuration (with Polly) for Open-Meteo
2. **Open-Meteo integration**: geocoding + current/forecast, DTOs, cache, tests
3. **Frontend MVP**: Next.js, geolocation + search, forecast display (no map yet), CORS between Vercel and the backend
4. **localStorage**: remembering the last location
5. **Map — precipitation**: Leaflet + radar layer (RainViewer)
6. **Map — wind**: solution from section 9 (point grid + vectors)
7. **Polishing**: handling external API errors (what the frontend shows when Open-Meteo/RainViewer is down), README with demo GIF

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

- **Wind vectors on the map — this is the most uncertain part of the project.** `leaflet-velocity` expects a grid of U/V wind values, like the data GFS/GRIB provide — but Open-Meteo returns data pointwise, for a specific lat/lon pair, not as a ready-made grid. To build an animated wind field, the backend would need to sample a grid of points across the visible map area and query Open-Meteo for each one (Open-Meteo allows multiple locations in a single request, so this is feasible, but it requires a sensible grid step and per-bbox caching so as not to blow through the rate limit). **Simpler, safer fallback option**: instead of a continuous animated field, show discrete wind arrows at fixed points (e.g., a grid of cities/every N km) — much less work, still looks good in a demo.
- **Open-Meteo rate limit** — the free plan has a daily call limit; backend-side caching (`IMemoryCache`, TTL on the order of several minutes) is here not so much an optimization as a necessity, especially with the point grid for wind.
- **RainViewer** — check the current tile format and license before integrating (it may change independently of this spec).
