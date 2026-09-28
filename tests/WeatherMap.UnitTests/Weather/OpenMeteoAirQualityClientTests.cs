using System.Net;
using WeatherMap.Infrastructure.AirQuality;

namespace WeatherMap.UnitTests.Weather;

public class OpenMeteoAirQualityClientTests
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

    private static OpenMeteoAirQualityClient CreateClient(string responseJson)
    {
        var httpClient = new HttpClient(new StubHandler(responseJson))
        {
            BaseAddress = new Uri("https://air-quality-api.open-meteo.com/"),
        };
        return new OpenMeteoAirQualityClient(httpClient);
    }

    [Fact]
    public async Task GetCurrentAsync_MapsResponseFields()
    {
        var client = CreateClient(ResponseJson);

        var result = await client.GetCurrentAsync(52.2297, 21.0122, CancellationToken.None);

        Assert.Equal(9.1, result.Pm2_5);
        Assert.Equal(18.4, result.Pm10);
        Assert.Equal(32, result.EuropeanAqi);
    }
}
