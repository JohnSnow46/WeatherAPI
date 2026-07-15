using FluentValidation;
using MediatR;
using WeatherMap.Application.Common;
using WeatherMap.Domain.Abstractions;

namespace WeatherMap.Application.Weather;

public sealed record GetCurrentWeatherQuery(double Latitude, double Longitude) : IRequest<CurrentWeatherDto>;

public sealed class GetCurrentWeatherQueryValidator : AbstractValidator<GetCurrentWeatherQuery>
{
    public GetCurrentWeatherQueryValidator()
    {
        RuleFor(x => x.Latitude).InclusiveBetween(-90, 90);
        RuleFor(x => x.Longitude).InclusiveBetween(-180, 180);
    }
}

public sealed class GetCurrentWeatherQueryHandler(IWeatherClient weatherClient)
    : IRequestHandler<GetCurrentWeatherQuery, CurrentWeatherDto>
{
    public async Task<CurrentWeatherDto> Handle(GetCurrentWeatherQuery request, CancellationToken cancellationToken)
    {
        var current = await weatherClient.GetCurrentAsync(request.Latitude, request.Longitude, cancellationToken);
        return current.ToDto();
    }
}
