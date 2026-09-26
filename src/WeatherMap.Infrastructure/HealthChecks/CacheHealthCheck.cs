using System.Globalization;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using WeatherMap.Infrastructure.Caching;

namespace WeatherMap.Infrastructure.HealthChecks;

// Always reports Healthy -- a low hit rate isn't a failure, just a proactive
// signal for how close the API is running to Open-Meteo's daily call limit
// (CLAUDE.md §9), surfaced via HealthCheckResult.Data rather than status.
public sealed class CacheHealthCheck(CacheMetrics metrics) : IHealthCheck
{
    public Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context,
        CancellationToken cancellationToken = default)
    {
        var (hits, misses) = metrics.Snapshot();
        var total = hits + misses;
        // Built by hand rather than "P1" -- .NET's percent format inserts a
        // locale-dependent space before "%" on some platforms even under
        // InvariantCulture, which would make this value awkward to assert on.
        var hitRate = total == 0 ? "n/a" : (hits * 100.0 / total).ToString("F1", CultureInfo.InvariantCulture) + "%";

        var data = new Dictionary<string, object>
        {
            ["hits"] = hits,
            ["misses"] = misses,
            ["hitRate"] = hitRate,
        };

        return Task.FromResult(HealthCheckResult.Healthy("Cache lookup counters since last restart.", data));
    }
}
