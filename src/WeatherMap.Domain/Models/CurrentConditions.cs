namespace WeatherMap.Domain.Models;

public sealed record CurrentConditions(
    DateTimeOffset Time,
    double TemperatureC,
    double ApparentTemperatureC,
    double WindSpeedKmh,
    double WindDirectionDeg,
    double PrecipitationMm,
    int WeatherCode,
    bool IsDay);
