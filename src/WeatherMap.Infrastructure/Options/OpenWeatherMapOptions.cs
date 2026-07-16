namespace WeatherMap.Infrastructure.Options;

public sealed class OpenWeatherMapOptions
{
    public const string SectionName = "OpenWeatherMap";

    public string BaseUrl { get; set; } = "https://tile.openweathermap.org/map/";

    // Set via user-secrets (dotnet user-secrets set "OpenWeatherMap:ApiKey" "...")
    // or an environment variable in deployment — never committed.
    public string ApiKey { get; set; } = string.Empty;
}
