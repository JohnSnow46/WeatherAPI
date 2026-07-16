using Moq;
using WeatherMap.Application.Weather;
using WeatherMap.Domain.Abstractions;
using WeatherMap.Domain.Models;

namespace WeatherMap.UnitTests.Weather;

public class GetMapTileQueryHandlerTests
{
    [Fact]
    public async Task Handle_MapsMapTileToDto()
    {
        var weatherTileClient = new Mock<IWeatherTileClient>();
        var tileBytes = new byte[] { 1, 2, 3 };
        weatherTileClient
            .Setup(c => c.GetTileAsync("wind_new", 5, 17, 10, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new MapTile(tileBytes, "image/png"));

        var handler = new GetMapTileQueryHandler(weatherTileClient.Object);

        var result = await handler.Handle(new GetMapTileQuery("wind_new", 5, 17, 10), CancellationToken.None);

        Assert.Equal(tileBytes, result.Content);
        Assert.Equal("image/png", result.ContentType);
    }
}
