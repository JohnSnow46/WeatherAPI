namespace WeatherMap.Application.Common;

public sealed record LocationDto(
    string Name,
    string? Country,
    string? Admin1,
    double Latitude,
    double Longitude,
    string? Timezone);

public sealed record CurrentWeatherDto(
    DateTimeOffset Time,
    double TemperatureC,
    double ApparentTemperatureC,
    double WindSpeedKmh,
    double WindDirectionDeg,
    double PrecipitationMm,
    int WeatherCode,
    bool IsDay);

public sealed record HourlyForecastPointDto(
    DateTimeOffset Time,
    double TemperatureC,
    double PrecipitationMm,
    double WindSpeedKmh,
    int WeatherCode);

public sealed record DailyForecastPointDto(
    DateOnly Date,
    double TempMaxC,
    double TempMinC,
    double PrecipitationSumMm,
    int WeatherCode);

public sealed record ForecastDto(
    IReadOnlyList<HourlyForecastPointDto> Hourly,
    IReadOnlyList<DailyForecastPointDto> Daily);
