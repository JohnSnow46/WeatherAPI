# WeatherMap

Portfolio project: a REST API in .NET that aggregates/proxies external weather APIs, paired with a Next.js frontend that visualizes the data on a map (precipitation radar, wind). No login, no database — a deliberately lightweight, stateless backend focused on data integration and visualization.

See [CLAUDE.md](./CLAUDE.md) for the full project spec (architecture, tech stack, endpoints, staged plan, hosting).

## Structure

```
src/
  WeatherMap.Domain/          # domain models, client interfaces
  WeatherMap.Application/     # use cases, DTOs, validation
  WeatherMap.Infrastructure/  # Open-Meteo / RainViewer HTTP clients, caching
  WeatherMap.Api/             # ASP.NET Core Web API (controllers)
tests/
  WeatherMap.UnitTests/
  WeatherMap.IntegrationTests/
frontend/                     # Next.js (App Router) + TypeScript
```

## Backend — run locally

```bash
dotnet restore
dotnet build
dotnet test
dotnet run --project src/WeatherMap.Api
```

## Frontend — run locally

```bash
cd frontend
npm install
npm run dev
```

## Status

Early scaffolding — see the `[ ]` checklist in [CLAUDE.md](./CLAUDE.md#4-key-features) for what's implemented so far.

## Architecture & demo

_TODO: architecture diagram, data-flow diagram, demo GIF._
