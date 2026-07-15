using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using WeatherMap.Domain.Abstractions;
using WeatherMap.Infrastructure.Geocoding;
using WeatherMap.Infrastructure.HealthChecks;
using WeatherMap.Infrastructure.Options;
using WeatherMap.Infrastructure.Resilience;
using WeatherMap.Infrastructure.Weather;

namespace WeatherMap.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddMemoryCache();

        services.Configure<OpenMeteoOptions>(configuration.GetSection(OpenMeteoOptions.SectionName));
        services.Configure<CacheOptions>(configuration.GetSection(CacheOptions.SectionName));

        var openMeteoOptions = configuration.GetSection(OpenMeteoOptions.SectionName).Get<OpenMeteoOptions>()
            ?? new OpenMeteoOptions();

        services.AddHttpClient<OpenMeteoGeocodingClient>(client =>
            {
                client.BaseAddress = new Uri(openMeteoOptions.GeocodingBaseUrl);
            })
            .AddPolicyHandler(PollyPolicies.GetRetryPolicy())
            .AddPolicyHandler(PollyPolicies.GetCircuitBreakerPolicy());

        services.AddHttpClient<OpenMeteoForecastClient>(client =>
            {
                client.BaseAddress = new Uri(openMeteoOptions.ForecastBaseUrl);
            })
            .AddPolicyHandler(PollyPolicies.GetRetryPolicy())
            .AddPolicyHandler(PollyPolicies.GetCircuitBreakerPolicy());

        services.AddScoped<IGeocodingClient, CachedGeocodingClient>();
        services.AddScoped<IWeatherClient, CachedWeatherClient>();

        services.AddHealthChecks()
            .AddCheck<OpenMeteoHealthCheck>("open-meteo", tags: ["external"]);

        return services;
    }
}
