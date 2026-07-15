using FluentValidation;
using MediatR;
using WeatherMap.Application.Common;
using WeatherMap.Domain.Abstractions;

namespace WeatherMap.Application.Locations;

public sealed record SearchLocationsQuery(string Query, int Count = 5) : IRequest<IReadOnlyList<LocationDto>>;

public sealed class SearchLocationsQueryValidator : AbstractValidator<SearchLocationsQuery>
{
    public SearchLocationsQueryValidator()
    {
        RuleFor(x => x.Query).NotEmpty();
        RuleFor(x => x.Count).InclusiveBetween(1, 20);
    }
}

public sealed class SearchLocationsQueryHandler(IGeocodingClient geocodingClient)
    : IRequestHandler<SearchLocationsQuery, IReadOnlyList<LocationDto>>
{
    public async Task<IReadOnlyList<LocationDto>> Handle(SearchLocationsQuery request, CancellationToken cancellationToken)
    {
        var locations = await geocodingClient.SearchAsync(request.Query, request.Count, cancellationToken);
        return locations.Select(l => l.ToDto()).ToList();
    }
}
