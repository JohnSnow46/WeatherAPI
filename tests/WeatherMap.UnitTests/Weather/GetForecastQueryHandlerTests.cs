using Moq;
using WeatherMap.Application.Weather;
using WeatherMap.Domain.Abstractions;
using WeatherMap.Domain.Models;

namespace WeatherMap.UnitTests.Weather;

public class GetForecastQueryHandlerTests
{
    [Fact]
    public async Task Handle_MapsForecastToDto()
    {
        var weatherClient = new Mock<IWeatherClient>();
        var forecast = new Forecast(
            Hourly: [new HourlyForecastPoint(DateTimeOffset.Parse("2026-07-15T00:00:00+02:00"), 18.2, 0.0, 5.2, 1)],
            Daily: [new DailyForecastPoint(DateOnly.Parse("2026-07-15"), 25.1, 14.3, 0.0, 1)]);

        weatherClient
            .Setup(c => c.GetForecastAsync(51.11, 17.03, 3, It.IsAny<CancellationToken>()))
            .ReturnsAsync(forecast);

        var handler = new GetForecastQueryHandler(weatherClient.Object);

        var result = await handler.Handle(new GetForecastQuery(51.11, 17.03, 3), CancellationToken.None);

        var hourly = Assert.Single(result.Hourly);
        Assert.Equal(18.2, hourly.TemperatureC);

        var daily = Assert.Single(result.Daily);
        Assert.Equal(25.1, daily.TempMaxC);
        Assert.Equal(14.3, daily.TempMinC);
    }
}
