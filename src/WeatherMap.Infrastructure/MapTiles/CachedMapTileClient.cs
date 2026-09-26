using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;
using WeatherMap.Domain.Abstractions;
using WeatherMap.Domain.Models;
using WeatherMap.Infrastructure.Caching;
using WeatherMap.Infrastructure.Options;

namespace WeatherMap.Infrastructure.MapTiles;

public sealed class CachedMapTileClient(
    OpenWeatherMapTileClient inner,
    IMemoryCache cache,
    IOptions<CacheOptions> cacheOptions,
    CacheMetrics metrics) : IWeatherTileClient
{
    public Task<MapTile> GetTileAsync(string layer, int z, int x, int y, CancellationToken cancellationToken)
    {
        var cacheKey = $"map-tile:{layer}:{z}:{x}:{y}";
        metrics.RecordLookup(cache, cacheKey);

        return cache.GetOrCreateAsync(cacheKey, entry =>
        {
            entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(cacheOptions.Value.MapTileTtlMinutes);
            return inner.GetTileAsync(layer, z, x, y, cancellationToken);
        })!;
    }
}
