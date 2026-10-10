using FluentValidation;
using MediatR;
using WeatherMap.Application.Common;
using WeatherMap.Domain.Abstractions;

namespace WeatherMap.Application.Weather;

public sealed record GetCurrentWeatherBatchQuery(IReadOnlyList<CoordinatesDto>? Locations)
    : IRequest<IReadOnlyList<BatchCurrentWeatherItemDto>>;

public sealed class GetCurrentWeatherBatchQueryValidator : AbstractValidator<GetCurrentWeatherBatchQuery>
{
    public const int MaxLocations = 10;

    public GetCurrentWeatherBatchQueryValidator()
    {
        RuleFor(x => x.Locations).NotNull().NotEmpty();

        RuleFor(x => x.Locations!.Count)
            .LessThanOrEqualTo(MaxLocations)
            .WithMessage($"A batch request supports at most {MaxLocations} locations.")
            .When(x => x.Locations is { Count: > 0 });

        RuleForEach(x => x.Locations)
            .ChildRules(location =>
            {
                location.RuleFor(l => l.Latitude).InclusiveBetween(-90, 90);
                location.RuleFor(l => l.Longitude).InclusiveBetween(-180, 180);
            })
            .When(x => x.Locations is { Count: > 0 });
    }
}

public sealed class GetCurrentWeatherBatchQueryHandler(IWeatherClient weatherClient)
    : IRequestHandler<GetCurrentWeatherBatchQuery, IReadOnlyList<BatchCurrentWeatherItemDto>>
{
    public async Task<IReadOnlyList<BatchCurrentWeatherItemDto>> Handle(
        GetCurrentWeatherBatchQuery request, CancellationToken cancellationToken)
    {
        var tasks = request.Locations!.Select(async location =>
        {
            var current = await weatherClient.GetCurrentAsync(location.Latitude, location.Longitude, cancellationToken);
            return new BatchCurrentWeatherItemDto(location.Latitude, location.Longitude, current.ToDto());
        });

        return await Task.WhenAll(tasks);
    }
}
