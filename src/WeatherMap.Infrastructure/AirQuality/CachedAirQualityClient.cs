using System.Globalization;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;
using WeatherMap.Domain.Abstractions;
using WeatherMap.Infrastructure.Caching;
using WeatherMap.Infrastructure.Options;
using DomainModels = WeatherMap.Domain.Models;

namespace WeatherMap.Infrastructure.AirQuality;

public sealed class CachedAirQualityClient(
    OpenMeteoAirQualityClient inner,
    IMemoryCache cache,
    IOptions<CacheOptions> cacheOptions,
    CacheMetrics metrics) : IAirQualityClient
{
    public Task<DomainModels.AirQuality> GetCurrentAsync(double latitude, double longitude, CancellationToken cancellationToken)
    {
        var cacheKey = $"air-quality:{Round(latitude)}:{Round(longitude)}";
        metrics.RecordLookup(cache, cacheKey);

        return cache.GetOrCreateAsync(cacheKey, entry =>
        {
            entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(cacheOptions.Value.AirQualityTtlMinutes);
            return inner.GetCurrentAsync(latitude, longitude, cancellationToken);
        })!;
    }

    private static string Round(double value) => value.ToString("F2", CultureInfo.InvariantCulture);
}
