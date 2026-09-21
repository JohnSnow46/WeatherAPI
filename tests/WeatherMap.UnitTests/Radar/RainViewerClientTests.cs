using System.Net;
using WeatherMap.Infrastructure.Radar;

namespace WeatherMap.UnitTests.Radar;

// RainViewerClient has no direct unit test, unlike the CachedRadarClient
// decorator around it. Exercise the raw client's response mapping directly.
public class RainViewerClientTests
{
    private sealed class StubHandler(string responseJson) : HttpMessageHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(responseJson, System.Text.Encoding.UTF8, "application/json"),
            });
        }
    }

    private static RainViewerClient CreateClient(string responseJson)
    {
        var httpClient = new HttpClient(new StubHandler(responseJson))
        {
            BaseAddress = new Uri("https://api.rainviewer.com/"),
        };
        return new RainViewerClient(httpClient);
    }

    [Fact]
    public async Task GetRadarInfoAsync_WithPastAndNowcastFrames_MapsAllFields()
    {
        const string json = """
            {
              "host": "https://tilecache.rainviewer.com",
              "radar": {
                "past": [
                  { "time": 1700000000, "path": "/v2/radar/1700000000" }
                ],
                "nowcast": [
                  { "time": 1700000600, "path": "/v2/radar/1700000600" }
                ]
              }
            }
            """;
        var client = CreateClient(json);

        var info = await client.GetRadarInfoAsync(CancellationToken.None);

        Assert.Equal("https://tilecache.rainviewer.com", info.Host);
        var pastFrame = Assert.Single(info.Past);
        Assert.Equal(1700000000, pastFrame.Time);
        Assert.Equal("/v2/radar/1700000000", pastFrame.Path);
        var nowcastFrame = Assert.Single(info.Nowcast);
        Assert.Equal(1700000600, nowcastFrame.Time);
    }

    [Fact]
    public async Task GetRadarInfoAsync_WithMissingRadarBlock_ReturnsEmptyFrameLists()
    {
        const string json = """
            { "host": "https://tilecache.rainviewer.com" }
            """;
        var client = CreateClient(json);

        var info = await client.GetRadarInfoAsync(CancellationToken.None);

        Assert.Empty(info.Past);
        Assert.Empty(info.Nowcast);
    }

    [Fact]
    public async Task GetRadarInfoAsync_WithEmptyResponseBody_ThrowsInvalidOperationException()
    {
        var client = CreateClient("null");

        await Assert.ThrowsAsync<InvalidOperationException>(
            () => client.GetRadarInfoAsync(CancellationToken.None));
    }
}
