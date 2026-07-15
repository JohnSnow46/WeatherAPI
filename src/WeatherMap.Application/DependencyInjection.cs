using FluentValidation;
using MediatR;
using Microsoft.Extensions.DependencyInjection;
using WeatherMap.Application.Common;

namespace WeatherMap.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        // Keep validation messages in English regardless of the host machine/deployment locale.
        ValidatorOptions.Global.LanguageManager.Enabled = false;

        var assembly = typeof(DependencyInjection).Assembly;

        services.AddMediatR(cfg => cfg.RegisterServicesFromAssembly(assembly));
        services.AddValidatorsFromAssembly(assembly);
        services.AddTransient(typeof(IPipelineBehavior<,>), typeof(ValidationBehavior<,>));

        return services;
    }
}
