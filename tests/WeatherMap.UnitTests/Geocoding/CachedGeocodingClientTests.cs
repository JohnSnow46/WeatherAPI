using System.Net;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;
using WeatherMap.Infrastructure.Geocoding;
using WeatherMap.Infrastructure.Options;

namespace WeatherMap.UnitTests.Geocoding;

public class CachedGeocodingClientTests
{
    private const string ResponseJson = """
        {
          "results": [
            { "name": "Wroclaw", "latitude": 51.11, "longitude": 17.03, "country": "Poland", "admin1": "Lower Silesia", "timezone": "Europe/Warsaw" }
          ]
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

    private static CachedGeocodingClient CreateClient(CountingHandler handler)
    {
        var httpClient = new HttpClient(handler) { BaseAddress = new Uri("https://geocoding-api.open-meteo.com/") };
        var inner = new OpenMeteoGeocodingClient(httpClient);
        var cache = new MemoryCache(new MemoryCacheOptions());
        var options = Options.Create(new CacheOptions());
        return new CachedGeocodingClient(inner, cache, options);
    }

    [Fact]
    public async Task SearchAsync_OnSecondCallWithSameQuery_ReturnsCachedResultWithoutCallingInnerAgain()
    {
        var handler = new CountingHandler();
        var client = CreateClient(handler);

        var first = await client.SearchAsync("Wroclaw", 5, CancellationToken.None);
        var second = await client.SearchAsync("Wroclaw", 5, CancellationToken.None);

        Assert.Equal(1, handler.CallCount);
        Assert.Equal(first.Single().Name, second.Single().Name);
    }

    [Fact]
    public async Task SearchAsync_IsCaseInsensitiveAndTrimsWhitespaceForTheCacheKey()
    {
        var handler = new CountingHandler();
        var client = CreateClient(handler);

        await client.SearchAsync("Wroclaw", 5, CancellationToken.None);
        await client.SearchAsync(" WROCLAW ", 5, CancellationToken.None);

        Assert.Equal(1, handler.CallCount);
    }

    [Fact]
    public async Task SearchAsync_WithDifferentCount_CallsInnerAgain()
    {
        var handler = new CountingHandler();
        var client = CreateClient(handler);

        await client.SearchAsync("Wroclaw", 5, CancellationToken.None);
        await client.SearchAsync("Wroclaw", 10, CancellationToken.None);

        Assert.Equal(2, handler.CallCount);
    }
}
