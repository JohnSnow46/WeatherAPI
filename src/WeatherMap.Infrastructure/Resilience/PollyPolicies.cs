using Polly;
using Polly.Extensions.Http;
using Polly.Timeout;

namespace WeatherMap.Infrastructure.Resilience;

public static class PollyPolicies
{
    public static IAsyncPolicy<HttpResponseMessage> GetRetryPolicy() =>
        HttpPolicyExtensions
            .HandleTransientHttpError()
            .Or<TimeoutRejectedException>()
            .WaitAndRetryAsync(3, retryAttempt => TimeSpan.FromSeconds(Math.Pow(2, retryAttempt)));

    public static IAsyncPolicy<HttpResponseMessage> GetCircuitBreakerPolicy() =>
        HttpPolicyExtensions
            .HandleTransientHttpError()
            .Or<TimeoutRejectedException>()
            .CircuitBreakerAsync(handledEventsAllowedBeforeBreaking: 5, durationOfBreak: TimeSpan.FromSeconds(30));

    // Without this, a hung upstream call (Open-Meteo/RainViewer/OpenWeatherMap) relies on
    // HttpClient's 100s default timeout before a single attempt even fails — multiplied by
    // the 3 retry attempts above, a stalled dependency could block a request for minutes.
    // Bounding each individual attempt lets the retry/circuit-breaker policies above react
    // promptly instead.
    public static IAsyncPolicy<HttpResponseMessage> GetTimeoutPolicy() =>
        Policy.TimeoutAsync<HttpResponseMessage>(TimeSpan.FromSeconds(10), TimeoutStrategy.Optimistic);
}
