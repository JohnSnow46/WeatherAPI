namespace WeatherMap.Infrastructure.Options;

public sealed class CacheOptions
{
    public const string SectionName = "Cache";

    public int GeocodingTtlMinutes { get; set; } = 60;

    public int CurrentWeatherTtlMinutes { get; set; } = 10;

    public int ForecastTtlMinutes { get; set; } = 15;

    public int RadarInfoTtlMinutes { get; set; } = 5;

    public int MapTileTtlMinutes { get; set; } = 45;
}
