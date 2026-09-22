using System.Net;
using Microsoft.Extensions.Options;
using WeatherMap.Infrastructure.MapTiles;
using WeatherMap.Infrastructure.Options;

namespace WeatherMap.UnitTests.MapTiles;

// OpenWeatherMapTileClient has no direct unit test, unlike its sibling raw
// clients (OpenMeteoGeocodingClient, RainViewerClient) — only the
// CachedMapTileClient decorator around it is covered. Exercise the raw
// client's request building and response mapping directly.
public class OpenWeatherMapTileClientTests
{
    private static readonly byte[] TileBytes = [1, 2, 3, 4];

    private sealed class CapturingHandler : HttpMessageHandler
    {
        public Uri? RequestUri { get; private set; }

        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            RequestUri = request.RequestUri;
            return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new ByteArrayContent(TileBytes),
            });
        }
    }

    private static OpenWeatherMapTileClient CreateClient(CapturingHandler handler, string apiKey = "test-key")
    {
        var httpClient = new HttpClient(handler) { BaseAddress = new Uri("https://tile.openweathermap.org/map/") };
        return new OpenWeatherMapTileClient(httpClient, Options.Create(new OpenWeatherMapOptions { ApiKey = apiKey }));
    }

    [Fact]
    public async Task GetTileAsync_ReturnsBytesWithPngContentType()
    {
        var handler = new CapturingHandler();
        var client = CreateClient(handler);

        var tile = await client.GetTileAsync("wind_new", 5, 10, 12, CancellationToken.None);

        Assert.Equal(TileBytes, tile.Content);
        Assert.Equal("image/png", tile.ContentType);
    }

    [Fact]
    public async Task GetTileAsync_BuildsRequestUrlWithLayerAndCoordinates()
    {
        var handler = new CapturingHandler();
        var client = CreateClient(handler);

        await client.GetTileAsync("clouds_new", 5, 10, 12, CancellationToken.None);

        Assert.NotNull(handler.RequestUri);
        Assert.Equal("/map/clouds_new/5/10/12.png", handler.RequestUri!.AbsolutePath);
    }

    [Fact]
    public async Task GetTileAsync_EscapesApiKeyInQueryString()
    {
        var handler = new CapturingHandler();
        var client = CreateClient(handler, apiKey: "key with spaces&stuff");

        await client.GetTileAsync("wind_new", 5, 10, 12, CancellationToken.None);

        Assert.NotNull(handler.RequestUri);
        Assert.Equal($"?appid={Uri.EscapeDataString("key with spaces&stuff")}", handler.RequestUri!.Query);
    }
}
