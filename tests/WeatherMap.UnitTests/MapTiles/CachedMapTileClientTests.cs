using System.Net;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;
using WeatherMap.Infrastructure.Caching;
using WeatherMap.Infrastructure.MapTiles;
using WeatherMap.Infrastructure.Options;

namespace WeatherMap.UnitTests.MapTiles;

// The "last of four Cached* decorators" note in CachedWeatherClientTests missed this one:
// CachedMapTileClient had no cache-hit test of its own.
public class CachedMapTileClientTests
{
    private static readonly byte[] TileBytes = [1, 2, 3, 4];

    private sealed class CountingHandler : HttpMessageHandler
    {
        public int CallCount { get; private set; }

        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            CallCount++;
            return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new ByteArrayContent(TileBytes),
            });
        }
    }

    private static CachedMapTileClient CreateClient(CountingHandler handler)
    {
        var httpClient = new HttpClient(handler) { BaseAddress = new Uri("https://tile.openweathermap.org/map/") };
        var inner = new OpenWeatherMapTileClient(httpClient, Options.Create(new OpenWeatherMapOptions { ApiKey = "test-key" }));
        var cache = new MemoryCache(new MemoryCacheOptions());
        var options = Options.Create(new CacheOptions());
        return new CachedMapTileClient(inner, cache, options, new CacheMetrics());
    }

    [Fact]
    public async Task GetTileAsync_OnSecondCallWithSameCoordinates_ReturnsCachedResultWithoutCallingInnerAgain()
    {
        var handler = new CountingHandler();
        var client = CreateClient(handler);

        var first = await client.GetTileAsync("wind_new", 5, 10, 12, CancellationToken.None);
        var second = await client.GetTileAsync("wind_new", 5, 10, 12, CancellationToken.None);

        Assert.Equal(1, handler.CallCount);
        Assert.Equal(first.Content, second.Content);
    }

    [Fact]
    public async Task GetTileAsync_WithDifferentLayer_CallsInnerAgain()
    {
        var handler = new CountingHandler();
        var client = CreateClient(handler);

        await client.GetTileAsync("wind_new", 5, 10, 12, CancellationToken.None);
        await client.GetTileAsync("clouds_new", 5, 10, 12, CancellationToken.None);

        Assert.Equal(2, handler.CallCount);
    }

    [Fact]
    public async Task GetTileAsync_WithDifferentCoordinates_CallsInnerAgain()
    {
        var handler = new CountingHandler();
        var client = CreateClient(handler);

        await client.GetTileAsync("wind_new", 5, 10, 12, CancellationToken.None);
        await client.GetTileAsync("wind_new", 5, 11, 12, CancellationToken.None);

        Assert.Equal(2, handler.CallCount);
    }
}
