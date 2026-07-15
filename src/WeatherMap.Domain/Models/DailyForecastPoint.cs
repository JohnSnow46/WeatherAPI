namespace WeatherMap.Domain.Models;

public sealed record DailyForecastPoint(
    DateOnly Date,
    double TempMaxC,
    double TempMinC,
    double PrecipitationSumMm,
    int WeatherCode);
