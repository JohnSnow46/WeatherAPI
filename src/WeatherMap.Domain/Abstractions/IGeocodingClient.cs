using WeatherMap.Domain.Models;

namespace WeatherMap.Domain.Abstractions;

public interface IGeocodingClient
{
    Task<IReadOnlyList<Location>> SearchAsync(string query, int count, CancellationToken cancellationToken);
}
