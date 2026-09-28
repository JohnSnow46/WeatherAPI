using FluentValidation;
using MediatR;
using WeatherMap.Application.Common;
using WeatherMap.Domain.Abstractions;

namespace WeatherMap.Application.Weather;

public sealed record GetAirQualityQuery(double? Latitude, double? Longitude) : IRequest<AirQualityDto>;

public sealed class GetAirQualityQueryValidator : AbstractValidator<GetAirQualityQuery>
{
    public GetAirQualityQueryValidator()
    {
        RuleFor(x => x.Latitude).NotNull().InclusiveBetween(-90, 90);
        RuleFor(x => x.Longitude).NotNull().InclusiveBetween(-180, 180);
    }
}

public sealed class GetAirQualityQueryHandler(IAirQualityClient airQualityClient)
    : IRequestHandler<GetAirQualityQuery, AirQualityDto>
{
    public async Task<AirQualityDto> Handle(GetAirQualityQuery request, CancellationToken cancellationToken)
    {
        var airQuality = await airQualityClient.GetCurrentAsync(request.Latitude!.Value, request.Longitude!.Value, cancellationToken);
        return airQuality.ToDto();
    }
}
