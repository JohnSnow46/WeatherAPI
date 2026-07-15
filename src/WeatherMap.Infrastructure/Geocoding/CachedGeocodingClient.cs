using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;
using WeatherMap.Domain.Abstractions;
using WeatherMap.Domain.Models;
using WeatherMap.Infrastructure.Options;

namespace WeatherMap.Infrastructure.Geocoding;

public sealed class CachedGeocodingClient(
    OpenMeteoGeocodingClient inner,
    IMemoryCache cache,
    IOptions<CacheOptions> cacheOptions) : IGeocodingClient
{
    public Task<IReadOnlyList<Location>> SearchAsync(string query, int count, CancellationToken cancellationToken)
    {
        var cacheKey = $"geocoding:{query.Trim().ToLowerInvariant()}:{count}";

        return cache.GetOrCreateAsync(cacheKey, entry =>
        {
            entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(cacheOptions.Value.GeocodingTtlMinutes);
            return inner.SearchAsync(query, count, cancellationToken);
        })!;
    }
}
