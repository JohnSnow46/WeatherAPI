using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using WeatherMap.Domain.Abstractions;
using WeatherMap.Infrastructure.Geocoding;
using WeatherMap.Infrastructure.HealthChecks;
using WeatherMap.Infrastructure.MapTiles;
using WeatherMap.Infrastructure.Options;
using WeatherMap.Infrastructure.Radar;
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
        services.Configure<OpenWeatherMapOptions>(configuration.GetSection(OpenWeatherMapOptions.SectionName));

        var openMeteoOptions = configuration.GetSection(OpenMeteoOptions.SectionName).Get<OpenMeteoOptions>()
            ?? new OpenMeteoOptions();
        var openWeatherMapOptions = configuration.GetSection(OpenWeatherMapOptions.SectionName).Get<OpenWeatherMapOptions>()
            ?? new OpenWeatherMapOptions();

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

        services.AddHttpClient<RainViewerClient>(client =>
            {
                client.BaseAddress = new Uri("https://api.rainviewer.com/");
            })
            .AddPolicyHandler(PollyPolicies.GetRetryPolicy())
            .AddPolicyHandler(PollyPolicies.GetCircuitBreakerPolicy());

        services.AddHttpClient<OpenWeatherMapTileClient>(client =>
            {
                client.BaseAddress = new Uri(openWeatherMapOptions.BaseUrl);
            })
            .AddPolicyHandler(PollyPolicies.GetRetryPolicy())
            .AddPolicyHandler(PollyPolicies.GetCircuitBreakerPolicy());

        services.AddScoped<IGeocodingClient, CachedGeocodingClient>();
        services.AddScoped<IWeatherClient, CachedWeatherClient>();
        services.AddScoped<IRadarClient, CachedRadarClient>();
        services.AddScoped<IWeatherTileClient, CachedMapTileClient>();

        services.AddHealthChecks()
            .AddCheck<OpenMeteoHealthCheck>("open-meteo", tags: ["external"])
            .AddCheck<RainViewerHealthCheck>("rainviewer", tags: ["external"]);

        return services;
    }
}
