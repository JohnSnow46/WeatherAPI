using System.Net;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;
using WeatherMap.Infrastructure.AirQuality;
using WeatherMap.Infrastructure.Caching;
using WeatherMap.Infrastructure.Options;

namespace WeatherMap.UnitTests.Weather;

public class CachedAirQualityClientTests
{
    private const string ResponseJson = """
        {
          "utc_offset_seconds": 3600,
          "current": {
            "time": "2026-09-28T12:00",
            "pm10": 18.4,
            "pm2_5": 9.1,
            "european_aqi": 32
          }
        }
        """;

    private sealed class CountingHandler : HttpMessageHandler
    {
        public int CallCount { get; private set; }

        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            CallCount++;
            return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(ResponseJson, System.Text.Encoding.UTF8, "application/json"),
            });
        }
    }

    private static CachedAirQualityClient CreateClient(CountingHandler handler)
    {
        var httpClient = new HttpClient(handler) { BaseAddress = new Uri("https://air-quality-api.open-meteo.com/") };
        var inner = new OpenMeteoAirQualityClient(httpClient);
        var cache = new MemoryCache(new MemoryCacheOptions());
        var options = Options.Create(new CacheOptions());
        return new CachedAirQualityClient(inner, cache, options, new CacheMetrics());
    }

    [Fact]
    public async Task GetCurrentAsync_OnSecondCallWithSameCoordinates_ReturnsCachedResultWithoutCallingInnerAgain()
    {
        var handler = new CountingHandler();
        var client = CreateClient(handler);

        var first = await client.GetCurrentAsync(52.2297, 21.0122, CancellationToken.None);
        var second = await client.GetCurrentAsync(52.2297, 21.0122, CancellationToken.None);

        Assert.Equal(1, handler.CallCount);
        Assert.Equal(first.Pm2_5, second.Pm2_5);
    }

    [Fact]
    public async Task GetCurrentAsync_WithDifferentCoordinates_CallsInnerAgain()
    {
        var handler = new CountingHandler();
        var client = CreateClient(handler);

        await client.GetCurrentAsync(52.2297, 21.0122, CancellationToken.None);
        await client.GetCurrentAsync(51.1079, 17.0385, CancellationToken.None);

        Assert.Equal(2, handler.CallCount);
    }
}
