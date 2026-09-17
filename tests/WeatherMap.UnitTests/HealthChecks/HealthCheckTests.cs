using System.Net;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using WeatherMap.Infrastructure.HealthChecks;
using WeatherMap.Infrastructure.Radar;
using WeatherMap.Infrastructure.Weather;

namespace WeatherMap.UnitTests.HealthChecks;

// The only existing coverage of OpenMeteoHealthCheck/RainViewerHealthCheck is the
// integration test hitting /health against a working fake, which only exercises the
// Healthy branch. Neither check had a direct test proving it reports Unhealthy (rather
// than letting the exception bubble up and fail the health endpoint outright) when its
// upstream client throws.
public class HealthCheckTests
{
    private sealed class ThrowingHandler : HttpMessageHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
            => throw new HttpRequestException("Simulated upstream failure.");
    }

    private sealed class OkHandler(string responseJson) : HttpMessageHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(responseJson, System.Text.Encoding.UTF8, "application/json"),
            });
        }
    }

    [Fact]
    public async Task OpenMeteoHealthCheck_WhenClientThrows_ReturnsUnhealthy()
    {
        var httpClient = new HttpClient(new ThrowingHandler()) { BaseAddress = new Uri("https://api.open-meteo.com/") };
        var check = new OpenMeteoHealthCheck(new OpenMeteoForecastClient(httpClient));

        var result = await check.CheckHealthAsync(new HealthCheckContext());

        Assert.Equal(HealthStatus.Unhealthy, result.Status);
        Assert.IsType<HttpRequestException>(result.Exception);
    }

    [Fact]
    public async Task OpenMeteoHealthCheck_WhenClientSucceeds_ReturnsHealthy()
    {
        const string json = """
            {
              "utc_offset_seconds": 3600,
              "current": {
                "time": "2026-09-17T12:00",
                "temperature_2m": 15.0,
                "apparent_temperature": 14.0,
                "precipitation": 0.0,
                "weather_code": 0,
                "wind_speed_10m": 5.0,
                "wind_direction_10m": 180,
                "is_day": 1
              }
            }
            """;
        var httpClient = new HttpClient(new OkHandler(json)) { BaseAddress = new Uri("https://api.open-meteo.com/") };
        var check = new OpenMeteoHealthCheck(new OpenMeteoForecastClient(httpClient));

        var result = await check.CheckHealthAsync(new HealthCheckContext());

        Assert.Equal(HealthStatus.Healthy, result.Status);
    }

    [Fact]
    public async Task RainViewerHealthCheck_WhenClientThrows_ReturnsUnhealthy()
    {
        var httpClient = new HttpClient(new ThrowingHandler()) { BaseAddress = new Uri("https://api.rainviewer.com/") };
        var check = new RainViewerHealthCheck(new RainViewerClient(httpClient));

        var result = await check.CheckHealthAsync(new HealthCheckContext());

        Assert.Equal(HealthStatus.Unhealthy, result.Status);
        Assert.IsType<HttpRequestException>(result.Exception);
    }

    [Fact]
    public async Task RainViewerHealthCheck_WhenClientSucceeds_ReturnsHealthy()
    {
        const string json = """
            {
              "host": "https://tilecache.rainviewer.com",
              "radar": { "past": [{ "time": 1, "path": "/v2/1" }], "nowcast": [] }
            }
            """;
        var httpClient = new HttpClient(new OkHandler(json)) { BaseAddress = new Uri("https://api.rainviewer.com/") };
        var check = new RainViewerHealthCheck(new RainViewerClient(httpClient));

        var result = await check.CheckHealthAsync(new HealthCheckContext());

        Assert.Equal(HealthStatus.Healthy, result.Status);
    }
}
