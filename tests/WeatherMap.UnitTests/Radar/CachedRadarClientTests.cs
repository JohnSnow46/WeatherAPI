using System.Net;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;
using WeatherMap.Infrastructure.Options;
using WeatherMap.Infrastructure.Radar;

namespace WeatherMap.UnitTests.Radar;

// The Cached* decorators (CachedRadarClient, CachedWeatherClient, CachedGeocodingClient,
// CachedMapTileClient) implement the caching behavior called out as a key feature of this
// project, but nothing in the test suite exercised it: Application-layer tests mock the
// client interfaces directly (bypassing the decorators), and the WebApplicationFactory used
// by integration tests replaces those same interfaces with fakes (bypassing them too). This
// covers CachedRadarClient — the simplest of the four, since GetRadarInfoAsync takes no
// arguments and so has exactly one cache key to reason about.
public class CachedRadarClientTests
{
    private const string ResponseJson = """
        {
          "host": "https://tilecache.rainviewer.com",
          "radar": {
            "past": [{ "time": 1700000000, "path": "/v2/radar/1700000000" }],
            "nowcast": []
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

    private static CachedRadarClient CreateClient(CountingHandler handler)
    {
        var httpClient = new HttpClient(handler) { BaseAddress = new Uri("https://api.rainviewer.com/") };
        var inner = new RainViewerClient(httpClient);
        var cache = new MemoryCache(new MemoryCacheOptions());
        var options = Options.Create(new CacheOptions());
        return new CachedRadarClient(inner, cache, options);
    }

    [Fact]
    public async Task GetRadarInfoAsync_OnSecondCall_ReturnsCachedResultWithoutCallingInnerAgain()
    {
        var handler = new CountingHandler();
        var client = CreateClient(handler);

        var first = await client.GetRadarInfoAsync(CancellationToken.None);
        var second = await client.GetRadarInfoAsync(CancellationToken.None);

        Assert.Equal(1, handler.CallCount);
        Assert.Equal(first.Host, second.Host);
        Assert.Equal(first.Past.Single().Path, second.Past.Single().Path);
    }
}
