using System.Net;
using WeatherMap.Infrastructure.Geocoding;

namespace WeatherMap.UnitTests.Geocoding;

// OpenMeteoGeocodingClient has no direct unit test, unlike its sibling
// OpenMeteoForecastClient — only the CachedGeocodingClient decorator around
// it is covered. Exercise the raw client's response mapping directly.
public class OpenMeteoGeocodingClientTests
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

    private static OpenMeteoGeocodingClient CreateClient(string responseJson)
    {
        var httpClient = new HttpClient(new StubHandler(responseJson))
        {
            BaseAddress = new Uri("https://geocoding-api.open-meteo.com/"),
        };
        return new OpenMeteoGeocodingClient(httpClient);
    }

    [Fact]
    public async Task SearchAsync_WithResults_MapsAllFields()
    {
        const string json = """
            {
              "results": [
                { "name": "Wroclaw", "latitude": 51.11, "longitude": 17.03, "country": "Poland", "admin1": "Lower Silesia", "timezone": "Europe/Warsaw" }
              ]
            }
            """;
        var client = CreateClient(json);

        var results = await client.SearchAsync("Wroclaw", 5, CancellationToken.None);

        var location = Assert.Single(results);
        Assert.Equal("Wroclaw", location.Name);
        Assert.Equal("Poland", location.Country);
        Assert.Equal("Lower Silesia", location.Admin1);
        Assert.Equal("Europe/Warsaw", location.Timezone);
        Assert.Equal(51.11, location.Latitude);
        Assert.Equal(17.03, location.Longitude);
    }

    [Fact]
    public async Task SearchAsync_WithNullResults_ReturnsEmptyList()
    {
        const string json = "{}";
        var client = CreateClient(json);

        var results = await client.SearchAsync("Nonexistent Place Xyz", 5, CancellationToken.None);

        Assert.Empty(results);
    }

    [Fact]
    public async Task SearchAsync_WithMissingOptionalFields_MapsNulls()
    {
        const string json = """
            {
              "results": [
                { "name": "Atlantis", "latitude": 0.0, "longitude": 0.0 }
              ]
            }
            """;
        var client = CreateClient(json);

        var results = await client.SearchAsync("Atlantis", 1, CancellationToken.None);

        var location = Assert.Single(results);
        Assert.Equal("Atlantis", location.Name);
        Assert.Null(location.Country);
        Assert.Null(location.Admin1);
        Assert.Null(location.Timezone);
    }
}
