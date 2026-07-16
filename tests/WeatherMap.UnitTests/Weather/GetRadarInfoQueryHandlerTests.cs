using Moq;
using WeatherMap.Application.Weather;
using WeatherMap.Domain.Abstractions;
using WeatherMap.Domain.Models;

namespace WeatherMap.UnitTests.Weather;

public class GetRadarInfoQueryHandlerTests
{
    [Fact]
    public async Task Handle_MapsRadarInfoToDto()
    {
        var radarClient = new Mock<IRadarClient>();
        var radarInfo = new RadarInfo(
            "https://tilecache.rainviewer.com",
            Past: [new RadarFrame(1700000000, "/v2/radar/1700000000")],
            Nowcast: [new RadarFrame(1700000600, "/v2/radar/nowcast_1700000600")]);

        radarClient.Setup(c => c.GetRadarInfoAsync(It.IsAny<CancellationToken>())).ReturnsAsync(radarInfo);

        var handler = new GetRadarInfoQueryHandler(radarClient.Object);

        var result = await handler.Handle(new GetRadarInfoQuery(), CancellationToken.None);

        Assert.Equal("https://tilecache.rainviewer.com", result.Host);
        var pastFrame = Assert.Single(result.Past);
        Assert.Equal(1700000000, pastFrame.Time);
        var nowcastFrame = Assert.Single(result.Nowcast);
        Assert.Equal("/v2/radar/nowcast_1700000600", nowcastFrame.Path);
    }
}
