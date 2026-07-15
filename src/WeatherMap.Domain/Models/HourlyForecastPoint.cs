namespace WeatherMap.Domain.Models;

public sealed record HourlyForecastPoint(
    DateTimeOffset Time,
    double TemperatureC,
    double PrecipitationMm,
    double WindSpeedKmh,
    int WeatherCode);
