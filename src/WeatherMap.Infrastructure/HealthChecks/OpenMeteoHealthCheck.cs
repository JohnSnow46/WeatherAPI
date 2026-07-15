using Microsoft.Extensions.Diagnostics.HealthChecks;
using WeatherMap.Infrastructure.Weather;

namespace WeatherMap.Infrastructure.HealthChecks;

// Depends on the uncached client directly, so the check reflects live reachability
// rather than a cached response that could mask an outage for up to the cache TTL.
public sealed class OpenMeteoHealthCheck(OpenMeteoForecastClient weatherClient) : IHealthCheck
{
    // Wroclaw, PL — arbitrary fixed point just to confirm Open-Meteo is reachable.
    private const double ProbeLatitude = 51.11;
    private const double ProbeLongitude = 17.03;

    public async Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context,
        CancellationToken cancellationToken = default)
    {
        try
        {
            using var timeoutCts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
            timeoutCts.CancelAfter(TimeSpan.FromSeconds(5));

            await weatherClient.GetCurrentAsync(ProbeLatitude, ProbeLongitude, timeoutCts.Token);
            return HealthCheckResult.Healthy("Open-Meteo is reachable.");
        }
        catch (Exception ex)
        {
            return HealthCheckResult.Unhealthy("Open-Meteo is not reachable.", ex);
        }
    }
}
