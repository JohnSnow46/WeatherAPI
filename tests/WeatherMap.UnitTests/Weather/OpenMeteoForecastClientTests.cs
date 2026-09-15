using System.Net;
using WeatherMap.Infrastructure.Weather;

namespace WeatherMap.UnitTests.Weather;

// GetForecastAsync indexes the hourly/daily arrays by the same index as their
// respective Time array without checking they're the same length. A malformed
// or truncated Open-Meteo response (one array shorter than Time) previously
// threw an unguarded ArgumentOutOfRangeException instead of a clear failure.
public class OpenMeteoForecastClientTests
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

    private static OpenMeteoForecastClient CreateClient(string responseJson)
    {
        var httpClient = new HttpClient(new StubHandler(responseJson))
        {
            BaseAddress = new Uri("https://api.open-meteo.com/"),
        };
        return new OpenMeteoForecastClient(httpClient);
    }

    [Fact]
    public async Task GetForecastAsync_WithMismatchedHourlyArrayLengths_ThrowsInvalidOperationException()
    {
        const string json = """
            {
              "utc_offset_seconds": 3600,
              "hourly": {
                "time": ["2026-09-15T00:00", "2026-09-15T01:00"],
                "temperature_2m": [10.0],
                "precipitation": [0.0, 0.1],
                "weather_code": [0, 0],
                "wind_speed_10m": [5.0, 5.5]
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
        var client = CreateClient(json);

        await Assert.ThrowsAsync<InvalidOperationException>(
            () => client.GetForecastAsync(52.23, 21.01, 1, CancellationToken.None));
    }

    [Fact]
    public async Task GetForecastAsync_WithMismatchedDailyArrayLengths_ThrowsInvalidOperationException()
    {
        const string json = """
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
                "time": ["2026-09-15", "2026-09-16"],
                "temperature_2m_max": [15.0],
                "temperature_2m_min": [5.0, 6.0],
                "precipitation_sum": [0.0, 0.2],
                "weather_code": [0, 0]
              }
            }
            """;
        var client = CreateClient(json);

        await Assert.ThrowsAsync<InvalidOperationException>(
            () => client.GetForecastAsync(52.23, 21.01, 2, CancellationToken.None));
    }

    [Fact]
    public async Task GetForecastAsync_WithConsistentArrayLengths_ReturnsForecast()
    {
        const string json = """
            {
              "utc_offset_seconds": 3600,
              "hourly": {
                "time": ["2026-09-15T00:00", "2026-09-15T01:00"],
                "temperature_2m": [10.0, 9.5],
                "precipitation": [0.0, 0.1],
                "weather_code": [0, 0],
                "wind_speed_10m": [5.0, 5.5]
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
        var client = CreateClient(json);

        var forecast = await client.GetForecastAsync(52.23, 21.01, 1, CancellationToken.None);

        Assert.Equal(2, forecast.Hourly.Count);
        Assert.Single(forecast.Daily);
    }
}
