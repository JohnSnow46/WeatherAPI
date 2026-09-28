using System.Globalization;
using System.Net.Http.Json;
using System.Text.Json.Serialization;
using WeatherMap.Domain.Abstractions;
using DomainModels = WeatherMap.Domain.Models;

namespace WeatherMap.Infrastructure.AirQuality;

public sealed class OpenMeteoAirQualityClient(HttpClient httpClient) : IAirQualityClient
{
    public async Task<DomainModels.AirQuality> GetCurrentAsync(double latitude, double longitude, CancellationToken cancellationToken)
    {
        var url = "v1/air-quality" +
                  $"?latitude={latitude.ToString(CultureInfo.InvariantCulture)}" +
                  $"&longitude={longitude.ToString(CultureInfo.InvariantCulture)}" +
                  "&current=pm10,pm2_5,european_aqi" +
                  "&timezone=auto";

        var response = await httpClient.GetFromJsonAsync<CurrentResponse>(url, cancellationToken)
            ?? throw new InvalidOperationException("Open-Meteo returned an empty air quality response.");

        var current = response.Current;
        var time = ParseLocalTime(current.Time, response.UtcOffsetSeconds);

        return new DomainModels.AirQuality(time, current.Pm2_5, current.Pm10, current.EuropeanAqi);
    }

    private static DateTimeOffset ParseLocalTime(string time, int utcOffsetSeconds)
    {
        var naive = DateTime.Parse(time, CultureInfo.InvariantCulture, DateTimeStyles.None);
        return new DateTimeOffset(DateTime.SpecifyKind(naive, DateTimeKind.Unspecified), TimeSpan.FromSeconds(utcOffsetSeconds));
    }

    private sealed class CurrentResponse
    {
        [JsonPropertyName("utc_offset_seconds")]
        public int UtcOffsetSeconds { get; set; }

        [JsonPropertyName("current")]
        public CurrentBlock Current { get; set; } = new();
    }

    private sealed class CurrentBlock
    {
        [JsonPropertyName("time")]
        public string Time { get; set; } = string.Empty;

        [JsonPropertyName("pm2_5")]
        public double Pm2_5 { get; set; }

        [JsonPropertyName("pm10")]
        public double Pm10 { get; set; }

        [JsonPropertyName("european_aqi")]
        public int EuropeanAqi { get; set; }
    }
}
