using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;
using WeatherMap.Domain.Abstractions;
using WeatherMap.Domain.Models;
using WeatherMap.Infrastructure.Caching;
using WeatherMap.Infrastructure.Options;

namespace WeatherMap.Infrastructure.Radar;

public sealed class CachedRadarClient(
    RainViewerClient inner,
    IMemoryCache cache,
    IOptions<CacheOptions> cacheOptions,
    CacheMetrics metrics) : IRadarClient
{
    private const string CacheKey = "radar:info";

    public Task<RadarInfo> GetRadarInfoAsync(CancellationToken cancellationToken)
    {
        metrics.RecordLookup(cache, CacheKey);

        return cache.GetOrCreateAsync(CacheKey, entry =>
        {
            entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(cacheOptions.Value.RadarInfoTtlMinutes);
            return inner.GetRadarInfoAsync(cancellationToken);
        })!;
    }
}
