namespace WeatherMap.Domain.Models;

public sealed record Forecast(
    IReadOnlyList<HourlyForecastPoint> Hourly,
    IReadOnlyList<DailyForecastPoint> Daily);
