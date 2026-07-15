namespace WeatherMap.Infrastructure.Options;

public sealed class OpenMeteoOptions
{
    public const string SectionName = "OpenMeteo";

    public string GeocodingBaseUrl { get; set; } = "https://geocoding-api.open-meteo.com/";

    public string ForecastBaseUrl { get; set; } = "https://api.open-meteo.com/";
}
