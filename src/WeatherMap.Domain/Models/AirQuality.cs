namespace WeatherMap.Domain.Models;

public sealed record AirQuality(
    DateTimeOffset Time,
    double Pm2_5,
    double Pm10,
    int EuropeanAqi);
