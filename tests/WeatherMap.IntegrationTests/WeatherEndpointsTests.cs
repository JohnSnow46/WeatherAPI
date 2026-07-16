using System.Net;

namespace WeatherMap.IntegrationTests;

public class WeatherEndpointsTests(WeatherMapWebApplicationFactory factory) : IClassFixture<WeatherMapWebApplicationFactory>
{
    [Fact]
    public async Task GetCurrentWeather_ReturnsOk_ForValidCoordinates()
    {
        var client = factory.CreateClient();

        var response = await client.GetAsync("/api/weather/current?lat=51.11&lon=17.03");

        response.EnsureSuccessStatusCode();
    }

    [Fact]
    public async Task GetCurrentWeather_ReturnsBadRequest_ForOutOfRangeLatitude()
    {
        var client = factory.CreateClient();

        var response = await client.GetAsync("/api/weather/current?lat=999&lon=17.03");

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task GetForecast_ReturnsOk_ForValidRequest()
    {
        var client = factory.CreateClient();

        var response = await client.GetAsync("/api/weather/forecast?lat=51.11&lon=17.03&days=3");

        response.EnsureSuccessStatusCode();
    }

    [Fact]
    public async Task SearchLocations_ReturnsOk_ForValidQuery()
    {
        var client = factory.CreateClient();

        var response = await client.GetAsync("/api/locations/search?query=Wroclaw");

        response.EnsureSuccessStatusCode();
    }

    [Fact]
    public async Task SearchLocations_ReturnsBadRequest_ForEmptyQuery()
    {
        var client = factory.CreateClient();

        var response = await client.GetAsync("/api/locations/search?query=");

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task RadarTiles_ReturnsOk()
    {
        var client = factory.CreateClient();

        var response = await client.GetAsync("/api/weather/radar-tiles");

        response.EnsureSuccessStatusCode();
    }

    [Fact]
    public async Task MapTiles_ReturnsOk_ForValidLayerAndTileCoordinates()
    {
        var client = factory.CreateClient();

        var response = await client.GetAsync("/api/weather/map-tiles/wind_new/5/17/10");

        response.EnsureSuccessStatusCode();
        Assert.Equal("image/png", response.Content.Headers.ContentType?.MediaType);
    }

    [Fact]
    public async Task MapTiles_ReturnsBadRequest_ForInvalidZoom()
    {
        var client = factory.CreateClient();

        var response = await client.GetAsync("/api/weather/map-tiles/wind_new/99/17/10");

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task MapTiles_ReturnsBadRequest_ForUnknownLayer()
    {
        var client = factory.CreateClient();

        var response = await client.GetAsync("/api/weather/map-tiles/not_a_real_layer/5/17/10");

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }
}
