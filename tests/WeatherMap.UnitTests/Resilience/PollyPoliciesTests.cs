using Polly;
using Polly.CircuitBreaker;
using Polly.Timeout;
using WeatherMap.Infrastructure.Resilience;

namespace WeatherMap.UnitTests.Resilience;

public class PollyPoliciesTests
{
    [Fact]
    public async Task CircuitBreakerPolicy_TreatsTimeoutAsATransientFailure()
    {
        // A per-attempt timeout (Polly.Timeout.TimeoutRejectedException) is a distinct
        // exception type from the transport-level failures HandleTransientHttpError()
        // covers on its own, so it must be opted in explicitly — otherwise a
        // consistently slow (but technically reachable) upstream would never trip the
        // breaker and every request would keep paying the full timeout.
        var circuitBreaker = PollyPolicies.GetCircuitBreakerPolicy();

        for (var i = 0; i < 5; i++)
        {
            await Assert.ThrowsAsync<TimeoutRejectedException>(
                () => circuitBreaker.ExecuteAsync(() => Task.FromException<HttpResponseMessage>(new TimeoutRejectedException())));
        }

        await Assert.ThrowsAsync<BrokenCircuitException>(
            () => circuitBreaker.ExecuteAsync(() => Task.FromResult(new HttpResponseMessage())));
    }
}
