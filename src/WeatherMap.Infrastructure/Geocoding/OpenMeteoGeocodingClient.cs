using System.Net.Http.Json;
using System.Text.Json.Serialization;
using WeatherMap.Domain.Abstractions;
using WeatherMap.Domain.Models;

namespace WeatherMap.Infrastructure.Geocoding;

public sealed class OpenMeteoGeocodingClient(HttpClient httpClient) : IGeocodingClient
{
    public async Task<IReadOnlyList<Location>> SearchAsync(string query, int count, CancellationToken cancellationToken)
    {
        var url = $"v1/search?name={Uri.EscapeDataString(query)}&count={count}&language=en&format=json";
        var response = await httpClient.GetFromJsonAsync<GeocodingResponse>(url, cancellationToken);

        if (response?.Results is null)
        {
            return [];
        }

        return response.Results
            .Select(r => new Location(r.Name, r.Country, r.Admin1, r.Latitude, r.Longitude, r.Timezone))
            .ToList();
    }

    private sealed class GeocodingResponse
    {
        [JsonPropertyName("results")]
        public List<GeocodingResult>? Results { get; set; }
    }

    private sealed class GeocodingResult
    {
        [JsonPropertyName("name")]
        public string Name { get; set; } = string.Empty;

        [JsonPropertyName("latitude")]
        public double Latitude { get; set; }

        [JsonPropertyName("longitude")]
        public double Longitude { get; set; }

        [JsonPropertyName("country")]
        public string? Country { get; set; }

        [JsonPropertyName("admin1")]
        public string? Admin1 { get; set; }

        [JsonPropertyName("timezone")]
        public string? Timezone { get; set; }
    }
}
