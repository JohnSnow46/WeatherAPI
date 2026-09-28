using WeatherMap.Domain.Models;

namespace WeatherMap.Domain.Abstractions;

public interface IAirQualityClient
{
    Task<AirQuality> GetCurrentAsync(double latitude, double longitude, CancellationToken cancellationToken);
}
