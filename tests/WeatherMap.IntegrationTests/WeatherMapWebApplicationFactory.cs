using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using WeatherMap.Domain.Abstractions;
using WeatherMap.IntegrationTests.Fakes;

namespace WeatherMap.IntegrationTests;

// Replaces the real Open-Meteo clients and health check with fakes so tests
// don't depend on network access or live upstream availability.
public sealed class WeatherMapWebApplicationFactory : WebApplicationFactory<Program>
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.ConfigureServices(services =>
        {
            services.RemoveAll<IGeocodingClient>();
            services.AddSingleton<IGeocodingClient, FakeGeocodingClient>();

            services.RemoveAll<IWeatherClient>();
            services.AddSingleton<IWeatherClient, FakeWeatherClient>();

            services.RemoveAll<IRadarClient>();
            services.AddSingleton<IRadarClient, FakeRadarClient>();

            services.RemoveAll<IWeatherTileClient>();
            services.AddSingleton<IWeatherTileClient, FakeWeatherTileClient>();

            services.Configure<HealthCheckServiceOptions>(options =>
            {
                options.Registrations.Clear();
                options.Registrations.Add(new HealthCheckRegistration(
                    "open-meteo",
                    _ => new FakeHealthCheck(HealthStatus.Healthy),
                    failureStatus: null,
                    tags: ["external"]));
                options.Registrations.Add(new HealthCheckRegistration(
                    "rainviewer",
                    _ => new FakeHealthCheck(HealthStatus.Healthy),
                    failureStatus: null,
                    tags: ["external"]));
            });
        });
    }
}
