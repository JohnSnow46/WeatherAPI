using WeatherMap.Domain.Models;

namespace WeatherMap.Domain.Abstractions;

public interface IRadarClient
{
    Task<RadarInfo> GetRadarInfoAsync(CancellationToken cancellationToken);
}
