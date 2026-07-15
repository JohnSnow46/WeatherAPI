using FluentValidation;
using MediatR;
using WeatherMap.Application.Common;
using WeatherMap.Domain.Abstractions;

namespace WeatherMap.Application.Weather;

public sealed record GetForecastQuery(double Latitude, double Longitude, int Days = 7) : IRequest<ForecastDto>;

public sealed class GetForecastQueryValidator : AbstractValidator<GetForecastQuery>
{
    public GetForecastQueryValidator()
    {
        RuleFor(x => x.Latitude).InclusiveBetween(-90, 90);
        RuleFor(x => x.Longitude).InclusiveBetween(-180, 180);
        RuleFor(x => x.Days).InclusiveBetween(1, 16);
    }
}

public sealed class GetForecastQueryHandler(IWeatherClient weatherClient)
    : IRequestHandler<GetForecastQuery, ForecastDto>
{
    public async Task<ForecastDto> Handle(GetForecastQuery request, CancellationToken cancellationToken)
    {
        var forecast = await weatherClient.GetForecastAsync(request.Latitude, request.Longitude, request.Days, cancellationToken);
        return forecast.ToDto();
    }
}
