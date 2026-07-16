using Microsoft.Extensions.Diagnostics.HealthChecks;
using WeatherMap.Domain.Abstractions;
using WeatherMap.Domain.Models;

namespace WeatherMap.IntegrationTests.Fakes;

public sealed class FakeGeocodingClient : IGeocodingClient
{
    public Task<IReadOnlyList<Location>> SearchAsync(string query, int count, CancellationToken cancellationToken) =>
        Task.FromResult<IReadOnlyList<Location>>(
            [new Location("Wrocław", "Poland", "Lower Silesia", 51.11, 17.03, "Europe/Warsaw")]);
}

public sealed class FakeWeatherClient : IWeatherClient
{
    public Task<CurrentConditions> GetCurrentAsync(double latitude, double longitude, CancellationToken cancellationToken) =>
        Task.FromResult(new CurrentConditions(DateTimeOffset.UtcNow, 20.0, 19.0, 5.0, 90, 0.0, 1, true));

    public Task<Forecast> GetForecastAsync(double latitude, double longitude, int days, CancellationToken cancellationToken) =>
        Task.FromResult(new Forecast(
            Hourly: [new HourlyForecastPoint(DateTimeOffset.UtcNow, 20.0, 0.0, 5.0, 1)],
            Daily: [new DailyForecastPoint(DateOnly.FromDateTime(DateTime.UtcNow), 25.0, 15.0, 0.0, 1)]));
}

public sealed class FakeRadarClient : IRadarClient
{
    public Task<RadarInfo> GetRadarInfoAsync(CancellationToken cancellationToken) =>
        Task.FromResult(new RadarInfo(
            "https://tilecache.rainviewer.com",
            Past: [new RadarFrame(1700000000, "/v2/radar/1700000000")],
            Nowcast: [new RadarFrame(1700000600, "/v2/radar/nowcast_1700000600")]));
}

public sealed class FakeWeatherTileClient : IWeatherTileClient
{
    public Task<MapTile> GetTileAsync(string layer, int z, int x, int y, CancellationToken cancellationToken) =>
        Task.FromResult(new MapTile([1, 2, 3], "image/png"));
}

public sealed class FakeHealthCheck(HealthStatus status) : IHealthCheck
{
    public Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context,
        CancellationToken cancellationToken = default) =>
        Task.FromResult(new HealthCheckResult(status, "fake health check"));
}
