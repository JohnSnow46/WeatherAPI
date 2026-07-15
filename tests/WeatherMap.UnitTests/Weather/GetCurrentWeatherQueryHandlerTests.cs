using Moq;
using WeatherMap.Application.Weather;
using WeatherMap.Domain.Abstractions;
using WeatherMap.Domain.Models;

namespace WeatherMap.UnitTests.Weather;

public class GetCurrentWeatherQueryHandlerTests
{
    [Fact]
    public async Task Handle_MapsCurrentConditionsToDto()
    {
        var weatherClient = new Mock<IWeatherClient>();
        var time = DateTimeOffset.Parse("2026-07-15T12:00:00+02:00");
        weatherClient
            .Setup(c => c.GetCurrentAsync(51.11, 17.03, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new CurrentConditions(time, 22.5, 21.0, 10.2, 180, 0.0, 1, true));

        var handler = new GetCurrentWeatherQueryHandler(weatherClient.Object);

        var result = await handler.Handle(new GetCurrentWeatherQuery(51.11, 17.03), CancellationToken.None);

        Assert.Equal(22.5, result.TemperatureC);
        Assert.Equal(21.0, result.ApparentTemperatureC);
        Assert.Equal(10.2, result.WindSpeedKmh);
        Assert.True(result.IsDay);
    }
}
