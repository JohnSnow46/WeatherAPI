using System.Net;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;
using WeatherMap.Infrastructure.Caching;
using WeatherMap.Infrastructure.Options;
using WeatherMap.Infrastructure.Weather;

namespace WeatherMap.UnitTests.Weather;

// Of the four Cached* decorators, CachedRadarClient and CachedGeocodingClient already had
// cache-hit tests; this covers the last one, CachedWeatherClient, including its rounded
// cache-key behavior (two coordinates that round to the same 2-decimal key should share a
// cache entry) and that a different `days` value for the forecast is a separate entry.
public class CachedWeatherClientTests
{
    private const string CurrentResponseJson = """
        {
          "utc_offset_seconds": 3600,
          "current": {
            "time": "2026-09-15T12:00",
            "temperature_2m": 18.5,
            "apparent_temperature": 17.9,
            "precipitation": 0.0,
            "weather_code": 1,
            "wind_speed_10m": 12.0,
            "wind_direction_10m": 270,
            "is_day": 1
          }
        }
        """;

    private const string ForecastResponseJson = """
        {
          "utc_offset_seconds": 3600,
          "hourly": {
            "time": ["2026-09-15T00:00"],
            "temperature_2m": [10.0],
            "precipitation": [0.0],
            "weather_code": [0],
            "wind_speed_10m": [5.0]
          },
          "daily": {
            "time": ["2026-09-15"],
            "temperature_2m_max": [15.0],
            "temperature_2m_min": [5.0],
            "precipitation_sum": [0.0],
            "weather_code": [0]
          }
        }
        """;

    private sealed class CountingHandler(string responseJson) : HttpMessageHandler
    {
        public int CallCount { get; private set; }

        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            CallCount++;
            return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(responseJson, System.Text.Encoding.UTF8, "application/json"),
            });
        }
    }

    private static CachedWeatherClient CreateClient(CountingHandler handler)
    {
        var httpClient = new HttpClient(handler) { BaseAddress = new Uri("https://api.open-meteo.com/") };
        var inner = new OpenMeteoForecastClient(httpClient);
        var cache = new MemoryCache(new MemoryCacheOptions());
        var options = Options.Create(new CacheOptions());
        return new CachedWeatherClient(inner, cache, options, new CacheMetrics());
    }

    [Fact]
    public async Task GetCurrentAsync_OnSecondCallWithSameCoordinates_ReturnsCachedResultWithoutCallingInnerAgain()
    {
        var handler = new CountingHandler(CurrentResponseJson);
        var client = CreateClient(handler);

        var first = await client.GetCurrentAsync(52.2297, 21.0122, CancellationToken.None);
        var second = await client.GetCurrentAsync(52.2297, 21.0122, CancellationToken.None);

        Assert.Equal(1, handler.CallCount);
        Assert.Equal(first.TemperatureC, second.TemperatureC);
    }

    [Fact]
    public async Task GetCurrentAsync_WithCoordinatesRoundingToTheSameKey_ReturnsCachedResult()
    {
        var handler = new CountingHandler(CurrentResponseJson);
        var client = CreateClient(handler);

        await client.GetCurrentAsync(52.22999, 21.01199, CancellationToken.None);
        await client.GetCurrentAsync(52.23001, 21.01201, CancellationToken.None);

        Assert.Equal(1, handler.CallCount);
    }

    [Fact]
    public async Task GetForecastAsync_WithDifferentDays_CallsInnerAgain()
    {
        var handler = new CountingHandler(ForecastResponseJson);
        var client = CreateClient(handler);

        await client.GetForecastAsync(52.2297, 21.0122, 3, CancellationToken.None);
        await client.GetForecastAsync(52.2297, 21.0122, 7, CancellationToken.None);

        Assert.Equal(2, handler.CallCount);
    }

    [Fact]
    public async Task GetForecastAsync_OnSecondCallWithSameArguments_ReturnsCachedResultWithoutCallingInnerAgain()
    {
        var handler = new CountingHandler(ForecastResponseJson);
        var client = CreateClient(handler);

        var first = await client.GetForecastAsync(52.2297, 21.0122, 3, CancellationToken.None);
        var second = await client.GetForecastAsync(52.2297, 21.0122, 3, CancellationToken.None);

        Assert.Equal(1, handler.CallCount);
        Assert.Equal(first.Hourly.Count, second.Hourly.Count);
    }
}
