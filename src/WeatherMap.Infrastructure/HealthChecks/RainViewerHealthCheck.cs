using Microsoft.Extensions.Diagnostics.HealthChecks;
using WeatherMap.Infrastructure.Radar;

namespace WeatherMap.Infrastructure.HealthChecks;

// Depends on the uncached client directly, so the check reflects live reachability
// rather than a cached response that could mask an outage for up to the cache TTL.
public sealed class RainViewerHealthCheck(RainViewerClient radarClient) : IHealthCheck
{
    public async Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context,
        CancellationToken cancellationToken = default)
    {
        try
        {
            using var timeoutCts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
            timeoutCts.CancelAfter(TimeSpan.FromSeconds(5));

            await radarClient.GetRadarInfoAsync(timeoutCts.Token);
            return HealthCheckResult.Healthy("RainViewer is reachable.");
        }
        catch (Exception ex)
        {
            return HealthCheckResult.Unhealthy("RainViewer is not reachable.", ex);
        }
    }
}
