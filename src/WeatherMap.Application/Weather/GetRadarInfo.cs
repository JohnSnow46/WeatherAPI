using MediatR;
using WeatherMap.Application.Common;
using WeatherMap.Domain.Abstractions;

namespace WeatherMap.Application.Weather;

public sealed record GetRadarInfoQuery : IRequest<RadarInfoDto>;

public sealed class GetRadarInfoQueryHandler(IRadarClient radarClient)
    : IRequestHandler<GetRadarInfoQuery, RadarInfoDto>
{
    public async Task<RadarInfoDto> Handle(GetRadarInfoQuery request, CancellationToken cancellationToken)
    {
        var info = await radarClient.GetRadarInfoAsync(cancellationToken);
        return info.ToDto();
    }
}
