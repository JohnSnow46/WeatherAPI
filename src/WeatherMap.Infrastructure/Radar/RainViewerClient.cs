using System.Net.Http.Json;
using System.Text.Json.Serialization;
using WeatherMap.Domain.Abstractions;
using WeatherMap.Domain.Models;

namespace WeatherMap.Infrastructure.Radar;

public sealed class RainViewerClient(HttpClient httpClient) : IRadarClient
{
    public async Task<RadarInfo> GetRadarInfoAsync(CancellationToken cancellationToken)
    {
        var response = await httpClient.GetFromJsonAsync<WeatherMapsResponse>(
            "public/weather-maps.json", cancellationToken)
            ?? throw new InvalidOperationException("RainViewer returned an empty response.");

        var past = response.Radar?.Past ?? [];
        var nowcast = response.Radar?.Nowcast ?? [];

        return new RadarInfo(
            response.Host,
            past.Select(f => new RadarFrame(f.Time, f.Path)).ToList(),
            nowcast.Select(f => new RadarFrame(f.Time, f.Path)).ToList());
    }

    private sealed class WeatherMapsResponse
    {
        [JsonPropertyName("host")]
        public string Host { get; set; } = string.Empty;

        [JsonPropertyName("radar")]
        public RadarBlock? Radar { get; set; }
    }

    private sealed class RadarBlock
    {
        [JsonPropertyName("past")]
        public List<FrameEntry>? Past { get; set; }

        [JsonPropertyName("nowcast")]
        public List<FrameEntry>? Nowcast { get; set; }
    }

    private sealed class FrameEntry
    {
        [JsonPropertyName("time")]
        public long Time { get; set; }

        [JsonPropertyName("path")]
        public string Path { get; set; } = string.Empty;
    }
}
