using FluentValidation;
using MediatR;
using WeatherMap.Application.Common;
using WeatherMap.Domain.Abstractions;

namespace WeatherMap.Application.Weather;

public sealed record GetMapTileQuery(string Layer, int Z, int X, int Y) : IRequest<MapTileDto>;

public sealed class GetMapTileQueryValidator : AbstractValidator<GetMapTileQuery>
{
    // OpenWeatherMap's Weather Maps 1.0 free-tier layers.
    public static readonly IReadOnlyCollection<string> AllowedLayers =
        ["wind_new", "clouds_new", "precipitation_new", "pressure_new", "temp_new"];

    public GetMapTileQueryValidator()
    {
        RuleFor(x => x.Layer).Must(AllowedLayers.Contains)
            .WithMessage($"'Layer' must be one of: {string.Join(", ", AllowedLayers)}.");
        RuleFor(x => x.Z).InclusiveBetween(0, 19);
        RuleFor(x => x.X).GreaterThanOrEqualTo(0);
        RuleFor(x => x.Y).GreaterThanOrEqualTo(0);
    }
}

public sealed class GetMapTileQueryHandler(IWeatherTileClient weatherTileClient)
    : IRequestHandler<GetMapTileQuery, MapTileDto>
{
    public async Task<MapTileDto> Handle(GetMapTileQuery request, CancellationToken cancellationToken)
    {
        var tile = await weatherTileClient.GetTileAsync(request.Layer, request.Z, request.X, request.Y, cancellationToken);
        return tile.ToDto();
    }
}
