using System.Net.Http.Json;
using System.Text.Json;

namespace WeatherMap.IntegrationTests;

public class HealthCheckTests(WeatherMapWebApplicationFactory factory) : IClassFixture<WeatherMapWebApplicationFactory>
{
    [Fact]
    public async Task Health_ReturnsHealthyStatus_WithOpenMeteoCheck()
    {
        var client = factory.CreateClient();

        var response = await client.GetAsync("/health");

        response.EnsureSuccessStatusCode();
        var body = await response.Content.ReadFromJsonAsync<JsonElement>();

        Assert.Equal("Healthy", body.GetProperty("status").GetString());

        var checks = body.GetProperty("checks").EnumerateArray().ToList();
        Assert.Contains(checks, c => c.GetProperty("name").GetString() == "open-meteo");
        Assert.Contains(checks, c => c.GetProperty("name").GetString() == "rainviewer");
    }
}
