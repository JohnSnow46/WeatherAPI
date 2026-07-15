using System.Globalization;
using System.Net.Http.Json;
using System.Text.Json.Serialization;
using WeatherMap.Domain.Abstractions;
using WeatherMap.Domain.Models;

namespace WeatherMap.Infrastructure.Weather;

public sealed class OpenMeteoForecastClient(HttpClient httpClient) : IWeatherClient
{
    public async Task<CurrentConditions> GetCurrentAsync(double latitude, double longitude, CancellationToken cancellationToken)
    {
        var url = "v1/forecast" +
                  $"?latitude={latitude.ToString(CultureInfo.InvariantCulture)}" +
                  $"&longitude={longitude.ToString(CultureInfo.InvariantCulture)}" +
                  "&current=temperature_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,wind_direction_10m,is_day" +
                  "&timezone=auto";

        var response = await httpClient.GetFromJsonAsync<CurrentResponse>(url, cancellationToken)
            ?? throw new InvalidOperationException("Open-Meteo returned an empty current weather response.");

        var current = response.Current;
        var time = ParseLocalTime(current.Time, response.UtcOffsetSeconds);

        return new CurrentConditions(
            time,
            current.Temperature2m,
            current.ApparentTemperature,
            current.WindSpeed10m,
            current.WindDirection10m,
            current.Precipitation,
            current.WeatherCode,
            current.IsDay == 1);
    }

    public async Task<Forecast> GetForecastAsync(double latitude, double longitude, int days, CancellationToken cancellationToken)
    {
        var url = "v1/forecast" +
                  $"?latitude={latitude.ToString(CultureInfo.InvariantCulture)}" +
                  $"&longitude={longitude.ToString(CultureInfo.InvariantCulture)}" +
                  "&hourly=temperature_2m,precipitation,weather_code,wind_speed_10m" +
                  "&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weather_code" +
                  $"&forecast_days={days}" +
                  "&timezone=auto";

        var response = await httpClient.GetFromJsonAsync<ForecastResponse>(url, cancellationToken)
            ?? throw new InvalidOperationException("Open-Meteo returned an empty forecast response.");

        var hourly = response.Hourly;
        var hourlyPoints = hourly.Time
            .Select((time, i) => new HourlyForecastPoint(
                ParseLocalTime(time, response.UtcOffsetSeconds),
                hourly.Temperature2m[i],
                hourly.Precipitation[i],
                hourly.WindSpeed10m[i],
                hourly.WeatherCode[i]))
            .ToList();

        var daily = response.Daily;
        var dailyPoints = daily.Time
            .Select((date, i) => new DailyForecastPoint(
                DateOnly.Parse(date, CultureInfo.InvariantCulture),
                daily.Temperature2mMax[i],
                daily.Temperature2mMin[i],
                daily.PrecipitationSum[i],
                daily.WeatherCode[i]))
            .ToList();

        return new Forecast(hourlyPoints, dailyPoints);
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

        [JsonPropertyName("temperature_2m")]
        public double Temperature2m { get; set; }

        [JsonPropertyName("apparent_temperature")]
        public double ApparentTemperature { get; set; }

        [JsonPropertyName("precipitation")]
        public double Precipitation { get; set; }

        [JsonPropertyName("weather_code")]
        public int WeatherCode { get; set; }

        [JsonPropertyName("wind_speed_10m")]
        public double WindSpeed10m { get; set; }

        [JsonPropertyName("wind_direction_10m")]
        public double WindDirection10m { get; set; }

        [JsonPropertyName("is_day")]
        public int IsDay { get; set; }
    }

    private sealed class ForecastResponse
    {
        [JsonPropertyName("utc_offset_seconds")]
        public int UtcOffsetSeconds { get; set; }

        [JsonPropertyName("hourly")]
        public HourlyBlock Hourly { get; set; } = new();

        [JsonPropertyName("daily")]
        public DailyBlock Daily { get; set; } = new();
    }

    private sealed class HourlyBlock
    {
        [JsonPropertyName("time")]
        public List<string> Time { get; set; } = [];

        [JsonPropertyName("temperature_2m")]
        public List<double> Temperature2m { get; set; } = [];

        [JsonPropertyName("precipitation")]
        public List<double> Precipitation { get; set; } = [];

        [JsonPropertyName("weather_code")]
        public List<int> WeatherCode { get; set; } = [];

        [JsonPropertyName("wind_speed_10m")]
        public List<double> WindSpeed10m { get; set; } = [];
    }

    private sealed class DailyBlock
    {
        [JsonPropertyName("time")]
        public List<string> Time { get; set; } = [];

        [JsonPropertyName("temperature_2m_max")]
        public List<double> Temperature2mMax { get; set; } = [];

        [JsonPropertyName("temperature_2m_min")]
        public List<double> Temperature2mMin { get; set; } = [];

        [JsonPropertyName("precipitation_sum")]
        public List<double> PrecipitationSum { get; set; } = [];

        [JsonPropertyName("weather_code")]
        public List<int> WeatherCode { get; set; } = [];
    }
}
