using System.Globalization;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;
using WeatherMap.Domain.Abstractions;
using WeatherMap.Domain.Models;
using WeatherMap.Infrastructure.Options;

namespace WeatherMap.Infrastructure.Weather;

public sealed class CachedWeatherClient(
    OpenMeteoForecastClient inner,
    IMemoryCache cache,
    IOptions<CacheOptions> cacheOptions) : IWeatherClient
{
    public Task<CurrentConditions> GetCurrentAsync(double latitude, double longitude, CancellationToken cancellationToken)
    {
        var cacheKey = $"current:{Round(latitude)}:{Round(longitude)}";

        return cache.GetOrCreateAsync(cacheKey, entry =>
        {
            entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(cacheOptions.Value.CurrentWeatherTtlMinutes);
            return inner.GetCurrentAsync(latitude, longitude, cancellationToken);
        })!;
    }

    public Task<Forecast> GetForecastAsync(double latitude, double longitude, int days, CancellationToken cancellationToken)
    {
        var cacheKey = $"forecast:{Round(latitude)}:{Round(longitude)}:{days}";

        return cache.GetOrCreateAsync(cacheKey, entry =>
        {
            entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(cacheOptions.Value.ForecastTtlMinutes);
            return inner.GetForecastAsync(latitude, longitude, days, cancellationToken);
        })!;
    }

    private static string Round(double value) => value.ToString("F2", CultureInfo.InvariantCulture);
}
