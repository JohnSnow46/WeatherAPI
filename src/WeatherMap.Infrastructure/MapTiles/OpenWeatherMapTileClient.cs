using Microsoft.Extensions.Options;
using WeatherMap.Domain.Abstractions;
using WeatherMap.Domain.Models;
using WeatherMap.Infrastructure.Options;

namespace WeatherMap.Infrastructure.MapTiles;

public sealed class OpenWeatherMapTileClient(HttpClient httpClient, IOptions<OpenWeatherMapOptions> options) : IWeatherTileClient
{
    public async Task<MapTile> GetTileAsync(string layer, int z, int x, int y, CancellationToken cancellationToken)
    {
        var apiKey = options.Value.ApiKey;
        var url = $"{layer}/{z}/{x}/{y}.png?appid={Uri.EscapeDataString(apiKey)}";

        var bytes = await httpClient.GetByteArrayAsync(url, cancellationToken);
        return new MapTile(bytes, "image/png");
    }
}
