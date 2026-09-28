using Moq;
using WeatherMap.Application.Weather;
using WeatherMap.Domain.Abstractions;
using WeatherMap.Domain.Models;

namespace WeatherMap.UnitTests.Weather;

public class GetAirQualityQueryHandlerTests
{
    [Fact]
    public async Task Handle_MapsAirQualityToDto()
    {
        var airQualityClient = new Mock<IAirQualityClient>();
        var time = DateTimeOffset.Parse("2026-09-28T12:00:00+02:00");
        airQualityClient
            .Setup(c => c.GetCurrentAsync(51.11, 17.03, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new AirQuality(time, 9.1, 18.4, 32));

        var handler = new GetAirQualityQueryHandler(airQualityClient.Object);

        var result = await handler.Handle(new GetAirQualityQuery(51.11, 17.03), CancellationToken.None);

        Assert.Equal(9.1, result.Pm2_5);
        Assert.Equal(18.4, result.Pm10);
        Assert.Equal(32, result.EuropeanAqi);
    }
}
