using Moq;
using WeatherMap.Application.Common;
using WeatherMap.Application.Weather;
using WeatherMap.Domain.Abstractions;
using WeatherMap.Domain.Models;

namespace WeatherMap.UnitTests.Weather;

public class GetCurrentWeatherBatchQueryHandlerTests
{
    [Fact]
    public async Task Handle_ReturnsOneItemPerLocation_InRequestOrder()
    {
        var weatherClient = new Mock<IWeatherClient>();
        var time = DateTimeOffset.Parse("2026-07-15T12:00:00+02:00");
        weatherClient
            .Setup(c => c.GetCurrentAsync(51.11, 17.03, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new CurrentConditions(time, 22.5, 21.0, 10.2, 180, 0.0, 1, true));
        weatherClient
            .Setup(c => c.GetCurrentAsync(52.23, 21.01, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new CurrentConditions(time, 18.0, 17.0, 5.0, 90, 1.2, 61, false));

        var handler = new GetCurrentWeatherBatchQueryHandler(weatherClient.Object);
        var locations = new[] { new CoordinatesDto(51.11, 17.03), new CoordinatesDto(52.23, 21.01) };

        var result = await handler.Handle(new GetCurrentWeatherBatchQuery(locations), CancellationToken.None);

        Assert.Equal(2, result.Count);
        Assert.Equal(51.11, result[0].Latitude);
        Assert.Equal(22.5, result[0].Weather.TemperatureC);
        Assert.Equal(52.23, result[1].Latitude);
        Assert.Equal(18.0, result[1].Weather.TemperatureC);
    }
}
