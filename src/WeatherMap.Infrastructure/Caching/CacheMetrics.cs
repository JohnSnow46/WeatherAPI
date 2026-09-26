using Microsoft.Extensions.Caching.Memory;

namespace WeatherMap.Infrastructure.Caching;

// Aggregate hit/miss counters across every Cached* decorator (Weather/Geocoding/
// Radar/MapTiles), registered as a singleton so CacheHealthCheck can surface a
// hit rate on /health -- a proactive signal for Open-Meteo's daily call limit
// (CLAUDE.md §9), not a health/failure indicator itself.
public sealed class CacheMetrics
{
    private long _hits;
    private long _misses;

    public void RecordLookup(IMemoryCache cache, object cacheKey)
    {
        if (cache.TryGetValue(cacheKey, out _))
        {
            Interlocked.Increment(ref _hits);
        }
        else
        {
            Interlocked.Increment(ref _misses);
        }
    }

    public (long Hits, long Misses) Snapshot() => (Interlocked.Read(ref _hits), Interlocked.Read(ref _misses));
}
